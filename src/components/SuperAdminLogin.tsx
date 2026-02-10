import { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../lib/sessionManager';

interface SuperAdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export default function SuperAdminLogin({ onLoginSuccess, onBack }: SuperAdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: superadminData, error: superadminError } = await supabase
          .from('superadmin_users')
          .select('*')
          .eq('id', authData.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (superadminError) throw superadminError;

        if (!superadminData) {
          await supabase.auth.signOut();
          throw new Error('Acceso no autorizado. Solo SuperAdmin puede acceder.');
        }

        await supabase
          .from('superadmin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', authData.user.id);

        await supabase.from('audit_logs').insert({
          superadmin_id: authData.user.id,
          action_type: 'login',
          entity_type: 'superadmin',
          entity_id: authData.user.id,
          description: 'SuperAdmin login exitoso',
          new_values: { login_time: new Date().toISOString() },
        });

        sessionManager.setSuperAdminSession({
          userId: authData.user.id,
          email: authData.user.email || '',
          accessToken: authData.session.access_token,
        });

        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </button>

          <div className="flex flex-col items-center mb-8 mt-8">
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-full mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SuperAdmin</h1>
            <p className="text-gray-600 text-center">Acceso exclusivo para administrador del sistema</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="superadmin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Acceso protegido y auditado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
