/**
 * İK (İnsan Kaynakları) - Personel Kayıt Sayfası
 * Yeni Personel Ekleme Formu
 * 
 * Bu sayfa yeni personellerin sisteme kaydedilmesini sağlar.
 */

import React, { useState, useEffect } from 'react';
import '../styles/PersonelKayit.css';
import authService from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE_URL = process.env.REACT_APP_DATABASE_API_URL || 'http://localhost:3001';

interface PersonelKayitForm {
  ad: string;
  soyad: string;
  grup: string;
  pozisyon: string;
  iseBaslamaTarihi: string;
}

interface PersonelKayitProps {
  onNavigate?: (page: string) => void;
}

const PersonelKayit: React.FC<PersonelKayitProps> = ({ onNavigate }) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);

  // Dark mode class'ını body'ye ekle/çıkar
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Cleanup
    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [isDark]);

  const [formData, setFormData] = useState<PersonelKayitForm>({
    ad: '',
    soyad: '',
    grup: '',
    pozisyon: '',
    iseBaslamaTarihi: ''
  });

  // Grup tanımları
  const gruplar = [
    { kod: 'TBK', ad: 'Temel Bankacılık' },
    { kod: 'KD', ad: 'Krediler' },
    { kod: 'HDT', ad: 'Hazine & Dış Ticaret' },
    { kod: 'DPC', ad: 'Debit / Prepaid Card' },
    { kod: 'SPP', ad: 'Sanal Post / PF' },
    { kod: 'AN', ad: 'Analist' },
    { kod: 'AD', ad: 'Android Developer' },
    { kod: 'ID', ad: 'IOS Developer' },
    { kod: 'BBD', ad: 'BOA Backend Developer' }
  ];

  // Pozisyon tanımları
  const pozisyonlar = [
    { kod: 'D', ad: 'Developer' },
    { kod: 'TM', ad: 'Teknik Mimar' },
    { kod: 'A', ad: 'Analist' },
    { kod: 'PM', ad: 'Product Manager' },
    { kod: 'QA', ad: 'Quality Assurance' },
    { kod: 'UX', ad: 'UX Designer' },
    { kod: 'UI', ad: 'UI Designer' }
  ];

  // Form değişiklik işleyicisi
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hata mesajını temizle
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  // Form validasyonu
  const validateForm = (): boolean => {
    if (!formData.ad.trim()) {
      setError('Lütfen personelin adını giriniz.');
      return false;
    }
    if (!formData.soyad.trim()) {
      setError('Lütfen personelin soyadını giriniz.');
      return false;
    }
    if (!formData.grup) {
      setError('Lütfen bir grup seçiniz.');
      return false;
    }
    if (!formData.pozisyon) {
      setError('Lütfen bir pozisyon seçiniz.');
      return false;
    }
    if (!formData.iseBaslamaTarihi) {
      setError('Lütfen işe başlama tarihini giriniz.');
      return false;
    }
    
    return true;
  };

  // Form gönderme işleyicisi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_BASE_URL}/api/personel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          ad: formData.ad.trim(),
          soyad: formData.soyad.trim(),
          grup: formData.grup,
          pozisyon: formData.pozisyon,
          iseBaslamaTarihi: formData.iseBaslamaTarihi,
          aktif: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Personel başarıyla kaydedildi:', result);
        
        setSuccess(`${formData.ad} ${formData.soyad} başarıyla sisteme eklendi!`);
        
        // Formu temizle
        setFormData({
          ad: '',
          soyad: '',
          grup: '',
          pozisyon: '',
          iseBaslamaTarihi: ''
        });
        
        // 3 saniye sonra başarı mesajını temizle
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Personel kaydedilemedi');
      }
    } catch (err) {
      console.error('Personel kaydetme hatası:', err);
      setError('Personel kaydedilirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Form sıfırlama işleyicisi
  const handleReset = () => {
    setFormData({
      ad: '',
      soyad: '',
      grup: '',
      pozisyon: '',
      iseBaslamaTarihi: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Yetki kontrolü
  if (!hasPermission) {
    return (
      <div className="personel-kayit-page">
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">🚫</div>
            <div className="header-text">
              <h1>Erişim Reddedildi</h1>
              <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
            </div>
          </div>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h2>Yetki Gerekli</h2>
            <p>Personel kayıt sayfasına erişim için yönetici yetkisi gereklidir.</p>
            <p>Lütfen sistem yöneticinizle iletişime geçin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="personel-kayit-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">👤</div>
          <div className="header-text">
            <h1>Personel Kayıt Sistemi</h1>
            <p>Yeni personel bilgilerini eksiksiz doldurun ve sisteme kaydedin</p>
          </div>
        </div>
      </div>

      {/* Ana Form Bölümü */}
      <div className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2>📋 Yeni Personel Bilgileri</h2>
            <p>Aşağıdaki formu doldurarak yeni personel ekleyebilirsiniz</p>
          </div>

          {/* Bilgi Kartları */}
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">📝</div>
              <div className="info-content">
                <h3>Kişisel Bilgiler</h3>
                <p>Ad, soyad gibi temel bilgiler</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">💼</div>
              <div className="info-content">
                <h3>Pozisyon Bilgileri</h3>
                <p>Grup ve pozisyon seçimi</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <h3>İşe Başlama</h3>
                <p>Çalışmaya başlama tarihi</p>
              </div>
            </div>
          </div>

          {/* Başarı Mesajı */}
          {success && (
            <div className="alert alert-success">
              <div className="alert-icon">✅</div>
              <div className="alert-content">
                <strong>Başarılı!</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          {/* Hata Mesajı */}
          {error && (
            <div className="alert alert-error">
              <div className="alert-icon">❌</div>
              <div className="alert-content">
                <strong>Hata!</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="personel-form">
            {/* Kişisel Bilgiler Bölümü */}
            <div className="form-group-section">
              <h3 className="section-title">
                <span className="section-icon">👤</span>
                Kişisel Bilgiler
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ad">
                    Ad <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="ad"
                    name="ad"
                    value={formData.ad}
                    onChange={handleInputChange}
                    placeholder="Örn: Ahmet"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="soyad">
                    Soyad <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="soyad"
                    name="soyad"
                    value={formData.soyad}
                    onChange={handleInputChange}
                    placeholder="Örn: Yılmaz"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Pozisyon Bilgileri Bölümü */}
            <div className="form-group-section">
              <h3 className="section-title">
                <span className="section-icon">💼</span>
                Pozisyon Bilgileri
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="grup">
                    Grup <span className="required">*</span>
                  </label>
                  <select
                    id="grup"
                    name="grup"
                    value={formData.grup}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={loading}
                  >
                    <option value="">Grup seçiniz</option>
                    {gruplar.map((grup) => (
                      <option key={grup.kod} value={grup.kod}>
                        {grup.kod} - {grup.ad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="pozisyon">
                    Pozisyon <span className="required">*</span>
                  </label>
                  <select
                    id="pozisyon"
                    name="pozisyon"
                    value={formData.pozisyon}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={loading}
                  >
                    <option value="">Pozisyon seçiniz</option>
                    {pozisyonlar.map((pozisyon) => (
                      <option key={pozisyon.kod} value={pozisyon.kod}>
                        {pozisyon.kod} - {pozisyon.ad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tarih Bilgileri Bölümü */}
            <div className="form-group-section">
              <h3 className="section-title">
                <span className="section-icon">📅</span>
                Tarih Bilgileri
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="iseBaslamaTarihi">
                    İşe Başlama Tarihi <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="iseBaslamaTarihi"
                    name="iseBaslamaTarihi"
                    value={formData.iseBaslamaTarihi}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={loading}
                  />
                  <small className="form-hint">
                    ℹ️ Gelecek tarihli personel kaydı yapılabilir
                  </small>
                </div>
              </div>
            </div>

            {/* Form Butonları */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                disabled={loading}
              >
                🔄 Formu Temizle
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    💾 Personeli Kaydet
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bilgilendirme */}
          <div className="form-footer">
            <div className="footer-info">
              <p>
                <strong>📌 Not:</strong> Yıldızlı (*) alanlar zorunludur. 
                Personel kaydedildikten sonra rapor takibi otomatik olarak başlatılacaktır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonelKayit;





