import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check if SHOPIFY_API_SECRET is configured
 * This is safe because it only shows if the secret exists, not the actual value
 */
export async function GET(request: NextRequest) {
  const hasSecret = !!process.env.SHOPIFY_API_SECRET;
  const secretLength = process.env.SHOPIFY_API_SECRET?.length || 0;
  const hasApiKey = !!process.env.SHOPIFY_API_KEY || !!process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
  
  return NextResponse.json({
    configured: {
      hasApiSecret: hasSecret,
      secretLength: secretLength,
      hasApiKey: hasApiKey,
      apiKey: process.env.SHOPIFY_API_KEY || process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'not-set',
    },
    message: hasSecret 
      ? '✅ SHOPIFY_API_SECRET está configurado' 
      : '❌ SHOPIFY_API_SECRET NO está configurado',
    instructions: hasSecret 
      ? 'El secret está configurado. Si aún ves "Unauthorized", revisa los logs de validación del token.'
      : 'Necesitas configurar SHOPIFY_API_SECRET en Vercel Environment Variables.',
  });
}

