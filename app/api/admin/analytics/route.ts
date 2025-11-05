// Admin API routes for analytics

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

/**
 * GET /api/admin/analytics - Get analytics for merchant
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

    // Get total active groups
    const groupsResult = await pool.query(
      `SELECT COUNT(*) as total, 
              AVG(current_members)::numeric(10,2) as avg_members,
              SUM(current_members) as total_members
       FROM ff_groups 
       WHERE merchant_id = $1 AND status = 'active'`,
      [merchantId]
    );

    // Get groups by status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM ff_groups 
       WHERE merchant_id = $1 
       GROUP BY status`,
      [merchantId]
    );

    // Get top performing groups (by member count)
    const topGroupsResult = await pool.query(
      `SELECT id, name, current_members, max_members, created_at 
       FROM ff_groups 
       WHERE merchant_id = $1 AND status = 'active'
       ORDER BY current_members DESC 
       LIMIT 10`,
      [merchantId]
    );

    const analytics = {
      totalGroups: parseInt(groupsResult.rows[0]?.total || '0'),
      averageGroupSize: parseFloat(groupsResult.rows[0]?.avg_members || '0'),
      totalMembers: parseInt(groupsResult.rows[0]?.total_members || '0'),
      groupsByStatus: statusResult.rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      topGroups: topGroupsResult.rows,
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

