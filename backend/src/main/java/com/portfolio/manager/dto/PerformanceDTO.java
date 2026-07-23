package com.portfolio.manager.dto;

import com.portfolio.manager.entity.PortfolioSnapshot;
import java.math.BigDecimal;
import java.util.List;

public class PerformanceDTO {
    private BigDecimal portfolioGrowth;
    private BigDecimal cagr;
    private BigDecimal totalReturn;
    private BigDecimal absoluteReturn;
    private List<PortfolioSnapshot> history;

    public PerformanceDTO() {}

    public PerformanceDTO(BigDecimal portfolioGrowth, BigDecimal cagr, BigDecimal totalReturn, BigDecimal absoluteReturn, List<PortfolioSnapshot> history) {
        this.portfolioGrowth = portfolioGrowth;
        this.cagr = cagr;
        this.totalReturn = totalReturn;
        this.absoluteReturn = absoluteReturn;
        this.history = history;
    }

    public BigDecimal getPortfolioGrowth() { return portfolioGrowth; }
    public void setPortfolioGrowth(BigDecimal portfolioGrowth) { this.portfolioGrowth = portfolioGrowth; }

    public BigDecimal getCagr() { return cagr; }
    public void setCagr(BigDecimal cagr) { this.cagr = cagr; }

    public BigDecimal getTotalReturn() { return totalReturn; }
    public void setTotalReturn(BigDecimal totalReturn) { this.totalReturn = totalReturn; }

    public BigDecimal getAbsoluteReturn() { return absoluteReturn; }
    public void setAbsoluteReturn(BigDecimal absoluteReturn) { this.absoluteReturn = absoluteReturn; }

    public List<PortfolioSnapshot> getHistory() { return history; }
    public void setHistory(List<PortfolioSnapshot> history) { this.history = history; }
}
