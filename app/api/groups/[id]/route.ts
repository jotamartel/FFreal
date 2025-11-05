// API routes for individual Friends & Family Group

import { NextRequest, NextResponse } from 'next/server';
import { getGroupById, updateGroup, getGroupMembers } from '@/lib/database/ff-groups';

/**
 * GET /api/groups/[id] - Get group details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await getGroupById(params.id);

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Get members
    const members = await getGroupMembers(params.id);

    return NextResponse.json({ 
      group,
      members 
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/groups/[id] - Update group
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, maxMembers, status } = body;

    const group = await updateGroup({
      id: params.id,
      name,
      maxMembers,
      status,
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group }, { status: 200 });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

