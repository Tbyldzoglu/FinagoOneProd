import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LLMChat from './LLMChat';
import { useEkranTasarimlari } from '../hooks/useEkranTasarimlari';
import { useEkranTasarimText } from '../hooks/useEkranTasarimText';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/EkranTasarimlariModal.css';

// Tablo 1: Ekran Adı/Kodu (4 satır, yatay)
interface EkranBilgisiRow {
  label: string;
  value: string;
}

// Tablo 2: Alan Detayları (dikey, çok sütunlu)
interface AlanDetayRow {
  id: number;
  alanAdi: string;
  tip: string;
  uzunluk: string;
  zorunlu: string;
  varsayilan: string;
  degistirilebilir: string;
  isKurallari: string;
}

// Tablo 3: Hesaplama Kuralları (yatay, tek satır başlık + veriler)
interface HesaplamaKuraliRow {
  alanAdi: string;
  hesaplamaKuraliAciklama: string;
}

// Tablo 4: Buton Tasarımları (dikey, çok satır)
interface ButonTasarimRow {
  butonAdi: string;
  aciklama: string;
  aktiflik: string;
  gorunurluk: string;
}

interface FormData {
  ekranBilgileri: EkranBilgisiRow[];
  alanDetaylari: AlanDetayRow[];
  hesaplamaKurallari: HesaplamaKuraliRow[];
  butonTasarimlari: ButonTasarimRow[];
  aciklamaMetni: string;
}

type TableType = 'ekranBilgileri' | 'alanDetaylari' | 'hesaplamaKurallari' | 'butonTasarimlari' | 'aciklamaMetni';

interface EkranTasarimlariModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  selectedFile?: File | null;
}

