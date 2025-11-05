// API routes for Friends & Family Groups

import { NextRequest, NextResponse } from 'next/server';
import { 
  createGroup, 
  getGroupsByCustomerId, 
  getGroupsByMerchantId,
  updateGroup 
} from '@/lib/database/ff-groups';

/**
 * POST /api/groups - Create a new group
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, name, ownerCustomerId, ownerEmail, maxMembers } = body;

    if (!merchantId || !name || !ownerCustomerId || !ownerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const group = await createGroup({
      merchantId,
      name,
      ownerCustomerId,
      ownerEmail,
      maxMembers,
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

