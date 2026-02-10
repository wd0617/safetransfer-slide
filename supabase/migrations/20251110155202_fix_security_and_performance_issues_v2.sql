/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes for foreign keys to improve query performance
    - Optimize RLS policies by wrapping auth functions in SELECT statements
    - Fix function search path mutability

  2. Security Improvements
    - Remove redundant and overly permissive public policies
    - Consolidate multiple permissive policies into single, well-defined policies
    - Maintain principle of least privilege

  3. Changes
    - Add indexes on foreign key columns
    - Update all RLS policies to use (select auth.uid()) pattern
    - Remove overly permissive "Public can..." policies
    - Fix function search_path
*/

-- =====================================================
-- PART 1: ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_superadmin_id 
  ON audit_logs(superadmin_id);

CREATE INDEX IF NOT EXISTS idx_business_notifications_sent_by 
  ON business_notifications(sent_by);

CREATE INDEX IF NOT EXISTS idx_business_payments_recorded_by 
  ON business_payments(recorded_by);

CREATE INDEX IF NOT EXISTS idx_businesses_blocked_by 
  ON businesses(blocked_by);

CREATE INDEX IF NOT EXISTS idx_video_pauses_overlay_media_item_id_idx
  ON video_pauses(overlay_media_item_id);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_business_id_v2
  ON exchange_rates(business_id);

-- =====================================================
-- PART 2: FIX RLS POLICIES - OPTIMIZE AUTH FUNCTIONS
-- =====================================================

-- superadmin_users policies
DROP POLICY IF EXISTS "SuperAdmin can view own profile" ON superadmin_users;
CREATE POLICY "SuperAdmin can view own profile"
  ON superadmin_users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "SuperAdmin can update own profile" ON superadmin_users;
CREATE POLICY "SuperAdmin can update own profile"
  ON superadmin_users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow first superadmin registration" ON superadmin_users;
CREATE POLICY "Allow first superadmin registration"
  ON superadmin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM superadmin_users) 
    AND id = (select auth.uid())
  );

-- businesses policies
DROP POLICY IF EXISTS "SuperAdmin can view all businesses" ON businesses;
CREATE POLICY "SuperAdmin can view all businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can insert businesses" ON businesses;
CREATE POLICY "SuperAdmin can insert businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can update businesses" ON businesses;
CREATE POLICY "SuperAdmin can update businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can delete businesses" ON businesses;
CREATE POLICY "SuperAdmin can delete businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own business" ON businesses;
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins 
      WHERE business_admins.business_id = businesses.id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own business" ON businesses;
CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins 
      WHERE business_admins.business_id = businesses.id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

-- business_payments policies
DROP POLICY IF EXISTS "SuperAdmin can view all payments" ON business_payments;
CREATE POLICY "SuperAdmin can view all payments"
  ON business_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can insert payments" ON business_payments;
CREATE POLICY "SuperAdmin can insert payments"
  ON business_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can update payments" ON business_payments;
CREATE POLICY "SuperAdmin can update payments"
  ON business_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can delete payments" ON business_payments;
CREATE POLICY "SuperAdmin can delete payments"
  ON business_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

-- audit_logs policies
DROP POLICY IF EXISTS "SuperAdmin can view all audit logs" ON audit_logs;
CREATE POLICY "SuperAdmin can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can insert audit logs" ON audit_logs;
CREATE POLICY "SuperAdmin can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

-- business_notifications policies
DROP POLICY IF EXISTS "SuperAdmin can view all notifications" ON business_notifications;
CREATE POLICY "SuperAdmin can view all notifications"
  ON business_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can insert notifications" ON business_notifications;
CREATE POLICY "SuperAdmin can insert notifications"
  ON business_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can update notifications" ON business_notifications;
CREATE POLICY "SuperAdmin can update notifications"
  ON business_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

-- business_operators policies
DROP POLICY IF EXISTS "SuperAdmin can view all operators" ON business_operators;
CREATE POLICY "SuperAdmin can view all operators"
  ON business_operators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can insert operators" ON business_operators;
CREATE POLICY "SuperAdmin can insert operators"
  ON business_operators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can update operators" ON business_operators;
CREATE POLICY "SuperAdmin can update operators"
  ON business_operators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can delete operators" ON business_operators;
CREATE POLICY "SuperAdmin can delete operators"
  ON business_operators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

-- business_admins policies
DROP POLICY IF EXISTS "Users can create own admin record" ON business_admins;
CREATE POLICY "Users can create own admin record"
  ON business_admins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "SuperAdmin can view all business admins" ON business_admins;