const EkranTasarimlariModal: React.FC<EkranTasarimlariModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  selectedFile
}) => {
  // Ekran Tasarımları hook'u (tablolar için)
  const {
    formData,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateTableCell,
    addRowToTable,
    removeRowFromTable
  } = useEkranTasarimlari();
  
  // Ekran Tasarım Metni hook'u (metin alanı için)
  const ekranTasarimTextHook = useEkranTasarimText();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  // Dosya seçildiğinde otomatik işle (Faz2 aktarımı yoksa)
  useEffect(() => {
    if (!isOpen) return;
    
    // Faz2 aktarımı varsa DOCX parse etme
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    if (faz2Suggestions) {
      try {
        const suggestions = JSON.parse(faz2Suggestions);
        if (suggestions.ekranTasarimlari) {
          console.log('✅ Faz2 aktarımı mevcut, DOCX parse atlanıyor (Ekran Tasarımları)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal DOCX yükleme
    if (selectedFile && !isProcessed && !isLoading) {
      console.log('📄 DOCX işleniyor (Ekran Tasarımları):', selectedFile.name);
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);
  
  // Dosya seçildiğinde metin alanını işle (Faz2 aktarımı yoksa)
  useEffect(() => {
    if (!isOpen) return;
    
    // Faz2 aktarımı varsa text hook parse etme
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    if (faz2Suggestions) {
      try {
        const suggestions = JSON.parse(faz2Suggestions);
        if (suggestions.ekranTasarimlari) {
          console.log('✅ Faz2 aktarımı mevcut, Text parse atlanıyor (Ekran Tasarımları)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal text işleme
    if (selectedFile && !ekranTasarimTextHook.isProcessed && !ekranTasarimTextHook.isLoading) {
      console.log('📄 Ekran Tasarım Metni: DOCX dosyası işleniyor:', selectedFile.name);
      ekranTasarimTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, ekranTasarimTextHook.isProcessed, ekranTasarimTextHook.isLoading, ekranTasarimTextHook.processFile]);
  
  // Dosya değiştiğinde hook'ları reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Ekran Tasarım hookları reset ediliyor:', selectedFile.name);
      resetForm();
      ekranTasarimTextHook.resetContent();
    }
  }, [selectedFile?.name, resetForm, ekranTasarimTextHook.resetContent]);

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
      
      if (suggestions.ekranTasarimlari) {
        let suggestionContent = suggestions.ekranTasarimlari;
        
        // Eğer string ise ve JSON formatındaysa parse et
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {
            // Parse edilemezse raw string'i kullan
          }
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Ekran Tasarımları)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Ekran Tasarımları verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Ekran Tasarımları verilerini JSON formatında hazırla
      const ekranTasarimlariData = {
        title: 'Ekran Tasarımları',
        tableData: formData,
        textContent: ekranTasarimTextHook.content,
        validation: {
          found: validation?.found || false,
          mode: validation?.mode || 'strict',
          errors: validation?.errors || [],
          warnings: validation?.warnings || [],
          matchedLabels: validation?.matchedLabels || []
        },
        textValidation: {
          found: ekranTasarimTextHook.validation?.found || false,
          mode: ekranTasarimTextHook.validation?.mode || 'strict',
          errors: ekranTasarimTextHook.validation?.errors || [],
          warnings: ekranTasarimTextHook.validation?.warnings || [],
          matchedLabels: ekranTasarimTextHook.validation?.matchedLabels || []
        },
        isProcessed: isProcessed,
        isLoading: isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Ekran Tasarımları kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: formData.alanDetaylari?.length || 0,
        textLength: ekranTasarimTextHook.content?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        ekran_tasarimlari: JSON.stringify(ekranTasarimlariData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Ekran Tasarımları başarıyla kaydedildi:', result);
        markModalAsSaved('ekran-tasarimlari'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Ekran Tasarımları kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Ekran Tasarımları kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('ekran_tasarimlari_formdata', JSON.stringify(formData));
        localStorage.setItem('ekran_tasarimlari_textcontent', ekranTasarimTextHook.content || '');
        onClose();
      }
    };

    if (isOpen) {
      // HTML ve body'yi modal için ayarla
      const html = document.documentElement;
      const body = document.body;
      
      html.style.overflow = 'hidden';
      html.style.overflowX = 'visible';
      html.style.overflowY = 'hidden';
      body.style.overflow = 'hidden';
      body.style.overflowX = 'visible';
      body.style.overflowY = 'hidden';
      body.style.width = '100vw';
      body.style.height = '100vh';
      body.style.margin = '0';
      body.style.padding = '0';
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      
      if (isOpen) {
        // HTML ve body'yi orijinal haline döndür
        const html = document.documentElement;
        const body = document.body;
        
        html.style.overflow = '';
        html.style.overflowX = '';
        html.style.overflowY = '';
        body.style.overflow = '';
        body.style.overflowX = '';
        body.style.overflowY = '';
        body.style.width = '';
        body.style.height = '';
        body.style.margin = '';
        body.style.padding = '';
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="ekran-tasarimlari-overlay">
      <div className="ekran-tasarimlari-container ekran-tasarimlari-modal">
        {/* Modal Header */}
        <div className="ekran-tasarimlari-header">
          <h3 className="modal-title">{sectionTitle}</h3>
          <button className="modal-close-button" onClick={() => {
            // Modal kapanırken localStorage'a kaydet
            localStorage.setItem('ekran_tasarimlari_formdata', JSON.stringify(formData));
            localStorage.setItem('ekran_tasarimlari_textcontent', ekranTasarimTextHook.content || '');
            onClose();
          }}>
            &times;
          </button>
        </div>

        {/* Validation Banner - Tablolar */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="validation-banner">
            {validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Tablo Parse Hataları:</strong>
                <ul>
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Tablo Parse Uyarıları:</strong>
                <ul>
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Validation Banner - Metin */}
        {ekranTasarimTextHook.validation && (ekranTasarimTextHook.validation.errors.length > 0 || ekranTasarimTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {ekranTasarimTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {ekranTasarimTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {ekranTasarimTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {ekranTasarimTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="ekran-tasarimlari-content">
          {/* Sol Taraf - Tables Panel */}
          <div className="tables-panel">
            <div className="tables-container">
              {/* 1. Ekran Bilgileri Tablosu - Yatay Format (4 satır) */}
              <div className="table-section">
                <div className="table-header">
                  <h3>📱 Ekran Bilgileri</h3>
                </div>
                <div className="table-wrapper">
                  <table className="horizontal-table">
                    <tbody>
                      {formData.ekranBilgileri.map((row, index) => (
                        <tr key={index}>
                          <td className="label-cell">{row.label}</td>
                          <td className="value-cell">
                            <input
                              type="text"
                              value={row.value}
                              onChange={(e) => updateTableCell('ekranBilgileri', index, 'value', e.target.value)}
                              className="table-input wide-input"
                              placeholder={`${row.label} bilgisini girin...`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Alan Detayları Tablosu - Dikey Format */}
              <div className="table-section">
                <div className="table-header">
                  <h3>📝 Alan Detayları</h3>
                  <button 
                    className="add-row-btn"
                    onClick={() => addRowToTable('alanDetaylari')}
                  >
                    + Satır Ekle
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="vertical-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Alan Adı</th>
                        <th>Tipi (Text, Dropdown, Date, Checkbox vb.)</th>
                        <th>Uzunluk / Format</th>
                        <th>Zorunlu / Opsiyonel</th>
                        <th>Varsayılan Değer</th>
                        <th>Değiştirilebilir Değer / Değiştirilemez Değer</th>
                        <th>İş Kuralları / Açıklama</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.alanDetaylari.map((row, index) => (
                        <tr key={index}>
                          <td>{row.id}</td>
                          <td>
                            <input
                              type="text"
                              value={row.alanAdi}
                              onChange={(e) => updateTableCell('alanDetaylari', index, 'alanAdi', e.target.value)}
                              className="table-input"
                              placeholder="Alan Adı"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.tip}
                              onChange={(e) => updateTableCell('alanDetaylari', index, 'tip', e.target.value)}
                              className="table-input"
                              placeholder="Tipi"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.uzunluk}
                              onChange={(e) => updateTableCell('alanDetaylari', index, 'uzunluk', e.target.value)}
                              className="table-input"
                              placeholder="Uzunluk"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.zorunlu}
                              onChange={(e) => updateTableCell('alanDetaylari', index, 'zorunlu', e.target.value)}
                              className="table-input"
                              placeholder="Zorunlu"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.varsayilan}
                              onChange={(e) => updateTableCell('alanDetaylari', index, 'varsayilan', e.target.value)}
                              className="table-input"
                              placeholder="Varsayılan"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.degistirilebilir}
                              onChange={(e) => updateTableCell('alanDetaylari', index, 'degistirilebilir', e.target.value)}
                              className="table-input"
                              placeholder="Değiştirilebilir"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.isKurallari}
                              onChange={(e) => updateTableCell('alanDetaylari', index, 'isKurallari', e.target.value)}
                              className="table-input"
                              placeholder="İş Kuralları"
                            />
                          </td>
                          <td>
                            <button
                              className="delete-row-btn"
                              onClick={() => removeRowFromTable('alanDetaylari', index)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Hesaplama Kuralları Tablosu - Yatay Format */}
              <div className="table-section">
                <div className="table-header">
                  <h3>🧮 Hesaplama Kuralları</h3>
                </div>
                <div className="table-wrapper">
                  <table className="calculation-table">
                    <thead>
                      <tr>
                        <th className="calc-label-header">Alan Adı</th>
                        <th className="calc-value-header">Hesaplama Kuralı / Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.hesaplamaKurallari.map((row, index) => (
                        <tr key={index}>
                          <td className="calc-label-cell">{row.alanAdi}</td>
                          <td className="calc-value-cell">
                            <input
                              type="text"
                              value={row.hesaplamaKuraliAciklama}
                              onChange={(e) => updateTableCell('hesaplamaKurallari', index, 'hesaplamaKuraliAciklama', e.target.value)}
                              className="table-input wide-input"
                              placeholder="Hesaplama kuralını girin..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Buton Tasarımları Tablosu - Dikey Format */}
              <div className="table-section">
                <div className="table-header">
                  <h3>🔘 Buton Tasarımları</h3>
                  <button 
                    className="add-row-btn"
                    onClick={() => addRowToTable('butonTasarimlari')}
                  >
                    + Satır Ekle
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="button-table">
                    <thead>
                      <tr>
                        <th>Buton Adı</th>
                        <th>Açıklama</th>
                        <th>Aktiflik</th>
                        <th>Görünürlük</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.butonTasarimlari.map((row, index) => (
                        <tr key={index}>
                          <td className="button-name-cell">{row.butonAdi}</td>
                          <td>
                            <input
                              type="text"
                              value={row.aciklama}
                              onChange={(e) => updateTableCell('butonTasarimlari', index, 'aciklama', e.target.value)}
                              className="table-input"
                              placeholder="Açıklama"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.aktiflik}
                              onChange={(e) => updateTableCell('butonTasarimlari', index, 'aktiflik', e.target.value)}
                              className="table-input"
                              placeholder="Aktiflik"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.gorunurluk}
                              onChange={(e) => updateTableCell('butonTasarimlari', index, 'gorunurluk', e.target.value)}
                              className="table-input"
                              placeholder="Görünürlük"
                            />
                          </td>
                          <td>
                            <button
                              className="delete-row-btn"
                              onClick={() => removeRowFromTable('butonTasarimlari', index)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Açıklama Metni */}
              <div className="text-section">
                <div className="text-header">
                  <h3>📝 Açıklama Metni</h3>
                </div>
                <textarea
                  value={ekranTasarimTextHook.content || formData.aciklamaMetni}
                  onChange={(e) => {
                    // Hem hook'ta hem de formData'da güncelle
                    ekranTasarimTextHook.updateContent(e.target.value);
                    updateTableCell('aciklamaMetni', 0, 'aciklamaMetni', e.target.value);
                  }}
                  className="description-textarea"
                  placeholder="Ekran tasarımları ile ilgili açıklama metnini buraya yazın..."
                  rows={6}
                />
              </div>
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} faz2Suggestion={faz2Suggestion} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="ekran-tasarimlari-footer">
          <div className="footer-info">
            <span className="last-saved">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="modal-btn secondary" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('ekran_tasarimlari_formdata', JSON.stringify(formData));
              localStorage.setItem('ekran_tasarimlari_textcontent', ekranTasarimTextHook.content || '');
              onClose();
            }}>
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              İptal
            </button>
            <button 
              className="modal-btn primary"
              onClick={handleSave}
              disabled={isSaving || !selectedFile}
            >
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal kullanarak modal'ı body'e direkt render et
  return createPortal(modalContent, document.body);
};

export default EkranTasarimlariModal;