// Email Service using Resend

import { Resend } from 'resend';

// Initialize Resend only if API key is available (to prevent build errors)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY || !resend) {
      const errorMsg = 'RESEND_API_KEY not configured, skipping email send';
      console.error('[EMAIL]', errorMsg);
      return { success: false, error: errorMsg };
    }

    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    console.log('[EMAIL] Attempting to send email:', {
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 5) + '...',
    });

    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('[EMAIL] Resend API error:', result.error);
      return { success: false, error: JSON.stringify(result.error) };
    }

    if (result.data) {
      console.log('[EMAIL] Email sent successfully:', {
        id: result.data.id,
        to: options.to,
        from: fromEmail,
      });
      return { success: true };
    }

    console.error('[EMAIL] No data returned from Resend');
    return { success: false, error: 'No data returned from Resend API' };
  } catch (error: any) {
    console.error('[EMAIL] Error sending email:', {
      error: error.message,
      stack: error.stack,
      to: options.to,
    });
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  email: string,
  groupName: string,
  inviteLink: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Friends & Family Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Friends & Family Invitation</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">You've been invited!</h2>
        <p>You've been invited to join <strong>${groupName}</strong>!</p>
        <p>Join this Friends & Family group to start saving together with exclusive discounts.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This invitation link will expire in 7 days.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you did not expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: `Invitation to join ${groupName} - Friends & Family`,
    html,
  });

  if (!result.success) {
    console.error('[EMAIL] Failed to send invitation email:', result.error);
  }

  return result.success;
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  verificationLink: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Verify Your Email</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Almost there!</h2>
        <p>Please verify your email address to complete your registration and activate your Friends & Family group membership.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This verification link will expire in 24 hours.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you did not create an account, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your email address - Friends & Family',
    html,
  });
}

