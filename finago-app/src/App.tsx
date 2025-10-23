/**
 * Ana Uygulama Bileşeni
 * AI uygulamaları için modern Dark/Light mode destekli layout
 */

import React, { useState, useEffect, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import FloatingMenuButton from './components/FloatingMenuButton';
import Login from './components/Login';
import Register from './components/Register';
import authService from './services/authService';
import './App.css';

// Lazy load heavy components
const LLMAnalysis = React.lazy(() => import('./components/LLMAnalysis'));
const LLMRequirementAnalysis = React.lazy(() => import('./components/LLMRequirementAnalysis'));
const TestSenaryoPage = React.lazy(() => import('./components/TestSenaryoPage'));
const PersonelKayit = React.lazy(() => import('./components/PersonelKayit'));
const Faz4Page = React.lazy(() => import('./components/Faz4Page'));
const Faz5Page = React.lazy(() => import('./components/Faz5Page'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Sidebar durumu yönetimi - responsive olarak ayarla
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    // Desktop'ta açık, mobile'da kapalı başlat
    return window.innerWidth >= 1024;
  });

  // Basit routing state
  const [currentPage, setCurrentPage] = useState<string>('ana-sayfa');

  /**
   * Token doğrulama - Sayfa yüklendiğinde
   */
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const user = await authService.verifyToken();
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsAuthLoading(false);
      }
    };

    verifyAuth();
  }, []);

  /**
   * Sidebar açma/kapama işleyicisi
   */
  const handleSidebarToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  /**
   * Sayfa navigasyon işleyicisi
   */
  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  /**
   * Login başarılı handler
   */
  const handleLoginSuccess = () => {
    const user = authService.getUser();
    setIsAuthenticated(true);
    setCurrentUser(user);
    console.log('✅ Kullanıcı giriş yaptı:', user);
  };

  /**
   * Register başarılı handler
   */
  const handleRegisterSuccess = () => {
    const user = authService.getUser();
    setIsAuthenticated(true);
    setCurrentUser(user);
    console.log('✅ Yeni kullanıcı kaydedildi:', user);
  };

  /**
   * Logout handler
   */
  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('ana-sayfa');
    console.log('✅ Kullanıcı çıkış yaptı');
  };

  /**
   * ESC tuşu ile sidebar kapatma
   */
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isSidebarOpen]);

  /**
   * Responsive sidebar davranışı
   */
  useEffect(() => {
    const handleResize = () => {
      // Desktop'ta otomatik açık, mobile'da kapalı
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loading ekranı
  if (isAuthLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Login/Register ekranı
  if (!isAuthenticated) {
    return (
      <ThemeProvider defaultTheme="dark">
        {authView === 'login' ? (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <Register 
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </ThemeProvider>
    );
  }

  // Ana uygulama (authenticated)
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="App">
        {/* Floating Menu Button - sadece sidebar kapalıyken görünür */}
        {!isSidebarOpen && (
          <FloatingMenuButton onClick={handleSidebarToggle} />
        )}

        {/* Ana Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={handleSidebarToggle}
          onNavigate={handleNavigation}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        
        {/* Ana İçerik Alanı */}
        <main className={`main-content ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <Suspense fallback={
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Sayfa yükleniyor...</p>
            </div>
          }          >
            {currentPage === 'llm-tabani-analiz' && <LLMAnalysis />}
            {currentPage === 'llm-tabani-gereksinim' && <LLMRequirementAnalysis onNavigate={handleNavigation} />}
            {currentPage === 'test-senaryosu' && <TestSenaryoPage onNavigate={handleNavigation} />}
            {currentPage === 'personel-kayit' && <PersonelKayit onNavigate={handleNavigation} />}
            {currentPage === 'faz4' && <Faz4Page onNavigate={handleNavigation} />}
            {currentPage === 'faz5' && <Faz5Page onNavigate={handleNavigation} />}
            {currentPage === 'admin-panel' && <AdminPanel />}
          </Suspense>
          {currentPage === 'ana-sayfa' && (
            <>
              <div className="content-header">
                <div className="header-content">
                  <div className="header-text">
                    <h1>FinagoTech <span className="text-gradient">AI Analytics Suite</span></h1>
                    <p>Gelecek nesil yapay zeka analiz platformuna hoş geldiniz</p>
                  </div>
                </div>
              </div>
          
          <div className="content-body">
            {/* Hero Section */}
            <div className="hero-section">
              <div className="hero-content">
                <div className="hero-badge">
                  <span className="badge-text">🚀 Yeni Özellik</span>
                  <span className="badge-desc">AI Destekli Analiz Motoru</span>
                </div>
                <h2>Verilerinizi Akıllı Analizlerle <br/>Değerli İçgörülere Dönüştürün</h2>
                <p>
                  FinagoTech'in ileri seviye AI algoritmaları ile karmaşık veri setlerinizi 
                  anlamlandırın ve iş süreçlerinizi optimize edin.
                </p>
                <div className="hero-actions">
                  <button className="btn btn-primary">
                    <span>Analiz Başlat</span>
                    <span className="btn-icon">→</span>
                  </button>
                  <button className="btn btn-secondary">
                    <span>Demo İzle</span>
                    <span className="btn-icon">▶</span>
                  </button>
                </div>
              </div>
              
              <div className="hero-visual">
                <div className="ai-brain">
                  <div className="brain-core"></div>
                  <div className="brain-rings">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`brain-ring ring-${i + 1}`}></div>
                    ))}
                  </div>
                  <div className="brain-nodes">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`brain-node node-${i + 1}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="features-section">
              <div className="section-header">
                <h3>Güçlü AI Özellikleri</h3>
                <p>En son teknoloji ile geliştirilmiş analiz araçları</p>
              </div>
              
              <div className="feature-grid">
                <div className="feature-card llm">
                  <div className="feature-header">
                    <div className="feature-icon">🤖</div>
                    <div className="feature-badge pro">PRO</div>
                  </div>
                  <h4>LLM Tabanlı Analiz</h4>
                  <p>Büyük dil modelleri ile gelişmiş metin ve veri analizi</p>
                </div>
                
                <div className="feature-card requirements">
                  <div className="feature-header">
                    <div className="feature-icon">🔍</div>
                    <div className="feature-badge ai">AI</div>
                  </div>
                  <h4>Gereksinim Analizi</h4>
                  <p>Akıllı algoritmarla otomatik gereksinim belirleme ve önceliklendirme</p>
                </div>
                
                <div className="feature-card testing">
                  <div className="feature-header">
                    <div className="feature-icon">🧪</div>
                    <div className="feature-badge new">YENİ</div>
                  </div>
                  <h4>Otomatik Test Senaryoları</h4>
                  <p>AI destekli test senaryosu oluşturma ve kalite kontrolü</p>
                </div>
              </div>
            </div>
            
          </div>
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
