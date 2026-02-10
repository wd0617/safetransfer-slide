/*
  # Fix Function Search Path Issues - Final

  1. Problem
    - Multiple versions of business_login functions exist
    - Some have incorrect search_path settings
    - business_login_with_auth() with no params has mutable search_path

  2. Solution
    - Drop all business_login_with_auth function variants
    - Keep only business_login(p_email, p_password) with secure search_path
    - Ensure all functions use SET search_path = 'public', 'pg_temp'

  3. Changes
    - Drop business_login_with_auth() - no params version
    - Drop business_login_with_auth(text, text) - duplicate version
    - Update business_login to use secure search_path
*/

-- Drop all variants of business_login_with_auth
DROP FUNCTION IF EXISTS public.business_login_with_auth();
DROP FUNCTION IF EXISTS public.business_login_with_auth(text, text);

-- Update business_login to ensure secure search_path
CREATE OR REPLACE FUNCTION public.business_login(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_admin_record RECORD;
  v_business_record RECORD;
  v_session_token TEXT;
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  -- Find admin by email
  SELECT * INTO v_admin_record
  FROM public.business_admins
  WHERE email = p_email AND is_active = true;

  -- Check if admin exists
  IF v_admin_record IS NULL THEN
    RETURN json_build_object('error', 'Credenciales inválidas');
  END IF;

  -- Verify user exists in auth.users (password validation happens in frontend via Supabase Auth)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Usuario no encontrado en el sistema de autenticación');
  END IF;

  -- Get business data
  SELECT * INTO v_business_record
  FROM public.businesses
  WHERE id = v_admin_record.business_id;

  -- Check if business exists
  IF v_business_record IS NULL THEN
    RETURN json_build_object('error', 'Negocio no encontrado');
  END IF;

  -- Check if business is active
  IF v_business_record.status != 'active' THEN
    RETURN json_build_object(
      'error', 'business_inactive',
      'business_id', v_business_record.id,
      'admin_id', v_admin_record.id
    );
  END IF;

  -- Generate session token using UUID
  v_session_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  -- Create session
  INSERT INTO public.business_sessions (
    business_id,
    admin_email,
    session_token,
    expires_at
  ) VALUES (
    v_business_record.id,
    p_email,
    v_session_token,
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_session_id;

  -- Update last login
  UPDATE public.business_admins
  SET last_login_at = NOW()
  WHERE id = v_admin_record.id;

  -- Return success with session data
  RETURN json_build_object(
    'success', true,
    'session_token', v_session_token,
    'business_id', v_business_record.id,
    'business_name', v_business_record.name,
    'admin_email', p_email
  );
END;
$$;