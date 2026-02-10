/*
  # Fix service logos RLS and make name optional
  
  1. Problem
    - RLS policies only allow authenticated users with auth.uid()
    - Our login system uses custom sessions, not Supabase auth
    - Name field is required but user wants it optional
    
  2. Solution
    - Add RLS policy for anon users with valid business session
    - Make name column nullable with empty string default
    
  3. Changes
    - Add INSERT/UPDATE/DELETE policies for anon role
    - ALTER name column to allow NULL
*/

-- Make name column nullable with default empty string
ALTER TABLE service_logos ALTER COLUMN name DROP NOT NULL;
ALTER TABLE service_logos ALTER COLUMN name SET DEFAULT '';

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Business admins can manage own service logos" ON service_logos;

-- Create policies for anon users with valid business session
CREATE POLICY "Anon can select service logos with session"
  ON service_logos
  FOR SELECT
  TO anon
  USING (
    is_active = TRUE
    OR EXISTS (
      SELECT 1 FROM business_sessions bs
      WHERE bs.business_id = service_logos.business_id
      AND bs.expires_at > NOW()
    )
  );

CREATE POLICY "Anon can insert service logos with session"
  ON service_logos
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_sessions bs
      WHERE bs.business_id = service_logos.business_id
      AND bs.expires_at > NOW()
    )
  );

CREATE POLICY "Anon can update service logos with session"
  ON service_logos
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM business_sessions bs
      WHERE bs.business_id = service_logos.business_id
      AND bs.expires_at > NOW()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_sessions bs
      WHERE bs.business_id = service_logos.business_id
      AND bs.expires_at > NOW()
    )
  );

CREATE POLICY "Anon can delete service logos with session"
  ON service_logos
  FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM business_sessions bs
      WHERE bs.business_id = service_logos.business_id
      AND bs.expires_at > NOW()
    )
  );

-- Keep authenticated policy for backwards compatibility
CREATE POLICY "Authenticated can manage service logos"
  ON service_logos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins
      WHERE business_admins.business_id = service_logos.business_id
      AND business_admins.user_id = auth.uid()
    )
  );
