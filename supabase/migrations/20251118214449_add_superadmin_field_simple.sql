/*
  # Add SuperAdmin field to business_admins

  1. Changes
    - Add `is_superadmin` boolean field to business_admins table
    - Default to false for all existing and new users
    - Create index for quick superadmin lookups
  
  2. Notes
    - This field will be used to identify superadmin users
    - Superadmin users will have access to view all businesses data
    - RLS policies will be added in a subsequent migration
*/

-- Add is_superadmin field to business_admins
ALTER TABLE business_admins 
ADD COLUMN IF NOT EXISTS is_superadmin boolean DEFAULT false NOT NULL;

-- Create index for fast superadmin lookups
CREATE INDEX IF NOT EXISTS idx_business_admins_superadmin 
ON business_admins(is_superadmin) 
WHERE is_superadmin = true;