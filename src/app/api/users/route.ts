import { NextRequest, NextResponse } from 'next/server';

// GET /api/users - Get all users or a specific user
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the URL if provided
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    // Use dynamic import to avoid client-side import issues
    const { getAllUsers, getUserById } = await import('../../../db/dbService');
    
    if (userId) {
      // Get a specific user
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user });
    }
    
    // Get all users
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Update user wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, transactionId, paymentMethod } = body;
    
    if (!userId || !amount || !transactionId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Use dynamic import to avoid client-side import issues
    const { updateUserWallet } = await import('../../../db/dbService');
    
    // Update user wallet
    const updatedUser = await updateUserWallet(userId, parseFloat(amount), transactionId, paymentMethod);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user wallet:', error);
    return NextResponse.json({ error: 'Failed to update user wallet' }, { status: 500 });
  }
}