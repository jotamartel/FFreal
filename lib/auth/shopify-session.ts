import { shopifyApi } from '@shopify/shopify-api';
import type { SessionToken } from '@shopify/shopify-api';

/**
 * Initialize Shopify API client for session token validation
 * Note: For Customer Account Extensions, we need the API secret key to validate tokens
 */
const getShopifyApi = () => {
  const apiKey = process.env.SHOPIFY_API_KEY || process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '7e302a04c4c9857db921e5dca73ddd26';
  const apiSecretKey = process.env.SHOPIFY_API_SECRET || '';
  
  if (!apiSecretKey) {
    console.warn('[shopify-session] SHOPIFY_API_SECRET not configured, session token validation may fail');
  }

  return shopifyApi({
    apiKey,
    apiSecretKey,
    apiVersion: '2025-10',
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_customers', 'write_customers'],
    hostName: process.env.SHOPIFY_STORE_DOMAIN?.replace('https://', '').replace('http://', '') || '',
    isEmbeddedApp: true,
  });
};

const shopify = getShopifyApi();

/**
 * Decode and validate a Shopify session token
 * @param token - The session token from the request header
 * @returns Decoded session token or null if invalid
 */
export async function validateShopifySessionToken(token: string | null): Promise<SessionToken | null> {
  if (!token) {
    return null;
  }

  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    
    // Decode and validate the session token
    const decodedToken = await shopify.session.decodeSessionToken(cleanToken);
    
    return decodedToken;
  } catch (error) {
    console.error('[validateShopifySessionToken] Error validating token:', error);
    return null;
  }
}

/**
 * Extract customer ID from Shopify session token
 * @param sessionToken - Decoded session token
 * @returns Customer ID (numeric) or null
 */
export function extractCustomerIdFromToken(sessionToken: SessionToken | null): string | null {
  if (!sessionToken || !sessionToken.sub) {
    return null;
  }

  // Session token sub is in format: gid://shopify/Customer/{id}
  const match = sessionToken.sub.match(/gid:\/\/shopify\/Customer\/(\d+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Get shop domain from session token
 * @param sessionToken - Decoded session token
 * @returns Shop domain or null
 */
export function getShopDomainFromToken(sessionToken: SessionToken | null): string | null {
  if (!sessionToken || !sessionToken.dest) {
    return null;
  }

  try {
    const url = new URL(sessionToken.dest);
    return url.hostname;
  } catch (error) {
    console.error('[getShopDomainFromToken] Error parsing dest:', error);
    return null;
  }
}

