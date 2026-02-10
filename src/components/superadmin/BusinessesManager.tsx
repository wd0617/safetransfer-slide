import { useState, useEffect } from 'react';
import {
  Building2, Search, Filter, Eye, Ban, CheckCircle, XCircle,
  Plus, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail, emailTemplates, getBusinessEmail } from '../../lib/emailService';
import { sendTelegramToBusinessIfEnabled, telegramTemplates, getBusinessTelegramConfig } from '../../lib/telegramService';

interface Business {
  id: string;
  name: string;
  subdomain?: string;
  business_type: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  telegram_id: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive' | 'blocked';
  status_reason: string;
  total_operators: number;
  subscription_plan: string;
  blocked_at: string;
  created_at: string;
  updated_at: string;
}

interface BusinessesManagerProps {
  onUpdate: () => void;
}

export default function BusinessesManager({ onUpdate }: BusinessesManagerProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [, setShowAddModal] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchTerm, statusFilter]);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBusinesses = () => {
    let filtered = businesses;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.name.toLowerCase().includes(term) ||
          b.contact_email.toLowerCase().includes(term) ||
          b.city?.toLowerCase().includes(term) ||
          b.country?.toLowerCase().includes(term)
      );
    }

    setFilteredBusinesses(filtered);
  };

  const updateBusinessStatus = async (businessId: string, status: Business['status'], reason?: string) => {
    try {
      const updateData: any = {
        status,
        status_reason: reason || null,
      };

      if (status === 'blocked') {
        updateData.blocked_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.blocked_by = user?.id;
      } else {
        updateData.blocked_at = null;
        updateData.blocked_by = null;
      }

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        superadmin_id: user?.id,
        action_type: 'business_status_change',
        entity_type: 'business',
        entity_id: businessId,
        description: `Negocio ${status === 'active' ? 'activado' : status === 'blocked' ? 'bloqueado' : 'desactivado'}`,
        new_values: { status, reason },
      });

      const businessInfo = await getBusinessEmail(businessId);
      if (businessInfo.email && businessInfo.enabled) {
        const emailHtml = emailTemplates.statusChange(
          businessInfo.name,
          status,
          reason
        );

        const statusLabels = {
          active: 'Activada',
          inactive: 'Desactivada',
          blocked: 'Bloqueada',
        };

        await sendEmail({
          to: businessInfo.email,
          subject: `Tu cuenta ha sido ${statusLabels[status].toLowerCase()}`,
          html: emailHtml,
          businessId: businessId,
          emailType: 'status_change',
        });
      }

      const telegramConfig = await getBusinessTelegramConfig(businessId);
      if (telegramConfig.enabled && telegramConfig.chatId) {
        let telegramMsg: string;
        if (status === 'blocked') {
          telegramMsg = telegramTemplates.accountBlocked(telegramConfig.businessName, reason);
        } else if (status === 'active') {
          telegramMsg = telegramTemplates.accountReactivated(telegramConfig.businessName);
        } else {
          telegramMsg = telegramTemplates.statusChange(telegramConfig.businessName, status, reason);
        }
        await sendTelegramToBusinessIfEnabled(businessId, telegramMsg);
      }

      await loadBusinesses();
      onUpdate();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating business status:', error);
      alert('Error al actualizar el estado del negocio');
    }
  };

  const StatusBadge = ({ status }: { status: Business['status'] }) => {
    const styles = {
      active: 'bg-green-900/30 text-green-100 border-green-800/50',
      inactive: 'bg-slate-900/30 text-white border-slate-800/50',
      blocked: 'bg-red-900/30 text-red-100 border-red-800/50',
    };

    const icons = {
      active: CheckCircle,
      inactive: XCircle,
      blocked: Ban,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        <Icon className="w-3.5 h-3.5" />
        {status === 'active' ? 'Activo' : status === 'blocked' ? 'Bloqueado' : 'Inactivo'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion de Negocios</h2>
          <p className="text-gray-600 mt-1">Administrar todos los negocios y suscripciones</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nuevo Negocio
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar negocios..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="text-left py-4 px-6 font-semibold text-white uppercase tracking-wider text-xs">Negocio</th>
                <th className="text-left py-4 px-6 font-semibold text-white uppercase tracking-wider text-xs">Contacto</th>
                <th className="text-left py-4 px-6 font-semibold text-white uppercase tracking-wider text-xs">Tipo</th>
                <th className="text-left py-4 px-6 font-semibold text-white uppercase tracking-wider text-xs">Estado</th>
                <th className="text-left py-4 px-6 font-semibold text-white uppercase tracking-wider text-xs">Subdominio</th>
                <th className="text-left py-4 px-6 font-semibold text-white uppercase tracking-wider text-xs">Fecha Creación</th>
                <th className="text-right py-4 px-6 font-semibold text-white uppercase tracking-wider text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white">
                    No se encontraron negocios
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((business) => (
                  <tr key={business.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{business.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white text-sm">{business.contact_email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white text-sm capitalize">{business.business_type.replace('_', ' ')}</p>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={business.status} />
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white text-sm">{business.subdomain || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(business.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedBusiness(business);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const status = business.status === 'active' ? 'blocked' : 'active';
                            const text = status === 'blocked' ? 'Bloquear' : 'Activar';
                            if (confirm(`¿Estás seguro de ${text.toLowerCase()} este negocio?`)) {
                              updateBusinessStatus(business.id, status);
                            }
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title={business.status === 'active' ? 'Bloquear' : 'Activar'}
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Detalles del Negocio</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-white">Nombre</label>
                  <p className="mt-1 text-white">{selectedBusiness.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Estado</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedBusiness.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Email</label>
                  <p className="mt-1 text-white">{selectedBusiness.contact_email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Teléfono</label>
                  <p className="mt-1 text-white">{selectedBusiness.contact_phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">WhatsApp</label>
                  <p className="mt-1 text-white">{selectedBusiness.whatsapp_number || 'No configurado'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Telegram</label>
                  <p className="mt-1 text-white">{selectedBusiness.telegram_id || 'No configurado'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-white">Dirección</label>
                  <p className="mt-1 text-white">{selectedBusiness.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Plan</label>
                  <p className="mt-1 text-white capitalize">{selectedBusiness.subscription_plan}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Operadores</label>
                  <p className="mt-1 text-white">{selectedBusiness.total_operators}</p>
                </div>
              </div>

              {selectedBusiness.status_reason && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                  <label className="text-sm font-semibold text-white block mb-1">Razón del estado</label>
                  <p className="text-white">{selectedBusiness.status_reason}</p>
                </div>
              )}

              <div className="flex gap-3">
                {selectedBusiness.status !== 'active' && (
                  <button
                    onClick={() => updateBusinessStatus(selectedBusiness.id, 'active')}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Activar
                  </button>
                )}
                {selectedBusiness.status !== 'blocked' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Motivo del bloqueo:');
                      if (reason) updateBusinessStatus(selectedBusiness.id, 'blocked', reason);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Ban className="w-5 h-5" />
                    Bloquear
                  </button>
                )}
                {selectedBusiness.status !== 'inactive' && (
                  <button
                    onClick={() => updateBusinessStatus(selectedBusiness.id, 'inactive')}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
