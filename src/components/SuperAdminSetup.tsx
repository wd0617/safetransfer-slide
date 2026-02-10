import { useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SuperAdminSetup() {
  const [step, setStep] = useState<'setup' | 'success' | 'error'>('setup');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const email = 'wd.06@outlook.es';

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: insertError } = await supabase
          .from('superadmin_users')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: 'SuperAdmin Principal',
            is_active: true,
            two_factor_enabled: false,
          });

        if (insertError) throw insertError;

        await supabase.from('audit_logs').insert({
          superadmin_id: authData.user.id,
          action_type: 'superadmin_created',
          entity_type: 'superadmin',
          entity_id: authData.user.id,
          description: 'SuperAdmin inicial creado',
        });

        setStep('success');
      }
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error al crear el SuperAdmin');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡SuperAdmin Creado!</h2>
          <p className="text-gray-700 mb-6">
            Tu cuenta de SuperAdmin ha sido creada exitosamente.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">Datos de acceso:</p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Contraseña:</strong> La que acabas de configurar
            </p>
          </div>
          <button
            onClick={() => {
              window.location.href = window.location.origin;
            }}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Error</h2>
          <p className="text-gray-700 mb-6 text-center">{errorMessage}</p>
          <button
            onClick={() => {
              setStep('setup');
              setErrorMessage('');
            }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-full mb-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración SuperAdmin</h1>
          <p className="text-gray-600 text-center">Crea tu cuenta de SuperAdmin</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700">Email del SuperAdmin:</p>
            <p className="text-gray-900 font-mono">{email}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Creando SuperAdmin...' : 'Crear SuperAdmin'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Esta página se usará solo una vez para configurar tu cuenta de SuperAdmin
          </p>
        </div>
      </div>
    </div>
  );
}
