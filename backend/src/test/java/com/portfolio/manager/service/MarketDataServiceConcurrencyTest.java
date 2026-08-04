package com.portfolio.manager.service;

import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.repository.MarketDataRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@Import(MarketDataService.class)
class MarketDataServiceConcurrencyTest {

    @Autowired
    private MarketDataService marketDataService;

    @Autowired
    private MarketDataRepository marketDataRepository;

    @Test
    void concurrentRequestsCreateOnlyOneMarketDataRow() throws Exception {
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
