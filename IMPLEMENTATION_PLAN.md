# Portfolio Management System - Feature Implementation Plan

## Features to Implement

This document outlines 4 major features to be added to the Portfolio Management System:
1. Advanced Filtering & Search
2. Transaction History & Audit Trail
3. Portfolio Scenarios & Forecasting
4. Dashboard Customization

---

## Feature 1: Advanced Filtering & Search

### Overview
Implement advanced search, filtering, and sorting capabilities for the Holdings page to help users discover and manage investments more efficiently.

### Database Changes (Backend)
1. Create a custom `HoldingSearchCriteria` class to handle multiple filter parameters
2. Create database indices on frequently searched columns:
   - `asset_name`
   - `ticker_symbol`
   - `asset_type`
   - `sector`
3. Update `HoldingRepository` with custom query methods using `@Query` annotation:
   - `findByAdvancedCriteria(SearchCriteria)` - custom JPQL query
   - `findByAssetNameContainingIgnoreCase(String)`
   - `findByTickerSymbolContainingIgnoreCase(String)`
   - `findBySector(String)`
   - `findByAssetType(String)`

### API Endpoints (Backend)
```
GET /api/holdings/search?query=string&assetType=string&sector=string&minValue=number&maxValue=number&minGain=number&maxGain=number&sortBy=string&order=ASC|DESC
- Supports multiple filters at once
- Returns paginated results (page, size parameters)
- Supports various sort options (currentValue, profitLoss, purchaseDate, quantity, percentageGain)

GET /api/holdings/filters/options
- Returns available filter options: [asset types, sectors, price ranges]
```

### Service Layer (Backend)
Create `HoldingSearchService`:
- `searchHoldings(criteria)` - main search method
- `applyFilters(holdings, filters)` - apply multiple filters
- `applySort(holdings, sortField, order)` - sorting logic
- `buildSearchCriteria(params)` - parse request parameters
- Implement caching for filter options (sectors, asset types)

### DTOs (Backend)
```java
public class HoldingSearchCriteria {
    private String query; // search by name/ticker
    private List<String> assetTypes;
    private List<String> sectors;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private BigDecimal minGain;
    private BigDecimal maxGain;
    private String sortBy; // currentValue, profitLoss, purchaseDate, quantity, percentageGain
    private SortOrder order; // ASC, DESC
    private Integer page;
    private Integer size;
}

public class FilterOptionsDTO {
    private List<String> assetTypes;
    private List<String> sectors;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
}
```

### Frontend Components
1. Create `AdvancedSearchBar.jsx`:
   - Text input for name/ticker search (debounced)
   - Multi-select dropdowns for asset types
   - Multi-select dropdown for sectors
   - Slider for value range (min/max investment value)
   - Slider for gain/loss range (min/max percentage gain)
   - Sort dropdown (Current Value, P/L, Purchase Date, Quantity, % Gain)
   - Sort order toggle (ASC/DESC)
   - Apply Filters button
   - Clear Filters button

2. Update `HoldingsTable.jsx`:
   - Add filter state management
   - Show applied filters as chips/badges
   - Display result count
   - Add pagination controls if results > 20
   - Add "no results" empty state

3. Create `SearchSummary.jsx`:
   - Display active filters
   - Show result statistics (e.g., "25 holdings found")
   - Quick clear filters button

### Frontend State Management (Context API)
Update `PortfolioContext`:
```javascript
- searchFilters: {query, assetTypes, sectors, priceRange, gainRange, sortBy, sortOrder}
- searchResults: []
- isSearching: boolean
- filterOptions: {assetTypes[], sectors[]}
- applyFilters(criteria)
- clearFilters()
```

### API Client Updates (`frontend/src/api/client.js`)
```javascript
- searchHoldings(criteria)
- getFilterOptions()
```

