import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import LLMChat from './LLMChat';
import { useMesajlar } from '../hooks/useMesajlar';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/MesajlarModal.css';

interface MesajlarModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  selectedFile?: File | null;
}

interface MesajItem {
  mesajTipi: string;
  case: string;
  mesajDili: string;
  mesajMetin: string;
}

const MesajlarModal: React.FC<MesajlarModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  selectedFile
}) => {
  const {
    mesajlar,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateTableCell,
    addRowToTable,
    removeRowFromTable
  } = useMesajlar();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  const handleClose = useCallback(() => {
    // Modal kapanırken localStorage'a kaydet
    localStorage.setItem('mesajlar_data', JSON.stringify(mesajlar));
    // Reset body styles when modal closes
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.position = '';
    onClose();
  }, [onClose, mesajlar]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  React.useEffect(() => {
    if (isOpen) {
      // Force fullscreen modal
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Kaydet fonksiyonu - Mesajlar verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Mesajlar verilerini JSON formatında hazırla
      const mesajlarData = {
        title: 'Mesajlar, Uyarılar ve Bilgilendirmeler',
        tableData: mesajlar,
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
      
      console.log('💾 Mesajlar kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: mesajlar?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        mesajlar: JSON.stringify(mesajlarData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Mesajlar başarıyla kaydedildi:', result);
        markModalAsSaved('mesajlar'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Mesajlar kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Mesajlar kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // DOCX dosyası seçildiğinde işle (Faz2 aktarımı yoksa)
  useEffect(() => {
    if (!isOpen) return;
    
    // Faz2 aktarımı varsa DOCX parse etme
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    if (faz2Suggestions) {
      try {
        const suggestions = JSON.parse(faz2Suggestions);
        if (suggestions.mesajlar) {
          console.log('✅ Faz2 aktarımı mevcut, DOCX parse atlanıyor (Mesajlar)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal DOCX yükleme
    if (selectedFile && !isProcessed && !isLoading) {
      console.log('📄 DOCX işleniyor (Mesajlar):', selectedFile.name);
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);

  // Modal açıldığında Faz2 önerisini localStorage'dan oku
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const storedSuggestions = localStorage.getItem('faz2_suggestions');
      
      if (!storedSuggestions) {
        setFaz2Suggestion('');
        return;
      }
      
      const suggestions = JSON.parse(storedSuggestions);
      
      if (suggestions.mesajlar) {
        let suggestionContent = suggestions.mesajlar;
        
        // Eğer string ise ve JSON formatındaysa parse et
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {
            // Parse edilemezse raw string'i kullan
          }
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Mesajlar)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="mesajlar-modal-overlay">
      <div className="mesajlar-modal-container">
        {/* Modal Header */}
        <div className="mesajlar-modal-header">
          <h2>{sectionTitle}</h2>
          <button 
            className="mesajlar-close-button"
            onClick={handleClose}
            aria-label="Modalı Kapat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="mesajlar-content">
          {/* Left Panel - Table */}
          <div className="table-panel">
            <div className="table-container">
              <div className="table-header">
                <h3>Mesajlar / Uyarılar / Bilgilendirmeler Tablosu</h3>
                <button 
                  className="add-row-btn"
                  onClick={addRowToTable}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Satır Ekle
                </button>
              </div>

              <div className="table-wrapper">
                <table className="mesajlar-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mesaj Tipi</th>
                      <th>Case</th>
                      <th>Mesaj Dili</th>
                      <th>Mesaj Metin</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesajlar.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="table-input"
                            value={item.mesajTipi}
                            onChange={(e) => updateTableCell(index, 'mesajTipi', e.target.value)}
                            placeholder="Mesaj tipi girin"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-input"
                            value={item.case}
                            onChange={(e) => updateTableCell(index, 'case', e.target.value)}
                            placeholder="Case girin"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-input"
                            value={item.mesajDili}
                            onChange={(e) => updateTableCell(index, 'mesajDili', e.target.value)}
                            placeholder="Mesaj dili girin"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-input wide-input"
                            value={item.mesajMetin}
                            onChange={(e) => updateTableCell(index, 'mesajMetin', e.target.value)}
                            placeholder="Mesaj metni girin"
                          />
                        </td>
                        <td>
                          <button
                            className="delete-row-btn"
                            onClick={() => removeRowFromTable(index)}
                            disabled={mesajlar.length === 1}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} faz2Suggestion={faz2Suggestion} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mesajlar-modal-footer">
          <button className="modal-btn secondary" onClick={handleClose}>
            İptal
          </button>
          <button 
            className="modal-btn primary"
            onClick={handleSave}
            disabled={isSaving || !selectedFile}
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MesajlarModal;
