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
    let merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status') as 'active' | 'suspended' | 'terminated' | null;

    // If no merchantId provided, default to 'default' for single-tenant apps
    // In multi-tenant apps, this would come from Shopify session
    if (!merchantId) {
      merchantId = 'default';
    }

    console.log('[ADMIN GROUPS] Fetching groups:', {
      merchantId,
      status: status || 'all',
    });

    const groups = await getGroupsByMerchantId(merchantId, status || undefined);

    console.log('[ADMIN GROUPS] Found groups:', groups.length);

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error('Error getting admin groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

