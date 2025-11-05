// User database operations

import { pool } from './client';
import { hashPassword, verifyPassword } from '../auth/password';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  is_active: boolean;
  role: string;
  shopify_customer_id: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface CreateUserParams {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: string;
  shopify_customer_id?: string;
}

export interface UpdateUserParams {
  name?: string;
  phone?: string;
  is_active?: boolean;
}

/**
 * Create a new user
 */
export async function createUser(params: CreateUserParams): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(params.password);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, phone, role, shopify_customer_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, phone, is_active, role, shopify_customer_id, created_at, updated_at, last_login_at`,
      [
        params.email,
        passwordHash,
        params.name || null,
        params.phone || null,
        params.role || 'customer',
        params.shopify_customer_id || null,
      ]
    );

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT id, email, password_hash, name, phone, is_active, role, shopify_customer_id, created_at, updated_at, last_login_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT id, email, name, phone, is_active, role, shopify_customer_id, created_at, updated_at, last_login_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

/**
 * Verify user credentials
 */
export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<User | null> {
  try {
    // Primero buscar sin filtrar por is_active para ver qué pasa
    const checkResult = await pool.query(
      `SELECT id, email, password_hash, name, phone, is_active, role, shopify_customer_id, created_at, updated_at, last_login_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (checkResult.rows.length === 0) {
      console.error(`[verifyUserCredentials] Usuario no encontrado: ${email}`);
      return null;
    }

    const user = checkResult.rows[0];
    
    if (!user.is_active) {
      console.error(`[verifyUserCredentials] Usuario inactivo: ${email} (is_active = ${user.is_active})`);
      return null;
    }

    // Verificar contraseña
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      console.error(`[verifyUserCredentials] Contraseña incorrecta para: ${email}`);
      return null;
    }

    console.log(`[verifyUserCredentials] ✅ Credenciales válidas para: ${email}`);

    // Update last login
    await pool.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );

    // Remove password_hash from returned user
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('[verifyUserCredentials] Error verificando credenciales:', error);
    return null;
  }
}

/**
 * Update user
 */
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
    if (params.is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(params.is_active);
    }

    if (updates.length === 0) {
      return getUserById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, name, phone, is_active, role, shopify_customer_id, created_at, updated_at, last_login_at`,
      values
    );

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * Get user by Shopify customer ID
 */
export async function getUserByShopifyCustomerId(shopifyCustomerId: string): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT id, email, name, phone, is_active, role, shopify_customer_id, created_at, updated_at, last_login_at
       FROM users
       WHERE shopify_customer_id = $1`,
      [shopifyCustomerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user by Shopify customer ID:', error);
    return null;
  }
}

/**
 * Find or create user by Shopify customer ID
 * This is useful for Customer Account Extensions where we only have the Shopify customer ID
 */
export async function findOrCreateUserByShopifyCustomerId(
  shopifyCustomerId: string,
  email?: string
): Promise<User | null> {
  try {
    // First, try to find existing user
    let user = await getUserByShopifyCustomerId(shopifyCustomerId);
    
    if (user) {
      return user;
    }

    // If not found and we have email, try to find by email and link the Shopify customer ID
    if (email) {
      const userByEmail = await getUserByEmail(email);
      if (userByEmail) {
        // Update the user with Shopify customer ID
        await pool.query(
          `UPDATE users SET shopify_customer_id = $1, updated_at = NOW() WHERE id = $2`,
          [shopifyCustomerId, userByEmail.id]
        );
        return { ...userByEmail, shopify_customer_id: shopifyCustomerId };
      }
    }

    // If still not found, we can't create a user without email/password
    // This should be handled by the registration flow
    console.warn(`[findOrCreateUserByShopifyCustomerId] User not found for Shopify customer ID: ${shopifyCustomerId}`);
    return null;
  } catch (error) {
    console.error('Error finding or creating user by Shopify customer ID:', error);
    return null;
  }
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

