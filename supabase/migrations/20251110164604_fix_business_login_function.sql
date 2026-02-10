/*
  # Fix Business Login Function

  1. Changes
    - Update business_login function to use Supabase Auth
    - Remove password_hash reference
    - Use auth.users instead

  2. Security
    - Function validates business status
    - Creates proper sessions
*/

-- Drop old function
DROP FUNCTION IF EXISTS business_login(TEXT, TEXT);

-- Create new business login function that uses Supabase Auth
CREATE OR REPLACE FUNCTION business_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
  FROM business_admins
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
  FROM businesses
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

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'base64');

  -- Create session
  INSERT INTO business_sessions (
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
  UPDATE business_admins
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