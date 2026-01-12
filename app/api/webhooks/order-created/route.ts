import { NextRequest, NextResponse } from 'next/server';
import { enqueueOrderForOMS } from '@/lib/integrations/oms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await enqueueOrderForOMS(body);
    return NextResponse.json({ success: response.success, externalId: response.externalId }, { status: 200 });
  } catch (error) {
    console.error('[Webhook order-created] Error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
