import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDocumentHistory } from '../hooks/useDocumentHistory';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/DocumentHistoryModal.css';

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  selectedFile?: File | null;
}


const DocumentHistoryModal: React.FC<DocumentHistoryModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  selectedFile
}) => {
  // Doküman Tarihçesi hook'u
  const {
    rows: tableRows,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetRows,
    updateRowData,
    addRow,
    removeRow
  } = useDocumentHistory();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);

  // Kaydet fonksiyonu - Doküman Tarihçesi verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Doküman Tarihçesi verilerini JSON formatında hazırla
      const documentHistoryData = {
        title: 'Doküman Tarihçesi',
        rows: tableRows,
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
      
      console.log('💾 Doküman Tarihçesi kaydediliyor:', { 
        selectedFile: selectedFile.name,
        rowsCount: tableRows?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        dokuman_tarihcesi: JSON.stringify(documentHistoryData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Doküman Tarihçesi başarıyla kaydedildi:', result);
        markModalAsSaved('document-history'); // Modal kaydedildi olarak işaretle
        // TODO: Success message göster
      } else {
        console.error('❌ Doküman Tarihçesi kaydetme hatası:', result.error);
        // TODO: Error message göster
      }
      
    } catch (error) {
      console.error('❌ Doküman Tarihçesi kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const modalRef = useRef<HTMLDivElement>(null);

  // Dosya seçildiğinde otomatik işle
  useEffect(() => {
    if (isOpen && selectedFile && !isProcessed && !isLoading) {
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('document_history_rows', JSON.stringify(tableRows));
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
      localStorage.setItem('document_history_rows', JSON.stringify(tableRows));
      onClose();
    }
  };



  if (!isOpen) return null;

  return createPortal(
    <div className="document-history-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="document-history-container"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="document-history-header">
          <h2 className="modal-title">Doküman Tarihçesi</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('document_history_rows', JSON.stringify(tableRows));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="document-history-content">
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Versiyon</th>
                  <th>Değişikliği Yapan</th>
                  <th>Açıklama</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input 
                        type="date" 
                        className="table-input"
                        value={row.data.tarih}
                        onChange={(e) => updateRowData(row.id, 'tarih', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="table-input"
                        value={row.data.versiyon}
                        onChange={(e) => updateRowData(row.id, 'versiyon', e.target.value)}
                        placeholder="Versiyon"
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="table-input"
                        value={row.data.degisiklikYapan}
                        onChange={(e) => updateRowData(row.id, 'degisiklikYapan', e.target.value)}
                        placeholder="Ad Soyad"
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="table-input table-input-wide"
                        value={row.data.aciklama}
                        onChange={(e) => updateRowData(row.id, 'aciklama', e.target.value)}
                        placeholder="Açıklama"
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

        {/* Modal Footer */}
        <div className="document-history-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('document_history_rows', JSON.stringify(tableRows));
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

export default DocumentHistoryModal;
