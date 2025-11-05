// API endpoint to test email sending

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';

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
    const hasApiKey = !!process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const apiKeyPrefix = process.env.RESEND_API_KEY?.substring(0, 5) || 'none';

    console.log('[TEST EMAIL] Configuration:', {
      hasApiKey,
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
      `,
      from: fromEmail,
    });

    return NextResponse.json({
      success: result.success,
      error: result.error,
      config: {
        hasApiKey,
        apiKeyPrefix: apiKeyPrefix + '...',
        fromEmail,
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
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const apiKeyPrefix = process.env.RESEND_API_KEY?.substring(0, 5) || 'none';

  return NextResponse.json({
    config: {
      hasApiKey,
      apiKeyPrefix: apiKeyPrefix + '...',
      fromEmail,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
    },
    message: hasApiKey 
      ? 'RESEND_API_KEY is configured. Use POST to test email sending.'
      : 'RESEND_API_KEY is not configured. Add it to Vercel environment variables.',
  });
}

