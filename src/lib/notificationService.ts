import { supabase } from './supabase';

interface SendNotificationParams {
  businessId: string;
  templateKey: string;
  variables: Record<string, string>;
}

interface ScheduleNotificationParams {
  businessId: string;
  notificationType: string;
  scheduledFor: Date;
  templateKey: string;
  variables: Record<string, string>;
}

export async function sendTelegramNotification({ businessId, templateKey, variables }: SendNotificationParams): Promise<boolean> {
  try {
    const { data: businessAdmin } = await supabase
      .from('business_admins')
      .select('telegram_chat_id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (!businessAdmin?.telegram_chat_id) {
      console.log('Business does not have Telegram connected');
      return false;
    }

    const { data: template } = await supabase
      .from('notification_templates')
      .select('message_template')
      .eq('template_key', templateKey)
      .maybeSingle();

    if (!template) {
      console.error('Template not found:', templateKey);
      return false;
    }

    let message = template.message_template;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Telegram bot token not configured');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: businessAdmin.telegram_chat_id,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

export async function createPasswordRecoveryConversation(businessId: string): Promise<void> {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('business_name')
      .eq('id', businessId)
      .maybeSingle();

    await supabase
      .from('telegram_conversations')
      .insert({
        business_id: businessId,
        conversation_type: 'password_recovery',
        state: 'waiting_response',
        context: {},
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });

    await sendTelegramNotification({
      businessId,
      templateKey: 'password_change_request',
      variables: {
        business_name: business?.business_name || 'Negocio',
      },
    });
  } catch (error) {
    console.error('Error creating password recovery conversation:', error);
  }
}

export async function scheduleNotification({ businessId, notificationType, scheduledFor, templateKey, variables }: ScheduleNotificationParams): Promise<void> {
  try {
    const { data: template } = await supabase
      .from('notification_templates')
      .select('message_template')
      .eq('template_key', templateKey)
      .maybeSingle();

    if (!template) {
      console.error('Template not found:', templateKey);
      return;
    }

    let message = template.message_template;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    await supabase
      .from('scheduled_notifications')
      .insert({
        business_id: businessId,
        notification_type: notificationType,
        scheduled_for: scheduledFor.toISOString(),
        message,
      });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function send2FACode(businessId: string, code: string): Promise<boolean> {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('business_name')
      .eq('id', businessId)
      .maybeSingle();

    return await sendTelegramNotification({
      businessId,
      templateKey: '2fa_code',
      variables: {
        business_name: business?.business_name || 'Negocio',
        code,
      },
    });
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    return false;
  }
}
