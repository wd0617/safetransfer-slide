export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryDark: string;
    secondaryLight: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}

export const themes: Record<string, ColorTheme> = {
  'ocean-blue': {
    id: 'ocean-blue',
    name: 'Océano Azul',
    description: 'Azul profundo con acentos dorados',
    colors: {
      primary: '#1e40af',
      primaryDark: '#1e3a8a',
      primaryLight: '#3b82f6',
      secondary: '#fbbf24',
      secondaryDark: '#f59e0b',
      secondaryLight: '#fcd34d',
      accent: '#fbbf24',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#ffffff',
      textSecondary: '#cbd5e1',
      border: '#fbbf24',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'emerald-green': {
    id: 'emerald-green',
    name: 'Esmeralda Verde',
    description: 'Verde esmeralda con toques coral',
    colors: {
      primary: '#059669',
      primaryDark: '#047857',
      primaryLight: '#10b981',
      secondary: '#fb923c',
      secondaryDark: '#f97316',
      secondaryLight: '#fdba74',
      accent: '#fb923c',
      background: '#064e3b',
      surface: '#065f46',
      text: '#ffffff',
      textSecondary: '#d1fae5',
      border: '#fb923c',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Púrpura Real',
    description: 'Púrpura elegante con detalles cyan',
    colors: {
      primary: '#7c3aed',
      primaryDark: '#6d28d9',
      primaryLight: '#8b5cf6',
      secondary: '#06b6d4',
      secondaryDark: '#0891b2',
      secondaryLight: '#22d3ee',
      accent: '#06b6d4',
      background: '#4c1d95',
      surface: '#5b21b6',
      text: '#ffffff',
      textSecondary: '#e9d5ff',
      border: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Atardecer Naranja',
    description: 'Naranja cálido con toques magenta',
    colors: {
      primary: '#ea580c',
      primaryDark: '#c2410c',
      primaryLight: '#f97316',
      secondary: '#ec4899',
      secondaryDark: '#db2777',
      secondaryLight: '#f472b6',
      accent: '#ec4899',
      background: '#7c2d12',
      surface: '#9a3412',
      text: '#ffffff',
      textSecondary: '#fed7aa',
      border: '#ec4899',
      success: '#10b981',
      warning: '#fbbf24',
      error: '#dc2626',
    },
  },
  'midnight-slate': {
    id: 'midnight-slate',
    name: 'Pizarra Medianoche',
    description: 'Gris oscuro con acentos azul eléctrico',
    colors: {
      primary: '#334155',
      primaryDark: '#1e293b',
      primaryLight: '#475569',
      secondary: '#3b82f6',
      secondaryDark: '#2563eb',
      secondaryLight: '#60a5fa',
      accent: '#3b82f6',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#ffffff',
      textSecondary: '#cbd5e1',
      border: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'crimson-red': {
    id: 'crimson-red',
    name: 'Carmesí Rojo',
    description: 'Rojo intenso con detalles amarillos',
    colors: {
      primary: '#dc2626',
      primaryDark: '#b91c1c',
      primaryLight: '#ef4444',
      secondary: '#fbbf24',
      secondaryDark: '#f59e0b',
      secondaryLight: '#fcd34d',
      accent: '#fbbf24',
      background: '#7f1d1d',
      surface: '#991b1b',
      text: '#ffffff',
      textSecondary: '#fecaca',
      border: '#fbbf24',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#dc2626',
    },
  },
  'forest-teal': {
    id: 'forest-teal',
    name: 'Bosque Turquesa',
    description: 'Turquesa profundo con toques lime',
    colors: {
      primary: '#0d9488',
      primaryDark: '#0f766e',
      primaryLight: '#14b8a6',
      secondary: '#84cc16',
      secondaryDark: '#65a30d',
      secondaryLight: '#a3e635',
      accent: '#84cc16',
      background: '#134e4a',
      surface: '#115e59',
      text: '#ffffff',
      textSecondary: '#ccfbf1',
      border: '#84cc16',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'lavender-dream': {
    id: 'lavender-dream',
    name: 'Sueño Lavanda',
    description: 'Lavanda suave con detalles rosa',
    colors: {
      primary: '#a855f7',
      primaryDark: '#9333ea',
      primaryLight: '#c084fc',
      secondary: '#f472b6',
      secondaryDark: '#ec4899',
      secondaryLight: '#f9a8d4',
      accent: '#f472b6',
      background: '#581c87',
      surface: '#6b21a8',
      text: '#ffffff',
      textSecondary: '#f3e8ff',
      border: '#f472b6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

export function getTheme(themeId: string, customPrimary?: string | null, customSecondary?: string | null): ColorTheme {
  if (themeId === 'custom' && customPrimary && customSecondary) {
    return createCustomTheme(customPrimary, customSecondary);
  }
  return themes[themeId] || themes['ocean-blue'];
}

export function createCustomTheme(primaryColor: string, secondaryColor: string): ColorTheme {
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substr(0, 2), 16),
      g: parseInt(h.substr(2, 2), 16),
      b: parseInt(h.substr(4, 2), 16),
    };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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

  const darken = (color: string, amount: number = 20) => {
    const rgb = hexToRgb(color);
    return rgbToHex(
      Math.max(0, rgb.r - amount),
      Math.max(0, rgb.g - amount),
      Math.max(0, rgb.b - amount)
    );
  };

  const lighten = (color: string, amount: number = 20) => {
    const rgb = hexToRgb(color);
    return rgbToHex(
      Math.min(255, rgb.r + amount),
      Math.min(255, rgb.g + amount),
      Math.min(255, rgb.b + amount)
    );
  };

  const getBrightness = (color: string) => {
    const rgb = hexToRgb(color);
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  };

  const background = primaryColor;
  const surface = darken(primaryColor, 20);

  const getOptimalTextColor = (bgColor: string) => {
    const whiteContrast = getContrastRatio(bgColor, '#ffffff');
    const blackContrast = getContrastRatio(bgColor, '#000000');

    return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
  };

  const textColor = getOptimalTextColor(background);
  const isLightText = textColor === '#ffffff';

  const textSecondaryColor = isLightText
    ? 'rgba(255, 255, 255, 0.85)'
    : 'rgba(0, 0, 0, 0.85)';

  const ensureVisibleAccent = (accentColor: string, bgColor: string, textColor: string) => {
    let testColor = accentColor;
    let iterations = 0;
    const maxIterations = 15;

    while (iterations < maxIterations) {
      const contrastWithBg = getContrastRatio(testColor, bgColor);
      const contrastWithText = getContrastRatio(testColor, textColor);

      if (contrastWithBg >= 3.0 && contrastWithText >= 3.0) {
        break;
      }

      const brightness = getBrightness(testColor);

      if (textColor === '#ffffff') {
        testColor = brightness < 200 ? lighten(testColor, 25) : darken(testColor, 15);
      } else {
        testColor = brightness > 100 ? darken(testColor, 25) : lighten(testColor, 15);
      }

      iterations++;
    }

    return testColor;
  };

  const visibleSecondary = ensureVisibleAccent(secondaryColor, background, textColor);

  return {
    id: 'custom',
    name: 'Personalizado',
    description: 'Colores personalizados con contraste optimizado',
    colors: {
      primary: primaryColor,
      primaryDark: darken(primaryColor, 40),
      primaryLight: lighten(primaryColor, 40),
      secondary: visibleSecondary,
      secondaryDark: darken(visibleSecondary, 30),
      secondaryLight: lighten(visibleSecondary, 30),
      accent: visibleSecondary,
      background: background,
      surface: surface,
      text: textColor,
      textSecondary: textSecondaryColor,
      border: visibleSecondary,
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#ef4444',
    },
  };
}

export function getAllThemes(): ColorTheme[] {
  return Object.values(themes);
}