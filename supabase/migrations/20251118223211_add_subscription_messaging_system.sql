/*
  # Sistema Completo de Suscripciones, Mensajería y Recuperación de Contraseña

  1. Nuevas Tablas
    - `messages` - Mensajes bidireccionales entre SuperAdmin y Negocios
    - `notifications` - Notificaciones bidireccionales
    - `password_recovery_requests` - Solicitudes de recuperación de contraseña
    - `subscription_history` - Historial de cambios de suscripción

  2. Modificaciones a Tablas Existentes
    - Agregar campos de suscripción a `businesses`

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso anónimo para funcionamiento sin auth

  4. Índices
    - Optimización para consultas frecuentes
*/

-- Agregar columnas de suscripción a businesses si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE businesses ADD COLUMN trial_end_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE businesses ADD COLUMN subscription_end_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE businesses ADD COLUMN last_payment_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'payment_amount'
  ) THEN
    ALTER TABLE businesses ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE businesses ADD COLUMN subscription_status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Tabla de mensajes bidireccionales
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  from_business BOOLEAN NOT NULL DEFAULT false,
  from_superadmin BOOLEAN NOT NULL DEFAULT false,
  sender_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  read BOOLEAN NOT NULL DEFAULT false,
  replied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read messages"
  ON messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update messages"
  ON messages FOR UPDATE
  TO anon
  USING (true);

-- Tabla de notificaciones bidireccionales
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  from_superadmin BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal',
  read BOOLEAN NOT NULL DEFAULT false,
  action_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read notifications"
  ON notifications FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert notifications"
  ON notifications FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update notifications"
  ON notifications FOR UPDATE
  TO anon
  USING (true);

-- Tabla de solicitudes de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ,
  new_password_set BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE password_recovery_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read password_recovery_requests"
  ON password_recovery_requests FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert password_recovery_requests"
  ON password_recovery_requests FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update password_recovery_requests"
  ON password_recovery_requests FOR UPDATE
  TO anon
  USING (true);

-- Tabla de historial de suscripciones
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  subscription_plan TEXT NOT NULL,
  trial_months INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_amount DECIMAL(10,2),
  notes TEXT,
  performed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read subscription_history"
  ON subscription_history FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert subscription_history"
  ON subscription_history FOR INSERT
  TO anon
  WITH CHECK (true);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_from_business ON messages(from_business);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_password_recovery_status ON password_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_business_id ON subscription_history(business_id);
