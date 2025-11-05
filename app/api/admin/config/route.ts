// Admin API routes for discount configuration

import { NextRequest, NextResponse } from 'next/server';
import { getDiscountConfig, upsertDiscountConfig } from '@/lib/database/ff-groups';
import { UpdateDiscountConfigParams } from '@/types/ff-groups';

/**
 * GET /api/admin/config - Get discount configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const config = await getDiscountConfig(merchantId);

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    console.error('Error getting discount config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/config - Update discount configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
      isEnabled,
      discountType,
      tiers,
      rules,
      maxGroupsPerEmail,
      coolingPeriodDays,
    } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const config = await upsertDiscountConfig({
      merchantId,
      isEnabled,
      discountType,
      tiers,
      rules,
      maxGroupsPerEmail,
      coolingPeriodDays,
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    console.error('Error updating discount config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

