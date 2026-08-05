package com.portfolio.manager.service;

import com.portfolio.manager.dto.HistoricalPricePointDTO;
import com.portfolio.manager.dto.MarketDataDTO;
import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.market.MarketDataException;
import com.portfolio.manager.market.YahooFinanceClient;
import com.portfolio.manager.market.YahooQuote;
import com.portfolio.manager.repository.HoldingRepository;
import com.portfolio.manager.repository.MarketDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import yahoofinance.histquotes.HistoricalQuote;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
@Service
public class MarketDataService {

    private static final Logger log = LoggerFactory.getLogger(MarketDataService.class);

    private static final List<String> DEFAULT_WATCHLIST = List.of(
            "AAPL", "NVDA", "MSFT", "TSLA", "SPY", "QQQ", "VTI", "BND", "VOO", "AMZN"
    );

    private final MarketDataRepository marketDataRepository;
    private final HoldingRepository holdingRepository;
    private final YahooFinanceClient yahooFinanceClient;
    private final long ttlMinutes;

    public MarketDataService(
            MarketDataRepository marketDataRepository,
            HoldingRepository holdingRepository,
            YahooFinanceClient yahooFinanceClient,
            @Value("${portfolio.market-data.ttl-minutes:5}") long ttlMinutes) {
        this.marketDataRepository = marketDataRepository;
        this.holdingRepository = holdingRepository;
        this.yahooFinanceClient = yahooFinanceClient;
        this.ttlMinutes = ttlMinutes;
    }

    /**
     * Returns fresh-enough market data for a ticker, refreshing from Yahoo when stale or missing.
     * Falls back to the last persisted DB row if Yahoo is unavailable.
     */
    @Transactional
    public MarketData getOrCreateMarketData(String tickerSymbol) {
        String ticker = normalize(tickerSymbol);
        Optional<MarketData> existing = marketDataRepository.findByTickerSymbolIgnoreCase(ticker);

        if (existing.isPresent() && !isStale(existing.get())) {
            return existing.get();
        }

        Optional<YahooQuote> quote = yahooFinanceClient.fetchQuote(ticker);
        if (quote.isPresent()) {
            return upsertFromQuote(existing.orElse(null), quote.get());
        }

        if (existing.isPresent()) {
            log.warn("Using stale cached quote for {} (Yahoo unavailable)", ticker);
            return existing.get();
        }

        throw new MarketDataException("No market data available for ticker: " + ticker);
    }

    public MarketDataDTO getMarketDataDTO(String tickerSymbol, String timeframe) {
        MarketData marketData = getOrCreateMarketData(tickerSymbol);
        MarketDataDTO dto = toDto(marketData);
        dto.setHistory(fetchHistoryPoints(marketData.getTickerSymbol(), timeframe));
        return dto;
    }

    /**
     * Force-refresh quotes for all holding tickers (batch Yahoo call).
     */
    @Transactional
    public List<MarketDataDTO> refreshHoldingQuotes() {
        List<String> tickers = holdingRepository.findDistinctTickerSymbols();
        return refreshTickers(tickers);
    }

    /**
     * Refresh specific tickers from Yahoo and return DTOs (no history payload).
     */
    @Transactional
    public List<MarketDataDTO> refreshTickers(List<String> tickers) {
        if (tickers == null || tickers.isEmpty()) {
            return List.of();
        }

        List<String> normalized = tickers.stream()
                .map(this::normalize)
                .filter(t -> !t.isEmpty())
                .distinct()
                .toList();

        Map<String, YahooQuote> quotes = yahooFinanceClient.fetchQuotes(normalized);
        List<MarketDataDTO> results = new ArrayList<>();

        for (String ticker : normalized) {
            YahooQuote quote = quotes.get(ticker);
            if (quote != null) {
                Optional<MarketData> existing = marketDataRepository.findByTickerSymbolIgnoreCase(ticker);
                MarketData saved = upsertFromQuote(existing.orElse(null), quote);
                results.add(toDto(saved));
            } else {
                marketDataRepository.findByTickerSymbolIgnoreCase(ticker)
                        .ifPresent(cached -> results.add(toDto(cached)));
            }
        }

        return results;
    }

    /**
     * Watchlist quotes: requested symbols, or holdings + default symbols when none provided.
     */
    @Transactional
    public List<MarketDataDTO> getWatchlist(String symbolsParam) {
        Set<String> symbols = new LinkedHashSet<>();

        if (symbolsParam != null && !symbolsParam.isBlank()) {
            Arrays.stream(symbolsParam.split(","))
                    .map(this::normalize)
                    .filter(t -> !t.isEmpty())
                    .forEach(symbols::add);
        } else {
            holdingRepository.findDistinctTickerSymbols().stream()
                    .map(this::normalize)
                    .filter(t -> !t.isEmpty() && !YahooFinanceClient.CASH_TICKER.equals(t))
                    .forEach(symbols::add);
            symbols.addAll(DEFAULT_WATCHLIST);
        }

        // Refresh only stale/missing, but always return a DTO per symbol when possible
        List<MarketDataDTO> watchlist = new ArrayList<>();
        for (String ticker : symbols) {
            try {
                MarketData data = getOrCreateMarketData(ticker);
                watchlist.add(toDto(data));
            } catch (MarketDataException ex) {
                log.warn("Skipping watchlist ticker {}: {}", ticker, ex.getMessage());
            }
        }
        return watchlist;
    }

