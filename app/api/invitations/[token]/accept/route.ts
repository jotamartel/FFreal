// API route to accept an invitation

import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation } from '@/lib/database/ff-groups';
import { getSession } from '@/lib/auth/session';

/**
 * POST /api/invitations/[token]/accept - Accept an invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const { customerId } = body;

    // Get user from session if authenticated (optional - invitations can be accepted without login)
    const session = await getSession();
    const userId = session?.userId;

    const member = await acceptInvitation(params.token, customerId, userId);

    if (!member) {
      return NextResponse.json(
        { error: 'Failed to accept invitation. It may be expired, invalid, or group is full.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      member,
      authenticated: !!session,
      // If authenticated, return session info for auto-login on frontend
      ...(session && { userId: session.userId })
    }, { status: 200 });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

