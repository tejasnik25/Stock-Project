export type User = {
    id: string;
    name: string;
    email: string;
    password?: string; // Optional because we often omit it
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

export type AnalysisHistory = {
    id: string;
    analysis_type: 'Intraday Trading' | 'Positional Trading' | 'Swing Trading';
    stock_name?: string;
    analysis_result?: string;
    image_path?: string;
    priceCharged?: number; // Store how much was charged (tokens) for this analysis
    pricingSnapshot?: { analysis_type: string; price: number } | null;
    created_at: string;
};

export type AnalysisPricing = {
    analysis_type: 'Intraday Trading' | 'Positional Trading' | 'Swing Trading';
    price: number;
    description: string;
};

export type WalletTransaction = {
    id: string;
    user_id: string;
    amount: number;
    transaction_type: 'deposit' | 'charge';
    payment_method?: string;
    transaction_id?: string;
    receipt_path?: string;
    status: 'pending' | 'completed' | 'failed' | 'in-process';
    admin_id?: string;
    rejection_reason?: string;
    updated_at?: string;
    created_at: string;
    admin_message?: string; // Optional admin triage messages
    admin_message_status?: 'pending' | 'sent' | 'resolved';
    credited_amount?: number; // amount actually credited when approved (optional)
    history?: Array<{ timestamp: string; admin_id?: string; status: string; reason?: string; credited_amount?: number }>;
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
