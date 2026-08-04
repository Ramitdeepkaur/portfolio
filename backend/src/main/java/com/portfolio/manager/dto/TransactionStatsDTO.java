package com.portfolio.manager.dto;

import java.math.BigDecimal;

public class TransactionStatsDTO {

    private Long totalTransactions;
    private BigDecimal totalVolume;
    private BigDecimal buyVolume;
    private BigDecimal sellVolume;

    public TransactionStatsDTO() {
    }

    public Long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(Long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public BigDecimal getTotalVolume() {
        return totalVolume;
    }

    public void setTotalVolume(BigDecimal totalVolume) {
        this.totalVolume = totalVolume;
    }

    public BigDecimal getBuyVolume() {
        return buyVolume;
    }

    public void setBuyVolume(BigDecimal buyVolume) {
        this.buyVolume = buyVolume;
    }

    public BigDecimal getSellVolume() {
        return sellVolume;
    }

    public void setSellVolume(BigDecimal sellVolume) {
        this.sellVolume = sellVolume;
    }
}
