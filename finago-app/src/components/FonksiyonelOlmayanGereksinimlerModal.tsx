/**
 * Fonksiyonel Olmayan Gereksinimler Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/FonksiyonelOlmayanGereksinimlerModal.css';
import LLMChat from './LLMChat';
import { useFonksiyonelOlmayanGereksinimlerText } from '../hooks/useFonksiyonelOlmayanGereksinimlerText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface FonksiyonelOlmayanGereksinimlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const FonksiyonelOlmayanGereksinimlerModal: React.FC<FonksiyonelOlmayanGereksinimlerModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Fonksiyonel Olmayan Gereksinimler metin hook'u
  const fonksiyonelOlmayanGereksinimlerTextHook = useFonksiyonelOlmayanGereksinimlerText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!fonksiyonelOlmayanGereksinimlerTextHook.content || fonksiyonelOlmayanGereksinimlerTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('fonksiyonel_olmayan_gereksinimler_content');
      if (transferData) {
        return transferData;
      }
    }
    return fonksiyonelOlmayanGereksinimlerTextHook.content;
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
    if (isOpen && selectedFile && !fonksiyonelOlmayanGereksinimlerTextHook.isProcessed && !fonksiyonelOlmayanGereksinimlerTextHook.isLoading) {
      console.log('📄 Fonksiyonel Olmayan Gereksinimler Metni: DOCX dosyası işleniyor:', selectedFile.name);
      fonksiyonelOlmayanGereksinimlerTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, fonksiyonelOlmayanGereksinimlerTextHook.isProcessed, fonksiyonelOlmayanGereksinimlerTextHook.isLoading, fonksiyonelOlmayanGereksinimlerTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Fonksiyonel Olmayan Gereksinimler hook reset ediliyor:', selectedFile.name);
      fonksiyonelOlmayanGereksinimlerTextHook.resetContent();
    }
  }, [selectedFile?.name, fonksiyonelOlmayanGereksinimlerTextHook.resetContent]);
  
  // Kaydet fonksiyonu - Fonksiyonel Olmayan Gereksinimler verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Fonksiyonel Olmayan Gereksinimler verilerini JSON formatında hazırla
      const fonksiyonelOlmayanGereksinimlerData = {
        title: 'Fonksiyonel Olmayan Gereksinimler',
        content: textContent || fonksiyonelOlmayanGereksinimlerTextHook.content,
        validation: {
          found: fonksiyonelOlmayanGereksinimlerTextHook.validation?.found || false,
          mode: fonksiyonelOlmayanGereksinimlerTextHook.validation?.mode || 'strict',
          contentLength: (textContent || fonksiyonelOlmayanGereksinimlerTextHook.content)?.length || 0,
          errors: fonksiyonelOlmayanGereksinimlerTextHook.validation?.errors || [],
          warnings: fonksiyonelOlmayanGereksinimlerTextHook.validation?.warnings || [],
          matchedLabels: fonksiyonelOlmayanGereksinimlerTextHook.validation?.matchedLabels || []
        },
        isProcessed: fonksiyonelOlmayanGereksinimlerTextHook.isProcessed,
        isLoading: fonksiyonelOlmayanGereksinimlerTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Fonksiyonel Olmayan Gereksinimler kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || fonksiyonelOlmayanGereksinimlerTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        fonksiyonel_olmayan_gereksinimler: JSON.stringify(fonksiyonelOlmayanGereksinimlerData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Fonksiyonel Olmayan Gereksinimler başarıyla kaydedildi:', result);
        markModalAsSaved('fonksiyonel-olmayan-gereksinimler'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Fonksiyonel Olmayan Gereksinimler kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Fonksiyonel Olmayan Gereksinimler kaydetme hatası:', error);
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
    <div className="fonksiyonel-olmayan-gereksinimler-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="fonksiyonel-olmayan-gereksinimler-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="fonksiyonel-olmayan-gereksinimler-header">
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
        {fonksiyonelOlmayanGereksinimlerTextHook.validation && (fonksiyonelOlmayanGereksinimlerTextHook.validation.errors.length > 0 || fonksiyonelOlmayanGereksinimlerTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {fonksiyonelOlmayanGereksinimlerTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {fonksiyonelOlmayanGereksinimlerTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {fonksiyonelOlmayanGereksinimlerTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {fonksiyonelOlmayanGereksinimlerTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="fonksiyonel-olmayan-gereksinimler-content">
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
                  fonksiyonelOlmayanGereksinimlerTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                placeholder="Fonksiyonel Olmayan Gereksinimler ile ilgili metin içeriğini buraya girin..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="fonksiyonel-olmayan-gereksinimler-footer">
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

export default FonksiyonelOlmayanGereksinimlerModal;
