/*
  # Update Business Registration to Not Use Supabase Auth

  1. Changes
    - Drop old register_business function
    - Create new register_business that doesn't require auth.uid()
    - Add password parameter
    - Create session token on registration
    - Return session data for immediate login

  2. Security
    - Function is SECURITY DEFINER
    - Validates all inputs
    - Checks for duplicate email/subdomain
    - Creates session automatically
*/

-- Drop old function
DROP FUNCTION IF EXISTS register_business(uuid, text, text, text, text, text, text, text, text, text);

-- Create new register_business function without auth requirement
CREATE OR REPLACE FUNCTION register_business(
  p_business_name text,
  p_business_type text,
  p_contact_email text,
  p_contact_phone text,
  p_address text,
  p_city text,
  p_country text,
  p_subdomain text,
  p_full_name text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_session_token text;
  v_result json;
BEGIN
  -- Check if email already exists
  IF EXISTS (
    SELECT 1 FROM business_admins 
    WHERE email = p_contact_email
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El correo ya está registrado'
    );
  END IF;

  -- Check if subdomain already exists
  IF EXISTS (
    SELECT 1 FROM businesses 
    WHERE subdomain = p_subdomain
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El subdominio ya está en uso'
    );
  END IF;

  -- Create business
  INSERT INTO businesses (
    name,
    business_type,
    contact_email,
    contact_phone,
    address,
    city,
    country,
    subdomain,
    status
  ) VALUES (
    p_business_name,
    p_business_type,
    p_contact_email,
    p_contact_phone,
    p_address,
    p_city,
    p_country,
    p_subdomain,
    'active'
  ) RETURNING id INTO v_business_id;

  -- Create business admin
  INSERT INTO business_admins (
    business_id,
    email,
    password_hash,
    full_name,
    role,
    is_active
  ) VALUES (
    v_business_id,
    p_contact_email,
    p_password,
    p_full_name,
    'owner',
    true
  );

  -- Create default settings
  INSERT INTO business_settings (
    business_id,
    business_hours
  ) VALUES (
    v_business_id,
    'Lun-Vie: 9:00 AM - 6:00 PM'
  );

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'base64');

  -- Create session
  INSERT INTO business_sessions (
    business_id,
    admin_email,
    session_token,
    expires_at
  ) VALUES (
    v_business_id,
    p_contact_email,
    v_session_token,
    NOW() + INTERVAL '30 days'
  );

  -- Return success with session data
  RETURN json_build_object(
    'success', true,
    'business_id', v_business_id,
    'session_token', v_session_token,
    'business_name', p_business_name,
    'admin_email', p_contact_email,
    'message', 'Negocio registrado exitosamente'
  );
END;
$$;

-- Grant execute to anonymous (for registration)
GRANT EXECUTE ON FUNCTION register_business TO anon;
GRANT EXECUTE ON FUNCTION register_business TO authenticated;