/*
  # Add Custom Colors to Business Settings

  1. Changes
    - Add `custom_primary_color` column to business_settings table
    - Add `custom_secondary_color` column to business_settings table
    - These columns store hex color codes for custom themes
    - When color_theme is 'custom', these colors will be used
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add custom color columns to business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'custom_primary_color'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN custom_primary_color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'custom_secondary_color'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN custom_secondary_color text;
  END IF;
END $$;