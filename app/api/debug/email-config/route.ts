// Endpoint de diagnóstico para verificar configuración de email
// Útil para ver qué servicio se está usando y por qué

import { NextResponse } from 'next/server';

export async function GET() {
  const config: any = {
    timestamp: new Date().toISOString(),
    smtp: {
      configured: false,
      variables: {},
      status: 'not_configured',
    },
    resend: {
      configured: false,
      variables: {},
      status: 'not_configured',
    },
    priority: 'unknown',
    recommendation: '',
  };

  // Check SMTP configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpPort = process.env.SMTP_PORT;
  const smtpSecure = process.env.SMTP_SECURE;
  const smtpFrom = process.env.SMTP_FROM_EMAIL;

  config.smtp.variables = {
    SMTP_HOST: smtpHost ? `${smtpHost.substring(0, 10)}...` : 'NOT SET',
    SMTP_PORT: smtpPort || 'NOT SET (default: 587)',
    SMTP_SECURE: smtpSecure || 'NOT SET (default: false)',
    SMTP_USER: smtpUser ? `${smtpUser.substring(0, 5)}...` : 'NOT SET',
    SMTP_PASSWORD: smtpPassword ? 'SET (hidden)' : 'NOT SET',
    SMTP_FROM_EMAIL: smtpFrom || 'NOT SET',
  };

  if (smtpHost && smtpUser && smtpPassword) {
    config.smtp.configured = true;
    config.smtp.status = 'ready';
  } else {
    config.smtp.status = 'missing_variables';
    const missing = [];
    if (!smtpHost) missing.push('SMTP_HOST');
    if (!smtpUser) missing.push('SMTP_USER');
    if (!smtpPassword) missing.push('SMTP_PASSWORD');
    config.smtp.missing = missing;
  }

  // Check Resend configuration
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;

  config.resend.variables = {
    RESEND_API_KEY: resendKey ? `${resendKey.substring(0, 5)}...` : 'NOT SET',
    RESEND_FROM_EMAIL: resendFrom || 'NOT SET',
  };

  if (resendKey) {
    config.resend.configured = true;
    config.resend.status = resendFrom ? 'ready_with_domain' : 'ready_test_mode';
  } else {
    config.resend.status = 'not_configured';
  }

  // Determine priority
  if (config.smtp.configured) {
    config.priority = 'SMTP (will be used first)';
    config.recommendation = 'SMTP está configurado y se usará primero. Si SMTP falla, se intentará Resend como fallback.';
  } else if (config.resend.configured) {
    config.priority = 'Resend (SMTP not configured)';
    config.recommendation = 'SMTP no está configurado. Se usará Resend. Para usar SMTP, configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD.';
  } else {
    config.priority = 'None (no email service configured)';
    config.recommendation = 'Ningún servicio de email está configurado. Configura SMTP o Resend.';
  }

  // Environment info
  config.environment = {
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    vercel_url: process.env.VERCEL_URL,
  };

  return NextResponse.json(config, { status: 200 });
}
