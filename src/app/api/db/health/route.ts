import { NextResponse } from 'next/server';
import pool from '@/db/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    console.error('DB health error:', err);
    return NextResponse.json({ ok: false, error: 'DB connection failed' }, { status: 500 });
  }
}
