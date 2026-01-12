export interface OMSLineItem {
  sku: string;
  quantity: number;
  price: number;
  title?: string;
  category?: string;
}

export interface OMSOrderPayload {
  orderId: string;
  merchantId: string;
  shopifyOrderId: string;
  customerEmail: string;
  customerName?: string;
  shippingMethod?: string;
  paymentGateway?: string;
  totalAmount: number;
  currency: string;
  lineItems: OMSLineItem[];
  createdAt: string;
}

export interface OMSRefundPayload {
  orderId: string;
  refundId: string;
  amount: number;
  currency: string;
  reason: string;
  items?: OMSLineItem[];
}

export interface OMSResponse {
  success: boolean;
  externalId?: string;
  message?: string;
}
