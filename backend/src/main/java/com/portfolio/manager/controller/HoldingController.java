package com.portfolio.manager.controller;

import com.portfolio.manager.dto.FilterOptionsDTO;
import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.dto.HoldingSearchCriteria;
import com.portfolio.manager.dto.SellHoldingRequestDTO;
import com.portfolio.manager.dto.SellHoldingResponseDTO;
import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.service.CsvExportImportService;
import com.portfolio.manager.service.HoldingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/holdings")
@Tag(name = "Holdings Management", description = "CRUD operations for user investment holdings")
public class HoldingController {

    private final HoldingService holdingService;
    private final CsvExportImportService csvService;

    public HoldingController(HoldingService holdingService, CsvExportImportService csvService) {
        this.holdingService = holdingService;
        this.csvService = csvService;
    }

    @GetMapping
    @Operation(summary = "Get all holdings with calculated current values and P/L")
    public ResponseEntity<List<HoldingResponseDTO>> getAllHoldings() {
        return ResponseEntity.ok(holdingService.getAllHoldings());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get holding details by ID")
    public ResponseEntity<HoldingResponseDTO> getHoldingById(@PathVariable Long id) {
        return ResponseEntity.ok(holdingService.getHoldingById(id));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter holdings")
    public ResponseEntity<List<HoldingResponseDTO>> searchHoldings(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> assetType,
            @RequestParam(required = false) List<String> sector,
            @RequestParam(required = false) BigDecimal minValue,
            @RequestParam(required = false) BigDecimal maxValue,
            @RequestParam(required = false) BigDecimal minGain,
            @RequestParam(required = false) BigDecimal maxGain,
            @RequestParam(defaultValue = "currentValue") String sortBy,
            @RequestParam(defaultValue = "DESC") String order,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        HoldingSearchCriteria criteria = new HoldingSearchCriteria();
        criteria.setQuery(query);
        criteria.setAssetTypes(assetType);
        criteria.setSectors(sector);
        criteria.setMinValue(minValue);
        criteria.setMaxValue(maxValue);
        criteria.setMinGain(minGain);
        criteria.setMaxGain(maxGain);
        criteria.setSortBy(sortBy);
        criteria.setOrder(order);
        criteria.setPage(page);
        criteria.setSize(size);
        return ResponseEntity.ok(holdingService.searchHoldings(criteria));
    }

    @GetMapping("/filters/options")
    @Operation(summary = "Get available filter values for holdings")
    public ResponseEntity<FilterOptionsDTO> getFilterOptions() {
        return ResponseEntity.ok(holdingService.getFilterOptions());
    }

    @PostMapping
    @Operation(summary = "Add a new holding investment")
    public ResponseEntity<HoldingResponseDTO> createHolding(@Valid @RequestBody Holding holding) {
        HoldingResponseDTO created = holdingService.createHolding(holding);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing holding")
    public ResponseEntity<HoldingResponseDTO> updateHolding(@PathVariable Long id, @Valid @RequestBody Holding details) {
        return ResponseEntity.ok(holdingService.updateHolding(id, details));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a holding by ID")
    public ResponseEntity<Void> deleteHolding(@PathVariable Long id) {
        holdingService.deleteHolding(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sell")
    @Operation(summary = "Sell a quantity of a holding and credit the proceeds to cash")
    public ResponseEntity<SellHoldingResponseDTO> sellHolding(@PathVariable Long id, @Valid @RequestBody SellHoldingRequestDTO request) {
        return ResponseEntity.ok(holdingService.sellHolding(id, request.getQuantity()));
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export all holdings to CSV file")
    public ResponseEntity<String> exportCsv() {
        String csvData = csvService.exportHoldingsToCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=portfolio_holdings.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import holdings from uploaded CSV file")
    public ResponseEntity<List<Holding>> importCsv(@RequestParam("file") MultipartFile file) {
        List<Holding> imported = csvService.importHoldingsFromCsv(file);
        return new ResponseEntity<>(imported, HttpStatus.CREATED);
    }
}
