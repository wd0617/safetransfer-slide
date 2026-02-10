/*
  # Fix RLS Policy for businesses table

  ## Problem
  The INSERT policy for businesses is blocking user registration.

  ## Solution
  Create a simple policy that allows any authenticated user to create a business.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can register a business" ON businesses;
DROP POLICY IF EXISTS "Business admins can view own business" ON businesses;
DROP POLICY IF EXISTS "Business admins can update own business" ON businesses;

-- Allow any authenticated user to create a business
CREATE POLICY "Authenticated users can create business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can view businesses where they are admin
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid()
    )
    OR
    -- SuperAdmin can view all
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Users can update businesses where they are admin
CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid()
    )
  );
