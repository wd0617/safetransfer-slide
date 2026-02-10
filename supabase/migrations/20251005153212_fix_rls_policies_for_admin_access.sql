/*
  # Fix RLS Policies for Admin Access

  1. Changes
    - Drop existing restrictive policies
    - Add policies that allow:
      - Public (anon) users to view ONLY active records on display screen
      - Public (anon) users FULL access for admin operations (since we don't have auth yet)
    
  2. Security Notes
    - Display screen filters by is_active = true in the query
    - Admin panel needs to see ALL records (active and inactive)
    - Admin panel needs INSERT, UPDATE, DELETE permissions
*/

-- Exchange Rates Policies
DROP POLICY IF EXISTS "Anyone can view active exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Service role can manage exchange rates" ON exchange_rates;

CREATE POLICY "Public can view all exchange rates"
  ON exchange_rates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert exchange rates"
  ON exchange_rates FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update exchange rates"
  ON exchange_rates FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete exchange rates"
  ON exchange_rates FOR DELETE
  TO public
  USING (true);

-- Media Items Policies
DROP POLICY IF EXISTS "Anyone can view active media items" ON media_items;
DROP POLICY IF EXISTS "Service role can manage media items" ON media_items;

CREATE POLICY "Public can view all media items"
  ON media_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert media items"
  ON media_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update media items"
  ON media_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete media items"
  ON media_items FOR DELETE
  TO public
  USING (true);

-- Announcements Policies
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Service role can manage announcements" ON announcements;

CREATE POLICY "Public can view all announcements"
  ON announcements FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert announcements"
  ON announcements FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update announcements"
  ON announcements FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete announcements"
  ON announcements FOR DELETE
  TO public
  USING (true);

-- Business Settings Policies
DROP POLICY IF EXISTS "Anyone can view business settings" ON business_settings;
DROP POLICY IF EXISTS "Service role can manage business settings" ON business_settings;

CREATE POLICY "Public can view business settings"
  ON business_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert business settings"
  ON business_settings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update business settings"
  ON business_settings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete business settings"
  ON business_settings FOR DELETE
  TO public
  USING (true);

-- Service Logos Policies
DROP POLICY IF EXISTS "Public can view service logos" ON service_logos;
DROP POLICY IF EXISTS "Public can manage service logos" ON service_logos;

CREATE POLICY "Public can view all service logos"
  ON service_logos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert service logos"
  ON service_logos FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update service logos"
  ON service_logos FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete service logos"
  ON service_logos FOR DELETE
  TO public
  USING (true);
