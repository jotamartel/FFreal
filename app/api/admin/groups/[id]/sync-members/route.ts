// API route to sync group member count

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/groups/[id]/sync-members - Sync current_members count with actual active members
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;

    // Count actual active members
    const countResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM ff_group_members 
       WHERE group_id = $1 AND status = 'active'`,
      [groupId]
    );

    const actualCount = parseInt(countResult.rows[0]?.count || '0');

    // Update current_members in ff_groups
    await pool.query(
      `UPDATE ff_groups 
       SET current_members = $1, updated_at = NOW() 
       WHERE id = $2`,
      [actualCount, groupId]
    );

    // Get updated group info
    const groupResult = await pool.query(
      'SELECT id, name, current_members, max_members FROM ff_groups WHERE id = $1',
      [groupId]
    );

    return NextResponse.json({
      success: true,
      group: groupResult.rows[0],
      actualMemberCount: actualCount,
      message: `Synchronized member count to ${actualCount}`,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[SYNC MEMBERS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error synchronizing member count' },
      { status: 500 }
    );
  }
}

