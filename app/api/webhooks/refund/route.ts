import { NextRequest, NextResponse } from 'next/server';
import { sendRefundToOMS } from '@/lib/integrations/oms';
import { OMSRefundPayload } from '@/types/oms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const refund: OMSRefundPayload = {
      orderId: body.order_id?.toString() || body.order?.id?.toString(),
      refundId: body.id?.toString(),
      amount: parseFloat(body.transactions?.[0]?.amount || body.total_refunded || '0'),
      currency: body.currency || 'USD',
      reason: body.note || 'Unknown',
      items: (body.refund_line_items || []).map((item: any) => ({
        sku: item.line_item?.sku || item.line_item?.variant_id?.toString(),
        quantity: item.quantity,
        price: parseFloat(item.line_item?.price || '0'),
        title: item.line_item?.title,
      })),
    };

    const response = await sendRefundToOMS(refund);
    return NextResponse.json({ success: response.success, externalId: response.externalId }, { status: 200 });
  } catch (error) {
    console.error('[Webhook refund] Error:', error);
    return NextResponse.json({ error: 'Failed to process refund webhook' }, { status: 500 });
  }
}
