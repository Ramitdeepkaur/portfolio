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

    public ScenarioService(ScenarioRepository scenarioRepository) {
        this.scenarioRepository = scenarioRepository;
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
        return toDto(saved);
    }

    @Transactional
    public ScenarioDTO updateScenario(Long id, Scenario details) {
        Scenario existing = getScenario(id);
        existing.setName(details.getName());
        existing.setDescription(details.getDescription());
        existing.setScenarioType(details.getScenarioType());
        existing.setBasePortfolioValue(details.getBasePortfolioValue());
        existing.setData(details.getData());
        return toDto(scenarioRepository.save(existing));
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
        return toDto(scenarioRepository.save(copy));
    }

    @Transactional
    public void deleteScenario(Long id) {
        scenarioRepository.deleteById(id);
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