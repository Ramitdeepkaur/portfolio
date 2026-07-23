package com.portfolio.manager.repository;

import com.portfolio.manager.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {
    List<Holding> findByAssetTypeIgnoreCase(String assetType);
    List<Holding> findByTickerSymbolIgnoreCase(String tickerSymbol);

    @Query("SELECT DISTINCT h.tickerSymbol FROM Holding h")
    List<String> findDistinctTickerSymbols();
}
