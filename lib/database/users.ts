// User database operations (L'Oréal adaptation)

import { pool } from './client';
import { hashPassword, verifyPassword } from '../auth/password';
import {
  User,
  CreateUserParams,
  UpdateUserParams,
} from '@/types/users';

const USER_COLUMNS = `
  id,
  email,
  name,
  phone,
  role,
  can_create_groups,
  max_members_per_group,
  discount_tier_identifier,
  shopify_customer_id,
  is_active,
  created_at,
  updated_at,
  last_login_at
`;

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    can_create_groups: row.can_create_groups ?? false,
    max_members_per_group: row.max_members_per_group ?? null,
    discount_tier_identifier: row.discount_tier_identifier ?? null,
    shopify_customer_id: row.shopify_customer_id ?? null,
    is_active: row.is_active ?? true,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    updated_at: row.updated_at?.toISOString?.() ?? row.updated_at,
    last_login_at: row.last_login_at ? (row.last_login_at?.toISOString?.() ?? row.last_login_at) : null,
  };
}

export async function createUser(params: CreateUserParams): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(params.password);

    const result = await pool.query(
      `INSERT INTO users (
        email,
        password_hash,
        name,
        phone,
        role,
        can_create_groups,
        max_members_per_group,
        discount_tier_identifier,
        shopify_customer_id,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${USER_COLUMNS}`,
      [
        params.email,
        passwordHash,
        params.name ?? null,
        params.phone ?? null,
        params.role ?? 'customer',
        params.canCreateGroups ?? false,
        params.maxMembersPerGroup ?? null,
        params.discountTierIdentifier ?? null,
        params.shopifyCustomerId ?? null,
        params.isActive ?? true,
      ]
    );

    return mapRowToUser(result.rows[0]);
  } catch (error) {
    console.error('[createUser] Error creating user:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRowToUser(result.rows[0]);
  } catch (error) {
    console.error('[getUserByEmail] Error getting user by email:', error);
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRowToUser(result.rows[0]);
  } catch (error) {
    console.error('[getUserById] Error getting user by id:', error);
    return null;
  }
}

export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT ${USER_COLUMNS}, password_hash
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      console.warn(`[verifyUserCredentials] User not found: ${email}`);
      return null;
    }

    const dbUser = result.rows[0];

    if (!dbUser.is_active) {
      console.warn(`[verifyUserCredentials] User inactive: ${email}`);
      return null;
    }

    const isValid = await verifyPassword(password, dbUser.password_hash);
    if (!isValid) {
      console.warn(`[verifyUserCredentials] Invalid password for ${email}`);
      return null;
    }

    await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [dbUser.id]);

    return mapRowToUser({ ...dbUser, last_login_at: new Date() });
  } catch (error) {
    console.error('[verifyUserCredentials] Error verifying credentials:', error);
    return null;
  }
}

export async function updateUser(
  id: string,
  params: UpdateUserParams
): Promise<User | null> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (params.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(params.name);
    }
    if (params.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(params.phone);
    }
    if (params.role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(params.role);
    }
    if (params.canCreateGroups !== undefined) {
      updates.push(`can_create_groups = $${paramCount++}`);
      values.push(params.canCreateGroups);
    }
    if (params.maxMembersPerGroup !== undefined) {
      updates.push(`max_members_per_group = $${paramCount++}`);
      values.push(params.maxMembersPerGroup);
    }
    if (params.discountTierIdentifier !== undefined) {
      updates.push(`discount_tier_identifier = $${paramCount++}`);
      values.push(params.discountTierIdentifier);
    }
    if (params.shopifyCustomerId !== undefined) {
      updates.push(`shopify_customer_id = $${paramCount++}`);
      values.push(params.shopifyCustomerId);
    }
    if (params.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(params.isActive);
    }
    if (params.lastLoginAt !== undefined) {
      updates.push(`last_login_at = $${paramCount++}`);
      values.push(params.lastLoginAt);
    }

    if (updates.length === 0) {
      return getUserById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING ${USER_COLUMNS}`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    if (params.maxMembersPerGroup !== undefined) {
      try {
        await pool.query(
          `UPDATE ff_groups
           SET max_members = COALESCE($1,
             (SELECT max_members_default FROM ff_discount_config WHERE merchant_id = ff_groups.merchant_id LIMIT 1),
             20),
               updated_at = NOW()
           WHERE owner_user_id = $2`,
          [params.maxMembersPerGroup, id]
        );
      } catch (groupUpdateError) {
        console.error('[updateUser] Error syncing group max members:', groupUpdateError);
      }
    }

    return mapRowToUser(result.rows[0]);
  } catch (error) {
    console.error('[updateUser] Error updating user:', error);
    return null;
  }
}

export async function getUserByShopifyCustomerId(shopifyCustomerId: string): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE shopify_customer_id = $1`,
      [shopifyCustomerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRowToUser(result.rows[0]);
  } catch (error) {
    console.error('[getUserByShopifyCustomerId] Error getting user by Shopify customer ID:', error);
    return null;
  }
}

export async function findOrCreateUserByShopifyCustomerId(
  shopifyCustomerId: string,
  email?: string
): Promise<User | null> {
  try {
    let user = await getUserByShopifyCustomerId(shopifyCustomerId);
    if (user) {
      return user;
    }

    if (email) {
      const userByEmail = await getUserByEmail(email);
      if (userByEmail) {
        await pool.query(
          `UPDATE users SET shopify_customer_id = $1, updated_at = NOW() WHERE id = $2`,
          [shopifyCustomerId, userByEmail.id]
        );
        return { ...userByEmail, shopify_customer_id: shopifyCustomerId };
      }
    }

    const tempEmail = email || `shopify_customer_${shopifyCustomerId}@temp.local`;
    const tempPassword = `temp_${shopifyCustomerId}_${Date.now()}`;
    const passwordHash = await hashPassword(tempPassword);

    const result = await pool.query(
      `INSERT INTO users (
        email,
        password_hash,
        name,
        role,
        shopify_customer_id,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${USER_COLUMNS}`,
      [
        tempEmail,
        passwordHash,
        `Shopify Customer ${shopifyCustomerId}`,
        'customer',
        shopifyCustomerId,
        true,
      ]
    );

    return mapRowToUser(result.rows[0]);
  } catch (error) {
    console.error('[findOrCreateUserByShopifyCustomerId] Error handling Shopify customer ID:', error);
    return null;
  }
}

export async function emailExists(email: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('[emailExists] Error checking email existence:', error);
    return false;
  }
}

