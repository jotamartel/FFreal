import { pool } from './client';

export interface StoreStatus {
  merchantId: string;
  isStoreOpen: boolean;
  inviteRedirectUrl: string | null;
  nextEventDate: string | null;
  eventMessage: string | null;
}

export interface UpdateStoreStatusParams {
  merchantId: string;
  isStoreOpen: boolean;
  inviteRedirectUrl?: string | null;
  nextEventDate?: string | null;
  eventMessage?: string | null;
}

const DEFAULT_STORE_STATUS: StoreStatus = {
  merchantId: 'default',
  isStoreOpen: false,
  inviteRedirectUrl: null,
  nextEventDate: null,
  eventMessage: null,
};

export async function getStoreStatus(merchantId: string = 'default'): Promise<StoreStatus> {
  try {
    const result = await pool.query(
      `SELECT merchant_id, is_store_open, invite_redirect_url, next_event_date, event_message
       FROM ff_discount_config
       WHERE merchant_id = $1`,
      [merchantId]
    );

    if (result.rows.length === 0) {
      return { ...DEFAULT_STORE_STATUS, merchantId };
    }

    const row = result.rows[0];
    return {
      merchantId: row.merchant_id,
      isStoreOpen: Boolean(row.is_store_open),
      inviteRedirectUrl: row.invite_redirect_url ?? null,
      nextEventDate: row.next_event_date ? row.next_event_date.toISOString?.() ?? row.next_event_date : null,
      eventMessage: row.event_message ?? null,
    };
  } catch (error) {
    console.error('[getStoreStatus] Error fetching store status:', error);
    return { ...DEFAULT_STORE_STATUS, merchantId };
  }
}

export async function updateStoreStatus(params: UpdateStoreStatusParams): Promise<StoreStatus | null> {
  try {
    const { merchantId, isStoreOpen, inviteRedirectUrl = null, nextEventDate = null, eventMessage = null } = params;

    const result = await pool.query(
      `INSERT INTO ff_discount_config (
         merchant_id,
         is_enabled,
         invite_redirect_url,
         is_store_open,
         next_event_date,
         event_message
       ) VALUES ($1, true, $2, $3, $4, $5)
       ON CONFLICT (merchant_id)
       DO UPDATE SET
         invite_redirect_url = EXCLUDED.invite_redirect_url,
         is_store_open = EXCLUDED.is_store_open,
         next_event_date = EXCLUDED.next_event_date,
         event_message = EXCLUDED.event_message,
         updated_at = NOW()
       RETURNING merchant_id, is_store_open, invite_redirect_url, next_event_date, event_message`,
      [merchantId, inviteRedirectUrl, isStoreOpen, nextEventDate, eventMessage]
    );

    const row = result.rows[0];
    return {
      merchantId: row.merchant_id,
      isStoreOpen: Boolean(row.is_store_open),
      inviteRedirectUrl: row.invite_redirect_url ?? null,
      nextEventDate: row.next_event_date ? row.next_event_date.toISOString?.() ?? row.next_event_date : null,
      eventMessage: row.event_message ?? null,
    };
  } catch (error) {
    console.error('[updateStoreStatus] Error updating store status:', error);
    return null;
  }
}
