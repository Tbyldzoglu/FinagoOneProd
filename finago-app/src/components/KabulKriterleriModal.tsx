/**
 * Kabul Kriterleri Modal Bileşeni
 * Tablo ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/KabulKriterleriModal.css';
import LLMChat from './LLMChat';
import { useKabulKriterleri } from '../hooks/useKabulKriterleri';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface KabulKriterleriModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const KabulKriterleriModal: React.FC<KabulKriterleriModalProps> = ({
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
  } = useKabulKriterleri();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // DOCX dosyası işleme
  useEffect(() => {
    if (isOpen && selectedFile && !isProcessed && !isLoading) {
      console.log('📄 KabulKriterleriModal: DOCX dosyası işleniyor:', selectedFile.name);
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
      
      if (suggestions.kabulKriterleri) {
        let suggestionContent = suggestions.kabulKriterleri;
        
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {}
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Kabul Kriterleri)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Kabul Kriterleri verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Kabul Kriterleri verilerini JSON formatında hazırla
      const kabulKriterleriData = {
        title: 'Kabul Kriterleri',
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
      
      console.log('💾 Kabul Kriterleri kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: tableRows?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        kabul_kriterleri: JSON.stringify(kabulKriterleriData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Kabul Kriterleri başarıyla kaydedildi:', result);
        markModalAsSaved('kabul-kriterleri'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Kabul Kriterleri kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Kabul Kriterleri kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('kabul_kriterleri_tablerows', JSON.stringify(tableRows));
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
      localStorage.setItem('kabul_kriterleri_tablerows', JSON.stringify(tableRows));
      onClose();
    }
  };


  if (!isOpen) return null;

  return createPortal(
    <div className="kabul-kriterleri-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="kabul-kriterleri-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="kabul-kriterleri-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('kabul_kriterleri_tablerows', JSON.stringify(tableRows));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="kabul-kriterleri-content">
          {/* Sol Taraf - Tablo */}
          <div className="table-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Kabul Kriterleri Tablosu
              </div>
            </div>
            <div className="table-container">
              <table className="kabul-kriterleri-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Kriter / İş</th>
                    <th>Açıklama</th>
                    <th>Sil</th>
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
                          value={row.kriterIs} 
                          onChange={(e) => updateRow(row.id, 'kriterIs', e.target.value)}
                          placeholder="Kriter / İş giriniz..."
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          value={row.aciklama} 
                          onChange={(e) => updateRow(row.id, 'aciklama', e.target.value)}
                          placeholder="Açıklama giriniz..."
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
        <div className="kabul-kriterleri-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('kabul_kriterleri_tablerows', JSON.stringify(tableRows));
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

export default KabulKriterleriModal;
