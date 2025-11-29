// Define types
import bcrypt from 'bcryptjs';
import { hashPassword } from '@/lib/auth';
import pool from './db'; // Import centralized database connection
import eventBus from '@/lib/eventBus';
import fs from 'fs';
import path from 'path';
import { User, AnalysisHistory, AnalysisPricing, WalletTransaction, Strategy } from '@/types/db';

export type { User, AnalysisHistory, AnalysisPricing, WalletTransaction, Strategy };

type Database = {
  users: User[];
  analysis_pricing: AnalysisPricing[];
  wallet_transactions: WalletTransaction[];
  strategies: Strategy[];
  // removed pending_otps (OTP based verification removed)
};

// Initialize database
// Initialize database
// const database: Database = { ... } - Removed in favor of persistent storage


// Add day trading strategy
export function addDayTradingStrategy() {
  const db = readDatabase();
  const dayTradingStrategy: Strategy = {
    id: "day-trading-intraday",
    name: "Intraday Day Trading Strategy",
    description: "A comprehensive day trading strategy for intraday trades with 2-8 hour hold times.",
    performance: 78,
    riskLevel: "Medium",
    category: "Momentum",
    imageUrl: "/stock-chart.svg",
    details: `# Day Trading Strategy (Intraday, 2-8 Hours Hold)

## Framework:

### 1. Higher Timeframe Bias (4H → 1H)
- Identify main trend: HH/HL = Bullish, LH/LL = Bearish
- Use 50 EMA & 200 EMA for extra confirmation
- Trade only in the direction of 1H/4H trend

### 2. Liquidity Zones
- Mark previous day's High/Low, Asian range, London High/Low
- Identify buy-side liquidity (above highs) and sell-side liquidity (below lows)
- Watch for:
  - Liquidity sweep (stop hunt) → reversal setup
  - Clean breakout & retest → continuation setup

### 3. Entry Trigger (15m → 5m)
- Look for:
  - Break of Structure (BoS) at key zone
  - Liquidity sweep + rejection candle (engulfing / pin bar)
  - Retest of 20/50 EMA with trend continuation
  - Fair Value Gap (FVG) fill entry

### 4. Risk Management
- Stop Loss (SL): Below sweep wick / recent swing low (for buys) OR above swing high (for sells)
- Risk: 1–2% per trade
- Ensure minimum R:R = 1:2

### 5. Trade Management
- TP1: Nearest liquidity level (session high/low)
- TP2: Next key structure (previous day high/low)
- TP3 (optional): Opposite liquidity pool
- Move SL → breakeven after TP1 hit
- Max holding time: same trading day (2–8 hrs)`,
    parameters: {
      "Timeframe Analysis": "4H, 1H, 15m, 5m",
      "Risk Per Trade": "1-2%",
      "Minimum R:R": "1:2",
      "Max Hold Time": "2-8 hours (same day)",
      "Key Indicators": "50 EMA, 200 EMA, Price Action, Liquidity Zones"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Check if strategy already exists
  const existingIndex = db.strategies.findIndex(s => s.id === dayTradingStrategy.id);
  if (existingIndex >= 0) {
    // Update existing strategy
    db.strategies[existingIndex] = dayTradingStrategy;
  } else {
    // Add new strategy
    db.strategies.push(dayTradingStrategy);
  }

  writeDatabase(db);
  return dayTradingStrategy;
}

// Mock database functions for transactions and token management

// Analytics functions for admin dashboard
export function getAnalyticsData() {
  try {
    const db = readDatabase();
    // User statistics
    const totalUsers = db.users.length;
    const activeUsers = db.users.filter(user => user.stock_analysis_access).length;
    const inactiveUsers = totalUsers - activeUsers;
    const adminUsers = db.users.filter(user => user.role === 'ADMIN').length;
    const regularUsers = db.users.filter(user => user.role === 'USER').length;

    // Payment statistics (wallet_transactions)
    const allTransactions = db.wallet_transactions || [];
    const pendingPayments = allTransactions.filter((t: WalletTransaction) => t.status === 'pending').length;
    const approvedPayments = allTransactions.filter((t: WalletTransaction) => t.status === 'completed').length;
    const rejectedPayments = allTransactions.filter((t: WalletTransaction) => t.status === 'failed').length;
    const totalPayments = allTransactions.length;

    // Revenue statistics
    const totalRevenue = allTransactions
      .filter((t: WalletTransaction) => t.status === 'completed' && t.transaction_type === 'deposit')
      .reduce((sum: number, t: WalletTransaction) => sum + t.amount, 0);

    // Strategy statistics
    const totalStrategies = db.strategies.length;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        admin: adminUsers,
        regular: regularUsers
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        approved: approvedPayments,
        rejected: rejectedPayments
      },
      revenue: {
        total: totalRevenue
      },
      strategies: {
        total: totalStrategies
      }
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    return {
      users: { total: 0, active: 0, inactive: 0, admin: 0, regular: 0 },
      payments: { total: 0, pending: 0, approved: 0, rejected: 0 },
      revenue: { total: 0 },
      strategies: { total: 0 }
    };
  }
}

export async function updateUserTokens(userId: string, tokens: number) {
  try {
    const db = readDatabase();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Add tokens to user's wallet balance
    user.wallet_balance += tokens;
    user.updated_at = new Date().toISOString();

    writeDatabase(db);

    return {
      success: true,
      message: `Added ${tokens} tokens to user's account`,
      user
    };
  } catch (error) {
    console.error('Error updating user tokens:', error);
    return { success: false, error: 'Failed to update user tokens' };
  }
}

/**
 * Update user password
 */
export const updateUserPassword = async (emailOrId: string, hashedPassword: string): Promise<{ success: boolean }> => {
  try {
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.email === emailOrId || u.id === emailOrId);
    if (userIndex === -1) return { success: false };
    const user = db.users[userIndex];
    user.password = hashedPassword;
    user.updated_at = new Date().toISOString();
    writeDatabase(db);
    return { success: true };
  } catch (error) {
    console.error('Error updating user password:', error);
    return { success: false };
  }
};

