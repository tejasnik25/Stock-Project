import { NextResponse } from 'next/server';
import { getAllStrategies } from '@/db/dbService';

export async function GET() {
    try {
        const strategies = getAllStrategies();
        return NextResponse.json({ strategies });
    } catch (error) {
        console.error('Error fetching strategies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch strategies' },
            { status: 500 }
        );
    }
}
