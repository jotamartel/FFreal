import { NextRequest, NextResponse } from 'next/server';
import { getStoreStatus, updateStoreStatus } from '@/lib/database/store-status';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'default';
    const status = await getStoreStatus(merchantId);
    return NextResponse.json({ status }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/admin/store-status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const merchantId = body.merchantId || 'default';
    const { isStoreOpen, inviteRedirectUrl, nextEventDate, eventMessage } = body;

    if (typeof isStoreOpen !== 'boolean') {
      return NextResponse.json({ error: 'isStoreOpen must be boolean' }, { status: 400 });
    }

    const updated = await updateStoreStatus({
      merchantId,
      isStoreOpen,
      inviteRedirectUrl: inviteRedirectUrl ?? null,
      nextEventDate: nextEventDate ?? null,
      eventMessage: eventMessage ?? null,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update store status' }, { status: 500 });
    }

    return NextResponse.json({ status: updated }, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/admin/store-status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
