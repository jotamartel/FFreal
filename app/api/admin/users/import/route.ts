// API route to import users

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';
import { hashPassword } from '@/lib/auth/password';

export const dynamic = 'force-dynamic';

interface ImportUser {
  id?: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
  can_create_groups?: boolean;
  max_members_per_group?: number | null;
  discount_tier_identifier?: string | null;
  shopify_customer_id?: string | null;
  password?: string; // Optional, only if creating new user
}

/**
 * POST /api/admin/users/import - Import users
 * Body: JSON with users array
 * Mode: 'skip' (skip existing), 'update' (update existing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { users, mode = 'skip' } = body;

    // mode: 'skip' (skip existing), 'update' (update existing)
    
    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Invalid import data. Expected users array.' },
        { status: 400 }
      );
    }

    console.log('[IMPORT USERS] Importing users:', {
      count: users.length,
      mode,
    });

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      userIds: [] as string[],
    };

    for (const userData of users) {
      try {
        const user: ImportUser = userData;

        // Validate required fields
        if (!user.email) {
          results.errors.push(`User missing required field email: ${user.email || 'unknown'}`);
          continue;
        }

        // Check if user exists
        const existingResult = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );
        const existingUser = existingResult.rows[0];

        let userId: string;

        if (existingUser) {
          if (mode === 'skip') {
            results.skipped++;
            results.userIds.push(existingUser.id);
            continue;
          }

          // Update existing user
          const updateFields: string[] = [];
          const updateValues: any[] = [];
          let paramIndex = 1;

          if (user.name !== undefined) {
            updateFields.push(`name = $${paramIndex++}`);
            updateValues.push(user.name || null);
          }
          if (user.phone !== undefined) {
            updateFields.push(`phone = $${paramIndex++}`);
            updateValues.push(user.phone || null);
          }
          if (user.role) {
            updateFields.push(`role = $${paramIndex++}`);
            updateValues.push(user.role);
          }
          if (user.is_active !== undefined) {
            updateFields.push(`is_active = $${paramIndex++}`);
            updateValues.push(user.is_active);
          }
          if (user.can_create_groups !== undefined) {
            updateFields.push(`can_create_groups = $${paramIndex++}`);
            updateValues.push(user.can_create_groups);
          }
          if (user.max_members_per_group !== undefined) {
            updateFields.push(`max_members_per_group = $${paramIndex++}`);
            updateValues.push(user.max_members_per_group);
          }
          if (user.discount_tier_identifier !== undefined) {
            updateFields.push(`discount_tier_identifier = $${paramIndex++}`);
            updateValues.push(user.discount_tier_identifier || null);
          }
          if (user.shopify_customer_id !== undefined) {
            updateFields.push(`shopify_customer_id = $${paramIndex++}`);
            updateValues.push(user.shopify_customer_id || null);
          }

          updateValues.push(existingUser.id);

          if (updateFields.length > 0) {
            await pool.query(
              `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
              updateValues
            );
            results.updated++;
          } else {
            results.skipped++;
          }

          userId = existingUser.id;
        } else {
          // Create new user
          const role = user.role || 'customer';
          const isActive = user.is_active !== undefined ? user.is_active : true;
          const canCreateGroups = user.can_create_groups !== undefined ? user.can_create_groups : false;
          const maxMembersPerGroup = user.max_members_per_group !== undefined ? user.max_members_per_group : null;
          const discountTierIdentifier = user.discount_tier_identifier !== undefined ? user.discount_tier_identifier : null;

          // Generate a default password if not provided
          let passwordHash: string;
          if (user.password) {
            passwordHash = await hashPassword(user.password);
          } else {
            // Generate a random password (user will need to reset it)
            const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
            passwordHash = await hashPassword(randomPassword);
          }

          const insertResult = await pool.query(
            `INSERT INTO users 
             (email, name, phone, role, password_hash, is_active, can_create_groups, max_members_per_group, discount_tier_identifier, shopify_customer_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
              user.email,
              user.name || null,
              user.phone || null,
              role,
              passwordHash,
              isActive,
              canCreateGroups,
              maxMembersPerGroup,
              discountTierIdentifier,
              user.shopify_customer_id || null,
            ]
          );

          userId = insertResult.rows[0].id;
          results.created++;
        }

        results.userIds.push(userId);
      } catch (userError: any) {
        const userEmail = userData?.email || 'unknown';
        results.errors.push(`Error importing user ${userEmail}: ${userError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: users.length,
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[IMPORT USERS] Error importing users:', error);
    return NextResponse.json(
      { error: error.message || 'Error importing users' },
      { status: 500 }
    );
  }
}

