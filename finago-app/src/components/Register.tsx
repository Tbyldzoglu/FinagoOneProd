/**
 * Register Sayfası
 * Yeni kullanıcı kayıt ekranı
 */

import React, { useState } from 'react';
import authService from '../services/authService';
import ThemeToggle from './ThemeToggle';
import '../styles/Auth.css';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Hata mesajını temizle
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    // Boş alan kontrolü
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Lütfen zorunlu alanları doldurun');
      return false;
    }

    // Kullanıcı adı uzunluk kontrolü
    if (formData.username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      return false;
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Geçerli bir email adresi girin');
      return false;
    }

    // Şifre uzunluk kontrolü
    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }

    // Şifre eşleşme kontrolü
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Register
      await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim() || undefined,
      });

      // Başarılı
      onRegisterSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Theme Toggle - Sağ üst köşe */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <ThemeToggle size="md" showLabel={false} />
      </div>
      
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img 
              src="/finagoone_logo.png" 
              alt="FinagoOne Logo" 
              className="auth-logo-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'auth-logo-fallback';
                fallback.textContent = '✨';
                e.currentTarget.parentElement?.appendChild(fallback);
              }}
            />
          </div>
          <h1>Finago<span className="text-gradient">One</span></h1>
          <p>Yeni Hesap Oluştur</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              Kullanıcı Adı <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Kullanıcı adınızı girin (min. 3 karakter)"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@ornek.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="full_name">Ad Soyad (Opsiyonel)</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ad ve soyadınız"
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Şifre <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Şifrenizi girin (min. 6 karakter)"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Şifre Tekrar <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Şifrenizi tekrar girin"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Kayıt yapılıyor...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Kayıt Ol</span>
              </>
            )}
          </button>

          <div className="auth-footer">
            <p>
              Zaten hesabınız var mı?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="auth-link"
                disabled={isLoading}
              >
                Giriş Yap
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

