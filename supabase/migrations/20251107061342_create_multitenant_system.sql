/*
  # Sistema Multi-Tenant - Auto-registro de Negocios

  ## 1. Modificaciones a Tablas Existentes
  
  ### Agregar `business_id` a todas las tablas de datos
  - `exchange_rates` - Ahora pertenecen a un negocio específico
  - `media_items` - Cada negocio tiene sus propios medios
  - `announcements` - Cada negocio tiene sus propios anuncios
  - `business_settings` - Ya no es singleton, cada negocio tiene su configuración
  - `service_logos` - Cada negocio tiene sus propios logos de servicios

  ## 2. Nueva Tabla: `business_admins`
  - `id` (uuid, primary key) - ID único del admin
  - `business_id` (uuid, foreign key) - Referencia al negocio
  - `user_id` (uuid, foreign key) - Referencia a auth.users
  - `email` (text) - Email del administrador
  - `full_name` (text) - Nombre completo
  - `role` (text) - Rol: owner, admin
  - `is_active` (boolean) - Estado activo
  - `last_login_at` (timestamptz) - Último acceso
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ## 3. Modificaciones a `businesses`
  - Agregar campos necesarios para self-registration
  - Quitar restricciones de superadmin
  - Permitir auto-registro

  ## 4. Seguridad RLS - Aislamiento Total
  - Cada negocio SOLO ve y gestiona sus propios datos
  - business_admins solo ven datos de su negocio
  - Aislamiento completo entre negocios
  - SuperAdmin puede ver todo (auditoría)

  ## 5. Índices
  - Índices en business_id para todas las tablas
  - Optimización de consultas por negocio
*/

-- ============================================
-- 1. MODIFICAR TABLA businesses PARA AUTO-REGISTRO
-- ============================================

-- Agregar nuevos campos para auto-registro
DO $$
BEGIN
  -- Agregar subdomain único para cada negocio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'subdomain'
  ) THEN
    ALTER TABLE businesses ADD COLUMN subdomain text UNIQUE;
  END IF;

  -- Agregar configuración de branding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE businesses ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE businesses ADD COLUMN primary_color text DEFAULT '#1e40af';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'secondary_color'
  ) THEN
    ALTER TABLE businesses ADD COLUMN secondary_color text DEFAULT '#3b82f6';
  END IF;

  -- Agregar configuración del negocio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'business_hours'
  ) THEN
    ALTER TABLE businesses ADD COLUMN business_hours text DEFAULT 'Lun-Vie: 9:00 AM - 6:00 PM';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'weather_city'
  ) THEN
    ALTER TABLE businesses ADD COLUMN weather_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'weather_api_key'
  ) THEN
    ALTER TABLE businesses ADD COLUMN weather_api_key text;
  END IF;
END $$;

-- ============================================
-- 2. CREAR TABLA business_admins
-- ============================================

CREATE TABLE IF NOT EXISTS business_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Índices para business_admins
CREATE INDEX IF NOT EXISTS idx_business_admins_business_id ON business_admins(business_id);
CREATE INDEX IF NOT EXISTS idx_business_admins_user_id ON business_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_business_admins_email ON business_admins(email);

-- ============================================
-- 3. AGREGAR business_id A TABLAS EXISTENTES
-- ============================================

-- Agregar business_id a exchange_rates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exchange_rates' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE exchange_rates ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Agregar business_id a media_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_items' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE media_items ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Agregar business_id a announcements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE announcements ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Agregar business_id a service_logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_logos' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE service_logos ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Modificar business_settings para ser multi-tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índices en business_id para todas las tablas
CREATE INDEX IF NOT EXISTS idx_exchange_rates_business_id ON exchange_rates(business_id);
CREATE INDEX IF NOT EXISTS idx_media_items_business_id ON media_items(business_id);
CREATE INDEX IF NOT EXISTS idx_announcements_business_id ON announcements(business_id);
CREATE INDEX IF NOT EXISTS idx_service_logos_business_id ON service_logos(business_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);

-- ============================================
-- 4. ELIMINAR POLÍTICAS RLS ANTIGUAS
-- ============================================

-- exchange_rates
DROP POLICY IF EXISTS "Anyone can view active exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Service role can manage exchange rates" ON exchange_rates;

