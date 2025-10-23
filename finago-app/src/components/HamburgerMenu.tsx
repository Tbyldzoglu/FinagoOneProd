/**
 * Hamburger Menu Bileşeni
 * Sidebar açma/kapama için animasyonlu hamburger butonu
 */

import React from 'react';
import '../styles/HamburgerMenu.css';

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
  isOpen, 
  onToggle, 
  className = '' 
}) => {
  return (
    <button
      className={`hamburger-menu ${isOpen ? 'open' : ''} ${className}`}
      onClick={onToggle}
      aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
      aria-expanded={isOpen}
      type="button"
    >
      <div className="hamburger-lines">
        <span className="line line1"></span>
        <span className="line line2"></span>
        <span className="line line3"></span>
      </div>
      
      {/* Ripple effect */}
      <div className="hamburger-ripple"></div>
      
      {/* Tooltip */}
      <div className="hamburger-tooltip">
        {isOpen ? 'Kapat' : 'Menü'}
      </div>
    </button>
  );
};

export default HamburgerMenu;
