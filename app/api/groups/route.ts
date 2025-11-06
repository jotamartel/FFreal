// API routes for Friends & Family Groups

import { NextRequest, NextResponse } from 'next/server';
import { 
  createGroup, 
  getGroupsByCustomerId, 
  getGroupsByMerchantId,
  getGroupByInviteCode,
  updateGroup,
  getDiscountConfig
} from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';
import { getUserById, findOrCreateUserByShopifyCustomerId } from '@/lib/database/users';
import { validateShopifySessionToken, extractCustomerIdFromToken } from '@/lib/auth/shopify-session';

/**
 * POST /api/groups - Create a new group (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    
    // Try Shopify session token first (for Customer Account Extensions)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const shopifySessionToken = await validateShopifySessionToken(token);
        if (shopifySessionToken) {
          const customerId = extractCustomerIdFromToken(shopifySessionToken);
          
          if (customerId) {
            // Find or create user by Shopify customer ID
            const user = await findOrCreateUserByShopifyCustomerId(customerId);
            if (user) {
              userId = user.id;
              console.log('[POST /api/groups] ✅ User found/created from Shopify token, userId:', userId);
            }
          } else {
            // Try to get customer ID from query parameter
            const { searchParams } = new URL(request.url);
            const customerIdFromQuery = searchParams.get('customerId');
            
            if (customerIdFromQuery) {
              console.log('[POST /api/groups] Using customer ID from query parameter:', customerIdFromQuery);
              const user = await findOrCreateUserByShopifyCustomerId(customerIdFromQuery);
              if (user) {
                userId = user.id;
                console.log('[POST /api/groups] ✅ User found/created from query param, userId:', userId);
              }
            }
          }
        }
      } catch (error: any) {
        console.error('[POST /api/groups] Error validating Shopify session token:', error);
        // Fall through to JWT session
      }
    }
    
    // Fallback to JWT session if no Shopify token or if Shopify token didn't work
    if (!userId) {
      const session = await getSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      userId = session.userId;
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user can create groups
    if (!user.can_create_groups) {
      return NextResponse.json(
        { error: 'You do not have permission to create groups. Please contact support to enable this feature.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { merchantId, name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Use default merchantId if not provided (for single-tenant apps)
    const finalMerchantId = merchantId || 'default';
    
    // Get max_members from configuration (admin-controlled, not user input)
    const config = await getDiscountConfig(finalMerchantId);
    const finalMaxMembers = config?.max_members_default || 6;

    const group = await createGroup({
      merchantId: finalMerchantId,
      name,
      ownerCustomerId: user.shopify_customer_id || user.id,
      ownerEmail: user.email,
      maxMembers: finalMaxMembers,
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
 * GET /api/groups - Get groups for a customer or merchant, or search by invite code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const merchantId = searchParams.get('merchantId');
    const inviteCode = searchParams.get('inviteCode');

    // Si hay un inviteCode, buscar por código
    if (inviteCode) {
      const group = await getGroupByInviteCode(inviteCode);
      if (!group) {
        return NextResponse.json(
          { error: 'Grupo no encontrado. Verifica el código de invitación.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ group }, { status: 200 });
    }

    if (!customerId && !merchantId) {
      return NextResponse.json(
        { error: 'customerId, merchantId, or inviteCode required' },
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

