import { useEffect, useState, useRef } from 'react';
import { supabase, ExchangeRate, MediaItem, Announcement, ServiceLogo } from '../lib/supabase';
import { sessionManager } from '../lib/sessionManager';
import { Clock, DollarSign, TrendingUp, Cloud, Maximize, Minimize } from 'lucide-react';
import MediaCarousel from './MediaCarousel';
import AnnouncementTicker from './AnnouncementTicker';
import ServiceLogosCarousel from './ServiceLogosCarousel';
import { Language, getTranslation } from '../lib/translations';
import { ThemeProvider } from '../contexts/ThemeContext';
import { getTranslatedCountryName } from '../lib/countries';
import { rotatingPhrases } from '../lib/constants';
import { logger } from '../lib/logger';

const displayLanguages: Language[] = ['es', 'en', 'it'];

interface DisplayScreenProps {
  businessId?: string;
}

export default function DisplayScreen({ businessId }: DisplayScreenProps = {}) {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [serviceLogos, setServiceLogos] = useState<ServiceLogo[]>([]);
  const [businessName, setBusinessName] = useState<string>('Service Point');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<string>('');
  const [weatherCity, setWeatherCity] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('es');
  const [colorTheme, setColorTheme] = useState<string>('ocean-blue');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string | null>(null);
  const [customSecondaryColor, setCustomSecondaryColor] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeBusinessId();

    const unsubscribe = sessionManager.onSessionChange((event) => {
      if (event.type === 'business-set') {
        logger.log('[DISPLAY] Session changed via event, updating businessId to:', event.session.businessId);
        setSelectedBusinessId(event.session.businessId);
      } else if (event.type === 'business-cleared') {
        logger.log('[DISPLAY] Session cleared via event');
        setSelectedBusinessId(null);
        setBusinessName('Service Point');
        setLogoUrl(null);
        setExchangeRates([]);
        setMediaItems([]);
        setAnnouncements([]);
        setServiceLogos([]);
      }
    });

    return () => unsubscribe();
  }, [businessId]);

  useEffect(() => {
    if (selectedBusinessId) {
      loadData();
      setupRealtimeSubscriptions();
    }

    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      supabase.channel('display-updates').unsubscribe();
    };
  }, [selectedBusinessId]);

  useEffect(() => {
    if (weatherCity) {
      loadWeather();

      const weatherInterval = setInterval(() => {
        loadWeather();
      }, 300000);

      return () => clearInterval(weatherInterval);
    }
  }, [weatherCity]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || exchangeRates.length === 0) return;

    let animationFrameId: number;
    const scrollSpeed = 0.5;
    let scrollPosition = 0;

    const autoScroll = () => {
      if (!container) {
        animationFrameId = requestAnimationFrame(autoScroll);
        return;
      }

      const maxScroll = container.scrollHeight - container.clientHeight;

      if (maxScroll <= 0) {
        animationFrameId = requestAnimationFrame(autoScroll);
        return;
      }

      scrollPosition += scrollSpeed;

      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }

      container.scrollTop = scrollPosition;

      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [exchangeRates]);

  async function initializeBusinessId() {
    logger.log('[DISPLAY] Initializing business ID...');

    if (businessId) {
      logger.log('[DISPLAY] Using provided businessId:', businessId);
      setSelectedBusinessId(businessId);
      return;
    }

    const businessSession = sessionManager.getBusinessSession();
    logger.log('[DISPLAY] Checking session:', businessSession);

    if (businessSession?.businessId) {
      logger.log('[DISPLAY] Using session businessId:', businessSession.businessId);
      setSelectedBusinessId(businessSession.businessId);
      return;
    }

    logger.log('[DISPLAY] No session found, will not load any business');
    setSelectedBusinessId(null);
  }

  async function loadData() {
    if (!selectedBusinessId) return;

    const [ratesRes, mediaRes, announcementsRes, logosRes, settingsRes, businessRes] = await Promise.all([
      supabase
        .from('exchange_rates')
        .select('*')
        .eq('business_id', selectedBusinessId)
        .eq('is_active', true)
        .order('country', { ascending: true }),
      supabase
        .from('media_items')
        .select('*')
        .eq('business_id', selectedBusinessId)
        .eq('is_active', true)
        .order('order_index'),
      supabase
        .from('announcements')
        .select('*')
        .eq('business_id', selectedBusinessId)
        .eq('is_active', true)
        .order('order_index'),
      supabase
        .from('service_logos')
        .select('*')
        .eq('business_id', selectedBusinessId)
        .eq('is_active', true)
        .order('order_index'),
      supabase
        .from('business_settings')
        .select('*')
        .eq('business_id', selectedBusinessId)
        .maybeSingle(),
      supabase
        .from('businesses')
        .select('*')
        .eq('id', selectedBusinessId)
        .single()
    ]);

    if (ratesRes.data) {
      logger.log('Sample rate with flag:', ratesRes.data[0]);
      setExchangeRates(ratesRes.data);
    }
    if (mediaRes.data) setMediaItems(mediaRes.data);
    if (announcementsRes.data) setAnnouncements(announcementsRes.data);
    if (logosRes.data) setServiceLogos(logosRes.data);

    if (businessRes.data) {
      setBusinessName(businessRes.data.name || 'Service Point');
    }

    if (settingsRes.data) {
      setBusinessName(settingsRes.data.business_name || businessRes.data?.name || 'Service Point');
      setBusinessHours(settingsRes.data.business_hours || '');
      setWeatherCity(settingsRes.data.weather_city || '');
      setLogoUrl(settingsRes.data.logo_url || null);
      setLanguage((settingsRes.data.language as Language) || 'es');
      setColorTheme(settingsRes.data.color_theme || 'ocean-blue');
      setCustomPrimaryColor(settingsRes.data.custom_primary_color || null);
      setCustomSecondaryColor(settingsRes.data.custom_secondary_color || null);
    }
  }

  async function loadWeather() {
    if (!weatherCity) return;

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity)}&count=1&language=es&format=json`
      );
      const geoData = await geoResponse.json();

      if (geoData.results && geoData.results[0]) {
        const { latitude, longitude } = geoData.results[0];

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`
        );
        const weatherData = await weatherResponse.json();

        if (weatherData.current_weather && weatherData.current_weather.temperature !== undefined) {
          setTemperature(Math.round(weatherData.current_weather.temperature));
        }
      }
    } catch (error) {
      console.error('Error loading weather:', error);
    }
  }

  function setupRealtimeSubscriptions() {
    const channel = supabase.channel('display-updates');

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exchange_rates' }, (payload) => {
        logger.log('Exchange rates changed:', payload);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_items' }, (payload) => {
        logger.log('Media items changed:', payload);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        logger.log('Announcements changed:', payload);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_logos' }, (payload) => {
        logger.log('Service logos changed:', payload);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_settings' }, (payload) => {
        logger.log('Business settings changed:', payload);
        loadData();
      })
      .subscribe((status) => {
        logger.log('Realtime subscription status:', status);
      });
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!selectedBusinessId) {
    return <EmptyStateScreen />;
  }

  return (
    <ThemeProvider initialThemeId={colorTheme} customPrimaryColor={customPrimaryColor} customSecondaryColor={customSecondaryColor}>
      <DisplayContent
        exchangeRates={exchangeRates}
        mediaItems={mediaItems}
        announcements={announcements}
        serviceLogos={serviceLogos}
        businessName={businessName}
        logoUrl={logoUrl}
        businessHours={businessHours}
        weatherCity={weatherCity}
        currentTime={currentTime}
        temperature={temperature}
        isFullscreen={isFullscreen}
        language={language}
        scrollContainerRef={scrollContainerRef}
        toggleFullscreen={toggleFullscreen}
      />
    </ThemeProvider>
  );
}

