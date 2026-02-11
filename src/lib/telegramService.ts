import { supabase } from './supabase';

interface SendTelegramParams {
  chatId: string;
  message: string;
  botToken?: string;
  businessId?: string;
}

interface TelegramResult {
  success: boolean;
  error?: string;
}

interface SuperadminTelegramConfig {
  botToken: string | null;
  chatId: string | null;
}

export async function getSuperadminTelegramConfig(): Promise<SuperadminTelegramConfig> {
  const { data } = await supabase
    .from('business_admins')
    .select('telegram_bot_token, telegram_chat_id')
    .eq('is_superadmin', true)
    .limit(1)
    .maybeSingle();

  return {
    botToken: data?.telegram_bot_token || null,
    chatId: data?.telegram_chat_id || null,
  };
}

export async function getTelegramBotToken(): Promise<string | null> {
  const config = await getSuperadminTelegramConfig();
  return config.botToken;
}

export async function getBusinessTelegramConfig(businessId: string): Promise<{ chatId: string | null; enabled: boolean; businessName: string }> {
  const [settingsRes, businessRes] = await Promise.all([
    supabase
      .from('business_settings')
      .select('telegram_chat_id, telegram_notifications_enabled')
      .eq('business_id', businessId)
      .maybeSingle(),
    supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .maybeSingle()
  ]);

  return {
    chatId: settingsRes.data?.telegram_chat_id || null,
    enabled: settingsRes.data?.telegram_notifications_enabled === true,
    businessName: businessRes.data?.name || 'Negocio',
  };
}

