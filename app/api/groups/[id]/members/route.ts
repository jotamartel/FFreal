// API routes for group members

import { NextRequest, NextResponse } from 'next/server';
import { 
  getGroupMembers, 
  removeMemberFromGroup,
  updateMember 
} from '@/lib/database/ff-groups';

/**
 * GET /api/groups/[id]/members - Get all members of a group
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const members = await getGroupMembers(params.id);
    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error('Error getting members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groups/[id]/members/[memberId] - Remove a member from group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const success = await removeMemberFromGroup(params.memberId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

