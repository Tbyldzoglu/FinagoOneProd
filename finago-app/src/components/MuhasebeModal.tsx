/**
 * Muhasebe Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/MuhasebeModal.css';
import LLMChat from './LLMChat';
import { useMuhasebeText } from '../hooks/useMuhasebeText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface MuhasebeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const MuhasebeModal: React.FC<MuhasebeModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Muhasebe metin hook'u
  const muhasebeTextHook = useMuhasebeText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    console.log('🔍 DEBUG - MuhasebeModal getCurrentContent:');
    console.log('  - muhasebeTextHook.content:', muhasebeTextHook.content?.substring(0, 100) + '...');
    
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!muhasebeTextHook.content || muhasebeTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('muhasebe_content');
      console.log('  - localStorage muhasebe_content:', transferData?.substring(0, 100) + '...');
      if (transferData) {
        return transferData;
      }
    }
    return muhasebeTextHook.content;
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
    if (isOpen && selectedFile && !muhasebeTextHook.isProcessed && !muhasebeTextHook.isLoading) {
      console.log('📄 Muhasebe Metni: DOCX dosyası işleniyor:', selectedFile.name);
      muhasebeTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, muhasebeTextHook.isProcessed, muhasebeTextHook.isLoading, muhasebeTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Muhasebe hook reset ediliyor:', selectedFile.name);
      muhasebeTextHook.resetContent();
    }
  }, [selectedFile?.name, muhasebeTextHook.resetContent]);
  
  // Kaydet fonksiyonu - Muhasebe verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Muhasebe verilerini JSON formatında hazırla
      const muhasebeData = {
        title: 'Muhasebe',
        content: textContent || muhasebeTextHook.content,
        validation: {
          found: muhasebeTextHook.validation?.found || false,
          mode: muhasebeTextHook.validation?.mode || 'strict',
          contentLength: (textContent || muhasebeTextHook.content)?.length || 0,
          errors: muhasebeTextHook.validation?.errors || [],
          warnings: muhasebeTextHook.validation?.warnings || [],
          matchedLabels: muhasebeTextHook.validation?.matchedLabels || []
        },
        isProcessed: muhasebeTextHook.isProcessed,
        isLoading: muhasebeTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Muhasebe kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || muhasebeTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        muhasebe: JSON.stringify(muhasebeData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Muhasebe başarıyla kaydedildi:', result);
        markModalAsSaved('muhasebe'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Muhasebe kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Muhasebe kaydetme hatası:', error);
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
    muhasebeTextHook.updateContent(e.target.value);
    setTextContent(e.target.value);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="muhasebe-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="muhasebe-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="muhasebe-header">
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
        {muhasebeTextHook.validation && (muhasebeTextHook.validation.errors.length > 0 || muhasebeTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {muhasebeTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {muhasebeTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {muhasebeTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {muhasebeTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="muhasebe-content">
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
        <div className="muhasebe-footer">
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

export default MuhasebeModal;
