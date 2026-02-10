/*
  # Agregar política DELETE para notificaciones

  1. Cambios
    - Agregar política RLS para permitir DELETE en tabla notifications
    - Permitir que usuarios anónimos eliminen notificaciones (necesario para el sistema sin auth)

  2. Seguridad
    - La política permite eliminar notificaciones de forma anónima
    - Esto es necesario porque el sistema no usa autenticación tradicional
*/

-- Agregar política de DELETE para notificaciones
CREATE POLICY "Allow anonymous delete notifications"
  ON notifications FOR DELETE
  TO anon
  USING (true);
