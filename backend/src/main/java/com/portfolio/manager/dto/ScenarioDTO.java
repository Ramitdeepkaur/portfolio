package com.portfolio.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ScenarioDTO {

    private Long id;
    private String name;
    private String description;
    private String scenarioType;
    private BigDecimal basePortfolioValue;
    private String data;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ScenarioDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getScenarioType() { return scenarioType; }
    public void setScenarioType(String scenarioType) { this.scenarioType = scenarioType; }

    public BigDecimal getBasePortfolioValue() { return basePortfolioValue; }
    public void setBasePortfolioValue(BigDecimal basePortfolioValue) { this.basePortfolioValue = basePortfolioValue; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}