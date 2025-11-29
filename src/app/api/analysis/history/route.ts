import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getAnalysisHistory } from '../../../../db/dbService';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const history = await getAnalysisHistory(session.user.id);

        return NextResponse.json({ history: history || [] });
    } catch (error) {
        console.error('Error fetching analysis history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch history' },
            { status: 500 }
        );
    }
}
