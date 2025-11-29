import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../auth';
import { getPendingTransactions, updateTransactionStatus, sendEmailNotification, getUserById } from '../../../../db/dbService';

/**
 * GET /api/admin/transactions
 * Get all pending transactions for admin verification
 */
/**
 * GET /api/admin/transactions
 * Get transactions for admin verification (pending or history)
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await checkAdminAuth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get status filter from URL
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');

    // Get transactions based on filter
    const db = await import('../../../../db/dbService');
    const allTransactions = db.readDatabase().wallet_transactions;

    let filteredTransactions = allTransactions;

    if (statusFilter === 'pending') {
      filteredTransactions = allTransactions.filter(t => t.status === 'pending');
    } else if (statusFilter === 'history') {
      filteredTransactions = allTransactions.filter(t => t.status !== 'pending');
    }
    // if no filter or 'all', return all (or default to pending if preferred, but let's support explicit filters)

    // For each transaction, get user details
    const transactionsWithUserDetails = await Promise.all(
      filteredTransactions.map(async (transaction) => {
        const userResult = await db.getUserById(transaction.user_id);
        return {
          ...transaction,
          user: userResult.success && userResult.user ? { name: userResult.user.name, email: userResult.user.email } : null
        };
      })
    );

    return NextResponse.json({ success: true, transactions: transactionsWithUserDetails });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/transactions/:id
 * Update transaction status (approve or reject)
 */
export async function PUT(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await checkAdminAuth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract transaction ID from URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const transactionId = pathSegments[pathSegments.length - 1];

    // Get request body
    const body = await req.json();
    const { status, tokens, creditedAmount, rejectionReason } = body;

    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected".' },
        { status: 400 }
      );
    }

    // Update transaction status
    const amountToCredit = typeof tokens === 'number' ? tokens : (typeof creditedAmount === 'number' ? creditedAmount : undefined);
    const result = await updateTransactionStatus(transactionId, status as 'approved' | 'rejected', session.user.id, amountToCredit, rejectionReason);

    if (!result.success || !result.transaction) {
      return NextResponse.json(
        { error: 'Failed to update transaction status' },
        { status: 404 }
      );
    }

    // Get user details
    const userResult = await getUserById(result.transaction.user_id);

    if (userResult.success && userResult.user) {
      const user = userResult.user;
      // Send email notification to user
      if (status === 'approved') {
        await sendEmailNotification(
          user.email,
          'Payment Approved',
          `Your payment of $${result.transaction.amount} has been approved.\nYour wallet has been credited with the amount.\n\nThank you for using our services!`
        );
      } else {
        await sendEmailNotification(
          user.email,
          'Payment Verification Failed',
          `We regret to inform you that your payment of $${result.transaction.amount} could not be verified.\nPlease check the transaction details and try again.\n\nIf you believe this is an error, please contact our support team.`
        );
      }
    }

    return NextResponse.json({ success: true, transaction: result.transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}