package com.portfolio.manager.controller;

import com.portfolio.manager.dto.TransactionStatsDTO;
import com.portfolio.manager.entity.Transaction;
import com.portfolio.manager.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Transactions", description = "CRUD operations for transaction history")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    @Operation(summary = "Get all transactions or transactions within a date range")
    public ResponseEntity<List<Transaction>> getAllTransactions(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        if (start != null && end != null) {
            return ResponseEntity.ok(transactionService.getTransactionsByDateRange(LocalDate.parse(start), LocalDate.parse(end)));
        }
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/holding/{holding}")
    @Operation(summary = "Get transactions for a holding by ticker or name")
    public ResponseEntity<List<Transaction>> getTransactionsByHolding(@PathVariable String holding) {
        return ResponseEntity.ok(transactionService.getTransactionsByHolding(holding));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get aggregated transaction statistics")
    public ResponseEntity<TransactionStatsDTO> getTransactionStats() {
        return ResponseEntity.ok(transactionService.getTransactionStats());
    }

    @PostMapping
    @Operation(summary = "Create a new transaction")
    public ResponseEntity<Transaction> createTransaction(@Valid @RequestBody Transaction transaction) {
        Transaction created = transactionService.createTransaction(transaction);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing transaction")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable Long id, @Valid @RequestBody Transaction details) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, details));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a transaction")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
