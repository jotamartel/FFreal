// Email Service using Resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return false;
    }

    const result = await resend.emails.send({
      from: options.from || 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return !!result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
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
    <h2>You've been invited to join ${groupName}!</h2>
    <p>Click the link below to accept the invitation and start saving with Friends & Family discounts:</p>
    <p><a href="${inviteLink}">Accept Invitation</a></p>
    <p>This link will expire in 7 days.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Invitation to join ${groupName}`,
    html,
  });
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  verificationLink: string
): Promise<boolean> {
  const html = `
    <h2>Verify your email address</h2>
    <p>Please click the link below to verify your email address:</p>
    <p><a href="${verificationLink}">Verify Email</a></p>
    <p>This link will expire in 24 hours.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your email address',
    html,
  });
}

