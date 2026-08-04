package com.portfolio.manager.dto;

import java.math.BigDecimal;
import java.util.List;

public class HoldingSearchCriteria {
    private String query;
    private List<String> assetTypes;
    private List<String> sectors;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private BigDecimal minGain;
    private BigDecimal maxGain;
    private String sortBy;
    private String order;
    private Integer page;
    private Integer size;

    public HoldingSearchCriteria() {
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
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

    public BigDecimal getMinValue() {
        return minValue;
    }

    public void setMinValue(BigDecimal minValue) {
        this.minValue = minValue;
    }

    public BigDecimal getMaxValue() {
        return maxValue;
    }

    public void setMaxValue(BigDecimal maxValue) {
        this.maxValue = maxValue;
    }

    public BigDecimal getMinGain() {
        return minGain;
    }

    public void setMinGain(BigDecimal minGain) {
        this.minGain = minGain;
    }

    public BigDecimal getMaxGain() {
        return maxGain;
    }

    public void setMaxGain(BigDecimal maxGain) {
        this.maxGain = maxGain;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getOrder() {
        return order;
    }

    public void setOrder(String order) {
        this.order = order;
    }

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }
}