### UI/UX Features
- Real-time search with debounce (300ms)
- Instant sort without page reload
- Visual feedback for active filters (chip display)
- Save filter presets (optional advanced feature)
- Keyboard shortcuts for quick search
- Mobile-responsive filter panel

---

## Feature 2: Transaction History & Audit Trail

### Database Schema Changes (Backend)

#### Create Transaction Table
```sql
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    holding_id BIGINT NOT NULL,
    transaction_type ENUM('BUY', 'SELL', 'MODIFY', 'DIVIDEND') NOT NULL,
    quantity DECIMAL(15, 4),
    price_per_unit DECIMAL(15, 2),
    total_amount DECIMAL(20, 2),
    transaction_date DATETIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE,
    INDEX idx_holding_id (holding_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_type (transaction_type)
);
```

#### Create Audit Log Table
```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_timestamp (changed_at),
    INDEX idx_action (action)
);
```

### Entity Classes (Backend)

#### Transaction.java
```java
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "holding_id", nullable = false)
    private Holding holding;
    
    @Enumerated(EnumType.STRING)
    private TransactionType type; // BUY, SELL, MODIFY, DIVIDEND
    
    @Column(precision = 15, scale = 4)
    private BigDecimal quantity;
    
    @Column(name = "price_per_unit", precision = 15, scale = 2)
    private BigDecimal pricePerUnit;
    
    @Column(name = "total_amount", precision = 20, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and setters...
}

public enum TransactionType {
    BUY("Purchase"),
    SELL("Sale"),
    MODIFY("Modification"),
    DIVIDEND("Dividend Payment");
    
    private String label;
}
```

#### AuditLog.java
```java
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "entity_type")
    private String entityType;
    
    @Column(name = "entity_id")
    private Long entityId;
    
    @Column(name = "action")
    private String action; // CREATE, UPDATE, DELETE
    
    @Column(columnDefinition = "JSON")
    private String oldValues; // JSON format
    
    @Column(columnDefinition = "JSON")
    private String newValues; // JSON format
    
    @Column(name = "changed_by")
    private String changedBy;
    
    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @PrePersist
    protected void onCreate() {
        changedAt = LocalDateTime.now();
    }
    
    // Getters and setters...
}
```

### Repository Layer (Backend)

```java
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByHoldingOrderByTransactionDateDesc(Holding holding);
    List<Transaction> findByHoldingAndTypeOrderByTransactionDateDesc(Holding holding, TransactionType type);
    List<Transaction> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end);
    List<Transaction> findByTypeOrderByTransactionDateDesc(TransactionType type);
    Page<Transaction> findAll(Pageable pageable);
}

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByChangedAtDesc(String entityType, Long entityId);
    List<AuditLog> findByActionAndChangedAtBetween(String action, LocalDateTime start, LocalDateTime end);
    Page<AuditLog> findAll(Pageable pageable);
}
```

### Service Layer (Backend)

#### TransactionService.java
```java
@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final HoldingRepository holdingRepository;
    
    // Create transaction when holding is created/updated/deleted
    public Transaction recordTransaction(Long holdingId, TransactionType type, BigDecimal quantity, BigDecimal price, String notes) {...}
    
    // Get all transactions for a holding
    public List<TransactionDTO> getHoldingTransactions(Long holdingId) {...}
    
    // Get transactions by date range
    public List<TransactionDTO> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end) {...}
    
    // Get transaction statistics
    public TransactionStatsDTO getTransactionStats() {...}
    
    // Export transactions to CSV
    public String exportTransactionsToCsv() {...}
}
```

#### AuditLogService.java
```java
@Service
@Aspect
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    
    // Log entity changes automatically using AOP
    @Around("@annotation(Auditable)")
    public Object auditHoldingChanges(ProceedingJoinPoint joinPoint) throws Throwable {...}
    
    // Get audit logs for entity
    public List<AuditLogDTO> getEntityAuditLogs(String entityType, Long entityId) {...}
    
    // Get audit logs by date range
    public List<AuditLogDTO> getAuditLogsByDateRange(LocalDateTime start, LocalDateTime end) {...}
}
```

