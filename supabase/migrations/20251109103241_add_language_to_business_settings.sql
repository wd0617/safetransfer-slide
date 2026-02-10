/*
  # Add Language Support to Business Settings
  
  1. Changes
    - Add `language` column to business_settings table
    - Support for Spanish (es), English (en), and Italian (it)
    - Default language is Spanish
  
  2. Notes
    - Existing records will default to Spanish
*/

-- Add language column to business_settings
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'es' CHECK (language IN ('es', 'en', 'it'));