-- Add discount_code column to ff_groups table
-- This stores the Shopify discount code for each group

DO $$ 
BEGIN
  -- Add discount_code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ff_groups' 
    AND column_name = 'discount_code'
  ) THEN
    ALTER TABLE ff_groups 
    ADD COLUMN discount_code VARCHAR(50);
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_ff_groups_discount_code 
    ON ff_groups(discount_code);
    
    RAISE NOTICE 'Column discount_code added to ff_groups table';
  ELSE
    RAISE NOTICE 'Column discount_code already exists in ff_groups table';
  END IF;
END $$;

COMMENT ON COLUMN ff_groups.discount_code IS 'Shopify discount code for this Friends & Family group. Automatically created when group is created.';

