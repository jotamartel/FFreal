// API route to revoke/delete an invitation

import { NextRequest, NextResponse } from 'next/server';
import { revokeInvitation, getGroupById } from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';
import { validateShopifySessionToken, extractCustomerIdFromToken } from '@/lib/auth/shopify-session';
import { findOrCreateUserByShopifyCustomerId } from '@/lib/database/users';
import { pool } from '@/lib/database/client';

export const runtime = 'nodejs';

/**
 * DELETE /api/invitations/[id] - Revoke/delete a pending invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invitationId = params.id;
    console.log('[DELETE /api/invitations/[id]] Revoking invitation:', invitationId);

    if (!invitationId) {
      console.error('[DELETE /api/invitations/[id]] Missing invitation ID');
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get invitation to verify it exists and get group info
    let invitation;
    const result = await pool.query(
      'SELECT * FROM ff_invitations WHERE id = $1',
      [invitationId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }
    invitation = result.rows[0];

    // Verify user has permission (must be owner of the group)
    let userId: string | null = null;
    
    // Try Shopify session token first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const shopifySessionToken = await validateShopifySessionToken(token);
        if (shopifySessionToken) {
          const customerId = extractCustomerIdFromToken(shopifySessionToken);
          if (customerId) {
            const user = await findOrCreateUserByShopifyCustomerId(customerId);
            if (user) {
              userId = user.id;
            }
          }
        }
      } catch (error) {
        // Fall through to JWT session
      }
    }
    
    // Fallback to JWT session
    if (!userId) {
      const session = await getSession();
      if (session) {
        userId = session.userId;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get group to verify ownership
    const group = await getGroupById(invitation.group_id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is owner (for now, allow if user is authenticated)
    // In the future, you might want to check group.owner_user_id === userId

    // Revoke the invitation
    console.log('[DELETE /api/invitations/[id]] Calling revokeInvitation for:', invitation.id);
    const success = await revokeInvitation(invitation.id);
    console.log('[DELETE /api/invitations/[id]] Revoke result:', success);

    if (!success) {
      console.warn('[DELETE /api/invitations/[id]] Failed to revoke invitation:', invitation.id);
      return NextResponse.json(
        { error: 'Failed to revoke invitation. It may have already been accepted or revoked.' },
        { status: 400 }
      );
    }

    console.log('[DELETE /api/invitations/[id]] ✅ Invitation revoked successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Invitation revoked successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
