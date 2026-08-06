package com.portfolio.manager.config;

import com.portfolio.manager.entity.AuditLog;
import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.entity.Transaction;
import com.portfolio.manager.repository.AuditLogRepository;
import com.portfolio.manager.repository.HoldingRepository;
import com.portfolio.manager.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final HoldingRepository holdingRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;

    public DataInitializer(
            HoldingRepository holdingRepository,
            TransactionRepository transactionRepository,
            AuditLogRepository auditLogRepository) {
        this.holdingRepository = holdingRepository;
        this.transactionRepository = transactionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void run(String... args) {
        // Seed holdings / transactions only. Live marks and performance history come from Yahoo Finance.
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

        if (transactionRepository.count() == 0) {
            List<Transaction> seedTransactions = List.of(
                    new Transaction(null, "AAPL", "BUY", 15.0, new BigDecimal("150.00"), new BigDecimal("2250.00"), LocalDate.now().minusDays(30), "Initial Apple purchase"),
                    new Transaction(null, "MSFT", "BUY", 10.0, new BigDecimal("380.00"), new BigDecimal("3800.00"), LocalDate.now().minusDays(20), "Added Microsoft position"),
                    new Transaction(null, "NVDA", "SELL", 2.0, new BigDecimal("125.60"), new BigDecimal("251.20"), LocalDate.now().minusDays(10), "Trimmed NVDA"));
            transactionRepository.saveAll(seedTransactions);
        }

        if (auditLogRepository.count() == 0) {
            AuditLog aapl = seedAudit("CREATE", "HOLDING", "AAPL", "Seeded holding AAPL", "—", "AAPL (Apple Inc.) qty=15.0 price=150.00 type=STOCKS", LocalDateTime.now().minusDays(30));
            AuditLog msft = seedAudit("CREATE", "HOLDING", "MSFT", "Seeded holding MSFT", "—", "MSFT (Microsoft Corp.) qty=10.0 price=380.00 type=STOCKS", LocalDateTime.now().minusDays(20));
            AuditLog nvda = seedAudit("UPDATE", "TRANSACTION", "NVDA", "SELL 2.0 NVDA", "NVDA qty=27.0", "SELL NVDA qty=2.0 @ 125.60 amount=251.20", LocalDateTime.now().minusDays(10));
            auditLogRepository.saveAll(List.of(aapl, msft, nvda));
        }
    }

    private AuditLog seedAudit(
            String action,
            String entityType,
            String entity,
            String summary,
            String before,
            String after,
            LocalDateTime date) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntity(entity);
        log.setSummary(summary);
        log.setBefore(before);
        log.setAfter(after);
        log.setUser("portfolio-user");
        log.setIpAddress("local");
        log.setDate(date);
        return log;
    }
}
