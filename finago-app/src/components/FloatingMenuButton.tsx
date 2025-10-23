/**
 * Floating Menu Button Bileşeni
 * Sidebar kapalıyken gösterilen profesyonel açma butonu
 */

import React from 'react';
import '../styles/FloatingMenuButton.css';

interface FloatingMenuButtonProps {
  onClick: () => void;
  className?: string;
}

const FloatingMenuButton: React.FC<FloatingMenuButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  return (
    <button
      className={`floating-menu-button ${className}`}
      onClick={onClick}
      aria-label="Menüyü aç"
      title="Menüyü aç"
      type="button"
    >
      {/* Ana ikon */}
      <div className="floating-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path 
            d="M3 12h18M3 6h18M3 18h18" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Glow effect */}
      <div className="floating-glow"></div>
      
      {/* Pulse animation */}
      <div className="floating-pulse"></div>
      
      {/* Tooltip */}
      <div className="floating-tooltip">
        <span>Menü</span>
        <div className="tooltip-arrow"></div>
      </div>
    </button>
  );
};

export default FloatingMenuButton;