### API Endpoints (Backend)

```
// Transaction endpoints
GET /api/transactions - Get all transactions (paginated)
GET /api/transactions/holding/{holdingId} - Get transactions for specific holding
GET /api/transactions/stats - Get transaction statistics
GET /api/transactions/export/csv - Export transactions to CSV
POST /api/transactions - Create transaction manually
DELETE /api/transactions/{id} - Delete transaction

// Audit log endpoints
GET /api/audit-logs - Get all audit logs (paginated)
GET /api/audit-logs/holding/{holdingId} - Get audit logs for a holding
GET /api/audit-logs/date-range?start=&end= - Get logs by date range
GET /api/audit-logs/stats - Get audit statistics
```

### DTOs (Backend)

```java
public class TransactionDTO {
    private Long id;
    private Long holdingId;
    private String assetName;
    private String tickerSymbol;
    private TransactionType type;
    private BigDecimal quantity;
    private BigDecimal pricePerUnit;
    private BigDecimal totalAmount;
    private LocalDateTime transactionDate;
    private String notes;
}

public class AuditLogDTO {
    private Long id;
    private String entityType;
    private Long entityId;
    private String action;
    private Map<String, Object> oldValues;
    private Map<String, Object> newValues;
    private String changedBy;
    private LocalDateTime changedAt;
}

public class TransactionStatsDTO {
    private int totalTransactions;
    private int buys;
    private int sells;
    private BigDecimal totalBoughtAmount;
    private BigDecimal totalSoldAmount;
    private LocalDateTime earliestTransaction;
}
```

### Frontend Components

1. **TransactionHistoryPage.jsx** - Display all transactions in a detailed table
2. **AuditTrailPage.jsx** - Display all changes made to holdings
3. **TransactionModal.jsx** - Modal to add/edit transaction manually
4. **HoldingHistoryPanel.jsx** - Show transaction and audit history for specific holding

### Frontend API Client Updates

```javascript
- getTransactions()
- getHoldingTransactions(holdingId)
- getTransactionsByDateRange(start, end)
- getTransactionStats()
- getAuditLogs()
- getHoldingAuditLogs(holdingId)
- exportTransactionsCsv()
```

### Frontend State Management

Update PortfolioContext with:
- transactions: []
- auditLogs: []
- transactionStats: {}
- loadTransactions()
- loadAuditLogs()

---

## Feature 3: Portfolio Scenarios & Forecasting

### Database Schema Changes (Backend)

#### Scenario Table
```sql
CREATE TABLE portfolio_scenarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    scenario_name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_type ENUM('WHAT_IF', 'FORECAST', 'RETIREMENT') NOT NULL,
    base_portfolio_snapshot_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (scenario_type),
    INDEX idx_created (created_at)
);
```

#### Scenario Changes Table
```sql
CREATE TABLE scenario_changes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    scenario_id BIGINT NOT NULL,
    holding_id BIGINT,
    change_type ENUM('ADD', 'REMOVE', 'MODIFY_QUANTITY', 'MODIFY_PRICE') NOT NULL,
    quantity_change DECIMAL(15, 4),
    price_change DECIMAL(15, 2),
    holding_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES portfolio_scenarios(id) ON DELETE CASCADE,
    FOREIGN KEY (holding_id) REFERENCES holdings(id),
    INDEX idx_scenario (scenario_id)
);
```

#### Forecast Assumptions Table
```sql
CREATE TABLE forecast_assumptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    scenario_id BIGINT NOT NULL,
    annual_return_rate DECIMAL(5, 2),
    inflation_rate DECIMAL(5, 2),
    years_to_forecast INT,
    volatility DECIMAL(5, 2),
    monthly_contribution DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES portfolio_scenarios(id) ON DELETE CASCADE,
    INDEX idx_scenario (scenario_id)
);
```

