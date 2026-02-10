/*
  # Add notification settings to business_admins

  1. New Columns
    - `notification_email` (text) - Email for receiving system notifications
    - `telegram_bot_token` (text) - Telegram bot token for notifications
    - `telegram_chat_id` (text) - Telegram chat ID for notifications
  
  2. Notes
    - These fields allow superadmins to configure notification settings
    - Settings are stored directly in business_admins table
    - This avoids the need for separate Supabase Auth session
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_admins' AND column_name = 'notification_email'
  ) THEN
    ALTER TABLE business_admins ADD COLUMN notification_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_admins' AND column_name = 'telegram_bot_token'
  ) THEN
    ALTER TABLE business_admins ADD COLUMN telegram_bot_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_admins' AND column_name = 'telegram_chat_id'
  ) THEN
    ALTER TABLE business_admins ADD COLUMN telegram_chat_id text;
  END IF;
END $$;
