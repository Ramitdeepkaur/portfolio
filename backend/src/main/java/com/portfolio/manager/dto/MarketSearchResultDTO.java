package com.portfolio.manager.dto;

public class MarketSearchResultDTO {
    private String tickerSymbol;
    private String assetName;
    private String exchange;
    private String assetType;
    private String sector;

    public MarketSearchResultDTO() {}

    public MarketSearchResultDTO(String tickerSymbol, String assetName, String exchange, String assetType, String sector) {
        this.tickerSymbol = tickerSymbol;
        this.assetName = assetName;
        this.exchange = exchange;
        this.assetType = assetType;
        this.sector = sector;
    }

    public String getTickerSymbol() { return tickerSymbol; }
    public void setTickerSymbol(String tickerSymbol) { this.tickerSymbol = tickerSymbol; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public String getExchange() { return exchange; }
    public void setExchange(String exchange) { this.exchange = exchange; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }
}
