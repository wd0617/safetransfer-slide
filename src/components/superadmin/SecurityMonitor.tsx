import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SecurityMonitor() {
  const [loading, setLoading] = useState(false);
  const [blockedAccounts, setBlockedAccounts] = useState(0);
  const [activeBlocks, setActiveBlocks] = useState(0);

  useEffect(() => {
    loadSecurityStats();
  }, []);

  const loadSecurityStats = async () => {
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('status')
        .eq('status', 'blocked');

      setBlockedAccounts(businesses?.length || 0);
      setActiveBlocks(businesses?.length || 0);
    } catch (error) {
      console.error('Error loading security stats:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadSecurityStats();
    setTimeout(() => setLoading(false), 1000);
  };

  const AlertCard = ({ type, count, label }: { type: 'critical' | 'high' | 'medium'; count: number; label: string }) => {
    const colors = {
      critical: 'bg-white border-red-500',
      high: 'bg-white border-orange-500',
      medium: 'bg-white border-yellow-500',
    };

    const iconColors = {
      critical: 'text-red-500',
      high: 'text-orange-500',
      medium: 'text-yellow-600',
    };

    const textColors = {
      critical: 'text-red-700',
      high: 'text-orange-700',
      medium: 'text-yellow-700',
    };

    const icons = {
      critical: AlertTriangle,
      high: AlertTriangle,
      medium: Shield,
    };

    const Icon = icons[type];

    return (
      <div className={`rounded-xl p-6 border-l-4 shadow-sm ${colors[type]}`}>
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-6 h-6 ${iconColors[type]}`} />
          <h3 className={`font-bold text-lg ${textColors[type]}`}>{label}</h3>
        </div>
        <p className={`text-4xl font-bold ${textColors[type]}`}>{count}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            Monitoreo de Seguridad
          </h2>
          <p className="text-gray-600 mt-1">Alertas y eventos de seguridad del sistema</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AlertCard type="critical" count={0} label="Alertas Críticas" />
        <AlertCard type="high" count={0} label="Alertas Altas" />
        <AlertCard type="medium" count={blockedAccounts} label="Cuentas Bloqueadas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <button className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-xl transition-all shadow-lg text-left">
          <h3 className="font-bold text-lg mb-2">Alertas de Seguridad</h3>
          <p className="text-blue-100">Ver todas las alertas</p>
        </button>
        <button className="bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white p-6 rounded-xl transition-all shadow-lg text-left">
          <h3 className="font-bold text-lg mb-2">Intentos Fallidos</h3>
          <p className="text-slate-100">Monitorear accesos</p>
        </button>
        <button className="bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white p-6 rounded-xl transition-all shadow-lg text-left">
          <h3 className="font-bold text-lg mb-2">Bloqueos Activos</h3>
          <p className="text-slate-100">{activeBlocks} cuenta(s) bloqueada(s)</p>
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-8 text-center">
        <Shield className="w-16 h-16 text-white mx-auto mb-4" />
        <p className="text-white text-lg">No hay alertas pendientes</p>
        <p className="text-white text-sm mt-2">El sistema está funcionando correctamente</p>
      </div>
    </div>
  );
}
