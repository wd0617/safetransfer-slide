import { useState } from 'react';
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendEmail, getBusinessLanguage, BusinessLanguage } from '../lib/emailService';
import { sendTemplatedNotification, sendTelegramToBusinessIfEnabled, telegramTemplates } from '../lib/telegramService';
import { localizedEmailTemplates, getEmailSubject } from '../lib/emailTemplates';

interface PasswordRecoveryRequestProps {
  onBack: () => void;
}

type Step = 'email' | 'code' | 'success';

export default function PasswordRecoveryRequest({ onBack }: PasswordRecoveryRequestProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('');
  const [businessLang, setBusinessLang] = useState<BusinessLanguage>('es');

  const generateCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: adminData, error: adminError } = await supabase
        .from('business_admins')
        .select('id, business_id, email, full_name, is_active')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (adminError) {
        setError('Error al verificar el email. Por favor intenta nuevamente.');
        setLoading(false);
        return;
      }

      if (!adminData) {
        setError('No encontramos una cuenta con ese email.');
        setLoading(false);
        return;
      }

      if (!adminData.is_active) {
        setError('Esta cuenta esta inactiva. Contacta al soporte.');
        setLoading(false);
        return;
      }

      setBusinessId(adminData.business_id);
      setAdminName(adminData.full_name || 'Usuario');

      const lang = await getBusinessLanguage(adminData.business_id);
      setBusinessLang(lang);

      const verificationCode = generateCode();

      const { error: codeError } = await supabase
        .from('password_reset_codes')
        .insert({
          business_id: adminData.business_id,
          admin_email: email.trim().toLowerCase(),
          code: verificationCode,
        });

      if (codeError) {
        console.error('[PASSWORD_RECOVERY] Error creating code:', codeError);
        setError('Error al generar el codigo. Por favor intenta nuevamente.');
        setLoading(false);
        return;
      }

      const emailHtml = localizedEmailTemplates.passwordResetCode(
        adminData.full_name || 'Usuario',
        verificationCode,
        lang
      );

      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: getEmailSubject('passwordReset', lang),
        html: emailHtml,
        businessId: adminData.business_id,
        emailType: 'password_recovery',
      });

      const { data: business } = await supabase
        .from('businesses')
        .select('business_name')
        .eq('id', adminData.business_id)
        .maybeSingle();

      await sendTemplatedNotification({
        businessId: adminData.business_id,
        templateKey: 'password_change_request',
        variables: {
          business_name: business?.business_name || 'Negocio',
        },
      });

      setStep('code');
      setLoading(false);
    } catch (err) {
      console.error('[PASSWORD_RECOVERY] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Error inesperado. Por favor intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { data: result, error: resetError } = await supabase
        .rpc('verify_code_and_reset_password', {
          p_email: email.trim().toLowerCase(),
          p_code: code.trim(),
          p_new_password: newPassword,
        });

      if (resetError) {
        console.error('[PASSWORD_RECOVERY] Reset error:', resetError);
        setError('Error al cambiar la contrasena. Por favor intenta nuevamente.');
        setLoading(false);
        return;
      }

      if (!result?.success) {
        setError(result?.message || 'Codigo invalido o expirado.');
        setLoading(false);
        return;
      }

      if (businessId) {
        const { data: business } = await supabase
          .from('businesses')
          .select('business_name')
          .eq('id', businessId)
          .maybeSingle();

        const message = telegramTemplates.passwordChanged(
          business?.business_name || 'Negocio'
        );
        await sendTelegramToBusinessIfEnabled(businessId, message);
      }

      setStep('success');
      setLoading(false);
    } catch (err) {
      console.error('[PASSWORD_RECOVERY] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Error inesperado. Por favor intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setLoading(true);

    try {
      const verificationCode = generateCode();

      const { error: codeError } = await supabase
        .from('password_reset_codes')
        .insert({
          business_id: businessId,
          admin_email: email.trim().toLowerCase(),
          code: verificationCode,
        });

      if (codeError) {
        setError('Error al generar nuevo codigo.');
        setLoading(false);
        return;
      }

      const emailHtml = localizedEmailTemplates.passwordResetCode(adminName, verificationCode, businessLang);

      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: getEmailSubject('passwordReset', businessLang),
        html: emailHtml,
        businessId: businessId || undefined,
        emailType: 'password_recovery',
      });

      setError(null);
      alert('Se ha enviado un nuevo codigo a tu correo.');
      setLoading(false);
    } catch (err) {
      setError('Error al reenviar el codigo.');
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Contrasena Actualizada
            </h2>

            <p className="text-gray-600 mb-6">
              Tu contrasena ha sido cambiada exitosamente. Ya puedes iniciar sesion con tu nueva contrasena.
            </p>

            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <button
            onClick={() => setStep('email')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifica tu Identidad
            </h2>

            <p className="text-gray-600">
              Hemos enviado un codigo de 6 digitos a <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Revisa tu bandeja de entrada</strong> (y la carpeta de spam).
              El codigo expira en 15 minutos.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codigo de Verificacion
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Minimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contrasena
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Repite la contrasena"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Cambiar Contrasena'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResendCode}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              No recibiste el codigo? Reenviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recuperar Contrasena
          </h2>

          <p className="text-gray-600">
            Te enviaremos un codigo de verificacion a tu correo
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleRequestCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de la Cuenta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar Codigo'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                <strong>Proceso seguro:</strong>
              </p>
              <ul className="text-xs text-gray-500 mt-1 space-y-1">
                <li>1. Recibes un codigo por email</li>
                <li>2. Recibes una notificacion por Telegram</li>
                <li>3. Ingresas el codigo y tu nueva contrasena</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
