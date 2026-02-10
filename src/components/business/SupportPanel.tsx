import { useState, useEffect } from 'react';
import { MessageSquare, Send, Key, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';
import { sendEmail, emailTemplates, getSuperadminEmail } from '../../lib/emailService';
import { sendTelegramToSuperadmin, telegramTemplates } from '../../lib/telegramService';

interface Message {
  id: string;
  subject: string;
  message: string;
  from_business: boolean;
  status: string;
  read: boolean;
  created_at: string;
}

interface RecoveryRequest {
  id: string;
  status: string;
  reason: string;
  created_at: string;
  resolved_at: string | null;
}

export default function SupportPanel() {
  const { business, admin, language } = useBusiness();
  const [messages, setMessages] = useState<Message[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
  });

  const [recoveryForm, setRecoveryForm] = useState({
    reason: '',
  });

  useEffect(() => {
    if (business?.id) {
      loadData();
    }
  }, [business?.id]);

  const loadData = async () => {
    if (!business?.id) return;

    try {
      const [messagesRes, recoveriesRes] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('password_recovery_requests')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
      ]);

      if (messagesRes.data) setMessages(messagesRes.data);
      if (recoveriesRes.data) setRecoveryRequests(recoveriesRes.data);
    } catch (error) {
      console.error('Error loading support data:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !admin) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          business_id: business.id,
          from_business: true,
          sender_name: admin.full_name,
          subject: messageForm.subject,
          message: messageForm.message,
          status: 'unread',
          read: false,
        });

      if (error) throw error;

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          business_id: business.id,
          type: 'support_message',
          title: 'Nuevo mensaje de soporte',
          message: `${business.name} ha enviado un mensaje: ${messageForm.subject}`,
          from_superadmin: false,
          priority: 'normal',
          read: false,
        });

      if (notifError) console.error('Notification error:', notifError);

      const superadminEmail = await getSuperadminEmail();
      if (superadminEmail) {
        const emailHtml = emailTemplates.supportMessageToSuperadmin(
          business.name,
          business.contact_email || admin.email,
          messageForm.subject,
          messageForm.message
        );

        await sendEmail({
          to: superadminEmail,
          subject: `Nuevo mensaje de soporte: ${business.name}`,
          html: emailHtml,
          businessId: business.id,
          emailType: 'support',
        });
      }

      const telegramMessage = telegramTemplates.supportMessageToSuperadmin(
        business.name,
        business.contact_email || admin.email,
        messageForm.subject,
        messageForm.message
      );
      await sendTelegramToSuperadmin(telegramMessage);

      alert(getTranslation(language, 'messageSentSuccessfully'));
      setMessageForm({ subject: '', message: '' });
      setShowMessageForm(false);
      await loadData();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(getTranslation(language, 'errorSendingMessage'));
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !admin) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('password_recovery_requests')
        .insert({
          business_id: business.id,
          admin_email: admin.email,
          admin_name: admin.full_name,
          reason: recoveryForm.reason,
          status: 'pending',
        });

      if (error) throw error;

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          business_id: business.id,
          type: 'password_recovery',
          title: 'Solicitud de recuperacion de contrasena',
          message: `${business.name} ha solicitado recuperacion de contrasena`,
          from_superadmin: false,
          priority: 'high',
          read: false,
        });

      if (notifError) console.error('Notification error:', notifError);

      const superadminEmail = await getSuperadminEmail();
      if (superadminEmail) {
        const emailHtml = emailTemplates.passwordRecoveryRequestToSuperadmin(
          business.name,
          admin.full_name,
          admin.email,
          recoveryForm.reason
        );

        await sendEmail({
          to: superadminEmail,
          subject: `Nueva solicitud de recuperacion de contrasena: ${business.name}`,
          html: emailHtml,
          businessId: business.id,
          emailType: 'password_recovery',
        });
      }

      const telegramMessage = telegramTemplates.passwordRecoveryRequestToSuperadmin(
        business.name,
        admin.full_name,
        admin.email,
        recoveryForm.reason
      );
      await sendTelegramToSuperadmin(telegramMessage);

      alert(getTranslation(language, 'requestSentSuccessfully'));
      setRecoveryForm({ reason: '' });
      setShowRecoveryForm(false);
      await loadData();
    } catch (error) {
      console.error('Error requesting recovery:', error);
      alert(getTranslation(language, 'errorSendingRequest'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowMessageForm(true)}
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl text-left transition-all shadow-lg"
        >
          <MessageSquare className="w-8 h-8 mb-3" />
          <h3 className="text-xl font-bold mb-2">{getTranslation(language, 'sendMessage')}</h3>
          <p className="text-blue-100">{getTranslation(language, 'contactSupportTeam')}</p>
        </button>

        <button
          onClick={() => setShowRecoveryForm(true)}
          className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-6 rounded-xl text-left transition-all shadow-lg"
        >
          <Key className="w-8 h-8 mb-3" />
          <h3 className="text-xl font-bold mb-2">{getTranslation(language, 'recoverPassword')}</h3>
          <p className="text-orange-100">{getTranslation(language, 'requestAccessHelp')}</p>
        </button>
      </div>

      {showMessageForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">{getTranslation(language, 'sendSupportMessage')}</h4>
            <form onSubmit={sendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {getTranslation(language, 'subject')}
                </label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  placeholder={getTranslation(language, 'howCanWeHelp')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {getTranslation(language, 'message')}
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  placeholder={getTranslation(language, 'describeYourQuery')}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {loading ? getTranslation(language, 'sending') : getTranslation(language, 'sendMessage')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMessageForm(false)}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-all"
                >
                  {getTranslation(language, 'cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecoveryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">{getTranslation(language, 'requestPasswordRecovery')}</h4>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">{getTranslation(language, 'important')}</p>
                  <p>{getTranslation(language, 'recoveryInfo')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={requestPasswordRecovery} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {getTranslation(language, 'reasonForRequest')}
                </label>
                <textarea
                  value={recoveryForm.reason}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, reason: e.target.value })}
                  placeholder={getTranslation(language, 'explainReason')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  {loading ? getTranslation(language, 'sending') : getTranslation(language, 'sendRequest')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecoveryForm(false)}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-all"
                >
                  {getTranslation(language, 'cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            {getTranslation(language, 'myMessages')}
          </h3>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{getTranslation(language, 'noMessages')}</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg border ${
                    msg.from_business
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{msg.subject}</h4>
                    {!msg.read && msg.from_business === false && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {getTranslation(language, 'newLabel')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{msg.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{msg.from_business ? getTranslation(language, 'sent') : getTranslation(language, 'received')}</span>
                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-600" />
            {getTranslation(language, 'recoveryRequests')}
          </h3>
          <div className="space-y-3">
            {recoveryRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{getTranslation(language, 'noRequests')}</p>
            ) : (
              recoveryRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      req.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : req.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {req.status === 'pending' && <><Clock className="w-3 h-3 inline mr-1" />{getTranslation(language, 'pending')}</>}
                      {req.status === 'resolved' && <><CheckCircle className="w-3 h-3 inline mr-1" />{getTranslation(language, 'resolved')}</>}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{req.reason}</p>
                  {req.resolved_at && (
                    <p className="text-xs text-green-600 mt-2">
                      {getTranslation(language, 'resolvedOn')} {new Date(req.resolved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
