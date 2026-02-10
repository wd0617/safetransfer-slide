import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ColorTheme, getTheme } from '../lib/themes';

interface ThemeContextType {
  theme: ColorTheme;
  setThemeId: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialThemeId?: string;
  customPrimaryColor?: string | null;
  customSecondaryColor?: string | null;
}

export function ThemeProvider({ children, initialThemeId = 'ocean-blue', customPrimaryColor, customSecondaryColor }: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState(initialThemeId);
  const theme = getTheme(themeId, customPrimaryColor, customSecondaryColor);

  useEffect(() => {
    setThemeIdState(initialThemeId);
  }, [initialThemeId]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = theme.colors;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-secondary-dark', colors.secondaryDark);
    root.style.setProperty('--color-secondary-light', colors.secondaryLight);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
  }, [theme]);

  const setThemeId = (newThemeId: string) => {
    setThemeIdState(newThemeId);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}