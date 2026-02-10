/*
  # Fix Remaining Security and Performance Issues

  1. Performance Optimizations
    - Add indexes for all unindexed foreign keys (11 foreign keys)
    - Remove unused index on business_sessions

  2. Security Improvements
    - Fix function search_path mutability for business_login_with_auth

  3. Changes Made
    - Add indexes for foreign keys on:
      - audit_logs.superadmin_id
      - business_notifications.business_id
      - business_notifications.sent_by
      - business_operators.business_id
      - business_payments.business_id
      - business_payments.recorded_by
      - business_settings.business_id
      - businesses.blocked_by
      - media_items.business_id
      - video_pauses.media_item_id
      - video_pauses.overlay_media_item_id
    - Drop unused index on business_sessions
    - Fix business_login_with_auth function security
*/

-- Add indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_audit_logs_superadmin_id 
ON audit_logs(superadmin_id);

CREATE INDEX IF NOT EXISTS idx_business_notifications_business_id 
ON business_notifications(business_id);

CREATE INDEX IF NOT EXISTS idx_business_notifications_sent_by 
ON business_notifications(sent_by);

CREATE INDEX IF NOT EXISTS idx_business_operators_business_id 
ON business_operators(business_id);

CREATE INDEX IF NOT EXISTS idx_business_payments_business_id 
ON business_payments(business_id);

CREATE INDEX IF NOT EXISTS idx_business_payments_recorded_by 
ON business_payments(recorded_by);

CREATE INDEX IF NOT EXISTS idx_business_settings_business_id 
ON business_settings(business_id);

CREATE INDEX IF NOT EXISTS idx_businesses_blocked_by 
ON businesses(blocked_by);

CREATE INDEX IF NOT EXISTS idx_media_items_business_id 
ON media_items(business_id);

CREATE INDEX IF NOT EXISTS idx_video_pauses_media_item_id 
ON video_pauses(media_item_id);

CREATE INDEX IF NOT EXISTS idx_video_pauses_overlay_media_item_id 
ON video_pauses(overlay_media_item_id);

-- Drop unused index
DROP INDEX IF EXISTS idx_business_sessions_business_id;

-- Fix business_login_with_auth function search_path
DROP FUNCTION IF EXISTS public.business_login_with_auth(text, text);

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