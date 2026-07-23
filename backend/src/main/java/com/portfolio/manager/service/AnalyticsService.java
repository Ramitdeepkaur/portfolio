package com.portfolio.manager.service;

import com.portfolio.manager.dto.AnalyticsDTO;
import com.portfolio.manager.dto.HoldingResponseDTO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final HoldingService holdingService;
    private final PortfolioService portfolioService;

    public AnalyticsService(HoldingService holdingService, PortfolioService portfolioService) {
        this.holdingService = holdingService;
        this.portfolioService = portfolioService;
    }

    public AnalyticsDTO getAnalytics() {
        List<HoldingResponseDTO> holdings = holdingService.getAllHoldings();

        List<HoldingResponseDTO> topGainers = holdings.stream()
                .sorted(Comparator.comparing(HoldingResponseDTO::getProfitPercentage).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<HoldingResponseDTO> topLosers = holdings.stream()
                .sorted(Comparator.comparing(HoldingResponseDTO::getProfitPercentage))
                .limit(5)
                .collect(Collectors.toList());

        BigDecimal sumReturn = holdings.stream()
                .map(HoldingResponseDTO::getProfitPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgReturn = holdings.isEmpty() ? BigDecimal.ZERO :
                sumReturn.divide(new BigDecimal(holdings.size()), 2, RoundingMode.HALF_UP);

        AnalyticsDTO analytics = new AnalyticsDTO();
        analytics.setTopGainers(topGainers);
        analytics.setTopLosers(topLosers);
        analytics.setAllocation(portfolioService.getAllocation());
        analytics.setPerformance(portfolioService.getPerformance());
        analytics.setAverageReturn(avgReturn);
        analytics.setRiskProfile("Moderate-Growth");

        return analytics;
    }

    public List<HoldingResponseDTO> getTopGainers() {
        return getAnalytics().getTopGainers();
    }

    public List<HoldingResponseDTO> getTopLosers() {
        return getAnalytics().getTopLosers();
    }
}
