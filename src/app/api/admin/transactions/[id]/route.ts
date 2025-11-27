import { NextResponse } from 'next/server';
import { checkAdminAuth } from '../../auth';
import { updateTransactionStatus, updateUserTokens } from '@/db/dbService';

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
    const { status, tokens } = await request.json();

    // Normalize status. Expect 'completed' or 'failed' from client.
    const normalizedStatus = String(status || '').toLowerCase();
    const dbStatus = normalizedStatus === 'completed' || normalizedStatus === 'approved' ? 'completed' : 'failed';

    // Update transaction status
    const updateResult = await updateTransactionStatus(transactionId, dbStatus as any, session.user.id);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, message: updateResult.error },
        { status: 400 }
      );
    }

    // If transaction is approved and tokens are provided, update user tokens
    if (dbStatus === 'completed' && typeof tokens === 'number' && tokens > 0) {
      const transaction = updateResult.transaction;
      // Credit the user's wallet with the provided tokens amount
      const updateTokensResult = await updateUserTokens(transaction.user_id, tokens);
      if (!updateTokensResult.success) {
        return NextResponse.json(
          { success: false, message: 'Failed to update user tokens' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}