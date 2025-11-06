import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS(request: NextRequest) {
  console.log('[OPTIONS /api/test-cors] Preflight request');
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

export async function GET(request: NextRequest) {
  console.log('[GET /api/test-cors] Request received');
  return NextResponse.json(
    { message: 'CORS test successful', timestamp: new Date().toISOString() },
    { 
      status: 200,
      headers: corsHeaders,
    }
  );
}

