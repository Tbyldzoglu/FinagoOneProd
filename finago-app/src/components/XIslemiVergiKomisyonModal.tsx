/**
 * X İşlemi Vergi / Komisyon Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/XIslemiVergiKomisyonModal.css';
import LLMChat from './LLMChat';
import { useXIslemiVergiKomisyonText } from '../hooks/useXIslemiVergiKomisyonText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface XIslemiVergiKomisyonModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const XIslemiVergiKomisyonModal: React.FC<XIslemiVergiKomisyonModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // X İşlemi Vergi / Komisyon metin hook'u
  const xIslemiVergiKomisyonTextHook = useXIslemiVergiKomisyonText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!xIslemiVergiKomisyonTextHook.content || xIslemiVergiKomisyonTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('x_islemi_vergi_komisyon_content');
      if (transferData) {
        return transferData;
      }
    }
    return xIslemiVergiKomisyonTextHook.content;
  };
  
  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal kapandığında state'i temizle
  useEffect(() => {
    if (!isOpen) {
      setTextContent('');
    }
  }, [isOpen]);
  
  // DOCX dosyası seçildiğinde işle
  useEffect(() => {
    if (isOpen && selectedFile && !xIslemiVergiKomisyonTextHook.isProcessed && !xIslemiVergiKomisyonTextHook.isLoading) {
      console.log('📄 X İşlemi Vergi / Komisyon Metni: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiVergiKomisyonTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, xIslemiVergiKomisyonTextHook.isProcessed, xIslemiVergiKomisyonTextHook.isLoading, xIslemiVergiKomisyonTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, X İşlemi Vergi / Komisyon hook reset ediliyor:', selectedFile.name);
      xIslemiVergiKomisyonTextHook.resetContent();
    }
  }, [selectedFile?.name, xIslemiVergiKomisyonTextHook.resetContent]);
  
  // Kaydet fonksiyonu - X İşlemi Vergi Komisyon verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // X İşlemi Vergi Komisyon verilerini JSON formatında hazırla
      const xIslemiVergiKomisyonData = {
        title: 'X İşlemi Vergi / Komisyon',
        content: textContent || xIslemiVergiKomisyonTextHook.content,
        validation: {
          found: xIslemiVergiKomisyonTextHook.validation?.found || false,
          mode: xIslemiVergiKomisyonTextHook.validation?.mode || 'strict',
          contentLength: (textContent || xIslemiVergiKomisyonTextHook.content)?.length || 0,
          errors: xIslemiVergiKomisyonTextHook.validation?.errors || [],
          warnings: xIslemiVergiKomisyonTextHook.validation?.warnings || [],
          matchedLabels: xIslemiVergiKomisyonTextHook.validation?.matchedLabels || []
        },
        isProcessed: xIslemiVergiKomisyonTextHook.isProcessed,
        isLoading: xIslemiVergiKomisyonTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 X İşlemi Vergi Komisyon kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || xIslemiVergiKomisyonTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        x_islemi_vergi_komisyon: JSON.stringify(xIslemiVergiKomisyonData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ X İşlemi Vergi Komisyon başarıyla kaydedildi:', result);
        markModalAsSaved('x-islemi-vergi-komisyon'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ X İşlemi Vergi Komisyon kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ X İşlemi Vergi Komisyon kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      // Modal açıldığında HTML ve body'yi tamamen override et
      const html = document.documentElement;
      const body = document.body;
      
      // Overflow'u kaldır
      html.style.overflow = 'hidden';
      html.style.overflowX = 'visible';
      html.style.overflowY = 'hidden';
      body.style.overflow = 'hidden';
      body.style.overflowX = 'visible';
      body.style.overflowY = 'hidden';
      
      // Boyutları zorla ayarla
      html.style.width = '100vw';
      html.style.height = '100vh';
      body.style.width = '100vw';
      body.style.height = '100vh';
      body.style.margin = '0';
      body.style.padding = '0';
      
      // Focus'u modal'a ver
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        
        // Stilleri geri yükle
        html.style.overflow = '';
        html.style.overflowX = '';
        html.style.overflowY = '';
        body.style.overflow = '';
        body.style.overflowX = '';
        body.style.overflowY = '';
        html.style.width = '';
        html.style.height = '';
        body.style.width = '';
        body.style.height = '';
        body.style.margin = '';
        body.style.padding = '';
      };
    }
  }, [isOpen, onClose]);

  // Modal dışına tıklama ile kapatma
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="x-islemi-vergi-komisyon-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="x-islemi-vergi-komisyon-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="x-islemi-vergi-komisyon-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={onClose}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Validation Banner */}
        {xIslemiVergiKomisyonTextHook.validation && (xIslemiVergiKomisyonTextHook.validation.errors.length > 0 || xIslemiVergiKomisyonTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {xIslemiVergiKomisyonTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {xIslemiVergiKomisyonTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {xIslemiVergiKomisyonTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {xIslemiVergiKomisyonTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="x-islemi-vergi-komisyon-content">
          {/* Sol Taraf - Text Area */}
          <div className="text-panel">
            <div className="panel-header">
              <div className="panel-title">
                📝 Metin Düzenleyici
              </div>
            </div>
            <div className="text-container">
              <textarea
                className="text-area"
                value={getCurrentContent() || textContent}
                onChange={(e) => {
                  // Hem hook'ta hem de local state'te güncelle
                  xIslemiVergiKomisyonTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                placeholder="X İşlemi Vergi / Komisyon ile ilgili metin içeriğini buraya girin..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="x-islemi-vergi-komisyon-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={onClose}>
              × İptal
            </button>
            <button 
              className="save-button"
              onClick={handleSave}
              disabled={isSaving || !selectedFile}
            >
              ✓ {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default XIslemiVergiKomisyonModal;
