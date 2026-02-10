/*
  # Fix Business Login Schema Path for crypt function
  
  1. Problem
    - crypt() function exists but not accessible due to search_path
    - Need to include extensions schema in search path
    
  2. Solution
    - Update search_path to include extensions schema
    - This allows access to pgcrypto functions
*/

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
  v_password_valid BOOLEAN;
BEGIN
  -- Find admin by email
  SELECT * INTO v_admin_record
  FROM public.business_admins
  WHERE email = p_email AND is_active = true;

  -- Check if admin exists
  IF v_admin_record IS NULL THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  -- Verify password exists
  IF v_admin_record.password_hash IS NULL THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  -- Validate bcrypt password using crypt
  -- crypt(plaintext, hash) will return the same hash if password is correct
  v_password_valid := (extensions.crypt(p_password, v_admin_record.password_hash) = v_admin_record.password_hash);

  IF NOT v_password_valid THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  -- Get business data
  SELECT * INTO v_business_record
  FROM public.businesses
  WHERE id = v_admin_record.business_id;

  -- Check if business exists
  IF v_business_record IS NULL THEN
    RETURN json_build_object('error', 'business_not_found');
  END IF;

  -- Check if business is blocked
  IF v_business_record.status = 'blocked' THEN
    RETURN json_build_object(
      'error', 'business_blocked',
      'business_id', v_business_record.id,
      'admin_id', v_admin_record.id
    );
  END IF;

  -- Check if business is inactive
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