package com.portfolio.manager.dto;

import java.math.BigDecimal;
import java.util.List;

public class FilterOptionsDTO {
    private List<String> assetTypes;
    private List<String> sectors;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    public FilterOptionsDTO() {
    }

    public List<String> getAssetTypes() {
        return assetTypes;
    }

    public void setAssetTypes(List<String> assetTypes) {
        this.assetTypes = assetTypes;
    }

    public List<String> getSectors() {
        return sectors;
    }

    public void setSectors(List<String> sectors) {
        this.sectors = sectors;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }
}
