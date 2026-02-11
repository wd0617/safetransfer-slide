import { useState, useEffect } from 'react';
import { Key, AlertTriangle, CheckCircle, Clock, X, Check, Eye, EyeOff, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sessionManager } from '../../lib/sessionManager';
import { sendEmail, emailTemplates } from '../../lib/emailService';
import { sendTelegramToBusinessIfEnabled, telegramTemplates } from '../../lib/telegramService';

interface RecoveryRequest {
  id: string;
  business_id: string;
  admin_email: string;
  admin_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at: string | null;
  new_password_set?: boolean;
  businesses?: {
    name: string;
  };
}

interface PasswordRecoveryProps {
  onUpdate?: () => void;
}

export default function PasswordRecovery({ onUpdate }: PasswordRecoveryProps) {
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RecoveryRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('password_recovery_requests')
        .select(`
          *,
          businesses (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStrongPassword = (): string => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  };

  const approveRequest = (request: RecoveryRequest) => {
    const newPassword = generateStrongPassword();
    setGeneratedPassword(newPassword);
    setSelectedRequest(request);
    setShowPassword(false);
    setMessage(null);
    setShowConfirmModal(true);
  };

  const rejectRequest = async (requestId: string, businessId: string) => {
    if (!confirm('Estas seguro de rechazar esta solicitud?')) return;

    try {
      setProcessing(true);

      const session = sessionManager.getBusinessSession();
      if (!session?.sessionToken) {
        alert('Sesion no valida');
        return;
      }

      const request = requests.find(r => r.id === requestId);

      const { data: result, error } = await supabase
        .rpc('reject_password_recovery', {
          p_request_id: requestId,
          p_superadmin_session_token: session.sessionToken
        });

      if (error) throw error;

      if (!result?.success) {
        throw new Error(result?.error || 'Error al rechazar la solicitud');
      }

      if (request?.admin_email) {
        const emailHtml = emailTemplates.passwordRecoveryRejected(request.admin_name);

        await sendEmail({
          to: request.admin_email,
          subject: 'Tu solicitud de recuperacion de contrasena ha sido rechazada',
          html: emailHtml,
          businessId: businessId,
          emailType: 'password_recovery',
        });
      }

      const telegramMsg = telegramTemplates.passwordRecoveryRejected(request?.admin_name || 'Usuario');
      await sendTelegramToBusinessIfEnabled(businessId, telegramMsg);

      await loadRequests();
      if (onUpdate) onUpdate();
      alert('Solicitud rechazada');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error al rechazar la solicitud');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveWithPassword = async () => {
    if (!selectedRequest || !generatedPassword) return;

    setProcessing(true);
    setMessage(null);

    try {
      const session = sessionManager.getBusinessSession();
      if (!session?.sessionToken) {
        setMessage({ type: 'error', text: 'Sesion no valida' });
        setProcessing(false);
        return;
      }

      const { data: result, error: approveError } = await supabase
        .rpc('approve_password_recovery', {
          p_request_id: selectedRequest.id,
          p_new_password: generatedPassword,
          p_superadmin_session_token: session.sessionToken
        });

      if (approveError) {
        console.error('[PASSWORD RECOVERY] Error:', approveError);
        throw approveError;
      }

      if (!result?.success) {
        throw new Error(result?.error === 'unauthorized' ? 'No tienes permisos para esta accion' : 'Error al aprobar la solicitud');
      }

      if (selectedRequest.admin_email) {
        const emailHtml = emailTemplates.passwordRecoveryApproved(
          selectedRequest.admin_name,
          generatedPassword
        );

        await sendEmail({
          to: selectedRequest.admin_email,
          subject: 'Tu solicitud de recuperacion de contrasena ha sido aprobada',
          html: emailHtml,
          businessId: selectedRequest.business_id,
          emailType: 'password_recovery',
        });
      }

      const telegramMsg = telegramTemplates.passwordRecoveryApproved(
        selectedRequest.admin_name,
        generatedPassword
      );
      await sendTelegramToBusinessIfEnabled(selectedRequest.business_id, telegramMsg);

      setMessage({
        type: 'success',
        text: `Contrasena generada y enviada a ${result.admin_name || selectedRequest.admin_name}`,
      });

      setTimeout(() => {
        setShowConfirmModal(false);
        setSelectedRequest(null);
        setGeneratedPassword('');
        setMessage(null);
      }, 3000);

      await loadRequests();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Error approving request:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error al aprobar la solicitud'
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    alert('Contraseña copiada al portapapeles');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const resolvedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Key className="w-8 h-8 text-orange-500" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Recuperacion de Contrasena</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las solicitudes de recuperacion de los negocios
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-300 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">Sistema de Contraseñas Automáticas</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Las contraseñas se generan automáticamente de forma segura (16 caracteres)</li>
              <li>• El negocio recibirá la contraseña en su panel de notificaciones</li>
              <li>• Solo el negocio podrá ver su contraseña (privacidad garantizada)</li>
              <li>• Cada contraseña es única y no se almacena sin cifrar</li>
            </ul>
          </div>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-br from-orange-100 to-yellow-50 border border-orange-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-2">
                {pendingRequests.length} {pendingRequests.length === 1 ? 'Solicitud Pendiente' : 'Solicitudes Pendientes'}
              </h3>
              <p className="text-orange-800 text-sm">
                Revisa y aprueba las solicitudes de recuperación de contraseña de los negocios
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Solicitudes Pendientes</h3>
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-white">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay solicitudes pendientes</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-slate-900/50 border border-slate-600 rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white text-lg">
                      {request.businesses?.name}
                    </h4>
                    <p className="text-white text-sm mt-1">
                      {request.admin_name} ({request.admin_email})
                    </p>
                  </div>
                  <span className="bg-yellow-500/20 text-yellow-100 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pendiente
                  </span>
                </div>

                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold text-white mb-1">Razón:</p>
                  <p className="text-white">{request.reason}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">
                    Solicitado el {new Date(request.created_at).toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectRequest(request.id, request.business_id)}
                      disabled={processing}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => approveRequest(request)}
                      disabled={processing}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {resolvedRequests.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Solicitudes Resueltas</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {resolvedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-slate-900/30 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">
                      {request.businesses?.name} - {request.admin_name}
                    </h4>
                    <p className="text-xs text-white mt-1">
                      {request.admin_email}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'approved'
                        ? 'bg-green-500/20 text-green-100'
                        : 'bg-red-500/20 text-red-100'
                    }`}
                  >
                    {request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                  </span>
                </div>
                {request.resolved_at && (
                  <p className="text-xs text-white mt-2">
                    Resuelta el {new Date(request.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showConfirmModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-600">
            <h3 className="text-xl font-bold text-white mb-4">
              Aprobar Solicitud de {selectedRequest.admin_name}
            </h3>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <p className="text-sm text-white mb-1">Negocio:</p>
              <p className="font-semibold text-white">{selectedRequest.businesses?.name}</p>
              <p className="text-sm text-white mt-2">{selectedRequest.admin_email}</p>
            </div>

            <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-white mb-3 font-semibold">
                Contraseña generada automáticamente:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  readOnly
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
                </button>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                >
                  <Copy className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-xs text-white mt-2">
                Esta contraseña se enviará al negocio y solo ellos podrán verla
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 mb-4 ${
                  message.type === 'success'
                    ? 'bg-green-900/30 border border-green-800/50 text-green-100'
                    : 'bg-red-900/30 border border-red-800/50 text-red-100'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedRequest(null);
                  setGeneratedPassword('');
                  setMessage(null);
                }}
                disabled={processing}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApproveWithPassword}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {processing ? 'Procesando...' : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
