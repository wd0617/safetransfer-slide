import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(telegramApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

async function handlePasswordRecoveryConversation(
  supabase: any,
  botToken: string,
  chatId: string,
  text: string,
  conversation: any,
  businessAdmin: any
) {
  const upperText = text.toUpperCase().trim();

  if (conversation.state === 'waiting_response') {
    if (upperText === 'SI' || upperText === 'SÍ' || upperText === 'YES') {
      await supabase
        .from('telegram_conversations')
        .update({
          state: 'waiting_verification',
          context: { confirmed: true }
        })
        .eq('id', conversation.id);

      return `<b>Verificacion de Identidad</b>\n\n` +
        `Por favor, responde en el siguiente formato:\n\n` +
        `<code>Nombre Completo | Nombre del Negocio</code>\n\n` +
        `Ejemplo:\n<code>Juan Perez | Casa de Cambio Central</code>`;
    } else if (upperText === 'NO') {
      await supabase
        .from('telegram_conversations')
        .delete()
        .eq('id', conversation.id);

      await supabase
        .from('password_recovery_requests')
        .update({ status: 'cancelled' })
        .eq('business_id', businessAdmin.business_id)
        .eq('status', 'pending');

      return `<b>Solicitud Cancelada</b>\n\n` +
        `La solicitud de cambio de contrasena ha sido cancelada.\n\n` +
        `Si no reconoces esta actividad, contacta a soporte inmediatamente.`;
    } else {
      return `<b>Respuesta no valida</b>\n\n` +
        `Por favor responde:\n*SI* - Para confirmar\n*NO* - Para cancelar`;
    }
  } else if (conversation.state === 'waiting_verification') {
    const parts = text.split('|').map(p => p.trim());

    if (parts.length !== 2) {
      return `<b>Formato incorrecto</b>\n\n` +
        `Usa el formato:\n<code>Nombre Completo | Nombre del Negocio</code>\n\n` +
        `Ejemplo:\n<code>Juan Perez | Casa de Cambio Central</code>`;
    }

    const [fullName, businessName] = parts;

    const { data: business } = await supabase
      .from('businesses')
      .select('business_name')
      .eq('id', businessAdmin.business_id)
      .maybeSingle();

    const nameMatch = fullName.toLowerCase().includes(businessAdmin.email.split('@')[0].toLowerCase()) ||
      businessAdmin.email.toLowerCase().includes(fullName.toLowerCase().split(' ')[0]);
    const businessMatch = business && businessName.toLowerCase().includes(business.business_name.toLowerCase());

    if (nameMatch || businessMatch) {
      await supabase
        .from('telegram_conversations')
        .delete()
        .eq('id', conversation.id);

      await supabase
        .from('password_recovery_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('business_id', businessAdmin.business_id)
        .eq('status', 'pending');

      const { data: superadmin } = await supabase
        .from('business_admins')
        .select('telegram_chat_id')
        .eq('is_superadmin', true)
        .maybeSingle();

      if (superadmin?.telegram_chat_id) {
        await sendTelegramMessage(
          botToken,
          superadmin.telegram_chat_id,
          `<b>Cambio de Contrasena Verificado</b>\n\n` +
          `Negocio: <b>${business?.business_name || 'N/A'}</b>\n` +
          `Email: ${businessAdmin.email}\n` +
          `Verificado por: ${fullName}\n\n` +
          `La solicitud ha sido aprobada automaticamente.`
        );
      }

      return `<b>Identidad Verificada</b>\n\n` +
        `Tu solicitud de cambio de contrasena ha sido aprobada.\n\n` +
        `Un SuperAdmin procesara tu solicitud en breve y recibiras un correo con tu nueva contrasena.`;
    } else {
      return `<b>Verificacion Fallida</b>\n\n` +
        `Los datos proporcionados no coinciden con los registros.\n\n` +
        `Por favor intenta nuevamente o contacta a soporte.`;
    }
  }

  return '';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const botToken = url.searchParams.get('token');

    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token required in URL parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const update: TelegramUpdate = await req.json();

    if (!update.message) {
      return new Response(
        JSON.stringify({ ok: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const chatId = update.message.chat.id.toString();
    const text = update.message.text || '';
    const firstName = update.message.from.first_name;

    let responseMessage = '';

    const { data: businessAdmin } = await supabase
      .from('business_admins')
      .select('id, email, business_id, is_superadmin, telegram_chat_id')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (businessAdmin) {
      const { data: activeConversation } = await supabase
        .from('telegram_conversations')
        .select('*')
        .eq('business_id', businessAdmin.business_id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeConversation && !text.startsWith('/')) {
        if (activeConversation.conversation_type === 'password_recovery') {
          responseMessage = await handlePasswordRecoveryConversation(
            supabase,
            botToken,
            chatId,
            text,
            activeConversation,
            businessAdmin
          );

          if (responseMessage) {
            await sendTelegramMessage(botToken, chatId, responseMessage);
            return new Response(
              JSON.stringify({ ok: true }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }
      }
    }

    if (text === '/superadmin') {
      const { data: superadmin, error: findError } = await supabase
        .from('business_admins')
        .select('id, email, telegram_chat_id')
        .eq('is_superadmin', true)
        .maybeSingle();

      if (findError || !superadmin) {
        responseMessage = `<b>Error</b>\n\nNo se encontro un SuperAdmin en el sistema.`;
      } else if (superadmin.telegram_chat_id === chatId) {
        responseMessage = `<b>Ya estas conectado!</b>\n\n` +
          `Tu Chat ID ya esta asociado a tu cuenta de SuperAdmin.\n\n` +
          `<i>SafeTransfer Slide</i>`;
      } else {
        const { error: updateError } = await supabase
          .from('business_admins')
          .update({ telegram_chat_id: chatId })
          .eq('id', superadmin.id);

        if (updateError) {
          responseMessage = `<b>Error al conectar</b>\n\n${updateError.message}`;
        } else {
          responseMessage = `<b>Conexion exitosa!</b>\n\n` +
            `Tu Chat ID ha sido asociado a tu cuenta de SuperAdmin (${superadmin.email}).\n\n` +
            `Ahora recibiras notificaciones cuando:\n` +
            `- Un negocio envie un mensaje de soporte\n` +
            `- Un negocio solicite recuperacion de contrasena\n` +
            `- Notificaciones del sistema\n\n` +
            `<i>SafeTransfer Slide</i>`;
        }
      }
    } else if (text.startsWith('/conectar ')) {
      const businessId = text.replace('/conectar ', '').trim();

      const { data: business, error: findError } = await supabase
        .from('business_admins')
        .select('id, email, business_id, telegram_chat_id')
        .eq('business_id', businessId)
        .eq('is_superadmin', false)
        .maybeSingle();

      if (findError || !business) {
        responseMessage = `<b>Codigo no valido</b>\n\n` +
          `No se encontro un negocio con ese codigo.\n\n` +
          `Verifica que hayas copiado correctamente el codigo desde tu panel de administracion.`;
      } else if (business.telegram_chat_id === chatId) {
        responseMessage = `<b>Ya estas conectado!</b>\n\n` +
          `Tu Chat ID ya esta asociado a tu cuenta de negocio.\n\n` +
          `<i>SafeTransfer Slide</i>`;
      } else {
        const { error: updateError } = await supabase
          .from('business_admins')
          .update({ telegram_chat_id: chatId })
          .eq('id', business.id);

        if (updateError) {
          responseMessage = `<b>Error al conectar</b>\n\n${updateError.message}`;
        } else {
          responseMessage = `<b>Conexion exitosa!</b>\n\n` +
            `Tu Chat ID ha sido asociado a tu cuenta de negocio (${business.email}).\n\n` +
            `Ahora recibiras notificaciones importantes sobre tu negocio.\n\n` +
            `<i>SafeTransfer Slide</i>`;
        }
      }
    } else if (text === '/start' || text === '/chatid') {
      responseMessage = `<b>Bienvenido ${firstName}!</b>\n\n` +
        `Tu <b>Chat ID</b> es:\n<code>${chatId}</code>\n\n` +
        `<b>Para conectar automaticamente:</b>\n\n` +
        `<b>SuperAdmin:</b> Escribe <code>/superadmin</code>\n` +
        `<b>Negocio:</b> Escribe <code>/conectar [tu-codigo]</code>\n\n` +
        `O copia tu Chat ID y pegalo manualmente en tu panel.\n\n` +
        `<i>SafeTransfer Slide</i>`;
    } else if (text === '/help') {
      responseMessage = `<b>Comandos disponibles:</b>\n\n` +
        `<b>/superadmin</b> - Conectar como SuperAdmin\n` +
        `<b>/conectar [codigo]</b> - Conectar un negocio\n` +
        `<b>/start</b> - Ver tu Chat ID\n` +
        `<b>/chatid</b> - Ver tu Chat ID\n` +
        `<b>/help</b> - Ver esta ayuda\n\n` +
        `<i>SafeTransfer Slide</i>`;
    } else {
      responseMessage = `Hola ${firstName}!\n\n` +
        `Tu Chat ID es: <code>${chatId}</code>\n\n` +
        `Usa <b>/help</b> para ver los comandos disponibles.`;
    }

    await sendTelegramMessage(botToken, chatId, responseMessage);

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});