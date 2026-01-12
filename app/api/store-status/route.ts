import { NextRequest, NextResponse } from 'next/server';
import { getStoreStatus } from '@/lib/database/store-status';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'default';
    const status = await getStoreStatus(merchantId);
    return NextResponse.json({ status }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/store-status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
