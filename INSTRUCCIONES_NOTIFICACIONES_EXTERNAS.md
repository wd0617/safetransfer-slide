# Instrucciones para Notificaciones Externas

Este documento explica cómo enviar notificaciones a los negocios mediante WhatsApp y Telegram cuando se realizan acciones importantes en el sistema (cambios de contraseña, actualizaciones de estado, pagos vencidos, etc.).

## Campos de Contacto Disponibles

La tabla `businesses` ahora incluye dos campos opcionales:

- **`whatsapp_number`**: Número de WhatsApp en formato internacional (ej: +1234567890)
- **`telegram_id`**: Username de Telegram o Chat ID del negocio (ej: @username o 123456789)

Los negocios pueden configurar estos datos desde su panel de administración. El SuperAdmin puede verlos en la sección "Negocios" del panel.

## Cuándo Notificar a los Negocios

Deberías enviar notificaciones externas en los siguientes casos:

1. **Cambio de Contraseña Aprobado**: Cuando apruebes una solicitud de cambio de contraseña
2. **Cambio de Estado del Negocio**: Cuando actives, desactives o bloquees un negocio
3. **Pagos Vencidos**: Recordatorios de pagos pendientes
4. **Mensajes Importantes**: Cuando envíes un mensaje crítico desde el panel de SuperAdmin
5. **Actualizaciones del Sistema**: Mantenimiento programado o cambios importantes

## Cómo Enviar Notificaciones por WhatsApp

### Opción 1: WhatsApp Business API (Recomendado para Uso Profesional)

Para enviar mensajes automatizados necesitarás:

1. Crear una cuenta de WhatsApp Business
2. Usar un servicio como:
   - **Twilio WhatsApp API**: https://www.twilio.com/whatsapp
   - **MessageBird**: https://messagebird.com
   - **Vonage**: https://www.vonage.com/communications-apis/messages/

**Ejemplo con Twilio:**

```javascript
const accountSid = 'tu_account_sid';
const authToken = 'tu_auth_token';
const client = require('twilio')(accountSid, authToken);

// Enviar mensaje de cambio de contraseña aprobado
async function notifyPasswordChangeApproved(whatsappNumber, businessName) {
  await client.messages.create({
    from: 'whatsapp:+14155238886', // Tu número de Twilio
    to: `whatsapp:${whatsappNumber}`,
    body: `Hola ${businessName}, tu solicitud de cambio de contraseña ha sido aprobada. Ya puedes iniciar sesión con tu nueva contraseña.`
  });
}
```

### Opción 2: WhatsApp Web (Manual)

Si no quieres usar API, puedes enviar mensajes manualmente:

1. Abre WhatsApp Web: https://web.whatsapp.com
2. Copia el número de WhatsApp del negocio desde el panel
3. Usa este formato de URL para abrir el chat:
   ```
   https://wa.me/[número]?text=[mensaje]
   ```
   Ejemplo: `https://wa.me/1234567890?text=Hola,%20tu%20contraseña%20ha%20sido%20actualizada`

## Cómo Enviar Notificaciones por Telegram

### Opción 1: Telegram Bot API (Recomendado para Automatización)

1. **Crear un Bot de Telegram**:
   - Habla con @BotFather en Telegram
   - Envía `/newbot` y sigue las instrucciones
   - Guarda el token que te proporciona

2. **Obtener el Chat ID del negocio**:
   - El negocio debe iniciar una conversación con tu bot
   - El bot puede obtener el `chat_id` cuando recibe un mensaje

3. **Enviar mensajes**:

```javascript
const TELEGRAM_BOT_TOKEN = 'tu_bot_token';

async function sendTelegramMessage(chatId, message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  });
}

// Ejemplo de uso
await sendTelegramMessage(
  '123456789', // chat_id del negocio
  '<b>Cambio de Contraseña Aprobado</b>\n\nTu solicitud ha sido procesada exitosamente.'
);
```

### Opción 2: Telegram Manual

Si prefieres enviar mensajes manualmente:

1. Busca el username del negocio en Telegram
2. Abre el chat con: `https://t.me/username`
3. Envía el mensaje manualmente

## Plantillas de Mensajes Recomendadas

### Cambio de Contraseña Aprobado

```
✅ Cambio de Contraseña Aprobado

Hola [Nombre del Negocio],

Tu solicitud de cambio de contraseña ha sido aprobada exitosamente.

Ya puedes iniciar sesión con tu nueva contraseña en:
[URL del sistema]

Si no solicitaste este cambio, contacta al administrador inmediatamente.
```

### Cambio de Estado del Negocio

```
🔄 Actualización de Estado

Hola [Nombre del Negocio],

El estado de tu cuenta ha sido actualizado a: [NUEVO ESTADO]

[Si es bloqueo: Razón: ...]

Para más información, contacta al administrador.
```

### Pago Vencido

```
⚠️ Pago Pendiente

Hola [Nombre del Negocio],

Tienes un pago pendiente que venció el [FECHA].

Monto: $[CANTIDAD]
Plan: [PLAN]

Por favor, realiza el pago lo antes posible para evitar la suspensión del servicio.
```

### Mensaje Importante del SuperAdmin

```
📢 Mensaje del Administrador

Hola [Nombre del Negocio],

[ASUNTO]

[MENSAJE]

Saludos,
Equipo de Administración
```

## Integración con el Sistema

Para integrar completamente las notificaciones externas, considera crear una función de Edge Function en Supabase que:

1. Se active cuando se cree una notificación importante
2. Verifique si el negocio tiene WhatsApp o Telegram configurado
3. Envíe automáticamente el mensaje por el canal disponible

Esto permitirá que las notificaciones se envíen automáticamente sin intervención manual.

## Notas Importantes

- **Privacidad**: Solo usa estos canales para notificaciones importantes, no spam
- **Opt-in**: Los negocios deben proporcionar voluntariamente estos datos
- **Costos**: Las APIs de WhatsApp y Telegram pueden tener costos asociados
- **Límites**: Respeta los límites de envío de mensajes de cada plataforma
- **Formateo**: Ambas plataformas soportan texto enriquecido (negrita, cursiva, etc.)

## Recursos Adicionales

- Twilio WhatsApp API: https://www.twilio.com/docs/whatsapp
- Telegram Bot API: https://core.telegram.org/bots/api
- WhatsApp Business API: https://business.whatsapp.com
