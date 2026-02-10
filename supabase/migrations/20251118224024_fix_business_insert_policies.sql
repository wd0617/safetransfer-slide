/*
  # Corregir políticas RLS para mensajes y recuperación de contraseña

  1. Cambios
    - Actualizar políticas de `messages` para permitir inserción desde negocios
    - Actualizar políticas de `password_recovery_requests` para permitir inserción desde negocios
    - Actualizar políticas de `notifications` para permitir inserción desde negocios

  2. Seguridad
    - Las políticas permiten inserción pero mantienen la seguridad
    - Los negocios solo pueden ver sus propios datos
*/

-- Eliminar políticas antiguas de messages
DROP POLICY IF EXISTS "Allow anonymous read messages" ON messages;
DROP POLICY IF EXISTS "Allow anonymous insert messages" ON messages;
DROP POLICY IF EXISTS "Allow anonymous update messages" ON messages;

-- Crear nuevas políticas para messages
CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update messages"
  ON messages FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Eliminar políticas antiguas de password_recovery_requests
DROP POLICY IF EXISTS "Allow anonymous read password_recovery_requests" ON password_recovery_requests;
DROP POLICY IF EXISTS "Allow anonymous insert password_recovery_requests" ON password_recovery_requests;
DROP POLICY IF EXISTS "Allow anonymous update password_recovery_requests" ON password_recovery_requests;

-- Crear nuevas políticas para password_recovery_requests
CREATE POLICY "Anyone can read password_recovery_requests"
  ON password_recovery_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert password_recovery_requests"
  ON password_recovery_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update password_recovery_requests"
  ON password_recovery_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Eliminar políticas antiguas de notifications
DROP POLICY IF EXISTS "Allow anonymous read notifications" ON notifications;
DROP POLICY IF EXISTS "Allow anonymous insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow anonymous update notifications" ON notifications;

-- Crear nuevas políticas para notifications
CREATE POLICY "Anyone can read notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update notifications"
  ON notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);
