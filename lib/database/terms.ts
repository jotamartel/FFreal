import { pool } from './client';

export interface RecordTermsAcceptanceParams {
  customerId: string;
  termsVersion: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface TermsAcceptance {
  id: string;
  customer_id: string;
  terms_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export async function recordTermsAcceptance(
  params: RecordTermsAcceptanceParams
): Promise<TermsAcceptance | null> {
  try {
    const result = await pool.query(
      `INSERT INTO terms_acceptance (customer_id, terms_version, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)
       RETURNING id, customer_id, terms_version, accepted_at, ip_address, user_agent`,
      [
        params.customerId,
        params.termsVersion,
        params.ipAddress ?? null,
        params.userAgent ?? null,
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      customer_id: row.customer_id,
      terms_version: row.terms_version,
      accepted_at: row.accepted_at?.toISOString?.() ?? row.accepted_at,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
    };
  } catch (error) {
    console.error('[recordTermsAcceptance] Error recording terms acceptance:', error);
    return null;
  }
}

export async function getLatestTermsAcceptance(
  customerId: string
): Promise<TermsAcceptance | null> {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, terms_version, accepted_at, ip_address, user_agent
       FROM terms_acceptance
       WHERE customer_id = $1
       ORDER BY accepted_at DESC
       LIMIT 1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      customer_id: row.customer_id,
      terms_version: row.terms_version,
      accepted_at: row.accepted_at?.toISOString?.() ?? row.accepted_at,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
    };
  } catch (error) {
    console.error('[getLatestTermsAcceptance] Error fetching terms acceptance:', error);
    return null;
  }
}
