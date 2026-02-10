/*
  # Crear SuperAdmin Inicial

  Este script crea el usuario superadmin inicial del sistema.
  
  IMPORTANTE: Después de ejecutar esta migración, debes:
  1. Ir al Dashboard de Supabase > Authentication > Users
  2. Crear un usuario manualmente con email: wd.06@outlook.es
  3. Copiar el UUID del usuario creado
  4. Ejecutar el siguiente comando SQL reemplazando 'USER_UUID_AQUI':
  
  INSERT INTO superadmin_users (id, email, full_name, is_active, two_factor_enabled)
  VALUES ('USER_UUID_AQUI', 'wd.06@outlook.es', 'SuperAdmin Principal', true, false);
  
  Alternativamente, puedes usar la función de signup de Supabase desde tu aplicación.
*/

-- Por ahora, esta migración solo documenta el proceso
-- No podemos crear usuarios de auth directamente desde SQL por seguridad

-- Si ya tienes un usuario auth con este email, puedes agregar esta línea
-- con el UUID correcto:
-- INSERT INTO superadmin_users (id, email, full_name, is_active, two_factor_enabled)
-- VALUES ('tu-uuid-aqui', 'wd.06@outlook.es', 'SuperAdmin Principal', true, false)
-- ON CONFLICT (email) DO NOTHING;
