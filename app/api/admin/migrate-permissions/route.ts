// API endpoint to execute permissions migration SQL
// This should only be run once to add the new columns

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/migrate-permissions - Execute permissions migration
 * WARNING: This should be protected with authentication in production
 */
export async function POST(request: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.MIGRATION_SECRET || 'migration-secret-key-change-in-production';
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide authorization header with migration secret.' },
        { status: 401 }
      );
    }

    console.log('[MIGRATION] Starting permissions migration...');

    const results: string[] = [];

    // 1. Add can_create_groups column to users table
    try {
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'can_create_groups'
      `);

      if (checkColumn.rows.length === 0) {
        await pool.query(`
          ALTER TABLE users ADD COLUMN can_create_groups BOOLEAN DEFAULT false
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_users_can_create_groups ON users(can_create_groups)
        `);
        results.push('✅ Added can_create_groups column to users table');
      } else {
        results.push('ℹ️ can_create_groups column already exists');
      }
    } catch (error: any) {
      results.push(`❌ Error adding can_create_groups: ${error.message}`);
    }

    // 2. Add max_members_default to discount config
    try {
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ff_discount_config' AND column_name = 'max_members_default'
      `);

      if (checkColumn.rows.length === 0) {
        await pool.query(`
          ALTER TABLE ff_discount_config ADD COLUMN max_members_default INTEGER DEFAULT 6
        `);
        results.push('✅ Added max_members_default column to ff_discount_config table');
      } else {
        results.push('ℹ️ max_members_default column already exists');
      }
    } catch (error: any) {
      results.push(`❌ Error adding max_members_default: ${error.message}`);
    }

    // 3. Add invite_redirect_url to discount config
    try {
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ff_discount_config' AND column_name = 'invite_redirect_url'
      `);

      if (checkColumn.rows.length === 0) {
        await pool.query(`
          ALTER TABLE ff_discount_config ADD COLUMN invite_redirect_url VARCHAR(500)
        `);
        results.push('✅ Added invite_redirect_url column to ff_discount_config table');
      } else {
        results.push('ℹ️ invite_redirect_url column already exists');
      }
    } catch (error: any) {
      results.push(`❌ Error adding invite_redirect_url: ${error.message}`);
    }

    // 4. Update existing users: set can_create_groups to false by default
    try {
      const updateResult = await pool.query(`
        UPDATE users SET can_create_groups = false WHERE can_create_groups IS NULL
      `);
      results.push(`✅ Updated ${updateResult.rowCount} users with default can_create_groups = false`);
    } catch (error: any) {
      results.push(`❌ Error updating users: ${error.message}`);
    }

    // 5. Update existing discount configs: set max_members_default to 6 if not set
    try {
      const updateResult = await pool.query(`
        UPDATE ff_discount_config SET max_members_default = 6 WHERE max_members_default IS NULL
      `);
      results.push(`✅ Updated ${updateResult.rowCount} discount configs with default max_members_default = 6`);
    } catch (error: any) {
      results.push(`❌ Error updating discount configs: ${error.message}`);
    }

    console.log('[MIGRATION] Migration completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[MIGRATION] Error executing migration:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/migrate-permissions - Check migration status
 */
export async function GET() {
  try {
    const status: any = {};

    // Check can_create_groups column
    try {
      const check = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'can_create_groups'
      `);
      status.can_create_groups = check.rows.length > 0;
    } catch (error: any) {
      status.can_create_groups = false;
      status.can_create_groups_error = error.message;
    }

    // Check max_members_default column
    try {
      const check = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ff_discount_config' AND column_name = 'max_members_default'
      `);
      status.max_members_default = check.rows.length > 0;
    } catch (error: any) {
      status.max_members_default = false;
      status.max_members_default_error = error.message;
    }

    // Check invite_redirect_url column
    try {
      const check = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ff_discount_config' AND column_name = 'invite_redirect_url'
      `);
      status.invite_redirect_url = check.rows.length > 0;
    } catch (error: any) {
      status.invite_redirect_url = false;
      status.invite_redirect_url_error = error.message;
    }

    return NextResponse.json({
      migration_status: status,
      message: 'Use POST /api/admin/migrate-permissions with authorization header to run migration',
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

