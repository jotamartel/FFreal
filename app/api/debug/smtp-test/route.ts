// API endpoint to test SMTP configuration and connection

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/smtp-test - Get SMTP configuration status
 */
export async function GET() {
  const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  
  const config = {
    hasSMTP,
    smtpHost: process.env.SMTP_HOST || null,
    smtpPort: process.env.SMTP_PORT || null,
    smtpSecure: process.env.SMTP_SECURE || null,
    smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : null,
    smtpFromEmail: process.env.SMTP_FROM_EMAIL || null,
    hasPassword: !!process.env.SMTP_PASSWORD,
    passwordLength: process.env.SMTP_PASSWORD?.length || 0,
  };

  // Try to create transporter to test connection
  let connectionTest: any = null;
  if (hasSMTP) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // Test connection
      await transporter.verify();
      connectionTest = {
        success: true,
        message: 'SMTP connection successful',
      };
    } catch (error: any) {
      connectionTest = {
        success: false,
        error: error.message || 'Unknown error',
        code: error.code,
      };
    }
  }

  return NextResponse.json({
    config,
    connectionTest,
    message: hasSMTP 
      ? 'SMTP is configured. Use POST to test email sending.'
      : 'SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD to Vercel environment variables.',
  });
}

/**
 * POST /api/debug/smtp-test - Test SMTP email sending
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

    const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    if (!hasSMTP) {
      return NextResponse.json(
        { 
          error: 'SMTP not configured',
          message: 'Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD to Vercel environment variables.',
        },
        { status: 400 }
      );
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    if (!fromEmail) {
      return NextResponse.json(
        { error: 'SMTP_FROM_EMAIL or SMTP_USER not configured' },
        { status: 400 }
      );
    }

    console.log('[SMTP TEST] Attempting to send test email:', {
      to,
      from: fromEmail,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER?.substring(0, 3) + '***',
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Add debug logging
      debug: true,
      logger: true,
    });

    // First, verify connection
    try {
      await transporter.verify();
      console.log('[SMTP TEST] ✅ Connection verified');
    } catch (verifyError: any) {
      console.error('[SMTP TEST] ❌ Connection verification failed:', verifyError);
      return NextResponse.json({
        success: false,
        error: 'SMTP connection failed',
        details: verifyError.message,
        code: verifyError.code,
      }, { status: 500 });
    }

    // Send test email
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: 'Test Email - Friends & Family SMTP',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Friends & Family app using SMTP.</p>
        <p>If you receive this, SMTP configuration is working correctly!</p>
        <p><strong>Service:</strong> SMTP (${process.env.SMTP_HOST})</p>
      `,
    });

    console.log('[SMTP TEST] ✅ Email sent successfully:', {
      messageId: info.messageId,
      to,
      from: fromEmail,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      to,
      from: fromEmail,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[SMTP TEST] ❌ Error sending email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack,
    });

    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      code: error.code,
      command: error.command,
      response: error.response,
      details: 'Check Vercel logs for more information',
    }, { status: 500 });
  }
}

