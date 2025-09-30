import { NextRequest, NextResponse } from 'next/server';

// POST /api/analysis - Submit a new stock analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, analysisType, stockName, imageData } = body;
    
    if (!userId || !analysisType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Use dynamic import to avoid client-side import issues
    const { submitAnalysis, getUserById } = await import('../../../db/dbService');
    
    // Check if user exists and has access
    const userResult = await getUserById(userId);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = userResult.user;
    
    // Check if user has access to analysis
    const hasTrialAccess = user.analysis_count < 5;
    const hasWalletBalance = user.wallet_balance > 0;
    
    if (!hasTrialAccess && !hasWalletBalance) {
      return NextResponse.json({ 
        error: 'No access to analysis. Please top up your wallet.'
      }, { status: 403 });
    }
    
    // Submit analysis
    const result = await submitAnalysis(userId, analysisType, stockName, imageData);
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error submitting analysis:', error);
    return NextResponse.json({ error: 'Failed to submit analysis' }, { status: 500 });
  }
}

// GET /api/analysis - Get analysis history for a user
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Use dynamic import to avoid client-side import issues
    const { getAnalysisHistory } = await import('../../../db/dbService');
    
    // Get analysis history
    const history = await getAnalysisHistory(userId);
    
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis history' }, { status: 500 });
  }
}