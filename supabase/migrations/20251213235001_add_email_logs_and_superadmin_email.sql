/*
  # Add Email Logging and Superadmin Email Configuration
  
  1. New Tables
    - `email_logs` - Tracks all sent emails for auditing
      - `id` (uuid, primary key)
      - `business_id` (uuid, optional - for business-related emails)
      - `recipient_email` (text)
      - `subject` (text)
      - `email_type` (text: notification, password_recovery, message, status_change, support)
      - `status` (text: sent, failed)
      - `error_message` (text, optional)
      - `created_at` (timestamptz)
  
  2. Changes
    - Add `notification_email` column to `superadmin_users` for receiving notifications
    - Add `email_notifications_enabled` to `businesses` for opt-in/out
  
  3. Security
    - Enable RLS on `email_logs`
    - Only superadmin can view email logs
*/

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('notification', 'password_recovery', 'message', 'status_change', 'support')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Add notification email to superadmin_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'superadmin_users' AND column_name = 'notification_email'
  ) THEN
    ALTER TABLE superadmin_users ADD COLUMN notification_email text;
  END IF;
END $$;

-- Add email notifications preference to businesses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE businesses ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Enable RLS on email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Superadmin can view all email logs
CREATE POLICY "Superadmin can view email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
    )
  );

-- Allow anon to insert email logs (for edge function)
CREATE POLICY "Allow insert email logs"
  ON email_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_business_id ON email_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
