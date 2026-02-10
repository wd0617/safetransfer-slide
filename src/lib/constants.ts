import { DollarSign, Globe, BarChart3, Megaphone, Image, Clock, Palette, Bell, type LucideIcon } from 'lucide-react';
import type { Language } from './translations';

export const APP_VERSION = '1.0.0';

export interface RotatingPhrase {
    icon: LucideIcon;
    phrases: Record<Language, string>;
}

export const rotatingPhrases: RotatingPhrase[] = [
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
