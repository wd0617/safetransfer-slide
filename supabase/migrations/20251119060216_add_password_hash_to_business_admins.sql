/*
  # Add password_hash column to business_admins

  1. Problem
    - The business_admins table is missing the password_hash column
    - This column is needed to store hashed passwords for business admin authentication
    - Password recovery system requires this column

  2. Changes
    - Add password_hash column to business_admins table (nullable initially)
    - This allows existing records to remain valid
    - New password hashes will be set during password recovery

  3. Security
    - Column stores bcrypt hashed passwords
    - Never stores plain text passwords
    - Compatible with both SQL and client-side bcrypt validation
*/

-- Add password_hash column to business_admins table
ALTER TABLE public.business_admins 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.business_admins.password_hash IS 'Bcrypt hashed password for business admin authentication';
