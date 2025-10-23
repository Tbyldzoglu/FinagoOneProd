/**
 * X İşlemi Kayıt Kuralları Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/XIslemiKayitKurallariModal.css';
import LLMChat from './LLMChat';
import { useXIslemiKayitKurallariText } from '../hooks/useXIslemiKayitKurallariText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface XIslemiKayitKurallariModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const XIslemiKayitKurallariModal: React.FC<XIslemiKayitKurallariModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // X İşlemi Kayıt Kuralları metin hook'u
  const xIslemiKayitKurallariTextHook = useXIslemiKayitKurallariText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!xIslemiKayitKurallariTextHook.content || xIslemiKayitKurallariTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('x_islemi_kayit_kurallari_content');
      if (transferData) {
        return transferData;
      }
    }
    return xIslemiKayitKurallariTextHook.content;
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
    if (isOpen && selectedFile && !xIslemiKayitKurallariTextHook.isProcessed && !xIslemiKayitKurallariTextHook.isLoading) {
      console.log('📄 X İşlemi Kayıt Kuralları Metni: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiKayitKurallariTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, xIslemiKayitKurallariTextHook.isProcessed, xIslemiKayitKurallariTextHook.isLoading, xIslemiKayitKurallariTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, X İşlemi Kayıt Kuralları hook reset ediliyor:', selectedFile.name);
      xIslemiKayitKurallariTextHook.resetContent();
    }
  }, [selectedFile?.name, xIslemiKayitKurallariTextHook.resetContent]);
  
  // Kaydet fonksiyonu - X İşlemi Kayıt Kuralları verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // X İşlemi Kayıt Kuralları verilerini JSON formatında hazırla
      const xIslemiKayitKurallariData = {
        title: 'X İşlemi Kayıt Kuralları',
        content: textContent || xIslemiKayitKurallariTextHook.content,
        validation: {
          found: xIslemiKayitKurallariTextHook.validation?.found || false,
          mode: xIslemiKayitKurallariTextHook.validation?.mode || 'strict',
          contentLength: (textContent || xIslemiKayitKurallariTextHook.content)?.length || 0,
          errors: xIslemiKayitKurallariTextHook.validation?.errors || [],
          warnings: xIslemiKayitKurallariTextHook.validation?.warnings || [],
          matchedLabels: xIslemiKayitKurallariTextHook.validation?.matchedLabels || []
        },
        isProcessed: xIslemiKayitKurallariTextHook.isProcessed,
        isLoading: xIslemiKayitKurallariTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 X İşlemi Kayıt Kuralları kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || xIslemiKayitKurallariTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        x_islemi_kayit_kurallari: JSON.stringify(xIslemiKayitKurallariData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ X İşlemi Kayıt Kuralları başarıyla kaydedildi:', result);
        markModalAsSaved('x-islemi-kayit-kurallari'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ X İşlemi Kayıt Kuralları kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ X İşlemi Kayıt Kuralları kaydetme hatası:', error);
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
    <div className="x-islemi-kayit-kurallari-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="x-islemi-kayit-kurallari-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="x-islemi-kayit-kurallari-header">
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
        {xIslemiKayitKurallariTextHook.validation && (xIslemiKayitKurallariTextHook.validation.errors.length > 0 || xIslemiKayitKurallariTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {xIslemiKayitKurallariTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {xIslemiKayitKurallariTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {xIslemiKayitKurallariTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {xIslemiKayitKurallariTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="x-islemi-kayit-kurallari-content">
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
                  xIslemiKayitKurallariTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                placeholder="X İşlemi Kayıt Kuralları ile ilgili metin içeriğini buraya girin..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="x-islemi-kayit-kurallari-footer">
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

export default XIslemiKayitKurallariModal;