export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    const db = readDatabase();
    // Check if user with email already exists
    const existingUser = db.users.find(u => u.email === userData.email);

    if (existingUser) {
      return { success: false, error: 'Email already in use' };
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create new user
    const newUser: User = {
      id: `user${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      wallet_balance: 0,
      stock_analysis_access: true, // enable trial access initially
      analysis_count: 0,
      trial_expiry: false,
      role: 'USER',
      email_verified: false,
      analysis_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    // Add user to database
    db.users.push(newUser);
    writeDatabase(db);

    return {
      success: true,
      message: 'User registered successfully',
      user: { ...newUser, password: undefined } // Return user without password
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: 'Failed to register user' };
  }
}

/**
 * Set OTP for a user (by email)
 */
// OTP functions removed. OTP-based verification has been disabled.

/**
 * Verify OTP for a user and mark email verified
 */
// OTP verification removed - no-op

// No pending OTP functions - OTP feature removed

// Initial database with test users and strategies
const initialDatabase: Database = {
  users: [
    {
      id: "user123",
      name: "Test User",
      email: "test@example.com",
      password: "$2b$12$SMugmWkI12docvSfctmo8.DJdoMWNxzYfUKd0kXd5DfBho1m/vB8u", // Verified hash of 'password123'
      wallet_balance: 100,
      stock_analysis_access: true,
      analysis_count: 0,
      trial_expiry: false,
      role: 'USER',
      email_verified: true,
      analysis_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "user124",
      name: "Testing User",
      email: "testing@example.com",
      password: "$2b$12$SMugmWkI12docvSfctmo8.DJdoMWNxzYfUKd0kXd5DfBho1m/vB8u", // Verified hash of 'password123'
      wallet_balance: 100,
      stock_analysis_access: true,
      analysis_count: 0,
      trial_expiry: false,
      role: 'USER',
      email_verified: true,
      analysis_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "user456",
      name: "John Doe",
      email: "john@example.com",
      password: "$2a$12$T9y8uV7iO6p5a4l3k2j1hG8f7e6d5c4b3a2s1d0f9e8d7c6b", // Hashed 'securepass'
      wallet_balance: 50,
      stock_analysis_access: true,
      analysis_count: 3,
      trial_expiry: false,
      role: 'USER',
      email_verified: true,
      analysis_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "user789",
      name: "Jane Smith",
      email: "jane@example.com",
      password: "$2a$12$Q7w6e5r4t3y2u1i0o9p8a7s6d5f4g3h2j1k0l9f8e7d6c", // Hashed 'janepass123'
      wallet_balance: 0,
      stock_analysis_access: true,
      analysis_count: 0,
      trial_expiry: false,
      role: 'USER',
      email_verified: true,
      analysis_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  analysis_pricing: [
    {
      analysis_type: "Intraday Trading",
      price: 2,
      description: "Analysis for day trading strategies"
    },
    {
      analysis_type: "Positional Trading",
      price: 3,
      description: "Analysis for multi-day trading positions"
    },
    {
      analysis_type: "Swing Trading",
      price: 5,
      description: "Analysis for multi-week trading strategies"
    }
  ],
  wallet_transactions: [],
  strategies: [
    {
      id: 'swing',
      name: 'Swing Trading (Multi-Timeframe)',
      description: 'Swing analysis using Daily/4H trend and liquidity zones.',
      performance: 0,
      riskLevel: 'Medium',
      category: 'Momentum',
      imageUrl: '/strategy3.svg',
      details: 'Analyze charts with Daily/4H trend, liquidity sweeps, and 20/50 EMA pullbacks. Outputs actionable entry, SL, TP levels and R:R.',
      parameters: {
        'Higher TFs': 'Daily & 4H',
        'Triggers': 'BoS, Sweep + Rejection, EMA Pullback',
        'Risk': '1–2% per trade',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'scalp',
      name: 'Scalping (Seconds → Minutes)',
      description: 'EMA-tap, BoS and sweep entries in 1m–5m with 1H filter.',
      performance: 0,
      riskLevel: 'High',
      category: 'Momentum',
      imageUrl: '/strategy1.svg',
      details: 'Trade in higher timeframe trend using 20/50 EMA filter and fast triggers. Tight SL (5–10 pips) with 1:1 to 1:2 targets.',
      parameters: {
        'Main': '1m or 5m',
        'Confirm': '15m',
        'Trend Filter': '1H',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'day',
      name: 'Day Trading (Intraday)',
      description: '4H→1H bias, session liquidity, FVG and EMA retests.',
      performance: 0,
      riskLevel: 'Medium',
      category: 'Momentum',
      imageUrl: '/strategy2.svg',
      details: 'Trade intraday using session levels, sweeps and continuation setups. Minimum R:R = 1:2; manage through TP1/TP2 and move to BE.',
      parameters: {
        'Higher TFs': '4H → 1H',
        'Triggers': 'BoS, Sweep + Rejection, EMA Retest, FVG',
        'Risk': '1–2% per trade',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// Create a deep copy of the initial database
let mockDatabase: Database = JSON.parse(JSON.stringify(initialDatabase));

// Add admin user to the mock database
mockDatabase.users.push({
  id: "admin123",
  name: "Admin User",
  email: "admin@example.com",
  password: "$2b$12$CNEH75BtbiEtjc76Kdvv6.67nJ/aF4uAEc5znGg3CN.lH3JN6nGXq", // Hashed 'admin123'
  wallet_balance: 0,
  stock_analysis_access: true,
  analysis_count: 0,
  trial_expiry: false,
  role: 'ADMIN',
  email_verified: true,
  analysis_history: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

// ... (keep existing code)

// Path to the JSON database file
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Read the database
 */
export const readDatabase = (): Database => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent);
    } else {
      const initialData = JSON.parse(JSON.stringify(mockDatabase.users.length > 0 ? mockDatabase : initialDatabase));
      try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      } catch (writeError) {
        console.error('Error creating initial database file:', writeError);
      }
      return initialData;
    }
  } catch (error) {
    console.error('Error reading database file:', error);
  }
  // Fallback to in-memory/initial database if file doesn't exist or error
  return JSON.parse(JSON.stringify(mockDatabase.users.length > 0 ? mockDatabase : initialDatabase));
};

/**
 * Write to the database
 */
export const writeDatabase = (data: Database): void => {
  mockDatabase = JSON.parse(JSON.stringify(data)); // Update in-memory copy
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
};

/**
 * Create a new user
 */
// Strategy management functions

export const getAllStrategies = (): Strategy[] => {
  const db = readDatabase();
  return db.strategies;
};

export const getStrategyById = (id: string): Strategy | undefined => {
  const db = readDatabase();
  return db.strategies.find(strategy => strategy.id === id);
};

export const createStrategy = async (strategyData: Omit<Strategy, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; strategy?: Strategy; error?: string }> => {
  const db = readDatabase();

  // Check if strategy with the same name already exists
  const existingStrategy = db.strategies.find(strategy => strategy.name.toLowerCase() === strategyData.name.toLowerCase());
  if (existingStrategy) {
    return { success: false, error: 'A strategy with this name already exists' };
  }

  const newStrategy: Strategy = {
    ...strategyData,
    id: `strategy${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.strategies.push(newStrategy);
  writeDatabase(db);

  return { success: true, strategy: newStrategy };
};

export const updateStrategy = async (id: string, strategyData: Partial<Omit<Strategy, 'id' | 'created_at'>>): Promise<{ success: boolean; strategy?: Strategy; error?: string }> => {
  const db = readDatabase();

  const strategyIndex = db.strategies.findIndex(strategy => strategy.id === id);
  if (strategyIndex === -1) {
    return { success: false, error: 'Strategy not found' };
  }

  // Update the strategy with new data
  db.strategies[strategyIndex] = {
    ...db.strategies[strategyIndex],
    ...strategyData,
    updated_at: new Date().toISOString()
  };

  writeDatabase(db);

  return { success: true, strategy: db.strategies[strategyIndex] };
};

export const deleteStrategy = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const db = readDatabase();

  const initialLength = db.strategies.length;
  db.strategies = db.strategies.filter(strategy => strategy.id !== id);

  if (db.strategies.length === initialLength) {
    return { success: false, error: 'Strategy not found' };
  }

  writeDatabase(db);

  return { success: true };
};

export const createUser = async (name: string, email: string, password: string): Promise<{ success: boolean }> => {
  const db = readDatabase();

  // Check if user already exists
  const existingUser = db.users.find(user => user.email === email);
  if (existingUser) {
    return { success: false };
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Create new user with wallet and stock analysis features
  const newUser: User = {
    id: `user${Date.now()}`,
    name,
    email,
    password: hashedPassword, // Storing hashed password
    wallet_balance: 0,
    stock_analysis_access: true,
    analysis_count: 0,
    trial_expiry: false,
    role: 'USER',
    email_verified: true,
    analysis_history: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Add to database
  db.users.push(newUser);
  writeDatabase(db);

  return { success: true };
};



/**
 * Login user
 */
export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: Omit<User, 'password'> }> => {
  try {
    console.log('===== loginUser called =====');
    console.log('Attempting to login with email:', email);

    const db = readDatabase();

    // Log database state
    console.log('Database users count:', db.users.length);
    console.log('Available users:', db.users.map(u => u.email));

    // Ensure database is initialized
    if (db.users.length === 0) {
      console.error('Database has no users. Initializing with default data.');
      writeDatabase(initialDatabase);
      return loginUser(email, password); // Retry with initialized database
    }

    // Find user by email - case insensitive comparison
    const user = db.users.find(user => user.email.toLowerCase() === email.toLowerCase());

    // Check if user exists
    if (!user || !user.password) {
      console.log('Login failed: User not found or invalid data:', email);
      return { success: false };
    }

    console.log('User found:', user.email);
    console.log('Stored password hash starts with:', user.password.substring(0, 10), '...');

    // Compare password with hashed password
    console.log('Comparing provided password with stored hash...');
    const passwordMatch = await bcrypt.compare(password, user.password);

    console.log('Password comparison result:', passwordMatch);

    if (!passwordMatch) {
      console.log('Login failed: Password incorrect for user:', email);
      return { success: false };
    }

    // Ensure email has been verified
    if (!user.email_verified) {
      console.log('Login blocked: email not verified:', email);
      return { success: false };
    }

    // Return user without sensitive information
    const { password: _, ...safeUser } = user;
    console.log('Login successful for user:', email);
    return { success: true, user: safeUser };
  } catch (error) {
    console.error('Error during login process:', error);
    return { success: false };
  } finally {
    console.log('===== loginUser completed =====');
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<{ success: boolean; user?: Omit<User, 'password'> }> => {
  const db = readDatabase();

  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return { success: false };
  }

  // Return user without sensitive information
  const { password: _, ...safeUser } = user;
  return { success: true, user: safeUser };
};

/**
 * Update user wallet balance
 */
export const updateWalletBalance = async (userId: string, amount: number): Promise<{ success: boolean; newBalance?: number }> => {
  const db = readDatabase();

  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return { success: false };
  }

  // Update wallet balance
  user.wallet_balance += amount;
  user.updated_at = new Date().toISOString();
  writeDatabase(db);

  return { success: true, newBalance: user.wallet_balance };
};

/**
 * Add wallet transaction
 */
export const addWalletTransaction = async (
  userId: string,
  amount: number,
  transactionType: 'deposit' | 'charge',
  paymentMethod?: string,
  transactionId?: string,
  receiptPath?: string
): Promise<{ success: boolean; transaction?: WalletTransaction }> => {
  const db = readDatabase();

  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return { success: false };
  }

  // Create transaction
  const transaction = createWalletTransaction(userId, amount, transactionType, paymentMethod, transactionId, receiptPath);

  // Add to database
  db.wallet_transactions.push(transaction);
  writeDatabase(db);

  return { success: true, transaction };
};

// helper to create transaction with history
function createWalletTransaction(userId: string, amount: number, transactionType: 'deposit' | 'charge', paymentMethod?: string, transactionId?: string, receiptPath?: string) {
  const transaction: WalletTransaction = {
    id: `trans${Date.now()}`,
    user_id: userId,
    amount,
    transaction_type: transactionType,
    payment_method: paymentMethod,
    transaction_id: transactionId,
    receipt_path: receiptPath,
    status: 'pending',
    created_at: new Date().toISOString(),
    history: [],
    admin_message_status: 'pending'
  };
  return transaction;
}

/**
 * Add analysis history
 */
export const addAnalysisHistory = async (
  userId: string,
  analysisType: 'Intraday Trading' | 'Positional Trading' | 'Swing Trading',
  stockName?: string,
  analysisResult?: string,
  imagePath?: string,
  priceCharged?: number,
  pricingSnapshot?: { analysis_type: string; price: number } | null
): Promise<{ success: boolean; history?: AnalysisHistory }> => {
  const db = readDatabase();

  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return { success: false };
  }

  // Create history entry
  const history: AnalysisHistory = {
    id: `analysis${Date.now()}`,
    analysis_type: analysisType,
    stock_name: stockName,
    analysis_result: analysisResult,
    image_path: imagePath,
    priceCharged: priceCharged || 0,
    pricingSnapshot: pricingSnapshot || null,
    created_at: new Date().toISOString()
  };

  // Add to user's history
  user.analysis_history.push(history);

  // Increment analysis count and check trial expiry
  user.analysis_count += 1;
  if (user.analysis_count >= 5 && user.wallet_balance <= 0) {
    user.trial_expiry = true;
    user.stock_analysis_access = false;
  }

  user.updated_at = new Date().toISOString();
  writeDatabase(db);

  return { success: true, history };
};