function EmptyStateScreen() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentLangIndex((prev) => {
          const nextLang = (prev + 1) % displayLanguages.length;
          if (nextLang === 0) {
            setCurrentPhraseIndex((prevPhrase) => (prevPhrase + 1) % rotatingPhrases.length);
          }
          return nextLang;
        });
        setIsTransitioning(false);
      }, 400);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const currentPhrase = rotatingPhrases[currentPhraseIndex];
  const currentLang = displayLanguages[currentLangIndex];
  const CurrentIcon = currentPhrase.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div
          className={`transition-all duration-400 ease-in-out transform ${isTransitioning ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
            }`}
        >
          <div className="bg-blue-500/20 backdrop-blur-sm p-8 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center border border-blue-400/30 shadow-2xl shadow-blue-500/20">
            <CurrentIcon className="w-16 h-16 text-blue-300" />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white mb-6">SafeTransfer Slide</h1>

        <div className="h-24 flex items-center justify-center">
          <p
            className={`text-2xl text-blue-200 transition-all duration-400 ease-in-out ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
          >
            {currentPhrase.phrases[currentLang]}
          </p>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          {displayLanguages.map((lang, idx) => (
            <div
              key={lang}
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentLangIndex ? 'bg-blue-400 w-8' : 'bg-blue-600/50 w-2'
                }`}
            />
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {rotatingPhrases.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentPhraseIndex ? 'bg-white scale-125' : 'bg-white/30'
                }`}
            />
          ))}
        </div>

        <p className="text-blue-300/70 mt-12 text-lg">
          Inicia sesion para ver la informacion de tu negocio
        </p>
      </div>
    </div>
  );
}

interface DisplayContentProps {
  exchangeRates: ExchangeRate[];
  mediaItems: MediaItem[];
  announcements: Announcement[];
  serviceLogos: ServiceLogo[];
  businessName: string;
  logoUrl: string | null;
  businessHours: string;
  weatherCity: string;
  currentTime: string;
  temperature: number | null;
  isFullscreen: boolean;
  language: Language;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  toggleFullscreen: () => void;
}

function DisplayContent({
  exchangeRates,
  mediaItems,
  announcements,
  serviceLogos,
  businessName,
  logoUrl,
  businessHours,
  weatherCity,
  currentTime,
  temperature,
  isFullscreen,
  language,
  scrollContainerRef,
  toggleFullscreen
}: DisplayContentProps) {
  const getDisplayCountryName = (rate: ExchangeRate): string => {
    return getTranslatedCountryName(rate.country_code, rate.country, language);
  };

  const groupedRates = exchangeRates.reduce((acc, rate) => {
    const displayName = getDisplayCountryName(rate);
    if (!acc[displayName]) {
      acc[displayName] = [];
    }
    acc[displayName].push(rate);
    return acc;
  }, {} as Record<string, ExchangeRate[]>);

  const countries = Object.keys(groupedRates);

  function getBestRateForCountry(rates: ExchangeRate[]): ExchangeRate | null {
    if (rates.length === 0) return null;
    return rates.reduce((best, current) =>
      current.rate > best.rate ? current : best
    );
  }

  function getFlagImage(countryName: string) {
    const countryRates = groupedRates[countryName];
    if (!countryRates || countryRates.length === 0) return null;

    const flagUrl = countryRates[0].flag_url;
    if (!flagUrl) return null;

    return (
      <img
        src={flagUrl}
        width="56"
        height="42"
        alt={`${countryName} flag`}
        className="rounded shadow-md object-cover"
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden text-white p-6" style={{ background: `linear-gradient(to bottom right, var(--color-primary-dark), var(--color-primary), var(--color-primary-dark))` }}>
      <div className="h-full flex flex-col gap-4">
        <header className="flex-shrink-0 flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="h-24 w-auto max-w-md object-contain"
              />
            ) : (
              <div className="flex items-center gap-3">
                <DollarSign className="w-10 h-10 text-yellow-400" />
                <h1 className="text-3xl font-bold">{businessName}</h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 px-5 py-3 rounded-xl">
              <p className="text-sm text-yellow-400 font-semibold mb-1">{getTranslation(language, 'schedule')}</p>
              <p className="text-xl font-bold text-white">{businessHours}</p>
            </div>
            {temperature !== null && (
              <div className="flex items-center gap-3 bg-white/20 px-5 py-3 rounded-xl">
                <Cloud className="w-8 h-8 text-yellow-400" />
                <div>
                  <span className="text-3xl font-bold font-mono text-white">{temperature}°C</span>
                  <p className="text-sm text-yellow-400 font-semibold">{weatherCity}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 bg-white/20 px-5 py-3 rounded-xl">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold font-mono text-white">{currentTime}</span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6 text-yellow-400" />
              ) : (
                <Maximize className="w-6 h-6 text-yellow-400" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 flex-shrink-0 border-b-2" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--color-text)' }}>
                  <DollarSign className="w-6 h-6" style={{ color: 'var(--color-secondary)' }} />
                  {getTranslation(language, 'exchangeRates')}
                </h2>
              </div>
              <div ref={scrollContainerRef} className="overflow-y-auto custom-scrollbar flex-1 px-1" style={{ scrollBehavior: 'auto' }}>
                <div className="space-y-1 py-2">
                  {countries.map((country, countryIndex) => {
                    const countryRates = groupedRates[country];
                    const bestRate = getBestRateForCountry(countryRates);

                    return (
                      <div key={country}>
                        <div className="px-4 py-4 bg-white/5 border-l-4" style={{ borderLeftColor: 'var(--color-secondary)' }}>
                          <div className="flex items-center gap-4">
                            {getFlagImage(country)}
                            <h3 className="text-2xl font-bold text-white uppercase tracking-wide">{country}</h3>
                          </div>
                        </div>
                        {countryRates.map((rate) => {
                          const isBest = bestRate && rate.id === bestRate.id && countryRates.length > 1;

                          return (
                            <div
                              key={rate.id}
                              className={`px-4 py-4 flex justify-between items-center border-l-4 transition-all ${isBest
                                ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 border-amber-500'
                                : 'bg-white/5 border-white/10'
                                }`}
                            >
                              <div className="flex-1">
                                <p className={`text-xl font-semibold ${isBest ? 'text-yellow-300' : 'text-white'}`}>
                                  {rate.bank}
                                </p>
                                {isBest && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm font-bold text-yellow-400">{getTranslation(language, 'bestRate')}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className={`text-4xl font-bold tabular-nums ${isBest ? 'text-yellow-400' : 'text-white'}`}>
                                  {rate.rate}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {countryIndex < countries.length - 1 && (
                          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {announcements.length > 0 && (
              <div className="flex-shrink-0">
                <AnnouncementTicker announcements={announcements} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl flex flex-col">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>{getTranslation(language, 'promotions')}</h2>
              <div className="flex-1 flex items-center justify-center">
                {mediaItems.length > 0 ? (
                  <MediaCarousel items={mediaItems} />
                ) : (
                  <div className="w-full aspect-video bg-white/20 rounded-xl flex items-center justify-center">
                    <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>{getTranslation(language, 'noMultimediaContent')}</p>
                  </div>
                )}
              </div>
            </div>

            {serviceLogos.length > 0 && (
              <div className="flex-shrink-0">
                <ServiceLogosCarousel logos={serviceLogos} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
