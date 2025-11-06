// API routes for customer's group

import { NextRequest, NextResponse } from 'next/server';
import { getGroupsByUserId, getGroupsByCustomerId } from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';
import { 
  validateShopifySessionToken, 
  extractCustomerIdFromToken 
} from '@/lib/auth/shopify-session';
import { findOrCreateUserByShopifyCustomerId } from '@/lib/database/users';

export const dynamic = 'force-dynamic';

// CORS headers for Customer Account Extensions
// Note: UI extensions run in Web Workers with null origin, so we must use '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle preflight OPTIONS requests
 * This is a fallback in case the middleware doesn't catch it
 */
export async function OPTIONS(request: NextRequest) {
  console.log('[OPTIONS /api/customer/group] Handling preflight request');
  const response = new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
  console.log('[OPTIONS /api/customer/group] Response headers:', Object.fromEntries(response.headers.entries()));
  return response;
}

/**
 * GET /api/customer/group - Get customer's groups (requires authentication)
 * Supports both:
 * 1. JWT session token (from cookies) - for regular web app access
 * 2. Shopify session token (from Authorization header) - for Customer Account Extensions
 */
export async function GET(request: NextRequest) {

  try {
    let userId: string | null = null;

    // Try to get Shopify session token first (for Customer Account Extensions)
    const authHeader = request.headers.get('authorization');
    console.log('[GET /api/customer/group] Request received:', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : null,
    });
    
    if (authHeader) {
      const shopifySessionToken = await validateShopifySessionToken(authHeader);
      
      if (shopifySessionToken) {
        const shopifyCustomerId = extractCustomerIdFromToken(shopifySessionToken);
        
        console.log('[GET /api/customer/group] Shopify session token processed:', {
          hasToken: !!shopifySessionToken,
          customerId: shopifyCustomerId,
        });
        
        if (shopifyCustomerId) {
          console.log('[GET /api/customer/group] Shopify session token validated, customer ID:', shopifyCustomerId);
          
          // Find or create user by Shopify customer ID
          const user = await findOrCreateUserByShopifyCustomerId(shopifyCustomerId);
          
          if (user) {
            userId = user.id;
            console.log('[GET /api/customer/group] ✅ User found/created, userId:', userId);
          } else {
            console.warn('[GET /api/customer/group] ❌ User not found for Shopify customer ID:', shopifyCustomerId);
            return NextResponse.json(
              { error: 'User not found. Please register first.' },
              { 
                status: 404,
                headers: corsHeaders,
              }
            );
          }
        } else {
          console.warn('[GET /api/customer/group] Could not extract customer ID from token');
        }
      } else {
        console.warn('[GET /api/customer/group] Shopify session token validation failed');
      }
    }

    // Fallback to JWT session if no Shopify token or if Shopify token didn't work
    if (!userId) {
      const session = await getSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { 
            status: 401,
            headers: corsHeaders,
          }
        );
      }
      
      userId = session.userId;
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    // Get groups by user_id (preferred) or fallback to customer_id if user_id not available
    const groups = await getGroupsByUserId(userId, merchantId || undefined);

    return NextResponse.json({ groups }, { 
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error getting customer group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

