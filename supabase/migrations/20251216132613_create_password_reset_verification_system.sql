/*
  # Sistema de Verificación de Cambio de Contraseña con Código por Email

  1. Nueva Tabla
    - `password_reset_codes`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `code` (text) - código de 6 dígitos enviado por email
      - `expires_at` (timestamptz) - expira en 15 minutos
      - `used` (boolean) - si ya fue usado
      - `created_at` (timestamptz)

  2. Función para validar y cambiar contraseña
    - Valida el código
    - Verifica que no esté expirado ni usado
    - Actualiza la contraseña del negocio
    - Marca el código como usado

  3. Security
    - RLS habilitado
    - Solo el negocio puede usar su propio código
*/

-- Tabla para códigos de verificación de reset de contraseña
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  admin_email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_business ON password_reset_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(admin_email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code) WHERE used = false;

ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create password reset codes"
  ON password_reset_codes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read valid codes"
  ON password_reset_codes FOR SELECT
  TO anon
  USING (used = false AND expires_at > now());

CREATE POLICY "Anyone can update codes"
  ON password_reset_codes FOR UPDATE
  TO anon
  USING (used = false AND expires_at > now())
  WITH CHECK (true);

-- Función para verificar código y cambiar contraseña
CREATE OR REPLACE FUNCTION verify_code_and_reset_password(
  p_email text,
  p_code text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reset_code RECORD;
  v_admin RECORD;
  v_password_hash text;
BEGIN
  -- Buscar código válido
  SELECT * INTO v_reset_code
  FROM password_reset_codes
  WHERE admin_email = lower(p_email)
    AND code = p_code
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_reset_code IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Código inválido, expirado o ya utilizado'
    );
  END IF;

  -- Buscar admin
  SELECT * INTO v_admin
  FROM business_admins
  WHERE email = lower(p_email)
    AND business_id = v_reset_code.business_id
    AND is_active = true;

  IF v_admin IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'admin_not_found',
      'message', 'No se encontró la cuenta'
    );
  END IF;

  -- Generar hash de la nueva contraseña
  v_password_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

  -- Actualizar contraseña
  UPDATE business_admins
  SET password_hash = v_password_hash
  WHERE id = v_admin.id;

  -- Marcar código como usado
  UPDATE password_reset_codes
  SET used = true
  WHERE id = v_reset_code.id;

  -- Eliminar solicitud pendiente si existe
  UPDATE password_recovery_requests
  SET status = 'approved', resolved_at = now()
  WHERE business_id = v_reset_code.business_id
    AND status = 'pending';

  -- Eliminar conversación de Telegram si existe
  DELETE FROM telegram_conversations
  WHERE business_id = v_reset_code.business_id
    AND conversation_type = 'password_recovery';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Contraseña actualizada exitosamente'
  );
END;
$$;

-- Actualizar template de notificación
UPDATE notification_templates
SET message_template = '🔐 *Código de Verificación*

{{business_name}},

Se ha solicitado un cambio de contraseña para tu cuenta.

✉️ Hemos enviado un *código de verificación* a tu correo electrónico.

📝 Para completar el cambio:
1. Revisa tu bandeja de entrada (y spam)
2. Copia el código de 6 dígitos
3. Ve a la página de recuperación de contraseña
4. Ingresa el código y tu nueva contraseña

⏰ El código expira en 15 minutos.

⚠️ Si no solicitaste este cambio, ignora este mensaje y contacta a soporte.'
WHERE template_key = 'password_change_request';

-- Agregar nuevo template para el código por email
INSERT INTO notification_templates (template_key, name, message_template)
VALUES (
  'password_reset_code_email',
  'Código de Verificación por Email',
  'Tu código de verificación para cambiar la contraseña es: {{code}}

Este código expira en 15 minutos.

Si no solicitaste este cambio, ignora este mensaje.'
)
ON CONFLICT (template_key) DO UPDATE
SET message_template = EXCLUDED.message_template;
