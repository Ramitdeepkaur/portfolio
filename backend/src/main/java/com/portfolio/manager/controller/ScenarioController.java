package com.portfolio.manager.controller;

import com.portfolio.manager.dto.ScenarioDTO;
import com.portfolio.manager.entity.Scenario;
import com.portfolio.manager.service.ScenarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
@Tag(name = "Scenario Management", description = "CRUD operations for portfolio planning scenarios (WHAT_IF, FORECAST, RETIREMENT)")
public class ScenarioController {

    private final ScenarioService scenarioService;

    public ScenarioController(ScenarioService scenarioService) {
        this.scenarioService = scenarioService;
    }

    @GetMapping
    @Operation(summary = "Get all scenarios, optionally filtered by type or search keyword")
    public ResponseEntity<List<ScenarioDTO>> getAllScenarios(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(scenarioService.getAllScenarios(type, keyword));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get scenario details by ID")
    public ResponseEntity<ScenarioDTO> getScenarioById(@PathVariable Long id) {
        return ResponseEntity.ok(scenarioService.getScenarioById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new scenario")
    public ResponseEntity<ScenarioDTO> createScenario(@Valid @RequestBody Scenario scenario) {
        return new ResponseEntity<>(scenarioService.createScenario(scenario), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing scenario")
    public ResponseEntity<ScenarioDTO> updateScenario(@PathVariable Long id, @Valid @RequestBody Scenario details) {
        return ResponseEntity.ok(scenarioService.updateScenario(id, details));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a scenario by ID")
    public ResponseEntity<Void> deleteScenario(@PathVariable Long id) {
        scenarioService.deleteScenario(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    @Operation(summary = "Duplicate an existing scenario")
    public ResponseEntity<ScenarioDTO> duplicateScenario(@PathVariable Long id) {
        return ResponseEntity.ok(scenarioService.duplicateScenario(id));
    }
}