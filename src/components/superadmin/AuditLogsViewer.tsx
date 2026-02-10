import { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, User, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuditLog {
  id: string;
  superadmin_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  description: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  superadmin_users?: {
    full_name: string;
    email: string;
  };
}

export default function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, dateFilter]);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          superadmin_users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(log => new Date(log.created_at) >= startDate);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.description.toLowerCase().includes(term) ||
          log.action_type.toLowerCase().includes(term) ||
          log.entity_type.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const csv = [
      ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Descripción'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.superadmin_users?.email || 'N/A',
        log.action_type,
        log.entity_type,
        log.description,
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('delete')) return 'text-red-100 bg-red-900/30';
    if (actionType.includes('create') || actionType.includes('insert')) return 'text-green-100 bg-green-900/30';
    if (actionType.includes('update') || actionType.includes('modif')) return 'text-blue-100 bg-blue-900/30';
    if (actionType.includes('block')) return 'text-orange-100 bg-orange-900/30';
    return 'text-white bg-slate-900/30';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  const actionTypes = Array.from(new Set(logs.map(log => log.action_type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registros de Auditoria</h2>
          <p className="text-gray-600 mt-1">Historial completo de acciones del sistema</p>
        </div>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
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
              placeholder="Buscar en logs..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none min-w-[200px]"
            >
              <option value="all">Todas las acciones</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-white">
              No se encontraron registros
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                      <span className="text-sm text-white">
                        {log.entity_type}
                      </span>
                    </div>
                    <p className="text-white font-medium mb-2">{log.description}</p>
                    <div className="flex items-center gap-4 text-sm text-white">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{log.superadmin_users?.email || 'Sistema'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Activity className="w-5 h-5 text-white flex-shrink-0" />
                </div>

                {(log.old_values || log.new_values) && (
                  <details className="mt-3 pt-3 border-t border-gray-200">
                    <summary className="cursor-pointer text-sm font-semibold text-white hover:text-white">
                      Ver detalles
                    </summary>
                    <div className="mt-2 space-y-2 text-sm">
                      {log.old_values && (
                        <div>
                          <span className="font-semibold text-white">Valores anteriores:</span>
                          <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <span className="font-semibold text-white">Valores nuevos:</span>
                          <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))
          )}
        </div>

        {filteredLogs.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700 text-center text-sm text-white">
            Mostrando {filteredLogs.length} de {logs.length} registros
          </div>
        )}
      </div>
    </div>
  );
}
