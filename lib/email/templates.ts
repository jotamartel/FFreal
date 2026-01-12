export type SupportedLanguage = 'es' | 'en';

export interface InvitationTemplateData {
  groupName: string;
  inviteLink: string;
  inviteCode?: string;
  inviterName?: string;
}

export interface WelcomeTemplateData {
  groupName: string;
  inviteCode?: string;
}

export interface VerificationTemplateData {
  verificationLink: string;
}

export interface OrderItemTemplateData {
  name: string;
  quantity: number;
  price?: number;
}

export interface OrderTemplateData {
  customerName?: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  subtotalAmount?: number;
  shippingAmount?: number;
  items: OrderItemTemplateData[];
  trackingNumber?: string;
  trackingLink?: string;
}

export interface DeliveryIssueTemplateData {
  customerName?: string;
  orderNumber: string;
  refundAmount: number;
  currency: string;
  reason: string;
  supportEmail?: string;
}

export type EmailTemplateResult = {
  subject: string;
  html: string;
};

function formatCurrency(amount: number, currency: string, language: SupportedLanguage) {
  try {
    return new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function renderItemsList(items: OrderItemTemplateData[], currency: string, language: SupportedLanguage) {
  if (!items || items.length === 0) {
    return '';
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr>
          <th align="left" style="border-bottom: 1px solid #ddd; padding: 8px 0;">${language === 'es' ? 'Producto' : 'Item'}</th>
          <th align="center" style="border-bottom: 1px solid #ddd; padding: 8px 0;">${language === 'es' ? 'Cantidad' : 'Qty'}</th>
          <th align="right" style="border-bottom: 1px solid #ddd; padding: 8px 0;">${language === 'es' ? 'Precio' : 'Price'}</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((item) => `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${item.name}</td>
              <td align="center" style="padding: 10px 0; border-bottom: 1px solid #eee;">${item.quantity}</td>
              <td align="right" style="padding: 10px 0; border-bottom: 1px solid #eee;">${
                typeof item.price === 'number'
                  ? formatCurrency(item.price, currency, language)
                  : '—'
              }</td>
            </tr>
          `)
          .join('')}
      </tbody>
    </table>
  `;
}

function wrapEmailContent(title: string, body: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px; background: #f2f2f7;">
        <div style="background: linear-gradient(135deg, #001f5c 0%, #3366ff 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 26px;">${title}</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);">
          ${body}
        </div>
        <p style="text-align: center; color: #777; font-size: 12px; margin-top: 32px;">
          &copy; ${new Date().getFullYear()} Friends & Family Program
        </p>
      </body>
    </html>
  `;
}

export function renderInvitationTemplate(
  data: InvitationTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? `Te invitaron a ${data.groupName}`
    : `You're invited to ${data.groupName}`;

  const greeting = data.inviterName
    ? language === 'es'
      ? `${data.inviterName} te invitó a unirte a ${data.groupName}.`
      : `${data.inviterName} invited you to join ${data.groupName}.`
    : language === 'es'
      ? `Te invitaron a unirte a ${data.groupName}.`
      : `You've been invited to join ${data.groupName}.`;

  const body = `
    <h2 style="color: #001f5c; margin-top: 0; margin-bottom: 20px; font-size: 22px;">
      ${language === 'es' ? '¡Bienvenido!' : 'Welcome!'}
    </h2>
    <p>${greeting}</p>
    <p>${
      language === 'es'
        ? 'Forma parte del programa Friends & Family y accede a beneficios exclusivos.'
        : 'Join our Friends & Family program and access exclusive benefits.'
    }</p>
    ${
      data.inviteCode
        ? `
        <div style="background: #f5f7ff; border: 1px dashed #001f5c; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; color: #21409a; font-size: 14px;">${
            language === 'es' ? 'Tu código de invitación' : 'Your invitation code'
          }</p>
          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #001f5c;">
            ${data.inviteCode}
          </p>
        </div>
      `
        : ''
    }
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.inviteLink}" style="background: #001f5c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        ${language === 'es' ? 'Aceptar invitación' : 'Accept invitation'}
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      ${
        language === 'es'
          ? 'Este enlace expira en 7 días.'
          : 'This link expires in 7 days.'
      }
    </p>
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}

export function renderWelcomeTemplate(
  data: WelcomeTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? `¡Bienvenido a ${data.groupName}!`
    : `Welcome to ${data.groupName}!`;

  const body = `
    <h2 style="color: #001f5c; margin-top: 0; margin-bottom: 16px; font-size: 22px;">
      ${language === 'es' ? '¡Ya sos parte del grupo!' : 'You are now part of the group!'}
    </h2>
    <p>${
      language === 'es'
        ? 'Confirmamos que te uniste correctamente al programa Friends & Family.'
        : 'You successfully joined the Friends & Family program.'
    }</p>
    ${
      data.inviteCode
        ? `<p>${
            language === 'es'
              ? `Tu código de beneficios es <strong>${data.inviteCode}</strong>.`
              : `Your benefits code is <strong>${data.inviteCode}</strong>.`
          }</p>`
        : ''
    }
    <p>${
      language === 'es'
        ? 'Disfruta de acceso prioritario, lanzamientos exclusivos y beneficios especiales.'
        : 'Enjoy priority access, exclusive launches, and special benefits.'
    }</p>
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}

export function renderVerificationTemplate(
  data: VerificationTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? 'Verifica tu dirección de email'
    : 'Verify your email address';

  const body = `
    <h2 style="color: #001f5c; margin-top: 0; margin-bottom: 20px; font-size: 22px;">
      ${language === 'es' ? 'Último paso' : 'One last step'}
    </h2>
    <p>${
      language === 'es'
        ? 'Haz clic en el siguiente botón para verificar tu email y activar tu cuenta Friends & Family.'
        : 'Click the button below to verify your email and activate your Friends & Family account.'
    }</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.verificationLink}" style="background: #001f5c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        ${language === 'es' ? 'Verificar email' : 'Verify email'}
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      ${
        language === 'es'
          ? 'Este enlace expira en 24 horas.'
          : 'This link expires in 24 hours.'
      }
    </p>
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}

export function renderOrderConfirmationTemplate(
  data: OrderTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? `Confirmación de pedido ${data.orderNumber}`
    : `Order confirmation ${data.orderNumber}`;

  const body = `
    <p>${
      language === 'es'
        ? `Hola ${data.customerName || ''}, confirmamos la recepción de tu pedido.`
        : `Hi ${data.customerName || ''}, we received your order.`
    }</p>
    <p><strong>${
      language === 'es'
        ? 'Número de pedido'
        : 'Order number'
    }:</strong> ${data.orderNumber}</p>
    ${renderItemsList(data.items, data.currency, language)}
    <p style="margin-top: 24px;">
      ${
        language === 'es'
          ? `Total: <strong>${formatCurrency(data.totalAmount, data.currency, language)}</strong>`
          : `Total: <strong>${formatCurrency(data.totalAmount, data.currency, language)}</strong>`
      }
    </p>
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}

export function renderOrderShippedTemplate(
  data: OrderTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? `Tu pedido ${data.orderNumber} fue despachado`
    : `Your order ${data.orderNumber} has shipped`;

  const tracking = data.trackingNumber
    ? `<p>${
        language === 'es'
          ? `Número de seguimiento: <strong>${data.trackingNumber}</strong>`
          : `Tracking number: <strong>${data.trackingNumber}</strong>`
      }</p>`
    : '';

  const trackingLink = data.trackingLink
    ? `<p><a href="${data.trackingLink}" style="color: #001f5c;">${
        language === 'es' ? 'Seguir envío' : 'Track shipment'
      }</a></p>`
    : '';

  const body = `
    <p>${
      language === 'es'
        ? `Tu pedido ${data.orderNumber} está en camino.`
        : `Your order ${data.orderNumber} is on its way.`
    }</p>
    ${tracking}
    ${trackingLink}
    ${renderItemsList(data.items, data.currency, language)}
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}

export function renderOrderDeliveredTemplate(
  data: OrderTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? `Tu pedido ${data.orderNumber} fue entregado`
    : `Your order ${data.orderNumber} was delivered`;

  const body = `
    <p>${
      language === 'es'
        ? '¡Gracias por confiar en nosotros! Confirmamos que tu pedido fue entregado.'
        : 'Thank you for shopping with us! Your order has been delivered.'
    }</p>
    ${renderItemsList(data.items, data.currency, language)}
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}

export function renderDeliveryIssueTemplate(
  data: DeliveryIssueTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? `Incidente con tu pedido ${data.orderNumber}`
    : `Issue with your order ${data.orderNumber}`;

  const body = `
    <p>${
      language === 'es'
        ? `Hola ${data.customerName || ''}, hubo un inconveniente con tu pedido.`
        : `Hi ${data.customerName || ''}, we encountered an issue with your order.`
    }</p>
    <p>${
      language === 'es'
        ? `Motivo: <strong>${data.reason}</strong>`
        : `Reason: <strong>${data.reason}</strong>`
    }</p>
    <p>${
      language === 'es'
        ? `Se generará un reembolso de ${formatCurrency(data.refundAmount, data.currency, language)}.`
        : `A refund of ${formatCurrency(data.refundAmount, data.currency, language)} will be issued.`
    }</p>
    ${
      data.supportEmail
        ? `<p>${
            language === 'es'
              ? `Para más ayuda contáctanos en <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.`
              : `For support please reach us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.`
          }</p>`
        : ''
    }
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}

export function renderPartialRefundTemplate(
  data: DeliveryIssueTemplateData,
  language: SupportedLanguage = 'es'
): EmailTemplateResult {
  const subject = language === 'es'
    ? `Actualización de tu pedido ${data.orderNumber}`
    : `Update on your order ${data.orderNumber}`;

  const body = `
    <p>${
      language === 'es'
        ? `Procesamos un reintegro parcial para tu pedido ${data.orderNumber}.`
        : `We processed a partial refund for your order ${data.orderNumber}.`
    }</p>
    <p>${
      language === 'es'
        ? `Monto reembolsado: <strong>${formatCurrency(data.refundAmount, data.currency, language)}</strong>`
        : `Refund amount: <strong>${formatCurrency(data.refundAmount, data.currency, language)}</strong>`
    }</p>
    <p>${
      language === 'es'
        ? `Motivo: ${data.reason}.`
        : `Reason: ${data.reason}.`
    }</p>
    ${
      data.supportEmail
        ? `<p>${
            language === 'es'
              ? `Si necesitas ayuda, escríbenos a <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.`
              : `If you need assistance, contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.`
          }</p>`
        : ''
    }
  `;

  return {
    subject,
    html: wrapEmailContent(subject, body),
  };
}
