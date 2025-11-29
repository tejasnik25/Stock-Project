import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // OTP functionality removed.
  return NextResponse.json({ success: false, error: 'OTP-based verification is disabled' }, { status: 410 });
}
