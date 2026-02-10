import { useEffect, useState, useRef } from 'react';
import { supabase, ExchangeRate } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Copy, Check } from 'lucide-react';
import CountrySelector, { SelectedCountry } from './CountrySelector';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';
import { getTranslatedCountryName, COUNTRIES } from '../../lib/countries';

interface ExchangeRatesManagerProps {
  businessId?: string;
}

interface InlineEditData {
  bank: string;
  rate: string;
  is_active: boolean;
}

export default function ExchangeRatesManager({ businessId = '' }: ExchangeRatesManagerProps) {
  const { language } = useBusiness();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<InlineEditData>({ bank: '', rate: '', is_active: true });
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry | null>(null);
  const [formData, setFormData] = useState({
    bank: '',
    rate: '',
    is_active: true
  });
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRates();
  }, [businessId]);

  async function loadRates() {
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('business_id', businessId)
      .order('country', { ascending: true });
    if (data) setRates(data);
  }

  const getDisplayCountryName = (rate: ExchangeRate): string => {
    return getTranslatedCountryName(rate.country_code, rate.country, language);
  };

  const groupedRates = rates.reduce((acc, rate) => {
    const displayName = getDisplayCountryName(rate);
    if (!acc[displayName]) {
      acc[displayName] = [];
    }
    acc[displayName].push(rate);
    return acc;
  }, {} as Record<string, ExchangeRate[]>);

  const countries = Object.keys(groupedRates).sort();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      const updateData: Record<string, unknown> = {
        bank: formData.bank,
        rate: parseFloat(formData.rate),
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (selectedCountry) {
        updateData.country = selectedCountry.name;
        updateData.country_code = selectedCountry.code;
        updateData.flag_url = selectedCountry.flagUrl;
      }

      const { error } = await supabase
        .from('exchange_rates')
        .update(updateData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating rate:', error);
        return;
      }
    } else {
      if (!selectedCountry) {
        console.error('No country selected');
        return;
      }

      const maxOrder = rates.length > 0 ? Math.max(...rates.map(r => r.order_index)) : 0;
      const { error } = await supabase
        .from('exchange_rates')
        .insert({
          business_id: businessId,
          country: selectedCountry.name,
          country_code: selectedCountry.code,
          bank: formData.bank,
          rate: parseFloat(formData.rate),
          flag_emoji: '',
          flag_url: selectedCountry.flagUrl,
          is_active: formData.is_active,
          order_index: maxOrder + 1
        });

      if (error) {
        console.error('Error inserting rate:', error);
        return;
      }
    }

    resetForm();
    loadRates();
  }

  function resetForm() {
    setFormData({ bank: '', rate: '', is_active: true });
    setEditingId(null);
    setSelectedCountry(null);
  }

  function editRate(rate: ExchangeRate) {
    setFormData({
      bank: rate.bank,
      rate: rate.rate.toString(),
      is_active: rate.is_active
    });
    setEditingId(rate.id);
    const countryCode = rate.country_code || COUNTRIES.find(c => c.names.es === rate.country || c.names.en === rate.country || c.names.it === rate.country)?.code || '';
    setSelectedCountry({
      code: countryCode,
      name: getDisplayCountryName(rate),
      flagUrl: rate.flag_url || ''
    });
    scrollToForm();
  }

  function startInlineEdit(rate: ExchangeRate) {
    setInlineEditingId(rate.id);
    setInlineEditData({
      bank: rate.bank,
      rate: rate.rate.toString(),
      is_active: rate.is_active
    });
  }

  function cancelInlineEdit() {
    setInlineEditingId(null);
    setInlineEditData({ bank: '', rate: '', is_active: true });
  }

  async function saveInlineEdit(rate: ExchangeRate) {
    const { error } = await supabase
      .from('exchange_rates')
      .update({
        bank: inlineEditData.bank,
        rate: parseFloat(inlineEditData.rate),
        is_active: inlineEditData.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', rate.id);

    if (error) {
      console.error('Error updating rate:', error);
      return;
    }

    setInlineEditingId(null);
    loadRates();
  }

  async function duplicateRate(rate: ExchangeRate) {
    const maxOrder = rates.length > 0 ? Math.max(...rates.map(r => r.order_index)) : 0;
    const { error } = await supabase
      .from('exchange_rates')
      .insert({
        business_id: businessId,
        country: rate.country,
        country_code: rate.country_code,
        bank: `${rate.bank} (${getTranslation(language, 'copy')})`,
        rate: rate.rate,
        flag_emoji: rate.flag_emoji,
        flag_url: rate.flag_url,
        is_active: rate.is_active,
        order_index: maxOrder + 1
      });

    if (error) {
      console.error('Error duplicating rate:', error);
      return;
    }

    loadRates();
  }

  function handleAddBankForCountry(countryName: string) {
    const countryRates = groupedRates[countryName];
    if (countryRates && countryRates[0]) {
      const rate = countryRates[0];
      const countryCode = rate.country_code || COUNTRIES.find(c => c.names.es === rate.country || c.names.en === rate.country || c.names.it === rate.country)?.code || '';

      setSelectedCountry({
        code: countryCode,
        name: countryName,
        flagUrl: rate.flag_url || ''
      });
    }
    setFormData({
      bank: '',
      rate: '',
      is_active: true
    });
    setEditingId(null);
    scrollToForm();
  }

  function scrollToForm() {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  async function deleteRate(id: string) {
    if (confirm(getTranslation(language, 'deleteExchangeRate'))) {
      await supabase.from('exchange_rates').delete().eq('id', id);
      loadRates();
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    await supabase
      .from('exchange_rates')
      .update({ is_active: !currentState })
      .eq('id', id);
    loadRates();
  }

  const getFormTitle = () => {
    if (editingId) {
      return getTranslation(language, 'editBank');
    }
    if (selectedCountry) {
      return `${getTranslation(language, 'addBankTo')} ${selectedCountry.name}`;
    }
    return getTranslation(language, 'addBank');
  };

  return (
    <div className="space-y-6">
      <div ref={formRef} className="bg-slate-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          {getFormTitle()}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {getTranslation(language, 'country')}
              </label>
              <CountrySelector
                value={selectedCountry}
                onChange={setSelectedCountry}
                language={language}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {getTranslation(language, 'bank')}
              </label>
              <input
                type="text"
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                placeholder={getTranslation(language, 'exampleBank')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {getTranslation(language, 'rate')}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                required
              />
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

      <div className="space-y-4">
        {countries.map((country) => (
          <div key={country} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {groupedRates[country][0]?.flag_url && (
                    <img
                      src={groupedRates[country][0].flag_url}
                      alt={country}
                      className="w-12 h-9 object-cover rounded shadow-md"
                    />
                  )}
                  <h3 className="text-xl font-bold text-slate-800">{country}</h3>
                </div>
                <button
                  onClick={() => handleAddBankForCountry(country)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {getTranslation(language, 'addBank')}
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {groupedRates[country].map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  {inlineEditingId === rate.id ? (
                    <>
                      <div className="flex-1 flex items-center gap-4">
                        <input
                          type="text"
                          value={inlineEditData.bank}
                          onChange={(e) => setInlineEditData({ ...inlineEditData, bank: e.target.value })}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                          placeholder={getTranslation(language, 'bank')}
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={inlineEditData.rate}
                          onChange={(e) => setInlineEditData({ ...inlineEditData, rate: e.target.value })}
                          className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                          placeholder={getTranslation(language, 'rate')}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inlineEditData.is_active}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, is_active: e.target.checked })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-xs text-slate-600">{getTranslation(language, 'active')}</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => saveInlineEdit(rate)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title={getTranslation(language, 'save')}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelInlineEdit}
                          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                          title={getTranslation(language, 'cancel')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{rate.bank}</p>
                        <p className="text-2xl font-bold text-blue-600">{rate.rate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rate.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {rate.is_active ? getTranslation(language, 'active') : getTranslation(language, 'inactive')}
                        </span>
                        <button
                          onClick={() => toggleActive(rate.id, rate.is_active)}
                          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                          title={rate.is_active ? getTranslation(language, 'disabled') : getTranslation(language, 'enabled')}
                        >
                          {rate.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => duplicateRate(rate)}
                          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg"
                          title={getTranslation(language, 'duplicate')}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startInlineEdit(rate)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title={getTranslation(language, 'edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRate(rate.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title={getTranslation(language, 'delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {countries.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500">{getTranslation(language, 'noCountriesConfigured')}</p>
        </div>
      )}
    </div>
  );
}
