# PRODUCT REQUIREMENTS DOCUMENT (PRD)

Project Name:
Portfolio Management System

Project Type:
Full-stack web application with REST API backend and responsive frontend.

Objective:
Build a Portfolio Management application that allows a single user to manage and track their financial investments. The application should support Stocks, Bonds, Cash Holdings, ETFs, and Mutual Funds. The system must provide portfolio analytics, performance tracking, visualizations, and CRUD operations.

----------------------------------------------------

1. OVERVIEW

The application allows users to:

- View their entire financial portfolio.
- Add investments.
- Edit investment details.
- Remove investments.
- View portfolio allocation.
- Track performance over time.
- View current market value.
- View gains and losses.
- View historical price trends.
- Visualize portfolio performance using charts and graphs.

The system assumes only one user and does NOT require authentication or authorization.

----------------------------------------------------

2. TECH STACK

Backend:
- Spring Boot (Java)
- REST APIs
- JPA/Hibernate
- MySQL

Frontend:
- React
- Tailwind CSS
- Axios
- Chart.js or Recharts

Database:
- MySQL

API Documentation:
- Swagger/OpenAPI

Version Control:
- Git + GitHub

----------------------------------------------------

3. SUPPORTED ASSET TYPES

The portfolio should support:

1. Stocks
2. ETFs
3. Mutual Funds
4. Bonds
5. Cash Holdings

----------------------------------------------------

4. CORE FEATURES

A. Portfolio Dashboard

Display:

- Total Portfolio Value
- Total Invested Amount
- Total Profit/Loss
- Profit/Loss Percentage
- Number of Holdings
- Today's Portfolio Change

Dashboard cards:

- Portfolio Value
- Gain/Loss
- Asset Count
- Cash Available
- Best Performing Asset
- Worst Performing Asset

----------------------------------------------------

B. Holdings Management

Users can:

- Add holdings
- Edit holdings
- Delete holdings
- View holdings

Fields:

Holding ID
Asset Name
Ticker Symbol
Asset Type
Quantity
Purchase Price
Current Price
Purchase Date
Sector
Exchange
Currency

Calculated Fields:

Current Value
Invested Value
Profit/Loss
Profit Percentage

----------------------------------------------------

C. Portfolio Allocation

Show:

- Allocation by Asset Type
- Allocation by Sector
- Allocation by Investment Value

Visualizations:

- Pie Chart
- Doughnut Chart
- Percentage Breakdown

Examples:

Stocks -> 50%
ETFs -> 20%
Bonds -> 15%
Mutual Funds -> 10%
Cash -> 5%

----------------------------------------------------

D. Portfolio Performance

Show:

- Daily Performance
- Weekly Performance
- Monthly Performance
- Yearly Performance

Metrics:

- Portfolio Growth
- CAGR
- Total Return
- Absolute Return

Charts:

- Portfolio Value Over Time
- Growth Curve
- Gain/Loss Trend

----------------------------------------------------

E. Historical Price Tracking

Users can:

- View historical price charts.

Filters:

- 1 Week
- 1 Month
- 6 Months
- 1 Year
- 5 Years

Display:

- Opening Price
- Closing Price
- High
- Low
- Volume

----------------------------------------------------

F. Search Functionality

Search by:

- Asset Name
- Ticker Symbol
- Asset Type

Filter by:

- Stocks
- ETFs
- Bonds
- Mutual Funds
- Cash

Sort by:

- Current Value
- Profit/Loss
- Purchase Date
- Quantity
- Percentage Gain

----------------------------------------------------

5. REST API REQUIREMENTS

Portfolio APIs:

GET    /api/portfolio

GET    /api/portfolio/summary

GET    /api/portfolio/allocation

GET    /api/portfolio/performance

----------------------------------------------------

Holding APIs:

GET    /api/holdings

GET    /api/holdings/{id}

POST   /api/holdings

PUT    /api/holdings/{id}

DELETE /api/holdings/{id}

----------------------------------------------------

Market Data APIs:

GET /api/market/{ticker}

GET /api/market/{ticker}/history

GET /api/market/{ticker}/performance

----------------------------------------------------

Analytics APIs:

