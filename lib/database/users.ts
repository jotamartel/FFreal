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
  can_create_groups?: boolean;
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
       RETURNING id, email, name, phone, is_active, role, shopify_customer_id, can_create_groups, created_at, updated_at, last_login_at`,
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
      `SELECT id, email, password_hash, name, phone, is_active, role, shopify_customer_id, can_create_groups, created_at, updated_at, last_login_at
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
      `SELECT id, email, name, phone, is_active, role, shopify_customer_id, can_create_groups, created_at, updated_at, last_login_at
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
       RETURNING id, email, name, phone, is_active, role, shopify_customer_id, can_create_groups, created_at, updated_at, last_login_at`,
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
      `SELECT id, email, name, phone, is_active, role, shopify_customer_id, can_create_groups, created_at, updated_at, last_login_at
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
 * If the user doesn't exist, creates a basic user account linked to the Shopify customer ID
 */
export async function findOrCreateUserByShopifyCustomerId(
  shopifyCustomerId: string,
  email?: string
): Promise<User | null> {
  try {
    // First, try to find existing user
    let user = await getUserByShopifyCustomerId(shopifyCustomerId);
    
    if (user) {
      console.log(`[findOrCreateUserByShopifyCustomerId] ✅ Found existing user for Shopify customer ID: ${shopifyCustomerId}`);
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
        console.log(`[findOrCreateUserByShopifyCustomerId] ✅ Linked existing user by email to Shopify customer ID: ${shopifyCustomerId}`);
        return { ...userByEmail, shopify_customer_id: shopifyCustomerId };
      }
    }

    // If still not found, create a basic user account for this Shopify customer
    // This allows Customer Account Extensions to work without requiring full registration
    // The user can complete registration later if needed
    console.log(`[findOrCreateUserByShopifyCustomerId] Creating new user for Shopify customer ID: ${shopifyCustomerId}`);
    
    // Generate a temporary email if none provided
    const tempEmail = email || `shopify_customer_${shopifyCustomerId}@temp.local`;
    
    // Generate a random password (user won't be able to login with this until they register properly)
    const tempPassword = `temp_${shopifyCustomerId}_${Date.now()}`;
    const passwordHash = await hashPassword(tempPassword);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, shopify_customer_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, phone, is_active, role, shopify_customer_id, can_create_groups, created_at, updated_at, last_login_at`,
      [
        tempEmail,
        passwordHash,
        `Shopify Customer ${shopifyCustomerId}`,
        'customer',
        shopifyCustomerId,
        true, // Active by default
      ]
    );

    const newUser = result.rows[0] as User;
    console.log(`[findOrCreateUserByShopifyCustomerId] ✅ Created new user for Shopify customer ID: ${shopifyCustomerId}, userId: ${newUser.id}`);
    return newUser;
  } catch (error) {
    console.error('[findOrCreateUserByShopifyCustomerId] Error finding or creating user by Shopify customer ID:', error);
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

