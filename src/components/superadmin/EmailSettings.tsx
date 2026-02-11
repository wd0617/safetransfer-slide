import { useState, useEffect } from 'react';
import { Mail, Save, CheckCircle, AlertCircle, Send, History, Loader2, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../contexts/BusinessContext';

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  email_type: string;
  status: string;
  created_at: string;
}

export default function EmailSettings() {
  const { admin } = useBusiness();
  const [notificationEmail, setNotificationEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [originalTelegramToken, setOriginalTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [originalChatId, setOriginalChatId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [telegramMessage, setTelegramMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    if (admin?.id) {
      loadEmailSettings();
      loadEmailLogs();
    }
  }, [admin?.id]);

  const loadEmailSettings = async () => {
    if (!admin?.id) return;

    try {
      const { data, error } = await supabase
        .from('business_admins')
        .select('notification_email, email, telegram_bot_token, telegram_chat_id')
        .eq('id', admin.id)
        .maybeSingle();

      if (error) throw error;

      const email = data?.notification_email || data?.email || '';
      setNotificationEmail(email);
      setOriginalEmail(email);

      const token = data?.telegram_bot_token || '';
      setTelegramBotToken(token);
      setOriginalTelegramToken(token);

      const chatId = data?.telegram_chat_id || '';
      setTelegramChatId(chatId);
      setOriginalChatId(chatId);
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    if (!admin?.id) {
      setMessage({ type: 'error', text: 'No se pudo identificar el administrador' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('business_admins')
        .update({ notification_email: notificationEmail })
        .eq('id', admin.id);

      if (error) throw error;

      setOriginalEmail(notificationEmail);
      setMessage({ type: 'success', text: 'Email de notificaciones guardado correctamente' });
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuracion' });
    } finally {
      setSaving(false);
    }
  };

  const saveTelegramSettings = async () => {
    if (!admin?.id) {
      setTelegramMessage({ type: 'error', text: 'No se pudo identificar el administrador' });
      return;
    }

    setSavingTelegram(true);
    setTelegramMessage(null);

    try {
      const { error } = await supabase
        .from('business_admins')
        .update({
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId
        })
        .eq('id', admin.id);

      if (error) throw error;

      setOriginalTelegramToken(telegramBotToken);
      setOriginalChatId(telegramChatId);
      setTelegramMessage({ type: 'success', text: 'Configuracion de Telegram guardada correctamente' });
    } catch (error) {
      console.error('Error saving telegram settings:', error);
      setTelegramMessage({ type: 'error', text: 'Error al guardar la configuracion' });
    } finally {
      setSavingTelegram(false);
    }
  };

  const sendTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      setTelegramMessage({ type: 'error', text: 'Ingresa el Bot Token y Chat ID primero' });
      return;
    }

    setTestingTelegram(true);
    setTelegramMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-telegram`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bot_token: telegramBotToken,
            chat_id: telegramChatId,
            message: '<b>Prueba Exitosa</b>\n\nLas notificaciones por Telegram estan configuradas correctamente.\n\nRecibiras notificaciones aqui cuando:\n- Un negocio envie un mensaje de soporte\n- Un negocio solicite recuperacion de contrasena\n\n<i>MoneyTransfer Display</i>',
            parse_mode: 'HTML',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar mensaje de Telegram');
      }

      setTelegramMessage({ type: 'success', text: 'Mensaje de prueba enviado correctamente' });
    } catch (error: any) {
      console.error('Error sending test telegram:', error);
      setTelegramMessage({ type: 'error', text: error.message || 'Error al enviar mensaje de prueba' });
    } finally {
      setTestingTelegram(false);
    }
  };

  const sendTestEmail = async () => {
    if (!notificationEmail) {
      setMessage({ type: 'error', text: 'Ingresa un email primero' });
      return;
    }

    setTestingEmail(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: notificationEmail,
            subject: 'Prueba de notificaciones - MoneyTransfer Display',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
                  .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
                  .success { background: #d1fae5; border-left: 4px solid #059669; padding: 12px; margin: 15px 0; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2 style="margin:0;">Prueba de Email Exitosa</h2>
                </div>
                <div class="content">
                  <div class="success">
                    <p style="margin:0;"><strong>Las notificaciones por email estan configuradas correctamente.</strong></p>
                  </div>
                  <p>Este es un email de prueba para verificar que las notificaciones funcionan correctamente.</p>
                  <p>Ahora recibiras notificaciones cuando:</p>
                  <ul>
                    <li>Un negocio envie un mensaje de soporte</li>
                    <li>Un negocio solicite recuperacion de contrasena</li>
                    <li>Y otras actividades importantes</li>
                  </ul>
                </div>
                <div class="footer">
                  <p>MoneyTransfer Display - Sistema de Notificaciones</p>
                </div>
              </body>
              </html>
            `,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email');
      }

      setMessage({ type: 'success', text: 'Email de prueba enviado correctamente' });
      loadEmailLogs();
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setMessage({ type: 'error', text: error.message || 'Error al enviar email de prueba' });
    } finally {
      setTestingEmail(false);
    }
  };

  const getEmailTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      notification: 'Notificacion',
      password_recovery: 'Recuperacion',
      message: 'Mensaje',
      status_change: 'Cambio estado',
      support: 'Soporte',
    };
    return labels[type] || type;
  };

  const getEmailTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      notification: 'bg-blue-100 text-blue-800',
      password_recovery: 'bg-orange-100 text-orange-800',
      message: 'bg-green-100 text-green-800',
      status_change: 'bg-yellow-100 text-yellow-800',
      support: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuracion de Email</h2>
          <p className="text-gray-600 mt-1">
            Configura el email donde recibiras las notificaciones
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-300 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">Notificaciones por Email</h3>
            <p className="text-blue-800 text-sm mb-4">
              Recibiras notificaciones en este email cuando:
            </p>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>- Un negocio envie un mensaje de soporte</li>
              <li>- Un negocio solicite recuperacion de contrasena</li>
              <li>- Otras actividades importantes del sistema</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Email de Notificaciones
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="tu-email@ejemplo.com"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendTestEmail}
                disabled={testingEmail || !notificationEmail}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Probar
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-800/50 text-green-100'
                : 'bg-red-900/30 border border-red-800/50 text-red-100'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <button
            onClick={saveEmailSettings}
            disabled={saving || notificationEmail === originalEmail}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Guardando...' : 'Guardar Configuracion'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 border border-cyan-300 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-cyan-500/20 p-3 rounded-lg">
            <MessageCircle className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-cyan-900 mb-2">Notificaciones por Telegram (Automaticas)</h3>
            <p className="text-cyan-800 text-sm mb-2">
              Configuracion automatica de notificaciones:
            </p>
            <ol className="text-cyan-800 text-sm space-y-2 list-decimal list-inside">
              <li>
                <strong>Crea tu bot</strong> con @BotFather en Telegram y obten el token
              </li>
              <li>
                <strong>Configura el Webhook</strong> (despues de guardar tu Bot Token):
                {telegramBotToken ? (
                  <div className="bg-white p-2 rounded border border-cyan-300 mt-1">
                    <a
                      href={`https://api.telegram.org/bot${telegramBotToken}/setWebhook?url=${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-webhook?token=${telegramBotToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-700 hover:text-cyan-900 underline text-xs font-mono break-all"
                    >
                      Haz clic aqui para configurar el webhook automaticamente
                    </a>
                  </div>
                ) : (
                  <div className="bg-white p-2 rounded border border-cyan-300 mt-1 text-xs text-gray-500 italic">
                    Primero guarda tu Bot Token para ver el enlace del webhook
                  </div>
                )}
              </li>
              <li>
                <strong>Para ti (SuperAdmin):</strong> Abre tu bot en Telegram y escribe <code className="bg-cyan-200 px-1 rounded">/superadmin</code>
              </li>
              <li>
                <strong>Para tus negocios:</strong> Cada negocio escribe <code className="bg-cyan-200 px-1 rounded">/conectar [business_id]</code> en el bot
              </li>
              <li>
                El Chat ID se guardara automaticamente
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-cyan-500" />
          <h3 className="text-xl font-bold text-white">Configuracion de Telegram</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Bot Token de Telegram
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-2">
              Obten el token creando un bot con @BotFather en Telegram
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Tu Chat ID (donde recibiras notificaciones)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="123456789"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                onClick={sendTestTelegram}
                disabled={testingTelegram || !telegramBotToken || !telegramChatId}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingTelegram ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Probar
              </button>
            </div>

            {telegramBotToken && (
              <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-4 mt-3">
                <p className="text-cyan-100 text-sm font-semibold mb-2">Como obtener tu Chat ID:</p>
                <ol className="text-cyan-200 text-sm space-y-2 ml-4 list-decimal">
                  <li>
                    Abre Telegram y busca tu bot (usa el nombre que le diste)
                  </li>
                  <li>
                    Haz clic en "Iniciar" o envia cualquier mensaje a tu bot
                  </li>
                  <li>
                    Abre este enlace en tu navegador:
                    <div className="mt-1 bg-slate-900 p-2 rounded border border-cyan-600 break-all">
                      <a
                        href={`https://api.telegram.org/bot${telegramBotToken}/getUpdates`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline text-xs"
                      >
                        https://api.telegram.org/bot{telegramBotToken.substring(0, 15)}...{telegramBotToken.substring(telegramBotToken.length - 10)}/getUpdates
                      </a>
                    </div>
                  </li>
                  <li>
                    Busca el numero que aparece despues de <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">"chat":{"{"}{"id"}:</code>
                  </li>
                  <li>
                    Copia ese numero y pegalo arriba
                  </li>
                </ol>
              </div>
            )}
          </div>

          {telegramMessage && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              telegramMessage.type === 'success'
                ? 'bg-green-900/30 border border-green-800/50 text-green-100'
                : 'bg-red-900/30 border border-red-800/50 text-red-100'
            }`}>
              {telegramMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm">{telegramMessage.text}</p>
            </div>
          )}

          <button
            onClick={saveTelegramSettings}
            disabled={savingTelegram || (telegramBotToken === originalTelegramToken && telegramChatId === originalChatId)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingTelegram ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {savingTelegram ? 'Guardando...' : 'Guardar Configuracion de Telegram'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-white">Historial de Emails Enviados</h3>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : emailLogs.length === 0 ? (
          <div className="text-center py-8 text-white">
            No hay emails enviados aun
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {emailLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getEmailTypeColor(log.email_type)}`}>
                    {getEmailTypeLabel(log.email_type)}
                  </span>
                  <div>
                    <p className="text-white font-medium text-sm">{log.subject}</p>
                    <p className="text-white text-xs">{log.recipient_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    log.status === 'sent' ? 'bg-green-900/30 text-green-100' : 'bg-red-900/30 text-red-100'
                  }`}>
                    {log.status === 'sent' ? 'Enviado' : 'Fallido'}
                  </span>
                  <span className="text-white text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