#### Forecast Results Table
```sql
CREATE TABLE forecast_results (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    scenario_id BIGINT NOT NULL,
    year INT,
    month INT,
    projected_portfolio_value DECIMAL(20, 2),
    projected_invested_amount DECIMAL(20, 2),
    projected_gain_loss DECIMAL(20, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES portfolio_scenarios(id) ON DELETE CASCADE,
    INDEX idx_scenario_year (scenario_id, year)
);
```

### Entity Classes (Backend)

#### PortfolioScenario.java
```java
@Entity
@Table(name = "portfolio_scenarios")
public class PortfolioScenario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String scenarioName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    private ScenarioType scenarioType;
    
    @Column(name = "base_portfolio_snapshot_id")
    private Long basePortfolioSnapshotId;
    
    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScenarioChange> changes;
    
    @OneToOne(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = true)
    private ForecastAssumptions assumptions;
    
    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ForecastResult> results;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Getters and setters...
}

public enum ScenarioType {
    WHAT_IF("What-If Analysis"),
    FORECAST("Future Projection"),
    RETIREMENT("Retirement Planning");
    
    private String label;
}
```

#### ScenarioChange.java
```java
@Entity
@Table(name = "scenario_changes")
public class ScenarioChange {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "scenario_id", nullable = false)
    private PortfolioScenario scenario;
    
    @ManyToOne
    @JoinColumn(name = "holding_id")
    private Holding holding;
    
    @Enumerated(EnumType.STRING)
    private ChangeType changeType;
    
    @Column(precision = 15, scale = 4)
    private BigDecimal quantityChange;
    
    @Column(name = "price_change", precision = 15, scale = 2)
    private BigDecimal priceChange;
    
    @Column(columnDefinition = "JSON")
    private String holdingData;
    
    // Getters and setters...
}

public enum ChangeType {
    ADD("Add Holding"),
    REMOVE("Remove Holding"),
    MODIFY_QUANTITY("Modify Quantity"),
    MODIFY_PRICE("Modify Price");
    
    private String label;
}
```

#### ForecastAssumptions.java
```java
@Entity
@Table(name = "forecast_assumptions")
public class ForecastAssumptions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "scenario_id", nullable = false)
    private PortfolioScenario scenario;
    
    @Column(name = "annual_return_rate", precision = 5, scale = 2)
    private BigDecimal annualReturnRate;
    
    @Column(name = "inflation_rate", precision = 5, scale = 2)
    private BigDecimal inflationRate;
    
    @Column(name = "years_to_forecast")
    private Integer yearsToForecast;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal volatility;
    
    @Column(name = "monthly_contribution", precision = 15, scale = 2)
    private BigDecimal monthlyContribution;
    
    // Getters and setters...
}
```

#### ForecastResult.java
```java
@Entity
@Table(name = "forecast_results")
public class ForecastResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "scenario_id", nullable = false)
    private PortfolioScenario scenario;
    
    @Column(nullable = false)
    private Integer year;
    
    @Column(nullable = false)
    private Integer month;
    
    @Column(name = "projected_portfolio_value", precision = 20, scale = 2)
    private BigDecimal projectedPortfolioValue;
    
    @Column(name = "projected_invested_amount", precision = 20, scale = 2)
    private BigDecimal projectedInvestedAmount;
    
    @Column(name = "projected_gain_loss", precision = 20, scale = 2)
    private BigDecimal projectedGainLoss;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    // Getters and setters...
}
```

### Repository Layer (Backend)

```java
@Repository
public interface ScenarioRepository extends JpaRepository<PortfolioScenario, Long> {
    List<PortfolioScenario> findByScenarioType(ScenarioType type);
    List<PortfolioScenario> findByOrderByCreatedAtDesc();
}

@Repository
public interface ForecastResultRepository extends JpaRepository<ForecastResult, Long> {
    List<ForecastResult> findByScenarioIdOrderByYearAscMonthAsc(Long scenarioId);
}
```

