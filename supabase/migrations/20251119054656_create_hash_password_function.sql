/*
  # Create hash_password helper function

  1. Purpose
    - Provides a secure way to hash passwords using pgcrypto
    - Used by SuperAdmin to set passwords for password recovery

  2. Security
    - SECURITY DEFINER allows access to crypt function
    - Secure search_path prevents SQL injection
*/

CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;
