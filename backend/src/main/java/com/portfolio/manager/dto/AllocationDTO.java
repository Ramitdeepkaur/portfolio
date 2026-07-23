package com.portfolio.manager.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AllocationDTO {
    private List<AllocationItem> byAssetType;
    private List<AllocationItem> bySector;
    private BigDecimal totalPortfolioValue;

    public AllocationDTO() {}

    public AllocationDTO(List<AllocationItem> byAssetType, List<AllocationItem> bySector, BigDecimal totalPortfolioValue) {
        this.byAssetType = byAssetType;
        this.bySector = bySector;
        this.totalPortfolioValue = totalPortfolioValue;
    }

    public List<AllocationItem> getByAssetType() { return byAssetType; }
    public void setByAssetType(List<AllocationItem> byAssetType) { this.byAssetType = byAssetType; }

    public List<AllocationItem> getBySector() { return bySector; }
    public void setBySector(List<AllocationItem> bySector) { this.bySector = bySector; }

    public BigDecimal getTotalPortfolioValue() { return totalPortfolioValue; }
    public void setTotalPortfolioValue(BigDecimal totalPortfolioValue) { this.totalPortfolioValue = totalPortfolioValue; }

    public static class AllocationItem {
        private String category;
        private BigDecimal value;
        private BigDecimal percentage;

        public AllocationItem() {}

        public AllocationItem(String category, BigDecimal value, BigDecimal percentage) {
            this.category = category;
            this.value = value;
            this.percentage = percentage;
        }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public BigDecimal getValue() { return value; }
        public void setValue(BigDecimal value) { this.value = value; }

        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
    }
}
