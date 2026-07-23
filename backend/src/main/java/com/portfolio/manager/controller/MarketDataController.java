package com.portfolio.manager.controller;

import com.portfolio.manager.dto.MarketDataDTO;
import com.portfolio.manager.service.MarketDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/market")
@Tag(name = "Market Data", description = "Stock market price lookups and historical price chart endpoints")
public class MarketDataController {

    private final MarketDataService marketDataService;

    public MarketDataController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping("/{ticker}")
    @Operation(summary = "Get current market data for ticker")
    public ResponseEntity<MarketDataDTO> getMarketData(@PathVariable String ticker) {
        return ResponseEntity.ok(marketDataService.getMarketDataDTO(ticker, "1m"));
    }

    @GetMapping("/{ticker}/history")
    @Operation(summary = "Get historical price chart data for ticker (range: 1w, 1m, 6m, 1y, 5y)")
    public ResponseEntity<MarketDataDTO> getHistory(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "1m") String range) {
        return ResponseEntity.ok(marketDataService.getMarketDataDTO(ticker, range));
    }

    @GetMapping("/{ticker}/performance")
    @Operation(summary = "Get performance stats for ticker")
    public ResponseEntity<MarketDataDTO> getPerformance(@PathVariable String ticker) {
        return ResponseEntity.ok(marketDataService.getMarketDataDTO(ticker, "1y"));
    }
}