/**
 * Get analysis pricing
 */
export const getAnalysisPricing = async (): Promise<AnalysisPricing[]> => {
  const db = readDatabase();
  return db.analysis_pricing;
};

/**
 * Check if user has access to stock analysis
 */
export const checkAnalysisAccess = async (userId: string): Promise<{ hasAccess: boolean; reason?: string }> => {
  const db = readDatabase();

  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return { hasAccess: false, reason: 'User not found' };
  }

  // Check access
  if (user.stock_analysis_access) {
    return { hasAccess: true };
  }

  // Determine reason
  let reason = 'Access denied';
  if (user.trial_expiry && user.wallet_balance <= 0) {
    reason = 'Trial expired and insufficient wallet balance';
  } else if (user.wallet_balance <= 0) {
    reason = 'Insufficient wallet balance';
  }

  return { hasAccess: false, reason };
};

/**
 * Get all users (for testing purposes)
 */
export const getAllUsers = async (): Promise<Omit<User, 'password'>[]> => {
  const db = readDatabase();
  // Return users without sensitive information
  return db.users.map(({ password: _, ...user }) => user);
};

/**
 * Update user wallet with transaction details
 */
export const updateUserWallet = async (
  userId: string,
  amount: number,
  transactionId: string,
  paymentMethod: string,
  receiptPath?: string
): Promise<{ user: Omit<User, 'password'>; transaction: WalletTransaction } | null> => {
  try {
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) return null;

    // Create transaction (deposit) and set status to pending.
    const transaction = createWalletTransaction(userId, amount, 'deposit', paymentMethod, transactionId, receiptPath);

    // Add to database
    db.wallet_transactions.push(transaction);

    // Do not modify the wallet balance here. The transaction is pending and will be credited when an admin approves it.

    // Save to database
    writeDatabase(db);

    // Return updated user without sensitive information
    const { password: _, ...safeUser } = db.users[userIndex];
    return { user: safeUser, transaction };
  } catch (error) {
    console.error('Error updating user wallet:', error);
    return null;
  }
};

