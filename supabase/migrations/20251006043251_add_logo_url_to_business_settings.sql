/*
  # Add Logo Support to Business Settings

  1. Changes
    - Add `logo_url` column to `business_settings` table to store logo image URL
    - Column is optional (nullable) to maintain backward compatibility
  
  2. Notes
    - Logo images will be stored in Supabase Storage
    - If logo_url is null, the display will fall back to showing the business name as text
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN logo_url text;
  END IF;
END $$;