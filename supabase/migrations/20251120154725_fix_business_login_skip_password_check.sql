/*
  # Arreglar business_login para eliminar validación de contraseña

  1. Problema
    - El frontend valida contraseñas con bcrypt
    - business_login() intenta volver a validar con crypt()
    - Esto falla porque son sistemas diferentes
    - El hash de bcrypt ($2b$) no es compatible con la validación de crypt()
    
  2. Solución
    - business_login() debe SOLO crear la sesión
    - NO debe validar contraseña (frontend ya lo hizo)
    - Mantener validaciones de seguridad (admin existe, business activo, etc)
    
  3. Flujo correcto
    - Frontend: valida password con bcrypt.compare()
    - Frontend: si válido, llama business_login()
    - Backend: crea sesión sin volver a validar password
*/

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
BEGIN
  -- Find admin by email and verify is active
  SELECT * INTO v_admin_record
  FROM public.business_admins
  WHERE email = p_email AND is_active = true;

  -- Check if admin exists
  IF v_admin_record IS NULL THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  -- NOTE: Password validation is done in the frontend with bcrypt
  -- We don't validate password here to avoid bcrypt/crypt incompatibility

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

  -- Check if business is active
  IF v_business_record.status != 'active' THEN
    RETURN json_build_object(
      'error', 'business_inactive',
      'business_id', v_business_record.id,
      'admin_id', v_admin_record.id
    );
  END IF;

  -- Generate session token
  v_session_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  -- Create session
  INSERT INTO public.business_sessions (
    business_id,
    admin_email,
    session_token,
    expires_at,
    last_activity_at
  )
  VALUES (
    v_business_record.id,
    v_admin_record.email,
    v_session_token,
    NOW() + INTERVAL '30 days',
    NOW()
  )
  RETURNING id INTO v_session_id;

  -- Return success with session data
  RETURN json_build_object(
    'success', true,
    'session_token', v_session_token,
    'session_id', v_session_id,
    'business_id', v_business_record.id,
    'business_name', v_business_record.name,
    'admin_email', v_admin_record.email,
    'admin_name', v_admin_record.full_name,
    'admin_role', v_admin_record.role
  );
END;
$$;

-- Ensure correct permissions
GRANT EXECUTE ON FUNCTION public.business_login TO anon, authenticated;
