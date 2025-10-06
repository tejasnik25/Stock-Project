import { NextResponse } from 'next/server';
import { runAiAnalysis, type StrategyKey } from '@/lib/ai';
import { readDatabase, writeDatabase } from '@/db/dbService';

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

    const analysis = await runAiAnalysis(strategy, inputs || {});

    let savedId: string | undefined;
    if (save && userId) {
      const db = readDatabase();
      const user = db.users.find(u => u.id === userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const newAnalysis = {
        id: `analysis_${Date.now()}`,
        analysis_type: strategy === 'day' ? 'Intraday Trading' : strategy === 'swing' ? 'Swing Trading' : 'Intraday Trading',
        stock_name: undefined,
        analysis_result: JSON.stringify(analysis),
        image_path: inputs?.fifteenMin || inputs?.oneHour || inputs?.fiveMin,
        created_at: new Date().toISOString(),
      };
      user.analysis_history.unshift(newAnalysis as any);
      writeDatabase(db);
      savedId = newAnalysis.id;
    }

    return NextResponse.json({ analysis, id: savedId });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Failed to run analysis' }, { status: 500 });
  }
}
