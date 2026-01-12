// Email Service - Supports Resend and SMTP (Gmail/Outlook)

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { pool } from '@/lib/database/client';
import {
  renderInvitationTemplate,
  renderWelcomeTemplate,
  renderVerificationTemplate,
  renderOrderConfirmationTemplate,
  renderOrderShippedTemplate,
  renderOrderDeliveredTemplate,
  renderDeliveryIssueTemplate,
  renderPartialRefundTemplate,
  InvitationTemplateData,
  WelcomeTemplateData,
  VerificationTemplateData,
  OrderTemplateData,
  DeliveryIssueTemplateData,
  SupportedLanguage,
} from './templates';

// Initialize Resend only if API key is available (to prevent build errors)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Lazy initialization of SMTP transporter (to avoid Edge Runtime issues)
let smtpTransporter: nodemailer.Transporter | null = null;
const emailSettingsCache = new Map<string, { from: string | null; support: string | null }>();

function getSMTPTransporter(): nodemailer.Transporter | null {
  // Check if already initialized
  if (smtpTransporter) {
    return smtpTransporter;
  }

  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.log('[EMAIL] SMTP not configured - missing variables:', {
      hasSMTP_HOST: !!smtpHost,
      hasSMTP_USER: !!smtpUser,
      hasSMTP_PASSWORD: !!smtpPassword,
      hint: 'Configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in Vercel environment variables',
    });
    return null;
  }

  // Initialize transporter
  try {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE?.toLowerCase() === 'true', // true for 465, false for other ports (case-insensitive)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Add connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log('[EMAIL] SMTP transporter initialized:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || '587',
      secure: process.env.SMTP_SECURE?.toLowerCase() === 'true',
      secureRaw: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER?.substring(0, 3) + '***',
    });

    return smtpTransporter;
  } catch (error: any) {
    console.error('[EMAIL] Error initializing SMTP transporter:', error);
    return null;
  }
}

