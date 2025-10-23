/**
 * Kapsam Dışında Kalan Konular / Maddeler Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/KapsamDisindaModal.css';
import LLMChat from './LLMChat';
import { useKapsamDisindaText } from '../hooks/useKapsamDisindaText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface KapsamDisindaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const KapsamDisindaModal: React.FC<KapsamDisindaModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Kapsam Dışında metin hook'u
  const kapsamDisindaTextHook = useKapsamDisindaText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!kapsamDisindaTextHook.content || kapsamDisindaTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('kapsam_disinda_content');
      if (transferData) {
        return transferData;
      }
    }
    return kapsamDisindaTextHook.content;
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
    if (isOpen && selectedFile && !kapsamDisindaTextHook.isProcessed && !kapsamDisindaTextHook.isLoading) {
      console.log('📄 Kapsam Dışında Kalan Konular / Maddeler Metni: DOCX dosyası işleniyor:', selectedFile.name);
      kapsamDisindaTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, kapsamDisindaTextHook.isProcessed, kapsamDisindaTextHook.isLoading, kapsamDisindaTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Kapsam Dışında hook reset ediliyor:', selectedFile.name);
      kapsamDisindaTextHook.resetContent();
    }
  }, [selectedFile?.name, kapsamDisindaTextHook.resetContent]);
  
  // Kaydet fonksiyonu - Kapsam Dışında Kalan Konular ve Maddeler verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Kapsam Dışında Kalan Konular ve Maddeler verilerini JSON formatında hazırla
      const kapsamDisindaData = {
        title: 'Kapsam Dışında Kalan Konular / Maddeler',
        content: textContent || kapsamDisindaTextHook.content,
        validation: {
          found: kapsamDisindaTextHook.validation?.found || false,
          mode: kapsamDisindaTextHook.validation?.mode || 'strict',
          contentLength: (textContent || kapsamDisindaTextHook.content)?.length || 0,
          errors: kapsamDisindaTextHook.validation?.errors || [],
          warnings: kapsamDisindaTextHook.validation?.warnings || [],
          matchedLabels: kapsamDisindaTextHook.validation?.matchedLabels || []
        },
        isProcessed: kapsamDisindaTextHook.isProcessed,
        isLoading: kapsamDisindaTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Kapsam Dışında Kalan Konular ve Maddeler kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || kapsamDisindaTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        kapsam_disinda: JSON.stringify(kapsamDisindaData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Kapsam Dışında Kalan Konular ve Maddeler başarıyla kaydedildi:', result);
        markModalAsSaved('kapsam-disinda'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Kapsam Dışında Kalan Konular ve Maddeler kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Kapsam Dışında Kalan Konular ve Maddeler kaydetme hatası:', error);
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
    <div className="kapsam-disinda-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="kapsam-disinda-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="kapsam-disinda-header">
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
        {kapsamDisindaTextHook.validation && (kapsamDisindaTextHook.validation.errors.length > 0 || kapsamDisindaTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {kapsamDisindaTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {kapsamDisindaTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {kapsamDisindaTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {kapsamDisindaTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="kapsam-disinda-content">
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
                  kapsamDisindaTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                placeholder="Kapsam dışında kalan konular ve maddeler ile ilgili metin içeriğini buraya girin..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="kapsam-disinda-footer">
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

export default KapsamDisindaModal;
