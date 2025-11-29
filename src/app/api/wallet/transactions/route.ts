// src/app/api/wallet/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getUserById, readDatabase } from '../../../../db/dbService';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = (session.user as any).id;
        const result = await getUserById(userId);

        if (!result.success || !result.user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const db = readDatabase();
        const transactions = db.wallet_transactions.filter(t => t.user_id === userId);

        return NextResponse.json({
            success: true,
            transactions
        });
    } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}