/**
 * Veri Kritikliği Modal Bileşeni
 * Veri kritikliği tablosu ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/VeriKritikligiModal.css';
import LLMChat from './LLMChat';
import { useVeriKritikligi } from '../hooks/useVeriKritikligi';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface VeriKritikligiModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

interface VeriKritikligiRow {
  id: string;
  data: {
    sira: string;
    veriAdi: string;
    tabloAdi: string;
    veriAdiAciklamasi: string;
    gizlilik: string;
    butunluk: string;
    erisilebilirlik: string;
    hassasVeriMi: string;
    sirVeriMi: string;
  };
}

const VeriKritikligiModal: React.FC<VeriKritikligiModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const {
    tableRows,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateRowData,
    addRow,
    removeRow
  } = useVeriKritikligi();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // DOCX dosyası seçildiğinde işle (sadece bir kez)
  useEffect(() => {
    console.log('📄 VeriKritikligiModal useEffect:', { isOpen, selectedFile: selectedFile?.name, isProcessed });
    if (isOpen && selectedFile && !isProcessed && !isLoading) {
      console.log('📄 VeriKritikligiModal: DOCX dosyası işleniyor:', selectedFile.name);
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
      
      if (suggestions.veriKritikligi) {
        let suggestionContent = suggestions.veriKritikligi;
        
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {}
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Veri Kritikliği)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Veri Kritikliği verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Veri Kritikliği verilerini JSON formatında hazırla
      const veriKritikligiData = {
        title: 'Veri Kritikliği',
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
      
      console.log('💾 Veri Kritikliği kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: tableRows?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        veri_kritikligi: JSON.stringify(veriKritikligiData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Veri Kritikliği başarıyla kaydedildi:', result);
        markModalAsSaved('veri-kritikligi'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Veri Kritikliği kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Veri Kritikliği kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('veri_kritikligi_tablerows', JSON.stringify(tableRows));
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
      localStorage.setItem('veri_kritikligi_tablerows', JSON.stringify(tableRows));
      onClose();
    }
  };


  if (!isOpen) return null;

  return createPortal(
    <div className="veri-kritikligi-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="veri-kritikligi-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="veri-kritikligi-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('veri_kritikligi_tablerows', JSON.stringify(tableRows));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="veri-kritikligi-content">
          {/* Sol Taraf - Tablo */}
          <div className="table-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Veri Kritikliği Tablosu
              </div>
            </div>
            
            <div className="table-container">
              <table className="veri-kritikligi-table">
                <thead>
                  <tr>
                    <th>Sıra</th>
                    <th>Veri Adı</th>
                    <th>Tablo Adı</th>
                    <th>Veri Adı Açıklaması</th>
                    <th>Gizlilik</th>
                    <th>Bütünlük</th>
                    <th>Erişilebilirlik</th>
                    <th>Hassas veri mi</th>
                    <th>Sır Veri mi?</th>
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
                          placeholder="Sıra"
                          value={row.data.sira}
                          onChange={(e) => updateRowData(row.id, 'sira', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Veri adı"
                          value={row.data.veriAdi}
                          onChange={(e) => updateRowData(row.id, 'veriAdi', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Tablo adı"
                          value={row.data.tabloAdi}
                          onChange={(e) => updateRowData(row.id, 'tabloAdi', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Açıklama"
                          value={row.data.veriAdiAciklamasi}
                          onChange={(e) => updateRowData(row.id, 'veriAdiAciklamasi', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Gizlilik"
                          value={row.data.gizlilik}
                          onChange={(e) => updateRowData(row.id, 'gizlilik', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Bütünlük"
                          value={row.data.butunluk}
                          onChange={(e) => updateRowData(row.id, 'butunluk', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Erişilebilirlik"
                          value={row.data.erisilebilirlik}
                          onChange={(e) => updateRowData(row.id, 'erisilebilirlik', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Evet/Hayır"
                          value={row.data.hassasVeriMi}
                          onChange={(e) => updateRowData(row.id, 'hassasVeriMi', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input" 
                          placeholder="Evet/Hayır"
                          value={row.data.sirVeriMi}
                          onChange={(e) => updateRowData(row.id, 'sirVeriMi', e.target.value)}
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
        <div className="veri-kritikligi-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('veri_kritikligi_tablerows', JSON.stringify(tableRows));
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

export default VeriKritikligiModal;
