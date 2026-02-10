/*
  # Fix pgcrypto Extension Usage

  1. Problem
    - pgcrypto is installed in 'extensions' schema but functions try to use it from 'public'
    - This causes "function gen_salt(unknown) does not exist" errors

  2. Solution
    - Update all functions to use extensions.crypt and extensions.gen_salt
    - Fix hash_password function
    - Fix business_login function

  3. Security
    - Maintains SECURITY DEFINER
    - Uses secure search_path
*/

-- Fix hash_password function to use extensions schema
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions', 'pg_temp'
AS $$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$$;

-- Fix business_login function to use extensions schema
CREATE OR REPLACE FUNCTION public.business_login(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_admin_record RECORD;
  v_business_record RECORD;
  v_session_token TEXT;
  v_session_id UUID;
BEGIN
  SELECT * INTO v_admin_record
  FROM public.business_admins
  WHERE email = p_email AND is_active = true;

  IF v_admin_record IS NULL THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  IF v_admin_record.password_hash IS NULL THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  IF NOT (v_admin_record.password_hash = extensions.crypt(p_password, v_admin_record.password_hash)) THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  SELECT * INTO v_business_record
  FROM public.businesses
  WHERE id = v_admin_record.business_id;

  IF v_business_record IS NULL THEN
    RETURN json_build_object('error', 'business_not_found');
  END IF;

  IF v_business_record.status = 'blocked' THEN
    RETURN json_build_object(
      'error', 'business_blocked',
      'business_id', v_business_record.id,
      'admin_id', v_admin_record.id
    );
  END IF;

  IF v_business_record.status != 'active' THEN
    RETURN json_build_object(
      'error', 'business_inactive',
      'business_id', v_business_record.id,
      'admin_id', v_admin_record.id
    );
  END IF;

  v_session_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

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

  UPDATE public.business_admins
  SET last_login_at = NOW()
  WHERE id = v_admin_record.id;

  RETURN json_build_object(
    'success', true,
    'session_token', v_session_token,
    'business_id', v_business_record.id,
    'business_name', v_business_record.name,
    'admin_email', p_email
  );
END;
$$;
