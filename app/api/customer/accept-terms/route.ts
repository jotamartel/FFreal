import { NextRequest, NextResponse } from 'next/server';
import { recordTermsAcceptance } from '@/lib/database/terms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AcceptTermsPayload {
  customerId?: string;
  termsVersion?: string;
  ipAddress?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AcceptTermsPayload;
    const errors: string[] = [];

    if (!body.customerId || typeof body.customerId !== 'string') {
      errors.push('customerId is required');
    }
    if (!body.termsVersion || typeof body.termsVersion !== 'string') {
      errors.push('termsVersion is required');
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipFromHeader = forwardedFor ? forwardedFor.split(',')[0]?.trim() : null;
    const userAgent = request.headers.get('user-agent');

    const record = await recordTermsAcceptance({
      customerId: body.customerId!,
      termsVersion: body.termsVersion!,
      ipAddress: body.ipAddress ?? ipFromHeader,
      userAgent,
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Unable to record terms acceptance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/customer/accept-terms] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
