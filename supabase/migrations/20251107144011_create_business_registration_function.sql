/*
  # Create Business Registration Function

  ## Purpose
  Creates a database function that handles the entire business registration process
  atomically, bypassing RLS issues by using SECURITY DEFINER.

  ## What it does
  1. Creates a business record
  2. Creates a business_admin record linking the user to the business
  3. Creates default business_settings
  4. Returns the created business data

  ## Security
  - Function runs with elevated privileges (SECURITY DEFINER)
  - Validates that the user is authenticated
  - Ensures user doesn't already have a business
  - All operations are atomic (transaction)
*/

-- Create function to register a new business
CREATE OR REPLACE FUNCTION register_business(
  p_user_id uuid,
  p_business_name text,
  p_business_type text,
  p_contact_email text,
  p_contact_phone text,
  p_address text,
  p_city text,
  p_country text,
  p_subdomain text,
  p_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_result json;
BEGIN
  -- Verify user is authenticated
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Check if user already has a business
  IF EXISTS (
    SELECT 1 FROM business_admins 
    WHERE user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Este usuario ya tiene un negocio registrado';
  END IF;

  -- Check if subdomain already exists
  IF EXISTS (
    SELECT 1 FROM businesses 
    WHERE subdomain = p_subdomain
  ) THEN
    RAISE EXCEPTION 'El subdominio ya está en uso';
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
    user_id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    v_business_id,
    p_user_id,
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

  -- Return success with business data
  SELECT json_build_object(
    'success', true,
    'business_id', v_business_id,
    'message', 'Negocio registrado exitosamente'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION register_business TO authenticated;
