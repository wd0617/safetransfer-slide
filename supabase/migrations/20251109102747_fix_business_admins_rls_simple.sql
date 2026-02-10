/*
  # Simplify RLS Policies for business_admins
  
  ## Changes
  - Remove complex recursive policies
  - Allow users to read their own business_admins record
  - Allow authenticated users to check if they are admins
  
  ## Security
  - Users can only see their own admin records
  - SuperAdmins can see all records
*/

-- Drop all existing policies on business_admins
DROP POLICY IF EXISTS "Users can view own admin record" ON business_admins;
DROP POLICY IF EXISTS "Users can update own admin record" ON business_admins;
DROP POLICY IF EXISTS "System can insert business admins" ON business_admins;

-- Simple policy: Users can view their own business_admins record
CREATE POLICY "Users can view own business admin record"
  ON business_admins FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    -- SuperAdmin can view all
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Allow business registration function to insert
CREATE POLICY "Service role can insert business admins"
  ON business_admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own record (for last_login_at)
CREATE POLICY "Users can update own business admin record"
  ON business_admins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());