-- media_items
DROP POLICY IF EXISTS "Anyone can view active media items" ON media_items;
DROP POLICY IF EXISTS "Service role can manage media items" ON media_items;

-- announcements
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Service role can manage announcements" ON announcements;

-- business_settings
DROP POLICY IF EXISTS "Anyone can view business settings" ON business_settings;
DROP POLICY IF EXISTS "Service role can manage business settings" ON business_settings;

-- service_logos
DROP POLICY IF EXISTS "Anyone can view active service logos" ON service_logos;
DROP POLICY IF EXISTS "Service role can manage service logos" ON service_logos;

-- ============================================
-- 5. CREAR NUEVAS POLÍTICAS RLS MULTI-TENANT
-- ============================================

-- Habilitar RLS en business_admins
ALTER TABLE business_admins ENABLE ROW LEVEL SECURITY;

-- ===== BUSINESSES =====
-- Permitir que cualquier usuario autenticado cree un negocio (auto-registro)
DROP POLICY IF EXISTS "Anyone can register a business" ON businesses;
CREATE POLICY "Anyone can register a business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Los admins del negocio pueden ver su propio negocio
DROP POLICY IF EXISTS "Business admins can view own business" ON businesses;
CREATE POLICY "Business admins can view own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR
    -- SuperAdmin puede ver todos
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Los admins del negocio pueden actualizar su propio negocio
DROP POLICY IF EXISTS "Business admins can update own business" ON businesses;
CREATE POLICY "Business admins can update own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ===== BUSINESS_ADMINS =====
-- Permitir insertar admin cuando se crea el negocio
DROP POLICY IF EXISTS "Allow creating first business admin" ON business_admins;
CREATE POLICY "Allow creating first business admin"
  ON business_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR
    -- SuperAdmin puede crear admins
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admins pueden ver otros admins de su negocio
DROP POLICY IF EXISTS "Business admins can view own business admins" ON business_admins;
CREATE POLICY "Business admins can view own business admins"
  ON business_admins FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR
    -- SuperAdmin puede ver todos
    EXISTS (
      SELECT 1 FROM superadmin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admins pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Business admins can update own profile" ON business_admins;
CREATE POLICY "Business admins can update own profile"
  ON business_admins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===== EXCHANGE_RATES =====
-- Público puede ver tasas activas de cualquier negocio (para display)
DROP POLICY IF EXISTS "Public can view active exchange rates" ON exchange_rates;
CREATE POLICY "Public can view active exchange rates"
  ON exchange_rates FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins del negocio pueden gestionar sus tasas
DROP POLICY IF EXISTS "Business admins can manage own exchange rates" ON exchange_rates;
CREATE POLICY "Business admins can manage own exchange rates"
  ON exchange_rates FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ===== MEDIA_ITEMS =====
DROP POLICY IF EXISTS "Public can view active media items" ON media_items;
CREATE POLICY "Public can view active media items"
  ON media_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Business admins can manage own media items" ON media_items;
CREATE POLICY "Business admins can manage own media items"
  ON media_items FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ===== ANNOUNCEMENTS =====
DROP POLICY IF EXISTS "Public can view active announcements" ON announcements;
CREATE POLICY "Public can view active announcements"
  ON announcements FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Business admins can manage own announcements" ON announcements;
CREATE POLICY "Business admins can manage own announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ===== SERVICE_LOGOS =====
DROP POLICY IF EXISTS "Public can view active service logos" ON service_logos;
CREATE POLICY "Public can view active service logos"
  ON service_logos FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Business admins can manage own service logos" ON service_logos;
CREATE POLICY "Business admins can manage own service logos"
  ON service_logos FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ===== BUSINESS_SETTINGS =====
DROP POLICY IF EXISTS "Public can view business settings" ON business_settings;
CREATE POLICY "Public can view business settings"
  ON business_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Business admins can manage own settings" ON business_settings;
CREATE POLICY "Business admins can manage own settings"
  ON business_settings FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- 6. TRIGGERS PARA updated_at
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_admins_updated_at') THEN
    CREATE TRIGGER update_business_admins_updated_at
      BEFORE UPDATE ON business_admins
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
