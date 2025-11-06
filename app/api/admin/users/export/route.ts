// API route to export users

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/export - Export all users
 * Query params:
 *   - format: 'json' (default) or 'csv'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    console.log('[EXPORT USERS] Exporting users:', { format });

    // Get all users
    const usersResult = await pool.query(
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
      ORDER BY created_at DESC`
    );

    const users = usersResult.rows;

    const exportData = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      users: users,
      summary: {
        total_users: users.length,
        active_users: users.filter(u => u.is_active).length,
        can_create_groups: users.filter(u => u.can_create_groups).length,
        admins: users.filter(u => u.role === 'admin').length,
        customers: users.filter(u => u.role === 'customer').length,
      },
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvRows: string[] = [];
      
      // CSV Header
      csvRows.push('ID,Email,Name,Phone,Role,Is Active,Can Create Groups,Shopify Customer ID,Created At,Updated At,Last Login At');
      
      // CSV Data
      users.forEach(user => {
        csvRows.push(
          `"${user.id}","${user.email}","${user.name || ''}","${user.phone || ''}","${user.role}","${user.is_active}","${user.can_create_groups}","${user.shopify_customer_id || ''}","${user.created_at}","${user.updated_at}","${user.last_login_at || ''}"`
        );
      });

      const csvContent = csvRows.join('\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv;charset=utf-8;',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON format (default)
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error) {
    console.error('[EXPORT USERS] Error exporting users:', error);
    return NextResponse.json(
      { error: 'Error exporting users' },
      { status: 500 }
    );
  }
}

