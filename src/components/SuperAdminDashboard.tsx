import { useState, useEffect } from 'react';
import {
  Building2, DollarSign, AlertTriangle, Activity,
  LogOut, FileText, Bell, TrendingUp, Eye, Minimize2, Shield, Lock, Key, MessageSquare, LayoutDashboard, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../lib/sessionManager';
import BusinessesManager from './superadmin/BusinessesManager';
import PaymentsManager from './superadmin/PaymentsManager';
import NotificationsManager from './superadmin/NotificationsManager';
import SecurityMonitor from './superadmin/SecurityMonitor';
import PasswordRecovery from './superadmin/PasswordRecovery';
import MessagesManager from './superadmin/MessagesManager';
import EmailSettings from './superadmin/EmailSettings';

interface DashboardStats {
  totalBusinesses: number;
  activeBusinesses: number;
  blockedBusinesses: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
}

interface SuperAdminDashboardProps {
  onMinimize: () => void;
  onViewDisplay: () => void;
}

export default function SuperAdminDashboard({ onMinimize, onViewDisplay }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'businesses' | 'payments' | 'security' | 'password' | 'notifications' | 'messages' | 'email'>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    activeBusinesses: 0,
    blockedBusinesses: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('status');

      const { data: payments } = await supabase
        .from('business_payments')
        .select('status, amount, due_date');

      const totalBusinesses = businesses?.length || 0;
      const activeBusinesses = businesses?.filter(b => b.status === 'active').length || 0;
      const blockedBusinesses = businesses?.filter(b => b.status === 'blocked').length || 0;

      const totalRevenue = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;

      const today = new Date();
      const overduePayments = payments?.filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.due_date);
        return dueDate < today;
      }).length || 0;

      setStats({
        totalBusinesses,
        activeBusinesses,
        blockedBusinesses,
        totalRevenue,
        pendingPayments,
        overduePayments,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    sessionManager.clearSuperAdminSession();

    const businessSession = sessionManager.getBusinessSession();
    if (!businessSession) {
      await supabase.auth.signOut();
    }

    window.location.reload();
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{label}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-2xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Panel SuperAdmin</h1>
              <p className="text-slate-300 text-sm">Acceso exclusivo para el propietario. Sistema privado y confidencial.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onViewDisplay}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-xl transition-all shadow-lg font-semibold"
              title="Ver Pantalla"
            >
              <Eye className="w-5 h-5" />
              <span className="hidden sm:inline">Ver Pantalla</span>
            </button>
            <button
              onClick={onMinimize}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-xl transition-all shadow-lg font-semibold"
              title="Minimizar"
            >
              <Minimize2 className="w-5 h-5" />
              <span className="hidden sm:inline">Minimizar</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl transition-all shadow-lg font-semibold"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'businesses', label: 'Negocios', icon: Building2 },
              { id: 'security', label: 'Seguridad', icon: Lock },
              { id: 'password', label: 'Recuperacion de Contrasena', icon: Key },
              { id: 'notifications', label: 'Notificaciones', icon: Bell },
              { id: 'messages', label: 'Mensajes', icon: MessageSquare },
              { id: 'email', label: 'Config. Email', icon: Mail },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-4 font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700 p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen General</h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard
                    icon={Building2}
                    label="Total Negocios"
                    value={stats.totalBusinesses}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                  />
                  <StatCard
                    icon={Activity}
                    label="Negocios Activos"
                    value={stats.activeBusinesses}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Negocios Bloqueados"
                    value={stats.blockedBusinesses}
                    color="bg-gradient-to-br from-red-500 to-red-600"
                  />
                  <StatCard
                    icon={DollarSign}
                    label="Ingresos Totales"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    trend="+12%"
                  />
                  <StatCard
                    icon={FileText}
                    label="Pagos Pendientes"
                    value={stats.pendingPayments}
                    color="bg-gradient-to-br from-yellow-500 to-yellow-600"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Pagos Vencidos"
                    value={stats.overduePayments}
                    color="bg-gradient-to-br from-orange-500 to-orange-600"
                  />
                </div>
              )}
            </div>

            {stats.overduePayments > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Atención requerida</h3>
                    <p className="text-gray-700">
                      Hay {stats.overduePayments} pago(s) vencido(s) que requieren acción inmediata.
                    </p>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="mt-3 text-orange-600 hover:text-orange-700 font-semibold text-sm"
                    >
                      Ver pagos vencidos →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'businesses' && <BusinessesManager onUpdate={loadDashboardStats} />}
        {activeTab === 'payments' && <PaymentsManager />}
        {activeTab === 'security' && <SecurityMonitor />}
        {activeTab === 'password' && <PasswordRecovery onUpdate={loadDashboardStats} />}
        {activeTab === 'notifications' && <NotificationsManager />}
        {activeTab === 'messages' && <MessagesManager />}
        {activeTab === 'email' && <EmailSettings />}
        </div>
      </main>
    </div>
  );
}
