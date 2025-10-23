/**
 * Login Sayfası
 * Kullanıcı giriş ekranı
 */

import React, { useState } from 'react';
import authService from '../services/authService';
import ThemeToggle from './ThemeToggle';
import '../styles/Auth.css';

interface LoginProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validation
      if (!formData.username.trim() || !formData.password.trim()) {
        setError('Lütfen tüm alanları doldurun');
        setIsLoading(false);
        return;
      }

      // Login
      await authService.login({
        username: formData.username.trim(),
        password: formData.password,
      });

      // Başarılı
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
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
      
      <div className="auth-card">
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
                fallback.textContent = '🔐';
                e.currentTarget.parentElement?.appendChild(fallback);
              }}
            />
          </div>
          <h1>Finago<span className="text-gradient">One</span></h1>
          <p>Giriş Yap</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Kullanıcı adınızı girin"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Şifrenizi girin"
              disabled={isLoading}
              autoComplete="current-password"
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
                <span>Giriş yapılıyor...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Giriş Yap</span>
              </>
            )}
          </button>

          <div className="auth-footer">
            <p>
              Hesabınız yok mu?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="auth-link"
                disabled={isLoading}
              >
                Kayıt Ol
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

