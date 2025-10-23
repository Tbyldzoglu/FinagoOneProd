/**
 * Onaylar Modal Bileşeni
 * Tablo ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/OnaylarModal.css';
import LLMChat from './LLMChat';
import { useOnaylar } from '../hooks/useOnaylar';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface OnaylarModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const OnaylarModal: React.FC<OnaylarModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const {
    tableRows,
    parseResult,
    isLoading,
    isProcessed,
    processFile,
    addRow,
    removeRow,
    updateRow,
    hasData
  } = useOnaylar();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // DOCX dosyası işleme (Faz2 aktarımı yoksa)
  useEffect(() => {
    if (!isOpen) return;
    
    // Faz2 aktarımı varsa DOCX parse etme
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    if (faz2Suggestions) {
      try {
        const suggestions = JSON.parse(faz2Suggestions);
        if (suggestions.onaylar) {
          console.log('✅ Faz2 aktarımı mevcut, DOCX parse atlanıyor (Onaylar)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal DOCX yükleme
    if (selectedFile && !isProcessed && !isLoading) {
      console.log('📄 DOCX işleniyor (Onaylar):', selectedFile.name);
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);

  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const storedSuggestions = localStorage.getItem('faz2_suggestions');
      if (!storedSuggestions) {
        setFaz2Suggestion('');
        return;
      }
      
      const suggestions = JSON.parse(storedSuggestions);
      
      if (suggestions.onaylar) {
        let suggestionContent = suggestions.onaylar;
        
        // Eğer string ise ve JSON formatındaysa parse et
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {
            // Parse edilemezse raw string'i kullan
          }
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Onaylar)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Onaylar verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Onaylar verilerini JSON formatında hazırla
      const onaylarData = {
        title: 'Onaylar',
        tableData: {
          tableRows: tableRows
        },
        validation: {
          found: hasData || false,
          mode: 'strict',
          errors: [],
          warnings: [],
          matchedLabels: []
        },
        isProcessed: isProcessed,
        isLoading: isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Onaylar kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: tableRows?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        onaylar: JSON.stringify(onaylarData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Onaylar başarıyla kaydedildi:', result);
        markModalAsSaved('onaylar'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Onaylar kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Onaylar kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('onaylar_tablerows', JSON.stringify(tableRows));
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
      // Modal kapanırken localStorage'a kaydet
      localStorage.setItem('onaylar_tablerows', JSON.stringify(tableRows));
      onClose();
    }
  };


  if (!isOpen) return null;

  return createPortal(
    <div className="onaylar-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="onaylar-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="onaylar-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('onaylar_tablerows', JSON.stringify(tableRows));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="onaylar-content">
          {/* Sol Taraf - Tablo */}
          <div className="table-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Onaylar Tablosu
              </div>
            </div>
            <div className="table-container">
              <table className="onaylar-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>İşlem Tipi</th>
                    <th>Onay Seviyesi</th>
                    <th>Onay Süreci</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <span className="row-number">{index + 1}</span>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          value={row.isim} 
                          onChange={(e) => updateRow(row.id, 'isim', e.target.value)}
                          placeholder="İşlem Tipi giriniz..."
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          value={row.unvan} 
                          onChange={(e) => updateRow(row.id, 'unvan', e.target.value)}
                          placeholder="Onay Seviyesi giriniz..."
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          value={row.tarih} 
                          onChange={(e) => updateRow(row.id, 'tarih', e.target.value)}
                          placeholder="Onay Süreci giriniz..."
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          {tableRows.length > 1 && (
                            <button 
                              className="remove-row-btn" 
                              onClick={() => removeRow(row.id)} 
                              title="Satırı sil"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="add-row-container">
                <button className="add-row-btn" onClick={addRow}>
                  + Yeni Satır Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} faz2Suggestion={faz2Suggestion} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="onaylar-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('onaylar_tablerows', JSON.stringify(tableRows));
              onClose();
            }}>
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

export default OnaylarModal;
