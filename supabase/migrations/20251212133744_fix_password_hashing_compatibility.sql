/*
  # Fix Password Hashing Compatibility
  
  1. Changes
    - Update register_business to hash password internally
    - Create update_password function for password recovery
    - Ensure all password hashing uses pgcrypto for consistency
    
  2. Security
    - All password hashing done server-side
    - Uses bcrypt via pgcrypto extension
*/

-- Update register_business to hash password internally
CREATE OR REPLACE FUNCTION public.register_business(
  p_business_name TEXT,
  p_business_type TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_country TEXT,
  p_subdomain TEXT,
  p_full_name TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_business_id uuid;
  v_session_token text;
  v_password_hash text;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM business_admins WHERE email = p_contact_email) THEN
    RETURN json_build_object('success', false, 'message', 'El correo ya está registrado');
  END IF;

  -- Check if subdomain already exists
  IF EXISTS (SELECT 1 FROM businesses WHERE subdomain = p_subdomain) THEN
    RETURN json_build_object('success', false, 'message', 'El subdominio ya está en uso');
  END IF;

  -- Hash password using pgcrypto (server-side)
  v_password_hash := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- Create business
  INSERT INTO businesses (
    name, business_type, contact_email, contact_phone,
    address, city, country, subdomain, status
  ) VALUES (
    p_business_name, p_business_type, p_contact_email, p_contact_phone,
    p_address, p_city, p_country, p_subdomain, 'active'
  ) RETURNING id INTO v_business_id;

  -- Create business admin with hashed password
  INSERT INTO business_admins (
    business_id, email, full_name, role, is_active, password_hash
  ) VALUES (
    v_business_id, p_contact_email, p_full_name, 'owner', true, v_password_hash
  );

  -- Create default settings
  INSERT INTO business_settings (business_id, business_hours)
  VALUES (v_business_id, 'Lun-Vie: 9:00 AM - 6:00 PM');

  -- Generate session token
  v_session_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  -- Create session
  INSERT INTO business_sessions (business_id, admin_email, session_token, expires_at)
  VALUES (v_business_id, p_contact_email, v_session_token, NOW() + INTERVAL '30 days');

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

-- Create function to update password (for recovery)
CREATE OR REPLACE FUNCTION public.update_admin_password(
  p_email TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_password_hash text;
BEGIN
  -- Hash the new password
  v_password_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));
  
  -- Update the password
  UPDATE business_admins
  SET password_hash = v_password_hash,
      updated_at = NOW()
  WHERE email = p_email;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_password(TEXT, TEXT) TO anon, authenticated;