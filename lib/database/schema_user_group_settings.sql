-- Add user-specific group settings
-- This allows each user to have custom max members and discount tier for groups they create

-- Add max_members_per_group to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'max_members_per_group'
  ) THEN
    ALTER TABLE users ADD COLUMN max_members_per_group INTEGER;
    CREATE INDEX IF NOT EXISTS idx_users_max_members_per_group ON users(max_members_per_group);
  END IF;
END $$;

-- Add discount_tier_identifier to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'discount_tier_identifier'
  ) THEN
    ALTER TABLE users ADD COLUMN discount_tier_identifier VARCHAR(50);
    CREATE INDEX IF NOT EXISTS idx_users_discount_tier_identifier ON users(discount_tier_identifier);
  END IF;
END $$;

-- Add comment explaining the fields
COMMENT ON COLUMN users.max_members_per_group IS 'Maximum number of members allowed in groups created by this user. If NULL, uses default from discount config.';
COMMENT ON COLUMN users.discount_tier_identifier IS 'Discount tier identifier for groups created by this user (e.g., "1", "2", "basic", "premium"). Used to determine discount percentage.';

