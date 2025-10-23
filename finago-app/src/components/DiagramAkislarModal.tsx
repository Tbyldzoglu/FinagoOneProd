/**
 * Diagram ve Akışlar Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/DiagramAkislarModal.css';
import LLMChat from './LLMChat';
import { useDiagramAkislarText } from '../hooks/useDiagramAkislarText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface DiagramAkislarModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const DiagramAkislarModal: React.FC<DiagramAkislarModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Diagram ve Akışlar metin hook'u
  const diagramAkislarTextHook = useDiagramAkislarText();
  
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
    if (!diagramAkislarTextHook.content || diagramAkislarTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('diagram_akislar_content');
      if (transferData) {
        return transferData;
      }
    }
    return diagramAkislarTextHook.content || textContent;
  };
  
  // DOCX dosyası seçildiğinde işle
  useEffect(() => {
    if (isOpen && selectedFile && !diagramAkislarTextHook.isProcessed && !diagramAkislarTextHook.isLoading) {
      console.log('📄 Diagram ve Akışlar Metni: DOCX dosyası işleniyor:', selectedFile.name);
      diagramAkislarTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, diagramAkislarTextHook.isProcessed, diagramAkislarTextHook.isLoading, diagramAkislarTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Diagram Akışlar hook reset ediliyor:', selectedFile.name);
      diagramAkislarTextHook.resetContent();
    }
  }, [selectedFile?.name, diagramAkislarTextHook.resetContent]);
  
  // Kaydet fonksiyonu - Diagram Akışlar verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Diagram Akışlar verilerini JSON formatında hazırla
      const diagramAkislarData = {
        title: 'Diagram ve Akışlar',
        content: getCurrentContent(),
        validation: {
          found: diagramAkislarTextHook.validation?.found || false,
          mode: diagramAkislarTextHook.validation?.mode || 'strict',
          contentLength: getCurrentContent()?.length || 0,
          errors: diagramAkislarTextHook.validation?.errors || [],
          warnings: diagramAkislarTextHook.validation?.warnings || [],
          matchedLabels: diagramAkislarTextHook.validation?.matchedLabels || []
        },
        isProcessed: diagramAkislarTextHook.isProcessed,
        isLoading: diagramAkislarTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Diagram Akışlar kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: getCurrentContent()?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        diagram_akislar: JSON.stringify(diagramAkislarData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Diagram Akışlar başarıyla kaydedildi:', result);
        markModalAsSaved('diagram-akislar'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Diagram Akışlar kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Diagram Akışlar kaydetme hatası:', error);
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
    <div className="diagram-akislar-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="diagram-akislar-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="diagram-akislar-header">
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
        {diagramAkislarTextHook.validation && (diagramAkislarTextHook.validation.errors.length > 0 || diagramAkislarTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {diagramAkislarTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {diagramAkislarTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {diagramAkislarTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {diagramAkislarTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="diagram-akislar-content">
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
                  diagramAkislarTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                className="text-area"
                placeholder="Diagram ve Akışlar ile ilgili metin içeriğini buraya yazın..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="diagram-akislar-footer">
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

export default DiagramAkislarModal;
