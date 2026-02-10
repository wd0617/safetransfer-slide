/*
  # Arreglar políticas RLS para permitir registro de SuperAdmin

  1. Cambios de Seguridad
    - Agregar política INSERT para permitir que usuarios autenticados se registren como superadmin
    - Solo permitir si no existe ningún superadmin aún (primer usuario)
    - O si el usuario que inserta ya es un superadmin activo

  2. Notas Importantes
    - Esta política permite el registro del primer superadmin
    - Después del primer superadmin, solo otros superadmins pueden crear nuevos
*/

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Allow first superadmin registration" ON superadmin_users;
DROP POLICY IF EXISTS "SuperAdmin can insert own profile" ON superadmin_users;

-- Crear política para INSERT que permite:
-- 1. El primer registro (cuando no hay superadmins)
-- 2. O cuando un superadmin existente crea uno nuevo
CREATE POLICY "Allow first superadmin registration"
  ON superadmin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Permitir si no existe ningún superadmin aún
    NOT EXISTS (SELECT 1 FROM superadmin_users)
    OR
    -- O si el usuario actual ya es un superadmin activo
    EXISTS (
      SELECT 1 FROM superadmin_users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );
