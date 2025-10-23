/**
 * X İşlemi Muhasebe Deseni Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/XIslemiMuhasebeDeseniModal.css';
import LLMChat from './LLMChat';
import { useXIslemiMuhasebeDeseniText } from '../hooks/useXIslemiMuhasebeDeseniText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface XIslemiMuhasebeDeseniModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const XIslemiMuhasebeDeseniModal: React.FC<XIslemiMuhasebeDeseniModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // X İşlemi Muhasebe Deseni metin hook'u
  const xIslemiMuhasebeDeseniTextHook = useXIslemiMuhasebeDeseniText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    console.log('🔍 DEBUG - XIslemiMuhasebeDeseniModal getCurrentContent:');
    console.log('  - xIslemiMuhasebeDeseniTextHook.content:', xIslemiMuhasebeDeseniTextHook.content?.substring(0, 100) + '...');
    
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!xIslemiMuhasebeDeseniTextHook.content || xIslemiMuhasebeDeseniTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('x_islemi_muhasebe_deseni_content');
      console.log('  - localStorage x_islemi_muhasebe_deseni_content:', transferData?.substring(0, 100) + '...');
      if (transferData) {
        return transferData;
      }
    }
    return xIslemiMuhasebeDeseniTextHook.content;
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
    if (isOpen && selectedFile && !xIslemiMuhasebeDeseniTextHook.isProcessed && !xIslemiMuhasebeDeseniTextHook.isLoading) {
      console.log('📄 X İşlemi Muhasebe Deseni Metni: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiMuhasebeDeseniTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, xIslemiMuhasebeDeseniTextHook.isProcessed, xIslemiMuhasebeDeseniTextHook.isLoading, xIslemiMuhasebeDeseniTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, X İşlemi Muhasebe Deseni hook reset ediliyor:', selectedFile.name);
      xIslemiMuhasebeDeseniTextHook.resetContent();
    }
  }, [selectedFile?.name, xIslemiMuhasebeDeseniTextHook.resetContent]);
  
  // Kaydet fonksiyonu - X İşlemi Muhasebe Deseni verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // X İşlemi Muhasebe Deseni verilerini JSON formatında hazırla
      const xIslemiMuhasebeDeseniData = {
        title: 'X İşlemi Muhasebe Deseni',
        content: textContent || xIslemiMuhasebeDeseniTextHook.content,
        validation: {
          found: xIslemiMuhasebeDeseniTextHook.validation?.found || false,
          mode: xIslemiMuhasebeDeseniTextHook.validation?.mode || 'strict',
          contentLength: (textContent || xIslemiMuhasebeDeseniTextHook.content)?.length || 0,
          errors: xIslemiMuhasebeDeseniTextHook.validation?.errors || [],
          warnings: xIslemiMuhasebeDeseniTextHook.validation?.warnings || [],
          matchedLabels: xIslemiMuhasebeDeseniTextHook.validation?.matchedLabels || []
        },
        isProcessed: xIslemiMuhasebeDeseniTextHook.isProcessed,
        isLoading: xIslemiMuhasebeDeseniTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 X İşlemi Muhasebe Deseni kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || xIslemiMuhasebeDeseniTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        x_islemi_muhasebe_deseni: JSON.stringify(xIslemiMuhasebeDeseniData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ X İşlemi Muhasebe Deseni başarıyla kaydedildi:', result);
        markModalAsSaved('x-islemi-muhasebe-deseni'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ X İşlemi Muhasebe Deseni kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ X İşlemi Muhasebe Deseni kaydetme hatası:', error);
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
    <div className="x-islemi-muhasebe-deseni-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="x-islemi-muhasebe-deseni-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="x-islemi-muhasebe-deseni-header">
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
        {xIslemiMuhasebeDeseniTextHook.validation && (xIslemiMuhasebeDeseniTextHook.validation.errors.length > 0 || xIslemiMuhasebeDeseniTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {xIslemiMuhasebeDeseniTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {xIslemiMuhasebeDeseniTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {xIslemiMuhasebeDeseniTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {xIslemiMuhasebeDeseniTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="x-islemi-muhasebe-deseni-content">
          {/* Sol Taraf - Text Area */}
          <div className="text-panel">
            <div className="panel-header">
              <div className="panel-title">
                📝 Metin Düzenleme
              </div>
            </div>
            <div className="text-container">
              <textarea
                value={getCurrentContent() || textContent}
                onChange={(e) => {
                  // Hem hook'ta hem de local state'te güncelle
                  xIslemiMuhasebeDeseniTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                className="text-area"
                placeholder="X İşlemi Muhasebe Deseni ile ilgili metin içeriğini buraya yazın..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="x-islemi-muhasebe-deseni-footer">
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

export default XIslemiMuhasebeDeseniModal;
