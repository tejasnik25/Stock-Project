import { NextResponse } from 'next/server';
import { checkAdminAuth } from '../../auth';
import { updateTransactionStatus } from '@/db/dbService';

// Using a simpler approach for the route handler to fix build issues
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    const session = await checkAdminAuth();
    
    // Check if user is authenticated and is an admin
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transactionId = id;
    const { status, tokens, rejectionReason } = await request.json();

    // Normalize status. Expect 'completed' or 'failed' from client.
    const normalizedStatus = String(status || '').toLowerCase();
    const dbStatus = normalizedStatus === 'completed' || normalizedStatus === 'approved' ? 'completed' : 'failed';

    // Update transaction status, optionally using tokens to override credited amount
    const creditedAmount = typeof tokens === 'number' ? tokens : (typeof tokens === 'string' && tokens ? parseFloat(tokens) : undefined);
    const updateResult = await updateTransactionStatus(transactionId, dbStatus as any, session.user.id, creditedAmount, rejectionReason);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, message: updateResult.error },
        { status: 400 }
      );
    }

    // No separate updateUserTokens call; credited amount is handled by updateTransactionStatus via creditedAmount parameter.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}