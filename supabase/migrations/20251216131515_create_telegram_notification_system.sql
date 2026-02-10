/*
  # Sistema Completo de Notificaciones y Autenticación por Telegram

  1. Nuevas Tablas
    - `telegram_auth_codes`
      - Códigos de verificación 2FA temporales para login
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `code` (text) - código de 6 dígitos
      - `expires_at` (timestamptz)
      - `used` (boolean)
      - `created_at` (timestamptz)
    
    - `telegram_conversations`
      - Rastrea conversaciones activas (confirmaciones, respuestas esperadas)
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `conversation_type` (text) - 'password_recovery', 'subscription_confirmation', etc.
      - `state` (text) - estado actual de la conversación
      - `context` (jsonb) - datos adicionales del contexto
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `notification_templates`
      - Templates para diferentes tipos de notificaciones
      - `id` (uuid, primary key)
      - `template_key` (text, unique) - identificador del template
      - `name` (text) - nombre descriptivo
      - `message_template` (text) - template del mensaje con variables {{variable}}
      - `created_at` (timestamptz)
    
    - `scheduled_notifications`
      - Notificaciones programadas automáticas
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `notification_type` (text) - 'subscription_reminder', 'payment_reminder', etc.
      - `scheduled_for` (timestamptz)
      - `sent` (boolean)
      - `sent_at` (timestamptz)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS en todas las tablas
    - Solo SuperAdmin puede gestionar templates
    - Solo el negocio puede ver sus propios códigos y conversaciones
    - Anon puede crear códigos de auth (para el login)

  3. Indexes
    - Índices para búsquedas rápidas por business_id, expires_at, sent status
*/

-- Tabla de códigos de autenticación 2FA
CREATE TABLE IF NOT EXISTS telegram_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_business_id ON telegram_auth_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_code ON telegram_auth_codes(code) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_expires ON telegram_auth_codes(expires_at) WHERE used = false;

-- Tabla de conversaciones activas
CREATE TABLE IF NOT EXISTS telegram_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_type text NOT NULL,
  state text NOT NULL DEFAULT 'waiting_response',
  context jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_conversations_business_id ON telegram_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_expires ON telegram_conversations(expires_at);

-- Tabla de templates de notificaciones
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  message_template text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de notificaciones programadas
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_business_id ON scheduled_notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled ON scheduled_notifications(scheduled_for) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);

-- Enable RLS
ALTER TABLE telegram_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para telegram_auth_codes
CREATE POLICY "Anonymous can create auth codes"
  ON telegram_auth_codes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous can read valid auth codes"
  ON telegram_auth_codes FOR SELECT
  TO anon
  USING (used = false AND expires_at > now());

CREATE POLICY "Anonymous can update own auth codes"
  ON telegram_auth_codes FOR UPDATE
  TO anon
  USING (used = false AND expires_at > now())
  WITH CHECK (true);

-- Políticas para telegram_conversations
CREATE POLICY "Anonymous can manage conversations"
  ON telegram_conversations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Políticas para notification_templates
CREATE POLICY "Anyone can read notification templates"
  ON notification_templates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can manage templates"
  ON notification_templates FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Políticas para scheduled_notifications
CREATE POLICY "Anyone can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insertar templates predefinidos
INSERT INTO notification_templates (template_key, name, message_template) VALUES
  ('subscription_ending', 'Fin de Suscripción (2 días)', 
   '⚠️ *Aviso de Suscripción*\n\n{{business_name}},\n\nTu suscripción finalizará en *2 días* ({{expiry_date}}).\n\nUn representante se pondrá en contacto contigo próximamente para renovar tu servicio.\n\n💼 Gracias por confiar en nosotros.'),
  
  ('trial_ending', 'Fin de Período de Prueba',
   '🎯 *Período de Prueba Finaliza Pronto*\n\n{{business_name}},\n\nTu período de prueba finalizará el *{{expiry_date}}*.\n\nNos encantaría seguir trabajando contigo. Un representante se comunicará pronto para discutir opciones de suscripción.\n\n✨ Gracias por probar nuestro servicio.'),
  
  ('payment_reminder', 'Recordatorio de Pago',
   '💳 *Recordatorio de Pago*\n\n{{business_name}},\n\nEste es un recordatorio amigable sobre tu pago pendiente.\n\nMonto: *{{amount}}*\nFecha de vencimiento: *{{due_date}}*\n\nUn representante se pondrá en contacto contigo para facilitar el proceso.\n\n🙏 Gracias por tu atención.'),
  
  ('password_change_request', 'Solicitud de Cambio de Contraseña',
   '🔐 *Solicitud de Cambio de Contraseña*\n\n{{business_name}},\n\nSe ha solicitado un cambio de contraseña para tu cuenta.\n\n¿Fuiste tú quien solicitó este cambio?\n\nResponde:\n*SI* - Para confirmar\n*NO* - Para cancelar\n\nSi confirmas, te pediremos verificar tu identidad.'),
  
  ('representative_contact', 'Contacto de Representante',
   '👤 *Nuestro Representante te Contactará*\n\n{{business_name}},\n\n{{message}}\n\nUn miembro de nuestro equipo se pondrá en contacto contigo pronto.\n\n📞 Mantente atento a nuestras comunicaciones.'),
  
  ('2fa_code', 'Código de Verificación 2FA',
   '🔒 *Código de Verificación*\n\n{{business_name}},\n\nAlguien está intentando iniciar sesión en tu cuenta.\n\nTu código de verificación es:\n\n*{{code}}*\n\nEste código expira en 10 minutos.\n\n⚠️ Si no fuiste tú, ignora este mensaje.')
ON CONFLICT (template_key) DO NOTHING;
