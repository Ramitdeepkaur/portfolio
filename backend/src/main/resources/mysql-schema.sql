-- =======================================================
-- PORTFOLIO MANAGEMENT SYSTEM - MYSQL DATABASE SCHEMA
-- Execute this script in MySQL Workbench, phpMyAdmin, or MySQL CLI
-- =======================================================

CREATE DATABASE IF NOT EXISTS portfoliodb;
USE portfoliodb;

-- TABLE 1: Holdings
CREATE TABLE IF NOT EXISTS holdings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_name VARCHAR(255) NOT NULL,
    ticker_symbol VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    quantity DOUBLE NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    sector VARCHAR(100),
    exchange VARCHAR(50),
    currency VARCHAR(10)
);

-- TABLE 2: MarketData
CREATE TABLE IF NOT EXISTS market_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticker_symbol VARCHAR(50) NOT NULL UNIQUE,
    current_price DECIMAL(15, 2) NOT NULL,
    opening_price DECIMAL(15, 2),
    closing_price DECIMAL(15, 2),
    high_price DECIMAL(15, 2),
    low_price DECIMAL(15, 2),
    volume BIGINT,
    last_updated DATETIME
);

-- TABLE 3: PortfolioSnapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    portfolio_value DECIMAL(15, 2) NOT NULL,
    invested_amount DECIMAL(15, 2) NOT NULL,
    profit_loss DECIMAL(15, 2) NOT NULL,
    snapshot_date DATE NOT NULL
);

-- TABLE 4: Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    holding VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity DOUBLE NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    date DATE NOT NULL,
    notes VARCHAR(500)
);

-- TABLE 5: Audit logs (portfolio change history)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(30) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity VARCHAR(150) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(64),
    before_snapshot TEXT,
    after_snapshot TEXT,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticker_symbol VARCHAR(50) NOT NULL,
    notes VARCHAR(255),
    created_at DATETIME NOT NULL,
    UNIQUE KEY uk_watchlist_ticker (ticker_symbol)
);
