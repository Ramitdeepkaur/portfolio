package com.portfolio.manager.service;

import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.market.YahooFinanceClient;
import com.portfolio.manager.market.YahooQuote;
import com.portfolio.manager.repository.HoldingRepository;
import com.portfolio.manager.repository.MarketDataRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
class MarketDataServiceConcurrencyTest {

    @Autowired
    private MarketDataRepository marketDataRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Test
    void concurrentRequestsCreateOnlyOneMarketDataRow() throws Exception {
        YahooFinanceClient stubClient = new YahooFinanceClient() {
            @Override
            public Optional<YahooQuote> fetchQuote(String tickerSymbol) {
                return Optional.of(new YahooQuote(
                        "AAPL",
                        new BigDecimal("185.50"),
                        new BigDecimal("184.00"),
                        new BigDecimal("185.00"),
                        new BigDecimal("187.00"),
                        new BigDecimal("183.00"),
                        45_000_000L
                ));
            }
        };

        MarketDataService marketDataService = new MarketDataService(
                marketDataRepository,
                holdingRepository,
                stubClient,
                5
        );

        int threadCount = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch ready = new CountDownLatch(threadCount);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<MarketData>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                ready.countDown();
                start.await();
                return marketDataService.getOrCreateMarketData("AAPL");
            }));
        }

        ready.await();
        start.countDown();

        List<MarketData> results = new ArrayList<>();
        for (Future<MarketData> future : futures) {
            results.add(future.get());
        }

        executor.shutdown();

        assertEquals(1, marketDataRepository.count());
        assertTrue(results.stream().map(MarketData::getTickerSymbol).allMatch("AAPL"::equals));
    }
}
