/**
 * Sidebar menü öğeleri için tip tanımları
 * Bu dosya sidebar bileşeninde kullanılacak tüm tip tanımlarını içerir
 */

// Menü öğesi etiketi tipleri
export type BadgeType = 'PRO' | 'AI' | 'NEW' | 'BETA' | 'YENİ' | 'İK' | 'ADMIN';

// Menü öğesi yapısı
export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  badge?: BadgeType;
  children?: MenuItem[];
  isExpanded?: boolean;
}

// Kullanıcı profil bilgileri
export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

// Sidebar durumu
export interface SidebarState {
  isCollapsed: boolean;
  activeMenuItem: string;
  expandedMenus: string[];
}
