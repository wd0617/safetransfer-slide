import { useState, useEffect } from 'react';
import {
  Building2, DollarSign, AlertTriangle, Activity,
  Shield, Key, Bell, MessageSquare, BarChart3, Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PaymentsManager from '../superadmin/PaymentsManager';
import BusinessesManager from '../superadmin/BusinessesManager';
import SecurityMonitor from '../superadmin/SecurityMonitor';
import PasswordRecovery from '../superadmin/PasswordRecovery';
import NotificationsManager from '../superadmin/NotificationsManager';
import MessagesManager from '../superadmin/MessagesManager';
import AuditLogsViewer from '../superadmin/AuditLogsViewer';
import EmailSettings from '../superadmin/EmailSettings';

interface DashboardStats {
  totalBusinesses: number;
  activeBusinesses: number;
  blockedBusinesses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  trialBusinesses: number;
  pendingPayments: number;
  overduePayments: number;
  unreadMessages: number;
  pendingRecoveries: number;
}

export default function SuperAdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'businesses' | 'payments' | 'security' | 'password' | 'notifications' | 'messages' | 'audit' | 'settings'>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    activeBusinesses: 0,
    blockedBusinesses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    trialBusinesses: 0,
    pendingPayments: 0,
    overduePayments: 0,
    unreadMessages: 0,
    pendingRecoveries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [businessesRes, paymentsRes, messagesRes, recoveriesRes, activityRes] = await Promise.all([
        supabase.from('businesses').select('*'),
        supabase.from('business_payments').select('amount, status, payment_date'),
        supabase.from('messages').select('*').eq('from_business', true).eq('read', false),
        supabase.from('password_recovery_requests').select('*').eq('status', 'pending'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      const businesses = businessesRes.data || [];
      const payments = paymentsRes.data || [];
      const messages = messagesRes.data || [];
      const recoveries = recoveriesRes.data || [];

      const totalRevenue = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = payments
        .filter(p => {
          if (p.status !== 'paid') return false;
          const paymentDate = new Date(p.payment_date);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      setStats({
        totalBusinesses: businesses.length,
        activeBusinesses: businesses.filter(b => b.status === 'active').length,
        blockedBusinesses: businesses.filter(b => b.status === 'blocked').length,
        trialBusinesses: businesses.filter(b => b.subscription_plan === 'trial').length,
        totalRevenue,
        monthlyRevenue,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        overduePayments: payments.filter(p => p.status === 'overdue').length,
        unreadMessages: messages.length,
        pendingRecoveries: recoveries.length,
      });

      if (activityRes.data) {
        setRecentActivity(activityRes.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3, badge: null },
    { id: 'businesses' as const, label: 'Negocios', icon: Building2, badge: null },
    { id: 'payments' as const, label: 'Pagos', icon: DollarSign, badge: stats.pendingPayments > 0 ? stats.pendingPayments : null },
    { id: 'security' as const, label: 'Seguridad', icon: Shield, badge: null },
    { id: 'password' as const, label: 'Recuperación', icon: Key, badge: stats.pendingRecoveries > 0 ? stats.pendingRecoveries : null },
    { id: 'notifications' as const, label: 'Notificaciones', icon: Bell, badge: null },
    { id: 'messages' as const, label: 'Mensajes', icon: MessageSquare, badge: stats.unreadMessages > 0 ? stats.unreadMessages : null },
    { id: 'audit' as const, label: 'Auditoría', icon: Activity, badge: null },
    { id: 'settings' as const, label: 'Configuración', icon: Settings, badge: null },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 p-2 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Panel SuperAdmin</h2>
        </div>
        <p className="text-red-100">Control total del sistema - Gestión completa de negocios y suscripciones</p>
      </div>

      <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-emerald-100 text-sm font-medium mb-1">Ingresos Totales</h3>
              <p className="text-3xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-blue-100 text-sm font-medium mb-1">Ingresos Mensuales</h3>
              <p className="text-3xl font-bold">€{stats.monthlyRevenue.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-purple-100 text-sm font-medium mb-1">Negocios Activos</h3>
              <p className="text-3xl font-bold">{stats.activeBusinesses}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-orange-100 text-sm font-medium mb-1">En Prueba</h3>
              <p className="text-3xl font-bold">{stats.trialBusinesses}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-700">Pagos Pendientes</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.pendingPayments}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-700">Pagos Vencidos</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.overduePayments}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-700">Mensajes Sin Leer</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.unreadMessages}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action_type}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'businesses' && <BusinessesManager onUpdate={loadDashboardData} />}
      {activeTab === 'payments' && <PaymentsManager onUpdate={loadDashboardData} />}
      {activeTab === 'security' && <SecurityMonitor />}
      {activeTab === 'password' && <PasswordRecovery onUpdate={loadDashboardData} />}
      {activeTab === 'notifications' && <NotificationsManager />}
      {activeTab === 'messages' && <MessagesManager />}
      {activeTab === 'audit' && <AuditLogsViewer />}
      {activeTab === 'settings' && <EmailSettings />}
    </div>
  );
}
