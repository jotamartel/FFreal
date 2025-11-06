// API route to get discount code for a group

import { NextRequest, NextResponse } from 'next/server';
import { getGroupById } from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/groups/[id]/discount-code - Get discount code for a group
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;

    // Get user from session (optional - can be public for group members)
    const session = await getSession();
    const userId = session?.userId;

    // Get group
    const group = await getGroupById(groupId);

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is member of the group (optional check)
    // For now, we'll allow anyone with the group ID to see the discount code
    // You can add more strict checks if needed

    if (!group.discount_code) {
      return NextResponse.json(
        { error: 'No discount code available for this group' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      discountCode: group.discount_code,
      discountTier: group.discount_tier,
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting discount code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

