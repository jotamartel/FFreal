// Shopify Admin API Client for creating customers

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

export interface CreateShopifyCustomerParams {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
  tags?: string[];
  note?: string;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  accepts_marketing: boolean;
  tags: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a customer in Shopify using Admin API
 */
export async function createShopifyCustomer(
  params: CreateShopifyCustomerParams
): Promise<{ customer: ShopifyCustomer | null; error?: string }> {
  try {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
      console.warn('[SHOPIFY ADMIN] Admin API not configured. Skipping customer creation.');
      return { 
        customer: null, 
        error: 'Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_ACCESS_TOKEN.' 
      };
    }

    const adminApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers.json`;

    // Prepare customer data
    const customerData: any = {
      customer: {
        email: params.email,
        accepts_marketing: params.acceptsMarketing ?? false,
      },
    };

    if (params.firstName || params.lastName) {
      customerData.customer.first_name = params.firstName || '';
      customerData.customer.last_name = params.lastName || '';
    }

    if (params.phone) {
      customerData.customer.phone = params.phone;
    }

    if (params.tags && params.tags.length > 0) {
      customerData.customer.tags = params.tags.join(', ');
    }

    if (params.note) {
      customerData.customer.note = params.note;
    }

    console.log('[SHOPIFY ADMIN] Creating customer:', {
      email: params.email,
      hasName: !!(params.firstName || params.lastName),
      hasPhone: !!params.phone,
    });

    const response = await fetch(adminApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Shopify Admin API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors) {
          // Handle Shopify validation errors
          if (errorJson.errors.email && errorJson.errors.email.includes('has already been taken')) {
            // Customer already exists - try to find it
            console.log('[SHOPIFY ADMIN] Customer already exists, searching by email...');
            const existingCustomer = await findShopifyCustomerByEmail(params.email);
            if (existingCustomer) {
              return { customer: existingCustomer };
            }
          }
          errorMessage = `Shopify error: ${JSON.stringify(errorJson.errors)}`;
        }
      } catch (parseError) {
        errorMessage = `Shopify Admin API error: ${errorText.substring(0, 200)}`;
      }

      console.error('[SHOPIFY ADMIN] Error creating customer:', errorMessage);
      return { customer: null, error: errorMessage };
    }

    const result = await response.json();
    
    if (result.customer) {
      console.log('[SHOPIFY ADMIN] Customer created successfully:', {
        id: result.customer.id,
        email: result.customer.email,
      });
      return { customer: result.customer as ShopifyCustomer };
    }

    return { customer: null, error: 'No customer data returned from Shopify' };
  } catch (error: any) {
    console.error('[SHOPIFY ADMIN] Exception creating customer:', error);
    return { 
      customer: null, 
      error: error.message || 'Unknown error creating Shopify customer' 
    };
  }
}

/**
 * Find a customer in Shopify by email
 */
export async function findShopifyCustomerByEmail(
  email: string
): Promise<ShopifyCustomer | null> {
  try {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
      return null;
    }

    const adminApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(email)}`;

    const response = await fetch(adminApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
    });

    if (!response.ok) {
      console.warn('[SHOPIFY ADMIN] Error searching customer:', response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (result.customers && result.customers.length > 0) {
      return result.customers[0] as ShopifyCustomer;
    }

    return null;
  } catch (error: any) {
    console.error('[SHOPIFY ADMIN] Exception searching customer:', error);
    return null;
  }
}

/**
 * Get or create a Shopify customer (idempotent)
 * Returns the customer ID as a string
 */
export async function getOrCreateShopifyCustomer(
  params: CreateShopifyCustomerParams
): Promise<{ customerId: string | null; error?: string }> {
  try {
    // First, try to find existing customer
    const existingCustomer = await findShopifyCustomerByEmail(params.email);
    
    if (existingCustomer) {
      console.log('[SHOPIFY ADMIN] Found existing customer:', existingCustomer.id);
      return { customerId: existingCustomer.id.toString() };
    }

    // If not found, create new customer
    const { customer, error } = await createShopifyCustomer(params);
    
    if (error) {
      return { customerId: null, error };
    }

    if (customer) {
      return { customerId: customer.id.toString() };
    }

    return { customerId: null, error: 'Failed to create or find customer' };
  } catch (error: any) {
    console.error('[SHOPIFY ADMIN] Exception in getOrCreateShopifyCustomer:', error);
    return { 
      customerId: null, 
      error: error.message || 'Unknown error' 
    };
  }
}

