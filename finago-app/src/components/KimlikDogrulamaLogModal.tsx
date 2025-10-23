/**
 * Kimlik Doğrulama ve Log Yönetimi Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/KimlikDogrulamaLogModal.css';
import LLMChat from './LLMChat';
import { useKimlikDogrulamaLogText } from '../hooks/useKimlikDogrulamaLogText';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface KimlikDogrulamaLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const KimlikDogrulamaLogModal: React.FC<KimlikDogrulamaLogModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Kimlik Doğrulama ve Log Yönetimi metin hook'u
  const kimlikDogrulamaLogTextHook = useKimlikDogrulamaLogText();
  
  // Transfer sonrası localStorage'dan veri çekme fonksiyonu
  const getCurrentContent = () => {
    // Eğer hook'ta veri yoksa localStorage'dan kontrol et
    if (!kimlikDogrulamaLogTextHook.content || kimlikDogrulamaLogTextHook.content.trim() === '') {
      const transferData = localStorage.getItem('kimlik_dogrulama_log_content');
      if (transferData) {
        return transferData;
      }
    }
    return kimlikDogrulamaLogTextHook.content;
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
    if (isOpen && selectedFile && !kimlikDogrulamaLogTextHook.isProcessed && !kimlikDogrulamaLogTextHook.isLoading) {
      console.log('📄 Kimlik Doğrulama ve Log Yönetimi Metni: DOCX dosyası işleniyor:', selectedFile.name);
      kimlikDogrulamaLogTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, kimlikDogrulamaLogTextHook.isProcessed, kimlikDogrulamaLogTextHook.isLoading, kimlikDogrulamaLogTextHook.processFile]);
  
  // Dosya değiştiğinde hook'u reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Kimlik Doğrulama ve Log Yönetimi hook reset ediliyor:', selectedFile.name);
      kimlikDogrulamaLogTextHook.resetContent();
    }
  }, [selectedFile?.name, kimlikDogrulamaLogTextHook.resetContent]);
  
  // Kaydet fonksiyonu - Kimlik Doğrulama ve Log Yönetimi verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Kimlik Doğrulama ve Log Yönetimi verilerini JSON formatında hazırla
      const kimlikDogrulamaLogData = {
        title: 'Kimlik Doğrulama ve Log Yönetimi',
        content: textContent || kimlikDogrulamaLogTextHook.content,
        validation: {
          found: kimlikDogrulamaLogTextHook.validation?.found || false,
          mode: kimlikDogrulamaLogTextHook.validation?.mode || 'strict',
          contentLength: (textContent || kimlikDogrulamaLogTextHook.content)?.length || 0,
          errors: kimlikDogrulamaLogTextHook.validation?.errors || [],
          warnings: kimlikDogrulamaLogTextHook.validation?.warnings || [],
          matchedLabels: kimlikDogrulamaLogTextHook.validation?.matchedLabels || []
        },
        isProcessed: kimlikDogrulamaLogTextHook.isProcessed,
        isLoading: kimlikDogrulamaLogTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Kimlik Doğrulama ve Log Yönetimi kaydediliyor:', { 
        selectedFile: selectedFile.name,
        contentLength: (textContent || kimlikDogrulamaLogTextHook.content)?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        kimlik_dogrulama_log: JSON.stringify(kimlikDogrulamaLogData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Kimlik Doğrulama ve Log Yönetimi başarıyla kaydedildi:', result);
        markModalAsSaved('kimlik-dogrulama-log'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Kimlik Doğrulama ve Log Yönetimi kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Kimlik Doğrulama ve Log Yönetimi kaydetme hatası:', error);
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
    <div className="kimlik-dogrulama-log-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="kimlik-dogrulama-log-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="kimlik-dogrulama-log-header">
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
        {kimlikDogrulamaLogTextHook.validation && (kimlikDogrulamaLogTextHook.validation.errors.length > 0 || kimlikDogrulamaLogTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {kimlikDogrulamaLogTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {kimlikDogrulamaLogTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {kimlikDogrulamaLogTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {kimlikDogrulamaLogTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="kimlik-dogrulama-log-content">
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
                  kimlikDogrulamaLogTextHook.updateContent(e.target.value);
                  setTextContent(e.target.value);
                }}
                placeholder="Kimlik Doğrulama ve Log Yönetimi ile ilgili metin içeriğini buraya girin..."
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="kimlik-dogrulama-log-footer">
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

export default KimlikDogrulamaLogModal;
