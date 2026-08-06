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
    private final AuditLogService auditLogService;

    public TransactionService(TransactionRepository transactionRepository, AuditLogService auditLogService) {
        this.transactionRepository = transactionRepository;
        this.auditLogService = auditLogService;
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
        Transaction saved = transactionRepository.save(transaction);
        auditLogService.record(
                "CREATE",
                "TRANSACTION",
                saved.getHolding(),
                saved.getType() + " " + saved.getQuantity() + " " + saved.getHolding(),
                "—",
                describeTransaction(saved));
        return saved;
    }

    @Transactional
    public Transaction updateTransaction(Long id, Transaction details) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));
        String before = describeTransaction(transaction);

        transaction.setHolding(details.getHolding());
        transaction.setType(details.getType());
        transaction.setQuantity(details.getQuantity());
        transaction.setPrice(details.getPrice());
        if (details.getAmount() != null) {
            transaction.setAmount(details.getAmount());
        } else if (details.getQuantity() != null && details.getPrice() != null) {
            transaction.setAmount(BigDecimal.valueOf(details.getQuantity()).multiply(details.getPrice()));
        }
        transaction.setDate(details.getDate());
        transaction.setNotes(details.getNotes());

        Transaction saved = transactionRepository.save(transaction);
        auditLogService.record(
                "UPDATE",
                "TRANSACTION",
                saved.getHolding(),
                "Updated transaction #" + saved.getId() + " for " + saved.getHolding(),
                before,
                describeTransaction(saved));
        return saved;
    }

    @Transactional
    public void deleteTransaction(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));
        String before = describeTransaction(transaction);
        String holding = transaction.getHolding();
        transactionRepository.deleteById(id);
        auditLogService.record(
                "DELETE",
                "TRANSACTION",
                holding,
                "Deleted transaction #" + id + " for " + holding,
                before,
                "—");
    }

    private String describeTransaction(Transaction tx) {
        return String.format(
                "%s %s qty=%s @ %s amount=%s on %s%s",
                tx.getType(),
                tx.getHolding(),
                tx.getQuantity(),
                tx.getPrice(),
                tx.getAmount(),
                tx.getDate(),
                tx.getNotes() == null || tx.getNotes().isBlank() ? "" : " (" + tx.getNotes() + ")");
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
