package com.portfolio.manager.controller;

import com.portfolio.manager.dto.WatchlistItemDTO;
import com.portfolio.manager.service.WatchlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/watchlist")
@Tag(name = "Watchlist", description = "Persisted idea list separate from holdings, with live Yahoo quotes")
public class WatchlistController {

    private final WatchlistService watchlistService;

    public WatchlistController(WatchlistService watchlistService) {
        this.watchlistService = watchlistService;
    }

    @GetMapping
    @Operation(summary = "List watchlist tickers with live quotes")
    public ResponseEntity<List<WatchlistItemDTO>> getWatchlist() {
        return ResponseEntity.ok(watchlistService.getWatchlist());
    }

    @PostMapping
    @Operation(summary = "Add a ticker to the watchlist (validated via Yahoo)")
    public ResponseEntity<WatchlistItemDTO> add(@RequestBody Map<String, String> body) {
        String ticker = body == null ? null : body.get("tickerSymbol");
        String notes = body == null ? null : body.get("notes");
        WatchlistItemDTO created = watchlistService.addTicker(ticker, notes);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @DeleteMapping("/{ticker}")
    @Operation(summary = "Remove a ticker from the watchlist")
    public ResponseEntity<Void> remove(@PathVariable String ticker) {
        watchlistService.removeTicker(ticker);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
