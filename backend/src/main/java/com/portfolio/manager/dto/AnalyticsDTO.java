package com.portfolio.manager.dto;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsDTO {
    private List<HoldingResponseDTO> topGainers;
    private List<HoldingResponseDTO> topLosers;
    private AllocationDTO allocation;
    private PerformanceDTO performance;
    private BigDecimal averageReturn;
    private String riskProfile;

    public AnalyticsDTO() {}

    public List<HoldingResponseDTO> getTopGainers() { return topGainers; }
    public void setTopGainers(List<HoldingResponseDTO> topGainers) { this.topGainers = topGainers; }

    public List<HoldingResponseDTO> getTopLosers() { return topLosers; }
    public void setTopLosers(List<HoldingResponseDTO> topLosers) { this.topLosers = topLosers; }

    public AllocationDTO getAllocation() { return allocation; }
    public void setAllocation(AllocationDTO allocation) { this.allocation = allocation; }

    public PerformanceDTO getPerformance() { return performance; }
    public void setPerformance(PerformanceDTO performance) { this.performance = performance; }

    public BigDecimal getAverageReturn() { return averageReturn; }
    public void setAverageReturn(BigDecimal averageReturn) { this.averageReturn = averageReturn; }

    public String getRiskProfile() { return riskProfile; }
    public void setRiskProfile(String riskProfile) { this.riskProfile = riskProfile; }
}