CREATE POLICY "SuperAdmin can view all business admins"
  ON business_admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can insert business admins" ON business_admins;
CREATE POLICY "SuperAdmin can insert business admins"
  ON business_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can update business admins" ON business_admins;
CREATE POLICY "SuperAdmin can update business admins"
  ON business_admins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own business admin record" ON business_admins;
CREATE POLICY "Users can view own business admin record"
  ON business_admins FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own business admin record" ON business_admins;
CREATE POLICY "Users can update own business admin record"
  ON business_admins FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- exchange_rates policies
DROP POLICY IF EXISTS "Business admins can manage own exchange rates" ON exchange_rates;
CREATE POLICY "Business admins can manage own exchange rates"
  ON exchange_rates
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins 
      WHERE business_admins.business_id = exchange_rates.business_id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

-- media_items policies
DROP POLICY IF EXISTS "Business admins can manage own media items" ON media_items;
CREATE POLICY "Business admins can manage own media items"
  ON media_items
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins 
      WHERE business_admins.business_id = media_items.business_id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

-- announcements policies
DROP POLICY IF EXISTS "Business admins can manage own announcements" ON announcements;
CREATE POLICY "Business admins can manage own announcements"
  ON announcements
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins 
      WHERE business_admins.business_id = announcements.business_id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

-- service_logos policies
DROP POLICY IF EXISTS "Business admins can manage own service logos" ON service_logos;
CREATE POLICY "Business admins can manage own service logos"
  ON service_logos
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins 
      WHERE business_admins.business_id = service_logos.business_id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

-- business_settings policies
DROP POLICY IF EXISTS "Business admins can manage own settings" ON business_settings;
CREATE POLICY "Business admins can manage own settings"
  ON business_settings
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_admins 
      WHERE business_admins.business_id = business_settings.business_id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

-- video_pauses policies
DROP POLICY IF EXISTS "Business admins can view their video pauses" ON video_pauses;
DROP POLICY IF EXISTS "Business admins can insert video pauses" ON video_pauses;
DROP POLICY IF EXISTS "Business admins can update their video pauses" ON video_pauses;
DROP POLICY IF EXISTS "Business admins can delete their video pauses" ON video_pauses;

CREATE POLICY "Business admins can manage video pauses"
  ON video_pauses
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_items 
      JOIN business_admins ON business_admins.business_id = media_items.business_id
      WHERE media_items.id = video_pauses.media_item_id 
      AND business_admins.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PART 3: REMOVE OVERLY PERMISSIVE PUBLIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Public can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Public can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Public can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Public can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Public can update announcements" ON announcements;

DROP POLICY IF EXISTS "Public can view active exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Public can view all exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Public can delete exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Public can insert exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Public can update exchange rates" ON exchange_rates;

DROP POLICY IF EXISTS "Public can view active media items" ON media_items;
DROP POLICY IF EXISTS "Public can view all media items" ON media_items;
DROP POLICY IF EXISTS "Public can delete media items" ON media_items;
DROP POLICY IF EXISTS "Public can insert media items" ON media_items;
DROP POLICY IF EXISTS "Public can update media items" ON media_items;

DROP POLICY IF EXISTS "Public can view active service logos" ON service_logos;
DROP POLICY IF EXISTS "Public can view all service logos" ON service_logos;
DROP POLICY IF EXISTS "Public can delete service logos" ON service_logos;
DROP POLICY IF EXISTS "Public can insert service logos" ON service_logos;
DROP POLICY IF EXISTS "Public can update service logos" ON service_logos;

DROP POLICY IF EXISTS "Public can view business settings" ON business_settings;
DROP POLICY IF EXISTS "Public can delete business settings" ON business_settings;
DROP POLICY IF EXISTS "Public can insert business settings" ON business_settings;
DROP POLICY IF EXISTS "Public can update business settings" ON business_settings;

DROP POLICY IF EXISTS "Public can view active video pauses" ON video_pauses;

-- Create restricted public view policies for display screens
CREATE POLICY "Display screens can view active content"
  ON exchange_rates FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Display screens can view active media"
  ON media_items FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Display screens can view active announcements"
  ON announcements FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Display screens can view active logos"
  ON service_logos FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Display screens can view settings"
  ON business_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Display screens can view active video pauses"
  ON video_pauses FOR SELECT
  TO anon
  USING (is_active = true);

-- =====================================================
-- PART 4: FIX FUNCTION SEARCH PATH
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;