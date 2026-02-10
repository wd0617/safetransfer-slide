/*
  # Add External Contact Fields to Businesses

  1. Changes
    - Add `whatsapp_number` column to businesses table for WhatsApp contact
    - Add `telegram_id` column to businesses table for Telegram contact
    - These fields allow SuperAdmin to notify businesses via external channels
    - Fields are optional and can be updated by businesses or SuperAdmin

  2. Security
    - Fields are accessible by business owners and SuperAdmin
    - Existing RLS policies automatically cover these new fields
*/

-- Add WhatsApp contact field
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Add Telegram contact field
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS telegram_id text;

-- Add helpful comments
COMMENT ON COLUMN businesses.whatsapp_number IS 'WhatsApp number in international format (e.g., +1234567890)';
COMMENT ON COLUMN businesses.telegram_id IS 'Telegram username or chat ID for notifications';
