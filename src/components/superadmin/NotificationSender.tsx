import { useState, useEffect } from 'react';
import { Send, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendTelegramNotification, scheduleNotification } from '../../lib/notificationService';

interface Business {
  id: string;
  business_name: string;
  is_active: boolean;
  telegram_connected: boolean;
}

interface NotificationTemplate {
  id: string;
  template_key: string;
  name: string;
  message_template: string;
}

export default function NotificationSender() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: businessData } = await supabase
      .from('businesses')
      .select(`
        id,
        business_name,
        is_active,
        business_admins!inner(telegram_chat_id)
      `)
      .order('business_name');

    if (businessData) {
      const processedBusinesses = businessData.map(b => ({
        id: b.id,
        business_name: b.business_name,
        is_active: b.is_active,
        telegram_connected: !!(b as any).business_admins?.telegram_chat_id
      }));
      setBusinesses(processedBusinesses);
    }

    const { data: templateData } = await supabase
      .from('notification_templates')
      .select('*')
      .order('name');

    if (templateData) {
      setTemplates(templateData);
    }
  };

  const extractVariables = (template: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.template_key === selectedTemplate);
      if (template) {
        const vars = extractVariables(template.message_template);
        const newVariables: Record<string, string> = {};
        vars.forEach(v => {
          newVariables[v] = variables[v] || '';
        });
        setVariables(newVariables);
      }
    }
  }, [selectedTemplate]);

  const handleSendNotification = async () => {
    if (!selectedBusiness || !selectedTemplate) {
      setMessage({ type: 'error', text: 'Selecciona un negocio y un template' });
      return;
    }

    const missingVars = Object.entries(variables).filter(([_, value]) => !value);
    if (missingVars.length > 0) {
      setMessage({ type: 'error', text: 'Completa todas las variables del mensaje' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (scheduledFor) {
        const scheduledDate = new Date(scheduledFor);
        await scheduleNotification({
          businessId: selectedBusiness,
          notificationType: selectedTemplate,
          scheduledFor: scheduledDate,
          templateKey: selectedTemplate,
          variables,
        });
        setMessage({ type: 'success', text: 'Notificacion programada exitosamente' });
      } else {
        const success = await sendTelegramNotification({
          businessId: selectedBusiness,
          templateKey: selectedTemplate,
          variables,
        });

        if (success) {
          setMessage({ type: 'success', text: 'Notificacion enviada exitosamente' });
        } else {
          setMessage({ type: 'error', text: 'El negocio no tiene Telegram conectado o hubo un error' });
        }
      }

      setSelectedBusiness('');
      setSelectedTemplate('');
      setVariables({});
      setScheduledFor('');
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage({ type: 'error', text: 'Error al enviar la notificacion' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enviar Notificaciones</h2>
          <p className="text-gray-600 mt-1">
            Envia notificaciones personalizadas a los negocios via Telegram
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
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

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Negocio Destinatario
            </label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un negocio</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.business_name}
                  {business.telegram_connected ? ' ✓ Telegram' : ' ✗ Sin Telegram'}
                  {!business.is_active ? ' (Inactivo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Template de Notificacion
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.template_key}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && Object.keys(variables).length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white mb-2">
                Variables del Mensaje
              </label>
              {Object.keys(variables).map((varName) => (
                <div key={varName}>
                  <label className="block text-xs text-white mb-1">
                    {varName}
                  </label>
                  <input
                    type="text"
                    value={variables[varName]}
                    onChange={(e) =>
                      setVariables({ ...variables, [varName]: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={`Ingresa ${varName}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Programar para (Opcional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-white mt-1">
              Deja vacio para enviar inmediatamente
            </p>
          </div>

          {selectedTemplate && (
            <div className="bg-slate-900 rounded-lg p-4">
              <p className="text-xs text-white mb-2 font-semibold">Vista Previa:</p>
              <p className="text-sm text-white whitespace-pre-wrap">
                {templates
                  .find((t) => t.template_key === selectedTemplate)
                  ?.message_template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`)}
              </p>
            </div>
          )}

          <button
            onClick={handleSendNotification}
            disabled={loading || !selectedBusiness || !selectedTemplate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Enviando...' : scheduledFor ? 'Programar Notificacion' : 'Enviar Ahora'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-300 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">Informacion Importante</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Solo los negocios con Telegram conectado recibiran las notificaciones</li>
              <li>• Las notificaciones programadas se envian automaticamente en la fecha indicada</li>
              <li>• Puedes usar templates predefinidos o personalizar los mensajes</li>
              <li>• Las variables deben completarse para que el mensaje sea coherente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
