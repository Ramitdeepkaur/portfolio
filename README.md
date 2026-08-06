# FolioTrack - Portfolio Management System

A modern, full-stack financial investment portfolio management application built with **Spring Boot** (Java) REST API backend and **React** (Vite + Tailwind CSS) responsive frontend.

---

## 🌟 Overview

**FolioTrack** enables individual investors to manage, monitor, and analyze their multi-asset financial investments in real time. The system supports **Stocks, ETFs, Mutual Funds, Bonds, and Cash Holdings**, providing live market data integrations, portfolio allocation analytics, performance tracking, scenario modeling, and an audit trail.

---

## 🚀 Key Features

* **🔍 Asset Search with Real-time Autocomplete**
  * Debounced live search integration with **Yahoo Finance API** as you type in the **Add Asset** workflow.
  * Autocomplete suggestions displaying Asset Name, Ticker Symbol, Exchange, Sector, and Asset Type.
  * Automatic population of form fields and instant quote fetching upon selecting a matching suggestion.

* **📊 Portfolio Dashboard**
  * High-level summary of **Total Portfolio Value**, **Total Invested Capital**, **Total Gain/Loss ($ & %)**, and **Available Cash**.
  * Quick metrics for **Best Performing Asset**, **Worst Performing Asset**, and asset breakdown.
  * Real-time ticker watchlist ticker bar with live price updates.

* **💼 Holdings Management**
  * Full CRUD operations (Add, Edit, Delete, Sell) for investment holdings.
  * Category filtering (Stocks, ETFs, Mutual Funds, Bonds, Cash) and search by asset name or ticker.
  * Dynamic total cost basis calculation and live gain/loss calculation per holding.

* **📈 Live Market Data & Watchlist**
  * Live quote synchronization via Yahoo Finance.
  * Historical chart data (1W, 1M, 6M, 1Y, 5Y) and performance metrics.
  * Automatic refresh mechanism and intelligent caching.

* **📉 Analytics & Performance Insights**
  * Visual portfolio allocation charts powered by Recharts (Sector Allocation, Asset Type Allocation).
  * Ranked lists for **Top Gainers** and **Top Losers**.

* **🔮 Scenario Modeling & What-If Simulations**
  * Create custom hypothetical market scenarios (e.g. Bull Market, Tech Rally, Market Crash).
  * Duplicate, edit, and compare impact on current portfolio allocations.

* **📜 Transaction History & Audit Trail**
  * Complete transaction log for all BUY, SELL, and dividend actions.
  * Entity-level audit logging for tracking history and operational integrity.

* **📁 CSV Import & Export**
  * Export holdings and transaction history to standard CSV files.
  * Bulk import holdings from CSV with automatic validation.

* **🌓 UI & Dark/Light Mode**
  * Responsive, glassmorphism UI styled with Tailwind CSS.
  * One-click dark mode toggle.

---

## 🛠️ Tech Stack

### **Backend**
* **Language & Framework**: Java 17, Spring Boot 3.x
* **Data Access**: Spring Data JPA, Hibernate ORM
* **Database**: H2 Database (File-based default), MySQL compatible
* **API Documentation**: Springdoc OpenAPI / Swagger UI
* **Market Integration**: Yahoo Finance API integration client (with Java HTTP & Python fallback)

### **Frontend**
* **Framework**: React 18, Vite
* **Styling**: Tailwind CSS, PostCSS
* **Icons & Visuals**: Lucide React
* **Charts**: Recharts
* **HTTP Client**: Axios (configured with Vite proxy)

---

## 📁 Project Structure

