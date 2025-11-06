// Email Service - Supports Resend and SMTP (Gmail/Outlook)

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Initialize Resend only if API key is available (to prevent build errors)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Initialize SMTP transporter if SMTP is configured
let smtpTransporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using SMTP (Gmail, Outlook, etc.)
 */
async function sendEmailViaSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!smtpTransporter) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const fromEmail = options.from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    if (!fromEmail) {
      return { success: false, error: 'SMTP_FROM_EMAIL or SMTP_USER not configured' };
    }

    console.log('[EMAIL] Sending via SMTP:', {
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      host: process.env.SMTP_HOST,
    });

    const info = await smtpTransporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('[EMAIL] Email sent via SMTP:', {
      messageId: info.messageId,
      to: options.to,
    });

    return { success: true, message: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL] SMTP error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via SMTP' 
    };
  }
}

/**
 * Send email using Resend
 */
async function sendEmailViaResend(options: EmailOptions): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!process.env.RESEND_API_KEY || !resend) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  // Use verified domain or default to Resend test domain
  let fromEmail = options.from || process.env.RESEND_FROM_EMAIL;
  
  // If no from email is set, or if it's a placeholder, use Resend test domain
  if (!fromEmail || fromEmail.includes('yourdomain.com') || fromEmail.includes('example.com')) {
    fromEmail = 'onboarding@resend.dev';
    console.warn('[EMAIL] Using Resend test domain. Configure RESEND_FROM_EMAIL with a verified domain for production.');
  }
  
  console.log('[EMAIL] Attempting to send email via Resend:', {
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
    
    // Check for specific error types and provide user-friendly messages
    const error = result.error as any;
    if (error.statusCode === 403 && error.name === 'validation_error') {
      // This is the "test domain" error - provide helpful message
      return { 
        success: false, 
        error: 'DOMAIN_NOT_VERIFIED',
        message: 'El servicio de email está en modo de prueba. Para enviar invitaciones a otros usuarios, necesitas verificar un dominio en Resend. La invitación fue creada, pero el email no pudo ser enviado. Puedes compartir el código de invitación manualmente.'
      };
    }
    
    return { success: false, error: JSON.stringify(result.error) };
  }

  if (result.data) {
    console.log('[EMAIL] Email sent successfully via Resend:', {
      id: result.data.id,
      to: options.to,
      from: fromEmail,
    });
    return { success: true, message: result.data.id };
  }

  console.error('[EMAIL] No data returned from Resend');
  return { success: false, error: 'No data returned from Resend API' };
}

/**
 * Main email sending function - tries SMTP first, then Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Priority: SMTP if configured, then Resend
    if (smtpTransporter) {
      console.log('[EMAIL] Using SMTP transport');
      const result = await sendEmailViaSMTP(options);
      if (result.success) {
        return result;
      }
      // If SMTP fails, fallback to Resend if available
      console.warn('[EMAIL] SMTP failed, trying Resend as fallback');
    }

    // Try Resend if SMTP is not configured or failed
    if (resend) {
      console.log('[EMAIL] Using Resend transport');
      return await sendEmailViaResend(options);
    }

    // No email service configured
    const errorMsg = 'No email service configured. Configure either SMTP or RESEND_API_KEY.';
    console.error('[EMAIL]', errorMsg);
    return { success: false, error: errorMsg };
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
  inviteLink: string,
  inviteCode?: string
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
        ${inviteCode ? `
        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">Your invitation code:</p>
          <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${inviteCode}</p>
        </div>
        ` : ''}
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
    
    // If it's a domain verification error, throw a specific error type
    if (result.error === 'DOMAIN_NOT_VERIFIED') {
      const domainError = new Error(result.message || 'Domain not verified');
      (domainError as any).code = 'DOMAIN_NOT_VERIFIED';
      throw domainError;
    }
    
    // For other errors, throw with the error message
    throw new Error(result.error || 'Failed to send email');
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

  const result = await sendEmail({
    to: email,
    subject: 'Verify your email address - Friends & Family',
    html,
  });

  if (!result.success) {
    console.error('[EMAIL] Failed to send verification email:', result.error);
  }

  return result.success;
}
