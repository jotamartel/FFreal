// API routes for group members

import { NextRequest, NextResponse } from 'next/server';
import { 
  getGroupMembers,
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
 * PUT /api/groups/[id]/members - Update member status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // The PUT handler for updating member status is moved to a nested route.
    // This function will be removed or refactored in a subsequent edit.
    return NextResponse.json({ message: 'PUT request for updating member status is not yet implemented.' }, { status: 501 });
  } catch (error) {
    console.error('Error updating member status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

