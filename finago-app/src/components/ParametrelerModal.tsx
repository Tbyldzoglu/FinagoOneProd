import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import LLMChat from './LLMChat';
import { useParametreler } from '../hooks/useParametreler';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/ParametrelerModal.css';

interface ParametrelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  selectedFile?: File | null;
}

interface ParametreItem {
  id: string;
  data: {
    parametreAdi: string;
    aciklama: string;
    kapsamKullanimAlani: string;
    varsayilanDeger: string;
    degerAraligi: string;
    parametreYetkisi: string;
  };
}

const ParametrelerModal: React.FC<ParametrelerModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  selectedFile
}) => {
  const {
    parametreler,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateTableCell,
    addParametre,
    removeParametre
  } = useParametreler();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('parametreler_data', JSON.stringify(parametreler));
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

  // Kaydet fonksiyonu - Parametreler verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Parametreler verilerini JSON formatında hazırla
      const parametrelerData = {
        title: 'Parametreler ve Tanımlar',
        tableData: parametreler,
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
      
      console.log('💾 Parametreler kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: parametreler?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        parametreler: JSON.stringify(parametrelerData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Parametreler başarıyla kaydedildi:', result);
        markModalAsSaved('parametreler'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Parametreler kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Parametreler kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Modal dışına tıklama ile kapatma
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Modal kapanırken localStorage'a kaydet
      localStorage.setItem('parametreler_data', JSON.stringify(parametreler));
      onClose();
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
        if (suggestions.parametreler) {
          console.log('✅ Faz2 aktarımı mevcut, DOCX parse atlanıyor (Parametreler)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal DOCX yükleme
    if (selectedFile && !isProcessed && !isLoading) {
      console.log('📄 DOCX işleniyor (Parametreler):', selectedFile.name);
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
      
      if (suggestions.parametreler) {
        let suggestionContent = suggestions.parametreler;
        
        // Eğer string ise ve JSON formatındaysa parse et
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {
            // Parse edilemezse raw string'i kullan
          }
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Parametreler)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Yeni satır ekleme (hook'tan gelen fonksiyon ile uyumlu)
  const addRowToTable = () => {
    addParametre();
  };

  // Satır silme (hook'tan gelen fonksiyon ile uyumlu)
  const removeRowFromTable = (itemId: string) => {
    if (parametreler.length > 1) {
      removeParametre(itemId);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="parametreler-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="parametreler-modal-container"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="parametreler-modal-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('parametreler_data', JSON.stringify(parametreler));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="parametreler-content">
          {/* Sol Taraf - Tablo */}
          <div className="table-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Parametreler/Tanımlar Tablosu
              </div>
              <button 
                className="add-row-btn"
                onClick={addRowToTable}
              >
                + Yeni Satır Ekle
              </button>
            </div>
            <div className="table-container">
              <table className="parametreler-table">
                <tbody>
                  {parametreler.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr>
                        <td className="label-cell">Parametre Adı</td>
                        <td className="input-cell">
                          <input
                            type="text"
                            className="table-input"
                            value={item.data.parametreAdi}
                            onChange={(e) => updateTableCell(item.id, 'parametreAdi', e.target.value)}
                            placeholder="Parametre adını girin"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="label-cell">Açıklama</td>
                        <td className="input-cell">
                          <input
                            type="text"
                            className="table-input"
                            value={item.data.aciklama}
                            onChange={(e) => updateTableCell(item.id, 'aciklama', e.target.value)}
                            placeholder="Açıklama girin"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="label-cell">Kapsam / Kullanım Alanı:</td>
                        <td className="input-cell">
                          <input
                            type="text"
                            className="table-input"
                            value={item.data.kapsamKullanimAlani}
                            onChange={(e) => updateTableCell(item.id, 'kapsamKullanimAlani', e.target.value)}
                            placeholder="Kapsam/kullanım alanı"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="label-cell">Varsayılan Değer:</td>
                        <td className="input-cell">
                          <input
                            type="text"
                            className="table-input"
                            value={item.data.varsayilanDeger}
                            onChange={(e) => updateTableCell(item.id, 'varsayilanDeger', e.target.value)}
                            placeholder="Varsayılan değer"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="label-cell">Değer Aralığı:</td>
                        <td className="input-cell">
                          <input
                            type="text"
                            className="table-input"
                            value={item.data.degerAraligi}
                            onChange={(e) => updateTableCell(item.id, 'degerAraligi', e.target.value)}
                            placeholder="Değer aralığı"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="label-cell">Parametre Yetkisi</td>
                        <td className="input-cell">
                          <input
                            type="text"
                            className="table-input"
                            value={item.data.parametreYetkisi}
                            onChange={(e) => updateTableCell(item.id, 'parametreYetkisi', e.target.value)}
                            placeholder="Parametre yetkisi"
                          />
                        </td>
                      </tr>
                      <tr className="actions-row">
                        <td colSpan={2} className="actions-cell">
                          <div className="row-actions">
                            {parametreler.length > 1 && (
                              <button
                                className="remove-row-btn"
                                onClick={() => removeRowFromTable(item.id)}
                                title="Satırı Sil"
                              >
                                × Satırı Sil
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} faz2Suggestion={faz2Suggestion} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="parametreler-modal-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('parametreler_data', JSON.stringify(parametreler));
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

export default ParametrelerModal;