/**
 * Submit a new analysis and handle wallet charges
 */
export const submitAnalysis = async (
  userId: string,
  analysisType: 'Intraday Trading' | 'Positional Trading' | 'Swing Trading',
  stockName?: string,
  imageData?: string
): Promise<AnalysisHistory | null> => {
  try {
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) return null;

    // Check if user has access
    const user = db.users[userIndex];
    const hasTrialAccess = user.analysis_count < 5;
    const hasWalletBalance = user.wallet_balance > 0;

    if (!hasTrialAccess && !hasWalletBalance) {
      return null;
    }

    // Create a new analysis entry
    const newAnalysis: AnalysisHistory = {
      id: `analysis_${Date.now()}`,
      analysis_type: analysisType,
      stock_name: stockName,
      analysis_result: 'This is a sample analysis result. In a real application, this would be generated by AI based on the uploaded image.',
      image_path: imageData, // In a real app, this would be a path to the stored image
      priceCharged: 0,
      pricingSnapshot: null,
      created_at: new Date().toISOString()
    };

    // Add to user's analysis history
    user.analysis_history.unshift(newAnalysis);

    // Update analysis count
    user.analysis_count += 1;

    // If trial is used up, deduct from wallet
    if (user.analysis_count > 5) {
      // Get pricing for the analysis type
      const pricing = db.analysis_pricing.find(p => p.analysis_type === analysisType);
      const price = pricing ? pricing.price : 10; // Default to 10 if pricing not found
      // If wallet contains insufficient credits, deny analysis
      if (user.wallet_balance <= 0 || user.wallet_balance < price) {
        // Revert adding analysis and count increment
        user.analysis_history.shift();
        user.analysis_count -= 1;
        writeDatabase(db);
        return null;
      }

      // Deduct from wallet
      user.wallet_balance -= price;

      // Ensure wallet balance doesn't go below 0
      if (user.wallet_balance < 0) {
        user.wallet_balance = 0;
      }

      // Create transaction for the charge
      const transaction = createWalletTransaction(userId, price, 'charge');
      transaction.status = 'completed';
      db.wallet_transactions.push(transaction);

      // Save pricing snapshot & charged amount in analysis history
      newAnalysis.priceCharged = price;
      newAnalysis.pricingSnapshot = { analysis_type: analysisType, price };

      // Publish wallet event for this charge
      try {
        eventBus.publish('wallet', {
          type: 'analysis_charge',
          userId,
          amount: price,
          walletBalance: user.wallet_balance,
          transactionId: transaction.id
        });
      } catch (err) {
        // ignore
      }
    }

    // Check if trial has expired and wallet is empty
    if (user.analysis_count >= 5 && user.wallet_balance <= 0) {
      user.trial_expiry = true;
      user.stock_analysis_access = false;
    }

    // Update user
    user.updated_at = new Date().toISOString();

    // Save to database
    writeDatabase(db);

    return newAnalysis;
  } catch (error) {
    console.error('Error submitting analysis:', error);
    return null;
  }
};