```
portfolio/
├── backend/                        # Spring Boot REST API
│   ├── pom.xml                     # Maven dependencies
│   ├── scripts/                    # Yahoo Finance helper scripts
│   └── src/
│       ├── main/java/com/portfolio/manager/
│       │   ├── controller/         # REST API Controllers
│       │   ├── dto/                # Data Transfer Objects
│       │   ├── entity/             # JPA Entities
│       │   ├── market/             # Yahoo Finance Client & Parsers
│       │   ├── repository/         # JPA Repositories
│       │   └── service/            # Core Business Logic Services
│       └── main/resources/
│           ├── application.yml     # Application configuration
│           └── data.sql            # Seed data
├── frontend/                       # React + Vite Frontend
│   ├── package.json
│   ├── vite.config.js              # Dev server & proxy settings
│   └── src/
│       ├── api/                    # Axios API client methods
│       ├── components/             # Reusable UI components & modals
│       ├── context/                # Theme & Portfolio Context providers
│       ├── pages/                  # Main views (Dashboard, Holdings, etc.)
│       └── App.jsx                 # Application entry point
├── prd.md                          # Product Requirements Document
└── README.md                       # Documentation & setup guide
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:

1. **Java Development Kit (JDK 17 or higher)**
   * Verify with: `java -version`
2. **Apache Maven (3.8+)**
   * Verify with: `mvn -version`
3. **Node.js (v18 or higher) and npm**
   * Verify with: `node -v` and `npm -v`

---

## 🚀 How to Run the Application

### **1. Start the Backend Server (Spring Boot)**

Navigate to the `backend/` directory:

```bash
cd backend
```

#### **Option A: Run with Default H2 Database (Recommended)**
By default, the application uses an H2 file-based database (`./data/portfoliodb`) which automatically persists data across restarts without requiring external database installation.

```bash
mvn spring-boot:run
```

#### **Option B: Run with MySQL Database**
If you wish to run against a local MySQL instance:
1. Ensure MySQL is running on port 3306 and create a database named `portfolio_db`.
2. Start the Spring Boot application using the `mysql` profile:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

The backend server will start at: `http://localhost:8080`

* **Swagger API Documentation**: `http://localhost:8080/swagger-ui.html`
* **H2 Database Console** (when running H2): `http://localhost:8080/h2-console`
  * *JDBC URL*: `jdbc:h2:file:./data/portfoliodb`
  * *Username*: `sa`
  * *Password*: *(leave empty)*

---

### **2. Start the Frontend Application (React + Vite)**

Open a new terminal window and navigate to the `frontend/` directory:

```bash
cd frontend
```

Install node dependencies (if running for the first time):

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend application will start at: `http://localhost:5173`

> **Note**: Vite is pre-configured to proxy all `/api` requests to `http://localhost:8080`.

---

## 📡 Key REST API Endpoints

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Market** | `/api/market/search?query={q}` | GET | **Search assets autocomplete via Yahoo Finance** |
| **Market** | `/api/market/{ticker}` | GET | Get current price quote for ticker |
| **Market** | `/api/market/{ticker}/history?range=1m` | GET | Get historical chart data |
| **Market** | `/api/market/watchlist` | GET | Get market quote watchlist |
| **Market** | `/api/market/refresh` | POST | Force refresh quotes for all holdings |
| **Portfolio** | `/api/portfolio/summary` | GET | Get portfolio valuation summary |
| **Portfolio** | `/api/portfolio/allocation` | GET | Get portfolio asset & sector allocation |
| **Portfolio** | `/api/portfolio/performance` | GET | Get historical portfolio valuation |
| **Holdings** | `/api/holdings` | GET / POST | List all holdings or add a new holding |
| **Holdings** | `/api/holdings/{id}` | PUT / DELETE | Update or delete a holding |
| **Holdings** | `/api/holdings/{id}/sell` | POST | Partial or full sell of a holding |
| **Holdings** | `/api/holdings/search` | GET | Filter/search holdings by type, sector, etc. |
| **Analytics** | `/api/analytics` | GET | Get top gainers, losers, metrics |
| **Scenarios** | `/api/scenarios` | GET / POST | List or create market simulation scenarios |
| **Transactions**| `/api/transactions` | GET / POST | Get or add portfolio transaction records |
| **Audit Logs** | `/api/audit-logs` | GET | View audit trail log entries |

---

## 🧪 Testing & Production Build

### **Run Backend Tests**

To run unit and integration test suites:

```bash
cd backend
mvn test
```

### **Build Frontend for Production**

To build the static production bundle:

```bash
cd frontend
npm run build
```

The compiled assets will be placed in `frontend/dist/`.

---

## 📝 License

This project is licensed under the MIT License.
