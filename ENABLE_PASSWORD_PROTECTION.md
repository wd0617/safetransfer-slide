# 🔐 Guía: Habilitar Protección de Contraseñas Comprometidas

**Fecha:** 2025-11-19
**Prioridad:** ALTA
**Tiempo estimado:** 15 minutos

---

## ⚠️ ¿Por Qué Es Importante?

Las contraseñas comprometidas son uno de los vectores de ataque más comunes:

- **10+ billones** de contraseñas filtradas están en bases de datos públicas
- **81%** de los ataques exitosos usan credenciales robadas o débiles
- Los atacantes usan "credential stuffing" para probar contraseñas conocidas

**Proteger contra contraseñas comprometidas reduce el riesgo de:**
- Acceso no autorizado a cuentas de negocio
- Robo de datos sensibles de clientes
- Compromiso de múltiples cuentas (reúso de contraseñas)

---

## 🎯 Opciones de Implementación

El sistema actual **NO usa Supabase Auth** para business admins, por lo que tienes 3 opciones:

### Opción 1: Validación en Frontend (RECOMENDADA) ⭐

**Ventajas:**
- ✅ Implementación rápida (15 min)
- ✅ Feedback inmediato al usuario
- ✅ No requiere backend adicional
- ✅ Usa API k-Anonymity (privacidad)

**Desventajas:**
- ⚠️ Puede bypassearse si se desactiva JS
- ⚠️ Requiere conexión a internet

---

### Opción 2: Validación en Edge Function (SEGURA)

**Ventajas:**
- ✅ No puede bypassearse
- ✅ Centralizado en backend
- ✅ Reutilizable para múltiples endpoints

**Desventajas:**
- ⚠️ Requiere crear Edge Function
- ⚠️ Agrega latencia al proceso de registro

---

### Opción 3: Migrar a Supabase Auth (COMPLETA)

**Ventajas:**
- ✅ Protección automática integrada
- ✅ Incluye MFA, OAuth, etc.
- ✅ Mantenido por Supabase

**Desventajas:**
- ❌ Requiere refactorización completa
- ❌ Cambio de arquitectura significativo
- ❌ Estimado: 2-3 días de desarrollo

---

## 🚀 OPCIÓN 1: Implementación en Frontend (RECOMENDADA)

### Paso 1: Instalar Dependencia

```bash
npm install hibp
```

### Paso 2: Crear Utilidad de Validación

Crear archivo: `src/lib/passwordValidator.ts`

```typescript
import { pwnedPassword } from 'hibp';

/**
 * Valida si una contraseña ha sido comprometida
 * Usa k-Anonymity model para preservar privacidad
 * @param password - Contraseña a validar
 * @returns Promise<{isValid: boolean, message?: string}>
 */
export async function validatePasswordSecurity(
  password: string
): Promise<{ isValid: boolean; message?: string; count?: number }> {
  try {
    // Verificar contraseña contra HaveIBeenPwned
    const numPwns = await pwnedPassword(password);

    if (numPwns > 0) {
      return {
        isValid: false,
        count: numPwns,
        message: `Esta contraseña ha sido comprometida ${numPwns.toLocaleString()} veces en filtraciones de datos. Por favor elige una contraseña más segura.`,
      };
    }

    return {
      isValid: true,
      count: 0,
    };
  } catch (error) {
    console.error('[PASSWORD_VALIDATOR] Error checking password:', error);

    // En caso de error (ej. sin internet), permitir continuar
    // pero registrar el error para monitoreo
    return {
      isValid: true,
      message: 'No se pudo verificar la contraseña. Asegúrate de usar una contraseña única y segura.',
    };
  }
}

/**
 * Validaciones adicionales de fortaleza de contraseña
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 8 caracteres',
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (strength < 3) {
    return {
      isValid: false,
      message: 'La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales',
    };
  }

  return { isValid: true };
}
```

### Paso 3: Integrar en BusinessRegistration

Modificar: `src/components/BusinessRegistration.tsx`

```typescript
import { validatePasswordSecurity, validatePasswordStrength } from '../lib/passwordValidator';

// Dentro del componente BusinessRegistration
const [passwordWarning, setPasswordWarning] = useState<string | null>(null);
const [checkingPassword, setCheckingPassword] = useState(false);

// Función para validar contraseña en tiempo real (opcional)
const handlePasswordChange = async (newPassword: string) => {
  setPassword(newPassword);
  setPasswordWarning(null);

  if (newPassword.length >= 8) {
    setCheckingPassword(true);

    // Validar fortaleza
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      setPasswordWarning(strengthCheck.message);
      setCheckingPassword(false);
      return;
    }

    // Validar si está comprometida (con debounce)
    setTimeout(async () => {
      const securityCheck = await validatePasswordSecurity(newPassword);
      if (!securityCheck.isValid) {
        setPasswordWarning(securityCheck.message);
      }
      setCheckingPassword(false);
    }, 1000); // Debounce de 1 segundo
  }
};

// Modificar handleSubmit para validar antes de enviar
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // 1. Validar fortaleza de contraseña
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
      setError(strengthCheck.message);
      setLoading(false);
      return;
    }

    // 2. Validar si contraseña está comprometida
    const securityCheck = await validatePasswordSecurity(password);
    if (!securityCheck.isValid) {
      setError(securityCheck.message);
      setLoading(false);
      return;
    }

    // 3. Si pasa todas las validaciones, proceder con registro
    // ... resto del código de registro existente

  } catch (err: any) {
    console.error('[REGISTRATION] Error:', err);
    setError(err.message || 'Error al registrar el negocio');
    setLoading(false);
  }
};

// En el JSX, agregar indicador de validación
<div className="relative">
  <input
    type="password"
    value={password}
    onChange={(e) => handlePasswordChange(e.target.value)}
    required
    className="w-full px-4 py-2 border rounded-lg"
    placeholder="Contraseña segura"
  />
  {checkingPassword && (
    <div className="absolute right-3 top-3">
      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  )}
  {passwordWarning && (
    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />
      {passwordWarning}
    </p>
  )}
</div>
```

