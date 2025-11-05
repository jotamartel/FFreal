// Shopify Authentication Helper

import { getShopifyConfig } from './client';

export interface ShopifySession {
  shop: string;
  accessToken: string;
  scope: string;
}

/**
 * Get merchant ID from Shopify session
 * This should be extracted from the authenticated session
 */
export async function getMerchantId(request?: Request): Promise<string | null> {
  // TODO: Implement proper Shopify OAuth session extraction
  // For now, extract from headers or query params
  
  if (request) {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    
    if (shop) {
      // Extract shop domain (e.g., "mystore.myshopify.com" -> "mystore")
      return shop.replace('.myshopify.com', '');
    }
    
    // Try to get from headers
    const shopHeader = request.headers.get('x-shopify-shop-domain');
    if (shopHeader) {
      return shopHeader.replace('.myshopify.com', '');
    }
  }
  
  return null;
}

/**
 * Verify Shopify request
 * TODO: Implement HMAC verification for webhooks
 */
export function verifyShopifyRequest(
  query: Record<string, string>,
  secret: string
): boolean {
  // TODO: Implement HMAC verification
  // This is critical for production
  return true;
}

/**
 * Get customer ID from Shopify customer
 */
export function getCustomerIdFromShopify(customer: any): string | null {
  return customer?.id?.toString() || null;
}

