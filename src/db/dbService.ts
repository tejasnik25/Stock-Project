// Define types
import bcrypt from 'bcryptjs';
import { hashPassword } from '@/lib/auth';
import pool from './db'; // Import centralized database connection

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  wallet_balance: number;
  stock_analysis_access: boolean;
  analysis_count: number;
  trial_expiry: boolean;
  role: 'USER' | 'ADMIN';
  email_verified: boolean;
  analysis_history: AnalysisHistory[];
  created_at: string;
  updated_at: string;
};

type AnalysisHistory = {
  id: string;
  analysis_type: 'Intraday Trading' | 'Positional Trading' | 'Swing Trading';
  stock_name?: string;
  analysis_result?: string;
  image_path?: string;
  created_at: string;
};

type AnalysisPricing = {
  analysis_type: 'Intraday Trading' | 'Positional Trading' | 'Swing Trading';
  price: number;
  description: string;
};

type WalletTransaction = {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'deposit' | 'charge';
  payment_method?: string;
  transaction_id?: string;
  receipt_path?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export type Strategy = {
  id: string;
  name: string;
  description: string;
  performance: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  category: 'Growth' | 'Income' | 'Momentum' | 'Value';
  imageUrl: string;
  details: string;
  parameters: Record<string, string>;
  created_at: string;
  updated_at: string;
};

type Database = {
  users: User[];
  analysis_pricing: AnalysisPricing[];
  wallet_transactions: WalletTransaction[];
  strategies: Strategy[];
};

// Initialize database
const database: Database = {
  users: [],
  analysis_pricing: [],
  wallet_transactions: [],
  strategies: []
};

// Add day trading strategy
export function addDayTradingStrategy() {
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
  const existingIndex = database.strategies.findIndex(s => s.id === dayTradingStrategy.id);
  if (existingIndex >= 0) {
    // Update existing strategy
    database.strategies[existingIndex] = dayTradingStrategy;
  } else {
    // Add new strategy
    database.strategies.push(dayTradingStrategy);
  }

  return dayTradingStrategy;
}

// Mock database functions for transactions and token management

// Analytics functions for admin dashboard
export function getAnalyticsData() {
  try {
    // User statistics
    const totalUsers = database.users.length;
    const activeUsers = database.users.filter(user => user.stock_analysis_access).length;
    const inactiveUsers = totalUsers - activeUsers;
    const adminUsers = database.users.filter(user => user.role === 'ADMIN').length;
    const regularUsers = database.users.filter(user => user.role === 'USER').length;

    // Payment statistics
    const allTransactions = database.transactions || [];
    const pendingPayments = allTransactions.filter(t => t.status === 'pending').length;
    const approvedPayments = allTransactions.filter(t => t.status === 'completed').length;
    const rejectedPayments = allTransactions.filter(t => t.status === 'failed').length;
    const totalPayments = allTransactions.length;

    // Revenue statistics
    const totalRevenue = allTransactions
      .filter(t => t.status === 'completed' && t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Strategy statistics
    const totalStrategies = database.strategies.length;

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
    const user = database.users.find(u => u.id === userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Add tokens to user's wallet balance
    user.wallet_balance += tokens;
    user.updated_at = new Date().toISOString();
    
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

export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    // Check if user with email already exists
    const existingUser = database.users.find(u => u.email === userData.email);
    
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
      stock_analysis_access: false,
      analysis_count: 0,
      trial_expiry: false,
      role: 'USER',
      email_verified: false,
      analysis_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add user to database
    database.users.push(newUser);
    
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
      price: 10,
      description: "Analysis for day trading strategies"
    },
    {
      analysis_type: "Positional Trading",
      price: 15,
      description: "Analysis for multi-day trading positions"
    },
    {
      analysis_type: "Swing Trading",
      price: 20,
      description: "Analysis for multi-week trading strategies"
    }
  ],
  wallet_transactions: [],
  strategies: [
    {
      id: '1',
      name: 'Growth Accelerator',
      description: 'Focuses on high-growth stocks with strong earnings potential.',
      performance: 16.5,
      riskLevel: 'Medium',
      category: 'Growth',
      imageUrl: '/strategy1.svg',
      details: 'This strategy uses machine learning algorithms to analyze historical data and identify stocks with the highest potential for growth. It focuses on companies with strong earnings growth, innovative products, and expanding market share.',
      parameters: {
        'Time Horizon': 'Long-term',
        'Sector Focus': 'Technology, Healthcare',
        'Rebalancing': 'Quarterly',
        'Position Size': '5-10 stocks'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Dividend Aristocrat',
      description: 'Focuses on established companies with consistent dividend growth over 25+ years.',
      performance: 12.3,
      riskLevel: 'Low',
      category: 'Income',
      imageUrl: '/strategy2.svg',
      details: 'This income-focused strategy invests in companies that have increased their dividends for at least 25 consecutive years. These companies tend to be financially stable with predictable cash flows, making them suitable for risk-averse investors seeking regular income.',
      parameters: {
        'Dividend Yield': '2-4%',
        'Payout Ratio': '<60%',
        'Market Cap': 'Large-cap',
        'Sector Focus': 'Consumer Staples, Utilities, Healthcare'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Momentum Trader',
      description: 'Capitalizes on recent price trends and market momentum for short-term gains.',
      performance: 18.7,
      riskLevel: 'High',
      category: 'Momentum',
      imageUrl: '/strategy3.svg',
      details: 'This aggressive strategy identifies stocks with strong recent price performance and high trading volumes. It aims to ride the momentum wave before the trend reverses, making it suitable for active traders comfortable with higher risk and frequent trading.',
      parameters: {
        'Time Horizon': 'Short-term',
        'Lookback Period': '3-6 months',
        'Volume Threshold': 'Above average',
        'Rebalancing': 'Weekly'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Value Investor',
      description: 'Finds undervalued stocks with solid fundamentals trading below their intrinsic value.',
      performance: 15.2,
      riskLevel: 'Medium',
      category: 'Value',
      imageUrl: '/strategy4.svg',
      details: 'This strategy follows the principles of value investing, seeking companies trading at a discount to their intrinsic value. It focuses on metrics like price-to-earnings ratio, price-to-book ratio, and dividend yield to identify potential bargains in the market.',
      parameters: {
        'P/E Ratio': '<Industry Average',
        'P/B Ratio': '<1.5',
        'Debt/Equity': '<1',
        'Return on Equity': '>10%'
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

/**
 * Read the database
 */
export const readDatabase = (): Database => {
  return JSON.parse(JSON.stringify(mockDatabase));
};

/**
 * Write to the database
 */
export const writeDatabase = (data: Database): void => {
  mockDatabase = JSON.parse(JSON.stringify(data));
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
    if (!user) {
      console.log('Login failed: User not found with email:', email);
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
  const transaction: WalletTransaction = {
    id: `trans${Date.now()}`,
    user_id: userId,
    amount,
    transaction_type: transactionType,
    payment_method: paymentMethod,
    transaction_id: transactionId,
    receipt_path: receiptPath,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  // Add to database
  db.wallet_transactions.push(transaction);
  writeDatabase(db);
  
  return { success: true, transaction };
};

/**
 * Add analysis history
 */
export const addAnalysisHistory = async (
  userId: string,
  analysisType: 'Intraday Trading' | 'Positional Trading' | 'Swing Trading',
  stockName?: string,
  analysisResult?: string,
  imagePath?: string
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
  paymentMethod: string
): Promise<Omit<User, 'password'> | null> => {
  try {
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return null;
    
    // Update wallet balance
    db.users[userIndex].wallet_balance += amount;
    db.users[userIndex].updated_at = new Date().toISOString();
    
    // Create transaction
    const transaction: WalletTransaction = {
      id: `trans${Date.now()}`,
      user_id: userId,
      amount,
      transaction_type: 'deposit',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Add to database
    db.wallet_transactions.push(transaction);
    
    // If wallet balance is now positive, restore access if it was disabled due to trial expiry
    if (db.users[userIndex].wallet_balance > 0 && db.users[userIndex].trial_expiry) {
      db.users[userIndex].stock_analysis_access = true;
    }
    
    // Save to database
    writeDatabase(db);
    
    // Return updated user without sensitive information
    const { password: _, ...safeUser } = db.users[userIndex];
    return safeUser;
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
      
      // Deduct from wallet
      user.wallet_balance -= price;
      
      // Ensure wallet balance doesn't go below 0
      if (user.wallet_balance < 0) {
        user.wallet_balance = 0;
      }
      
      // Create transaction for the charge
      const transaction: WalletTransaction = {
        id: `trans${Date.now()}`,
        user_id: userId,
        amount: price,
        transaction_type: 'charge',
        status: 'completed',
        created_at: new Date().toISOString()
      };
      
      db.wallet_transactions.push(transaction);
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
  status: 'completed' | 'failed',
  adminId: string
): Promise<{ success: boolean; transaction?: WalletTransaction }> => {
  try {
    const db = readDatabase();
    const transactionIndex = db.wallet_transactions.findIndex(txn => txn.id === transactionId);
    
    if (transactionIndex === -1) {
      return { success: false };
    }
    
    const transaction = db.wallet_transactions[transactionIndex];
    
    // If completed, credit the user's wallet
    if (status === 'completed' && transaction.transaction_type === 'deposit') {
      const user = db.users.find(u => u.id === transaction.user_id);
      if (user) {
        user.wallet_balance += transaction.amount;
        
        // If wallet balance is now positive, restore access if it was disabled due to trial expiry
        if (user.wallet_balance > 0 && user.trial_expiry) {
          user.stock_analysis_access = true;
        }
        
        user.updated_at = new Date().toISOString();
      }
    }
    
    // Update transaction
    transaction.status = status;
    transaction.updated_at = new Date().toISOString();
    transaction.admin_id = adminId;
    
    db.wallet_transactions[transactionIndex] = transaction;
    writeDatabase(db);
    
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