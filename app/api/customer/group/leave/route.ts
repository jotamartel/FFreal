// API route to leave a group

import { NextRequest, NextResponse } from 'next/server';
import { removeMemberFromGroup, getGroupMembers, getMemberByEmailAndGroup } from '@/lib/database/ff-groups';

/**
 * POST /api/customer/group/leave - Leave a group
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, customerId, email } = body;

    if (!groupId || (!customerId && !email)) {
      return NextResponse.json(
        { error: 'groupId and (customerId or email) are required' },
        { status: 400 }
      );
    }

    // Find member
    let member;
    if (customerId) {
      const members = await getGroupMembers(groupId);
      member = members.find(m => m.customer_id === customerId);
    } else {
      member = await getMemberByEmailAndGroup(email, groupId);
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found in group' },
        { status: 404 }
      );
    }

    // Don't allow owner to leave
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner cannot leave group. Transfer ownership first.' },
        { status: 400 }
      );
    }

    const success = await removeMemberFromGroup(member.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to leave group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

