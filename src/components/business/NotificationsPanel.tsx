import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  created_at: string;
  business_id: string;
}

export default function NotificationsPanel() {
  const { business, language } = useBusiness();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business?.id) {
      loadNotifications();
    }
  }, [business?.id]);

  const loadNotifications = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert(getTranslation(language, 'errorMarkingAsRead'));
    }
  };

  const markAllAsRead = async () => {
    if (!business?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('business_id', business.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.business_id === business.id && !n.read ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert(getTranslation(language, 'errorMarkingAllAsRead'));
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'high') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (type === 'payment_due') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    if (type === 'status_change') return <Info className="w-5 h-5 text-blue-600" />;
    return <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getBgColor = (type: string, priority: string, read: boolean) => {
    if (!read) {
      if (priority === 'high') return 'bg-red-50 border-red-200';
      if (type === 'payment_due') return 'bg-yellow-50 border-yellow-200';
      return 'bg-blue-50 border-blue-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            {getTranslation(language, 'notifications')}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <p className="text-gray-600 mt-1">{getTranslation(language, 'stayUpdated')}</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{getTranslation(language, 'allNotifications')}</option>
            <option value="unread">{getTranslation(language, 'unread')}</option>
          </select>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              {getTranslation(language, 'markAllAsRead')}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {filter === 'unread' ? getTranslation(language, 'noUnreadNotifications') : getTranslation(language, 'noNotifications')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl border p-6 transition-all ${getBgColor(
                notification.type,
                notification.priority,
                notification.read
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 mt-1">
                    {getIcon(notification.type, notification.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {getTranslation(language, 'newLabel')}
                          </span>
                        )}
                      </h4>
                    </div>
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {getTranslation(language, 'markAsRead')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
