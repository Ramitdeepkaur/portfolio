package com.portfolio.manager.repository;

import com.portfolio.manager.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {
    List<PortfolioSnapshot> findAllByOrderBySnapshotDateAsc();

    Optional<PortfolioSnapshot> findBySnapshotDate(LocalDate snapshotDate);
}
