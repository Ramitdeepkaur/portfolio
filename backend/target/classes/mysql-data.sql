-- =======================================================
-- PORTFOLIO MANAGEMENT SYSTEM - MYSQL SAMPLE DATA SEED
-- Execute this script in MySQL to insert initial sample holdings
-- =======================================================

USE portfoliodb;

-- Clear existing data if re-importing
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE holdings;
TRUNCATE TABLE market_data;
TRUNCATE TABLE portfolio_snapshots;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Sample Holdings
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

-- Insert Initial Market Quotes
INSERT INTO market_data (ticker_symbol, current_price, opening_price, closing_price, high_price, low_price, volume, last_updated) VALUES
('AAPL', 185.50, 184.00, 185.00, 187.20, 183.50, 45000000, NOW()),
('NVDA', 125.60, 122.00, 124.50, 126.80, 121.50, 68000000, NOW()),
('MSFT', 420.20, 418.50, 419.80, 422.00, 417.20, 22000000, NOW()),
('TSLA', 248.50, 252.00, 250.00, 254.10, 246.00, 31000000, NOW()),
('VOO', 545.30, 542.00, 544.10, 547.00, 541.00, 8500000, NOW()),
('QQQ', 480.10, 475.00, 478.20, 482.00, 474.00, 19000000, NOW()),
('BND', 72.50, 72.80, 72.60, 73.00, 72.30, 5000000, NOW()),
('FBGRX', 337.00, 334.00, 336.00, 339.00, 333.00, 1200000, NOW()),
('CASH', 1.00, 1.00, 1.00, 1.00, 1.00, 0, NOW());

-- Insert Historical Portfolio Snapshots
INSERT INTO portfolio_snapshots (portfolio_value, invested_amount, profit_loss, snapshot_date) VALUES
(18500.00, 17000.00, 1500.00, '2025-07-01'),
(19200.00, 17200.00, 2000.00, '2025-09-01'),
(20800.00, 17500.00, 3300.00, '2025-11-01'),
(22400.00, 18000.00, 4400.00, '2026-01-01'),
(21900.00, 18200.00, 3700.00, '2026-03-01'),
(24500.00, 18500.00, 6000.00, '2026-05-01'),
(39469.90, 35365.00, 4104.90, CURDATE());
