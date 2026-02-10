import { useState, useEffect } from 'react';
import {
  FileText, Calendar, Download, RefreshCw, CheckCircle,
  Clock, AlertTriangle, XCircle, CreditCard
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
}

interface PaymentsPanelProps {
  businessId: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  translations: {
    payments?: string;
    paymentHistory?: string;
    invoice?: string;
    amount?: string;
    status?: string;
    dueDate?: string;
    downloadInvoice?: string;
    paid?: string;
    pending?: string;
    overdue?: string;
    cancelled?: string;
    noPayments?: string;
    concept?: string;
    date?: string;
  };
}

export default function PaymentsPanel({ businessId, theme, translations }: PaymentsPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const t = {
    payments: translations.payments || 'Pagos',
    paymentHistory: translations.paymentHistory || 'Historial de Pagos',
    invoice: translations.invoice || 'Factura',
    amount: translations.amount || 'Monto',
    status: translations.status || 'Estado',
    dueDate: translations.dueDate || 'Vencimiento',
    downloadInvoice: translations.downloadInvoice || 'Descargar Factura',
    paid: translations.paid || 'Pagado',
    pending: translations.pending || 'Pendiente',
    overdue: translations.overdue || 'Vencido',
    cancelled: translations.cancelled || 'Cancelado',
    noPayments: translations.noPayments || 'No hay pagos registrados',
    concept: translations.concept || 'Concepto',
    date: translations.date || 'Fecha',
  };

  useEffect(() => {
    loadPayments();
  }, [businessId]);

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('business_payments')
        .select('*')
        .eq('business_id', businessId)
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

  const downloadInvoicePdf = async (payment: Payment) => {
    if (!payment.zoho_invoice_id) {
      alert('Esta factura no tiene PDF disponible');
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
      alert('Error al descargar la factura');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getTotals = () => {
    const totals = {
      paid: 0,
      pending: 0,
      overdue: 0,
      total: 0
    };

    payments.forEach(p => {
      const amount = p.amount - (p.discount_applied || 0);
      totals.total += amount;
      if (p.status === 'paid') totals.paid += amount;
      else if (p.status === 'pending') totals.pending += amount;
      else if (p.status === 'overdue') totals.overdue += amount;
    });

    return totals;
  };

  const totals = getTotals();

  const StatusIcon = ({ status }: { status: Payment['status'] }) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'paid': return t.paid;
      case 'pending': return t.pending;
      case 'overdue': return t.overdue;
      case 'cancelled': return t.cancelled;
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6" style={{ color: theme.primary }} />
        <h2 className="text-xl font-bold" style={{ color: theme.text }}>
          {t.paymentHistory}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-white border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600 font-medium">{t.paid}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${totals.paid.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl p-4 bg-white border-l-4 border-yellow-500 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-gray-600 font-medium">{t.pending}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${totals.pending.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl p-4 bg-white border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-600 font-medium">{t.overdue}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${totals.overdue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl p-4 bg-white border-l-4 border-gray-400 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              Total Facturas
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {payments.length}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'paid', 'pending', 'overdue'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
              filter === status
                ? 'bg-white shadow-md text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
            }`}
            style={filter === status ? { borderColor: theme.primary } : {}}
          >
            {status === 'all' ? 'Todos' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border
        }}
      >
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: theme.textSecondary }} />
            <p style={{ color: theme.textSecondary }}>{t.noPayments}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {filteredPayments.map(payment => (
              <div
                key={payment.id}
                className="p-4 hover:bg-black/5 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <StatusIcon status={payment.status} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold" style={{ color: theme.text }}>
                          {payment.zoho_invoice_number || payment.invoice_number || `#${payment.id.slice(0, 8)}`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                        {payment.concept || 'Suscripcion'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: theme.textSecondary }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {t.dueDate}: {new Date(payment.due_date).toLocaleDateString()}
                        </span>
                        {payment.paid_at && (
                          <span className="text-green-600">
                            Pagado: {new Date(payment.paid_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: theme.text }}>
                        ${payment.amount.toLocaleString()} {payment.currency}
                      </p>
                      {payment.discount_applied > 0 && (
                        <p className="text-sm text-green-600">
                          -${payment.discount_applied} descuento
                        </p>
                      )}
                    </div>

                    {payment.zoho_invoice_id && (
                      <button
                        onClick={() => downloadInvoicePdf(payment)}
                        disabled={downloadingPdf === payment.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {downloadingPdf === payment.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{t.downloadInvoice}</span>
                      </button>
                    )}
                  </div>
                </div>

                {payment.notes && (
                  <div
                    className="mt-3 p-3 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      color: theme.textSecondary
                    }}
                  >
                    {payment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
