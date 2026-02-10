import { useState, useEffect } from 'react';
import { Send, Plus, Search, Filter, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail, emailTemplates, getBusinessEmail } from '../../lib/emailService';
import { sendTelegramToBusinessIfEnabled, telegramTemplates } from '../../lib/telegramService';

interface Notification {
  id: string;
  business_id: string;
  notification_type: 'payment_due' | 'status_change' | 'alert' | 'general';
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string;
  created_at: string;
  businesses?: {
    name: string;
    contact_email: string;
  };
}

interface Business {
  id: string;
  name: string;
  contact_email: string;
}

export default function NotificationsManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Notification['status']>('all');
  const [showModal, setShowModal] = useState(false);
  const [newNotification, setNewNotification] = useState<Partial<Notification>>({
    notification_type: 'general',
    subject: '',
    message: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      const [notificationsRes, businessesRes] = await Promise.all([
        supabase
          .from('business_notifications')
          .select(`
            *,
            businesses (
              name,
              contact_email
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('businesses')
          .select('id, name, contact_email')
          .eq('status', 'active')
          .order('name'),
      ]);

      if (notificationsRes.error) throw notificationsRes.error;
      if (businessesRes.error) throw businessesRes.error;

      setNotifications(notificationsRes.data || []);
      setBusinesses(businessesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.subject.toLowerCase().includes(term) ||
          n.message.toLowerCase().includes(term) ||
          n.businesses?.name.toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
  };

  const [sending, setSending] = useState(false);

  const sendNotification = async () => {
    if (!newNotification.business_id || !newNotification.subject || !newNotification.message) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const businessInfo = await getBusinessEmail(newNotification.business_id);

      const { error } = await supabase.from('business_notifications').insert({
        business_id: newNotification.business_id,
        notification_type: newNotification.notification_type,
        subject: newNotification.subject,
        message: newNotification.message,
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: user?.id,
      });

      if (error) throw error;

      if (businessInfo.email && businessInfo.enabled) {
        const emailHtml = emailTemplates.notification(
          businessInfo.name,
          newNotification.subject || '',
          newNotification.message || '',
          newNotification.notification_type || 'general'
        );

        const emailResult = await sendEmail({
          to: businessInfo.email,
          subject: newNotification.subject || '',
          html: emailHtml,
          businessId: newNotification.business_id,
          emailType: 'notification',
        });

        if (!emailResult.success) {
          console.warn('Email no enviado:', emailResult.error);
        }
      }

      const telegramMsg = telegramTemplates.notification(
        businessInfo.name,
        newNotification.subject || '',
        newNotification.message || ''
      );
      const telegramResult = await sendTelegramToBusinessIfEnabled(
        newNotification.business_id,
        telegramMsg
      );
      if (!telegramResult.success) {
        console.warn('Telegram no enviado:', telegramResult.error);
      }

      await supabase.from('audit_logs').insert({
        superadmin_id: user?.id,
        action_type: 'notification_sent',
        entity_type: 'notification',
        description: `Notificacion enviada: ${newNotification.subject}`,
        new_values: newNotification,
      });

      await loadData();
      setShowModal(false);
      setNewNotification({
        notification_type: 'general',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error al enviar la notificacion');
    } finally {
      setSending(false);
    }
  };

  const StatusBadge = ({ status }: { status: Notification['status'] }) => {
    const styles = {
      sent: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };

    const labels = {
      sent: 'Enviada',
      pending: 'Pendiente',
      failed: 'Fallida',
    };

    const icons = {
      sent: CheckCircle,
      pending: AlertCircle,
      failed: AlertCircle,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        <Icon className="w-3.5 h-3.5" />
        {labels[status]}
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: Notification['notification_type'] }) => {
    const styles = {
      payment_due: 'bg-orange-100 text-orange-800',
      status_change: 'bg-blue-100 text-blue-800',
      alert: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      payment_due: 'Pago pendiente',
      status_change: 'Cambio de estado',
      alert: 'Alerta',
      general: 'General',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
          <p className="text-gray-600 mt-1">Envía mensajes y alertas a los negocios</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nueva Notificación
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar notificaciones..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Todas</option>
              <option value="sent">Enviadas</option>
              <option value="pending">Pendientes</option>
              <option value="failed">Fallidas</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron notificaciones
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <TypeBadge type={notification.notification_type} />
                    <StatusBadge status={notification.status} />
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium">{notification.businesses?.name}</span>
                    <span className="text-white">•</span>
                    <span>{notification.businesses?.contact_email}</span>
                  </div>

                  <h4 className="font-semibold text-gray-900">{notification.subject}</h4>
                  <p className="text-gray-700 text-sm">{notification.message}</p>

                  {notification.sent_at && (
                    <div className="text-xs text-gray-500">
                      Enviada: {new Date(notification.sent_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900">Nueva Notificación</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Negocio destinatario
                </label>
                <select
                  value={newNotification.business_id || ''}
                  onChange={(e) => setNewNotification({ ...newNotification, business_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Selecciona un negocio</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} ({business.contact_email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de notificación
                </label>
                <select
                  value={newNotification.notification_type}
                  onChange={(e) => setNewNotification({ ...newNotification, notification_type: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="payment_due">Pago pendiente</option>
                  <option value="status_change">Cambio de estado</option>
                  <option value="alert">Alerta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={newNotification.subject}
                  onChange={(e) => setNewNotification({ ...newNotification, subject: e.target.value })}
                  placeholder="Asunto de la notificación"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Contenido del mensaje..."
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewNotification({
                      notification_type: 'general',
                      subject: '',
                      message: '',
                    });
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendNotification}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sending ? 'Enviando...' : 'Enviar Notificacion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
