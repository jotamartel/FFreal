// Admin API route for managing users

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users - Get all users with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const canCreateGroups = searchParams.get('canCreateGroups');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
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
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (canCreateGroups !== null && canCreateGroups !== undefined) {
      query += ` AND can_create_groups = $${paramCount}`;
      params.push(canCreateGroups === 'true');
      paramCount++;
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM users/,
      'SELECT COUNT(*) as total FROM users'
    );
    const countResult = await pool.query(
      countQuery.replace(/ORDER BY[\s\S]*$/, ''),
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return NextResponse.json({
      users: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

