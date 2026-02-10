import { useEffect, useState } from 'react';
import { supabase, ServiceLogo } from '../../lib/supabase';
import { Pencil, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';

interface ServiceLogosManagerProps {
  businessId?: string;
}

export default function ServiceLogosManager({ businessId = '' }: ServiceLogosManagerProps) {
  const { language } = useBusiness();
  const [logos, setLogos] = useState<ServiceLogo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    is_active: true
  });

  useEffect(() => {
    loadLogos();
  }, [businessId]);

  async function loadLogos() {
    const { data } = await supabase
      .from('service_logos')
      .select('*')
      .eq('business_id', businessId)
      .order('order_index');
    if (data) setLogos(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      await supabase
        .from('service_logos')
        .update({
          name: formData.name,
          url: formData.url,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);
    } else {
      const maxOrder = logos.length > 0 ? Math.max(...logos.map(l => l.order_index)) : 0;
      await supabase
        .from('service_logos')
        .insert({
          business_id: businessId,
          name: formData.name,
          url: formData.url,
          is_active: formData.is_active,
          order_index: maxOrder + 1
        });
    }

    resetForm();
    loadLogos();
  }

  function resetForm() {
    setFormData({ name: '', url: '', is_active: true });
    setEditingId(null);
  }

  function editLogo(logo: ServiceLogo) {
    setFormData({
      name: logo.name,
      url: logo.url,
      is_active: logo.is_active
    });
    setEditingId(logo.id);
  }

  async function deleteLogo(id: string) {
    if (confirm(getTranslation(language, 'deleteServiceLogo'))) {
      await supabase.from('service_logos').delete().eq('id', id);
      loadLogos();
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    await supabase
      .from('service_logos')
      .update({ is_active: !currentState })
      .eq('id', id);
    loadLogos();
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          {editingId ? getTranslation(language, 'editServiceLogo') : getTranslation(language, 'addServiceLogoItem')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(language, 'serviceNameOptional')} <span className="text-slate-400 font-normal">({getTranslation(language, 'optional')})</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              placeholder={getTranslation(language, 'exampleServiceName')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(language, 'logoUrlLabel')}
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              placeholder={getTranslation(language, 'exampleLogoUrl')}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {getTranslation(language, 'useOfficialLogos')}
            </p>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">{getTranslation(language, 'active')}</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              {editingId ? getTranslation(language, 'update') : getTranslation(language, 'add')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-6 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500"
              >
                <X className="w-4 h-4" />
                {getTranslation(language, 'cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {logos.map((logo) => (
          <div key={logo.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center p-4">
              <img
                src={logo.url}
                alt={logo.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/200x100?text=Error';
                }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-slate-900">{logo.name || getTranslation(language, 'noName')}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  logo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {logo.is_active ? getTranslation(language, 'active') : getTranslation(language, 'inactive')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(logo.id, logo.is_active)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
                >
                  {logo.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => editLogo(logo)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteLogo(logo.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {logos.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500">{getTranslation(language, 'noServiceLogos')}</p>
        </div>
      )}
    </div>
  );
}
