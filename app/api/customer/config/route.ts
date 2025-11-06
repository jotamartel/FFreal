// API endpoint to get group configuration (max_members_default)

import { NextRequest, NextResponse } from 'next/server';
import { getDiscountConfig } from '@/lib/database/ff-groups';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/config - Get group configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'default';

    const config = await getDiscountConfig(merchantId);

    // Return default values if config doesn't exist
    const maxMembersDefault = config?.max_members_default || 6;

    return NextResponse.json({
      maxMembersDefault,
      inviteRedirectUrl: config?.invite_redirect_url || null,
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

