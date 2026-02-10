/*
  # Sistema de Login Completo y Simple
  
  1. Cambios
    - Eliminar dependencia de auth.users
    - Simplificar business_login para no necesitar validación de password
    - Simplificar register_business
    
  2. Enfoque
    - Todo el login se maneja en frontend con bcrypt
    - DB solo crea sesiones, no valida passwords
*/

-- Primero, eliminar la restricción de user_id en business_admins
ALTER TABLE business_admins ALTER COLUMN user_id DROP NOT NULL;

-- Actualizar register_business para no requerir user_id
CREATE OR REPLACE FUNCTION public.register_business(
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
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_business_id uuid;
  v_session_token text;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM business_admins WHERE email = p_contact_email) THEN
    RETURN json_build_object('success', false, 'message', 'El correo ya está registrado');
  END IF;

  -- Check if subdomain already exists
  IF EXISTS (SELECT 1 FROM businesses WHERE subdomain = p_subdomain) THEN
    RETURN json_build_object('success', false, 'message', 'El subdominio ya está en uso');
  END IF;

  -- Create business
  INSERT INTO businesses (
    name, business_type, contact_email, contact_phone,
    address, city, country, subdomain, status
  ) VALUES (
    p_business_name, p_business_type, p_contact_email, p_contact_phone,
    p_address, p_city, p_country, p_subdomain, 'active'
  ) RETURNING id INTO v_business_id;

  -- Create business admin with hashed password (already hashed from frontend)
  INSERT INTO business_admins (
    business_id, email, full_name, role, is_active, password_hash
  ) VALUES (
    v_business_id, p_contact_email, p_full_name, 'owner', true, p_password
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

GRANT EXECUTE ON FUNCTION public.register_business TO anon, authenticated;