import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Calendar, Eye, X, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail, emailTemplates, getBusinessEmail } from '../../lib/emailService';
import { sendTelegramToBusinessIfEnabled, telegramTemplates, getBusinessTelegramConfig } from '../../lib/telegramService';

interface Message {
  id: string;
  business_id: string;
  business_name: string;
  subject: string;
  message: string;
  from_business: boolean;
  from_superadmin: boolean;
  sender_name: string;
  read: boolean;
  created_at: string;
}

export default function MessagesManager() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    loadMessages();
    loadBusinesses();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          businesses:business_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMessages = data?.map(m => ({
        id: m.id,
        business_id: m.business_id,
        business_name: m.businesses?.name || 'Unknown',
        subject: m.subject,
        message: m.message,
        from_business: m.from_business,
        from_superadmin: m.from_superadmin,
        sender_name: m.sender_name,
        read: m.read,
        created_at: m.created_at,
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, contact_email')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const openMessage = async (message: Message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);

    if (!message.read && message.from_business) {
      try {
        const { error: messageError } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', message.id);

        if (messageError) throw messageError;

        const { error: notifError } = await supabase
          .from('notifications')
          .delete()
          .eq('business_id', message.business_id)
          .eq('type', 'message')
          .eq('read', false);

        if (notifError) console.error('Error deleting notification:', notifError);

        await loadMessages();
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const [sending, setSending] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBusiness || !subject || !messageText) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSending(true);

    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          business_id: selectedBusiness,
          from_business: false,
          from_superadmin: true,
          sender_name: 'SuperAdmin',
          subject: subject,
          message: messageText,
          status: 'unread',
          read: false,
        });

      if (messageError) throw messageError;

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          business_id: selectedBusiness,
          type: 'message',
          title: 'Nuevo mensaje del SuperAdmin',
          message: `Asunto: ${subject}`,
          from_superadmin: true,
          priority: 'normal',
          read: false,
        });

      if (notifError) console.error('Notification error:', notifError);

      const businessInfo = await getBusinessEmail(selectedBusiness);
      if (businessInfo.email && businessInfo.enabled) {
        const emailHtml = emailTemplates.messageFromSuperadmin(
          businessInfo.name,
          subject,
          messageText
        );

        await sendEmail({
          to: businessInfo.email,
          subject: `Nuevo mensaje: ${subject}`,
          html: emailHtml,
          businessId: selectedBusiness,
          emailType: 'message',
        });
      }

      const telegramConfig = await getBusinessTelegramConfig(selectedBusiness);
      if (telegramConfig.enabled && telegramConfig.chatId) {
        const telegramMsg = telegramTemplates.messageFromSuperadmin(
          telegramConfig.businessName,
          subject,
          messageText
        );
        await sendTelegramToBusinessIfEnabled(selectedBusiness, telegramMsg);
      }

      alert('Mensaje enviado exitosamente');
      setShowCompose(false);
      setSelectedBusiness('');
      setSubject('');
      setMessageText('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            Mensajes y Comunicaciones
          </h2>
          <p className="text-gray-600 mt-1">Enviar mensajes a los negocios del sistema</p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
        >
          <Send className="w-5 h-5" />
          Nuevo Mensaje
        </button>
      </div>

      {showCompose && (
        <form onSubmit={sendMessage} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Destinatario
            </label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar negocio...</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} ({business.contact_email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Asunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del mensaje"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Mensaje
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={sending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {sending ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
            <button
              type="button"
              onClick={() => setShowCompose(false)}
              disabled={sending}
              className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-white">Negocio</th>
                <th className="text-left py-4 px-6 font-semibold text-white">De/Para</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Asunto</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Mensaje</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Estado</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Fecha</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Acción</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white">
                    No hay mensajes
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">{message.business_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {message.from_business ? (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-100 rounded-full text-sm font-medium">
                          Recibido de {message.sender_name}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-500/20 text-green-100 rounded-full text-sm font-medium">
                          Enviado por ti
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-white font-semibold">{message.subject}</td>
                    <td className="py-4 px-6 text-white max-w-xs truncate">{message.message}</td>
                    <td className="py-4 px-6">
                      {!message.read && message.from_business ? (
                        <span className="px-3 py-1 bg-red-500/20 text-red-100 rounded-full text-sm font-medium">
                          No leído
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-500/20 text-white rounded-full text-sm font-medium">
                          Leído
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(message.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => openMessage(message)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-bold text-white">Detalles del Mensaje</h3>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm text-white">Negocio</p>
                      <p className="text-white font-semibold">{selectedMessage.business_name}</p>
                    </div>
                  </div>
                  {selectedMessage.from_business ? (
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-100 rounded-lg text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      De: {selectedMessage.sender_name}
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-green-500/20 text-green-100 rounded-lg text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Enviado por ti
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-white text-sm">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Asunto
                  </label>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-white font-semibold text-lg">{selectedMessage.subject}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Mensaje
                  </label>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-white whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {selectedMessage.from_business && (
                  <button
                    onClick={() => {
                      setShowMessageModal(false);
                      setShowCompose(true);
                      setSelectedBusiness(selectedMessage.business_id);
                      setSubject(`Re: ${selectedMessage.subject}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Responder
                  </button>
                )}
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
