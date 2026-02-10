/*
  # Sistema de Verificacion de Email para Registro de Negocios

  1. Nueva Tabla
    - `email_verification_codes`
      - `id` (uuid, primary key)
      - `email` (text) - email a verificar
      - `code` (text) - codigo de 6 digitos
      - `expires_at` (timestamptz) - expira en 15 minutos
      - `verified` (boolean) - si ya fue verificado
      - `created_at` (timestamptz)

  2. Columna en business_admins
    - `email_verified` (boolean) - indica si el email fue verificado

  3. Security
    - RLS habilitado
    - Politicas para permitir verificacion anonima
*/

-- Tabla para codigos de verificacion de email
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON email_verification_codes(code) WHERE verified = false;

ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create verification codes"
  ON email_verification_codes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read valid codes"
  ON email_verification_codes FOR SELECT
  TO anon
  USING (verified = false AND expires_at > now());

CREATE POLICY "Anyone can update codes"
  ON email_verification_codes FOR UPDATE
  TO anon
  USING (verified = false AND expires_at > now())
  WITH CHECK (true);

-- Agregar columna email_verified a business_admins si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_admins' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE business_admins ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
END $$;

-- Funcion para verificar codigo de email
CREATE OR REPLACE FUNCTION verify_email_code(
  p_email text,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verification RECORD;
BEGIN
  -- Buscar codigo valido
  SELECT * INTO v_verification
  FROM email_verification_codes
  WHERE email = lower(p_email)
    AND code = p_code
    AND verified = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_verification IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Codigo invalido, expirado o ya utilizado'
    );
  END IF;

  -- Marcar codigo como verificado
  UPDATE email_verification_codes
  SET verified = true
  WHERE id = v_verification.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email verificado exitosamente'
  );
END;
$$;

-- Template de email para verificacion
INSERT INTO notification_templates (template_key, name, message_template)
VALUES (
  'email_verification_code',
  'Codigo de Verificacion de Email',
  'Tu codigo de verificacion es: {{code}}

Este codigo expira en 15 minutos.

Si no creaste esta cuenta, ignora este mensaje.'
)
ON CONFLICT (template_key) DO UPDATE
SET message_template = EXCLUDED.message_template;
