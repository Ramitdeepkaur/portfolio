package com.portfolio.manager.service;

import com.portfolio.manager.dto.MarketSearchResultDTO;
import com.portfolio.manager.market.YahooFinanceClient;
import com.portfolio.manager.repository.HoldingRepository;
import com.portfolio.manager.repository.MarketDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketDataServiceSearchTest {

    @Mock
    private MarketDataRepository marketDataRepository;

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private YahooFinanceClient yahooFinanceClient;

    private MarketDataService marketDataService;

    @BeforeEach
    void setUp() {
        marketDataService = new MarketDataService(marketDataRepository, holdingRepository, yahooFinanceClient, 5);
    }

    @Test
    void searchAssetsWithEmptyQueryReturnsEmptyList() {
        List<MarketSearchResultDTO> results = marketDataService.searchAssets("   ");
        assertTrue(results.isEmpty());
        verifyNoInteractions(yahooFinanceClient);
    }

    @Test
    void searchAssetsDelegatesToYahooFinanceClient() {
        MarketSearchResultDTO dto = new MarketSearchResultDTO("AAPL", "Apple Inc.", "NASDAQ", "STOCKS", "Technology");
        when(yahooFinanceClient.searchAssets("Apple")).thenReturn(List.of(dto));

        List<MarketSearchResultDTO> results = marketDataService.searchAssets("Apple");
        assertEquals(1, results.size());
        assertEquals("AAPL", results.get(0).getTickerSymbol());
        assertEquals("Apple Inc.", results.get(0).getAssetName());
        assertEquals("NASDAQ", results.get(0).getExchange());
        assertEquals("STOCKS", results.get(0).getAssetType());
    }
}