### Paso 4: Integrar en Password Recovery

Modificar: `src/components/superadmin/PasswordRecovery.tsx`

```typescript
import { validatePasswordSecurity, validatePasswordStrength } from '../../lib/passwordValidator';

// Agregar validación en handleResetPassword
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // Validar fortaleza
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      setError(strengthCheck.message);
      setLoading(false);
      return;
    }

    // Validar si está comprometida
    const securityCheck = await validatePasswordSecurity(newPassword);
    if (!securityCheck.isValid) {
      setError(securityCheck.message);
      setLoading(false);
      return;
    }

    // Proceder con reset...
    // ... resto del código existente

  } catch (err: any) {
    console.error('[PASSWORD_RECOVERY] Error:', err);
    setError(err.message || 'Error al restablecer contraseña');
    setLoading(false);
  }
};
```

### Paso 5: Testing

```typescript
// Probar con contraseñas conocidas comprometidas
const testPasswords = [
  'password123',    // ❌ Debería rechazar
  'qwerty',         // ❌ Debería rechazar
  '123456',         // ❌ Debería rechazar
  'P@ssw0rd!2024',  // ⚠️ Puede estar comprometida
  'MyUn1qu3P@ss!',  // ✅ Probablemente segura
];
```

---

## 🛠️ OPCIÓN 2: Implementación en Edge Function

### Paso 1: Crear Edge Function

```bash
# En tu terminal local (NO en este proyecto)
supabase functions new validate-password
```

### Paso 2: Implementar Función

Archivo: `supabase/functions/validate-password/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    const hashUpper = hashHex.toUpperCase();

    // Usar k-Anonymity: solo enviar primeros 5 caracteres
    const prefix = hashUpper.substring(0, 5);
    const suffix = hashUpper.substring(5);

    // Consultar HaveIBeenPwned API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      { headers: { "Add-Padding": "true" } }
    );

    if (!response.ok) {
      throw new Error("Failed to check password");
    }

    const data = await response.text();
    const hashes = data.split("\n");

    // Buscar si el hash completo está en la lista
    let count = 0;
    for (const line of hashes) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix === suffix) {
        count = parseInt(countStr, 10);
        break;
      }
    }

    return new Response(
      JSON.stringify({
        isCompromised: count > 0,
        count: count,
        message: count > 0
          ? `Esta contraseña ha sido comprometida ${count} veces`
          : "Contraseña segura",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Paso 3: Desplegar Función

```bash
supabase functions deploy validate-password
```

### Paso 4: Usar en Frontend

```typescript
async function validatePasswordViaAPI(password: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ password }),
    }
  );

  const data = await response.json();
  return data;
}
```

---

## 📊 Monitoreo y Métricas

### Métricas Recomendadas

1. **Contraseñas Rechazadas**
   - Contar cuántas contraseñas comprometidas se bloquean
   - Métrica: `compromised_passwords_blocked`

2. **Tasa de Rechazo**
   - % de registros que fallan por contraseña comprometida
   - Métrica: `password_rejection_rate`

3. **Tiempo de Validación**
   - Medir latencia de API HaveIBeenPwned
   - Métrica: `password_validation_latency_ms`

### Logging Recomendado

```typescript
// En validatePasswordSecurity
console.log('[SECURITY]', {
  event: 'password_check',
  compromised: numPwns > 0,
  count: numPwns,
  timestamp: new Date().toISOString(),
  // NO registrar la contraseña misma
});
```

---

## ✅ Checklist de Implementación

### Implementación

- [ ] Instalar dependencia `hibp`
- [ ] Crear `src/lib/passwordValidator.ts`
- [ ] Integrar en `BusinessRegistration.tsx`
- [ ] Integrar en `PasswordRecovery.tsx`
- [ ] Agregar indicadores visuales (spinner, warnings)
- [ ] Agregar logging de métricas

### Testing

- [ ] Probar con contraseñas comprometidas conocidas
- [ ] Probar con contraseñas seguras
- [ ] Probar comportamiento sin conexión
- [ ] Verificar UX (feedback claro al usuario)
- [ ] Probar performance (< 2s de latencia)

### Documentación

- [ ] Documentar para usuarios finales
- [ ] Documentar para equipo de desarrollo
- [ ] Agregar a guías de seguridad

---

## 🎓 Recursos Adicionales

- **HaveIBeenPwned API:** https://haveibeenpwned.com/API/v3
- **Librería hibp:** https://github.com/wKovacs64/hibp
- **k-Anonymity Model:** https://www.troyhunt.com/ive-just-launched-pwned-passwords-version-2/
- **OWASP Password Guidelines:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

## 📞 Soporte

Si tienes preguntas o necesitas ayuda con la implementación, consulta:
- `SECURITY_FIXES_APPLIED.md` - Documentación técnica completa
- `SECURITY_SUMMARY.md` - Resumen ejecutivo

**Última actualización:** 2025-11-19