### Service Layer (Backend)

#### ScenarioService.java
```java
@Service
public class ScenarioService {
    // Create scenario
    public PortfolioScenarioDTO createScenario(String name, String description, ScenarioType type) {...}
    
    // Add changes to scenario
    public void addChange(Long scenarioId, ScenarioChange change) {...}
    
    // Calculate scenario portfolio
    public PortfolioSummaryDTO calculateScenarioPortfolio(Long scenarioId) {...}
    
    // Get/Delete/List scenarios
    public PortfolioScenarioDTO getScenario(Long scenarioId) {...}
    public List<PortfolioScenarioDTO> getAllScenarios() {...}
    public void deleteScenario(Long scenarioId) {...}
}
```

#### ForecastingService.java
```java
@Service
public class ForecastingService {
    // Generate forecast based on assumptions
    public void generateForecast(Long scenarioId, ForecastAssumptions assumptions) {...}
    
    // Get forecast results
    public List<ForecastResultDTO> getForecastResults(Long scenarioId) {...}
    
    // Calculate retirement planning metrics
    public RetirementPlanDTO calculateRetirementPlan(Long scenarioId, BigDecimal targetAmount, int retirementAge) {...}
}
```

### API Endpoints (Backend)

```
GET /api/scenarios - Get all scenarios
POST /api/scenarios - Create new scenario
GET /api/scenarios/{id} - Get scenario details
DELETE /api/scenarios/{id} - Delete scenario
POST /api/scenarios/{id}/changes - Add change
GET /api/scenarios/{id}/forecast-results - Get forecast results
POST /api/scenarios/{id}/forecast - Generate forecast
GET /api/scenarios/{id}/comparison - Compare with original
GET /api/scenarios/{id}/retirement-plan - Retirement metrics
```

### DTOs (Backend)

```java
public class PortfolioScenarioDTO {
    private Long id;
    private String scenarioName;
    private String description;
    private ScenarioType scenarioType;
    private List<ScenarioChangeDTO> changes;
    private ForecastAssumptionsDTO assumptions;
    private LocalDateTime createdAt;
}

public class ForecastResultDTO {
    private Integer year;
    private Integer month;
    private BigDecimal projectedPortfolioValue;
    private BigDecimal projectedInvestedAmount;
    private BigDecimal projectedGainLoss;
}

public class WhatIfComparisonDTO {
    private PortfolioSummaryDTO originalPortfolio;
    private PortfolioSummaryDTO scenarioPortfolio;
    private BigDecimal valueDifference;
    private BigDecimal gainLossDifference;
    private List<HoldingComparisonDTO> holdingComparisons;
}

public class RetirementPlanDTO {
    private BigDecimal currentPortfolioValue;
    private BigDecimal targetAmount;
    private Integer yearsToRetirement;
    private Boolean canReachTarget;
    private BigDecimal requiredMonthlyContribution;
    private BigDecimal requiredAnnualReturn;
}
```

### Frontend Components

1. **ScenarioListPage.jsx** - Display all scenarios
2. **WhatIfAnalysisPanel.jsx** - Modify holdings and compare
3. **ForecastingPanel.jsx** - Set assumptions and view forecast
4. **RetirementPlannerPage.jsx** - Calculate retirement metrics
5. **ScenarioComparisonChart.jsx** - Compare multiple scenarios

### Frontend API Client Updates

```javascript
- getScenarios()
- createScenario(data)
- getScenarioDetails(id)
- generateForecast(scenarioId, assumptions)
- getForecastResults(scenarioId)
- compareWithOriginal(scenarioId)
- getRetirementPlan(scenarioId, params)
```

---

## Feature 4: Dashboard Customization

### Database Schema Changes (Backend)

