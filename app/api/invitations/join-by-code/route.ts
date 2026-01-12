// API route to join a group using invite code directly

import { NextRequest, NextResponse } from 'next/server';
import { joinGroupByCode } from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/database/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JoinByCodePayload {
  inviteCode?: string;
  customerEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as JoinByCodePayload;
    const inviteCode = body.inviteCode?.trim().toUpperCase();
    const providedEmail = body.customerEmail?.trim();

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'inviteCode is required' },
        { status: 400 }
      );
    }

    // session info (optional)
    const session = await getSession();
    let userId: string | undefined;
    let customerId: string | undefined;
    let resolvedEmail = providedEmail;

    if (session) {
      const sessionUser = await getUserById(session.userId);
      if (sessionUser) {
        userId = sessionUser.id;
        customerId = sessionUser.shopify_customer_id || sessionUser.id;
        resolvedEmail = sessionUser.email;
      }
    }

    if (!resolvedEmail) {
      return NextResponse.json(
        { error: 'customerEmail is required when user session is not available' },
        { status: 400 }
      );
    }

    const member = await joinGroupByCode(inviteCode, resolvedEmail, customerId, userId);

    if (!member) {
      return NextResponse.json(
        { error: 'Unable to join group. Verify the code, capacity, or membership status.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        member,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/invitations/join-by-code] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

