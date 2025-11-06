/**
 * Sidebar Bileşeni
 * Ana navigasyon menüsü - responsive ve profesyonel tasarım
 * Resimde görülen FinagoTech tasarımına uygun olarak geliştirildi
 */

import React, { useState, useCallback } from 'react';
import { MenuItem, UserProfile, SidebarState } from '../types/sidebar.types';
import { useTheme } from '../contexts/ThemeContext';
import HamburgerMenu from './HamburgerMenu';
import ThemeToggle from './ThemeToggle';
import '../styles/Sidebar.css';

// Props tipi tanımı
interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  onNavigate?: (page: string) => void;
  currentUser?: any;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  onToggle,
  className = '',
  onNavigate,
  currentUser,
  onLogout
}) => {
  // Theme hook'u kullan
  const { theme, isDark } = useTheme();
  
  // Component state yönetimi
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isCollapsed: false,
    activeMenuItem: 'ana-sayfa',
    expandedMenus: ['analiz-sureci'] // Varsayılan olarak Analiz Süreci açık
  });

  // Kullanıcı profil bilgileri (props'tan gelir veya default)
  const userProfile: UserProfile = currentUser ? {
    name: currentUser.full_name || currentUser.username,
    email: currentUser.email,
    isOnline: true
  } : {
    name: 'Admin',
    email: 'admin@finagotech.com',
    isOnline: true
  };

  // Menü verisi - resimde görülen yapıya uygun
  const menuItems: MenuItem[] = [
    {
      id: 'ana-sayfa',
      title: 'Ana Sayfa',
      icon: '🏠',
      path: '/',
    },
    {
      id: 'analiz-sureci',
      title: 'Analiz Süreci',
      icon: '📊',
      path: '/analiz',
      children: [
        {
          id: 'llm-tabani-analiz',
          title: 'LLM Tabanlı Analiz',
          icon: '🤖',
          path: '/analiz/llm',
          badge: 'PRO'
        },
        {
          id: 'llm-tabani-gereksinim',
          title: 'LLM Tabanlı Gereksinim Analiz',
          icon: '🔍',
          path: '/analiz/gereksinim',
          badge: 'AI'
        },
        {
          id: 'test-senaryosu',
          title: 'Test Senaryosu',
          icon: '🧪',
          path: '/analiz/test'
        }
      ]
    },
    {
      id: 'insan-kaynaklari',
      title: 'İnsan Kaynakları',
      icon: '👥',
      path: '/insan-kaynaklari',
      children: [
        {
          id: 'personel-kayit',
          title: 'Personel Kayıt',
          icon: '👤',
          path: '/insan-kaynaklari/personel-kayit',
          badge: 'YENİ'
        },
        {
          id: 'personel-yonetimi',
          title: 'Personel Yönetimi',
          icon: '👥',
          path: '/insan-kaynaklari/personel-yonetimi',
          badge: 'YÖNETİM'
        },
        {
          id: 'faz4',
          title: 'Performans Skorlama',
          icon: '📋',
          path: '/insan-kaynaklari/faz4',
          badge: 'İK'
        },
        {
          id: 'faz5',
          title: 'Performans Rapor Görüntüleme',
          icon: '📝',
          path: '/insan-kaynaklari/faz5',
          badge: 'İK'
        }
      ]
    }
  ];

  /**
   * Menü öğesi tıklama işleyicisi
   * Aktif menü öğesini günceller ve alt menüleri genişletir/daraltır
   */
  const handleMenuClick = useCallback((itemId: string, hasChildren?: boolean) => {
    setSidebarState(prev => {
      const newExpandedMenus = hasChildren
        ? prev.expandedMenus.includes(itemId)
          ? prev.expandedMenus.filter(id => id !== itemId)
          : [...prev.expandedMenus, itemId]
        : prev.expandedMenus;

      return {
        ...prev,
        activeMenuItem: itemId,
        expandedMenus: newExpandedMenus
      };
    });

    // Eğer alt menü yoksa navigasyon yap
    if (!hasChildren && onNavigate) {
      onNavigate(itemId);
    }
  }, [onNavigate]);

  /**
   * Çıkış işleyicisi
   */
  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      console.log('Güvenli çıkış yapılıyor...');
    }
  }, [onLogout]);

  /**
   * Badge renk sınıfı belirleyici
   */
  const getBadgeClass = (badgeType: string): string => {
    const normalizedType = badgeType?.toLocaleLowerCase('tr-TR');
    switch (normalizedType) {
      case 'pro': return 'pro';
      case 'ai': return 'ai';
      case 'new': return 'new';
      case 'yeni': return 'new';
      case 'beta': return 'beta';
      case 'ik': return 'new';
      case 'İk': return 'new';
      case 'admin': return 'pro';
      case 'yönetim': return 'yonetim';
      default: return '';
    }
  };

  /**
   * Alt menü render fonksiyonu
   */
  const renderSubmenu = (children: MenuItem[], parentId: string) => {
    const isExpanded = sidebarState.expandedMenus.includes(parentId);
    
    if (!isExpanded || !children?.length) return null;

    return (
      <div className="sidebar-submenu">
        {children.map((child) => (
          <div
            key={child.id}
            className={`sidebar-submenu-item ${
              sidebarState.activeMenuItem === child.id ? 'active' : ''
            }`}
            onClick={() => handleMenuClick(child.id)}
            role="menuitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMenuClick(child.id);
              }
            }}
          >
            <div className="sidebar-submenu-icon"></div>
            <span className="sidebar-menu-text">{child.title}</span>
            {child.badge && (
              <span className={`sidebar-menu-badge ${getBadgeClass(child.badge)}`}>
                {child.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Ana menü render fonksiyonu
   */
  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = sidebarState.expandedMenus.includes(item.id);
    const isActive = sidebarState.activeMenuItem === item.id;

    return (
      <div key={item.id}>
        <div
          className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
          onClick={() => handleMenuClick(item.id, hasChildren)}
          role="menuitem"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMenuClick(item.id, hasChildren);
            }
          }}
        >
          <div className="sidebar-menu-icon">{item.icon}</div>
          <span className="sidebar-menu-text">{item.title}</span>
          {item.badge && (
            <span className={`sidebar-menu-badge ${getBadgeClass(item.badge)}`}>
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <div className={`sidebar-menu-arrow ${isExpanded ? 'expanded' : ''}`}>
              ▶
            </div>
          )}
        </div>
        {hasChildren && renderSubmenu(item.children!, item.id)}
      </div>
    );
  };

  return (
    <>
      {/* Mobil overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      ></div>

      {/* Ana sidebar container */}
      <div className={`sidebar ${!isOpen ? 'collapsed' : ''} ${className}`}>
        {/* Sidebar Başlığı */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/finagoone_logo.png" alt="FinagoOne Logo" className="logo-image" onError={(e) => {
              console.log('Logo yüklenemedi:', e);
              e.currentTarget.style.display = 'none';
            }} />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="sidebar-controls">
          <div className="sidebar-controls-content">
            <div className="sidebar-controls-left">
              <div className="control-group">
                <HamburgerMenu 
                  isOpen={isOpen}
                  onToggle={onToggle || (() => {})}
                />
                <div className="controls-section">
                  <span className="controls-label">Navigation</span>
                  <span className="controls-value">Menu</span>
                </div>
                <div className="status-indicator"></div>
              </div>
            </div>
            <div className="sidebar-controls-right">
              <div className="control-group">
                <div className="controls-section">
                  <span className="controls-label">Theme</span>
                  <span className="controls-value">{isDark ? 'Dark' : 'Light'}</span>
                </div>
                <ThemeToggle size="sm" showLabel={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Ana Navigasyon */}
        <nav className="sidebar-nav" role="navigation" aria-label="Ana navigasyon">
          <div className="sidebar-menu-group">
            <div className="sidebar-menu-title">Ana Menü</div>
            {menuItems.map(renderMenuItem)}
          </div>
        </nav>

        {/* Kullanıcı Profili ve Çıkış */}
        <div className="sidebar-footer">
          {/* Admin Panel Butonu */}
          <div 
            className="sidebar-admin-button"
            onClick={() => {
              if (onNavigate) {
                onNavigate('admin-panel');
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onNavigate) {
                  onNavigate('admin-panel');
                }
              }
            }}
          >
            <div className="admin-button-icon">🛡️</div>
            <div className="admin-button-text">Admin Panel</div>
          </div>

          {/* Alt kısım: Kullanıcı Profili ve Çıkış */}
          <div className="sidebar-footer-bottom">
            {/* Kullanıcı Profili */}
            <div className="sidebar-user-profile">
              <div className="sidebar-user-avatar">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{userProfile.name}</div>
                <div className="sidebar-user-email">{userProfile.email}</div>
                <div className="sidebar-user-status">
                  Çevrimiçi
                </div>
              </div>
            </div>

            {/* Güvenli Çıkış */}
            <div 
              className="sidebar-logout"
              onClick={handleLogout}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLogout();
                }
              }}
            >
              <div className="sidebar-logout-icon">🚪</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
