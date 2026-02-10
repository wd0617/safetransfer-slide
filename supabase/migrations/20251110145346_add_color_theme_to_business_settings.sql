/*
  # Add Color Theme to Business Settings

  1. Changes
    - Add `color_theme` column to business_settings table
    - Default theme is 'ocean-blue'
    - Theme names correspond to predefined color palettes
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add color theme column to business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'color_theme'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN color_theme text NOT NULL DEFAULT 'ocean-blue';
  END IF;
END $$;