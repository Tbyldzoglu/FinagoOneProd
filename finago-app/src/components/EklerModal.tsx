/**
 * Ekler Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/EklerModal.css';
import LLMChat from './LLMChat';
import { useEklerText } from '../hooks/useEklerText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface EklerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const EklerModal: React.FC<EklerModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Ekler metin hook'u
  const eklerTextHook = useEklerText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    console.log('🔍 DEBUG - EklerModal getCurrentContent:');
    console.log('  - eklerTextHook.content:', eklerTextHook.content?.substring(0, 100) + '...');
    
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!eklerTextHook.content || eklerTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('ekler_content');
      console.log('  - localStorage ekler_content:', transferData?.substring(0, 100) + '...');
      if (transferData) {
        return transferData;
      }
    }
    return eklerTextHook.content;
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
    if (isOpen && selectedFile && !eklerTextHook.isProcessed && !eklerTextHook.isLoading) {
      console.log('📄 Ekler Metni: DOCX dosyası işleniyor:', selectedFile.name);
      eklerTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, eklerTextHook.isProcessed, eklerTextHook.isLoading, eklerTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Ekler hook reset ediliyor:', selectedFile.name);
      eklerTextHook.resetContent();
    }
  }, [selectedFile?.name, eklerTextHook.resetContent]);
  
  // Kaydet fonksiyonu - Ekler verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Ekler verilerini JSON formatında hazırla
      const eklerData = {
        title: 'Ekler',
        content: textContent || eklerTextHook.content,
        validation: {
          found: eklerTextHook.validation?.found || false,
          mode: eklerTextHook.validation?.mode || 'strict',
          contentLength: (textContent || eklerTextHook.content)?.length || 0,
          errors: eklerTextHook.validation?.errors || [],
          warnings: eklerTextHook.validation?.warnings || [],
          matchedLabels: eklerTextHook.validation?.matchedLabels || []
        },
        isProcessed: eklerTextHook.isProcessed,
        isLoading: eklerTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Ekler kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || eklerTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        ekler: JSON.stringify(eklerData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Ekler başarıyla kaydedildi:', result);
        markModalAsSaved('ekler'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Ekler kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Ekler kaydetme hatası:', error);
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

  // Text area değişikliklerini handle et
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Hem hook'ta hem de local state'te güncelle
    eklerTextHook.updateContent(e.target.value);
    setTextContent(e.target.value);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="ekler-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="ekler-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="ekler-header">
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
        {eklerTextHook.validation && (eklerTextHook.validation.errors.length > 0 || eklerTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {eklerTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {eklerTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {eklerTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {eklerTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="ekler-content">
          {/* Sol Taraf - Text Area */}
          <div className="text-panel">
            <div className="panel-header">
              <div className="panel-title">
                📝 Metin Düzenleyici
              </div>
            </div>
            <div className="text-container">
              <textarea
                className="text-editor"
                value={getCurrentContent() || textContent}
                onChange={handleTextChange}
                placeholder="Buraya metin içeriğinizi yazabilirsiniz..."
                autoFocus
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="ekler-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
            <span className="char-count">{textContent.length} karakter</span>
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

export default EklerModal;
