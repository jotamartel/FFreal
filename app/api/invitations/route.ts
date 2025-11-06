// API routes for Friends & Family Invitations

import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, getInvitationByToken, getGroupById } from '@/lib/database/ff-groups';
import { sendInvitationEmail } from '@/lib/email/service';

/**
 * POST /api/invitations - Create a new invitation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, email, expiresInDays } = body;

    if (!groupId || !email) {
      return NextResponse.json(
        { error: 'groupId and email are required' },
        { status: 400 }
      );
    }

    const invitation = await createInvitation({
      groupId,
      email,
      expiresInDays,
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Failed to create invitation. Group may be full or email already in group.' },
        { status: 400 }
      );
    }

    // Send invitation email
    let emailSent = false;
    let emailError: string | null = null;
    
    try {
      const group = await getGroupById(groupId);
      if (group) {
        // Get redirect URL from config, or use default
        const { getDiscountConfig } = await import('@/lib/database/ff-groups');
        const config = await getDiscountConfig('default');
        const baseUrl = config?.invite_redirect_url || process.env.NEXT_PUBLIC_APP_URL || 'https://shopify-friends-family-app.vercel.app';
        
        // Use invite_code instead of token - redirects to invitation page with code pre-filled
        const inviteLink = `${baseUrl}/tienda/unirse?code=${group.invite_code}`;
        
        console.log('[INVITATION] Sending invitation email:', {
          email,
          groupName: group.name,
          inviteCode: group.invite_code,
          inviteLink,
          hasResendKey: !!process.env.RESEND_API_KEY,
        });
        
        emailSent = await sendInvitationEmail(
          email,
          group.name,
          inviteLink,
          group.invite_code
        );

        if (!emailSent) {
          emailError = 'Email service not configured or failed to send';
          console.warn('[INVITATION] Email not sent, but invitation was created');
        }
      }
    } catch (err) {
      console.error('[INVITATION] Error sending invitation email:', err);
      emailError = err instanceof Error ? err.message : 'Unknown error';
      // Don't fail the invitation creation if email fails
    }

    return NextResponse.json(
      { 
        invitation,
        emailSent,
        emailError: emailError || undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invitations?token=... - Get invitation by token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'token parameter is required' },
        { status: 400 }
      );
    }

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired', invitation },
        { status: 410 }
      );
    }

    return NextResponse.json({ invitation }, { status: 200 });
  } catch (error) {
    console.error('Error getting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

