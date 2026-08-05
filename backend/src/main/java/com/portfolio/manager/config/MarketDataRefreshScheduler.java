package com.portfolio.manager.config;

import com.portfolio.manager.service.MarketDataService;
import com.portfolio.manager.service.PortfolioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically refreshes Yahoo quotes and records a live portfolio snapshot.
 */
@Component
@ConditionalOnProperty(prefix = "portfolio.market-data", name = "scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class MarketDataRefreshScheduler {

    private static final Logger log = LoggerFactory.getLogger(MarketDataRefreshScheduler.class);

    private final MarketDataService marketDataService;
    private final PortfolioService portfolioService;

    public MarketDataRefreshScheduler(MarketDataService marketDataService, PortfolioService portfolioService) {
        this.marketDataService = marketDataService;
        this.portfolioService = portfolioService;
    }

    @Scheduled(fixedRateString = "${portfolio.market-data.refresh-ms:300000}")
    public void refreshHoldingQuotes() {
        try {
            int count = marketDataService.refreshHoldingQuotes().size();
            portfolioService.captureTodaySnapshot(portfolioService.getSummary());
            log.debug("Scheduled market data refresh completed for {} tickers", count);
        } catch (Exception ex) {
            log.warn("Scheduled market data refresh failed: {}", ex.getMessage());
        }
    }
}
