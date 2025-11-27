-- MySQL Database Schema for Stock Analysis App

CREATE DATABASE IF NOT EXISTS stock_analysis_db;
USE stock_analysis_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- In production, this should be hashed
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  stock_analysis_access BOOLEAN DEFAULT TRUE,
  analysis_count INT DEFAULT 0,
  trial_expiry BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stock Analysis History Table
CREATE TABLE IF NOT EXISTS analysis_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  analysis_type ENUM('Intraday Trading', 'Positional Trading', 'Swing Trading') NOT NULL,
  stock_name VARCHAR(100),
  analysis_result TEXT,
  image_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type ENUM('deposit', 'charge') NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  receipt_path VARCHAR(255),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Analysis Pricing Table
CREATE TABLE IF NOT EXISTS analysis_pricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_type ENUM('Intraday Trading', 'Positional Trading', 'Swing Trading') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default pricing
INSERT INTO analysis_pricing (analysis_type, price, description) VALUES
('Intraday Trading', 10.00, 'Analysis for day trading strategies'),
('Positional Trading', 15.00, 'Analysis for multi-day trading positions'),
('Swing Trading', 20.00, 'Analysis for multi-week trading strategies');

-- Insert test user
INSERT INTO users (id, name, email, password, wallet_balance, stock_analysis_access, analysis_count, trial_expiry, email_verified)
VALUES ('user123', 'Test User', 'test@example.com', 'password123', 100.00, TRUE, 0, FALSE, TRUE);