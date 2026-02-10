/*
  # Fix Password Recovery Hashing

  1. Problem
    - PasswordRecovery component uses bcrypt.hash() to hash passwords
    - business_login function uses crypt() from pgcrypto extension
    - These are incompatible - bcrypt creates $2a$/$2b$ format hashes
    - crypt() expects blowfish format hashes compatible with bf algorithm
    
  2. Solution
    - Create a function to hash passwords using crypt() with blowfish algorithm
    - This ensures compatibility with the business_login validation
    - Use gen_salt('bf') to generate proper blowfish salts
    
  3. Security
    - Uses pgcrypto's crypt() with blowfish algorithm
    - Same hashing method as login validation
    - SECURITY DEFINER with secure search_path
*/

-- Create function to hash passwords using crypt (compatible with business_login)
CREATE OR REPLACE FUNCTION public.hash_password_for_business(p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Hash password using crypt with blowfish algorithm
  -- This is compatible with the business_login validation
  RETURN crypt(p_password, gen_salt('bf'));
END;
$$;

-- Grant execute to anon (needed for password recovery from frontend)
GRANT EXECUTE ON FUNCTION public.hash_password_for_business TO anon;
GRANT EXECUTE ON FUNCTION public.hash_password_for_business TO authenticated;