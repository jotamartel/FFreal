-- Migration: Add email_from and email_support columns to ff_discount_config
-- Execute this in Supabase SQL Editor if the columns are missing

-- Add email_from column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ff_discount_config' 
    AND column_name = 'email_from'
  ) THEN
    ALTER TABLE ff_discount_config ADD COLUMN email_from VARCHAR(255);
    RAISE NOTICE '✅ Column email_from added to ff_discount_config';
  ELSE
    RAISE NOTICE '✅ Column email_from already exists';
  END IF;
END $$;

-- Add email_support column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ff_discount_config' 
    AND column_name = 'email_support'
  ) THEN
    ALTER TABLE ff_discount_config ADD COLUMN email_support VARCHAR(255);
    RAISE NOTICE '✅ Column email_support added to ff_discount_config';
  ELSE
    RAISE NOTICE '✅ Column email_support already exists';
  END IF;
END $$;

-- Verify columns exist
DO $$ 
DECLARE
  email_from_exists BOOLEAN;
  email_support_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ff_discount_config' 
    AND column_name = 'email_from'
  ) INTO email_from_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ff_discount_config' 
    AND column_name = 'email_support'
  ) INTO email_support_exists;
  
  IF email_from_exists AND email_support_exists THEN
    RAISE NOTICE '✅ ✅ ✅ Migration completed successfully! Both columns exist.';
  ELSE
    IF NOT email_from_exists THEN
      RAISE WARNING '❌ Column email_from still missing';
    END IF;
    IF NOT email_support_exists THEN
      RAISE WARNING '❌ Column email_support still missing';
    END IF;
  END IF;
END $$;
