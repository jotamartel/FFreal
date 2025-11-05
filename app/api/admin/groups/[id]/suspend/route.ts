// Admin API route to suspend/terminate a group

import { NextRequest, NextResponse } from 'next/server';
import { updateGroup } from '@/lib/database/ff-groups';

/**
 * POST /api/admin/groups/[id]/suspend - Suspend or terminate a group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action } = body; // 'suspend' or 'terminate'

    if (!action || !['suspend', 'terminate'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "suspend" or "terminate"' },
        { status: 400 }
      );
    }

    const group = await updateGroup({
      id: params.id,
      status: action === 'suspend' ? 'suspended' : 'terminated',
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group }, { status: 200 });
  } catch (error) {
    console.error('Error suspending group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

