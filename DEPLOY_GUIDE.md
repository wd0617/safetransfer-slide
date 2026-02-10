# 🚀 Guía de Deploy — SafeTransfer Slide → safetransferslide.com

## Información del Proyecto

| Dato | Valor |
|---|---|
| **Dominio** | https://safetransferslide.com |
| **Proyecto Supabase** | `hgtqezrqnvopzxzgdkrh` (https://hgtqezrqnvopzxzgdkrh.supabase.co) |
| **Framework** | React + Vite + TypeScript + TailwindCSS |
| **Edge Functions** | send-email, send-telegram, telegram-webhook, zoho-invoice |

---

## FASE 1: Deploy en Vercel

### 1.1 Crear archivo vercel.json

Crear `vercel.json` en la raíz del proyecto con:

```json
{
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

> Esto permite que las rutas de React funcionen correctamente (SPA routing).

### 1.2 Subir a GitHub (si no está ya)

```bash
cd "C:\Users\Wander\Desktop\SafeTransfer Slides"
git init
git add .
git commit -m "SafeTransfer Slide v1.0"
git remote add origin https://github.com/TU_USUARIO/safetransfer-slide.git
git branch -M main
git push -u origin main
```

### 1.3 Crear proyecto en Vercel

1. Ir a [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → selecciona el repositorio de SafeTransfer Slide
3. Configurar:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (dejarlo vacío / raíz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** → Agregar:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://hgtqezrqnvopzxzgdkrh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndHFlenJxbnZvcHp4emdka3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDk1MTYsImV4cCI6MjA3NTE4NTUxNn0.zBShAzcclUZcUjlxI_5bg-b10_D0221RdrB4XmTPc1k` |

5. Click **Deploy**

---

## FASE 2: Conectar Dominio Personalizado

### 2.1 Agregar dominio en Vercel

1. En Vercel, ir al proyecto → **Settings** → **Domains**
2. Escribir: `safetransferslide.com`
3. Click **Add**
4. Vercel te mostrará los registros DNS necesarios

### 2.2 Configurar DNS en tu registrador de dominio

Ve al panel de tu registrador de dominio (donde compraste safetransferslide.com) y agrega estos registros:

**Opción A: Si usas el dominio raíz (safetransferslide.com)**

| Tipo | Host/Name | Valor | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | Auto/3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto/3600 |

**Opción B: Si prefieres usar www**

| Tipo | Host/Name | Valor | TTL |
|---|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto/3600 |

> ⚠️ Vercel te dirá exactamente qué registros necesitas. Usa los que muestre en el paso 2.1.

### 2.3 Verificar conexión

1. Esperar 5-30 minutos para propagación DNS (puede tardar hasta 48h en algunos registradores)
2. En Vercel → **Settings** → **Domains** → verificar que aparezca ✅ en verde
3. Vercel configura SSL/HTTPS automáticamente

---

## FASE 3: Configurar Supabase

### 3.1 Agregar dominio a URL Configuration de Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar el proyecto `hgtqezrqnvopzxzgdkrh`
3. Ir a **Authentication** → **URL Configuration**
4. En **Site URL**: poner `https://safetransferslide.com`
5. En **Redirect URLs**, agregar:
   - `https://safetransferslide.com/**`
   - `https://www.safetransferslide.com/**`
   - La URL de Vercel (ej: `https://safetransfer-slide.vercel.app/**`)
6. Click **Save**

### 3.2 Verificar CORS / Edge Functions

Las Edge Functions (send-email, send-telegram, etc.) deben aceptar el nuevo dominio. Verifica cada función:

1. Ir a **Edge Functions** en el dashboard de Supabase
2. Revisar que las funciones tengan habilitado CORS para el nuevo dominio
3. Si las funciones usan un check de `origin`, agregar `safetransferslide.com`

> **Nota**: Si las Edge Functions usan el anon key para autorización (como está en tu `emailService.ts`), estas conexiones funcionarán automáticamente porque Supabase verifica el JWT, no el origen.

---

## FASE 4: Verificaciones Finales

### 4.1 Checklist de verificación

Visitar cada una de estas URLs y verificar que funcionan:

- [ ] `https://safetransferslide.com` → Carga la pantalla principal
- [ ] `https://www.safetransferslide.com` → Redirige correctamente
- [ ] Login de Business Admin funciona
- [ ] Login de SuperAdmin funciona
- [ ] Las tasas de cambio se muestran en el DisplayScreen
- [ ] Los emails se envían correctamente (probar recuperación de contraseña)
- [ ] Las notificaciones de Telegram se envían
- [ ] Las imágenes/videos del MediaCarousel se cargan
- [ ] SSL/HTTPS funciona (candado verde en el navegador)

### 4.2 Actualizar referencias al dominio antiguo

Si la app tiene hardcoded alguna URL antigua (como la de Bolt), buscar y reemplazar:

```
# Buscar en el código cualquier referencia al dominio antiguo de Bolt
# Reemplazar con https://safetransferslide.com
```

### 4.3 Actualizar CONTEXT.md

Actualizar el `.gemini/CONTEXT.md` con la URL final del deploy.

---

## FASE 5: Supabase Storage (Imágenes y Videos)

### 5.1 Verificar políticas de Storage

Si la app sube imágenes (logos, media), verificar que el bucket de Supabase Storage esté configurado:

1. Ir a **Storage** en Supabase Dashboard
2. Verificar que los buckets necesarios existen (ej: `media`, `logos`)
3. Verificar las políticas RLS permiten lectura pública y escritura autenticada

---

## 📋 Resumen de Pasos Rápidos

```
1. ✅ Crear vercel.json
2. ✅ Subir código a GitHub 
3. ✅ Crear proyecto en Vercel → importar repo → agregar env vars → deploy
4. ✅ En Vercel: Settings → Domains → agregar safetransferslide.com
5. ✅ En registrador DNS: agregar registros A/CNAME que Vercel indica
6. ✅ Esperar propagación DNS (5-30 min)
7. ✅ En Supabase: Authentication → URL Configuration → agregar nuevo dominio
8. ✅ Verificar: login, tasas de cambio, emails, telegram, media
9. ✅ Listo! 🎉
```

---

## ❓ Notas Importantes

- **El proyecto ya fue creado con Bolt** — Si Bolt ya desplegó la app, es posible que ya tenga un dominio/URL asignado. En ese caso, solo necesitas conectar el dominio personalizado.
- **Si Bolt usa Netlify en lugar de Vercel**, los pasos de DNS son similares pero las IPs cambian.
- **Edge Functions**: Estas se ejecutan en Supabase, no en Vercel, así que funcionan independiente del hosting.
- **Variables de entorno**: Asegúrate de que estén en Vercel (no solo en `.env` local).
