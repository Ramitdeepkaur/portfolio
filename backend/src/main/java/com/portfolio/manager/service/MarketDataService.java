package com.portfolio.manager.service;

import com.portfolio.manager.dto.HistoricalPricePointDTO;
import com.portfolio.manager.dto.MarketDataDTO;
import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.repository.MarketDataRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class MarketDataService {

    private final MarketDataRepository marketDataRepository;
    private final Map<String, BigDecimal> defaultPrices = new HashMap<>();
    private final Object creationLock = new Object();

    public MarketDataService(MarketDataRepository marketDataRepository) {
        this.marketDataRepository = marketDataRepository;
        initializeDefaults();
    }

    private void initializeDefaults() {
        defaultPrices.put("AAPL", new BigDecimal("185.50"));
        defaultPrices.put("MSFT", new BigDecimal("420.20"));
        defaultPrices.put("GOOGL", new BigDecimal("175.80"));
        defaultPrices.put("AMZN", new BigDecimal("182.40"));
        defaultPrices.put("NVDA", new BigDecimal("125.60"));
        defaultPrices.put("TSLA", new BigDecimal("248.50"));
        defaultPrices.put("SPY", new BigDecimal("545.30"));
        defaultPrices.put("QQQ", new BigDecimal("480.10"));
        defaultPrices.put("VTI", new BigDecimal("260.40"));
        defaultPrices.put("BND", new BigDecimal("72.50"));
        defaultPrices.put("CASH", new BigDecimal("1.00"));
    }

    public MarketData getOrCreateMarketData(String tickerSymbol) {
        String ticker = tickerSymbol.toUpperCase().trim();
        Optional<MarketData> existing = marketDataRepository.findByTickerSymbolIgnoreCase(ticker);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Only synchronize the rare "ticker doesn't exist yet" path: concurrent requests for the
        // same brand-new ticker would otherwise all pass the check above and race to insert it,
        // tripping the unique constraint on ticker_symbol.
        synchronized (creationLock) {
            existing = marketDataRepository.findByTickerSymbolIgnoreCase(ticker);
            if (existing.isPresent()) {
                return existing.get();
            }

            BigDecimal price = defaultPrices.getOrDefault(ticker, generateRandomPrice(ticker));
            BigDecimal open = price.multiply(new BigDecimal("0.992")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal high = price.multiply(new BigDecimal("1.015")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal low = price.multiply(new BigDecimal("0.985")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal close = price.multiply(new BigDecimal("0.998")).setScale(2, RoundingMode.HALF_UP);

            MarketData data = new MarketData(
                    null,
                    ticker,
                    price,
                    open,
                    close,
                    high,
                    low,
                    15420000L + (long)(Math.abs(ticker.hashCode()) % 50000000),
                    LocalDateTime.now()
            );

            try {
                return marketDataRepository.save(data);
            } catch (DataIntegrityViolationException ex) {
                return marketDataRepository.findByTickerSymbolIgnoreCase(ticker)
                        .orElseThrow(() -> ex);
            }
        }
    }

    public MarketDataDTO getMarketDataDTO(String tickerSymbol, String timeframe) {
        MarketData marketData = getOrCreateMarketData(tickerSymbol);
        MarketDataDTO dto = new MarketDataDTO();
        dto.setTickerSymbol(marketData.getTickerSymbol());
        dto.setCurrentPrice(marketData.getCurrentPrice());
        dto.setOpeningPrice(marketData.getOpeningPrice());
        dto.setClosingPrice(marketData.getClosingPrice());
        dto.setHighPrice(marketData.getHighPrice());
        dto.setLowPrice(marketData.getLowPrice());
        dto.setVolume(marketData.getVolume());
        dto.setLastUpdated(marketData.getLastUpdated());

        BigDecimal change = marketData.getCurrentPrice().subtract(marketData.getOpeningPrice());
        dto.setChangeAmount(change.setScale(2, RoundingMode.HALF_UP));

        BigDecimal pct = BigDecimal.ZERO;
        if (marketData.getOpeningPrice().compareTo(BigDecimal.ZERO) > 0) {
            pct = change.multiply(new BigDecimal("100"))
                    .divide(marketData.getOpeningPrice(), 2, RoundingMode.HALF_UP);
        }
        dto.setChangePercentage(pct);

        dto.setHistory(generateHistoryPoints(marketData.getTickerSymbol(), marketData.getCurrentPrice(), timeframe));
        return dto;
    }

    public List<HistoricalPricePointDTO> generateHistoryPoints(String ticker, BigDecimal currentPrice, String range) {
        int days = switch (range != null ? range.toLowerCase() : "1m") {
            case "1w", "7d" -> 7;
            case "6m" -> 180;
            case "1y" -> 365;
            case "5y" -> 1825;
            default -> 30; // 1m
        };

        int step = Math.max(1, days / 60);
        List<HistoricalPricePointDTO> history = new ArrayList<>();
        LocalDate now = LocalDate.now();

        double basePrice = currentPrice.doubleValue();
        int seed = Math.abs(ticker.hashCode());

        for (int i = days; i >= 0; i -= step) {
            LocalDate date = now.minusDays(i);
            double noise = Math.sin((double) i / 5.0 + seed) * 0.05 + Math.cos((double) i / 12.0) * 0.03;
            double trend = ((days - i) / (double) days) * 0.15;
            double p = basePrice * (0.85 + trend + noise);

            BigDecimal closeP = new BigDecimal(p).setScale(2, RoundingMode.HALF_UP);
            BigDecimal openP = closeP.multiply(new BigDecimal("0.995")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal highP = closeP.multiply(new BigDecimal("1.012")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lowP = closeP.multiply(new BigDecimal("0.988")).setScale(2, RoundingMode.HALF_UP);
            Long vol = 10000000L + (long)(Math.sin(i) * 5000000);

            history.add(new HistoricalPricePointDTO(date, openP, closeP, highP, lowP, Math.abs(vol)));
        }
        return history;
    }

    private BigDecimal generateRandomPrice(String ticker) {
        int hash = Math.abs(ticker.hashCode());
        double val = 50.0 + (hash % 450);
        return new BigDecimal(val).setScale(2, RoundingMode.HALF_UP);
    }
}
