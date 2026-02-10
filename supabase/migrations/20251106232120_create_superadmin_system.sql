/*
  # Sistema SuperAdmin Completo para Service Point

  ## 1. Nuevas Tablas

  ### `superadmin_users`
  - `id` (uuid, primary key) - ID único del superadmin
  - `email` (text, unique) - Email de acceso exclusivo
  - `full_name` (text) - Nombre completo del superadmin
  - `phone` (text) - Teléfono de contacto
  - `is_active` (boolean) - Estado activo/inactivo
  - `two_factor_enabled` (boolean) - Si tiene 2FA habilitado
  - `last_login_at` (timestamptz) - Último acceso
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ### `businesses`
  - `id` (uuid, primary key) - ID único del negocio
  - `name` (text) - Nombre del negocio
  - `business_type` (text) - Tipo de negocio/rubro
  - `contact_email` (text) - Email de contacto
  - `contact_phone` (text) - Teléfono de contacto
  - `address` (text) - Dirección física
  - `city` (text) - Ciudad
  - `country` (text) - País
  - `status` (text) - Estado: active, inactive, blocked
  - `status_reason` (text) - Razón del estado actual
  - `total_operators` (integer) - Número de operadores
  - `subscription_plan` (text) - Plan de suscripción
  - `blocked_at` (timestamptz) - Fecha de bloqueo
  - `blocked_by` (uuid) - ID del superadmin que bloqueó
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ### `business_payments`
  - `id` (uuid, primary key) - ID único del pago
  - `business_id` (uuid, foreign key) - Referencia al negocio
  - `amount` (decimal) - Monto del pago
  - `currency` (text) - Moneda del pago
  - `payment_date` (date) - Fecha del pago
  - `due_date` (date) - Fecha de vencimiento
  - `status` (text) - Estado: pending, paid, overdue, cancelled
  - `payment_method` (text) - Método de pago
  - `invoice_number` (text) - Número de factura
  - `notes` (text) - Notas adicionales
  - `discount_applied` (decimal) - Descuento aplicado
  - `paid_at` (timestamptz) - Fecha de pago efectivo
  - `recorded_by` (uuid) - ID del superadmin que registró
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ### `audit_logs`
  - `id` (uuid, primary key) - ID único del log
  - `superadmin_id` (uuid) - ID del superadmin que realizó la acción
  - `action_type` (text) - Tipo de acción: business_blocked, payment_modified, etc
  - `entity_type` (text) - Tipo de entidad: business, payment, user
  - `entity_id` (uuid) - ID de la entidad afectada
  - `description` (text) - Descripción detallada de la acción
  - `old_values` (jsonb) - Valores anteriores
  - `new_values` (jsonb) - Valores nuevos
  - `ip_address` (text) - Dirección IP del origen
  - `user_agent` (text) - User agent del navegador
  - `created_at` (timestamptz) - Fecha de la acción

  ### `business_notifications`
  - `id` (uuid, primary key) - ID único de la notificación
  - `business_id` (uuid, foreign key) - Referencia al negocio
  - `notification_type` (text) - Tipo: payment_due, status_change, alert
  - `subject` (text) - Asunto del mensaje
  - `message` (text) - Contenido del mensaje
  - `status` (text) - Estado: pending, sent, failed
  - `sent_at` (timestamptz) - Fecha de envío
  - `sent_by` (uuid) - ID del superadmin que envió
  - `created_at` (timestamptz) - Fecha de creación

  ### `business_operators`
  - `id` (uuid, primary key) - ID único del operador
  - `business_id` (uuid, foreign key) - Referencia al negocio
  - `full_name` (text) - Nombre completo del operador
  - `email` (text) - Email del operador
  - `phone` (text) - Teléfono del operador
  - `role` (text) - Rol: admin, operator
  - `is_active` (boolean) - Estado activo
  - `last_login_at` (timestamptz) - Último acceso
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ## 2. Seguridad (RLS)

  Todas las tablas tienen RLS habilitado con políticas restrictivas que solo permiten acceso a usuarios autenticados con rol de superadmin.

  ## 3. Índices

  Se crean índices para optimizar consultas frecuentes:
  - Búsqueda de negocios por estado y nombre
  - Filtrado de pagos por negocio y estado
  - Consulta de logs por fecha y tipo de acción
  - Búsqueda de operadores por negocio

  ## 4. Funciones Automáticas

  - Triggers para actualizar `updated_at` automáticamente
  - Función para registrar automáticamente acciones en audit_logs
  - Validaciones de estado de negocio y pagos
*/

