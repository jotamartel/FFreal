#!/usr/bin/env node
/**
 * Script to run permissions migration
 * Usage: node scripts/run-permissions-migration.js
 * 
 * Make sure DATABASE_URL is set in your environment or .env.local file
 */

// Load environment variables
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, use system env vars
}

const { Pool } = require('pg');

// Get connection string
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL o POSTGRES_URL no está configurado');
  process.exit(1);
}

// Configure pool with SSL for Supabase
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase') || connectionString.includes('sslmode=require')
    ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      }
    : false,
});

async function runMigration() {
  console.log('🚀 Starting permissions migration...\n');

  const results = [];

  try {
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
        console.log('✅ Added can_create_groups column to users table');
        results.push('✅ Added can_create_groups column');
      } else {
        console.log('ℹ️  can_create_groups column already exists');
        results.push('ℹ️  can_create_groups already exists');
      }
    } catch (error) {
      console.error('❌ Error adding can_create_groups:', error.message);
      results.push(`❌ Error: ${error.message}`);
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
        console.log('✅ Added max_members_default column to ff_discount_config table');
        results.push('✅ Added max_members_default column');
      } else {
        console.log('ℹ️  max_members_default column already exists');
        results.push('ℹ️  max_members_default already exists');
      }
    } catch (error) {
      console.error('❌ Error adding max_members_default:', error.message);
      results.push(`❌ Error: ${error.message}`);
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
        console.log('✅ Added invite_redirect_url column to ff_discount_config table');
        results.push('✅ Added invite_redirect_url column');
      } else {
        console.log('ℹ️  invite_redirect_url column already exists');
        results.push('ℹ️  invite_redirect_url already exists');
      }
    } catch (error) {
      console.error('❌ Error adding invite_redirect_url:', error.message);
      results.push(`❌ Error: ${error.message}`);
    }

    // 4. Update existing users: set can_create_groups to false by default
    try {
      const updateResult = await pool.query(`
        UPDATE users SET can_create_groups = false WHERE can_create_groups IS NULL
      `);
      console.log(`✅ Updated ${updateResult.rowCount} users with default can_create_groups = false`);
      results.push(`✅ Updated ${updateResult.rowCount} users`);
    } catch (error) {
      console.error('❌ Error updating users:', error.message);
      results.push(`❌ Error updating users: ${error.message}`);
    }

    // 5. Update existing discount configs: set max_members_default to 6 if not set
    try {
      const updateResult = await pool.query(`
        UPDATE ff_discount_config SET max_members_default = 6 WHERE max_members_default IS NULL
      `);
      console.log(`✅ Updated ${updateResult.rowCount} discount configs with default max_members_default = 6`);
      results.push(`✅ Updated ${updateResult.rowCount} discount configs`);
    } catch (error) {
      console.error('❌ Error updating discount configs:', error.message);
      results.push(`❌ Error updating configs: ${error.message}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    results.forEach(r => console.log(`  ${r}`));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

