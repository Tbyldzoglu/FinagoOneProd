/**
 * Conversion ve Migration Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/ConversionMigrationModal.css';
import LLMChat from './LLMChat';
import { useConversionMigrationText } from '../hooks/useConversionMigrationText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface ConversionMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const ConversionMigrationModal: React.FC<ConversionMigrationModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Conversion ve Migration metin hook'u
  const conversionMigrationTextHook = useConversionMigrationText();
  
  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal kapandığında state'i temizle
  useEffect(() => {
    if (!isOpen) {
      setTextContent('');
    }
  }, [isOpen]);
  
  // Transfer sonrası localStorage'dan content'i al
  const getCurrentContent = () => {
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!conversionMigrationTextHook.content || conversionMigrationTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('conversation_migration_content');
      if (transferData) {
        return transferData;
      }
    }
    return conversionMigrationTextHook.content || textContent;
  };
  
  // DOCX dosyası seçildiğinde işle
  useEffect(() => {
    if (isOpen && selectedFile && !conversionMigrationTextHook.isProcessed && !conversionMigrationTextHook.isLoading) {
      console.log('📄 Conversion ve Migration Metni: DOCX dosyası işleniyor:', selectedFile.name);
      conversionMigrationTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, conversionMigrationTextHook.isProcessed, conversionMigrationTextHook.isLoading, conversionMigrationTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Conversion Migration hook reset ediliyor:', selectedFile.name);
      conversionMigrationTextHook.resetContent();
    }
  }, [selectedFile?.name, conversionMigrationTextHook.resetContent]);
  
  // Kaydet fonksiyonu - Conversion Migration verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Conversion Migration verilerini JSON formatında hazırla
      const conversionMigrationData = {
        title: 'Conversion ve Migration',
        content: getCurrentContent(),
        validation: {
          found: conversionMigrationTextHook.validation?.found || false,
          mode: conversionMigrationTextHook.validation?.mode || 'strict',
          contentLength: getCurrentContent()?.length || 0,
          errors: conversionMigrationTextHook.validation?.errors || [],
          warnings: conversionMigrationTextHook.validation?.warnings || [],
          matchedLabels: conversionMigrationTextHook.validation?.matchedLabels || []
        },
        isProcessed: conversionMigrationTextHook.isProcessed,
        isLoading: conversionMigrationTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Conversion Migration kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: getCurrentContent()?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        conversation_migration: JSON.stringify(conversionMigrationData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Conversion Migration başarıyla kaydedildi:', result);
        markModalAsSaved('conversation-migration'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Conversion Migration kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Conversion Migration kaydetme hatası:', error);
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
    <div className="conversion-migration-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="conversion-migration-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="conversion-migration-header">
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
        {conversionMigrationTextHook.validation && (conversionMigrationTextHook.validation.errors.length > 0 || conversionMigrationTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {conversionMigrationTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {conversionMigrationTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {conversionMigrationTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {conversionMigrationTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="conversion-migration-content">
          {/* Sol Taraf - Text Area */}
          <div className="text-panel">
            <div className="panel-header">
              <div className="panel-title">
                📝 Metin Düzenleme
              </div>
            </div>
            <div className="text-container">
              <textarea
                value={getCurrentContent()}
                onChange={(e) => {
                  // Hem hook'ta hem de local state'te güncelle
                  conversionMigrationTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                className="text-area"
                placeholder="Conversion ve Migration ile ilgili metin içeriğini buraya yazın..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="conversion-migration-footer">
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

export default ConversionMigrationModal;
