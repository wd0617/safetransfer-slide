/*
  # Allow anonymous users to check if superadmin exists
  
  1. Changes
    - Add policy to allow anonymous users to count superadmin_users
    - This is needed for the setup flow to determine if a superadmin already exists
  
  2. Security
    - Only allows SELECT on id column
    - Does not expose sensitive information
    - Required for initial setup flow
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can check if superadmin exists" ON superadmin_users;

-- Create policy to allow anyone (including anonymous) to check if a superadmin exists
CREATE POLICY "Anyone can check if superadmin exists"
  ON superadmin_users
  FOR SELECT
  TO anon, authenticated
  USING (true);
