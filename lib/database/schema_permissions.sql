-- Add permissions and configuration for Friends & Family groups

-- Add can_create_groups column to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'can_create_groups'
  ) THEN
    ALTER TABLE users ADD COLUMN can_create_groups BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_users_can_create_groups ON users(can_create_groups);
  END IF;
END $$;

-- Add max_members_default to discount config
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ff_discount_config' AND column_name = 'max_members_default'
  ) THEN
    ALTER TABLE ff_discount_config ADD COLUMN max_members_default INTEGER DEFAULT 6;
  END IF;
END $$;

-- Add invite_redirect_url to discount config (for email links)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ff_discount_config' AND column_name = 'invite_redirect_url'
  ) THEN
    ALTER TABLE ff_discount_config ADD COLUMN invite_redirect_url VARCHAR(500);
  END IF;
END $$;

-- Update existing users: set can_create_groups to false by default
UPDATE users SET can_create_groups = false WHERE can_create_groups IS NULL;

-- Update existing discount configs: set max_members_default to 6 if not set
UPDATE ff_discount_config SET max_members_default = 6 WHERE max_members_default IS NULL;

