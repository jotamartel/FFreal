// Shopify Client Configuration

export interface ShopifyConfig {
  apiKey: string;
  apiSecret: string;
  scopes: string;
  hostName: string;
}

export function getShopifyConfig(): ShopifyConfig {
  return {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    scopes: process.env.SHOPIFY_SCOPES || '',
    hostName: process.env.SHOPIFY_APP_URL || '',
  };
}

// Helper to get merchant ID from session/request
export function getMerchantId(request?: Request): string | null {
  // This should be extracted from Shopify session/auth
  // For now, return null - implement based on your auth setup
  const headers = request?.headers;
  if (headers) {
    // Extract from Shopify session token
    // Example: const shop = headers.get('x-shopify-shop-domain');
  }
  return null;
}

