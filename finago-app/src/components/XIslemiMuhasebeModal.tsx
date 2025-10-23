/**
 * X İşlemi Muhasebesi Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/XIslemiMuhasebeModal.css';
import LLMChat from './LLMChat';
import { useXIslemiMuhasebeModal } from '../hooks/useXIslemiMuhasebeModal';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface XIslemiMuhasebeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const XIslemiMuhasebeModal: React.FC<XIslemiMuhasebeModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    formData,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateField
  } = useXIslemiMuhasebeModal();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  // DOCX dosyası seçildiğinde işle (sadece bir kez)
  useEffect(() => {
    console.log('📄 XIslemiMuhasebeModal useEffect:', { isOpen, selectedFile: selectedFile?.name, isProcessed });
    if (isOpen && selectedFile && !isProcessed && !isLoading) {
      console.log('📄 XIslemiMuhasebeModal: DOCX dosyası işleniyor:', selectedFile.name);
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);

  // Modal açıldığında Faz2 önerisini localStorage'dan oku (sadece aktarım yapıldıysa)
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const storedSuggestions = localStorage.getItem('faz2_suggestions');
      if (!storedSuggestions) {
        setFaz2Suggestion('');
        return;
      }
      
      const suggestions = JSON.parse(storedSuggestions);
      
      if (suggestions.xIslemiMuhasebesi) {
        let suggestionContent = suggestions.xIslemiMuhasebesi;
        
        // Eğer string ise ve JSON formatındaysa parse et
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {
            // Parse edilemezse raw string'i kullan
          }
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (X İşlemi Muhasebesi)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - X İşlemi Muhasebesi verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // X İşlemi Muhasebesi verilerini JSON formatında hazırla
      const xIslemiMuhasebeData = {
        title: 'X İşlemi Muhasebesi',
        formData: formData,
        validation: {
          found: validation?.found || false,
          mode: validation?.mode || 'strict',
          errors: validation?.errors || [],
          warnings: validation?.warnings || [],
          matchedLabels: validation?.matchedLabels || []
        },
        isProcessed: isProcessed,
        isLoading: isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 X İşlemi Muhasebesi kaydediliyor:', { 
        selectedFile: selectedFile.name,
        formFieldCount: Object.keys(formData).length
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        x_islemi_muhasebesi: JSON.stringify(xIslemiMuhasebeData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ X İşlemi Muhasebesi başarıyla kaydedildi:', result);
        markModalAsSaved('x-islemi-muhasebe'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ X İşlemi Muhasebesi kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ X İşlemi Muhasebesi kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="x-islemi-muhasebe-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="x-islemi-muhasebe-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="x-islemi-muhasebe-header">
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

        {/* Modal Content - Split Layout */}
        <div className="x-islemi-muhasebe-content">
          {/* Sol Taraf - Table */}
          <div className="table-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Muhasebe Bilgileri
              </div>
            </div>
            <div className="table-container">
              <table className="muhasebe-table">
                <tbody>
                  <tr>
                    <td className="label-cell">İşlem Tanımı:</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input"
                        placeholder="İşlem tanımını girin..."
                        value={formData.islemTanimi}
                        onChange={(e) => updateField('islemTanimi', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">İlgili Ürün / Modül:</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input"
                        placeholder="Ürün/modül bilgisini girin..."
                        value={formData.ilgiliUrunModul}
                        onChange={(e) => updateField('ilgiliUrunModul', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Tetikleyici Olay:</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input"
                        placeholder="Tetikleyici olayı girin..."
                        value={formData.tetikleyiciOlay}
                        onChange={(e) => updateField('tetikleyiciOlay', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Muhasebe Kaydının İzleneceği Ekran:</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input"
                        placeholder="Ekran bilgisini girin..."
                        value={formData.muhasebeKaydininiIzlenecegiEkran}
                        onChange={(e) => updateField('muhasebeKaydininiIzlenecegiEkran', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Hata Yönetimi:</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input"
                        placeholder="Hata yönetimi bilgisini girin..."
                        value={formData.hataYonetimi}
                        onChange={(e) => updateField('hataYonetimi', e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat 
              sectionId={sectionId} 
              sectionTitle={sectionTitle}
              faz2Suggestion={faz2Suggestion}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="x-islemi-muhasebe-footer">
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

export default XIslemiMuhasebeModal;