async function getEmailSettings(merchantId: string): Promise<{ from: string | null; support: string | null }> {
  if (emailSettingsCache.has(merchantId)) {
    return emailSettingsCache.get(merchantId)!;
  }

  try {
    // Check if columns exist first
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ff_discount_config' 
      AND column_name IN ('email_from', 'email_support')
    `);
    
    const hasEmailFrom = columnCheck.rows.some((r: any) => r.column_name === 'email_from');
    const hasEmailSupport = columnCheck.rows.some((r: any) => r.column_name === 'email_support');

    if (!hasEmailFrom || !hasEmailSupport) {
      console.error('[EMAIL] Missing columns in ff_discount_config:', {
        hasEmailFrom,
        hasEmailSupport,
        hint: 'Execute migration_add_email_columns.sql in Supabase SQL Editor'
      });
      // Return defaults if columns don't exist
      const settings = { from: null, support: null };
      emailSettingsCache.set(merchantId, settings);
      return settings;
    }

    const result = await pool.query(
      `SELECT email_from, email_support FROM ff_discount_config WHERE merchant_id = $1`,
      [merchantId]
    );

    const row = result.rows[0];
    const settings = {
      from: row?.email_from || null,
      support: row?.email_support || null,
    };

    emailSettingsCache.set(merchantId, settings);
    return settings;
  } catch (error: any) {
    // Handle case where columns don't exist
    if (error.message?.includes('email_from') || error.message?.includes('email_support')) {
      console.error('[EMAIL] Database schema error - missing email columns:', error.message);
      console.error('[EMAIL] Solution: Execute lib/database/migration_add_email_columns.sql in Supabase SQL Editor');
      const settings = { from: null, support: null };
      emailSettingsCache.set(merchantId, settings);
      return settings;
    }
    throw error;
  }
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
async function sendEmailViaSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string; message?: string; code?: string }> {
  const transporter = getSMTPTransporter();
  
  if (!transporter) {
    return { success: false, error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD.' };
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
      port: process.env.SMTP_PORT || '587',
      secure: process.env.SMTP_SECURE?.toLowerCase() === 'true',
      secureRaw: process.env.SMTP_SECURE,
    });

    // Verify connection first
    try {
      await transporter.verify();
      console.log('[EMAIL] ✅ SMTP connection verified');
    } catch (verifyError: any) {
      console.error('[EMAIL] ❌ SMTP connection verification failed:', {
        error: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
      });
      return { 
        success: false, 
        error: `SMTP connection failed: ${verifyError.message || 'Unknown error'}` 
      };
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('[EMAIL] ✅ Email sent via SMTP:', {
      messageId: info.messageId,
      to: options.to,
      from: fromEmail,
    });

    return { success: true, message: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL] ❌ SMTP error:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack?.substring(0, 500),
    });
    
    let errorMessage = error.message || 'Failed to send email via SMTP';
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = `SMTP connection failed. Check SMTP_HOST (${process.env.SMTP_HOST}) and SMTP_PORT (${process.env.SMTP_PORT || '587'}).`;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'SMTP connection timeout. Check your network and SMTP settings.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code,
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
      const helpMessage = 'El servicio de email está en modo de prueba. Para enviar invitaciones a otros usuarios, tienes 3 opciones:\n' +
        '1. Verificar un dominio en Resend (recomendado para producción)\n' +
        '2. Configurar SMTP con Gmail/Outlook (solución rápida)\n' +
        '3. Agregar emails de prueba en Resend Dashboard (solo para desarrollo)\n' +
        'Ver FIX_RESEND_TEST_MODE.md para instrucciones detalladas.\n' +
        'La invitación fue creada exitosamente. Puedes compartir el código de invitación manualmente.';
      
      return { 
        success: false, 
        error: 'DOMAIN_NOT_VERIFIED',
        message: helpMessage
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
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; message?: string; code?: string }> {
  try {
    // Priority: SMTP if configured, then Resend
    const transporter = getSMTPTransporter();
    if (transporter) {
      console.log('[EMAIL] ✅ SMTP configured - Using SMTP transport');
      const result = await sendEmailViaSMTP(options);
      if (result.success) {
        return result;
      }
      // If SMTP fails, fallback to Resend if available
      console.warn('[EMAIL] ⚠️ SMTP failed, trying Resend as fallback:', result.error);
    } else {
      console.log('[EMAIL] ⚠️ SMTP not configured - checking Resend...');
      console.log('[EMAIL] Debug - Environment variables:', {
        SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
        SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
        SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
      });
    }

    // Try Resend if SMTP is not configured or failed
    if (resend) {
      console.log('[EMAIL] Using Resend transport');
      return await sendEmailViaResend(options);
    }

    // No email service configured
    const errorMsg = 'No email service configured. Configure either SMTP (SMTP_HOST, SMTP_USER, SMTP_PASSWORD) or RESEND_API_KEY.';
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

interface BaseEmailParams {
  to: string;
  merchantId?: string;
  language?: SupportedLanguage;
}

async function sendTemplatedEmail(
  params: BaseEmailParams,
  template: { subject: string; html: string }
): Promise<boolean> {
  const { to, merchantId = 'default' } = params;
  const settings = await getEmailSettings(merchantId);
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    from: settings.from || undefined,
  });

  if (!result.success) {
    console.error('[EMAIL] Failed to send email:', result.error);
    if (result.error === 'DOMAIN_NOT_VERIFIED') {
      const domainError = new Error(result.message || 'Domain not verified');
      (domainError as any).code = 'DOMAIN_NOT_VERIFIED';
      throw domainError;
    }
    throw new Error(result.error || 'Failed to send email');
  }

  return true;
}

export async function sendInvitationEmail(
  params: BaseEmailParams & InvitationTemplateData
): Promise<boolean> {
  const template = renderInvitationTemplate(
    {
      groupName: params.groupName,
      inviteLink: params.inviteLink,
      inviteCode: params.inviteCode,
      inviterName: params.inviterName,
    },
    params.language
  );

  return sendTemplatedEmail(params, template);
}

export async function sendGroupWelcomeEmail(
  params: BaseEmailParams & WelcomeTemplateData
): Promise<boolean> {
  const template = renderWelcomeTemplate(
    {
      groupName: params.groupName,
      inviteCode: params.inviteCode,
    },
    params.language
  );

  return sendTemplatedEmail(params, template);
}

export async function sendVerificationEmail(
  params: BaseEmailParams & VerificationTemplateData
): Promise<boolean> {
  const template = renderVerificationTemplate(
    { verificationLink: params.verificationLink },
    params.language
  );

  return sendTemplatedEmail(params, template);
}

export async function sendOrderConfirmationEmail(
  params: BaseEmailParams & OrderTemplateData
): Promise<boolean> {
  const template = renderOrderConfirmationTemplate(params, params.language);
  return sendTemplatedEmail(params, template);
}

export async function sendOrderShippedEmail(
  params: BaseEmailParams & OrderTemplateData
): Promise<boolean> {
  const template = renderOrderShippedTemplate(params, params.language);
  return sendTemplatedEmail(params, template);
}

export async function sendOrderDeliveredEmail(
  params: BaseEmailParams & OrderTemplateData
): Promise<boolean> {
  const template = renderOrderDeliveredTemplate(params, params.language);
  return sendTemplatedEmail(params, template);
}

export async function sendDeliveryIssueEmail(
  params: BaseEmailParams & DeliveryIssueTemplateData
): Promise<boolean> {
  const settings = await getEmailSettings(params.merchantId || 'default');
  const template = renderDeliveryIssueTemplate(
    {
      ...params,
      supportEmail: params.supportEmail || settings.support || undefined,
    },
    params.language
  );
  return sendTemplatedEmail(params, template);
}

export async function sendPartialRefundEmail(
  params: BaseEmailParams & DeliveryIssueTemplateData
): Promise<boolean> {
  const settings = await getEmailSettings(params.merchantId || 'default');
  const template = renderPartialRefundTemplate(
    {
      ...params,
      supportEmail: params.supportEmail || settings.support || undefined,
    },
    params.language
  );
  return sendTemplatedEmail(params, template);
}
