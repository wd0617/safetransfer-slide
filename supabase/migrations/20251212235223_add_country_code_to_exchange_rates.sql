/*
  # Add country_code to exchange_rates

  1. Changes
    - Add `country_code` column to `exchange_rates` table
    - This allows translating country names based on user language

  2. Notes
    - Existing records will have NULL country_code
    - New records should include country_code
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exchange_rates' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE exchange_rates ADD COLUMN country_code text;
  END IF;
END $$;
