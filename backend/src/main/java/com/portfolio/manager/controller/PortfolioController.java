package com.portfolio.manager.controller;

import com.portfolio.manager.dto.AllocationDTO;
import com.portfolio.manager.dto.PerformanceDTO;
import com.portfolio.manager.dto.PortfolioSummaryDTO;
import com.portfolio.manager.service.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portfolio")
@Tag(name = "Portfolio Overview", description = "Endpoints for portfolio summary, allocations, and historical performance")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    @Operation(summary = "Get full portfolio summary")
    public ResponseEntity<PortfolioSummaryDTO> getPortfolio() {
        return ResponseEntity.ok(portfolioService.getSummary());
    }

    @GetMapping("/summary")
    @Operation(summary = "Get key portfolio summary metrics")
    public ResponseEntity<PortfolioSummaryDTO> getSummary() {
        return ResponseEntity.ok(portfolioService.getSummary());
    }

    @GetMapping("/allocation")
    @Operation(summary = "Get portfolio breakdown by asset type and sector")
    public ResponseEntity<AllocationDTO> getAllocation() {
        return ResponseEntity.ok(portfolioService.getAllocation());
    }

    @GetMapping("/performance")
    @Operation(summary = "Get portfolio historical performance and growth curve")
    public ResponseEntity<PerformanceDTO> getPerformance() {
        return ResponseEntity.ok(portfolioService.getPerformance());
    }
}
