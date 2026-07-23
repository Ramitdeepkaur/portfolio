package com.portfolio.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class HoldingResponseDTO {
    private Long id;
    private String assetName;
    private String tickerSymbol;
    private String assetType;
    private Double quantity;
    private BigDecimal purchasePrice;
    private LocalDate purchaseDate;
    private String sector;
    private String exchange;
    private String currency;

    // Calculated Fields
    private BigDecimal currentPrice;
    private BigDecimal currentValue;
    private BigDecimal investedValue;
    private BigDecimal profitLoss;
    private BigDecimal profitPercentage;
    private BigDecimal todayChangePercentage;

    public HoldingResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public String getTickerSymbol() { return tickerSymbol; }
    public void setTickerSymbol(String tickerSymbol) { this.tickerSymbol = tickerSymbol; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }

    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getExchange() { return exchange; }
    public void setExchange(String exchange) { this.exchange = exchange; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }

    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }

    public BigDecimal getInvestedValue() { return investedValue; }
    public void setInvestedValue(BigDecimal investedValue) { this.investedValue = investedValue; }

    public BigDecimal getProfitLoss() { return profitLoss; }
    public void setProfitLoss(BigDecimal profitLoss) { this.profitLoss = profitLoss; }

    public BigDecimal getProfitPercentage() { return profitPercentage; }
    public void setProfitPercentage(BigDecimal profitPercentage) { this.profitPercentage = profitPercentage; }

    public BigDecimal getTodayChangePercentage() { return todayChangePercentage; }
    public void setTodayChangePercentage(BigDecimal todayChangePercentage) { this.todayChangePercentage = todayChangePercentage; }
}
