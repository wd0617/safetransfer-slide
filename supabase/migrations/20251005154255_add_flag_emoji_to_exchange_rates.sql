/*
  # Add Flag Emoji to Exchange Rates

  1. Changes
    - Add `flag_emoji` column to exchange_rates table to store country flags
    - Default to empty string to support existing records
    
  2. Notes
    - Admins can enter emoji flags (🇩🇴, 🇭🇳, 🇬🇹, etc.) or upload/paste flag images
    - Improves visual recognition on display screen
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exchange_rates' AND column_name = 'flag_emoji'
  ) THEN
    ALTER TABLE exchange_rates ADD COLUMN flag_emoji text DEFAULT '';
  END IF;
END $$;

-- Update existing sample data with flag emojis
UPDATE exchange_rates SET flag_emoji = '🇩🇴' WHERE country = 'República Dominicana' AND flag_emoji = '';
UPDATE exchange_rates SET flag_emoji = '🇭🇳' WHERE country = 'Honduras' AND flag_emoji = '';
UPDATE exchange_rates SET flag_emoji = '🇬🇹' WHERE country = 'Guatemala' AND flag_emoji = '';
UPDATE exchange_rates SET flag_emoji = '🇸🇻' WHERE country = 'El Salvador' AND flag_emoji = '';
