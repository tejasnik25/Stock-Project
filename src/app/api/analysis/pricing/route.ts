import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisPricing } from '@/db/dbService';

export async function GET(req: NextRequest) {
  try {
    const pricing = await getAnalysisPricing();
    return NextResponse.json({ success: true, pricing });
  } catch (error) {
    console.error('Failed to get analysis pricing:', error);
    return NextResponse.json({ error: 'Failed to get pricing' }, { status: 500 });
  }
}
