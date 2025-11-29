import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserById, updateUserPassword, readDatabase } from '@/db/dbService';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();
    if (!email || !newPassword) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    // Ensure user has verified the OTP (email_verified property set)
    const db = readDatabase();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (!user.email_verified) {
      return NextResponse.json({ success: false, error: 'OTP not verified' }, { status: 403 });
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await updateUserPassword(email, hashed);
    if (!result.success) return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('reset-password error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
