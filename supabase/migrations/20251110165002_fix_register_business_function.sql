/*
  # Fix Register Business Function

  1. Changes
    - Drop old register_business function
    - Create new version that uses Supabase Auth
    - Remove password_hash reference (doesn't exist in table)
    - Use gen_random_uuid for session tokens
    - User must be created in Supabase Auth first

  2. Security
    - Function validates business data
    - Creates proper sessions
*/

-- Drop old function
DROP FUNCTION IF EXISTS register_business(text, text, text, text, text, text, text, text, text, text);

-- Create new register_business function that works with Supabase Auth
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
  v_user_id uuid;
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

  -- Verify user exists in auth.users (must be created via Supabase Auth first)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_contact_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuario no encontrado. Debe crear cuenta primero.'
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

  -- Create business admin (no password_hash column)
  INSERT INTO business_admins (
    business_id,
    user_id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    v_business_id,
    v_user_id,
    p_contact_email,
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

  -- Generate session token using UUID
  v_session_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_business TO anon;
GRANT EXECUTE ON FUNCTION register_business TO authenticated;