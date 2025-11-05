// API routes for customer's group

import { NextRequest, NextResponse } from 'next/server';
import { getGroupsByUserId, getGroupsByCustomerId } from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/customer/group - Get customer's groups (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    // Get groups by user_id (preferred) or fallback to customer_id if user_id not available
    const groups = await getGroupsByUserId(session.userId, merchantId || undefined);

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error('Error getting customer group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

