/*
  # Add flag URL to exchange rates

  1. Changes
    - Add `flag_url` column to `exchange_rates` table to store country flag image URLs
    - Remove dependency on `flag_emoji` column for displaying flags
    - Update existing records to have flag URLs based on country names

  2. Notes
    - Flag URLs will point to reliable flag image sources
    - Each country will have its flag URL stored directly in the database
*/

-- Add flag_url column to exchange_rates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exchange_rates' AND column_name = 'flag_url'
  ) THEN
    ALTER TABLE exchange_rates ADD COLUMN flag_url text;
  END IF;
END $$;

-- Update existing records with flag URLs based on country names
UPDATE exchange_rates
SET flag_url = CASE country
  WHEN 'Guatemala' THEN 'https://flagcdn.com/w160/gt.png'
  WHEN 'Honduras' THEN 'https://flagcdn.com/w160/hn.png'
  WHEN 'El Salvador' THEN 'https://flagcdn.com/w160/sv.png'
  WHEN 'República Dominicana' THEN 'https://flagcdn.com/w160/do.png'
  WHEN 'Costa Rica' THEN 'https://flagcdn.com/w160/cr.png'
  WHEN 'Nicaragua' THEN 'https://flagcdn.com/w160/ni.png'
  WHEN 'Panamá' THEN 'https://flagcdn.com/w160/pa.png'
  WHEN 'México' THEN 'https://flagcdn.com/w160/mx.png'
  WHEN 'Colombia' THEN 'https://flagcdn.com/w160/co.png'
  WHEN 'Venezuela' THEN 'https://flagcdn.com/w160/ve.png'
  WHEN 'Perú' THEN 'https://flagcdn.com/w160/pe.png'
  WHEN 'Ecuador' THEN 'https://flagcdn.com/w160/ec.png'
  WHEN 'Argentina' THEN 'https://flagcdn.com/w160/ar.png'
  WHEN 'Chile' THEN 'https://flagcdn.com/w160/cl.png'
  WHEN 'Brasil' THEN 'https://flagcdn.com/w160/br.png'
  WHEN 'Uruguay' THEN 'https://flagcdn.com/w160/uy.png'
  WHEN 'Paraguay' THEN 'https://flagcdn.com/w160/py.png'
  WHEN 'Bolivia' THEN 'https://flagcdn.com/w160/bo.png'
  ELSE flag_url
END
WHERE flag_url IS NULL;