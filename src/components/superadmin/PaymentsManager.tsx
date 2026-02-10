import { useState, useEffect } from 'react';
import {
  Search, Filter, Plus, Edit, Trash2, Check,
  Calendar, FileText, Settings, Download, ExternalLink,
  RefreshCw, X, Building2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendTelegramToBusinessIfEnabled, telegramTemplates, getBusinessTelegramConfig } from '../../lib/telegramService';

interface Payment {
  id: string;
  business_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string;
  invoice_number: string;
  notes: string;
  discount_applied: number;
  paid_at: string;
  created_at: string;
  concept: string;
  zoho_invoice_id: string | null;
  zoho_invoice_number: string | null;
  invoice_pdf_url: string | null;
  businesses?: {
    name: string;
    contact_email: string;
  };
}

interface Business {
  id: string;
  name: string;
  contact_email: string;
}

interface ZohoStatus {
  configured: boolean;
  organization_id: string | null;
  region: string | null;
}

interface PaymentsManagerProps {
  onUpdate?: () => void;
}

export default function PaymentsManager({ onUpdate = () => {} }: PaymentsManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [showModal, setShowModal] = useState(false);
  const [showZohoConfig, setShowZohoConfig] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Partial<Payment> | null>(null);
  const [zohoStatus, setZohoStatus] = useState<ZohoStatus | null>(null);
  const [zohoConfiguring, setZohoConfiguring] = useState(false);
  const [zohoConfig, setZohoConfig] = useState({
    client_id: '',
    client_secret: '',
    code: '',
    organization_id: '',
    region: 'us'
  });
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
    loadBusinesses();
    checkZohoStatus();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const checkZohoStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-invoice?action=status`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          }
        }
      );
      const data = await response.json();
      setZohoStatus(data);
    } catch (error) {
      console.error('Error checking Zoho status:', error);
    }
  };

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, contact_email')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('business_payments')
        .select(`
          *,
          businesses (
            name,
            contact_email
          )
        `)
        .order('due_date', { ascending: false });

      if (error) throw error;

      const paymentsWithOverdue = (data || []).map(payment => {
        if (payment.status === 'pending') {
          const dueDate = new Date(payment.due_date);
          const today = new Date();
          if (dueDate < today) {
            return { ...payment, status: 'overdue' as const };
          }
        }
        return payment;
      });

      setPayments(paymentsWithOverdue);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.businesses?.name.toLowerCase().includes(term) ||
          p.invoice_number?.toLowerCase().includes(term) ||
          p.businesses?.contact_email.toLowerCase().includes(term) ||
          p.concept?.toLowerCase().includes(term)
      );
    }

    setFilteredPayments(filtered);
  };

  const configureZoho = async () => {
    if (!zohoConfig.client_id || !zohoConfig.client_secret || !zohoConfig.code || !zohoConfig.organization_id) {
      alert('Por favor complete todos los campos');
      return;
    }

    setZohoConfiguring(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-invoice?action=setup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(zohoConfig)
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Zoho Invoice configurado correctamente');
        setShowZohoConfig(false);
        await checkZohoStatus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error configuring Zoho:', error);
      alert('Error al configurar Zoho Invoice');
    } finally {
      setZohoConfiguring(false);
    }
  };

  const downloadInvoicePdf = async (payment: Payment) => {
    if (!payment.zoho_invoice_id) {
      alert('Esta factura no tiene un ID de Zoho asociado');
      return;
    }

    setDownloadingPdf(payment.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-invoice?action=get-invoice-pdf&invoice_id=${payment.zoho_invoice_id}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${payment.zoho_invoice_number || payment.invoice_number || payment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const savePayment = async () => {
    if (!editingPayment || !editingPayment.business_id) {
      alert('Seleccione un negocio');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const paymentData = {
        business_id: editingPayment.business_id,
        amount: editingPayment.amount,
        currency: editingPayment.currency || 'USD',
        payment_date: editingPayment.payment_date,
        due_date: editingPayment.due_date,
        status: editingPayment.status,
        payment_method: editingPayment.payment_method,
        invoice_number: editingPayment.invoice_number,
        notes: editingPayment.notes,
        discount_applied: editingPayment.discount_applied || 0,
        concept: editingPayment.concept || 'Suscripcion mensual',
        zoho_invoice_id: editingPayment.zoho_invoice_id,
        zoho_invoice_number: editingPayment.zoho_invoice_number,
        recorded_by: user?.id,
        paid_at: editingPayment.status === 'paid' ? new Date().toISOString() : null,
      };

      if (editingPayment.id) {
        const { error } = await supabase
          .from('business_payments')
          .update(paymentData)
          .eq('id', editingPayment.id);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          superadmin_id: user?.id,
          action_type: 'payment_modified',
          entity_type: 'payment',
          entity_id: editingPayment.id,
          description: `Pago actualizado: ${editingPayment.invoice_number}`,
          new_values: paymentData,
        });
      } else {
        const { error } = await supabase
          .from('business_payments')
          .insert(paymentData);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          superadmin_id: user?.id,
          action_type: 'payment_created',
          entity_type: 'payment',
          description: `Nuevo pago registrado: ${editingPayment.invoice_number}`,
          new_values: paymentData,
        });
      }

      await loadPayments();
      onUpdate();
      setShowModal(false);
      setEditingPayment(null);
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error al guardar el pago');
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!confirm('Esta seguro de eliminar este pago?')) return;

    try {
      const { error } = await supabase
        .from('business_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        superadmin_id: user?.id,
        action_type: 'payment_deleted',
        entity_type: 'payment',
        entity_id: paymentId,
        description: 'Pago eliminado',
      });

      await loadPayments();
      onUpdate();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error al eliminar el pago');
    }
  };

  const markAsPaid = async (payment: Payment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('business_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          recorded_by: user?.id,
        })
        .eq('id', payment.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        superadmin_id: user?.id,
        action_type: 'payment_marked_paid',
        entity_type: 'payment',
        entity_id: payment.id,
        description: `Pago marcado como pagado: ${payment.invoice_number}`,
      });

      const config = await getBusinessTelegramConfig(payment.business_id);
      if (config.enabled && config.chatId) {
        const telegramMsg = telegramTemplates.paymentApproved(
          config.businessName,
          payment.amount,
          payment.currency,
          payment.invoice_number
        );
        await sendTelegramToBusinessIfEnabled(payment.business_id, telegramMsg);
      }

      await loadPayments();
      onUpdate();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('Error al marcar el pago como pagado');
    }
  };

  const StatusBadge = ({ status }: { status: Payment['status'] }) => {
    const styles = {
      paid: 'bg-green-900/30 text-green-100 border-green-800/50',
      pending: 'bg-yellow-900/30 text-yellow-100 border-yellow-800/50',
      overdue: 'bg-red-900/30 text-red-100 border-red-800/50',
      cancelled: 'bg-slate-900/30 text-white border-slate-800/50',
    };

    const labels = {
      paid: 'Pagado',
      pending: 'Pendiente',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTotalsByStatus = () => {
    const totals = {
      paid: 0,
      pending: 0,
      overdue: 0,
      cancelled: 0
    };

    payments.forEach(p => {
      totals[p.status] += p.amount - (p.discount_applied || 0);
    });

    return totals;
  };

  const totals = getTotalsByStatus();

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
          <h2 className="text-2xl font-bold text-gray-900">Gestion de Pagos</h2>
          <p className="text-gray-600 mt-1">Administra pagos y facturacion de negocios</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowZohoConfig(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              zohoStatus?.configured
                ? 'bg-green-900/30 text-green-300 border border-green-700 hover:bg-green-900/50'
                : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            {zohoStatus?.configured ? 'Zoho Configurado' : 'Configurar Zoho'}
          </button>
          <button
            onClick={() => {
              setEditingPayment({
                amount: 0,
                currency: 'USD',
                payment_date: new Date().toISOString().split('T')[0],
                due_date: new Date().toISOString().split('T')[0],
                status: 'pending',
                discount_applied: 0,
                concept: 'Suscripcion mensual',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Registrar Pago
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-100 border border-green-300 rounded-xl p-4">
          <p className="text-green-700 text-sm font-medium">Pagados</p>
          <p className="text-2xl font-bold text-green-900">${totals.paid.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4">
          <p className="text-yellow-700 text-sm font-medium">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-900">${totals.pending.toLocaleString()}</p>
        </div>
        <div className="bg-red-100 border border-red-300 rounded-xl p-4">
          <p className="text-red-700 text-sm font-medium">Vencidos</p>
          <p className="text-2xl font-bold text-red-900">${totals.overdue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-4">
          <p className="text-slate-600 text-sm font-medium">Total Facturas</p>
          <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por negocio, factura, concepto..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="pl-10 pr-8 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="overdue">Vencidos</option>
              <option value="paid">Pagados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Negocio</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Factura</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Concepto</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Monto</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Vencimiento</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Estado</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No se encontraron pagos
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-white">{payment.businesses?.name}</p>
                      <p className="text-sm text-slate-400">{payment.businesses?.contact_email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-white">
                          {payment.zoho_invoice_number || payment.invoice_number || 'N/A'}
                        </span>
                      </div>
                      {payment.zoho_invoice_id && (
                        <span className="text-xs text-blue-400">Zoho Invoice</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-300">{payment.concept || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-white">
                        ${payment.amount.toLocaleString()} {payment.currency}
                      </p>
                      {payment.discount_applied > 0 && (
                        <p className="text-sm text-green-400">-${payment.discount_applied} descuento</p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {payment.zoho_invoice_id && (
                          <button
                            onClick={() => downloadInvoicePdf(payment)}
                            disabled={downloadingPdf === payment.id}
                            className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Descargar PDF"
                          >
                            {downloadingPdf === payment.id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Download className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        {payment.status !== 'paid' && (
                          <button
                            onClick={() => markAsPaid(payment)}
                            className="p-2 text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Marcar como pagado"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingPayment(payment);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deletePayment(payment.id)}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
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

      {showZohoConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">Configurar Zoho Invoice</h3>
              <button
                onClick={() => setShowZohoConfig(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {zohoStatus?.configured && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
                  <p className="text-green-300 font-medium">Zoho Invoice esta configurado</p>
                  <p className="text-green-400 text-sm">Organization ID: {zohoStatus.organization_id}</p>
                  <p className="text-green-400 text-sm">Region: {zohoStatus.region}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={zohoConfig.client_id}
                  onChange={(e) => setZohoConfig({ ...zohoConfig, client_id: e.target.value })}
                  placeholder="1000.XXXX..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={zohoConfig.client_secret}
                  onChange={(e) => setZohoConfig({ ...zohoConfig, client_secret: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Authorization Code
                </label>
                <input
                  type="text"
                  value={zohoConfig.code}
                  onChange={(e) => setZohoConfig({ ...zohoConfig, code: e.target.value })}
                  placeholder="1000.xxxx.yyyy"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Obtener desde Zoho API Console
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Organization ID
                </label>
                <input
                  type="text"
                  value={zohoConfig.organization_id}
                  onChange={(e) => setZohoConfig({ ...zohoConfig, organization_id: e.target.value })}
                  placeholder="ID de tu organizacion en Zoho"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Region
                </label>
                <select
                  value={zohoConfig.region}
                  onChange={(e) => setZohoConfig({ ...zohoConfig, region: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="us">Estados Unidos (.com)</option>
                  <option value="eu">Europa (.eu)</option>
                  <option value="in">India (.in)</option>
                  <option value="au">Australia (.com.au)</option>
                  <option value="jp">Japon (.jp)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowZohoConfig(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg font-semibold text-white hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={configureZoho}
                  disabled={zohoConfiguring}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                >
                  {zohoConfiguring ? 'Configurando...' : 'Guardar'}
                </button>
              </div>

              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">
                  <ExternalLink className="w-4 h-4 inline mr-1" />
                  Para obtener las credenciales, visita{' '}
                  <a
                    href="https://api-console.zoho.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Zoho API Console
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && editingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white">
                {editingPayment.id ? 'Editar Pago' : 'Nuevo Pago'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Negocio
                  </label>
                  <select
                    value={editingPayment.business_id || ''}
                    onChange={(e) => setEditingPayment({ ...editingPayment, business_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar negocio...</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name} - {b.contact_email}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={editingPayment.concept || ''}
                    onChange={(e) => setEditingPayment({ ...editingPayment, concept: e.target.value })}
                    placeholder="Ej: Suscripcion mensual, Renovacion anual..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    value={editingPayment.amount || 0}
                    onChange={(e) => setEditingPayment({ ...editingPayment, amount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Moneda
                  </label>
                  <select
                    value={editingPayment.currency || 'USD'}
                    onChange={(e) => setEditingPayment({ ...editingPayment, currency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="DOP">DOP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Numero de Factura
                  </label>
                  <input
                    type="text"
                    value={editingPayment.invoice_number || ''}
                    onChange={(e) => setEditingPayment({ ...editingPayment, invoice_number: e.target.value })}
                    placeholder="INV-001"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Metodo de Pago
                  </label>
                  <select
                    value={editingPayment.payment_method || ''}
                    onChange={(e) => setEditingPayment({ ...editingPayment, payment_method: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="transfer">Transferencia</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={editingPayment.payment_date || ''}
                    onChange={(e) => setEditingPayment({ ...editingPayment, payment_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={editingPayment.due_date || ''}
                    onChange={(e) => setEditingPayment({ ...editingPayment, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={editingPayment.status || 'pending'}
                    onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value as Payment['status'] })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Descuento
                  </label>
                  <input
                    type="number"
                    value={editingPayment.discount_applied || 0}
                    onChange={(e) => setEditingPayment({ ...editingPayment, discount_applied: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {zohoStatus?.configured && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        ID Factura Zoho
                      </label>
                      <input
                        type="text"
                        value={editingPayment.zoho_invoice_id || ''}
                        onChange={(e) => setEditingPayment({ ...editingPayment, zoho_invoice_id: e.target.value })}
                        placeholder="ID de Zoho Invoice"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Numero Factura Zoho
                      </label>
                      <input
                        type="text"
                        value={editingPayment.zoho_invoice_number || ''}
                        onChange={(e) => setEditingPayment({ ...editingPayment, zoho_invoice_number: e.target.value })}
                        placeholder="INV-00001"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={editingPayment.notes || ''}
                    onChange={(e) => setEditingPayment({ ...editingPayment, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingPayment(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg font-semibold text-white hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={savePayment}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
