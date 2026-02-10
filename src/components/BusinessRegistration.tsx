import { useState } from 'react';
import { CheckCircle, AlertCircle, ArrowLeft, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../lib/sessionManager';

interface BusinessRegistrationProps {
  onSuccess: () => void;
  onBack: () => void;
}

type Step = 'form' | 'success' | 'error';
type Language = 'es' | 'en' | 'it';

export default function BusinessRegistration({ onSuccess, onBack }: BusinessRegistrationProps) {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'money_transfer',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    country: '',
    subdomain: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    language: 'es' as Language,
  });

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setErrorMessage('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Las contrasenas no coinciden');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      setErrorMessage('El subdominio solo puede contener letras minusculas, numeros y guiones');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { data: existingEmail } = await supabase
        .from('business_admins')
        .select('id')
        .eq('email', formData.contactEmail.trim().toLowerCase())
        .maybeSingle();

      if (existingEmail) {
        setErrorMessage('Este email ya esta registrado.');
        setLoading(false);
        return;
      }

      const { data: existingSubdomain } = await supabase
        .from('businesses')
        .select('id')
        .eq('subdomain', formData.subdomain.trim().toLowerCase())
        .maybeSingle();

      if (existingSubdomain) {
        setErrorMessage('Este subdominio ya esta en uso. Por favor elige otro.');
        setLoading(false);
        return;
      }

      const { data: result, error: registerError } = await supabase.rpc('register_business', {
        p_business_name: formData.businessName,
        p_business_type: formData.businessType,
        p_contact_email: formData.contactEmail,
        p_contact_phone: formData.contactPhone,
        p_address: formData.address,
        p_city: formData.city,
        p_country: formData.country,
        p_subdomain: formData.subdomain,
        p_full_name: formData.fullName,
        p_password: formData.password,
      });

      if (registerError) {
        console.error('Register error:', registerError);
        throw registerError;
      }

      if (!result?.success) {
        throw new Error(result?.message || 'Error al registrar el negocio');
      }

      sessionManager.setBusinessSession({
        sessionToken: result.session_token,
        businessId: result.business_id,
        businessName: result.business_name,
        adminEmail: result.admin_email,
      });

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error completo:', err);

      const error = err as { message?: string; code?: string };
      let userFriendlyMessage = error.message || 'Error al registrar el negocio';

      if (error.message?.includes('duplicate key')) {
        userFriendlyMessage = 'Este correo o subdominio ya esta registrado. Por favor, usa otro.';
      } else if (error.code === '23505') {
        userFriendlyMessage = 'Ya existe un registro con estos datos. Por favor, verifica tu informacion.';
      } else if (error.message?.includes('permission denied') || error.code === '42501') {
        userFriendlyMessage = 'Error de permisos. Por favor, contacta al soporte tecnico.';
      }

      setErrorMessage(userFriendlyMessage);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Negocio Registrado!</h2>
          <p className="text-gray-700 mb-2">
            Tu negocio ha sido creado exitosamente.
          </p>
          <p className="text-sm text-gray-600">
            Seras redirigido al panel de administracion...
          </p>
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
              setStep('form');
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
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="flex flex-col items-center mb-8">
          <img
            src="/v2.png"
            alt="SafeTransfer Slide"
            className="w-64 h-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registrar Negocio</h1>
          <p className="text-gray-600 text-center">Crea tu cuenta y comienza a gestionar tu plataforma</p>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informacion del Negocio</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mi Negocio"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Negocio
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="money_transfer">Transferencias de Dinero</option>
                <option value="remittance">Remesas</option>
                <option value="currency_exchange">Casa de Cambio</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email de Contacto *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@ejemplo.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Este sera tu email de acceso</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefono
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Idioma
                </div>
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
                <option value="it">Italiano</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Las notificaciones se enviaran en este idioma</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Santo Domingo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pais
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Republica Dominicana"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Direccion
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Calle Principal #123"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subdominio * (para identificar tu negocio)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mi-negocio"
                  required
                  pattern="[a-z0-9-]+"
                />
                <span className="text-gray-600 text-sm">.service-point.com</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Solo letras minusculas, numeros y guiones</p>
            </div>

            <div className="md:col-span-2 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Administrador</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Juan Perez"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contrasena * (minimo 6 caracteres)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="******"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Contrasena *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="******"
                required
                minLength={6}
              />
            </div>
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Al registrarte, aceptas nuestros terminos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
