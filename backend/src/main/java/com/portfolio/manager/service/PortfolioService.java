package com.portfolio.manager.service;

import com.portfolio.manager.dto.AllocationDTO;
import com.portfolio.manager.dto.HistoricalPricePointDTO;
import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.dto.PerformanceDTO;
import com.portfolio.manager.dto.PortfolioSummaryDTO;
import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.entity.PortfolioSnapshot;
import com.portfolio.manager.market.YahooFinanceClient;
import com.portfolio.manager.repository.HoldingRepository;
import com.portfolio.manager.repository.PortfolioSnapshotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Optional;
import java.util.TreeMap;
import java.util.TreeSet;

@Service
public class PortfolioService {

    private static final Logger log = LoggerFactory.getLogger(PortfolioService.class);
    private static final long HISTORY_CACHE_TTL_MS = 15 * 60 * 1000L;

    private final HoldingService holdingService;
    private final HoldingRepository holdingRepository;
    private final MarketDataService marketDataService;
    private final PortfolioSnapshotRepository snapshotRepository;

    private volatile List<PortfolioSnapshot> cachedLiveHistory = List.of();
    private volatile long cachedLiveHistoryAt;

    public PortfolioService(
            HoldingService holdingService,
            HoldingRepository holdingRepository,
            MarketDataService marketDataService,
            PortfolioSnapshotRepository snapshotRepository) {
        this.holdingService = holdingService;
        this.holdingRepository = holdingRepository;
        this.marketDataService = marketDataService;
        this.snapshotRepository = snapshotRepository;
    }

