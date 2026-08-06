-- =======================================================
-- PORTFOLIO MANAGEMENT SYSTEM - MYSQL SAMPLE DATA SEED
-- Holdings / transactions only. Market quotes + performance
-- history are loaded live from Yahoo Finance at runtime.
-- =======================================================

USE portfoliodb;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE holdings;
TRUNCATE TABLE market_data;
TRUNCATE TABLE portfolio_snapshots;
TRUNCATE TABLE transactions;
TRUNCATE TABLE audit_logs;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO holdings (asset_name, ticker_symbol, asset_type, quantity, purchase_price, purchase_date, sector, exchange, currency) VALUES
('Apple Inc.', 'AAPL', 'STOCKS', 15.0, 150.00, '2024-05-15', 'Technology', 'NASDAQ', 'USD'),
('NVIDIA Corporation', 'NVDA', 'STOCKS', 25.0, 85.00, '2024-09-10', 'Technology', 'NASDAQ', 'USD'),
('Microsoft Corp.', 'MSFT', 'STOCKS', 10.0, 380.00, '2024-11-20', 'Technology', 'NASDAQ', 'USD'),
('Tesla Inc.', 'TSLA', 'STOCKS', 12.0, 260.00, '2025-01-14', 'Consumer Cyclical', 'NASDAQ', 'USD'),
('Vanguard S&P 500 ETF', 'VOO', 'ETFS', 18.0, 410.00, '2024-01-10', 'Index', 'NYSE', 'USD'),
('Invesco QQQ Trust', 'QQQ', 'ETFS', 14.0, 420.00, '2024-07-05', 'Technology Index', 'NASDAQ', 'USD'),
('Vanguard Total Bond Market', 'BND', 'BONDS', 40.0, 74.00, '2023-11-18', 'Fixed Income', 'NASDAQ', 'USD'),
('Fidelity Blue Chip Growth', 'FBGRX', 'MUTUAL_FUNDS', 30.0, 145.00, '2024-04-22', 'Large Growth', 'NASDAQ', 'USD'),
('USD Cash Reserve', 'CASH', 'CASH', 3500.0, 1.00, '2023-01-01', 'Cash & Equivalent', 'BANK', 'USD');

INSERT INTO transactions (holding, type, quantity, price, amount, date, notes) VALUES
('AAPL', 'BUY', 15.0, 150.00, 2250.00, '2026-07-01', 'Initial Apple purchase'),
('MSFT', 'BUY', 10.0, 380.00, 3800.00, '2026-07-10', 'Added Microsoft position'),
('NVDA', 'SELL', 2.0, 125.60, 251.20, '2026-07-15', 'Trimmed NVDA position');
