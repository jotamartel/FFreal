// API endpoint to check user permissions for creating groups

import { NextRequest, NextResponse } from 'next/server';
import { getUserById, findOrCreateUserByShopifyCustomerId } from '@/lib/database/users';
import { getSession } from '@/lib/auth/session';
import { validateShopifySessionToken, extractCustomerIdFromToken } from '@/lib/auth/shopify-session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/permissions - Check if user can create groups
 */
export async function GET(request: NextRequest) {
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
            const user = await findOrCreateUserByShopifyCustomerId(customerId);
            if (user) {
              userId = user.id;
            }
          } else {
            // Try to get customer ID from query parameter
            const { searchParams } = new URL(request.url);
            const customerIdFromQuery = searchParams.get('customerId');
            
            if (customerIdFromQuery) {
              const user = await findOrCreateUserByShopifyCustomerId(customerIdFromQuery);
              if (user) {
                userId = user.id;
              }
            }
          }
        }
      } catch (error: any) {
        console.error('[GET /api/customer/permissions] Error validating Shopify session token:', error);
        // Fall through to JWT session
      }
    }
    
    // Fallback to JWT session if no Shopify token or if Shopify token didn't work
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

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      canCreateGroups: user.can_create_groups === true,
      maxMembersPerGroup: user.max_members_per_group || null,
      discountTierIdentifier: user.discount_tier_identifier || null,
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

