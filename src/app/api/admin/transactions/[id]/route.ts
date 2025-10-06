import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateTransactionStatus, updateUserTokens } from '@/db/dbService';

// Using a simpler approach for the route handler to fix build issues
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    const session = await getServerSession();
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transactionId = id;
    const { status, tokens } = await request.json();

    // Update transaction status
    const updateResult = await updateTransactionStatus(transactionId, status, session.user.id);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update transaction status' },
        { status: 400 }
      );
    }

    // If transaction is approved and tokens are provided, update user tokens
    if (status === 'APPROVED' && typeof tokens === 'number' && tokens > 0) {
      const transaction = updateResult.transaction;
      if (!transaction) {
        return NextResponse.json(
          { success: false, message: 'Transaction not found after update' },
          { status: 400 }
        );
      }
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