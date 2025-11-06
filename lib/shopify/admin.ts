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

/**
 * Create a discount code in Shopify
 */
export interface CreateDiscountCodeParams {
  code: string;
  value: number; // Percentage (0-100) or fixed amount
  valueType: 'percentage' | 'fixed_amount';
  title?: string;
  startsAt?: string; // ISO date string
  endsAt?: string; // ISO date string
  usageLimit?: number; // Total usage limit
  customerSelection?: 'all' | 'specific';
  customerIds?: string[]; // Shopify customer IDs (as strings)
  minimumPurchaseAmount?: number;
  appliesTo?: 'all' | 'specific';
  productIds?: string[]; // Shopify product IDs
  collectionIds?: string[]; // Shopify collection IDs
}

export interface ShopifyDiscountCode {
  id: string;
  code: string;
  status: 'active' | 'expired' | 'scheduled';
  usage_count: number;
  created_at: string;
}

/**
 * Create a price rule and discount code in Shopify
 */
export async function createDiscountCode(
  params: CreateDiscountCodeParams
): Promise<{ discountCode: ShopifyDiscountCode | null; error?: string }> {
  try {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
      console.warn('[SHOPIFY ADMIN] Admin API not configured. Skipping discount code creation.');
      return { 
        discountCode: null, 
        error: 'Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_ACCESS_TOKEN.' 
      };
    }

    // First, create a price rule
    const priceRuleUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/price_rules.json`;

    const startsAt = params.startsAt || new Date().toISOString();
    const endsAt = params.endsAt || null; // No expiration by default

    // Build price rule data
    const priceRuleData: any = {
      price_rule: {
        title: params.title || `Friends & Family: ${params.code}`,
        target_type: 'line_item',
        target_selection: params.appliesTo === 'specific' ? 'entitled' : 'all',
        allocation_method: 'across',
        value_type: params.valueType,
        value: params.valueType === 'percentage' 
          ? `-${params.value}` // Negative for discount
          : `-${params.value}`,
        customer_selection: params.customerSelection || 'all',
        starts_at: startsAt,
        usage_limit: params.usageLimit || null,
        once_per_customer: false,
      },
    };

    // Add ends_at if provided
    if (endsAt) {
      priceRuleData.price_rule.ends_at = endsAt;
    }

    // Add minimum purchase amount if provided
    if (params.minimumPurchaseAmount) {
      priceRuleData.price_rule.prerequisite_subtotal_range = {
        greater_than_or_equal_to: params.minimumPurchaseAmount.toString(),
      };
    }

    // Add customer IDs if specific customers
    if (params.customerSelection === 'specific' && params.customerIds && params.customerIds.length > 0) {
      priceRuleData.price_rule.prerequisite_customer_ids = params.customerIds;
    }

    // Add product/collection restrictions if applies to specific
    if (params.appliesTo === 'specific') {
      if (params.productIds && params.productIds.length > 0) {
        priceRuleData.price_rule.entitled_product_ids = params.productIds;
      }
      if (params.collectionIds && params.collectionIds.length > 0) {
        priceRuleData.price_rule.entitled_collection_ids = params.collectionIds;
      }
    }

    console.log('[SHOPIFY ADMIN] Creating price rule:', {
      title: priceRuleData.price_rule.title,
      value: priceRuleData.price_rule.value,
      valueType: params.valueType,
      code: params.code,
    });

    // Create price rule
    const priceRuleResponse = await fetch(priceRuleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify(priceRuleData),
    });

    if (!priceRuleResponse.ok) {
      const errorText = await priceRuleResponse.text();
      let errorMessage = `Shopify Admin API error: ${priceRuleResponse.status} ${priceRuleResponse.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors) {
          errorMessage = `Shopify error: ${JSON.stringify(errorJson.errors)}`;
        }
      } catch (parseError) {
        errorMessage = `Shopify Admin API error: ${errorText.substring(0, 200)}`;
      }

      console.error('[SHOPIFY ADMIN] Error creating price rule:', errorMessage);
      return { discountCode: null, error: errorMessage };
    }

    const priceRuleResult = await priceRuleResponse.json();
    const priceRuleId = priceRuleResult.price_rule?.id;

    if (!priceRuleId) {
      return { discountCode: null, error: 'No price rule ID returned from Shopify' };
    }

    console.log('[SHOPIFY ADMIN] Price rule created:', priceRuleId);

    // Now create the discount code for this price rule
    const discountCodeUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/price_rules/${priceRuleId}/discount_codes.json`;

    const discountCodeData = {
      discount_code: {
        code: params.code,
      },
    };

    const discountCodeResponse = await fetch(discountCodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify(discountCodeData),
    });

    if (!discountCodeResponse.ok) {
      const errorText = await discountCodeResponse.text();
      let errorMessage = `Shopify Admin API error: ${discountCodeResponse.status} ${discountCodeResponse.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors) {
          errorMessage = `Shopify error: ${JSON.stringify(errorJson.errors)}`;
        }
      } catch (parseError) {
        errorMessage = `Shopify Admin API error: ${errorText.substring(0, 200)}`;
      }

      console.error('[SHOPIFY ADMIN] Error creating discount code:', errorMessage);
      // Try to delete the price rule if discount code creation failed
      try {
        await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/price_rules/${priceRuleId}.json`, {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
          },
        });
      } catch (deleteError) {
        console.error('[SHOPIFY ADMIN] Error deleting price rule after discount code failure:', deleteError);
      }
      
      return { discountCode: null, error: errorMessage };
    }

    const discountCodeResult = await discountCodeResponse.json();
    const discountCode = discountCodeResult.discount_code;

    if (discountCode) {
      console.log('[SHOPIFY ADMIN] Discount code created successfully:', {
        id: discountCode.id,
        code: discountCode.code,
        priceRuleId: priceRuleId,
      });
      
      return { 
        discountCode: {
          id: discountCode.id.toString(),
          code: discountCode.code,
          status: 'active',
          usage_count: discountCode.usage_count || 0,
          created_at: discountCode.created_at || new Date().toISOString(),
        } as ShopifyDiscountCode
      };
    }

    return { discountCode: null, error: 'No discount code data returned from Shopify' };
  } catch (error: any) {
    console.error('[SHOPIFY ADMIN] Exception creating discount code:', error);
    return { 
      discountCode: null, 
      error: error.message || 'Unknown error creating discount code' 
    };
  }
}

/**
 * Find existing discount code by code string
 */
export async function findDiscountCodeByCode(
  code: string
): Promise<ShopifyDiscountCode | null> {
  try {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
      return null;
    }

    const searchUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/discount_codes.json?code=${encodeURIComponent(code)}`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
    });

    if (!response.ok) {
      console.warn('[SHOPIFY ADMIN] Error searching discount code:', response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (result.discount_codes && result.discount_codes.length > 0) {
      const discountCode = result.discount_codes[0];
      return {
        id: discountCode.id.toString(),
        code: discountCode.code,
        status: discountCode.status || 'active',
        usage_count: discountCode.usage_count || 0,
        created_at: discountCode.created_at || new Date().toISOString(),
      } as ShopifyDiscountCode;
    }

    return null;
  } catch (error: any) {
    console.error('[SHOPIFY ADMIN] Exception searching discount code:', error);
    return null;
  }
}

