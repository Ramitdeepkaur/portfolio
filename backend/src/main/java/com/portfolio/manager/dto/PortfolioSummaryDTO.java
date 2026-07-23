package com.portfolio.manager.dto;

import java.math.BigDecimal;

public class PortfolioSummaryDTO {
    private BigDecimal totalPortfolioValue;
    private BigDecimal totalInvestedAmount;
    private BigDecimal totalProfitLoss;
    private BigDecimal profitLossPercentage;
    private int totalHoldings;
    private BigDecimal todayPortfolioChange;
    private BigDecimal todayPortfolioChangePercentage;
    private BigDecimal cashAvailable;
    private HoldingResponseDTO bestPerformingAsset;
    private HoldingResponseDTO worstPerformingAsset;

    public PortfolioSummaryDTO() {}

    public BigDecimal getTotalPortfolioValue() { return totalPortfolioValue; }
    public void setTotalPortfolioValue(BigDecimal totalPortfolioValue) { this.totalPortfolioValue = totalPortfolioValue; }

    public BigDecimal getTotalInvestedAmount() { return totalInvestedAmount; }
    public void setTotalInvestedAmount(BigDecimal totalInvestedAmount) { this.totalInvestedAmount = totalInvestedAmount; }

    public BigDecimal getTotalProfitLoss() { return totalProfitLoss; }
    public void setTotalProfitLoss(BigDecimal totalProfitLoss) { this.totalProfitLoss = totalProfitLoss; }

    public BigDecimal getProfitLossPercentage() { return profitLossPercentage; }
    public void setProfitLossPercentage(BigDecimal profitLossPercentage) { this.profitLossPercentage = profitLossPercentage; }

    public int getTotalHoldings() { return totalHoldings; }
    public void setTotalHoldings(int totalHoldings) { this.totalHoldings = totalHoldings; }

    public BigDecimal getTodayPortfolioChange() { return todayPortfolioChange; }
    public void setTodayPortfolioChange(BigDecimal todayPortfolioChange) { this.todayPortfolioChange = todayPortfolioChange; }

    public BigDecimal getTodayPortfolioChangePercentage() { return todayPortfolioChangePercentage; }
    public void setTodayPortfolioChangePercentage(BigDecimal todayPortfolioChangePercentage) { this.todayPortfolioChangePercentage = todayPortfolioChangePercentage; }

    public BigDecimal getCashAvailable() { return cashAvailable; }
    public void setCashAvailable(BigDecimal cashAvailable) { this.cashAvailable = cashAvailable; }

    public HoldingResponseDTO getBestPerformingAsset() { return bestPerformingAsset; }
    public void setBestPerformingAsset(HoldingResponseDTO bestPerformingAsset) { this.bestPerformingAsset = bestPerformingAsset; }

    public HoldingResponseDTO getWorstPerformingAsset() { return worstPerformingAsset; }
    public void setWorstPerformingAsset(HoldingResponseDTO worstPerformingAsset) { this.worstPerformingAsset = worstPerformingAsset; }
}
