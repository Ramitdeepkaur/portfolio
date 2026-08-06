package com.portfolio.manager.market;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.portfolio.manager.dto.MarketSearchResultDTO;
import yahoofinance.Stock;
import yahoofinance.YahooFinance;
import yahoofinance.histquotes.HistoricalQuote;
import yahoofinance.histquotes.Interval;
import yahoofinance.quotes.stock.StockQuote;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Live market data client.
 * <p>
 * Order: Yahoo chart (curl) → YahooFinanceAPI library → course cached-price API.
 * Yahoo often rate-limits Java HTTP/TLS; curl is the reliable path on local macOS.
 */
@Component
public class YahooFinanceClient {

    private static final Logger log = LoggerFactory.getLogger(YahooFinanceClient.class);
    public static final String CASH_TICKER = "CASH";
    private static final String USER_AGENT =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private static final String CHART_URL = "https://query2.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=%s";
    private static final int SEARCH_QUOTES_COUNT = 25;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final String cachedPriceApiUrl;
    private final boolean curlFallbackEnabled;
    private final boolean yfinanceFallbackEnabled;
    private final String yfinanceScript;
    private final Object rateLock = new Object();
    private long lastRequestAtMs;
    private volatile String resolvedPythonCommand;
    private volatile String resolvedCurlCommand;

    public YahooFinanceClient(
            @Value("${portfolio.market-data.cached-price-url:https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData}")
            String cachedPriceApiUrl,
            @Value("${portfolio.market-data.curl-fallback:true}") boolean curlFallbackEnabled,
            @Value("${portfolio.market-data.yfinance-fallback:true}") boolean yfinanceFallbackEnabled,
            @Value("${portfolio.market-data.yfinance-script:scripts/fetch_yahoo_quote.py}") String yfinanceScript) {
        this.cachedPriceApiUrl = cachedPriceApiUrl;
        this.curlFallbackEnabled = curlFallbackEnabled;
        this.yfinanceFallbackEnabled = yfinanceFallbackEnabled;
        this.yfinanceScript = yfinanceScript;
    }

    /** Default constructor for tests / manual construction. */
    public YahooFinanceClient() {
        this(
                "https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData",
                true,
                true,
                "scripts/fetch_yahoo_quote.py"
        );
    }

    public Optional<YahooQuote> fetchQuote(String tickerSymbol) {
        String ticker = normalize(tickerSymbol);
        if (ticker.isEmpty()) {
            return Optional.empty();
        }
        if (CASH_TICKER.equals(ticker)) {
            return Optional.of(cashQuote());
        }

        // yfinance (Python) is the most reliable Yahoo path when Java/curl are rate-limited.
        Optional<YahooQuote> yfinanceQuote = fetchQuoteViaYfinance(ticker);
        if (yfinanceQuote.isPresent()) {
            return yfinanceQuote;
        }

        Optional<YahooQuote> chartQuote = fetchQuoteViaChart(ticker);
        if (chartQuote.isPresent()) {
            return chartQuote;
        }

        if (!curlFallbackEnabled) {
            Optional<YahooQuote> libraryQuote = fetchQuoteViaLibrary(ticker);
            if (libraryQuote.isPresent()) {
                return libraryQuote;
            }
        }

        Optional<YahooQuote> cached = fetchQuoteViaCachedApi(ticker);
        if (cached.isPresent()) {
            return cached;
        }

        return fetchQuoteViaStooq(ticker);
    }

