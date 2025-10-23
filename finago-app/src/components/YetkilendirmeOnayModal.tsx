/**
 * Yetkilendirme ve Onay Mekanizmaları Modal Bileşeni
 * İki tablo (Yetkilendirme ve Onay Süreci) ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/YetkilendirmeOnayModal.css';
import LLMChat from './LLMChat';
import { useYetkilendirme } from '../hooks/useYetkilendirme';
import { useOnaySureci } from '../hooks/useOnaySureci';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface YetkilendirmeOnayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

interface YetkilendirmeRow {
  id: string;
  data: {
    rolKullanici: string;
    ekranIslem: string;
    goruntuleme: string;
    ekleme: string;
    guncelleme: string;
    silme: string;
    onaylama: string;
  };
}

interface OnaySuresiRow {
  id: string;
  data: {
    islemTipi: string;
    onaySeviyesi: string;
    onaySuresi: string;
    aciklama: string;
  };
}

const YetkilendirmeOnayModal: React.FC<YetkilendirmeOnayModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const {
    yetkilendirmeRows,
    isLoading: yetkilendirmeLoading,
    isProcessed: yetkilendirmeProcessed,
    validation: yetkilendirmeValidation,
    processFile: processYetkilendirmeFile,
    updateYetkilendirmeRow,
    addYetkilendirmeRow,
    removeYetkilendirmeRow
  } = useYetkilendirme();

  const {
    onaySureciRows,
    isLoading: onaySureciLoading,
    isProcessed: onaySureciProcessed,
    validation: onaySureciValidation,
    processFile: processOnaySureciFile,
    updateOnaySureciRow,
    addOnaySureciRow,
    removeOnaySureciRow
  } = useOnaySureci();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // DOCX dosyası seçildiğinde işle (sadece bir kez) - Yetkilendirme tablosu için
  useEffect(() => {
    console.log('📄 YetkilendirmeOnayModal useEffect (Yetkilendirme):', { 
      isOpen, 
      selectedFile: selectedFile?.name, 
      isProcessed: yetkilendirmeProcessed,
      isLoading: yetkilendirmeLoading 
    });
    if (isOpen && selectedFile && !yetkilendirmeProcessed && !yetkilendirmeLoading) {
      console.log('📄 YetkilendirmeOnayModal: Yetkilendirme DOCX dosyası işleniyor:', selectedFile.name);
      processYetkilendirmeFile(selectedFile);
    }
  }, [isOpen, selectedFile, yetkilendirmeProcessed, yetkilendirmeLoading, processYetkilendirmeFile]);

  // DOCX dosyası seçildiğinde işle (sadece bir kez) - Onay Süreci tablosu için
  useEffect(() => {
    console.log('📄 YetkilendirmeOnayModal useEffect (Onay Süreci):', { 
      isOpen, 
      selectedFile: selectedFile?.name, 
      isProcessed: onaySureciProcessed,
      isLoading: onaySureciLoading 
    });
    if (isOpen && selectedFile && !onaySureciProcessed && !onaySureciLoading) {
      console.log('📄 YetkilendirmeOnayModal: Onay Süreci DOCX dosyası işleniyor:', selectedFile.name);
      processOnaySureciFile(selectedFile);
    }
  }, [isOpen, selectedFile, onaySureciProcessed, onaySureciLoading, processOnaySureciFile]);

  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const storedSuggestions = localStorage.getItem('faz2_suggestions');
      
      if (!storedSuggestions) {
        setFaz2Suggestion('');
        return;
      }
      
      const suggestions = JSON.parse(storedSuggestions);
      
      if (suggestions.yetkilendirmeOnay) {
        let suggestionContent = suggestions.yetkilendirmeOnay;
        
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {}
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Yetkilendirme ve Onay)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Yetkilendirme ve Onay Süreci verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Yetkilendirme ve Onay Süreci verilerini JSON formatında hazırla
      const yetkilendirmeOnayData = {
        title: 'Yetkilendirme ve Onay Mekanizmaları',
        modals: {
          yetkilendirme: {
            title: 'Yetkilendirme',
            tableData: {
              tableRows: yetkilendirmeRows
            },
            validation: {
              found: yetkilendirmeValidation?.found || false,
              mode: yetkilendirmeValidation?.mode || 'strict',
              errors: yetkilendirmeValidation?.errors || [],
              warnings: yetkilendirmeValidation?.warnings || [],
              matchedLabels: yetkilendirmeValidation?.matchedLabels || []
            },
            isProcessed: yetkilendirmeProcessed,
            isLoading: yetkilendirmeLoading
          },
          onaySureci: {
            title: 'Onay Süreci',
            tableData: {
              tableRows: onaySureciRows
            },
            validation: {
              found: onaySureciValidation?.found || false,
              mode: onaySureciValidation?.mode || 'strict',
              errors: onaySureciValidation?.errors || [],
              warnings: onaySureciValidation?.warnings || [],
              matchedLabels: onaySureciValidation?.matchedLabels || []
            },
            isProcessed: onaySureciProcessed,
            isLoading: onaySureciLoading
          }
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Yetkilendirme ve Onay Mekanizmaları kaydediliyor:', { 
        selectedFile: selectedFile.name,
        yetkilendirmeRowCount: yetkilendirmeRows?.length || 0,
        onaySureciRowCount: onaySureciRows?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        yetkilendirme_onay: JSON.stringify(yetkilendirmeOnayData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Yetkilendirme ve Onay Mekanizmaları başarıyla kaydedildi:', result);
        markModalAsSaved('yetkilendirme-onay'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Yetkilendirme ve Onay Mekanizmaları kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Yetkilendirme ve Onay Mekanizmaları kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('yetkilendirme_rows', JSON.stringify(yetkilendirmeRows));
        localStorage.setItem('onay_sureci_rows', JSON.stringify(onaySureciRows));
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
      localStorage.setItem('yetkilendirme_rows', JSON.stringify(yetkilendirmeRows));
      localStorage.setItem('onay_sureci_rows', JSON.stringify(onaySureciRows));
      onClose();
    }
  };


  // Compatibility functions for existing code (mapping to hook functions)
  const addOnaySuresiRow = addOnaySureciRow;
  const removeOnaySuresiRow = removeOnaySureciRow;
  const updateOnaySuresiRow = (id: string, field: string, value: string) => {
    updateOnaySureciRow(id, field, value);
  };
  
  // Use hook data with compatibility mapping
  const onaySuresiRows = onaySureciRows;

  if (!isOpen) return null;

  return createPortal(
    <div className="yetkilendirme-onay-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="yetkilendirme-onay-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="yetkilendirme-onay-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('yetkilendirme_rows', JSON.stringify(yetkilendirmeRows));
                localStorage.setItem('onay_sureci_rows', JSON.stringify(onaySureciRows));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="yetkilendirme-onay-content">
          {/* Sol Taraf - Tablolar */}
          <div className="tables-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Yetkilendirme ve Onay Tabloları
              </div>
            </div>
            
            <div className="tables-container">
              {/* Yetkilendirme Tablosu */}
              <div className="table-section">
                <h3 className="table-title">Yetkilendirme</h3>
                <div className="table-wrapper">
                  <table className="yetkilendirme-table">
                    <thead>
                      <tr>
                        <th>Rol / Kullanıcı</th>
                        <th>Ekran / İşlem</th>
                        <th>Görüntüleme</th>
                        <th>Ekleme</th>
                        <th>Güncelleme</th>
                        <th>Silme</th>
                        <th>Onaylama</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yetkilendirmeRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Rol/Kullanıcı"
                              value={row.data.rolKullanici}
                              onChange={(e) => updateYetkilendirmeRow(row.id, 'rolKullanici', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Ekran/İşlem"
                              value={row.data.ekranIslem}
                              onChange={(e) => updateYetkilendirmeRow(row.id, 'ekranIslem', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Görüntüleme"
                              value={row.data.goruntuleme}
                              onChange={(e) => updateYetkilendirmeRow(row.id, 'goruntuleme', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Ekleme"
                              value={row.data.ekleme}
                              onChange={(e) => updateYetkilendirmeRow(row.id, 'ekleme', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Güncelleme"
                              value={row.data.guncelleme}
                              onChange={(e) => updateYetkilendirmeRow(row.id, 'guncelleme', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Silme"
                              value={row.data.silme}
                              onChange={(e) => updateYetkilendirmeRow(row.id, 'silme', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Onaylama"
                              value={row.data.onaylama}
                              onChange={(e) => updateYetkilendirmeRow(row.id, 'onaylama', e.target.value)}
                            />
                          </td>
                          <td>
                            <div className="row-actions">
                              {yetkilendirmeRows.length > 1 && (
                                <button 
                                  className="remove-row-btn"
                                  onClick={() => removeYetkilendirmeRow(row.id)}
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
                    <button className="add-row-btn" onClick={addYetkilendirmeRow}>
                      + Yetkilendirme Satırı Ekle
                    </button>
                  </div>
                </div>
              </div>

              {/* Onay Süreci Tablosu */}
              <div className="table-section">
                <h3 className="table-title">Onay Süreci</h3>
                <div className="table-wrapper">
                  <table className="onay-suresi-table">
                    <thead>
                      <tr>
                        <th>İşlem Tipi</th>
                        <th>Onay Seviyesi</th>
                        <th>Onay Süreci</th>
                        <th>Açıklama</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onaySuresiRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="İşlem Tipi"
                              value={row.data.islemTipi}
                              onChange={(e) => updateOnaySuresiRow(row.id, 'islemTipi', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Onay Seviyesi"
                              value={row.data.onaySeviyesi}
                              onChange={(e) => updateOnaySuresiRow(row.id, 'onaySeviyesi', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Onay Süreci"
                              value={row.data.onaySureci}
                              onChange={(e) => updateOnaySuresiRow(row.id, 'onaySureci', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="table-input" 
                              placeholder="Açıklama"
                              value={row.data.aciklama}
                              onChange={(e) => updateOnaySuresiRow(row.id, 'aciklama', e.target.value)}
                            />
                          </td>
                          <td>
                            <div className="row-actions">
                              {onaySuresiRows.length > 1 && (
                                <button 
                                  className="remove-row-btn"
                                  onClick={() => removeOnaySuresiRow(row.id)}
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
                    <button className="add-row-btn" onClick={addOnaySuresiRow}>
                      + Onay Süreci Satırı Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} faz2Suggestion={faz2Suggestion} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="yetkilendirme-onay-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('yetkilendirme_rows', JSON.stringify(yetkilendirmeRows));
              localStorage.setItem('onay_sureci_rows', JSON.stringify(onaySureciRows));
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

export default YetkilendirmeOnayModal;
