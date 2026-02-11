import { useState, useEffect } from 'react';
import { Lock, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExchangeRatesManager from './admin/ExchangeRatesManager';
import MediaManager from './admin/MediaManager';
import AnnouncementsManager from './admin/AnnouncementsManager';
import BusinessSettingsManager from './admin/BusinessSettingsManager';
import ServiceLogosManager from './admin/ServiceLogosManager';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'rates' | 'media' | 'announcements' | 'logos' | 'settings'>('rates');

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setIsAuthenticated(true);
    } catch (error: any) {
      alert(error?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (confirm('¿Cerrar sesión?')) {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-6 text-slate-800">Panel Administrativo</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                placeholder="Ingrese la contraseña"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <p className="mt-4 text-sm text-slate-500 text-center">
            La sesión se mantiene automáticamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Panel Administrativo</h1>
                <p className="text-blue-100 mt-1">Gestión de contenido de la pantalla</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200">
            <nav className="flex gap-2 p-2">
              {[
                { id: 'rates' as const, label: 'Tasas de Cambio' },
                { id: 'media' as const, label: 'Multimedia' },
                { id: 'announcements' as const, label: 'Anuncios' },
                { id: 'logos' as const, label: 'Logos de Servicios' },
                { id: 'settings' as const, label: 'Configuración' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'rates' && <ExchangeRatesManager />}
            {activeTab === 'media' && <MediaManager />}
            {activeTab === 'announcements' && <AnnouncementsManager />}
            {activeTab === 'logos' && <ServiceLogosManager />}
            {activeTab === 'settings' && <BusinessSettingsManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
