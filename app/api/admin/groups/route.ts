// Admin API routes for groups management

import { NextRequest, NextResponse } from 'next/server';
import { getGroupsByMerchantId, updateGroup } from '@/lib/database/ff-groups';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/groups - Get all groups for merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status') as 'active' | 'suspended' | 'terminated' | null;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const groups = await getGroupsByMerchantId(merchantId, status || undefined);

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error('Error getting admin groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

