package com.portfolio.manager.market;

import java.math.BigDecimal;

/**
 * Normalized quote fields mapped from Yahoo Finance into our MarketData entity shape.
 */
public record YahooQuote(
        String tickerSymbol,
        BigDecimal currentPrice,
        BigDecimal openingPrice,
        BigDecimal closingPrice,
        BigDecimal highPrice,
        BigDecimal lowPrice,
        Long volume
) {
}
