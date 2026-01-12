// Endpoint de prueba para verificar invitaciones pendientes de un grupo
import { NextRequest, NextResponse } from 'next/server';
import { getPendingInvitationsByGroupId } from '@/lib/database/ff-groups';
import { pool } from '@/lib/database/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId parameter is required' },
        { status: 400 }
      );
    }

    // Get pending invitations using the function
    const pendingInvitations = await getPendingInvitationsByGroupId(groupId);

    // Also get all invitations (for debugging)
    const allInvitationsResult = await pool.query(
      `SELECT * FROM ff_invitations 
       WHERE group_id = $1 
       ORDER BY created_at DESC`,
      [groupId]
    );
    const allInvitations = allInvitationsResult.rows;

    return NextResponse.json({
      groupId,
      pendingInvitations,
      allInvitations,
      counts: {
        pending: pendingInvitations.length,
        total: allInvitations.length,
        byStatus: {
          pending: allInvitations.filter((i: any) => i.status === 'pending').length,
          accepted: allInvitations.filter((i: any) => i.status === 'accepted').length,
          expired: allInvitations.filter((i: any) => i.status === 'expired').length,
          declined: allInvitations.filter((i: any) => i.status === 'declined').length,
        },
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error testing invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
