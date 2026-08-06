package com.portfolio.manager.controller;

import com.portfolio.manager.dto.MarketDataDTO;
import com.portfolio.manager.dto.MarketSearchResultDTO;
import com.portfolio.manager.market.MarketDataException;
import com.portfolio.manager.service.MarketDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@Tag(name = "Market Data", description = "Live Yahoo Finance quotes, watchlist, and historical charts")
public class MarketDataController {

    private final MarketDataService marketDataService;

    public MarketDataController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh live quotes for all holding tickers from Yahoo Finance")
    public ResponseEntity<List<MarketDataDTO>> refreshHoldings() {
        return ResponseEntity.ok(marketDataService.refreshHoldingQuotes());
    }

    @GetMapping("/watchlist")
    @Operation(summary = "Get watchlist quotes (comma-separated symbols, or holdings + defaults)")
    public ResponseEntity<List<MarketDataDTO>> getWatchlist(
            @RequestParam(required = false) String symbols) {
        return ResponseEntity.ok(marketDataService.getWatchlist(symbols));
    }

    @GetMapping("/search")
    @Operation(summary = "Search matching assets dynamically from Yahoo Finance")
    public ResponseEntity<List<MarketSearchResultDTO>> searchAssets(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false) String q) {
        String searchTerm = (query != null && !query.isBlank()) ? query : (q != null ? q : "");
        return ResponseEntity.ok(marketDataService.searchAssets(searchTerm));
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

    @ExceptionHandler(MarketDataException.class)
    public ResponseEntity<Map<String, String>> handleMarketDataException(MarketDataException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", ex.getMessage()));
    }
}
