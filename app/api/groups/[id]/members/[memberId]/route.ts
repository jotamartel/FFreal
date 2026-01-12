// API route for removing a specific member from a group

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getGroupById, getMemberById, removeMemberFromGroup } from '@/lib/database/ff-groups';
import { getUserById, findOrCreateUserByShopifyCustomerId } from '@/lib/database/users';
import { validateShopifySessionToken, extractCustomerIdFromToken } from '@/lib/auth/shopify-session';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id: groupId, memberId } = params;

    if (!groupId || !memberId) {
      return NextResponse.json(
        { error: 'Group ID and member ID are required' },
        { status: 400 }
      );
    }

    // Resolve current user from Shopify session token or fallback to JWT session
    let user = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const shopifySessionToken = await validateShopifySessionToken(token);
        if (shopifySessionToken) {
          const customerId = extractCustomerIdFromToken(shopifySessionToken);
          if (customerId) {
            user = await findOrCreateUserByShopifyCustomerId(customerId);
          } else {
            const { searchParams } = new URL(request.url);
            const customerIdFromQuery = searchParams.get('customerId');
            if (customerIdFromQuery) {
              user = await findOrCreateUserByShopifyCustomerId(customerIdFromQuery);
            }
          }
        }
      } catch (error) {
        console.error('[DELETE /api/groups/[id]/members/[memberId]] Shopify token validation failed:', error);
      }
    }

    if (!user) {
      const session = await getSession();
      if (session?.userId) {
        user = await getUserById(session.userId);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const member = await getMemberById(memberId);
    if (!member || member.group_id !== groupId) {
      return NextResponse.json(
        { error: 'Member not found in this group' },
        { status: 404 }
      );
    }

    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'No es posible eliminar al propietario del grupo.' },
        { status: 400 }
      );
    }

    const isGroupOwner = group.owner_user_id === user.id;
    const isSelfRemoval = member.user_id === user.id || member.email?.toLowerCase() === user.email?.toLowerCase();

    if (!isGroupOwner && !isSelfRemoval) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este miembro.' },
        { status: 403 }
      );
    }

    const success = await removeMemberFromGroup(memberId);
    if (!success) {
      return NextResponse.json(
        { error: 'No se pudo eliminar al miembro. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error removing group member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
