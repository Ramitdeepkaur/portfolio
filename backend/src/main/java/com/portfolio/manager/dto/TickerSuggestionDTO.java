package com.portfolio.manager.dto;

public class TickerSuggestionDTO {

    private String symbol;
    private String shortName;
    private String longName;
    private String exchange;
    private String quoteType;

    public TickerSuggestionDTO() {
    }

    public TickerSuggestionDTO(String symbol, String shortName, String longName, String exchange, String quoteType) {
        this.symbol = symbol;
        this.shortName = shortName;
        this.longName = longName;
        this.exchange = exchange;
        this.quoteType = quoteType;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getLongName() {
        return longName;
    }

    public void setLongName(String longName) {
        this.longName = longName;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getQuoteType() {
        return quoteType;
    }

    public void setQuoteType(String quoteType) {
        this.quoteType = quoteType;
    }
}
