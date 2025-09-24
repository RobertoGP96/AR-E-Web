import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Leer del localStorage o usar 'system' como default
    const stored = localStorage.getItem(THEME_KEY) as Theme;
    return stored || 'system';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    
    // Aplicar el tema al documento
    const root = document.documentElement;
    const effectiveTheme = newTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  };

  useEffect(() => {
    // Aplicar tema inicial
    setTheme(theme);

    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        setTheme('system'); // Re-aplicar para actualizar la clase
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
}