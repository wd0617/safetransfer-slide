/*
  # Fix RLS Recursion in business_admins

  ## Problem
  The RLS policies for business_admins are causing infinite recursion because they query
  the same table they're protecting.

  ## Solution
  Simplify the policies to avoid recursive queries:
  - Allow users to insert their own admin record (user_id = auth.uid())
  - Allow users to view their own admin records
  - Allow updates to own records
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow creating first business admin" ON business_admins;
DROP POLICY IF EXISTS "Business admins can view own business admins" ON business_admins;
DROP POLICY IF EXISTS "Business admins can update own profile" ON business_admins;

-- Create simple, non-recursive policies

-- Users can insert themselves as admin
CREATE POLICY "Users can create own admin record"
  ON business_admins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own admin record
CREATE POLICY "Users can view own admin record"
  ON business_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own admin record
CREATE POLICY "Users can update own admin record"
  ON business_admins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- SuperAdmin can view all business admins
CREATE POLICY "SuperAdmin can view all business admins"
  ON business_admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- SuperAdmin can manage all business admins
CREATE POLICY "SuperAdmin can insert business admins"
  ON business_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "SuperAdmin can update business admins"
  ON business_admins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );
