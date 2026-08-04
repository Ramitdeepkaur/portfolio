package com.portfolio.manager.repository;

import com.portfolio.manager.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByHoldingIgnoreCase(String holding);
    List<Transaction> findByDateBetween(LocalDate start, LocalDate end);
}
