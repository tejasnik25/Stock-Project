import { NextRequest, NextResponse } from 'next/server';
import { generateOTP } from '@/utils/auth';
import { setUserOtp, verifyUserOtp, getUserById } from '@/db/dbService';
import { sendEmailViaResend, buildOtpTemplate } from '@/lib/email';

export async function POST(req: NextRequest) {
  // OTP-based verification has been removed. This endpoint remains for backward-compatibility but returns a 410 GONE status.
  return NextResponse.json({ success: false, error: 'OTP-based verification is disabled' }, { status: 410 });
}
