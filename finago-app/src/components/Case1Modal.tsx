/**
 * Case1 Modal Bileşeni
 * Text area ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/Case1Modal.css';
import LLMChat from './LLMChat';
import { useXIslemiMuhasebe } from '../hooks/useXIslemiMuhasebe';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface Case1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

const Case1Modal: React.FC<Case1ModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    tableRows,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateRowData,
    addRow,
    removeRow
  } = useXIslemiMuhasebe();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  // DOCX dosyası seçildiğinde işle (sadece bir kez)
  useEffect(() => {
    console.log('📄 Case1Modal useEffect:', { isOpen, selectedFile: selectedFile?.name, isProcessed });
    if (isOpen && selectedFile && !isProcessed && !isLoading) {
      console.log('📄 Case1Modal: DOCX dosyası işleniyor:', selectedFile.name);
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
      
      if (suggestions.case1) {
        let suggestionContent = suggestions.case1;
        
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {}
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Case1)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Case1 verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Case1 verilerini JSON formatında hazırla
      const case1Data = {
        title: 'Case1',
        tableData: {
          tableRows: tableRows
        },
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
      
      console.log('💾 Case1 kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: tableRows?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        case1: JSON.stringify(case1Data, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Case1 başarıyla kaydedildi:', result);
        markModalAsSaved('x-islemi-muhasebe'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Case1 kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Case1 kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('case1_tablerows', JSON.stringify(tableRows));
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
      localStorage.setItem('case1_tablerows', JSON.stringify(tableRows));
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="case1-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="case1-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="case1-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('case1_tablerows', JSON.stringify(tableRows));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="case1-content">
          {/* Sol Taraf - Table */}
          <div className="table-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Case1 Tablosu
              </div>
            </div>
            <div className="table-container">
              <table className="case1-table">
                <thead>
                  <tr>
                    <th>Şube Kodu</th>
                    <th>Müşteri Numarası</th>
                    <th>Defter</th>
                    <th>Borç/Alacak</th>
                    <th>Tutar</th>
                    <th>Döviz Cinsi</th>
                    <th>Açıklama</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Şube kodu"
                          value={row.data.subeKodu}
                          onChange={(e) => updateRowData(row.id, 'subeKodu', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Müşteri no"
                          value={row.data.musteriNo}
                          onChange={(e) => updateRowData(row.id, 'musteriNo', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Defter"
                          value={row.data.defter}
                          onChange={(e) => updateRowData(row.id, 'defter', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Borç/Alacak"
                          value={row.data.borcAlacak}
                          onChange={(e) => updateRowData(row.id, 'borcAlacak', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="0.00"
                          value={row.data.tutar}
                          onChange={(e) => updateRowData(row.id, 'tutar', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="TRY"
                          value={row.data.dovizCinsi}
                          onChange={(e) => updateRowData(row.id, 'dovizCinsi', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Açıklama"
                          value={row.data.aciklama}
                          onChange={(e) => updateRowData(row.id, 'aciklama', e.target.value)}
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
              
              {/* Satır Ekleme Butonu */}
              <div className="add-row-container">
                <button className="add-row-btn" onClick={addRow}>
                  + Yeni Satır Ekle
                </button>
              </div>
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
        <div className="case1-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('case1_tablerows', JSON.stringify(tableRows));
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

export default Case1Modal;