#### Dashboard Layouts Table
```sql
CREATE TABLE dashboard_layouts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    layout_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_default (is_default),
    INDEX idx_active (is_active)
);
```

#### Dashboard Widgets Table
```sql
CREATE TABLE dashboard_widgets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    layout_id BIGINT NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    widget_name VARCHAR(255),
    position_x INT NOT NULL,
    position_y INT NOT NULL,
    width INT DEFAULT 4,
    height INT DEFAULT 2,
    is_visible BOOLEAN DEFAULT TRUE,
    widget_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (layout_id) REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
    INDEX idx_layout (layout_id),
    INDEX idx_type (widget_type)
);
```

### Entity Classes (Backend)

#### DashboardLayout.java
```java
@Entity
@Table(name = "dashboard_layouts")
public class DashboardLayout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String layoutName;
    
    @Column(name = "is_default")
    private Boolean isDefault = false;
    
    @Column(name = "is_active")
    private Boolean isActive = false;
    
    @OneToMany(mappedBy = "layout", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("positionY ASC, positionX ASC")
    private List<DashboardWidget> widgets = new ArrayList<>();
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and setters...
}
```

#### DashboardWidget.java
```java
@Entity
@Table(name = "dashboard_widgets")
public class DashboardWidget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "layout_id", nullable = false)
    private DashboardLayout layout;
    
    @Column(name = "widget_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private WidgetType widgetType;
    
    @Column(name = "widget_name")
    private String widgetName;
    
    @Column(name = "position_x", nullable = false)
    private Integer positionX;
    
    @Column(name = "position_y", nullable = false)
    private Integer positionY;
    
    @Column(nullable = false)
    private Integer width = 4;
    
    @Column(nullable = false)
    private Integer height = 2;
    
    @Column(name = "is_visible")
    private Boolean isVisible = true;
    
    @Column(columnDefinition = "JSON")
    private String widgetConfig;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    // Getters and setters...
}

public enum WidgetType {
    PORTFOLIO_SUMMARY("Portfolio Summary"),
    ALLOCATION_CHART("Allocation Chart"),
    PERFORMANCE_CHART("Performance Chart"),
    TOP_GAINERS("Top Gainers"),
    TOP_LOSERS("Top Losers"),
    RECENT_HOLDINGS("Recent Holdings"),
    GAIN_LOSS_SUMMARY("Gain/Loss Summary"),
    SECTOR_ALLOCATION("Sector Allocation"),
    ASSET_TYPE_ALLOCATION("Asset Type Allocation"),
    QUICK_ACTIONS("Quick Actions"),
    MARKET_OVERVIEW("Market Overview"),
    WATCHLIST("Watchlist"),
    PORTFOLIO_PROGRESS("Portfolio Progress");
    
    private String label;
}
```

### Repository Layer (Backend)

```java
@Repository
public interface DashboardLayoutRepository extends JpaRepository<DashboardLayout, Long> {
    Optional<DashboardLayout> findByIsActive(Boolean isActive);
    List<DashboardLayout> findAll();
    Optional<DashboardLayout> findByIsDefault(Boolean isDefault);
}

@Repository
public interface DashboardWidgetRepository extends JpaRepository<DashboardWidget, Long> {
    List<DashboardWidget> findByLayoutIdOrderByPositionYAscPositionXAsc(Long layoutId);
}
```

### Service Layer (Backend)