    public PortfolioSummaryDTO getSummary() {
        List<HoldingResponseDTO> holdings = holdingService.getAllHoldings();

        BigDecimal totalPortfolioValue = BigDecimal.ZERO;
        BigDecimal totalInvestedAmount = BigDecimal.ZERO;
        BigDecimal todayPortfolioChange = BigDecimal.ZERO;
        BigDecimal cashAvailable = BigDecimal.ZERO;

        HoldingResponseDTO bestAsset = null;
        HoldingResponseDTO worstAsset = null;

        for (HoldingResponseDTO h : holdings) {
            totalPortfolioValue = totalPortfolioValue.add(h.getCurrentValue());
            totalInvestedAmount = totalInvestedAmount.add(h.getInvestedValue());

            BigDecimal assetTodayChange = h.getCurrentValue()
                    .multiply(h.getTodayChangePercentage() != null ? h.getTodayChangePercentage() : BigDecimal.ZERO)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            todayPortfolioChange = todayPortfolioChange.add(assetTodayChange);

            if ("CASH".equalsIgnoreCase(h.getAssetType())) {
                cashAvailable = cashAvailable.add(h.getCurrentValue());
            }

            if (bestAsset == null || h.getProfitPercentage().compareTo(bestAsset.getProfitPercentage()) > 0) {
                bestAsset = h;
            }
            if (worstAsset == null || h.getProfitPercentage().compareTo(worstAsset.getProfitPercentage()) < 0) {
                worstAsset = h;
            }
        }

        BigDecimal totalProfitLoss = totalPortfolioValue.subtract(totalInvestedAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitLossPercentage = BigDecimal.ZERO;
        if (totalInvestedAmount.compareTo(BigDecimal.ZERO) > 0) {
            profitLossPercentage = totalProfitLoss.multiply(new BigDecimal("100"))
                    .divide(totalInvestedAmount, 2, RoundingMode.HALF_UP);
        }

        BigDecimal todayPortfolioChangePct = BigDecimal.ZERO;
        BigDecimal previousValue = totalPortfolioValue.subtract(todayPortfolioChange);
        if (previousValue.compareTo(BigDecimal.ZERO) > 0) {
            todayPortfolioChangePct = todayPortfolioChange.multiply(new BigDecimal("100"))
                    .divide(previousValue, 2, RoundingMode.HALF_UP);
        }

        PortfolioSummaryDTO summary = new PortfolioSummaryDTO();
        summary.setTotalPortfolioValue(totalPortfolioValue.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalInvestedAmount(totalInvestedAmount.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalProfitLoss(totalProfitLoss);
        summary.setProfitLossPercentage(profitLossPercentage);
        summary.setTotalHoldings(holdings.size());
        summary.setTodayPortfolioChange(todayPortfolioChange.setScale(2, RoundingMode.HALF_UP));
        summary.setTodayPortfolioChangePercentage(todayPortfolioChangePct);
        summary.setCashAvailable(cashAvailable.setScale(2, RoundingMode.HALF_UP));
        summary.setBestPerformingAsset(bestAsset);
        summary.setWorstPerformingAsset(worstAsset);

        return summary;
    }

    public AllocationDTO getAllocation() {
        List<HoldingResponseDTO> holdings = holdingService.getAllHoldings();

        BigDecimal totalVal = holdings.stream()
                .map(HoldingResponseDTO::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> assetTypeMap = new HashMap<>();
        Map<String, BigDecimal> sectorMap = new HashMap<>();

        for (HoldingResponseDTO h : holdings) {
            String type = h.getAssetType() != null ? h.getAssetType() : "Other";
            String sector = h.getSector() != null ? h.getSector() : "General";

            assetTypeMap.put(type, assetTypeMap.getOrDefault(type, BigDecimal.ZERO).add(h.getCurrentValue()));
            sectorMap.put(sector, sectorMap.getOrDefault(sector, BigDecimal.ZERO).add(h.getCurrentValue()));
        }

        List<AllocationDTO.AllocationItem> byAssetType = mapToAllocationItems(assetTypeMap, totalVal);
        List<AllocationDTO.AllocationItem> bySector = mapToAllocationItems(sectorMap, totalVal);

        return new AllocationDTO(byAssetType, bySector, totalVal);
    }

    private List<AllocationDTO.AllocationItem> mapToAllocationItems(Map<String, BigDecimal> map, BigDecimal totalVal) {
        List<AllocationDTO.AllocationItem> items = new ArrayList<>();
        map.forEach((category, val) -> {
            BigDecimal pct = BigDecimal.ZERO;
            if (totalVal.compareTo(BigDecimal.ZERO) > 0) {
                pct = val.multiply(new BigDecimal("100")).divide(totalVal, 2, RoundingMode.HALF_UP);
            }
            items.add(new AllocationDTO.AllocationItem(category, val, pct));
        });
        items.sort((a, b) -> b.getValue().compareTo(a.getValue()));
        return items;
    }

    /**
     * Performance history rebuilt from Yahoo market history × current holdings (not seeded/fake curves).
     */
    public PerformanceDTO getPerformance() {
        List<PortfolioSnapshot> history = getLivePerformanceHistory();
        PortfolioSummaryDTO summary = getSummary();

        // Ensure today's live mark is the last point
        LocalDate today = LocalDate.now();
        PortfolioSnapshot todayPoint = new PortfolioSnapshot(
                null,
                summary.getTotalPortfolioValue(),
                summary.getTotalInvestedAmount(),
                summary.getTotalProfitLoss(),
                today
        );
        if (history.isEmpty() || !today.equals(history.get(history.size() - 1).getSnapshotDate())) {
            history = new ArrayList<>(history);
            history.removeIf(s -> today.equals(s.getSnapshotDate()));
            history.add(todayPoint);
        } else {
            history = new ArrayList<>(history);
            history.set(history.size() - 1, todayPoint);
        }

        captureTodaySnapshot(summary);

        BigDecimal totalReturn = summary.getProfitLossPercentage();
        BigDecimal absoluteReturn = summary.getTotalProfitLoss();

        BigDecimal cagr = BigDecimal.ZERO;
        if (history.size() >= 2) {
            LocalDate start = history.get(0).getSnapshotDate();
            LocalDate end = history.get(history.size() - 1).getSnapshotDate();
            double years = Math.max(1.0 / 12.0, ChronoUnit.DAYS.between(start, end) / 365.25);
            double invested = summary.getTotalInvestedAmount().doubleValue();
            double current = summary.getTotalPortfolioValue().doubleValue();
            if (invested > 0 && current > 0) {
                double cagrVal = (Math.pow(current / invested, 1.0 / years) - 1.0) * 100.0;
                cagr = new BigDecimal(cagrVal).setScale(2, RoundingMode.HALF_UP);
            }
        }

        return new PerformanceDTO(totalReturn, cagr, totalReturn, absoluteReturn, history);
    }

    @Transactional
    public void captureTodaySnapshot(PortfolioSummaryDTO summary) {
        if (summary == null) {
            summary = getSummary();
        }
        LocalDate today = LocalDate.now();
        Optional<PortfolioSnapshot> existing = snapshotRepository.findBySnapshotDate(today);
        PortfolioSnapshot snapshot = existing.orElseGet(PortfolioSnapshot::new);
        snapshot.setSnapshotDate(today);
        snapshot.setPortfolioValue(summary.getTotalPortfolioValue());
        snapshot.setInvestedAmount(summary.getTotalInvestedAmount());
        snapshot.setProfitLoss(summary.getTotalProfitLoss());
        snapshotRepository.save(snapshot);
    }

    private List<PortfolioSnapshot> getLivePerformanceHistory() {
        long now = System.currentTimeMillis();
        if (!cachedLiveHistory.isEmpty() && (now - cachedLiveHistoryAt) < HISTORY_CACHE_TTL_MS) {
            return cachedLiveHistory;
        }

        List<PortfolioSnapshot> rebuilt = buildHistoryFromMarketData();
        cachedLiveHistory = List.copyOf(rebuilt);
        cachedLiveHistoryAt = now;
        return cachedLiveHistory;
    }

    /**
     * Marks portfolio value through time using Yahoo closes × holding quantities.
     * Holdings purchased after a date are excluded from that date's invested/mark.
     */
    private List<PortfolioSnapshot> buildHistoryFromMarketData() {
        List<Holding> holdings = holdingRepository.findAll();
        if (holdings.isEmpty()) {
            return List.of();
        }

        Map<String, NavigableMap<LocalDate, BigDecimal>> priceSeries = new HashMap<>();
        TreeSet<LocalDate> allDates = new TreeSet<>();

        for (Holding holding : holdings) {
            String ticker = holding.getTickerSymbol() != null ? holding.getTickerSymbol().toUpperCase() : "";
            if (ticker.isBlank() || YahooFinanceClient.CASH_TICKER.equals(ticker)) {
                continue;
            }
            try {
                List<HistoricalPricePointDTO> points = marketDataService.fetchHistoryPoints(ticker, "1y");
                NavigableMap<LocalDate, BigDecimal> series = new TreeMap<>();
                for (HistoricalPricePointDTO point : points) {
                    if (point.getDate() != null && point.getClose() != null) {
                        series.put(point.getDate(), point.getClose());
                        allDates.add(point.getDate());
                    }
                }
                if (!series.isEmpty()) {
                    priceSeries.put(ticker, series);
                }
            } catch (Exception ex) {
                log.warn("Could not load history for {}: {}", ticker, ex.getMessage());
            }
        }

        if (allDates.isEmpty()) {
            // Fall back to persisted snapshots only if market history is unavailable
            List<PortfolioSnapshot> persisted = snapshotRepository.findAllByOrderBySnapshotDateAsc();
            return persisted != null ? persisted : List.of();
        }

        // Weekly sampling keeps charts responsive while staying market-data-based
        List<LocalDate> sampleDates = new ArrayList<>();
        LocalDate cursor = null;
        for (LocalDate date : allDates) {
            if (cursor == null || ChronoUnit.DAYS.between(cursor, date) >= 7) {
                sampleDates.add(date);
                cursor = date;
            }
        }
        LocalDate last = allDates.last();
        if (sampleDates.isEmpty() || !sampleDates.get(sampleDates.size() - 1).equals(last)) {
            sampleDates.add(last);
        }

        List<PortfolioSnapshot> history = new ArrayList<>();
        for (LocalDate date : sampleDates) {
            BigDecimal portfolioValue = BigDecimal.ZERO;
            BigDecimal investedAmount = BigDecimal.ZERO;

            for (Holding holding : holdings) {
                if (holding.getPurchaseDate() != null && holding.getPurchaseDate().isAfter(date)) {
                    continue;
                }
                BigDecimal qty = BigDecimal.valueOf(holding.getQuantity() != null ? holding.getQuantity() : 0.0);
                BigDecimal purchase = holding.getPurchasePrice() != null ? holding.getPurchasePrice() : BigDecimal.ZERO;
                investedAmount = investedAmount.add(qty.multiply(purchase));

                String ticker = holding.getTickerSymbol() != null ? holding.getTickerSymbol().toUpperCase() : "";
                if (YahooFinanceClient.CASH_TICKER.equals(ticker) || "CASH".equalsIgnoreCase(holding.getAssetType())) {
                    portfolioValue = portfolioValue.add(qty.multiply(BigDecimal.ONE));
                    continue;
                }

                NavigableMap<LocalDate, BigDecimal> series = priceSeries.get(ticker);
                BigDecimal mark = null;
                if (series != null) {
                    Map.Entry<LocalDate, BigDecimal> floor = series.floorEntry(date);
                    if (floor != null) {
                        mark = floor.getValue();
                    }
                }
                if (mark == null) {
                    mark = purchase;
                }
                portfolioValue = portfolioValue.add(qty.multiply(mark));
            }

            portfolioValue = portfolioValue.setScale(2, RoundingMode.HALF_UP);
            investedAmount = investedAmount.setScale(2, RoundingMode.HALF_UP);
            BigDecimal pl = portfolioValue.subtract(investedAmount).setScale(2, RoundingMode.HALF_UP);
            history.add(new PortfolioSnapshot(null, portfolioValue, investedAmount, pl, date));
        }

        history.sort(Comparator.comparing(PortfolioSnapshot::getSnapshotDate));
        return history;
    }
}
