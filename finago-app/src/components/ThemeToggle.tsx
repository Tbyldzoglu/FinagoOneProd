/**
 * Theme Toggle Bileşeni
 * Dark/Light mode geçişi için AI tarzı toggle butonu
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md',
  showLabel = false 
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className={`theme-toggle-container ${className}`}>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        className={`theme-toggle ${size} ${isDark ? 'dark' : 'light'}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Toggle Track */}
        <div className="theme-toggle-track">
          {/* Background Icons */}
          <div className="theme-toggle-bg-icons">
            <span className="sun-icon">☀️</span>
            <span className="moon-icon">🌙</span>
          </div>
          
          {/* Toggle Thumb */}
          <div className="theme-toggle-thumb">
            <div className="theme-toggle-thumb-inner">
              {isDark ? (
                <span className="theme-icon moon">🌙</span>
              ) : (
                <span className="theme-icon sun">☀️</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className="theme-toggle-glow"></div>
        
        {/* Particles Effect */}
        <div className="theme-toggle-particles">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`particle particle-${i + 1}`}
              style={{
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
