package com.portfolio.manager.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "portfolio_snapshots")
public class PortfolioSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "portfolio_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal portfolioValue;

    @Column(name = "invested_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal investedAmount;

    @Column(name = "profit_loss", nullable = false, precision = 15, scale = 2)
    private BigDecimal profitLoss;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    public PortfolioSnapshot() {
    }

    public PortfolioSnapshot(Long id, BigDecimal portfolioValue, BigDecimal investedAmount, BigDecimal profitLoss, LocalDate snapshotDate) {
        this.id = id;
        this.portfolioValue = portfolioValue;
        this.investedAmount = investedAmount;
        this.profitLoss = profitLoss;
        this.snapshotDate = snapshotDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getPortfolioValue() { return portfolioValue; }
    public void setPortfolioValue(BigDecimal portfolioValue) { this.portfolioValue = portfolioValue; }

    public BigDecimal getInvestedAmount() { return investedAmount; }
    public void setInvestedAmount(BigDecimal investedAmount) { this.investedAmount = investedAmount; }

    public BigDecimal getProfitLoss() { return profitLoss; }
    public void setProfitLoss(BigDecimal profitLoss) { this.profitLoss = profitLoss; }

    public LocalDate getSnapshotDate() { return snapshotDate; }
    public void setSnapshotDate(LocalDate snapshotDate) { this.snapshotDate = snapshotDate; }
}
