// Admin API route for updating a specific user

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/[id] - Update user permissions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { can_create_groups, is_active } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (can_create_groups !== undefined) {
      updates.push(`can_create_groups = $${paramCount++}`);
      values.push(can_create_groups);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, email, name, role, is_active, can_create_groups, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: result.rows[0],
      message: 'User updated successfully',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/[id] - Get a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const result = await pool.query(
      `SELECT 
        id, 
        email, 
        name, 
        phone, 
        role, 
        is_active, 
        can_create_groups,
        shopify_customer_id,
        created_at, 
        updated_at, 
        last_login_at
      FROM users
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: result.rows[0],
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

