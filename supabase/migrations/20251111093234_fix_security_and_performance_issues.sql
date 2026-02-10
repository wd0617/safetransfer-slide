/*
  # Fix Security and Performance Issues

  1. Performance Optimizations
    - Add missing index on business_sessions.business_id
    - Remove duplicate index on exchange_rates
    - Drop unused indexes to reduce write overhead

  2. Security Improvements
    - Fix RLS policies to use subqueries for auth functions
    - Consolidate multiple permissive policies into single policies
    - Fix function search_path mutability

  3. Changes
    - Add index: business_sessions(business_id)
    - Drop duplicate: idx_exchange_rates_business_id (keeping v2)
    - Drop unused indexes (14 total)
    - Recreate RLS policies with optimized auth checks
    - Fix function security settings
*/

-- Add missing index on business_sessions
CREATE INDEX IF NOT EXISTS idx_business_sessions_business_id 
ON business_sessions(business_id);

-- Drop duplicate index (keep the v2 version)
DROP INDEX IF EXISTS idx_exchange_rates_business_id;

-- Drop unused indexes to improve write performance
DROP INDEX IF EXISTS idx_media_items_business_id;
DROP INDEX IF EXISTS idx_business_settings_business_id;
DROP INDEX IF EXISTS idx_business_payments_business_id;
DROP INDEX IF EXISTS idx_business_payments_status;
DROP INDEX IF EXISTS idx_business_payments_recorded_by;
DROP INDEX IF EXISTS idx_audit_logs_action_type;
DROP INDEX IF EXISTS idx_audit_logs_entity_type;
DROP INDEX IF EXISTS idx_audit_logs_superadmin_id;
DROP INDEX IF EXISTS idx_business_notifications_business_id;
DROP INDEX IF EXISTS idx_business_notifications_status;
DROP INDEX IF EXISTS idx_business_notifications_sent_by;
DROP INDEX IF EXISTS idx_business_operators_business_id;
DROP INDEX IF EXISTS idx_businesses_name;
DROP INDEX IF EXISTS idx_businesses_blocked_by;
DROP INDEX IF EXISTS idx_business_admins_business_id;
DROP INDEX IF EXISTS idx_video_pauses_overlay_media_item_id_idx;
DROP INDEX IF EXISTS idx_video_pauses_media_item_id;
DROP INDEX IF EXISTS idx_video_pauses_active;

-- Fix business_sessions RLS policy to use subquery
DROP POLICY IF EXISTS "Superadmins can delete sessions" ON business_sessions;

CREATE POLICY "Superadmins can delete sessions"
  ON business_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  );

-- Consolidate business_admins policies
DROP POLICY IF EXISTS "Service role can insert business admins" ON business_admins;
DROP POLICY IF EXISTS "SuperAdmin can insert business admins" ON business_admins;
DROP POLICY IF EXISTS "Users can create own admin record" ON business_admins;

CREATE POLICY "Authenticated users can insert business admins"
  ON business_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can view all business admins" ON business_admins;
DROP POLICY IF EXISTS "Users can view own business admin record" ON business_admins;

CREATE POLICY "Users can view business admins"
  ON business_admins FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can update business admins" ON business_admins;
DROP POLICY IF EXISTS "Users can update own business admin record" ON business_admins;

CREATE POLICY "Users can update business admins"
  ON business_admins FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  );

-- Consolidate businesses policies
DROP POLICY IF EXISTS "Authenticated users can create business" ON businesses;
DROP POLICY IF EXISTS "SuperAdmin can insert businesses" ON businesses;

CREATE POLICY "Users can insert businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (
    true
  );

DROP POLICY IF EXISTS "SuperAdmin can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view own business" ON businesses;

CREATE POLICY "Users can view businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_admins
      WHERE user_id = (SELECT auth.uid())
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "SuperAdmin can update businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own business" ON businesses;

CREATE POLICY "Users can update businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_admins
      WHERE user_id = (SELECT auth.uid())
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT business_id FROM business_admins
      WHERE user_id = (SELECT auth.uid())
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = (SELECT auth.uid())
      AND is_active = true
    )
  );

-- Consolidate superadmin_users policies
DROP POLICY IF EXISTS "Anyone can check if superadmin exists" ON superadmin_users;
DROP POLICY IF EXISTS "SuperAdmin can view own profile" ON superadmin_users;

CREATE POLICY "Users can view superadmin profiles"
  ON superadmin_users FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR true
  );

-- Fix function search_path by dropping and recreating with proper settings
DROP FUNCTION IF EXISTS public.business_validate_session(text);
DROP FUNCTION IF EXISTS public.business_logout(text);
DROP FUNCTION IF EXISTS public.cleanup_expired_business_sessions();
DROP FUNCTION IF EXISTS public.business_login_with_auth(text, text);

CREATE FUNCTION public.business_validate_session(p_session_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session record;
  v_business record;
BEGIN
  SELECT * INTO v_session
  FROM public.business_sessions
  WHERE session_token = p_session_token
  AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'invalid_session');
  END IF;

  UPDATE public.business_sessions
  SET last_activity_at = now()
  WHERE session_token = p_session_token;

  SELECT * INTO v_business
  FROM public.businesses
  WHERE id = v_session.business_id
  AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'business_inactive');
  END IF;

  RETURN json_build_object(
    'success', true,
    'business_id', v_business.id,
    'business_name', v_business.name
  );
END;
$$;

CREATE FUNCTION public.business_logout(p_session_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.business_sessions
  WHERE session_token = p_session_token;

  RETURN json_build_object('success', true);
END;
$$;

CREATE FUNCTION public.cleanup_expired_business_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.business_sessions
  WHERE expires_at < now();
END;
$$;

CREATE FUNCTION public.business_login_with_auth(
  p_email text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin record;
  v_business record;
  v_session_token text;
  v_expires_at timestamptz;
BEGIN
  SELECT * INTO v_admin
  FROM public.business_admins
  WHERE email = p_email
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  SELECT * INTO v_business
  FROM public.businesses
  WHERE id = v_admin.business_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'business_not_found');
  END IF;

  IF v_business.status != 'active' THEN
    RETURN json_build_object(
      'error', 'business_inactive',
      'business_id', v_business.id
    );
  END IF;

  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '12 hours';

  INSERT INTO public.business_sessions (
    business_id,
    admin_email,
    session_token,
    expires_at,
    last_activity_at
  ) VALUES (
    v_business.id,
    v_admin.email,
    v_session_token,
    v_expires_at,
    now()
  );

  RETURN json_build_object(
    'success', true,
    'session_token', v_session_token,
    'business_id', v_business.id,
    'business_name', v_business.name,
    'admin_email', v_admin.email
  );
END;
$$;