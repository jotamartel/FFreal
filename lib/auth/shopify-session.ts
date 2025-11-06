import { shopifyApi } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

let shopifyInstance: ReturnType<typeof shopifyApi> | null = null;

/**
 * Initialize Shopify API client for session token validation (lazy initialization)
 * Note: For Customer Account Extensions, we need the API secret key to validate tokens
 */
const getShopifyApi = () => {
  if (shopifyInstance) {
    return shopifyInstance;
  }

  const apiKey = process.env.SHOPIFY_API_KEY || process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '7e302a04c4c9857db921e5dca73ddd26';
  const apiSecretKey = process.env.SHOPIFY_API_SECRET || '';
  const hostName = process.env.SHOPIFY_STORE_DOMAIN?.replace('https://', '').replace('http://', '') || 'default.myshopify.com';
  
  console.log('[shopify-session] Initializing Shopify API:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey.length,
    hasApiSecretKey: !!apiSecretKey,
    apiSecretKeyLength: apiSecretKey.length,
    hostName,
    hasShopifyStoreDomain: !!process.env.SHOPIFY_STORE_DOMAIN,
  });
  
  if (!apiSecretKey) {
    console.error('[shopify-session] ❌ SHOPIFY_API_SECRET not configured, session token validation will fail');
    console.error('[shopify-session] Available env vars:', {
      has_SHOPIFY_API_KEY: !!process.env.SHOPIFY_API_KEY,
      has_NEXT_PUBLIC_SHOPIFY_API_KEY: !!process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
      has_SHOPIFY_API_SECRET: !!process.env.SHOPIFY_API_SECRET,
      allKeys: Object.keys(process.env).filter(k => k.includes('SHOPIFY')).join(', '),
    });
  }

  shopifyInstance = shopifyApi({
    apiKey,
    apiSecretKey,
    apiVersion: '2024-10' as any, // Using string format for compatibility
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_customers', 'write_customers'],
    hostName,
    isEmbeddedApp: true,
  });

  return shopifyInstance;
};

/**
 * Decode and validate a Shopify session token
 * @param token - The session token from the request header
 * @returns Decoded session token or null if invalid
 */
export async function validateShopifySessionToken(token: string | null): Promise<any | null> {
  if (!token) {
    console.log('[validateShopifySessionToken] No token provided');
    return null;
  }

  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    console.log('[validateShopifySessionToken] Attempting to validate token, length:', cleanToken.length);
    console.log('[validateShopifySessionToken] Token preview:', cleanToken.substring(0, 50) + '...');
    
    // Decode and validate the session token
    const shopify = getShopifyApi();
    console.log('[validateShopifySessionToken] Shopify API instance created, calling decodeSessionToken...');
    
    const decodedToken = await shopify.session.decodeSessionToken(cleanToken);
    
    console.log('[validateShopifySessionToken] ✅ Token validated successfully:', {
      hasSub: !!decodedToken?.sub,
      sub: decodedToken?.sub,
      hasDest: !!decodedToken?.dest,
      dest: decodedToken?.dest,
      aud: decodedToken?.aud,
      iss: decodedToken?.iss,
    });
    
    return decodedToken;
  } catch (error: any) {
    console.error('[validateShopifySessionToken] ❌ Error validating token:', {
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack?.substring(0, 500), // Limit stack trace
      hasShopifyApi: !!getShopifyApi(),
      apiSecretConfigured: !!process.env.SHOPIFY_API_SECRET,
      apiSecretLength: process.env.SHOPIFY_API_SECRET?.length || 0,
    });
    return null;
  }
}

/**
 * Extract customer ID from Shopify session token
 * @param sessionToken - Decoded session token
 * @returns Customer ID (numeric) or null
 */
export function extractCustomerIdFromToken(sessionToken: any | null): string | null {
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
export function getShopDomainFromToken(sessionToken: any | null): string | null {
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

