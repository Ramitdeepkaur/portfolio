package com.portfolio.manager.service;

import com.portfolio.manager.dto.TransactionStatsDTO;
import com.portfolio.manager.entity.Transaction;
import com.portfolio.manager.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));
    }

    public List<Transaction> getTransactionsByHolding(String holding) {
        return transactionRepository.findByHoldingIgnoreCase(holding);
    }

    public List<Transaction> getTransactionsByDateRange(LocalDate start, LocalDate end) {
        return transactionRepository.findByDateBetween(start, end);
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction) {
        if (transaction.getAmount() == null) {
            BigDecimal quantity = BigDecimal.valueOf(transaction.getQuantity());
            transaction.setAmount(quantity.multiply(transaction.getPrice()));
        }
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction updateTransaction(Long id, Transaction details) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));

        transaction.setHolding(details.getHolding());
        transaction.setType(details.getType());
        transaction.setQuantity(details.getQuantity());
        transaction.setPrice(details.getPrice());
        transaction.setAmount(details.getAmount());
        transaction.setDate(details.getDate());
        transaction.setNotes(details.getNotes());

        return transactionRepository.save(transaction);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new RuntimeException("Transaction not found with id: " + id);
        }
        transactionRepository.deleteById(id);
    }

    public TransactionStatsDTO getTransactionStats() {
        List<Transaction> transactions = transactionRepository.findAll();

        BigDecimal totalVolume = transactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal buyVolume = transactions.stream()
                .filter(tx -> "BUY".equalsIgnoreCase(tx.getType()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sellVolume = transactions.stream()
                .filter(tx -> "SELL".equalsIgnoreCase(tx.getType()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        TransactionStatsDTO stats = new TransactionStatsDTO();
        stats.setTotalTransactions((long) transactions.size());
        stats.setTotalVolume(totalVolume);
        stats.setBuyVolume(buyVolume);
        stats.setSellVolume(sellVolume);
        return stats;
    }
}
