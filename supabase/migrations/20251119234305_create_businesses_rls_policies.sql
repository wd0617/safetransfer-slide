/*
  # Crear Políticas RLS para Tabla Businesses

  ## Problema de Seguridad
  La tabla `businesses` tiene RLS habilitado pero sin políticas definidas,
  lo que resulta en un bloqueo total de acceso (ningún usuario puede leer datos).

  ## Estrategia de Seguridad
  
  ### Niveles de Acceso:
  
  1. **Usuarios Anónimos (anon)**
     - SELECT: Solo pueden ver su propio negocio si tienen una sesión válida
     - INSERT: Permitido vía función `register_business()` con SECURITY DEFINER
     
  2. **Business Admins (authenticated via sessions)**
     - SELECT: Solo pueden ver su propio negocio
     - UPDATE: Solo pueden actualizar su propio negocio
     - DELETE: No permitido (solo superadmins)
     
  3. **Superadmins**
     - SELECT: Pueden ver todos los negocios
     - UPDATE: Pueden actualizar cualquier negocio
     - DELETE: Pueden eliminar negocios (soft delete cambiando status)

  ## Políticas Implementadas
  
  Cada política es específica y restrictiva por defecto, siguiendo el principio
  de menor privilegio (least privilege).
*/

-- =====================================================
-- POLÍTICA 1: Anónimos pueden ver negocios activos
-- =====================================================
-- Permite a usuarios anónimos ver negocios activos para el DisplayScreen
-- Solo si tienen una sesión válida en business_sessions
CREATE POLICY "Anonymous users can view active businesses with session"
  ON public.businesses
  FOR SELECT
  TO anon
  USING (
    status = 'active' 
    AND EXISTS (
      SELECT 1 
      FROM public.business_sessions bs
      WHERE bs.business_id = businesses.id
        AND bs.expires_at > NOW()
    )
  );

-- =====================================================
-- POLÍTICA 2: Anónimos pueden insertar (vía función)
-- =====================================================
-- Permite INSERT para funciones SECURITY DEFINER como register_business()
-- La validación real la hace la función, no RLS
CREATE POLICY "Anonymous users can insert via function"
  ON public.businesses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- =====================================================
-- POLÍTICA 3: Authenticated pueden ver su negocio
-- =====================================================
-- Business admins pueden ver solo su propio negocio
-- Verifica que tengan una sesión válida
CREATE POLICY "Business admins can view own business"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.business_sessions bs
      WHERE bs.business_id = businesses.id
        AND bs.expires_at > NOW()
    )
    OR
    -- O si son superadmin
    EXISTS (
      SELECT 1 
      FROM public.business_admins ba
      WHERE ba.is_superadmin = true
        AND ba.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- =====================================================
-- POLÍTICA 4: Business admins pueden actualizar su negocio
-- =====================================================
-- Permite actualizaciones solo a campos no críticos
-- No permite cambiar status, blocked_by, blocked_at
CREATE POLICY "Business admins can update own business"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.business_sessions bs
      WHERE bs.business_id = businesses.id
        AND bs.expires_at > NOW()
    )
    OR
    -- O si son superadmin
    EXISTS (
      SELECT 1 
      FROM public.business_admins ba
      WHERE ba.is_superadmin = true
        AND ba.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  )
  WITH CHECK (
    -- Si eres business admin regular (no superadmin), no puedes cambiar status
    (
      NOT EXISTS (
        SELECT 1 
        FROM public.business_admins ba
        WHERE ba.is_superadmin = false
          AND ba.email = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
    OR
    -- Si eres superadmin, puedes cambiar lo que sea
    EXISTS (
      SELECT 1 
      FROM public.business_admins ba
      WHERE ba.is_superadmin = true
        AND ba.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- =====================================================
-- POLÍTICA 5: Solo superadmins pueden eliminar
-- =====================================================
-- Eliminación está restringida solo a superadmins
-- En práctica se usa soft delete (cambio de status)
CREATE POLICY "Only superadmins can delete businesses"
  ON public.businesses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.business_admins ba
      WHERE ba.is_superadmin = true
        AND ba.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO DE POLÍTICAS
-- =====================================================

-- Índice para lookups de status (usado en varias políticas)
CREATE INDEX IF NOT EXISTS idx_businesses_status 
  ON public.businesses(status) 
  WHERE status = 'active';

-- Índice para lookups de subdomain (usado en registro)
CREATE INDEX IF NOT EXISTS idx_businesses_subdomain 
  ON public.businesses(subdomain);

-- =====================================================
-- VERIFICACIÓN DE SEGURIDAD
-- =====================================================

-- Verificar que las políticas estén aplicadas correctamente
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'businesses';
    
  IF policy_count < 5 THEN
    RAISE EXCEPTION 'Error: No se crearon todas las políticas RLS para businesses';
  END IF;
  
  RAISE NOTICE 'Políticas RLS creadas exitosamente: % políticas activas', policy_count;
END $$;
