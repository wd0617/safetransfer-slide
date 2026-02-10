/*
  # Recreate Business Login Function

  1. Changes
    - Drop old function
    - Create new business_login function with JSON return type
    - Validates business admin credentials
    - Creates session token
    - Returns session data or error

  2. Security
    - Function is SECURITY DEFINER
    - Validates all inputs
    - Only returns necessary data
*/

-- Drop old function if exists
DROP FUNCTION IF EXISTS business_login(TEXT, TEXT);

-- Create business login function
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
BEGIN
  -- Find admin by email
  SELECT * INTO v_admin_record
  FROM business_admins
  WHERE email = p_email AND is_active = true;

  -- Check if admin exists
  IF v_admin_record IS NULL THEN
    RETURN json_build_object('error', 'Credenciales inválidas');
  END IF;

  -- Verify password (stored in plain text as per current schema)
  IF v_admin_record.password_hash != p_password THEN
    RETURN json_build_object('error', 'Credenciales inválidas');
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
    'business_name', v_business_record.business_name,
    'admin_email', p_email
  );
END;
$$;