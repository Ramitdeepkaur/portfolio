package com.portfolio.manager.service;

import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.dto.HoldingSearchCriteria;
import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.repository.HoldingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HoldingServiceSearchTest {

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private MarketDataService marketDataService;

    @InjectMocks
    private HoldingService holdingService;

    @Test
    void searchHoldingsFiltersByQueryTypeAndSector() {
        Holding holding = new Holding(1L, "Apple Inc", "AAPL", "STOCKS", 10.0, new BigDecimal("100.00"), LocalDate.of(2024, 1, 1), "Technology", "NASDAQ", "USD");
        when(holdingRepository.findAll()).thenReturn(List.of(holding));
        when(marketDataService.getOrCreateMarketData("AAPL")).thenReturn(createMarketData());

        HoldingSearchCriteria criteria = new HoldingSearchCriteria();
        criteria.setQuery("apple");
        criteria.setAssetTypes(List.of("STOCKS"));
        criteria.setSectors(List.of("Technology"));
        criteria.setSortBy("currentValue");
        criteria.setOrder("DESC");

        List<HoldingResponseDTO> results = holdingService.searchHoldings(criteria);

        assertEquals(1, results.size());
        assertEquals("AAPL", results.get(0).getTickerSymbol());
    }

    private MarketData createMarketData() {
        MarketData marketData = new MarketData();
        marketData.setTickerSymbol("AAPL");
        marketData.setCurrentPrice(new BigDecimal("120.00"));
        marketData.setOpeningPrice(new BigDecimal("118.00"));
        return marketData;
    }
}
