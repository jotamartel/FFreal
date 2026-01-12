import { OMSOrderPayload, OMSRefundPayload, OMSResponse } from '@/types/oms';

const OMS_API_URL = process.env.OMS_API_URL;
const OMS_API_KEY = process.env.OMS_API_KEY;

function getShippingLabel(order: any): string | undefined {
  const method = order.shipping_lines?.[0];
  if (!method) return undefined;
  if (method.title && method.code) {
    return `${method.title} (${method.code})`;
  }
  return method.title || method.code;
}

function mapOrderToOMS(order: any): OMSOrderPayload {
  return {
    orderId: order.id?.toString() || order.name,
    merchantId: order.merchant_id?.toString() || 'default',
    shopifyOrderId: order.id?.toString(),
    customerEmail: order.email,
    customerName: order.customer?.first_name
      ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
      : undefined,
    shippingMethod: getShippingLabel(order),
    paymentGateway: order.gateway,
    totalAmount: parseFloat(order.total_price || '0'),
    currency: order.currency || 'USD',
    createdAt: order.created_at,
    lineItems: (order.line_items || []).map((item: any) => ({
      sku: item.sku || item.variant_id?.toString(),
      quantity: item.quantity,
      price: parseFloat(item.price || '0'),
      title: item.title,
      category: item.product_exists ? item.product_type : undefined,
    })),
  };
}

async function callOMS<T>(endpoint: string, payload: unknown): Promise<T> {
  if (!OMS_API_URL || !OMS_API_KEY) {
    throw new Error('OMS API not configured');
  }

  const response = await fetch(`${OMS_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OMS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OMS request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function sendOrderToOMS(order: OMSOrderPayload): Promise<OMSResponse> {
  try {
    const result = await callOMS<OMSResponse>('/orders', order);
    return result;
  } catch (error) {
    console.error('[OMS] Error sending order:', error);
    throw error;
  }
}

export async function enqueueOrderForOMS(orderPayload: any): Promise<OMSResponse> {
  const order = mapOrderToOMS(orderPayload);
  return sendOrderToOMS(order);
}

export async function sendRefundToOMS(refund: OMSRefundPayload): Promise<OMSResponse> {
  try {
    const result = await callOMS<OMSResponse>('/refunds', refund);
    return result;
  } catch (error) {
    console.error('[OMS] Error sending refund:', error);
    throw error;
  }
}
