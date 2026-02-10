/*
  # Add verification email type
  
  1. Changes
    - Update email_logs check constraint to include 'verification' type
    
  2. Notes
    - Required for email verification during business registration
*/

ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_email_type_check;

ALTER TABLE email_logs ADD CONSTRAINT email_logs_email_type_check 
  CHECK (email_type IN ('notification', 'password_recovery', 'message', 'status_change', 'support', 'verification'));