    public Map<String, YahooQuote> fetchQuotes(List<String> tickers) {
        if (tickers == null || tickers.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, YahooQuote> results = new HashMap<>();
        List<String> yahooTickers = tickers.stream()
                .map(this::normalize)
                .filter(t -> !t.isEmpty())
                .distinct()
                .toList();

        for (String ticker : yahooTickers) {
            fetchQuote(ticker).ifPresent(q -> results.put(ticker, q));
        }
        return results;
    }

    public List<HistoricalQuote> fetchHistory(String tickerSymbol, Calendar from, Calendar to) {
        String ticker = normalize(tickerSymbol);
        if (ticker.isEmpty() || CASH_TICKER.equals(ticker)) {
            return Collections.emptyList();
        }

        List<HistoricalQuote> yfinanceHistory = fetchHistoryViaYfinance(ticker, from, to);
        if (!yfinanceHistory.isEmpty()) {
            return yfinanceHistory;
        }

        List<HistoricalQuote> chartHistory = fetchHistoryViaChart(ticker, from, to);
        if (!chartHistory.isEmpty()) {
            return chartHistory;
        }

        List<HistoricalQuote> libraryHistory = fetchHistoryViaLibrary(ticker, from, to);
        if (!libraryHistory.isEmpty()) {
            return libraryHistory;
        }

        return fetchHistoryViaCachedApi(ticker);
    }

    private Optional<YahooQuote> fetchQuoteViaLibrary(String ticker) {
        try {
            throttle();
            Stock stock = YahooFinance.get(ticker);
            return toQuote(ticker, stock);
        } catch (IOException ex) {
            log.debug("Yahoo library quote failed for {}: {}", ticker, ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<YahooQuote> fetchQuoteViaChart(String ticker) {
        try {
            JsonNode result = fetchChartJson(ticker, "5d");
            if (result == null) {
                return Optional.empty();
            }
            JsonNode meta = result.path("meta");
            BigDecimal price = decimal(meta, "regularMarketPrice");
            if (price == null) {
                return Optional.empty();
            }

            BigDecimal open = firstNonNull(decimal(meta, "regularMarketOpen"), decimal(meta, "chartPreviousClose"), price);
            BigDecimal close = firstNonNull(decimal(meta, "previousClose"), decimal(meta, "chartPreviousClose"), price);
            BigDecimal high = firstNonNull(decimal(meta, "regularMarketDayHigh"), price);
            BigDecimal low = firstNonNull(decimal(meta, "regularMarketDayLow"), price);
            Long volume = meta.path("regularMarketVolume").isNumber()
                    ? meta.path("regularMarketVolume").asLong()
                    : 0L;

            return Optional.of(new YahooQuote(
                    ticker, scale(price), scale(open), scale(close), scale(high), scale(low), volume
            ));
        } catch (Exception ex) {
            log.warn("Yahoo chart quote failed for {}: {}", ticker, ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<YahooQuote> fetchQuoteViaCachedApi(String ticker) {
        try {
            throttle();
            String url = cachedPriceApiUrl + "?ticker=" + URLEncoder.encode(ticker, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Cached price API HTTP {} for {}", response.statusCode(), ticker);
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode priceData = root.path("price_data");
            if (!priceData.isObject()) {
                return Optional.empty();
            }

            BigDecimal close = lastNumber(priceData.path("close"));
            if (close == null) {
                return Optional.empty();
            }
            BigDecimal open = firstNonNull(lastNumber(priceData.path("open")), close);
            BigDecimal high = firstNonNull(lastNumber(priceData.path("high")), close);
            BigDecimal low = firstNonNull(lastNumber(priceData.path("low")), close);
            Long volume = lastLong(priceData.path("volume"));

            log.info("Using course cached-price API for {}", ticker);
            return Optional.of(new YahooQuote(
                    ticker, scale(close), scale(open), scale(close), scale(high), scale(low), volume
            ));
        } catch (Exception ex) {
            log.warn("Cached price API failed for {}: {}", ticker, ex.getMessage());
            return Optional.empty();
        }
    }

    private List<HistoricalQuote> fetchHistoryViaLibrary(String ticker, Calendar from, Calendar to) {
        try {
            throttle();
            Stock stock = YahooFinance.get(ticker);
            if (stock == null || !stock.isValid()) {
                return Collections.emptyList();
            }
            List<HistoricalQuote> history = stock.getHistory(from, to, Interval.DAILY);
            return history != null ? history : Collections.emptyList();
        } catch (IOException ex) {
            log.debug("Yahoo library history failed for {}: {}", ticker, ex.getMessage());
            return Collections.emptyList();
        }
    }

    private List<HistoricalQuote> fetchHistoryViaChart(String ticker, Calendar from, Calendar to) {
        try {
            long days = Math.max(1, TimeUnit.MILLISECONDS.toDays(to.getTimeInMillis() - from.getTimeInMillis()));
            String range = days <= 7 ? "5d"
                    : days <= 35 ? "1mo"
                    : days <= 200 ? "6mo"
                    : days <= 400 ? "1y"
                    : "5y";

            JsonNode result = fetchChartJson(ticker, range);
            if (result == null) {
                return Collections.emptyList();
            }
            return parseChartHistory(ticker, result);
        } catch (Exception ex) {
            log.warn("Yahoo chart history failed for {}: {}", ticker, ex.getMessage());
            return Collections.emptyList();
        }
    }

    private List<HistoricalQuote> fetchHistoryViaCachedApi(String ticker) {
        try {
            throttle();
            String url = cachedPriceApiUrl + "?ticker=" + URLEncoder.encode(ticker, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Collections.emptyList();
            }

            JsonNode priceData = objectMapper.readTree(response.body()).path("price_data");
            JsonNode closes = priceData.path("close");
            JsonNode opens = priceData.path("open");
            JsonNode highs = priceData.path("high");
            JsonNode lows = priceData.path("low");
            JsonNode volumes = priceData.path("volume");
            JsonNode timestamps = priceData.path("timestamp");
            if (!closes.isArray() || closes.isEmpty()) {
                return Collections.emptyList();
            }

            int step = Math.max(1, closes.size() / 90);
            List<HistoricalQuote> history = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            for (int i = 0; i < closes.size(); i += step) {
                if (closes.get(i) == null || closes.get(i).isNull()) {
                    continue;
                }
                BigDecimal close = BigDecimal.valueOf(closes.get(i).asDouble());
                BigDecimal open = opens.isArray() && opens.get(i) != null && !opens.get(i).isNull()
                        ? BigDecimal.valueOf(opens.get(i).asDouble()) : close;
                BigDecimal high = highs.isArray() && highs.get(i) != null && !highs.get(i).isNull()
                        ? BigDecimal.valueOf(highs.get(i).asDouble()) : close;
                BigDecimal low = lows.isArray() && lows.get(i) != null && !lows.get(i).isNull()
                        ? BigDecimal.valueOf(lows.get(i).asDouble()) : close;
                Long volume = volumes.isArray() && volumes.get(i) != null && !volumes.get(i).isNull()
                        ? volumes.get(i).asLong() : 0L;

                Calendar cal = Calendar.getInstance();
                if (timestamps.isArray() && timestamps.get(i) != null && !timestamps.get(i).isNull()) {
                    try {
                        LocalDateTime ldt = LocalDateTime.parse(timestamps.get(i).asText(), formatter);
                        cal = GregorianCalendar.from(ldt.atZone(ZoneId.of("America/New_York")));
                    } catch (Exception ignored) {
                        // keep default calendar
                    }
                }

                history.add(new HistoricalQuote(
                        ticker, cal, scale(open), scale(low), scale(high), scale(close), scale(close), volume
                ));
            }
            return history;
        } catch (Exception ex) {
            log.warn("Cached history API failed for {}: {}", ticker, ex.getMessage());
            return Collections.emptyList();
        }
    }

    private List<HistoricalQuote> parseChartHistory(String ticker, JsonNode result) {
        JsonNode timestamps = result.path("timestamp");
        JsonNode quote = result.path("indicators").path("quote");
        if (!timestamps.isArray() || !quote.isArray() || quote.isEmpty()) {
            return Collections.emptyList();
        }

        JsonNode ohlcv = quote.get(0);
        JsonNode opens = ohlcv.path("open");
        JsonNode highs = ohlcv.path("high");
        JsonNode lows = ohlcv.path("low");
        JsonNode closes = ohlcv.path("close");
        JsonNode volumes = ohlcv.path("volume");

        List<HistoricalQuote> history = new ArrayList<>();
        for (int i = 0; i < timestamps.size(); i++) {
            if (!timestamps.get(i).isNumber() || closes.get(i) == null || closes.get(i).isNull()) {
                continue;
            }
            LocalDate date = Instant.ofEpochSecond(timestamps.get(i).asLong())
                    .atZone(ZoneId.of("America/New_York"))
                    .toLocalDate();
            Calendar cal = GregorianCalendar.from(date.atStartOfDay(ZoneId.of("America/New_York")));

            BigDecimal close = BigDecimal.valueOf(closes.get(i).asDouble());
            BigDecimal open = opens.get(i) != null && !opens.get(i).isNull()
                    ? BigDecimal.valueOf(opens.get(i).asDouble()) : close;
            BigDecimal high = highs.get(i) != null && !highs.get(i).isNull()
                    ? BigDecimal.valueOf(highs.get(i).asDouble()) : close;
            BigDecimal low = lows.get(i) != null && !lows.get(i).isNull()
                    ? BigDecimal.valueOf(lows.get(i).asDouble()) : close;
            Long volume = volumes.get(i) != null && !volumes.get(i).isNull()
                    ? volumes.get(i).asLong() : 0L;

            history.add(new HistoricalQuote(
                    ticker, cal, scale(open), scale(low), scale(high), scale(close), scale(close), volume
            ));
        }
        return history;
    }

    private JsonNode fetchChartJson(String ticker, String range) throws IOException {
        String encoded = URLEncoder.encode(ticker, StandardCharsets.UTF_8);
        String url = String.format(CHART_URL, encoded, range);

        if (curlFallbackEnabled) {
            // Keep retries short — long backoffs make batch portfolio refreshes very slow when Yahoo is blocking
            long[] backoffsMs = {0L, 1500L, 3000L};
            for (int attempt = 0; attempt < backoffsMs.length; attempt++) {
                if (backoffsMs[attempt] > 0) {
                    try {
                        Thread.sleep(backoffsMs[attempt]);
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
                Optional<String> curlBody = fetchViaCurl(url);
                if (curlBody.isPresent()) {
                    return parseChartResult(ticker, curlBody.get());
                }
            }
        }

        throw new IOException("Unable to fetch Yahoo chart for " + ticker + " (rate limited or unavailable)");
    }

    private Optional<YahooQuote> fetchQuoteViaYfinance(String ticker) {
        if (!yfinanceFallbackEnabled) {
            return Optional.empty();
        }
        try {
            Path script = resolveYfinanceScript();
            if (script == null) {
                return Optional.empty();
            }
            String python = resolvePythonCommand();
            if (python == null) {
                log.warn("No python/python3/py found on PATH; cannot use yfinance helper");
                return Optional.empty();
            }
            throttle();
            ProcessBuilder pb = new ProcessBuilder(python, script.toAbsolutePath().toString(), ticker);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String body = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            boolean finished = process.waitFor(45, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return Optional.empty();
            }
            if (process.exitValue() != 0 || body.isEmpty() || !body.startsWith("{")) {
                log.debug("yfinance helper failed for {}: {}", ticker, body);
                return Optional.empty();
            }
            JsonNode node = objectMapper.readTree(body);
            if (node.has("error") || !node.has("currentPrice")) {
                return Optional.empty();
            }
            log.info("Using yfinance helper for {}", ticker);
            return Optional.of(new YahooQuote(
                    ticker,
                    scale(BigDecimal.valueOf(node.path("currentPrice").asDouble())),
                    scale(BigDecimal.valueOf(node.path("openingPrice").asDouble())),
                    scale(BigDecimal.valueOf(node.path("closingPrice").asDouble())),
                    scale(BigDecimal.valueOf(node.path("highPrice").asDouble())),
                    scale(BigDecimal.valueOf(node.path("lowPrice").asDouble())),
                    node.path("volume").asLong(0L)
            ));
        } catch (Exception ex) {
            log.warn("yfinance helper failed for {}: {}", ticker, ex.getMessage());
            return Optional.empty();
        }
    }

    private List<HistoricalQuote> fetchHistoryViaYfinance(String ticker, Calendar from, Calendar to) {
        if (!yfinanceFallbackEnabled) {
            return Collections.emptyList();
        }
        try {
            Path script = resolveYfinanceScript();
            if (script == null) {
                return Collections.emptyList();
            }
            long days = Math.max(1, TimeUnit.MILLISECONDS.toDays(to.getTimeInMillis() - from.getTimeInMillis()));
            String period = days <= 7 ? "5d"
                    : days <= 35 ? "1mo"
                    : days <= 200 ? "6mo"
                    : days <= 400 ? "1y"
                    : "5y";

            String python = resolvePythonCommand();
            if (python == null) {
                return Collections.emptyList();
            }
            throttle();
            ProcessBuilder pb = new ProcessBuilder(
                    python, script.toAbsolutePath().toString(), "--history", ticker, period
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String body = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return Collections.emptyList();
            }
            if (process.exitValue() != 0 || !body.startsWith("{")) {
                return Collections.emptyList();
            }

            JsonNode history = objectMapper.readTree(body).path("history");
            if (!history.isArray() || history.isEmpty()) {
                return Collections.emptyList();
            }

            List<HistoricalQuote> points = new ArrayList<>();
            for (JsonNode n : history) {
                LocalDate date = LocalDate.parse(n.path("date").asText());
                Calendar cal = GregorianCalendar.from(date.atStartOfDay(ZoneId.of("America/New_York")));
                BigDecimal close = BigDecimal.valueOf(n.path("close").asDouble());
                BigDecimal open = BigDecimal.valueOf(n.path("open").asDouble(close.doubleValue()));
                BigDecimal high = BigDecimal.valueOf(n.path("high").asDouble(close.doubleValue()));
                BigDecimal low = BigDecimal.valueOf(n.path("low").asDouble(close.doubleValue()));
                long volume = n.path("volume").asLong(0L);
                points.add(new HistoricalQuote(
                        ticker, cal, scale(open), scale(low), scale(high), scale(close), scale(close), volume
                ));
            }
            return points;
        } catch (Exception ex) {
            log.warn("yfinance history failed for {}: {}", ticker, ex.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Windows typically exposes {@code python} or the {@code py} launcher, not {@code python3}.
     */
    private String resolvePythonCommand() {
        if (resolvedPythonCommand != null) {
            return resolvedPythonCommand.isEmpty() ? null : resolvedPythonCommand;
        }
        for (String candidate : new String[] {"python3", "python", "py"}) {
            try {
                ProcessBuilder pb = new ProcessBuilder(candidate, "--version");
                pb.redirectErrorStream(true);
                Process process = pb.start();
                boolean finished = process.waitFor(5, TimeUnit.SECONDS);
                if (finished && process.exitValue() == 0) {
                    resolvedPythonCommand = candidate;
                    log.info("Using '{}' for yfinance helper", candidate);
                    return candidate;
                }
            } catch (Exception ignored) {
                // try next candidate
            }
        }
        resolvedPythonCommand = "";
        return null;
    }

    private Path resolveYfinanceScript() {
        Path configured = Path.of(yfinanceScript);
        if (configured.isAbsolute() && Files.isRegularFile(configured)) {
            return configured;
        }
        Path fromCwd = Path.of("").toAbsolutePath().resolve(yfinanceScript);
        if (Files.isRegularFile(fromCwd)) {
            return fromCwd;
        }
        Path fromBackend = Path.of("").toAbsolutePath().resolve("backend").resolve(yfinanceScript);
        if (Files.isRegularFile(fromBackend)) {
            return fromBackend;
        }
        // When running from IDE/module root
        Path sibling = Path.of(System.getProperty("user.dir", "."))
                .resolve("scripts/fetch_yahoo_quote.py");
        return Files.isRegularFile(sibling) ? sibling : null;
    }

    private Optional<YahooQuote> fetchQuoteViaStooq(String ticker) {
        try {
            String symbol = ticker.toLowerCase(Locale.ROOT) + ".us";
            String url = "https://stooq.com/q/l/?s=" + URLEncoder.encode(symbol, StandardCharsets.UTF_8)
                    + "&f=sd2t2ohlcv&h&e=csv";
            Optional<String> body = fetchViaCurl(url);
            if (body.isEmpty()) {
                // Stooq often works via Java HTTP even when Yahoo does not
                throttle();
                HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                        .timeout(Duration.ofSeconds(15))
                        .header("User-Agent", USER_AGENT)
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    body = Optional.ofNullable(response.body());
                }
            }
            if (body.isEmpty()) {
                return Optional.empty();
            }

            String[] lines = body.get().trim().split("\\R");
            if (lines.length < 2) {
                return Optional.empty();
            }
            // Symbol,Date,Time,Open,High,Low,Close,Volume
            String[] cols = lines[1].split(",");
            if (cols.length < 8 || "N/D".equalsIgnoreCase(cols[6])) {
                return Optional.empty();
            }

            BigDecimal open = new BigDecimal(cols[3]);
            BigDecimal high = new BigDecimal(cols[4]);
            BigDecimal low = new BigDecimal(cols[5]);
            BigDecimal close = new BigDecimal(cols[6]);
            Long volume = 0L;
            try {
                volume = Long.parseLong(cols[7]);
            } catch (NumberFormatException ignored) {
                // mutual funds / some symbols omit volume
            }

            log.info("Using Stooq quote for {}", ticker);
            return Optional.of(new YahooQuote(
                    ticker, scale(close), scale(open), scale(close), scale(high), scale(low), volume
            ));
        } catch (Exception ex) {
            log.warn("Stooq quote failed for {}: {}", ticker, ex.getMessage());
            return Optional.empty();
        }
    }

    private JsonNode parseChartResult(String ticker, String body) throws IOException {
        JsonNode root = objectMapper.readTree(body);
        JsonNode result = root.path("chart").path("result");
        if (!result.isArray() || result.isEmpty()) {
            throw new IOException("Yahoo chart empty result for " + ticker);
        }
        return result.get(0);
    }

    private Optional<String> fetchViaCurl(String url) {
        String curl = resolveCurlCommand();
        if (curl == null) {
            return Optional.empty();
        }
        try {
            throttle();
            ProcessBuilder pb = new ProcessBuilder(
                    curl, "-sL",
                    "-A", USER_AGENT,
                    "-H", "Accept: application/json",
                    "--max-time", "15",
                    url
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String body = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = process.waitFor(20, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return Optional.empty();
            }
            String trimmed = body.trim();
            if (process.exitValue() != 0 || trimmed.isEmpty()
                    || trimmed.startsWith("Too Many")
                    || !trimmed.startsWith("{")) {
                log.debug("curl chart response rejected (exit={}, len={})", process.exitValue(), body.length());
                return Optional.empty();
            }
            return Optional.of(trimmed);
        } catch (Exception ex) {
            log.debug("curl fallback failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    /** Prefer PATH {@code curl} (works on Windows + macOS); fall back to macOS absolute path. */
    private String resolveCurlCommand() {
        if (resolvedCurlCommand != null) {
            return resolvedCurlCommand.isEmpty() ? null : resolvedCurlCommand;
        }
        for (String candidate : new String[] {"curl", "curl.exe", "/usr/bin/curl"}) {
            try {
                ProcessBuilder pb = new ProcessBuilder(candidate, "--version");
                pb.redirectErrorStream(true);
                Process process = pb.start();
                boolean finished = process.waitFor(5, TimeUnit.SECONDS);
                if (finished && process.exitValue() == 0) {
                    resolvedCurlCommand = candidate;
                    return candidate;
                }
            } catch (Exception ignored) {
                // try next
            }
        }
        resolvedCurlCommand = "";
        return null;
    }

    private void throttle() {
        synchronized (rateLock) {
            long now = System.currentTimeMillis();
            long wait = 1200 - (now - lastRequestAtMs);
            if (wait > 0) {
                try {
                    Thread.sleep(wait);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
            }
            lastRequestAtMs = System.currentTimeMillis();
        }
    }

    private Optional<YahooQuote> toQuote(String ticker, Stock stock) {
        if (stock == null || !stock.isValid()) {
            return Optional.empty();
        }

        StockQuote quote = stock.getQuote();
        if (quote == null || quote.getPrice() == null) {
            return Optional.empty();
        }

        BigDecimal price = scale(quote.getPrice());
        BigDecimal open = scale(quote.getOpen() != null ? quote.getOpen() : price);
        BigDecimal close = scale(quote.getPreviousClose() != null ? quote.getPreviousClose() : price);
        BigDecimal high = scale(quote.getDayHigh() != null ? quote.getDayHigh() : price);
        BigDecimal low = scale(quote.getDayLow() != null ? quote.getDayLow() : price);
        Long volume = quote.getVolume() != null ? quote.getVolume() : 0L;

        return Optional.of(new YahooQuote(ticker, price, open, close, high, low, volume));
    }

    private YahooQuote cashQuote() {
        BigDecimal one = new BigDecimal("1.00");
        return new YahooQuote(CASH_TICKER, one, one, one, one, one, 0L);
    }

    private String normalize(String tickerSymbol) {
        return tickerSymbol == null ? "" : tickerSymbol.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value == null || value.isMissingNode() || value.isNull() || !value.isNumber()) {
            return null;
        }
        return BigDecimal.valueOf(value.asDouble());
    }

    private BigDecimal lastNumber(JsonNode arrayNode) {
        if (!arrayNode.isArray() || arrayNode.isEmpty()) {
            return null;
        }
        for (int i = arrayNode.size() - 1; i >= 0; i--) {
            JsonNode n = arrayNode.get(i);
            if (n != null && !n.isNull() && n.isNumber()) {
                return BigDecimal.valueOf(n.asDouble());
            }
        }
        return null;
    }

    private Long lastLong(JsonNode arrayNode) {
        if (!arrayNode.isArray() || arrayNode.isEmpty()) {
            return 0L;
        }
        for (int i = arrayNode.size() - 1; i >= 0; i--) {
            JsonNode n = arrayNode.get(i);
            if (n != null && !n.isNull() && n.isNumber()) {
                return n.asLong();
            }
        }
        return 0L;
    }

    @SafeVarargs
    private final BigDecimal firstNonNull(BigDecimal... values) {
        for (BigDecimal value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    public List<MarketSearchResultDTO> searchAssets(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String cleanedQuery = query.trim();
        String encodedQuery = URLEncoder.encode(cleanedQuery, StandardCharsets.UTF_8);
        String searchUrl = "https://query1.finance.yahoo.com/v1/finance/search?q=" + encodedQuery
                + "&quotesCount=" + SEARCH_QUOTES_COUNT + "&newsCount=0";

        // Curl is the reliable path when Yahoo blocks the Java HTTP/TLS handshake.
        Optional<String> curlBody = fetchViaCurl(searchUrl);
        if (curlBody.isPresent()) {
            return parseSearchResults(curlBody.get());
        }

        try {
            throttle();
            HttpRequest request = HttpRequest.newBuilder(URI.create(searchUrl))
                    .timeout(Duration.ofSeconds(6))
                    .header("User-Agent", USER_AGENT)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return parseSearchResults(response.body());
            }

            String altSearchUrl = "https://query2.finance.yahoo.com/v1/finance/search?q=" + encodedQuery
                    + "&quotesCount=" + SEARCH_QUOTES_COUNT + "&newsCount=0";
            HttpRequest altRequest = HttpRequest.newBuilder(URI.create(altSearchUrl))
                    .timeout(Duration.ofSeconds(6))
                    .header("User-Agent", USER_AGENT)
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> altResponse = httpClient.send(altRequest, HttpResponse.BodyHandlers.ofString());
            if (altResponse.statusCode() >= 200 && altResponse.statusCode() < 300) {
                return parseSearchResults(altResponse.body());
            }
        } catch (Exception ex) {
            log.warn("Yahoo search failed for query '{}': {}", cleanedQuery, ex.getMessage());
        }
        return Collections.emptyList();
    }

    private List<MarketSearchResultDTO> parseSearchResults(String jsonBody) {
        List<MarketSearchResultDTO> list = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(jsonBody);
            JsonNode quotes = root.path("quotes");
            if (quotes.isArray()) {
                for (JsonNode node : quotes) {
                    String symbol = node.path("symbol").asText(null);
                    if (symbol == null || symbol.isEmpty()) {
                        continue;
                    }
                    String shortName = node.path("shortname").asText(null);
                    String longName = node.path("longname").asText(null);
                    String name = (shortName != null && !shortName.isBlank()) ? shortName :
                                  ((longName != null && !longName.isBlank()) ? longName : symbol);

                    String exch = node.path("exchDisp").asText(null);
                    if (exch == null || exch.isBlank()) {
                        exch = node.path("exchange").asText(null);
                    }

                    String rawType = node.path("quoteType").asText(null);
                    String assetType = mapQuoteTypeToAssetType(rawType);

                    String sector = node.path("sectorDisp").asText(null);
                    if (sector == null || sector.isBlank()) {
                        sector = node.path("sector").asText(null);
                    }

                    list.add(new MarketSearchResultDTO(symbol.toUpperCase(), name, exch, assetType, sector));
                }
            }
        } catch (Exception e) {
            log.warn("Error parsing Yahoo Finance search JSON: {}", e.getMessage());
        }
        return list;
    }

    private String mapQuoteTypeToAssetType(String quoteType) {
        if (quoteType == null) return "STOCKS";
        switch (quoteType.toUpperCase()) {
            case "EQUITY": return "STOCKS";
            case "ETF": return "ETFS";
            case "MUTUALFUND": return "MUTUAL_FUNDS";
            case "CURRENCY":
            case "CRYPTOCURRENCY": return "CASH";
            default: return "STOCKS";
        }
    }
}
