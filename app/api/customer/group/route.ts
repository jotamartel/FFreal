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
      authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : null,
      allHeaders: Object.fromEntries ? Object.fromEntries(request.headers.entries()) : {},
    });
    
    if (authHeader) {
      try {
        const shopifySessionToken = await validateShopifySessionToken(authHeader);
        
        if (shopifySessionToken) {
          const shopifyCustomerId = extractCustomerIdFromToken(shopifySessionToken);
          
          console.log('[GET /api/customer/group] Shopify session token processed:', {
            hasToken: !!shopifySessionToken,
            customerId: shopifyCustomerId,
            tokenSub: shopifySessionToken?.sub,
            tokenDest: shopifySessionToken?.dest,
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
            // Token is valid but doesn't have customer ID
            // Try to extract customer ID from the token's dest or other fields
            // For now, we'll return a helpful error message
            console.warn('[GET /api/customer/group] Could not extract customer ID from token. Token structure:', {
              sub: shopifySessionToken?.sub,
              hasSub: !!shopifySessionToken?.sub,
              iss: shopifySessionToken?.iss,
              dest: shopifySessionToken?.dest,
              aud: shopifySessionToken?.aud,
            });
            console.warn('[GET /api/customer/group] ⚠️ Token does not contain customer ID (sub claim). This may happen if:');
            console.warn('[GET /api/customer/group]   1. Customer is not logged in to their account');
            console.warn('[GET /api/customer/group]   2. App does not have read_customers permission');
            console.warn('[GET /api/customer/group]   3. Token is from checkout context instead of customer account');
            
            // Note: The 'sub' claim is optional and only present when customer is logged in
            // We'll return a more specific error in the response below
          }
        } else {
          console.warn('[GET /api/customer/group] Shopify session token validation failed. Token present but invalid.');
        }
      } catch (error: any) {
        console.error('[GET /api/customer/group] Error validating Shopify session token:', {
          error: error.message,
          stack: error.stack,
        });
      }
    }

    // If we have a Shopify token but no customer ID, try to get it from query params
    // (This is passed from the extension using authenticatedAccount)
    if (!userId && authHeader) {
      const { searchParams } = new URL(request.url);
      const customerIdFromQuery = searchParams.get('customerId');
      
      if (customerIdFromQuery) {
        console.log('[GET /api/customer/group] Using customer ID from query parameter:', customerIdFromQuery);
        
        // Find or create user by Shopify customer ID
        const user = await findOrCreateUserByShopifyCustomerId(customerIdFromQuery);
        
        if (user) {
          userId = user.id;
          console.log('[GET /api/customer/group] ✅ User found/created from query param, userId:', userId);
        } else {
          console.warn('[GET /api/customer/group] ❌ User not found for Shopify customer ID from query:', customerIdFromQuery);
          return NextResponse.json(
            { error: 'User not found. Please register first.' },
            { 
              status: 404,
              headers: corsHeaders,
            }
          );
        }
      } else {
        // No customer ID in query, token doesn't have sub claim
        return NextResponse.json(
          { 
            error: 'Customer not authenticated',
            message: 'The session token is valid but does not contain a customer ID. Please ensure you are logged in to your customer account.',
            details: 'The sub claim is missing from the session token. This typically means the customer is not logged in or the app does not have the required permissions.'
          },
          { 
            status: 401,
            headers: corsHeaders,
          }
        );
      }
    }

    // Fallback to JWT session if no Shopify token or if Shopify token didn't work
    if (!userId) {
      // Try JWT session as fallback
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

