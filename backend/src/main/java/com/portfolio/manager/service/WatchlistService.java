package com.portfolio.manager.service;

import com.portfolio.manager.dto.MarketDataDTO;
import com.portfolio.manager.dto.WatchlistItemDTO;
import com.portfolio.manager.entity.WatchlistItem;
import com.portfolio.manager.market.MarketDataException;
import com.portfolio.manager.market.YahooFinanceClient;
import com.portfolio.manager.repository.HoldingRepository;
import com.portfolio.manager.repository.WatchlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WatchlistService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final HoldingRepository holdingRepository;
    private final MarketDataService marketDataService;

    public WatchlistService(
            WatchlistItemRepository watchlistItemRepository,
            HoldingRepository holdingRepository,
            MarketDataService marketDataService) {
        this.watchlistItemRepository = watchlistItemRepository;
        this.holdingRepository = holdingRepository;
        this.marketDataService = marketDataService;
    }

    /**
     * Not read-only: loading quotes may upsert into {@code market_data} via Yahoo refresh.
     */
    @Transactional
    public List<WatchlistItemDTO> getWatchlist() {
        Set<String> held = holdingTickers();
        return watchlistItemRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(item -> toDto(item, held))
                .collect(Collectors.toList());
    }

    @Transactional
    public WatchlistItemDTO addTicker(String tickerSymbol, String notes) {
        String ticker = normalize(tickerSymbol);
        if (ticker.isEmpty()) {
            throw new IllegalArgumentException("Ticker is required");
        }
        if (YahooFinanceClient.CASH_TICKER.equals(ticker)) {
            throw new IllegalArgumentException("CASH cannot be added to the watchlist");
        }
        if (watchlistItemRepository.existsByTickerSymbolIgnoreCase(ticker)) {
            throw new IllegalArgumentException(ticker + " is already on the watchlist");
        }

        // Validate ticker against Yahoo / market data before persisting
        try {
            marketDataService.getOrCreateMarketData(ticker);
        } catch (MarketDataException ex) {
            throw new IllegalArgumentException("Could not resolve live quote for " + ticker);
        }

        WatchlistItem item = new WatchlistItem();
        item.setTickerSymbol(ticker);
        item.setNotes(notes == null ? null : notes.trim());
        WatchlistItem saved = watchlistItemRepository.save(item);
        return toDto(saved, holdingTickers());
    }

    @Transactional
    public void removeTicker(String tickerSymbol) {
        String ticker = normalize(tickerSymbol);
        if (!watchlistItemRepository.existsByTickerSymbolIgnoreCase(ticker)) {
            throw new IllegalArgumentException("Watchlist item not found: " + ticker);
        }
        watchlistItemRepository.deleteByTickerSymbolIgnoreCase(ticker);
    }

    @Transactional
    public void removeById(Long id) {
        if (!watchlistItemRepository.existsById(id)) {
            throw new IllegalArgumentException("Watchlist item not found with id: " + id);
        }
        watchlistItemRepository.deleteById(id);
    }

    private WatchlistItemDTO toDto(WatchlistItem item, Set<String> held) {
        WatchlistItemDTO dto = new WatchlistItemDTO();
        dto.setId(item.getId());
        dto.setTickerSymbol(item.getTickerSymbol());
        dto.setNotes(item.getNotes());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setInHoldings(held.contains(normalize(item.getTickerSymbol())));

        try {
            MarketDataDTO quote = marketDataService.getMarketDataDTO(item.getTickerSymbol(), null);
            dto.setCurrentPrice(quote.getCurrentPrice());
            dto.setOpeningPrice(quote.getOpeningPrice());
            dto.setClosingPrice(quote.getClosingPrice());
            dto.setHighPrice(quote.getHighPrice());
            dto.setLowPrice(quote.getLowPrice());
            dto.setVolume(quote.getVolume());
            dto.setChangeAmount(quote.getChangeAmount());
            dto.setChangePercentage(quote.getChangePercentage());
            dto.setLastUpdated(quote.getLastUpdated());
        } catch (MarketDataException ex) {
            // Keep row even if quote temporarily unavailable
        }
        return dto;
    }

    private Set<String> holdingTickers() {
        Set<String> held = new HashSet<>();
        holdingRepository.findDistinctTickerSymbols().stream()
                .map(this::normalize)
                .filter(t -> !t.isEmpty())
                .forEach(held::add);
        return held;
    }

    private String normalize(String ticker) {
        return ticker == null ? "" : ticker.trim().toUpperCase(Locale.ROOT);
    }
}