export async function sendTelegram(params: SendTelegramParams): Promise<TelegramResult> {
  const { chatId, message, botToken: providedToken } = params;

  try {
    const botToken = providedToken || await getTelegramBotToken();

    if (!botToken) {
      return { success: false, error: 'Bot de Telegram no configurado' };
    }

    if (!chatId) {
      return { success: false, error: 'Chat ID no configurado' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-telegram`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_token: botToken,
          chat_id: chatId,
          message,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Error al enviar mensaje de Telegram' };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: errorMessage };
  }
}

export async function sendTelegramToSuperadmin(message: string): Promise<TelegramResult> {
  const config = await getSuperadminTelegramConfig();

  if (!config.botToken || !config.chatId) {
    return { success: false, error: 'Telegram no configurado para el SuperAdmin' };
  }

  return sendTelegram({
    chatId: config.chatId,
    message,
    botToken: config.botToken
  });
}

export async function sendTelegramToBusinessIfEnabled(businessId: string, message: string): Promise<TelegramResult> {
  const config = await getBusinessTelegramConfig(businessId);

  if (!config.enabled || !config.chatId) {
    return { success: false, error: 'Telegram no habilitado para este negocio' };
  }

  return sendTelegram({ chatId: config.chatId, message, businessId });
}

export const telegramTemplates = {
  notification: (businessName: string, subject: string, message: string) =>
    `<b>Nueva Notificacion</b>\n\nHola <b>${businessName}</b>,\n\n<b>${subject}</b>\n\n${message}\n\n<i>MoneyTransfer Display</i>`,

  paymentApproved: (businessName: string, amount: number, currency: string, invoiceNumber?: string) =>
    `<b>Pago Confirmado</b>\n\nHola <b>${businessName}</b>,\n\nTu pago ha sido registrado exitosamente.\n\n<b>Monto:</b> $${amount.toLocaleString()} ${currency}${invoiceNumber ? `\n<b>Factura:</b> ${invoiceNumber}` : ''}\n\nGracias por tu pago.\n\n<i>MoneyTransfer Display</i>`,

  paymentPending: (businessName: string, amount: number, currency: string, dueDate: string) =>
    `<b>Recordatorio de Pago</b>\n\nHola <b>${businessName}</b>,\n\nTienes un pago pendiente.\n\n<b>Monto:</b> $${amount.toLocaleString()} ${currency}\n<b>Vencimiento:</b> ${dueDate}\n\nPor favor realiza tu pago a tiempo.\n\n<i>MoneyTransfer Display</i>`,

  paymentOverdue: (businessName: string, amount: number, currency: string, dueDate: string) =>
    `<b>PAGO VENCIDO</b>\n\nHola <b>${businessName}</b>,\n\nTu pago esta vencido.\n\n<b>Monto:</b> $${amount.toLocaleString()} ${currency}\n<b>Vencio el:</b> ${dueDate}\n\nPor favor realiza tu pago lo antes posible para evitar la suspension del servicio.\n\n<i>MoneyTransfer Display</i>`,

  subscriptionExpiring: (businessName: string, daysLeft: number, expirationDate: string) =>
    `<b>Suscripcion por Vencer</b>\n\nHola <b>${businessName}</b>,\n\nTu suscripcion vence en <b>${daysLeft} dia${daysLeft > 1 ? 's' : ''}</b>.\n\n<b>Fecha de vencimiento:</b> ${expirationDate}\n\nRenueva tu suscripcion para continuar usando el servicio sin interrupciones.\n\n<i>MoneyTransfer Display</i>`,

  subscriptionExpired: (businessName: string) =>
    `<b>Suscripcion Vencida</b>\n\nHola <b>${businessName}</b>,\n\nTu suscripcion ha vencido.\n\nPor favor contacta al administrador para renovar tu suscripcion y reactivar tu servicio.\n\n<i>MoneyTransfer Display</i>`,

  passwordRecoveryApproved: (adminName: string, newPassword: string) =>
    `<b>Solicitud de Contrasena Aprobada</b>\n\nHola <b>${adminName}</b>,\n\nTu solicitud ha sido aprobada.\n\nTu nueva contrasena es:\n<code>${newPassword}</code>\n\n<i>Por seguridad, cambia esta contrasena despues de iniciar sesion.</i>\n\n<i>MoneyTransfer Display</i>`,

  passwordRecoveryRejected: (adminName: string, reason?: string) =>
    `<b>Solicitud de Contrasena Rechazada</b>\n\nHola <b>${adminName}</b>,\n\nTu solicitud ha sido rechazada.${reason ? `\n\n<b>Motivo:</b> ${reason}` : ''}\n\nContacta al soporte si crees que es un error.\n\n<i>MoneyTransfer Display</i>`,

  messageFromSuperadmin: (businessName: string, subject: string, message: string) =>
    `<b>Nuevo Mensaje del Administrador</b>\n\nHola <b>${businessName}</b>,\n\n<b>${subject}</b>\n\n${message}\n\n<i>MoneyTransfer Display</i>`,

  statusChange: (businessName: string, newStatus: string, reason?: string) =>
    `<b>Actualizacion de Estado</b>\n\nHola <b>${businessName}</b>,\n\nTu cuenta ha sido actualizada a: <b>${newStatus.toUpperCase()}</b>${reason ? `\n\n<b>Motivo:</b> ${reason}` : ''}\n\n<i>MoneyTransfer Display</i>`,

  accountBlocked: (businessName: string, reason?: string) =>
    `<b>Cuenta Bloqueada</b>\n\nHola <b>${businessName}</b>,\n\nTu cuenta ha sido bloqueada.${reason ? `\n\n<b>Motivo:</b> ${reason}` : ''}\n\nPor favor contacta al administrador para mas informacion.\n\n<i>MoneyTransfer Display</i>`,

  accountReactivated: (businessName: string) =>
    `<b>Cuenta Reactivada</b>\n\nHola <b>${businessName}</b>,\n\nTu cuenta ha sido reactivada exitosamente.\n\nYa puedes acceder a todos los servicios normalmente.\n\n<i>MoneyTransfer Display</i>`,

  trialEnding: (businessName: string, daysLeft: number) =>
    `<b>Periodo de Prueba por Terminar</b>\n\nHola <b>${businessName}</b>,\n\nTu periodo de prueba termina en <b>${daysLeft} dia${daysLeft > 1 ? 's' : ''}</b>.\n\nContacta al administrador para suscribirte y continuar usando el servicio.\n\n<i>MoneyTransfer Display</i>`,

  welcomeMessage: (businessName: string) =>
    `<b>Bienvenido a MoneyTransfer Display</b>\n\nHola <b>${businessName}</b>,\n\nTu cuenta ha sido vinculada exitosamente con Telegram.\n\nAhora recibiras notificaciones importantes aqui:\n- Confirmacion de pagos\n- Recordatorios de vencimiento\n- Mensajes del administrador\n- Alertas del sistema\n\n<i>MoneyTransfer Display</i>`,

  supportMessageToSuperadmin: (businessName: string, businessEmail: string, subject: string, message: string) =>
    `<b>Nuevo Mensaje de Soporte</b>\n\n<b>Negocio:</b> ${businessName}\n<b>Email:</b> ${businessEmail}\n\n<b>Asunto:</b> ${subject}\n\n${message}\n\n<i>Responde desde el panel de SuperAdmin</i>`,

  passwordRecoveryRequestToSuperadmin: (businessName: string, adminName: string, adminEmail: string, reason: string) =>
    `<b>Nueva Solicitud de Recuperacion</b>\n\n<b>Negocio:</b> ${businessName}\n<b>Admin:</b> ${adminName}\n<b>Email:</b> ${adminEmail}\n\n<b>Motivo:</b> ${reason}\n\n<i>Revisa desde el panel de SuperAdmin</i>`,
};
