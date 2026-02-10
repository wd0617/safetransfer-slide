# Instrucciones para Acceder como SuperAdmin

## Email: wd.06@outlook.es

### Opción 1: Crear cuenta desde Supabase Dashboard (MÁS RÁPIDO)

1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard
2. Navega a **Authentication** → **Users**
3. Click en **"Add user"** → **"Create new user"**
4. Ingresa:
   - Email: `wd.06@outlook.es`
   - Password: La contraseña que quieras usar (guárdala bien)
   - Marca "Auto Confirm User" para que no necesite verificación de email
5. Click en **"Create user"**
6. Una vez creado, **copia el UUID del usuario** (aparece en la columna ID)
7. Ve a **SQL Editor** en Supabase
8. Ejecuta este comando (reemplaza `TU_UUID_AQUI` con el UUID que copiaste):

```sql
INSERT INTO superadmin_users (id, email, full_name, is_active, two_factor_enabled)
VALUES ('TU_UUID_AQUI', 'wd.06@outlook.es', 'SuperAdmin Principal', true, false);
```

9. ¡Listo! Ahora puedes acceder:
   - Click en el botón del escudo rojo (esquina inferior derecha)
   - Email: `wd.06@outlook.es`
   - Password: La que configuraste

---

### Opción 2: Usar la consola del navegador (RÁPIDO, DESDE LA APP)

1. Abre tu aplicación en el navegador
2. Abre la consola de desarrollador (F12)
3. Pega este código (cambia 'TU_CONTRASEÑA' por la que quieras):

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'wd.06@outlook.es',
  password: 'TU_CONTRASEÑA'
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Usuario creado:', data);

  // Agregar a superadmin_users
  const { error: insertError } = await supabase
    .from('superadmin_users')
    .insert({
      id: data.user.id,
      email: 'wd.06@outlook.es',
      full_name: 'SuperAdmin Principal',
      is_active: true,
      two_factor_enabled: false
    });

  if (insertError) {
    console.error('Error creando superadmin:', insertError);
  } else {
    console.log('✅ SuperAdmin creado exitosamente!');
    console.log('Ahora puedes hacer login con tu email y contraseña');
  }
}
```

4. Presiona Enter
5. Si ves "✅ SuperAdmin creado exitosamente!", recarga la página
6. Click en el botón del escudo rojo
7. Ingresa tu email y contraseña

---

### Opción 3: Script SQL directo (SI YA TIENES EL UUID)

Si ya creaste un usuario en Supabase Auth y tienes su UUID, ejecuta esto en SQL Editor:

```sql
INSERT INTO superadmin_users (id, email, full_name, is_active, two_factor_enabled)
VALUES ('tu-uuid-aqui', 'wd.06@outlook.es', 'SuperAdmin Principal', true, false)
ON CONFLICT (id) DO UPDATE SET is_active = true;
```

---

## Acceso al Panel SuperAdmin

Una vez configurado:

1. En la pantalla principal de la aplicación, verás dos botones flotantes:
   - **Engranaje** (Settings) - Panel de Admin normal
   - **Escudo ROJO** - Panel SuperAdmin ← Este es el tuyo

2. Click en el **escudo rojo**
3. Ingresa:
   - Email: `wd.06@outlook.es`
   - Contraseña: La que configuraste

4. ¡Listo! Tendrás acceso completo a:
   - Dashboard con estadísticas
   - Gestión de negocios
   - Pagos y facturación
   - Logs de auditoría
   - Sistema de notificaciones

---

## Notas de Seguridad

- Solo TÚ tendrás acceso al panel SuperAdmin
- Todas las acciones quedan registradas en audit_logs
- El acceso está protegido con RLS en la base de datos
- Nadie más podrá acceder aunque conozca la URL
