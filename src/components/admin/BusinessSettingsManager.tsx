import { useEffect, useState } from 'react';
import { supabase, BusinessSettings } from '../../lib/supabase';
import { Save, Clock, Building2, Cloud, Upload, X, Languages, Palette, MessageCircle, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';
import { getAllThemes } from '../../lib/themes';

interface BusinessSettingsManagerProps {
  businessId?: string;
}

export default function BusinessSettingsManager({ businessId = '' }: BusinessSettingsManagerProps) {
  const { language: contextLanguage, refreshBusiness } = useBusiness();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [weatherCity, setWeatherCity] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState('es');
  const [colorTheme, setColorTheme] = useState('ocean-blue');
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#1e40af');
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#fbbf24');
  const [uploading, setUploading] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableThemes = getAllThemes();

  const getOptimalTextColor = (bgColor: string) => {
    const hexToRgb = (hex: string) => {
      const h = hex.replace('#', '');
      return {
        r: parseInt(h.substr(0, 2), 16),
        g: parseInt(h.substr(2, 2), 16),
        b: parseInt(h.substr(4, 2), 16),
      };
    };

    const getLuminance = (hex: string) => {
      const rgb = hexToRgb(hex);
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const getContrastRatio = (color1: string, color2: string) => {
      const lum1 = getLuminance(color1);
      const lum2 = getLuminance(color2);
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const whiteContrast = getContrastRatio(bgColor, '#ffffff');
    const blackContrast = getContrastRatio(bgColor, '#000000');

    return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
  };

  const previewTextColor = getOptimalTextColor(customPrimaryColor);

  useEffect(() => {
    loadSettings();
  }, [businessId]);

  async function loadSettings() {
    const { data } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (data) {
      setSettings(data);
      setBusinessName(data.business_name || '');
      setBusinessHours(data.business_hours || '');
      setWeatherCity(data.weather_city || '');
      setLogoUrl(data.logo_url || null);
      setLanguage(data.language || 'es');
      setColorTheme(data.color_theme || 'ocean-blue');
      setCustomPrimaryColor(data.custom_primary_color || '#1e40af');
      setCustomSecondaryColor(data.custom_secondary_color || '#fbbf24');
      setTelegramChatId(data.telegram_chat_id || '');
      setTelegramEnabled(data.telegram_notifications_enabled || false);
    }
  }

  async function testTelegramNotification() {
    if (!telegramChatId) {
      setTelegramMessage({ type: 'error', text: 'Ingresa tu Chat ID primero' });
      return;
    }

    setTestingTelegram(true);
    setTelegramMessage(null);

    try {
      const { data: superadmin } = await supabase
        .from('superadmin_users')
        .select('telegram_bot_token')
        .limit(1)
        .maybeSingle();

      if (!superadmin?.telegram_bot_token) {
        setTelegramMessage({ type: 'error', text: 'El administrador no ha configurado el bot de Telegram' });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-telegram`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bot_token: superadmin.telegram_bot_token,
            chat_id: telegramChatId,
            message: `<b>Prueba Exitosa</b>\n\nHola <b>${businessName || 'Negocio'}</b>,\n\nTu cuenta de Telegram ha sido configurada correctamente.\n\nAhora recibiras notificaciones importantes aqui.\n\n<i>SafeTransfer Slide</i>`,
            parse_mode: 'HTML',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar mensaje');
      }

      setTelegramMessage({ type: 'success', text: 'Mensaje de prueba enviado correctamente' });
    } catch (error) {
      console.error('Error testing telegram:', error);
      setTelegramMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al enviar mensaje de prueba' });
    } finally {
      setTestingTelegram(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(getTranslation(contextLanguage, 'selectImageFile'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(getTranslation(contextLanguage, 'imageMustBeLessThan'));
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      if (logoUrl) {
        const oldFileName = logoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('business-logos')
            .remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);

      if (settings) {
        await supabase
          .from('business_settings')
          .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', settings.id);
      }

      alert(getTranslation(contextLanguage, 'logoUploadedSuccessfully'));
      loadSettings();
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`${getTranslation(contextLanguage, 'errorUploadingLogo')}: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    if (!logoUrl || !settings) return;

    const fileName = logoUrl.split('/').pop();
    if (fileName) {
      await supabase.storage
        .from('business-logos')
        .remove([fileName]);
    }

    await supabase
      .from('business_settings')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('id', settings.id);

    setLogoUrl(null);
    alert(getTranslation(contextLanguage, 'logoDeletedSuccessfully'));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (settings) {
      await supabase
        .from('business_settings')
        .update({
          business_name: businessName,
          business_hours: businessHours,
          weather_city: weatherCity,
          language: language,
          color_theme: colorTheme,
          custom_primary_color: colorTheme === 'custom' ? customPrimaryColor : null,
          custom_secondary_color: colorTheme === 'custom' ? customSecondaryColor : null,
          telegram_chat_id: telegramChatId || null,
          telegram_notifications_enabled: telegramEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);
    } else {
      await supabase
        .from('business_settings')
        .insert({
          business_id: businessId,
          business_name: businessName,
          business_hours: businessHours,
          weather_city: weatherCity,
          language: language,
          color_theme: colorTheme,
          custom_primary_color: colorTheme === 'custom' ? customPrimaryColor : null,
          custom_secondary_color: colorTheme === 'custom' ? customSecondaryColor : null,
          telegram_chat_id: telegramChatId || null,
          telegram_notifications_enabled: telegramEnabled
        });
    }

    loadSettings();
    await refreshBusiness();
    alert(getTranslation(contextLanguage, 'configurationSavedSuccessfully'));
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800">{getTranslation(contextLanguage, 'businessSettings')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(contextLanguage, 'businessLogo')}
            </label>
            <div className="space-y-3">
              {logoUrl ? (
                <div className="flex items-center gap-4">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 w-auto object-contain bg-slate-100 rounded-lg p-2"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                    {getTranslation(contextLanguage, 'removeLogo')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploading ? getTranslation(contextLanguage, 'uploading') : getTranslation(contextLanguage, 'uploadLogo')}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {logoUrl
                  ? getTranslation(contextLanguage, 'displayThisIfNoLogo')
                  : getTranslation(contextLanguage, 'uploadLogoInfo')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(contextLanguage, 'businessName')}
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Ej: Money Transfer Express"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              {logoUrl
                ? getTranslation(contextLanguage, 'usedAsAlternativeText')
                : getTranslation(contextLanguage, 'nameWillBeDisplayed')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(contextLanguage, 'businessHours')}
            </label>
            <input
              type="text"
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Ej: Lun-Vie: 9:00 AM - 6:00 PM | Sáb: 9:00 AM - 2:00 PM"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              {getTranslation(contextLanguage, 'usePipeToSeparate')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(contextLanguage, 'weatherCity')}
            </label>
            <input
              type="text"
              value={weatherCity}
              onChange={(e) => setWeatherCity(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Ej: Santo Domingo, New York, Miami"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              {getTranslation(contextLanguage, 'temperatureWillBeShown')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Languages className="w-5 h-5 text-slate-600" />
              {getTranslation(contextLanguage, 'language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              required
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="it">Italiano</option>
            </select>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-600" />
              Notificaciones por Telegram
            </label>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="telegramEnabled"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="w-5 h-5 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                />
                <label htmlFor="telegramEnabled" className="text-sm text-slate-700">
                  Activar notificaciones por Telegram
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Tu Chat ID de Telegram
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                    placeholder="Ej: 123456789"
                  />
                  <button
                    type="button"
                    onClick={testTelegramNotification}
                    disabled={testingTelegram || !telegramChatId}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Probar
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Para obtener tu Chat ID: 1) Inicia una conversacion con{' '}
                  <a
                    href="https://t.me/SafeTransferSlideBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 underline font-medium"
                  >
                    @SafeTransferSlideBot
                  </a>
                  , 2) Envia cualquier mensaje, 3) Pregunta al administrador tu Chat ID
                </p>
              </div>

              {telegramMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${telegramMessage.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                  {telegramMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <p className="text-sm">{telegramMessage.text}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5 text-slate-600" />
              Tema de Color
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setColorTheme(theme.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${colorTheme === theme.id
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1 h-8">
                      <div
                        className="flex-1 rounded"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="flex-1 rounded"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                    </div>
                    <div className="text-xs font-medium text-slate-800 text-center">
                      {theme.name}
                    </div>
                  </div>
                  {colorTheme === theme.id && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setColorTheme('custom')}
                className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${colorTheme === 'custom'
                    ? 'border-blue-600 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1 h-8">
                    <div
                      className="flex-1 rounded"
                      style={{ backgroundColor: customPrimaryColor }}
                    />
                    <div
                      className="flex-1 rounded"
                      style={{ backgroundColor: customSecondaryColor }}
                    />
                  </div>
                  <div className="text-xs font-medium text-slate-800 text-center">
                    Personalizado
                  </div>
                </div>
                {colorTheme === 'custom' && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            </div>

            {colorTheme === 'custom' && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Colores Personalizados</h4>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>💡 Sistema Inteligente:</strong> Usa cualquier color que desees.
                    El sistema ajustará automáticamente el texto (claro u oscuro) y los acentos para garantizar máxima legibilidad sobre tu fondo elegido.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Color Principal (Fondos)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customPrimaryColor}
                        onChange={(e) => setCustomPrimaryColor(e.target.value)}
                        className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customPrimaryColor}
                        onChange={(e) => setCustomPrimaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono uppercase"
                        placeholder="#1e40af"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Se usará para fondos y estructura</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Color Secundario (Acentos)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customSecondaryColor}
                        onChange={(e) => setCustomSecondaryColor(e.target.value)}
                        className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customSecondaryColor}
                        onChange={(e) => setCustomSecondaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono uppercase"
                        placeholder="#fbbf24"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Se usará para destacados y bordes</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg border-2 border-slate-300 shadow-sm">
                  <p className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="text-lg">👁️</span>
                    Vista previa con contraste optimizado:
                  </p>
                  <div className="space-y-3">
                    <div className="h-24 rounded-lg p-4 flex flex-col justify-between" style={{
                      background: `linear-gradient(135deg, ${customPrimaryColor} 0%, ${customPrimaryColor}dd 100%)`
                    }}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg" style={{ color: previewTextColor }}>
                          Tasas de Cambio
                        </span>
                        <span className="text-sm" style={{ color: previewTextColor }}>
                          12:30:45
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full" style={{ backgroundColor: customSecondaryColor }}>
                          <span className="font-semibold text-sm" style={{ color: previewTextColor }}>
                            Guatemala
                          </span>
                        </div>
                        <span className="font-bold text-2xl" style={{ color: previewTextColor }}>
                          7.85
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic text-center">
                      ✓ Texto automático: {previewTextColor === '#ffffff' ? 'Claro (sobre fondo oscuro)' : 'Oscuro (sobre fondo claro)'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2">
              Selecciona un tema predeterminado o crea uno personalizado con tus propios colores
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {getTranslation(contextLanguage, 'textsWillBeDisplayed')}
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Save className="w-5 h-5" />
            {getTranslation(contextLanguage, 'saveConfiguration')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{getTranslation(contextLanguage, 'preview')}</h3>
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-lg p-6 space-y-4">
          <div>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName || 'Logo'}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <h4 className="text-3xl font-bold">{businessName || 'Money Transfer'}</h4>
            )}
            <p className="text-blue-200">{getTranslation(contextLanguage, 'internationalShipping')}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-sm text-blue-200">{getTranslation(contextLanguage, 'schedule')}</p>
                <p className="text-lg font-semibold">{businessHours || 'No configurado'}</p>
              </div>
            </div>
            {weatherCity && (
              <div className="flex items-center gap-3">
                <Cloud className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-lg font-semibold">--°C</p>
                  <p className="text-xs text-blue-200">{weatherCity}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">{getTranslation(contextLanguage, 'information')}</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {getTranslation(contextLanguage, 'changesReflectRealTime')}</li>
          <li>• {getTranslation(contextLanguage, 'weatherUpdatesAutomatically')}</li>
          <li>• {getTranslation(contextLanguage, 'useRecognizedCityNames')}</li>
        </ul>
      </div>
    </div>
  );
}
