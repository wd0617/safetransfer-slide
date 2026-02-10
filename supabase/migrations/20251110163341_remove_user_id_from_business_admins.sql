/*
  # Remove user_id from business_admins

  1. Changes
    - Make user_id nullable (can't drop if has data)
    - Remove foreign key constraint
    - Business admins no longer tied to Supabase Auth

  2. Notes
    - Existing data preserved
    - Future records won't use user_id
    - Allows independent business authentication
*/

-- Remove foreign key constraint if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'business_admins_user_id_fkey'
  ) THEN
    ALTER TABLE business_admins DROP CONSTRAINT business_admins_user_id_fkey;
  END IF;
END $$;

-- Make user_id nullable
ALTER TABLE business_admins 
ALTER COLUMN user_id DROP NOT NULL;