#### DashboardService.java
```java
@Service
public class DashboardService {
    // Get active dashboard
    public DashboardLayoutDTO getActiveDashboard() {...}
    
    // Layout management
    public List<DashboardLayoutDTO> getAllLayouts() {...}
    public DashboardLayoutDTO createLayout(String layoutName) {...}
    public DashboardLayoutDTO duplicateLayout(Long sourceLayoutId, String newName) {...}
    public void setActiveLayout(Long layoutId) {...}
    public void deleteLayout(Long layoutId) {...}
    
    // Widget management
    public DashboardWidgetDTO addWidget(Long layoutId, WidgetType type, String name) {...}
    public DashboardWidgetDTO updateWidgetPosition(Long widgetId, Integer x, Integer y, Integer width, Integer height) {...}
    public void toggleWidgetVisibility(Long widgetId) {...}
    public DashboardWidgetDTO updateWidgetConfig(Long widgetId, String config) {...}
    public void removeWidget(Long widgetId) {...}
    
    // Get available widgets
    public List<AvailableWidgetDTO> getAvailableWidgets() {...}
    
    // Import/Export
    public String exportLayout(Long layoutId) {...}
    public DashboardLayoutDTO importLayout(String layoutJson) {...}
}
```

### API Endpoints (Backend)

```
// Layout Management
GET /api/dashboard - Get active dashboard
GET /api/dashboard/layouts - Get all layouts
POST /api/dashboard/layouts - Create layout
POST /api/dashboard/layouts/{id}/duplicate - Duplicate layout
PUT /api/dashboard/layouts/{id}/activate - Set as active
DELETE /api/dashboard/layouts/{id} - Delete layout

// Widget Management
GET /api/dashboard/available-widgets - Get available widgets
POST /api/dashboard/widgets - Add widget
PUT /api/dashboard/widgets/{id} - Update widget
PUT /api/dashboard/widgets/{id}/visibility - Toggle visibility
DELETE /api/dashboard/widgets/{id} - Remove widget

// Import/Export
POST /api/dashboard/export - Export layout
POST /api/dashboard/import - Import layout
```

### DTOs (Backend)

```java
public class DashboardLayoutDTO {
    private Long id;
    private String layoutName;
    private Boolean isDefault;
    private Boolean isActive;
    private List<DashboardWidgetDTO> widgets;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

public class DashboardWidgetDTO {
    private Long id;
    private WidgetType widgetType;
    private String widgetName;
    private Integer positionX;
    private Integer positionY;
    private Integer width;
    private Integer height;
    private Boolean isVisible;
    private Map<String, Object> widgetConfig;
}

public class AvailableWidgetDTO {
    private WidgetType type;
    private String label;
    private String description;
    private Integer minWidth;
    private Integer minHeight;
    private Boolean configurable;
}
```

### Frontend Components

1. **DashboardCustomizer.jsx** - Main drag-and-drop component
2. **AvailableWidgetsPanel.jsx** - Widget selection panel
3. **LayoutSelector.jsx** - Select/create layouts
4. **WidgetWrapper.jsx** - Wrapper for all widgets
5. **Individual widget components** (PortfolioSummaryWidget, AllocationChartWidget, etc.)

### Frontend Libraries

```
npm install react-grid-layout
```

### Frontend API Client Updates

```javascript
// Dashboard
- getDashboard()
- getLayouts()
- createLayout(name)
- setActiveLayout(id)
- deleteLayout(id)

// Widgets
- getAvailableWidgets()
- addWidget(layoutId, widgetType, name)
- updateWidgetPosition(widgetId, data)
- toggleWidgetVisibility(widgetId)
- removeWidget(widgetId)

// Import/Export
- exportLayout(layoutId)
- importLayout(jsonData)
```

---

## Implementation Priority

| Feature | Complexity | Effort | Priority |
|---------|-----------|--------|----------|
| Advanced Filtering & Search | Medium | 3-4 days | High |
| Transaction History & Audit Trail | High | 5-6 days | High |
| Portfolio Scenarios & Forecasting | Very High | 8-10 days | Medium |
| Dashboard Customization | Medium | 4-5 days | Medium |

---

## Next Steps

1. Review this implementation plan
2. For each feature, follow the specific instructions in prompts-for-claude.md
3. Implement in suggested order
4. Test each feature thoroughly
5. Deploy and gather user feedback
