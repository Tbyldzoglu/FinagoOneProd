/**
 * X İşlemi Muhasebe Senaryoları Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/XIslemiMuhasebeSenaryolariModal.css';
import LLMChat from './LLMChat';
import { useXIslemiMuhasebeSenaryolariText } from '../hooks/useXIslemiMuhasebeSenaryolariText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface XIslemiMuhasebeSenaryolariModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const XIslemiMuhasebeSenaryolariModal: React.FC<XIslemiMuhasebeSenaryolariModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // X İşlemi Muhasebe Senaryoları metin hook'u
  const xIslemiMuhasebeSenaryolariTextHook = useXIslemiMuhasebeSenaryolariText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!xIslemiMuhasebeSenaryolariTextHook.content || xIslemiMuhasebeSenaryolariTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('x_islemi_muhasebe_senaryolari_content');
      if (transferData) {
        return transferData;
      }
    }
    return xIslemiMuhasebeSenaryolariTextHook.content;
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
    if (isOpen && selectedFile && !xIslemiMuhasebeSenaryolariTextHook.isProcessed && !xIslemiMuhasebeSenaryolariTextHook.isLoading) {
      console.log('📄 X İşlemi Muhasebe Senaryoları Metni: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiMuhasebeSenaryolariTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, xIslemiMuhasebeSenaryolariTextHook.isProcessed, xIslemiMuhasebeSenaryolariTextHook.isLoading, xIslemiMuhasebeSenaryolariTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, X İşlemi Muhasebe Senaryoları hook reset ediliyor:', selectedFile.name);
      xIslemiMuhasebeSenaryolariTextHook.resetContent();
    }
  }, [selectedFile?.name, xIslemiMuhasebeSenaryolariTextHook.resetContent]);
  
  // Kaydet fonksiyonu - X İşlemi Muhasebe Senaryoları verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // X İşlemi Muhasebe Senaryoları verilerini JSON formatında hazırla
      const xIslemiMuhasebeSenaryolariData = {
        title: 'X İşlemi Muhasebe Senaryoları',
        content: textContent || xIslemiMuhasebeSenaryolariTextHook.content,
        validation: {
          found: xIslemiMuhasebeSenaryolariTextHook.validation?.found || false,
          mode: xIslemiMuhasebeSenaryolariTextHook.validation?.mode || 'strict',
          contentLength: (textContent || xIslemiMuhasebeSenaryolariTextHook.content)?.length || 0,
          errors: xIslemiMuhasebeSenaryolariTextHook.validation?.errors || [],
          warnings: xIslemiMuhasebeSenaryolariTextHook.validation?.warnings || [],
          matchedLabels: xIslemiMuhasebeSenaryolariTextHook.validation?.matchedLabels || []
        },
        isProcessed: xIslemiMuhasebeSenaryolariTextHook.isProcessed,
        isLoading: xIslemiMuhasebeSenaryolariTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 X İşlemi Muhasebe Senaryoları kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || xIslemiMuhasebeSenaryolariTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        x_islemi_muhasebe_senaryolari: JSON.stringify(xIslemiMuhasebeSenaryolariData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ X İşlemi Muhasebe Senaryoları başarıyla kaydedildi:', result);
        markModalAsSaved('x-islemi-muhasebe-senaryolari'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ X İşlemi Muhasebe Senaryoları kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ X İşlemi Muhasebe Senaryoları kaydetme hatası:', error);
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
    <div className="x-islemi-muhasebe-senaryolari-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="x-islemi-muhasebe-senaryolari-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="x-islemi-muhasebe-senaryolari-header">
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
        {xIslemiMuhasebeSenaryolariTextHook.validation && (xIslemiMuhasebeSenaryolariTextHook.validation.errors.length > 0 || xIslemiMuhasebeSenaryolariTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {xIslemiMuhasebeSenaryolariTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {xIslemiMuhasebeSenaryolariTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {xIslemiMuhasebeSenaryolariTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {xIslemiMuhasebeSenaryolariTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="x-islemi-muhasebe-senaryolari-content">
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
                  xIslemiMuhasebeSenaryolariTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                placeholder="X İşlemi Muhasebe Senaryoları ile ilgili metin içeriğini buraya girin..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="x-islemi-muhasebe-senaryolari-footer">
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

export default XIslemiMuhasebeSenaryolariModal;
