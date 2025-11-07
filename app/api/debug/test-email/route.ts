// API endpoint to test email sending (supports both SMTP and Resend)

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/debug/test-email - Test email sending
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    // Check environment variables
    const hasResend = !!process.env.RESEND_API_KEY;
    const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER || 'onboarding@resend.dev';
    const apiKeyPrefix = process.env.RESEND_API_KEY?.substring(0, 5) || 'none';

    console.log('[TEST EMAIL] Configuration:', {
      hasResend,
      hasSMTP,
      smtpHost: process.env.SMTP_HOST || 'not configured',
      smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : 'not configured',
      apiKeyPrefix: apiKeyPrefix + '...',
      fromEmail,
      to,
    });

    // Send test email
    const result = await sendEmail({
      to,
      subject: 'Test Email - Friends & Family',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Friends & Family app.</p>
        <p>If you receive this, email configuration is working correctly!</p>
        <p><strong>Service used:</strong> ${hasSMTP ? 'SMTP (Gmail/Outlook)' : hasResend ? 'Resend' : 'None configured'}</p>
      `,
      from: fromEmail,
    });

    return NextResponse.json({
      success: result.success,
      error: result.error,
      message: result.message,
      config: {
        hasResend,
        hasSMTP,
        smtpHost: process.env.SMTP_HOST || null,
        smtpPort: process.env.SMTP_PORT || null,
        smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : null,
        fromEmail,
        serviceUsed: hasSMTP ? 'SMTP' : hasResend ? 'Resend' : 'None',
      },
    }, { status: result.success ? 200 : 500 });

  } catch (error: any) {
    console.error('[TEST EMAIL] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/debug/test-email - Get email configuration status
 */
export async function GET() {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER || 'onboarding@resend.dev';
  const apiKeyPrefix = process.env.RESEND_API_KEY?.substring(0, 5) || 'none';

  const serviceStatus = hasSMTP 
    ? 'SMTP configured (will be used first)'
    : hasResend 
    ? 'Resend configured (SMTP not configured)'
    : 'No email service configured';

  return NextResponse.json({
    config: {
      hasResend,
      hasSMTP,
      smtpHost: process.env.SMTP_HOST || null,
      smtpPort: process.env.SMTP_PORT || null,
      smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : null,
      smtpFromEmail: process.env.SMTP_FROM_EMAIL || null,
      resendApiKeyPrefix: apiKeyPrefix + '...',
      resendFromEmail: process.env.RESEND_FROM_EMAIL || null,
      fromEmail,
      servicePriority: hasSMTP ? 'SMTP → Resend' : hasResend ? 'Resend only' : 'None',
    },
    message: serviceStatus + '. Use POST to test email sending.',
    instructions: {
      smtp: hasSMTP 
        ? 'SMTP is configured and will be used first'
        : 'To configure SMTP, add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD to Vercel environment variables',
      resend: hasResend
        ? 'Resend is configured and will be used as fallback if SMTP fails'
        : 'To configure Resend, add RESEND_API_KEY to Vercel environment variables',
    },
  });
}

