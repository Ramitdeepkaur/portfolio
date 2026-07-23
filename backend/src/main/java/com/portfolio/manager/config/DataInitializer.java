package com.portfolio.manager.config;

import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.entity.PortfolioSnapshot;
import com.portfolio.manager.repository.HoldingRepository;
import com.portfolio.manager.repository.PortfolioSnapshotRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final HoldingRepository holdingRepository;
    private final PortfolioSnapshotRepository snapshotRepository;

    public DataInitializer(HoldingRepository holdingRepository, PortfolioSnapshotRepository snapshotRepository) {
        this.holdingRepository = holdingRepository;
        this.snapshotRepository = snapshotRepository;
    }

    @Override
    public void run(String... args) {
        if (holdingRepository.count() == 0) {
            List<Holding> seedHoldings = List.of(
                    new Holding(null, "Apple Inc.", "AAPL", "STOCKS", 15.0, new BigDecimal("150.00"), LocalDate.now().minusMonths(14), "Technology", "NASDAQ", "USD"),
                    new Holding(null, "NVIDIA Corporation", "NVDA", "STOCKS", 25.0, new BigDecimal("85.00"), LocalDate.now().minusMonths(10), "Technology", "NASDAQ", "USD"),
                    new Holding(null, "Microsoft Corp.", "MSFT", "STOCKS", 10.0, new BigDecimal("380.00"), LocalDate.now().minusMonths(8), "Technology", "NASDAQ", "USD"),
                    new Holding(null, "Tesla Inc.", "TSLA", "STOCKS", 12.0, new BigDecimal("260.00"), LocalDate.now().minusMonths(6), "Consumer Cyclical", "NASDAQ", "USD"),
                    new Holding(null, "Vanguard S&P 500 ETF", "VOO", "ETFS", 18.0, new BigDecimal("410.00"), LocalDate.now().minusMonths(18), "Index", "NYSE", "USD"),
                    new Holding(null, "Invesco QQQ Trust", "QQQ", "ETFS", 14.0, new BigDecimal("420.00"), LocalDate.now().minusMonths(12), "Technology Index", "NASDAQ", "USD"),
                    new Holding(null, "Vanguard Total Bond Market", "BND", "BONDS", 40.0, new BigDecimal("74.00"), LocalDate.now().minusMonths(20), "Fixed Income", "NASDAQ", "USD"),
                    new Holding(null, "Fidelity Blue Chip Growth", "FBGRX", "MUTUAL_FUNDS", 30.0, new BigDecimal("145.00"), LocalDate.now().minusMonths(15), "Large Growth", "NASDAQ", "USD"),
                    new Holding(null, "USD Cash Reserve", "CASH", "CASH", 3500.0, new BigDecimal("1.00"), LocalDate.now().minusMonths(24), "Cash & Equivalent", "BANK", "USD")
            );
            holdingRepository.saveAll(seedHoldings);
        }

        if (snapshotRepository.count() == 0) {
            LocalDate now = LocalDate.now();
            List<PortfolioSnapshot> snapshots = List.of(
                    new PortfolioSnapshot(null, new BigDecimal("18500.00"), new BigDecimal("17000.00"), new BigDecimal("1500.00"), now.minusMonths(12)),
                    new PortfolioSnapshot(null, new BigDecimal("19200.00"), new BigDecimal("17200.00"), new BigDecimal("2000.00"), now.minusMonths(10)),
                    new PortfolioSnapshot(null, new BigDecimal("20800.00"), new BigDecimal("17500.00"), new BigDecimal("3300.00"), now.minusMonths(8)),
                    new PortfolioSnapshot(null, new BigDecimal("22400.00"), new BigDecimal("18000.00"), new BigDecimal("4400.00"), now.minusMonths(6)),
                    new PortfolioSnapshot(null, new BigDecimal("21900.00"), new BigDecimal("18200.00"), new BigDecimal("3700.00"), now.minusMonths(4)),
                    new PortfolioSnapshot(null, new BigDecimal("24500.00"), new BigDecimal("18500.00"), new BigDecimal("6000.00"), now.minusMonths(2)),
                    new PortfolioSnapshot(null, new BigDecimal("26850.00"), new BigDecimal("18850.00"), new BigDecimal("8000.00"), now)
            );
            snapshotRepository.saveAll(snapshots);
        }
    }
}
