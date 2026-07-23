package com.portfolio.manager.repository;

import com.portfolio.manager.entity.MarketData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MarketDataRepository extends JpaRepository<MarketData, Long> {
    Optional<MarketData> findByTickerSymbolIgnoreCase(String tickerSymbol);
}
