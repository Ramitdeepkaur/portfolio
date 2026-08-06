package com.portfolio.manager.dto;

import java.math.BigDecimal;

public class SellHoldingResponseDTO {

    private String tickerSymbol;
    private Double quantitySold;
    private BigDecimal pricePerShare;
    private BigDecimal proceeds;
    private BigDecimal realizedGain;
    private Double remainingQuantity;
    private boolean closed;
    private BigDecimal cashAvailable;

    public SellHoldingResponseDTO() {
    }

    public String getTickerSymbol() {
        return tickerSymbol;
    }

    public void setTickerSymbol(String tickerSymbol) {
        this.tickerSymbol = tickerSymbol;
    }

    public Double getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(Double quantitySold) {
        this.quantitySold = quantitySold;
    }

    public BigDecimal getPricePerShare() {
        return pricePerShare;
    }

    public void setPricePerShare(BigDecimal pricePerShare) {
        this.pricePerShare = pricePerShare;
    }

    public BigDecimal getProceeds() {
        return proceeds;
    }

    public void setProceeds(BigDecimal proceeds) {
        this.proceeds = proceeds;
    }

    public BigDecimal getRealizedGain() {
        return realizedGain;
    }

    public void setRealizedGain(BigDecimal realizedGain) {
        this.realizedGain = realizedGain;
    }

    public Double getRemainingQuantity() {
        return remainingQuantity;
    }

    public void setRemainingQuantity(Double remainingQuantity) {
        this.remainingQuantity = remainingQuantity;
    }

    public boolean isClosed() {
        return closed;
    }

    public void setClosed(boolean closed) {
        this.closed = closed;
    }

    public BigDecimal getCashAvailable() {
        return cashAvailable;
    }

    public void setCashAvailable(BigDecimal cashAvailable) {
        this.cashAvailable = cashAvailable;
    }
}
