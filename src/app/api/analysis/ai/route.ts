import { NextResponse } from 'next/server';
import { runAiAnalysis, validateVisionImage, type StrategyKey } from '@/lib/ai';
import { readDatabase, writeDatabase, addWalletTransaction } from '@/db/dbService';
import eventBus from '@/lib/eventBus';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { strategy, inputs, save, userId } = body as {
      strategy: StrategyKey;
      inputs: { fifteenMin?: string; oneHour?: string; fiveMin?: string };
      save?: boolean;
      userId?: string;
    };

    if (!strategy) {
      return NextResponse.json({ error: 'strategy is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const db = readDatabase();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine analysis type and price
    let analysisType = 'Intraday Trading';
    if (strategy === 'swing') analysisType = 'Swing Trading';
    else if (strategy === 'scalp') analysisType = 'Positional Trading'; // Assuming scalp maps to Positional for pricing

    const pricing = db.analysis_pricing.find(p => p.analysis_type === analysisType);
    const price = pricing ? pricing.price : 0;

    // Check balance: allow first 5 analyses as trial without charging, afterwards require tokens
    const hasTrialAccess = user.analysis_count < 5;
    if (!hasTrialAccess && user.wallet_balance < price) {
      return NextResponse.json({ error: 'Your account don\'t have enough tokens, please top-up your wallet' }, { status: 402 });
    }

    // Validate uploaded images (vision or heuristic)
    for (const k of ['fifteenMin', 'oneHour', 'fiveMin']) {
      const val = (inputs as any)[k];
      if (val) {
        const v = await validateVisionImage(val);
        if (!v.isChart) {
          return NextResponse.json({ error: `Uploaded image appears invalid: ${v.reason || 'Not a chart'}` }, { status: 400 });
        }
      }
    }

    // Run AI Analysis
    let analysis;
    try {
      analysis = await runAiAnalysis(strategy, inputs || {});
    } catch (err: any) {
      // Image validation or user input error
      const message = err?.message || 'Failed to run analysis';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Deduct tokens and record transaction (only after trial is exhausted)
    let tokensCharged = 0;
    if (price > 0 && !hasTrialAccess) {
      user.wallet_balance -= price;
      if (user.wallet_balance < 0) user.wallet_balance = 0;
      tokensCharged = price;
      // Create transaction via db service helper
      const addResult = await addWalletTransaction(userId, price, 'charge');
      if (addResult.success && addResult.transaction) {
        // mark transaction as completed and add to db again
        const txn = addResult.transaction;
        txn.status = 'completed';
        writeDatabase(db);
      }
    }

    // Increment analysis count for trial tracking and usage
    user.analysis_count = (user.analysis_count || 0) + 1;

    let savedId: string | undefined;
    if (save) {
      const newAnalysis = {
        id: `analysis_${Date.now()}`,
        analysis_type: analysisType,
        stock_name: undefined,
        analysis_result: JSON.stringify(analysis),
        image_path: inputs?.fifteenMin || inputs?.oneHour || inputs?.fiveMin,
        created_at: new Date().toISOString(),
        priceCharged: price > 0 && !hasTrialAccess ? price : 0,
        pricingSnapshot: { analysis_type: analysisType, price }
      };
      if (!user.analysis_history) {
        user.analysis_history = [];
      }
      user.analysis_history.unshift(newAnalysis as any);
      savedId = newAnalysis.id;
    }

    user.updated_at = new Date().toISOString();
    writeDatabase(db);

    if (price > 0 && !hasTrialAccess) {
      try {
        eventBus.publish('wallet', { type: 'analysis_charge', userId, amount: price, walletBalance: user.wallet_balance });
      } catch (err) {}
    }

    return NextResponse.json({ analysis, id: savedId, remainingBalance: user.wallet_balance, tokensCharged });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Failed to run analysis' }, { status: 500 });
  }
}
