// API route to export groups and members

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/groups/export - Export all groups and members
 * Query params:
 *   - format: 'json' (default) or 'csv'
 *   - merchantId: optional, defaults to 'default'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const merchantId = searchParams.get('merchantId') || 'default';

    console.log('[EXPORT] Exporting groups and members:', {
      format,
      merchantId,
    });

    // Get all groups for the merchant
    const groupsResult = await pool.query(
      `SELECT 
        g.id,
        g.merchant_id,
        g.name,
        g.owner_customer_id,
        g.owner_email,
        g.owner_user_id,
        g.invite_code,
        g.max_members,
        g.current_members,
        g.status,
        g.created_at,
        g.updated_at
      FROM ff_groups g
      WHERE g.merchant_id = $1
      ORDER BY g.created_at DESC`,
      [merchantId]
    );

    const groups = groupsResult.rows;

    // Get all members for these groups
    const groupIds = groups.map(g => g.id);
    let members: any[] = [];

    if (groupIds.length > 0) {
      const membersResult = await pool.query(
        `SELECT 
          m.id,
          m.group_id,
          m.customer_id,
          m.user_id,
          m.email,
          m.role,
          m.status,
          m.email_verified,
          m.joined_at,
          m.created_at,
          m.updated_at
        FROM ff_group_members m
        WHERE m.group_id = ANY($1)
        ORDER BY m.joined_at ASC`,
        [groupIds]
      );

      members = membersResult.rows;
    }

    // Organize members by group
    const groupsWithMembers = groups.map(group => ({
      ...group,
      members: members.filter(m => m.group_id === group.id),
    }));

    const exportData = {
      exported_at: new Date().toISOString(),
      merchant_id: merchantId,
      version: '1.0',
      groups: groupsWithMembers,
      summary: {
        total_groups: groups.length,
        total_members: members.length,
        active_groups: groups.filter(g => g.status === 'active').length,
        active_members: members.filter(m => m.status === 'active').length,
      },
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvRows: string[] = [];
      
      // CSV Header
      csvRows.push('Group ID,Group Name,Owner Email,Invite Code,Max Members,Current Members,Status,Created At,Member Email,Member Role,Member Status,Member Joined At');
      
      // CSV Data
      groupsWithMembers.forEach(group => {
        if (group.members.length === 0) {
          // Group with no members
          csvRows.push(
            `"${group.id}","${group.name}","${group.owner_email}","${group.invite_code}",${group.max_members},${group.current_members},"${group.status}","${group.created_at}",,,,`
          );
        } else {
          group.members.forEach((member: any, index: number) => {
            if (index === 0) {
              // First member row includes group info
              csvRows.push(
                `"${group.id}","${group.name}","${group.owner_email}","${group.invite_code}",${group.max_members},${group.current_members},"${group.status}","${group.created_at}","${member.email}","${member.role}","${member.status}","${member.joined_at || ''}"`
              );
            } else {
              // Subsequent members, group info is empty
              csvRows.push(
                `,"${group.name}",,,,,,"${member.email}","${member.role}","${member.status}","${member.joined_at || ''}"`
              );
            }
          });
        }
      });

      const csvContent = csvRows.join('\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv;charset=utf-8;',
          'Content-Disposition': `attachment; filename="groups-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON format (default)
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="groups-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error) {
    console.error('[EXPORT] Error exporting groups:', error);
    return NextResponse.json(
      { error: 'Error exporting groups and members' },
      { status: 500 }
    );
  }
}

