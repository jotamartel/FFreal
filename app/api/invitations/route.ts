export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// API routes for Friends & Family Invitations

import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, getInvitationByToken, getGroupById, getDiscountConfig } from '@/lib/database/ff-groups';
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
    let inviteCode: string | null = null;
    
    // Get group info first (needed for error messages)
    const group = await getGroupById(groupId);
    if (group) {
      inviteCode = group.invite_code;
    }
    
    try {
      if (group) {
        // Get redirect URL from config, or use default
        const config = await getDiscountConfig(group.merchant_id);
        const defaultRedirect = process.env.NEXT_PUBLIC_INVITE_REDIRECT_URL
          || (process.env.SHOPIFY_STORE_DOMAIN ? `https://${process.env.SHOPIFY_STORE_DOMAIN}/apps/friends-family` : undefined)
          || process.env.NEXT_PUBLIC_APP_URL
          || 'https://shopify-friends-family-app.vercel.app';
        const redirectBase = config?.invite_redirect_url || defaultRedirect;

        const separator = redirectBase.includes('?') ? '&' : '?';
        const inviteLink = `${redirectBase}${separator}code=${group.invite_code}`;
        
        console.log('[INVITATION] Sending invitation email:', {
          email,
          groupName: group.name,
          inviteCode: group.invite_code,
          inviteLink,
          hasResendKey: !!process.env.RESEND_API_KEY,
        });
        
        emailSent = await sendInvitationEmail({
          to: email,
          groupName: group.name,
          inviteLink,
          inviteCode: group.invite_code,
          merchantId: group.merchant_id,
          language: 'es',
        });

        if (!emailSent) {
          emailError = 'Email service not configured or failed to send';
          console.warn('[INVITATION] Email not sent, but invitation was created');
        }
      }
    } catch (err) {
      console.error('[INVITATION] Error sending invitation email:', err);
      const error = err as any;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's a domain verification error (by code or message)
      if (error?.code === 'DOMAIN_NOT_VERIFIED' || 
          errorMessage.includes('Domain not verified') || 
          errorMessage.includes('DOMAIN_NOT_VERIFIED') ||
          errorMessage.includes('modo de prueba')) {
        emailError = 'El servicio de email está en modo de prueba. Para enviar invitaciones a otros usuarios, necesitas verificar un dominio en Resend.';
        emailSent = false;
      } else {
        emailError = errorMessage;
      }
      // Don't fail the invitation creation if email fails
    }

    return NextResponse.json(
      { 
        invitation,
        emailSent,
        emailError: emailError || undefined,
        inviteCode: emailSent ? undefined : inviteCode,
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

