/*
  # Enhanced Money Transfer Display System

  1. Changes to existing tables
    - No changes to `exchange_rates` table structure (already supports multiple banks per country)
    
  2. New Tables
    - `service_logos`
      - `id` (uuid, primary key)
      - `name` (text) - Service name
      - `url` (text) - Logo image URL
      - `order_index` (integer) - Display order
      - `is_active` (boolean) - Show/hide on display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Updates to business_settings
    - Add `business_name` column for editable business name
    - Add `weather_city` column for weather API location
    - Add `weather_api_key` column for weather API key (optional)

  4. Security
    - Enable RLS on new service_logos table
    - Public read access for display screen
    - Service role for admin operations
*/

-- Add new columns to business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN business_name text DEFAULT 'Money Transfer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'weather_city'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN weather_city text DEFAULT 'Santo Domingo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'weather_api_key'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN weather_api_key text DEFAULT '';
  END IF;
END $$;

-- Service Logos Table
CREATE TABLE IF NOT EXISTS service_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active service logos"
  ON service_logos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage service logos"
  ON service_logos FOR ALL
  USING (auth.role() = 'service_role');

-- Update existing business_settings record with new fields
UPDATE business_settings
SET 
  business_name = COALESCE(business_name, 'Money Transfer'),
  weather_city = COALESCE(weather_city, 'Santo Domingo'),
  weather_api_key = COALESCE(weather_api_key, '')
WHERE id IS NOT NULL;

-- Insert sample service logos
INSERT INTO service_logos (name, url, order_index) VALUES
  ('Western Union', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=100&fit=crop', 1),
  ('MoneyGram', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=100&fit=crop', 2),
  ('Recargas', 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=200&h=100&fit=crop', 3)
ON CONFLICT DO NOTHING;