/**
 * TalepBilgileriModal Component
 * 
 * 6 input alanı ile controlled form
 * DOCX'ten parse edilen gerçek değerleri gösterir
 * Hiçbir placeholder örnek veri kullanmaz
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTalepBilgileri } from '../hooks/useTalepBilgileri';
import '../styles/TalepBilgileriModal.css';

interface TalepBilgileriModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: File | null;
}

const TalepBilgileriModal: React.FC<TalepBilgileriModalProps> = ({
  isOpen,
  onClose,
  selectedFile
}) => {
  const {
    fields,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetFields,
    updateField
  } = useTalepBilgileri();


  // Dosya seçildiğinde otomatik işle
  useEffect(() => {
    if (isOpen && selectedFile && !isProcessed && !isLoading) {
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);

  // Modal kapatıldığında temizle
  useEffect(() => {
    if (!isOpen) {
      resetFields();
    }
  }, [isOpen, resetFields]);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      // Scroll'u engelle
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Validation mesajları için renk sınıfları
  const getValidationClass = (type: 'error' | 'warning') => {
    return type === 'error' ? 'validation-error' : 'validation-warning';
  };

  const modalContent = (
    <div className="talep-bilgileri-overlay">
      <div className="talep-bilgileri-container">
        {/* Modal Header */}
        <div className="talep-bilgileri-header">
          <div className="modal-title-section">
            <h2 className="modal-title">Talep Bilgileri</h2>
            <span className="modal-subtitle">
              {selectedFile ? selectedFile.name : 'Manuel Düzenleme'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={() => {
            // Modal kapanırken localStorage'a kaydet
            localStorage.setItem('talep_bilgileri_fields', JSON.stringify(fields));
            onClose();
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-section">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>DOCX dosyası işleniyor...</p>
          </div>
        )}

        {/* Validation Messages */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="validation-section">
            {validation.errors.length > 0 && (
              <div className={getValidationClass('error')}>
                <h4>Hatalar:</h4>
                <ul>
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className={getValidationClass('warning')}>
                <h4>Uyarılar:</h4>
                <ul>
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Parse Bilgileri */}
        {validation && (
          <div className="parse-info">
            <div className="info-item">
              <span className="info-label">Durum:</span>
              <span className={`info-value ${validation.found ? 'success' : 'error'}`}>
                {validation.found ? 'Tablo bulundu' : 'Tablo bulunamadı'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Mod:</span>
              <span className="info-value">{validation.mode}</span>
            </div>
            {validation.matchedLabels.length > 0 && (
              <div className="info-item">
                <span className="info-label">Bulunan etiketler:</span>
                <span className="info-value">{validation.matchedLabels.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="talep-bilgileri-form">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="talep_no">Talep No</label>
              <input
                id="talep_no"
                type="text"
                value={fields.talep_no}
                onChange={(e) => updateField('talep_no', e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="talep_adi">Talep Adı</label>
              <input
                id="talep_adi"
                type="text"
                value={fields.talep_adi}
                onChange={(e) => updateField('talep_adi', e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="talep_sahibi_is_birimi">Talep Sahibi İş Birimi</label>
              <input
                id="talep_sahibi_is_birimi"
                type="text"
                value={fields.talep_sahibi_is_birimi}
                onChange={(e) => updateField('talep_sahibi_is_birimi', e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="talep_sahibi_kurum">Talep Sahibi Kurum</label>
              <input
                id="talep_sahibi_kurum"
                type="text"
                value={fields.talep_sahibi_kurum}
                onChange={(e) => updateField('talep_sahibi_kurum', e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="talep_yoneticisi">Talep Yöneticisi</label>
              <input
                id="talep_yoneticisi"
                type="text"
                value={fields.talep_yoneticisi}
                onChange={(e) => updateField('talep_yoneticisi', e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="teknik_ekipler">Teknik Ekipler</label>
              <input
                id="teknik_ekipler"
                type="text"
                value={fields.teknik_ekipler}
                onChange={(e) => updateField('teknik_ekipler', e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="talep-bilgileri-footer">
          <div className="footer-info">
            {selectedFile ? (
              <span className="file-info">
                Dosya: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              <span className="file-info">
                Manuel düzenleme modu - Verileri elle girebilirsiniz
              </span>
            )}
          </div>
          <div className="footer-actions">
            <button className="modal-btn secondary" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('talep_bilgileri_fields', JSON.stringify(fields));
              onClose();
            }} disabled={isLoading}>
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Kapat
            </button>
            <button className="modal-btn primary" disabled={isLoading || !isProcessed}>
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal kullanarak modal'ı body'e direkt render et
  return createPortal(modalContent, document.body);
};

export default TalepBilgileriModal;
