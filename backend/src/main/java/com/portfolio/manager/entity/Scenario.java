package com.portfolio.manager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "scenarios")
public class Scenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Scenario name is required")
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @NotBlank(message = "Scenario type is required")
    @Column(name = "scenario_type", nullable = false, length = 30)
    private String scenarioType;

    @Column(name = "base_portfolio_value", precision = 15, scale = 2)
    private BigDecimal basePortfolioValue;

    @Lob
    @Column(name = "scenario_data", columnDefinition = "TEXT")
    private String data;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Scenario() {
    }

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