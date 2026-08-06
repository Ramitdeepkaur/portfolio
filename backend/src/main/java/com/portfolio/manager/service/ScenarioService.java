package com.portfolio.manager.service;

import com.portfolio.manager.dto.ScenarioDTO;
import com.portfolio.manager.entity.Scenario;
import com.portfolio.manager.repository.ScenarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScenarioService {

    private final ScenarioRepository scenarioRepository;
    private final AuditLogService auditLogService;

    public ScenarioService(ScenarioRepository scenarioRepository, AuditLogService auditLogService) {
        this.scenarioRepository = scenarioRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<ScenarioDTO> getAllScenarios(String type, String keyword) {
        List<Scenario> scenarios;
        if (keyword != null && !keyword.isBlank()) {
            scenarios = scenarioRepository.search(keyword.trim());
        } else if (type != null && !type.isBlank()) {
            scenarios = scenarioRepository.findByScenarioTypeOrderByCreatedAtDesc(type);
        } else {
            scenarios = scenarioRepository.findAllByOrderByCreatedAtDesc();
        }
        return scenarios.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ScenarioDTO getScenarioById(Long id) {
        return toDto(getScenario(id));
    }

    @Transactional
    public ScenarioDTO createScenario(Scenario scenario) {
        Scenario saved = scenarioRepository.save(scenario);
        auditLogService.record(
                "CREATE",
                "SCENARIO",
                saved.getName(),
                "Created scenario " + saved.getName() + " (" + saved.getScenarioType() + ")",
                "—",
                describeScenario(saved));
        return toDto(saved);
    }

    @Transactional
    public ScenarioDTO updateScenario(Long id, Scenario details) {
        Scenario existing = getScenario(id);
        String before = describeScenario(existing);
        existing.setName(details.getName());
        existing.setDescription(details.getDescription());
        existing.setScenarioType(details.getScenarioType());
        existing.setBasePortfolioValue(details.getBasePortfolioValue());
        existing.setData(details.getData());
        Scenario saved = scenarioRepository.save(existing);
        auditLogService.record(
                "UPDATE",
                "SCENARIO",
                saved.getName(),
                "Updated scenario " + saved.getName(),
                before,
                describeScenario(saved));
        return toDto(saved);
    }

    @Transactional
    public ScenarioDTO duplicateScenario(Long id) {
        Scenario source = getScenario(id);
        Scenario copy = new Scenario();
        copy.setName(source.getName() + " (copy)");
        copy.setDescription(source.getDescription());
        copy.setScenarioType(source.getScenarioType());
        copy.setBasePortfolioValue(source.getBasePortfolioValue());
        copy.setData(source.getData());
        Scenario saved = scenarioRepository.save(copy);
        auditLogService.record(
                "CREATE",
                "SCENARIO",
                saved.getName(),
                "Duplicated scenario from " + source.getName(),
                describeScenario(source),
                describeScenario(saved));
        return toDto(saved);
    }

    @Transactional
    public void deleteScenario(Long id) {
        Scenario existing = getScenario(id);
        String before = describeScenario(existing);
        String name = existing.getName();
        scenarioRepository.deleteById(id);
        auditLogService.record(
                "DELETE",
                "SCENARIO",
                name,
                "Deleted scenario " + name,
                before,
                "—");
    }

    private String describeScenario(Scenario scenario) {
        return String.format(
                "%s [%s] base=%s",
                scenario.getName(),
                scenario.getScenarioType(),
                scenario.getBasePortfolioValue());
    }

    private Scenario getScenario(Long id) {
        return scenarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found with id: " + id));
    }

    private ScenarioDTO toDto(Scenario scenario) {
        ScenarioDTO dto = new ScenarioDTO();
        dto.setId(scenario.getId());
        dto.setName(scenario.getName());
        dto.setDescription(scenario.getDescription());
        dto.setScenarioType(scenario.getScenarioType());
        dto.setBasePortfolioValue(scenario.getBasePortfolioValue());
        dto.setData(scenario.getData());
        dto.setCreatedAt(scenario.getCreatedAt());
        dto.setUpdatedAt(scenario.getUpdatedAt());
        return dto;
    }
}