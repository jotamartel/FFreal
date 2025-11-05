// API routes for Friends & Family Groups

import { NextRequest, NextResponse } from 'next/server';
import { 
  createGroup, 
  getGroupsByCustomerId, 
  getGroupsByMerchantId,
  updateGroup 
} from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/database/users';

/**
 * POST /api/groups - Create a new group (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { merchantId, name, maxMembers } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Use default merchantId if not provided (for single-tenant apps)
    const finalMerchantId = merchantId || 'default';

    const group = await createGroup({
      merchantId: finalMerchantId,
      name,
      ownerCustomerId: user.shopify_customer_id || user.id,
      ownerEmail: user.email,
      maxMembers,
      ownerUserId: user.id, // Vincular user_id
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/groups - Get groups for a customer or merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const merchantId = searchParams.get('merchantId');

    if (!customerId && !merchantId) {
      return NextResponse.json(
        { error: 'customerId or merchantId required' },
        { status: 400 }
      );
    }

    let groups;
    if (customerId) {
      groups = await getGroupsByCustomerId(customerId, merchantId || undefined);
    } else {
      const status = searchParams.get('status') as 'active' | 'suspended' | 'terminated' | null;
      groups = await getGroupsByMerchantId(merchantId!, status || undefined);
    }

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error('Error getting groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