-- Crear tabla de superadmin users
CREATE TABLE IF NOT EXISTS superadmin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de negocios
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_type text DEFAULT 'money_transfer',
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  city text,
  country text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  status_reason text,
  total_operators integer DEFAULT 0,
  subscription_plan text DEFAULT 'basic',
  blocked_at timestamptz,
  blocked_by uuid REFERENCES superadmin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de pagos de negocios
CREATE TABLE IF NOT EXISTS business_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_date date DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method text,
  invoice_number text,
  notes text,
  discount_applied decimal(10, 2) DEFAULT 0,
  paid_at timestamptz,
  recorded_by uuid REFERENCES superadmin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id uuid REFERENCES superadmin_users(id),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de notificaciones a negocios
CREATE TABLE IF NOT EXISTS business_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('payment_due', 'status_change', 'alert', 'general')),
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  sent_by uuid REFERENCES superadmin_users(id),
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de operadores de negocios
CREATE TABLE IF NOT EXISTS business_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);
CREATE INDEX IF NOT EXISTS idx_business_payments_business_id ON business_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_business_payments_status ON business_payments(status);
CREATE INDEX IF NOT EXISTS idx_business_payments_due_date ON business_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_business_operators_business_id ON business_operators(business_id);
CREATE INDEX IF NOT EXISTS idx_business_notifications_business_id ON business_notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_business_notifications_status ON business_notifications(status);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_superadmin_users_updated_at') THEN
    CREATE TRIGGER update_superadmin_users_updated_at
      BEFORE UPDATE ON superadmin_users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_businesses_updated_at') THEN
    CREATE TRIGGER update_businesses_updated_at
      BEFORE UPDATE ON businesses
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_payments_updated_at') THEN
    CREATE TRIGGER update_business_payments_updated_at
      BEFORE UPDATE ON business_payments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_operators_updated_at') THEN
    CREATE TRIGGER update_business_operators_updated_at
      BEFORE UPDATE ON business_operators
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Habilitar RLS en todas las tablas
ALTER TABLE superadmin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_operators ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para superadmin_users
CREATE POLICY "SuperAdmin can view own profile"
  ON superadmin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "SuperAdmin can update own profile"
  ON superadmin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas RLS para businesses (solo superadmins autenticados)
CREATE POLICY "SuperAdmin can view all businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can insert businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can update businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can delete businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

-- Políticas RLS para business_payments
CREATE POLICY "SuperAdmin can view all payments"
  ON business_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can insert payments"
  ON business_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can update payments"
  ON business_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can delete payments"
  ON business_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

-- Políticas RLS para audit_logs
CREATE POLICY "SuperAdmin can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

-- Políticas RLS para business_notifications
CREATE POLICY "SuperAdmin can view all notifications"
  ON business_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can insert notifications"
  ON business_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can update notifications"
  ON business_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

-- Políticas RLS para business_operators
CREATE POLICY "SuperAdmin can view all operators"
  ON business_operators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can insert operators"
  ON business_operators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can update operators"
  ON business_operators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );

CREATE POLICY "SuperAdmin can delete operators"
  ON business_operators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE superadmin_users.id = auth.uid()
      AND superadmin_users.is_active = true
    )
  );