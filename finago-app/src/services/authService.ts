/**
 * Authentication Service
 * Kullanıcı girişi, çıkışı ve token yönetimi
 */

const API_BASE_URL = `${process.env.REACT_APP_DATABASE_API_URL}/api/auth`;

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  last_login?: string;
  yetkiSeviyesi?: number | null;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

class AuthService {
  private tokenKey = 'finago_auth_token';
  private userKey = 'finago_user';

  // Token'ı localStorage'a kaydet
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Token'ı al (backward compatibility için eski 'token' key'ini de kontrol et)
  getToken(): string | null {
    let token = localStorage.getItem(this.tokenKey);
    
    // Yeni key'de yoksa eski key'i kontrol et
    if (!token) {
      token = localStorage.getItem('token');
      // Eski key'den bulunduysa yeni key'e taşı
      if (token) {
        this.setToken(token);
        localStorage.removeItem('token');
      }
    }
    
    return token;
  }

  // Token'ı sil (eski key'i de temizle)
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('token'); // Backward compatibility
  }

  // Kullanıcı bilgilerini kaydet
  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Kullanıcı bilgilerini al
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Kullanıcı bilgilerini sil
  removeUser(): void {
    localStorage.removeItem(this.userKey);
  }

  // Kullanıcı giriş yapmış mı?
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Kayıt ol
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kayıt başarısız');
      }

      // Token ve kullanıcı bilgilerini kaydet
      this.setToken(result.token);
      this.setUser(result.user);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Giriş yap
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Giriş başarısız');
      }

      // Token ve kullanıcı bilgilerini kaydet
      this.setToken(result.token);
      this.setUser(result.user);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Token'ı doğrula
  async verifyToken(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token geçersiz, temizle
        this.logout();
        return null;
      }

      const result = await response.json();
      this.setUser(result.user);
      return result.user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  // Çıkış yap
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout hatası:', error);
    } finally {
      // Her durumda local storage'ı temizle
      this.removeToken();
      this.removeUser();
    }
  }

  // Authorization header'ı al (API istekleri için)
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Yetki kontrolü - Generic yetki kontrolü
  hasPermission(requiredLevel: 'faz4' | 'faz5' | 'admin'): boolean {
    const user = this.getUser();
    if (!user || user.yetkiSeviyesi === null || user.yetkiSeviyesi === undefined) return false;

    const yetkiSeviyesi = user.yetkiSeviyesi;

    // Admin (4) her şeye erişebilir
    if (requiredLevel === 'admin') {
      return yetkiSeviyesi === 4;
    }

    // Yetki yok veya temel kullanıcı (1) hiçbir özel sayfaya erişemez
    if (yetkiSeviyesi === null || yetkiSeviyesi === 1) {
      return false;
    }

    // Rapor Görüntüleyici (2) sadece Faz5'e erişebilir
    if (yetkiSeviyesi === 2) {
      return requiredLevel === 'faz5';
    }

    // Tam Yetkili (3) Faz4 ve Faz5'e erişebilir
    if (yetkiSeviyesi === 3) {
      return requiredLevel === 'faz4' || requiredLevel === 'faz5';
    }

    // Admin (4) her şeye erişebilir
    if (yetkiSeviyesi === 4) {
      return true;
    }

    return false;
  }

  // Faz4'e erişim kontrolü
  canAccessFaz4(): boolean {
    return this.hasPermission('faz4');
  }

  // Faz5'e erişim kontrolü
  canAccessFaz5(): boolean {
    return this.hasPermission('faz5');
  }

  // Admin Panel'e erişim kontrolü
  canAccessAdminPanel(): boolean {
    return this.hasPermission('admin');
  }

  // Yetki seviyesi açıklaması
  getYetkiAciklamasi(): string {
    const user = this.getUser();
    if (!user) return 'Giriş Yapılmamış';

    const yetkiSeviyesi = user.yetkiSeviyesi;

    if (yetkiSeviyesi === null || yetkiSeviyesi === undefined) {
      return 'Yetki Yok';
    }

    switch (yetkiSeviyesi) {
      case 1:
        return 'Temel Kullanıcı';
      case 2:
        return 'Rapor Görüntüleyici (Faz5)';
      case 3:
        return 'Tam Yetkili (Faz4+Faz5)';
      case 4:
        return 'Admin';
      default:
        return 'Bilinmeyen Yetki';
    }
  }
}

export default new AuthService();
export type { User, AuthResponse, LoginCredentials, RegisterData };

