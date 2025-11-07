export const runtime = 'nodejs';

// API route to send invitation email

import { NextRequest, NextResponse } from 'next/server';
import { getInvitationByToken, getGroupById } from '@/lib/database/ff-groups';
import { sendInvitationEmail } from '@/lib/email/service';

/**
 * POST /api/invitations/[token]/send-email - Send invitation email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await getInvitationByToken(params.token);
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const group = await getGroupById(invitation.group_id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/customer/invitations/${params.token}`;

    // Send email
    const emailSent = await sendInvitationEmail(
      invitation.email,
      group.name,
      inviteLink
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation email sent successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

