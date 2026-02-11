import { useState, useEffect } from 'react';
import { ShieldOff, ArrowLeft, DollarSign, Globe, BarChart3, Megaphone, Image, Clock, Palette, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../lib/sessionManager';
import { getTranslation, Language } from '../lib/translations';

interface BusinessLoginProps {
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
  onBack: () => void;
  onShowDeactivatedMessage: () => void;
  onHideDeactivatedMessage: () => void;
  onPasswordRecoveryClick: () => void;
}

const rotatingPhrases = [
  {
    icon: DollarSign,
    phrases: {
      es: 'Gestiona tasas de cambio en tiempo real',
      en: 'Manage exchange rates in real time',
      it: 'Gestisci i tassi di cambio in tempo reale'
    }
  },
  {
    icon: Globe,
    phrases: {
      es: 'Soporte multiidioma: Español, Inglés, Italiano',
      en: 'Multi-language support: Spanish, English, Italian',
      it: 'Supporto multilingua: Spagnolo, Inglese, Italiano'
    }
  },
  {
    icon: BarChart3,
    phrases: {
      es: 'Muestra las mejores tasas automaticamente',
      en: 'Display best rates automatically',
      it: 'Mostra automaticamente le migliori tariffe'
    }
  },
  {
    icon: Megaphone,
    phrases: {
      es: 'Publica anuncios y promociones',
      en: 'Publish announcements and promotions',
      it: 'Pubblica annunci e promozioni'
    }
  },
  {
    icon: Image,
    phrases: {
      es: 'Carrusel multimedia con imagenes y videos',
      en: 'Multimedia carousel with images and videos',
      it: 'Carosello multimediale con immagini e video'
    }
  },
  {
    icon: Clock,
    phrases: {
      es: 'Actualiza horarios y clima en vivo',
      en: 'Update schedules and live weather',
      it: 'Aggiorna orari e meteo in tempo reale'
    }
  },
  {
    icon: Palette,
    phrases: {
      es: 'Personaliza colores y temas',
      en: 'Customize colors and themes',
      it: 'Personalizza colori e temi'
    }
  },
  {
    icon: Bell,
    phrases: {
      es: 'Notificaciones y soporte integrado',
      en: 'Integrated notifications and support',
      it: 'Notifiche e supporto integrato'
    }
  }
];

const languages: Language[] = ['es', 'en', 'it'];

export default function BusinessLogin({ onLoginSuccess, onRegisterClick, onBack, onShowDeactivatedMessage, onHideDeactivatedMessage, onPasswordRecoveryClick }: BusinessLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deactivated, setDeactivated] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [error, setError] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentLangIndex((prev) => {
          const nextLang = (prev + 1) % languages.length;
          if (nextLang === 0) {
            setCurrentPhraseIndex((prevPhrase) => (prevPhrase + 1) % rotatingPhrases.length);
          }
          return nextLang;
        });
        setIsTransitioning(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentPhrase = rotatingPhrases[currentPhraseIndex];
  const currentLang = languages[currentLangIndex];
  const CurrentIcon = currentPhrase.icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: loginResult, error: loginError } = await supabase
        .rpc('business_login', {
          p_email: email.trim().toLowerCase(),
          p_password: password
        });

      if (loginError) {
        console.error('[LOGIN] RPC Error:', loginError);
        setError('Error al iniciar sesion. Por favor intenta nuevamente.');
        setLoading(false);
        return;
      }

      if (!loginResult) {
        setError('No se recibio respuesta del servidor.');
        setLoading(false);
        return;
      }

      if (loginResult?.error) {
        if (loginResult.error === 'business_inactive') {
          const { data: settingsData } = await supabase
            .from('business_settings')
            .select('language')
            .eq('business_id', loginResult.business_id)
            .maybeSingle();

          setLanguage((settingsData?.language as Language) || 'es');
          setDeactivated(true);
          setLoading(false);
          onShowDeactivatedMessage();
          return;
        }

        if (loginResult.error === 'invalid_credentials') {
          setError('Email o contraseña incorrectos.');
        } else if (loginResult.error === 'password_not_set') {
          setError('Tu cuenta necesita recuperar la contraseña. Usa la opcion de recuperacion.');
        } else if (loginResult.error === 'business_blocked') {
          setError('Tu cuenta ha sido bloqueada. Contacta al administrador.');
        } else {
          setError('Email o contraseña incorrectos.');
        }
        setLoading(false);
        return;
      }

      if (loginResult?.success) {
        sessionManager.setBusinessSession({
          sessionToken: loginResult.session_token,
          businessId: loginResult.business_id,
          businessName: loginResult.business_name,
          adminEmail: loginResult.admin_email,
        });

        await onLoginSuccess();
      } else {
        setError('Error desconocido al iniciar sesion.');
        setLoading(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesion.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (deactivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <ShieldOff className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {getTranslation(language, 'businessDeactivated')}
          </h2>
          <p className="text-gray-700 mb-3">
            {getTranslation(language, 'businessDeactivatedMessage')}
          </p>
          <p className="text-gray-600 mb-6">
            {getTranslation(language, 'contactSupport')}
          </p>
          <button
            onClick={async () => {
              onHideDeactivatedMessage();
              setDeactivated(false);
              setEmail('');
              setPassword('');
              await supabase.auth.signOut();
            }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all"
          >
            {getTranslation(language, 'backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>

        <div className="relative z-10 text-center max-w-lg">
          <div
            className={`transition-all duration-300 ease-in-out transform ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <div className="bg-blue-500/20 backdrop-blur-sm p-6 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center border border-blue-400/30">
              <CurrentIcon className="w-12 h-12 text-blue-300" />
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-6">
            SafeTransfer Slide
          </h2>

          <div className="h-20 flex items-center justify-center">
            <p
              className={`text-xl text-blue-200 transition-all duration-300 ease-in-out ${
                isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {currentPhrase.phrases[currentLang]}
            </p>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {languages.map((lang, idx) => (
              <div
                key={lang}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentLangIndex ? 'bg-blue-400 w-6' : 'bg-blue-600/50'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-center gap-1 mt-4">
            {rotatingPhrases.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentPhraseIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </button>

          <div className="flex flex-col items-center mb-8 mt-8">
            <img
              src="/v2.png"
              alt="SafeTransfer Slide"
              className="w-64 h-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de Negocios</h1>
            <p className="text-gray-600 text-center">Ingresa a tu cuenta para gestionar tu plataforma</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Contrasena
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={onPasswordRecoveryClick}
                >
                  Olvidaste tu contrasena?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">
              No tienes una cuenta?
            </p>
            <button
              onClick={onRegisterClick}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
            >
              Registrar Negocio
            </button>
          </div>

          <div className="lg:hidden mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <CurrentIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {currentPhrase.phrases[currentLang]}
                </p>
              </div>
              <div className="flex justify-center gap-1 mt-4">
                {languages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentLangIndex ? 'bg-blue-500 w-4' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
