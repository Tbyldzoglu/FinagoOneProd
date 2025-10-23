/**
 * Theme Context - Dark/Light Mode Yönetimi
 * AI uygulamaları için özelleştirilmiş profesyonel tema sistemi
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Theme türleri
export type ThemeMode = 'light' | 'dark';

// Theme context interface
interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

// Theme context oluşturma
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

/**
 * CSS değişkenlerini tema değişikliğine göre güncelleme
 */
const updateCSSVariables = (theme: ThemeMode) => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    // Dark theme AI uygulamaları için profesyonel renkler
    root.style.setProperty('--primary-bg', '#0F0F23');           // Ana koyu arka plan
    root.style.setProperty('--secondary-bg', '#1A1A3A');        // İkincil arka plan
    root.style.setProperty('--tertiary-bg', '#2D2D5F');         // Üçüncül arka plan
    root.style.setProperty('--accent-bg', '#383867');           // Vurgu arka planı
    
    // Gradient arka planlar
    root.style.setProperty('--sidebar-gradient', 'linear-gradient(180deg, #1A1A3A 0%, #0F0F23 100%)');
    root.style.setProperty('--main-gradient', 'linear-gradient(135deg, #0F0F23 0%, #1A1A3A 100%)');
    root.style.setProperty('--card-gradient', 'linear-gradient(135deg, #2D2D5F 0%, #383867 100%)');
    
    // Metin renkleri
    root.style.setProperty('--text-primary', '#FFFFFF');        // Ana metin
    root.style.setProperty('--text-secondary', '#B8B8D1');     // İkincil metin
    root.style.setProperty('--text-tertiary', '#8B8BA7');      // Üçüncül metin
    root.style.setProperty('--text-muted', '#6B6B87');         // Soluk metin
    
    // AI brand renkleri - koyu tema
    root.style.setProperty('--ai-primary', '#00D4FF');         // Neon mavi
    root.style.setProperty('--ai-secondary', '#7C3AED');       // Mor
    root.style.setProperty('--ai-accent', '#F59E0B');          // Turuncu
    root.style.setProperty('--ai-success', '#10B981');         // Yeşil
    root.style.setProperty('--ai-warning', '#F59E0B');         // Sarı
    root.style.setProperty('--ai-error', '#EF4444');           // Kırmızı
    
    // Border ve divider
    root.style.setProperty('--border-primary', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--border-secondary', 'rgba(255, 255, 255, 0.05)');
    root.style.setProperty('--divider', 'rgba(255, 255, 255, 0.08)');
    
    // Hover ve focus durumları
    root.style.setProperty('--hover-overlay', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--focus-ring', 'rgba(0, 212, 255, 0.3)');
    root.style.setProperty('--active-overlay', 'rgba(0, 212, 255, 0.2)');
    
    // Gölgeler
    root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.4)');
    root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--shadow-xl', '0 25px 50px rgba(0, 0, 0, 0.6)');
    
  } else {
    // Light theme AI uygulamaları için profesyonel renkler
    root.style.setProperty('--primary-bg', '#FFFFFF');          // Ana beyaz arka plan
    root.style.setProperty('--secondary-bg', '#F8FAFC');       // İkincil arka plan
    root.style.setProperty('--tertiary-bg', '#F1F5F9');        // Üçüncül arka plan
    root.style.setProperty('--accent-bg', '#E2E8F0');          // Vurgu arka planı
    
    // Gradient arka planlar
    root.style.setProperty('--sidebar-gradient', 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)');
    root.style.setProperty('--main-gradient', 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)');
    root.style.setProperty('--card-gradient', 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)');
    
    // Metin renkleri
    root.style.setProperty('--text-primary', '#1E293B');       // Ana metin
    root.style.setProperty('--text-secondary', '#475569');     // İkincil metin
    root.style.setProperty('--text-tertiary', '#64748B');      // Üçüncül metin
    root.style.setProperty('--text-muted', '#94A3B8');         // Soluk metin
    
    // AI brand renkleri - açık tema
    root.style.setProperty('--ai-primary', '#0066CC');         // Koyu mavi
    root.style.setProperty('--ai-secondary', '#6366F1');       // İndigo
    root.style.setProperty('--ai-accent', '#D97706');          // Turuncu
    root.style.setProperty('--ai-success', '#059669');         // Yeşil
    root.style.setProperty('--ai-warning', '#D97706');         // Sarı
    root.style.setProperty('--ai-error', '#DC2626');           // Kırmızı
    
    // Border ve divider
    root.style.setProperty('--border-primary', 'rgba(30, 41, 59, 0.1)');
    root.style.setProperty('--border-secondary', 'rgba(30, 41, 59, 0.05)');
    root.style.setProperty('--divider', 'rgba(30, 41, 59, 0.08)');
    
    // Hover ve focus durumları
    root.style.setProperty('--hover-overlay', 'rgba(30, 41, 59, 0.05)');
    root.style.setProperty('--focus-ring', 'rgba(0, 102, 204, 0.3)');
    root.style.setProperty('--active-overlay', 'rgba(0, 102, 204, 0.1)');
    
    // Gölgeler
    root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.07)');
    root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--shadow-xl', '0 25px 50px rgba(0, 0, 0, 0.15)');
  }
};

/**
 * Theme Provider Component
 * Tema durumunu yöneten ve çocuk bileşenlere sağlayan provider
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'dark' // AI uygulamaları için varsayılan dark tema
}) => {
  // Tema durumu - localStorage'dan başlangıç değeri al
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('finago-theme') as ThemeMode;
      return savedTheme || defaultTheme;
    }
    return defaultTheme;
  });

  /**
   * Tema değiştirme fonksiyonu
   */
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('finago-theme', newTheme);
    updateCSSVariables(newTheme);
    
    // Body class güncelleme
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${newTheme}`);
  };

  /**
   * Tema toggle fonksiyonu
   */
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  /**
   * Component mount edildiğinde tema ayarlarını uygula
   */
  useEffect(() => {
    updateCSSVariables(theme);
    document.body.classList.add(`theme-${theme}`);
    
    // Sistem tema tercihini dinle
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Sadece kullanıcı manuel ayar yapmamışsa sistem temasını kullan
      const savedTheme = localStorage.getItem('finago-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  // Context değeri
  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Theme Hook
 * Tema bilgilerine erişim için custom hook
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
