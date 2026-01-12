// Admin API routes for configuration settings

import { NextRequest, NextResponse } from 'next/server';
import { getDiscountConfig, upsertDiscountConfig } from '@/lib/database/ff-groups';
import { UpdateDiscountConfigParams } from '@/types/ff-groups';
import { getStoreStatus, updateStoreStatus } from '@/lib/database/store-status';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

async function getTermsConfig(merchantId: string) {
  try {
    const result = await pool.query(
      `SELECT terms_version, terms_text FROM ff_discount_config WHERE merchant_id = $1`,
      [merchantId]
    );
    if (result.rows.length === 0) {
      return { version: null, text: null };
    }
    const row = result.rows[0];
    return {
      version: row.terms_version || null,
      text: row.terms_text || null,
    };
  } catch (error) {
    console.error('[getTermsConfig] Error:', error);
    return { version: null, text: null };
  }
}

async function updateTermsConfig(merchantId: string, version: string | null, text: string | null) {
  try {
    await pool.query(
      `UPDATE ff_discount_config
       SET terms_version = $2, terms_text = $3, updated_at = NOW()
       WHERE merchant_id = $1`,
      [merchantId, version, text]
    );
  } catch (error) {
    console.error('[updateTermsConfig] Error:', error);
    throw error;
  }
}

async function getEmailConfig(merchantId: string) {
  try {
    const result = await pool.query(
      `SELECT email_from, email_support FROM ff_discount_config WHERE merchant_id = $1`,
      [merchantId]
    );
    if (result.rows.length === 0) {
      return { from: null, support: null };
    }
    const row = result.rows[0];
    return {
      from: row.email_from || null,
      support: row.email_support || null,
    };
  } catch (error) {
    console.error('[getEmailConfig] Error:', error);
    return { from: null, support: null };
  }
}

async function updateEmailConfig(merchantId: string, from: string, support: string | null) {
  try {
    await pool.query(
      `UPDATE ff_discount_config
       SET email_from = $2, email_support = $3, updated_at = NOW()
       WHERE merchant_id = $1`,
      [merchantId, from, support]
    );
  } catch (error) {
    console.error('[updateEmailConfig] Error:', error);
    throw error;
  }
}

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

    const [config, status, terms, email] = await Promise.all([
      getDiscountConfig(merchantId),
      getStoreStatus(merchantId),
      getTermsConfig(merchantId),
      getEmailConfig(merchantId),
    ]);

    return NextResponse.json(
      { config, storeStatus: status, terms, email },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting admin config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
      isEnabled,
      rules,
      maxGroupsPerEmail,
      coolingPeriodDays,
      maxMembersDefault,
      inviteRedirectUrl,
      isStoreOpen,
      nextEventDate,
      eventMessage,
      termsVersion,
      termsText,
      emailFrom,
      emailSupport,
    } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!emailFrom) {
      return NextResponse.json(
        { error: 'emailFrom is required' },
        { status: 400 }
      );
    }

    const payload: UpdateDiscountConfigParams = {
      merchantId,
      isEnabled,
      rules,
      maxGroupsPerEmail,
      coolingPeriodDays,
      maxMembersDefault,
      inviteRedirectUrl,
      isStoreOpen,
      nextEventDate,
      eventMessage,
    };

    const [config] = await Promise.all([
      upsertDiscountConfig(payload),
      updateStoreStatus({
        merchantId,
        isStoreOpen: Boolean(isStoreOpen),
        inviteRedirectUrl: inviteRedirectUrl ?? null,
        nextEventDate: nextEventDate ?? null,
        eventMessage: eventMessage ?? null,
      }),
      updateTermsConfig(merchantId, termsVersion ?? null, termsText ?? null),
      updateEmailConfig(merchantId, emailFrom, emailSupport ?? null),
    ]);

    if (!config) {
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    console.error('Error updating admin config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

