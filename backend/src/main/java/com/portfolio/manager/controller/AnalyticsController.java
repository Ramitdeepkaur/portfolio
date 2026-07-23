package com.portfolio.manager.controller;

import com.portfolio.manager.dto.AllocationDTO;
import com.portfolio.manager.dto.AnalyticsDTO;
import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.dto.PerformanceDTO;
import com.portfolio.manager.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Portfolio Analytics", description = "Endpoints for top gainers, losers, risk analytics, and performance deep dives")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @Operation(summary = "Get full analytics overview")
    public ResponseEntity<AnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

    @GetMapping("/top-gainers")
    @Operation(summary = "Get top performing holdings")
    public ResponseEntity<List<HoldingResponseDTO>> getTopGainers() {
        return ResponseEntity.ok(analyticsService.getTopGainers());
    }

    @GetMapping("/top-losers")
    @Operation(summary = "Get bottom performing holdings")
    public ResponseEntity<List<HoldingResponseDTO>> getTopLosers() {
        return ResponseEntity.ok(analyticsService.getTopLosers());
    }

    @GetMapping("/allocation")
    @Operation(summary = "Get asset allocation analytics")
    public ResponseEntity<AllocationDTO> getAllocation() {
        return ResponseEntity.ok(analyticsService.getAnalytics().getAllocation());
    }

    @GetMapping("/performance")
    @Operation(summary = "Get performance analytics and returns")
    public ResponseEntity<PerformanceDTO> getPerformance() {
        return ResponseEntity.ok(analyticsService.getAnalytics().getPerformance());
    }
}