GET /api/analytics/top-gainers

GET /api/analytics/top-losers

GET /api/analytics/allocation

GET /api/analytics/performance

----------------------------------------------------

6. DATABASE DESIGN

TABLE: Holdings

Fields:

id
asset_name
ticker_symbol
asset_type
quantity
purchase_price
purchase_date
sector
exchange
currency

----------------------------------------------------

TABLE: MarketData

Fields:

id
ticker_symbol
current_price
opening_price
closing_price
high_price
low_price
volume
last_updated

----------------------------------------------------

TABLE: PortfolioSnapshots

Fields:

id
portfolio_value
invested_amount
profit_loss
snapshot_date

This table will be used for historical portfolio performance tracking.

----------------------------------------------------

7. FRONTEND REQUIREMENTS

Pages:

1. Dashboard

Contains:

- Portfolio Summary
- Allocation Pie Chart
- Profit/Loss Summary
- Performance Graph
- Recent Holdings

----------------------------------------------------

2. Holdings Page

Contains:

- Holdings Table
- Search
- Filters
- Sorting
- Edit Button
- Delete Button

----------------------------------------------------

3. Add Investment Page

Form Fields:

- Asset Name
- Ticker
- Asset Type
- Quantity
- Purchase Price
- Purchase Date
- Sector
- Exchange
- Currency

----------------------------------------------------

4. Portfolio Analytics Page

Contains:

- Portfolio Growth Graph
- Asset Allocation Graph
- Top Gainers
- Top Losers
- Historical Performance

----------------------------------------------------

5. Market Data Page

Contains:

- Stock Search
- Historical Price Chart
- Current Price
- High
- Low
- Volume

----------------------------------------------------

8. UI REQUIREMENTS

Theme:

Modern financial dashboard.

Use:

- Responsive Design
- Dark Mode support
- Card-based layouts
- Clean tables
- Interactive charts

Charts:

- Line Charts
- Pie Charts
- Doughnut Charts
- Area Charts
- Bar Charts

----------------------------------------------------

9. BUSINESS LOGIC

Current Value:

quantity × current_market_price

Invested Value:

quantity × purchase_price

Profit/Loss:

current_value - invested_value

Profit Percentage:

(profit_loss / invested_value) × 100

Portfolio Value:

sum of all current values

Portfolio Gain/Loss:

sum of all gains/losses

----------------------------------------------------

10. EXTERNAL MARKET DATA

Integrate Yahoo Finance APIs using:

Java:
- yahoofinance-api library

OR

Yahoo Finance REST endpoints.

Fetch:

- Current stock prices
- Historical prices
- Daily change
- Volume
- Market statistics

Implement caching for market data to avoid excessive API calls.

----------------------------------------------------

11. EXTRA FEATURES

Implement:

- Portfolio export to CSV.
- Portfolio import from CSV.
- Download portfolio report.
- Dark/Light mode.
- Responsive design for mobile and desktop.
- Toast notifications.
- Loading skeletons.
- Error handling.
- Empty state screens.

----------------------------------------------------

12. NON-FUNCTIONAL REQUIREMENTS

- Responsive UI.
- RESTful API design.
- Proper exception handling.
- Swagger documentation.
- Layered architecture.
- Service layer abstraction.
- DTOs for API responses.
- Validation for all forms.
- Clean code practices.
- Git commits and branching strategy.

----------------------------------------------------

13. ARCHITECTURE

Backend:

Controller
↓
Service
↓
Repository
↓
Database

Frontend:

Pages
↓
Components
↓
Services
↓
API Layer

----------------------------------------------------

14. DELIVERABLES

The final application must include:

- Fully functional REST APIs.
- MySQL integration.
- Portfolio dashboard.
- Holdings management.
- Portfolio analytics.
- Market data integration.
- Historical performance tracking.
- Interactive charts.
- Swagger documentation.
- Responsive React frontend.
- Clean project structure.
- Git repository with meaningful commits.

Build this as a production-quality prototype suitable for demonstrating in a 15–20 minute technical presentation. The UI should resemble a modern financial portfolio dashboard similar to investment platforms like Zerodha Coin or Groww.