// API routes for Branches

import { NextRequest, NextResponse } from 'next/server';
import { getActiveBranches, getAllBranches } from '@/lib/database/branches';

export const dynamic = 'force-dynamic';

/**
 * GET /api/branches - Get branches
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let branches;
    if (activeOnly) {
      branches = await getActiveBranches(merchantId || undefined);
    } else {
      branches = await getAllBranches(merchantId || undefined);
    }

    return NextResponse.json({ branches }, { status: 200 });
  } catch (error) {
    console.error('Error getting branches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