/**
 * Get analysis history for a user
 */
export const getAnalysisHistory = async (userId: string): Promise<AnalysisHistory[] | null> => {
  try {
    const db = readDatabase();
    const user = db.users.find(u => u.id === userId);

    if (!user) return null;

    return user.analysis_history || [];
  } catch (error) {
    console.error('Error getting analysis history:', error);
    return null;
  }
};

/**
 * Get all pending wallet transactions
 */
export const getPendingTransactions = async (): Promise<WalletTransaction[]> => {
  try {
    const db = readDatabase();
    return db.wallet_transactions.filter(txn => txn.status === 'pending');
  } catch (error) {
    console.error('Error getting pending transactions:', error);
    return [];
  }
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (
  transactionId: string,
  status: 'completed' | 'failed' | 'approved' | 'rejected',
  adminId: string,
  creditedAmount?: number,
  rejectionReason?: string
): Promise<{ success: boolean; transaction?: WalletTransaction }> => {
  try {
    const db = readDatabase();
    const transactionIndex = db.wallet_transactions.findIndex(txn => txn.id === transactionId);

    if (transactionIndex === -1) {
      return { success: false };
    }

    const transaction = db.wallet_transactions[transactionIndex];

    // Normalize status for internal handling (approved => completed, rejected => failed)
    const normalizedStatus = status === 'approved' ? 'completed' : (status === 'rejected' ? 'failed' : status);

    // Save previous status for history
    const prevStatus = transaction.status;
    if (normalizedStatus === 'completed' && transaction.transaction_type === 'deposit') {
      const user = db.users.find(u => u.id === transaction.user_id);
      if (user) {
        const amountToCredit = typeof creditedAmount === 'number' && !isNaN(creditedAmount) ? creditedAmount : transaction.amount;
        // Update transaction amount to reflect actual credited amount if provided
        transaction.amount = amountToCredit;
        user.wallet_balance += amountToCredit;

        // If wallet balance is now positive, restore access if it was disabled due to trial expiry
        if (user.wallet_balance > 0 && user.trial_expiry) {
          user.stock_analysis_access = true;
        }

        user.updated_at = new Date().toISOString();
      }
    }

    // Identify any credited amount & rejection reason
    if (typeof creditedAmount === 'number') {
      transaction.credited_amount = creditedAmount;
    }

    // Attach admin message & update history
    if (normalizedStatus === 'completed') {
      transaction.admin_message = `Payment approved by admin ${adminId}`;
      transaction.admin_message_status = 'sent';
    } else if (normalizedStatus === 'failed') {
      transaction.admin_message = `Payment rejected by admin ${adminId}${rejectionReason ? `: ${rejectionReason}` : ''}`;
      transaction.admin_message_status = 'sent';
    }

    // Push to transaction history
    if (!transaction.history) transaction.history = [];
    transaction.history.push({ timestamp: new Date().toISOString(), admin_id: adminId, status: normalizedStatus, reason: rejectionReason, credited_amount: transaction.credited_amount });

    // Update transaction
    transaction.status = normalizedStatus as any;
    transaction.updated_at = new Date().toISOString();
    transaction.admin_id = adminId;
    if (rejectionReason) {
      (transaction as any).rejection_reason = rejectionReason; // optional field on transaction
    }

    db.wallet_transactions[transactionIndex] = transaction;
    writeDatabase(db);

    // Publish wallet event for this transaction update
    try {
      const user = db.users.find(u => u.id === transaction.user_id);
      eventBus.publish('wallet', {
        type: 'transaction_update',
        transaction: transaction,
        userId: transaction.user_id,
        walletBalance: user?.wallet_balance,
      });
    } catch (err) {
      // swallow
    }

    return { success: true, transaction };
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return { success: false };
  }
};

/**
 * Send email notification (simulated)
 */
export const sendEmailNotification = async (
  email: string,
  subject: string,
  content: string
): Promise<{ success: boolean }> => {
  try {
    // In a real implementation, this would send an actual email
    console.log(`Simulating email to ${email}: ${subject}\n${content}`);

    // For simulation purposes, return success
    return { success: true };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false };
  }
};