    public List<HistoricalPricePointDTO> fetchHistoryPoints(String ticker, String range) {
        if (YahooFinanceClient.CASH_TICKER.equalsIgnoreCase(ticker)) {
            return List.of();
        }

        int days = switch (range != null ? range.toLowerCase(Locale.ROOT) : "1m") {
            case "1w", "7d" -> 7;
            case "6m" -> 180;
            case "1y" -> 365;
            case "5y" -> 1825;
            default -> 30;
        };

        Calendar from = Calendar.getInstance();
        from.add(Calendar.DAY_OF_YEAR, -days);
        Calendar to = Calendar.getInstance();

        List<HistoricalQuote> history = yahooFinanceClient.fetchHistory(ticker, from, to);
        if (history.isEmpty()) {
            return List.of();
        }

        // Downsample long ranges so charts stay responsive
        int step = Math.max(1, history.size() / 90);
        List<HistoricalPricePointDTO> points = new ArrayList<>();
        for (int i = 0; i < history.size(); i += step) {
            HistoricalQuote hq = history.get(i);
            if (hq == null || hq.getDate() == null || hq.getClose() == null) {
                continue;
            }
            Calendar cal = hq.getDate();
            LocalDate date = LocalDate.of(
                    cal.get(Calendar.YEAR),
                    cal.get(Calendar.MONTH) + 1,
                    cal.get(Calendar.DAY_OF_MONTH)
            );
            BigDecimal close = scale(hq.getClose());
            BigDecimal open = scale(hq.getOpen() != null ? hq.getOpen() : close);
            BigDecimal high = scale(hq.getHigh() != null ? hq.getHigh() : close);
            BigDecimal low = scale(hq.getLow() != null ? hq.getLow() : close);
            points.add(new HistoricalPricePointDTO(date, open, close, high, low, hq.getVolume()));
        }
        return points;
    }

    private MarketData upsertFromQuote(MarketData existing, YahooQuote quote) {
        MarketData data = existing != null ? existing : new MarketData();
        data.setTickerSymbol(quote.tickerSymbol());
        data.setCurrentPrice(quote.currentPrice());
        data.setOpeningPrice(quote.openingPrice());
        data.setClosingPrice(quote.closingPrice());
        data.setHighPrice(quote.highPrice());
        data.setLowPrice(quote.lowPrice());
        data.setVolume(quote.volume());
        data.setLastUpdated(LocalDateTime.now());

        try {
            return marketDataRepository.save(data);
        } catch (DataIntegrityViolationException ex) {
            return marketDataRepository.findByTickerSymbolIgnoreCase(quote.tickerSymbol())
                    .map(row -> {
                        row.setCurrentPrice(quote.currentPrice());
                        row.setOpeningPrice(quote.openingPrice());
                        row.setClosingPrice(quote.closingPrice());
                        row.setHighPrice(quote.highPrice());
                        row.setLowPrice(quote.lowPrice());
                        row.setVolume(quote.volume());
                        row.setLastUpdated(LocalDateTime.now());
                        return marketDataRepository.save(row);
                    })
                    .orElseThrow(() -> ex);
        }
    }

    private boolean isStale(MarketData data) {
        if (data.getLastUpdated() == null) {
            return true;
        }
        return data.getLastUpdated().isBefore(LocalDateTime.now().minusMinutes(ttlMinutes));
    }

    private MarketDataDTO toDto(MarketData marketData) {
        MarketDataDTO dto = new MarketDataDTO();
        dto.setTickerSymbol(marketData.getTickerSymbol());
        dto.setCurrentPrice(marketData.getCurrentPrice());
        dto.setOpeningPrice(marketData.getOpeningPrice());
        dto.setClosingPrice(marketData.getClosingPrice());
        dto.setHighPrice(marketData.getHighPrice());
        dto.setLowPrice(marketData.getLowPrice());
        dto.setVolume(marketData.getVolume());
        dto.setLastUpdated(marketData.getLastUpdated());

        BigDecimal current = nullSafe(marketData.getCurrentPrice());
        BigDecimal baseline = marketData.getOpeningPrice() != null
                ? marketData.getOpeningPrice()
                : marketData.getClosingPrice();
        if (baseline == null || baseline.compareTo(BigDecimal.ZERO) == 0) {
            baseline = current;
        }

        BigDecimal change = current.subtract(nullSafe(baseline));
        dto.setChangeAmount(change.setScale(2, RoundingMode.HALF_UP));

        BigDecimal pct = BigDecimal.ZERO;
        if (baseline.compareTo(BigDecimal.ZERO) > 0) {
            pct = change.multiply(new BigDecimal("100"))
                    .divide(baseline, 2, RoundingMode.HALF_UP);
        }
        dto.setChangePercentage(pct);
        return dto;
    }

    private String normalize(String tickerSymbol) {
        return tickerSymbol == null ? "" : tickerSymbol.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
