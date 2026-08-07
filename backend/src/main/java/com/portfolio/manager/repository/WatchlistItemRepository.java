package com.portfolio.manager.repository;

import com.portfolio.manager.entity.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    List<WatchlistItem> findAllByOrderByCreatedAtDesc();

    Optional<WatchlistItem> findByTickerSymbolIgnoreCase(String tickerSymbol);

    boolean existsByTickerSymbolIgnoreCase(String tickerSymbol);

    void deleteByTickerSymbolIgnoreCase(String tickerSymbol);
}
