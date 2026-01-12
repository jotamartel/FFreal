// API routes for individual Friends & Family Group

import { NextRequest, NextResponse } from 'next/server';
import { getGroupById, updateGroup, getGroupMembers, syncGroupMemberCount, getPendingInvitationsByGroupId } from '@/lib/database/ff-groups';

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

    // Sync member count first to ensure accuracy
    await syncGroupMemberCount(params.id);
    
    // Get updated group with correct count
    const updatedGroup = await getGroupById(params.id);
    
    // Get members (include all statuses for admin view)
    const allMembers = await getGroupMembers(params.id, true);
    const activeMembers = allMembers.filter(m => m.status === 'active');
    
    // Get pending invitations
    const pendingInvitations = await getPendingInvitationsByGroupId(params.id);
    
    console.log('[GET /api/groups/[id]] Group details:', {
      groupId: params.id,
      membersCount: activeMembers.length,
      members: activeMembers.map((m: any) => ({
        id: m.id,
        email: m.email,
        status: m.status,
        role: m.role,
      })),
      pendingInvitationsCount: pendingInvitations.length,
      pendingInvitations: pendingInvitations.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        expires_at: inv.expires_at,
      })),
    });

    return NextResponse.json({ 
      group: updatedGroup || group,
      members: activeMembers, // Show only active members by default
      allMembers: allMembers, // Include all for reference
      pendingInvitations: pendingInvitations, // Invitations that haven't been accepted yet
      memberCountBreakdown: {
        total: allMembers.length,
        active: activeMembers.length,
        inactive: allMembers.filter(m => m.status !== 'active').length,
      },
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

