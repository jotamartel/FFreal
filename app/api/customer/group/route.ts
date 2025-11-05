// API routes for customer's group

import { NextRequest, NextResponse } from 'next/server';
import { getGroupsByCustomerId } from '@/lib/database/ff-groups';

/**
 * GET /api/customer/group - Get customer's group
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const merchantId = searchParams.get('merchantId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const groups = await getGroupsByCustomerId(customerId, merchantId || undefined);

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error('Error getting customer group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

