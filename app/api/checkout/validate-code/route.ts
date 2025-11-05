// API route to validate group code at checkout

import { NextRequest, NextResponse } from 'next/server';
import { getGroupByInviteCode, calculateDiscount } from '@/lib/database/ff-groups';

/**
 * POST /api/checkout/validate-code - Validate a group invite code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, merchantId } = body;

    if (!code || !merchantId) {
      return NextResponse.json(
        { error: 'code and merchantId are required' },
        { status: 400 }
      );
    }

    const group = await getGroupByInviteCode(code);

    if (!group || group.merchant_id !== merchantId) {
      return NextResponse.json(
        { error: 'Invalid group code' },
        { status: 404 }
      );
    }

    if (group.status !== 'active') {
      return NextResponse.json(
        { error: 'Group is not active' },
        { status: 400 }
      );
    }

    // Calculate discount for this group
    const discount = await calculateDiscount(merchantId, group.current_members);

    return NextResponse.json({
      valid: true,
      group: {
        id: group.id,
        name: group.name,
        currentMembers: group.current_members,
        maxMembers: group.max_members,
      },
      discount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error validating code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

