import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LLMChat from './LLMChat';
import { useTasklarBatchlar } from '../hooks/useTasklarBatchlar';
import { useTasklarBatchlarText } from '../hooks/useTasklarBatchlarText';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/TasklarBatchlarModal.css';

// Tablo formu için interface
interface TaskBatchRow {
  id: number;
  yeniMevcut: string;
  taskJobAdi: string;
  tanim: string;
  sorumluSistem: string;
  calismaSaati: string;
  calismaSikligi: string;
  bagimliliklar: string;
  alertMekanizmasi: string;
  alternatifCalistirmaYontemi: string;
}

interface FormData {
  taskBatchTable: TaskBatchRow[];
  aciklamaMetni: string;
}

interface TasklarBatchlarModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  selectedFile?: File | null;
}

const TasklarBatchlarModal: React.FC<TasklarBatchlarModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  selectedFile
}) => {
  // Tasklar/Batchlar hook'u (tablolar için)
  const {
    formData,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateTableCell,
    updateAciklamaMetni,
    addRowToTable,
    removeRowFromTable
  } = useTasklarBatchlar();
  
  // Tasklar/Batchlar Metni hook'u (metin alanı için)
  const tasklarBatchlarTextHook = useTasklarBatchlarText();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  // DOCX dosyası seçildiğinde işle (Faz2 aktarımı yoksa - tablolar için)
  useEffect(() => {
    if (!isOpen) return;
    
    // Faz2 aktarımı varsa DOCX parse etme
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    if (faz2Suggestions) {
      try {
        const suggestions = JSON.parse(faz2Suggestions);
        if (suggestions.tasklarBatchlar) {
          console.log('✅ Faz2 aktarımı mevcut, DOCX parse atlanıyor (Tasklar/Batchlar - Tablo)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal DOCX yükleme
    if (selectedFile && !isProcessed && !isLoading) {
      console.log('📄 DOCX işleniyor (Tasklar/Batchlar - Tablo):', selectedFile.name);
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);

  // Modal açıldığında Faz2 önerisini localStorage'dan oku (sadece aktarım yapıldıysa)
  // Dosya seçildiğinde metin alanını işle (Faz2 aktarımı yoksa)
  useEffect(() => {
    if (!isOpen) return;
    
    // Faz2 aktarımı varsa text hook parse etme
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    if (faz2Suggestions) {
      try {
        const suggestions = JSON.parse(faz2Suggestions);
        if (suggestions.tasklarBatchlar) {
          console.log('✅ Faz2 aktarımı mevcut, Text parse atlanıyor (Tasklar/Batchlar)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal text işleme
    if (selectedFile && !tasklarBatchlarTextHook.isProcessed && !tasklarBatchlarTextHook.isLoading) {
      console.log('📄 Tasklar/Batchlar Metni: DOCX dosyası işleniyor:', selectedFile.name);
      tasklarBatchlarTextHook.processFile(selectedFile);
    }
  }, [isOpen, selectedFile, tasklarBatchlarTextHook.isProcessed, tasklarBatchlarTextHook.isLoading, tasklarBatchlarTextHook.processFile]);
  
  // Dosya değiştiğinde hook'ları reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, Tasklar/Batchlar hookları reset ediliyor:', selectedFile.name);
      resetForm();
      tasklarBatchlarTextHook.resetContent();
    }
  }, [selectedFile?.name, resetForm, tasklarBatchlarTextHook.resetContent]);

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
      
      if (suggestions.tasklarBatchlar) {
        let suggestionContent = suggestions.tasklarBatchlar;
        
        // Eğer string ise ve JSON formatındaysa parse et
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {
            // Parse edilemezse raw string'i kullan
          }
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Tasklar/Batchlar)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Tasklar/Batchlar verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Tasklar/Batchlar verilerini JSON formatında hazırla
      const tasklarBatchlarData = {
        title: 'Tasklar/Batchlar',
        tableData: formData,
        textContent: tasklarBatchlarTextHook.content,
        validation: {
          found: validation?.found || false,
          mode: validation?.mode || 'strict',
          errors: validation?.errors || [],
          warnings: validation?.warnings || [],
          matchedLabels: validation?.matchedLabels || []
        },
        textValidation: {
          found: tasklarBatchlarTextHook.validation?.found || false,
          mode: tasklarBatchlarTextHook.validation?.mode || 'strict',
          errors: tasklarBatchlarTextHook.validation?.errors || [],
          warnings: tasklarBatchlarTextHook.validation?.warnings || [],
          matchedLabels: tasklarBatchlarTextHook.validation?.matchedLabels || []
        },
        isProcessed: isProcessed,
        isLoading: isLoading,
        timestamp: new Date().toISOString()
      };
      
      console.log('💾 Tasklar/Batchlar kaydediliyor:', { 
        selectedFile: selectedFile.name,
        tableRowCount: formData.taskBatchTable?.length || 0,
        textLength: tasklarBatchlarTextHook.content?.length || 0
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        tasklar_batchlar: JSON.stringify(tasklarBatchlarData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Tasklar/Batchlar başarıyla kaydedildi:', result);
        markModalAsSaved('tasklar-batchlar'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Tasklar/Batchlar kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Tasklar/Batchlar kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('tasklar_batchlar_formdata', JSON.stringify(formData));
        localStorage.setItem('tasklar_batchlar_textcontent', tasklarBatchlarTextHook.content || '');
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
    <div className="tasklar-batchlar-overlay">
      <div className="tasklar-batchlar-container">
        {/* Modal Header */}
        <div className="tasklar-batchlar-header">
          <h3 className="modal-title">{sectionTitle}</h3>
          <button className="modal-close-button" onClick={() => {
            // Modal kapanırken localStorage'a kaydet
            localStorage.setItem('tasklar_batchlar_formdata', JSON.stringify(formData));
            localStorage.setItem('tasklar_batchlar_textcontent', tasklarBatchlarTextHook.content || '');
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
        {tasklarBatchlarTextHook.validation && (tasklarBatchlarTextHook.validation.errors.length > 0 || tasklarBatchlarTextHook.validation.warnings.length > 0) && (
          <div className="validation-banner">
            {tasklarBatchlarTextHook.validation.errors.length > 0 && (
              <div className="validation-errors">
                <strong>❌ Metin Parse Hataları:</strong>
                <ul>
                  {tasklarBatchlarTextHook.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {tasklarBatchlarTextHook.validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>⚠️ Metin Parse Uyarıları:</strong>
                <ul>
                  {tasklarBatchlarTextHook.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Content - Split Layout */}
        <div className="tasklar-batchlar-content">
          {/* Sol Taraf - Tablo Formu */}
          <div className="table-form-panel">
            <div className="panel-header">
              <div className="panel-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h18v18H3V3z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Tablo Formu</span>
              </div>
              <div className="panel-info">
                <span className="level-indicator">LEVEL 3</span>
                <button className="edit-button">Düzenle</button>
              </div>
            </div>
            
            <div className="table-container">
              {/* Tasklar/Batchlar Tablosu */}
              <div className="table-section">
                <div className="table-header">
                  <h3>📋 Tasklar/Batchlar</h3>
                  <button 
                    className="add-row-btn"
                    onClick={addRowToTable}
                  >
                    + Satır Ekle
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="tasklar-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Yeni / Mevcut</th>
                        <th>Task/Job Adı</th>
                        <th>Tanım</th>
                        <th>Sorumlu Sistem / Modül</th>
                        <th>Çalışma Zamanı</th>
                        <th>Çalışma Sıklığı</th>
                        <th>Bağımlılıklar</th>
                        <th>Alert Mekanizması</th>
                        <th>Alternatif Çalıştırma Yöntemi</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.taskBatchTable.map((row, index) => (
                        <tr key={row.id}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              value={row.yeniMevcut}
                              onChange={(e) => updateTableCell(index, 'yeniMevcut', e.target.value)}
                              className="table-input"
                              placeholder="Yeni/Mevcut"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.taskJobAdi}
                              onChange={(e) => updateTableCell(index, 'taskJobAdi', e.target.value)}
                              className="table-input"
                              placeholder="Task/Job Adı"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.tanim}
                              onChange={(e) => updateTableCell(index, 'tanim', e.target.value)}
                              className="table-input"
                              placeholder="Tanım"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.sorumluSistem}
                              onChange={(e) => updateTableCell(index, 'sorumluSistem', e.target.value)}
                              className="table-input"
                              placeholder="Sorumlu Sistem"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.calismaSaati}
                              onChange={(e) => updateTableCell(index, 'calismaSaati', e.target.value)}
                              className="table-input"
                              placeholder="Çalışma Zamanı"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.calismaSikligi}
                              onChange={(e) => updateTableCell(index, 'calismaSikligi', e.target.value)}
                              className="table-input"
                              placeholder="Çalışma Sıklığı"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.bagimliliklar}
                              onChange={(e) => updateTableCell(index, 'bagimliliklar', e.target.value)}
                              className="table-input"
                              placeholder="Bağımlılıklar"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.alertMekanizmasi}
                              onChange={(e) => updateTableCell(index, 'alertMekanizmasi', e.target.value)}
                              className="table-input"
                              placeholder="Alert Mekanizması"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.alternatifCalistirmaYontemi}
                              onChange={(e) => updateTableCell(index, 'alternatifCalistirmaYontemi', e.target.value)}
                              className="table-input"
                              placeholder="Alternatif Yöntem"
                            />
                          </td>
                          <td>
                            <button
                              className="delete-row-btn"
                              onClick={() => removeRowFromTable(index)}
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

              {/* Açıklama Metni */}
              <div className="text-section">
                <div className="text-header">
                  <h3>📝 Açıklama Metni</h3>
                </div>
                <textarea
                  value={tasklarBatchlarTextHook.content || formData.aciklamaMetni}
                  onChange={(e) => {
                    // Hem hook'ta hem de formData'da güncelle
                    tasklarBatchlarTextHook.updateContent(e.target.value);
                    updateAciklamaMetni(e.target.value);
                  }}
                  className="description-textarea"
                  placeholder="Tasklar/Batchlar ile ilgili açıklama metnini buraya yazın..."
                  rows={4}
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
        <div className="tasklar-batchlar-footer">
          <div className="footer-info">
            <span className="last-saved">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="modal-btn secondary" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('tasklar_batchlar_formdata', JSON.stringify(formData));
              localStorage.setItem('tasklar_batchlar_textcontent', tasklarBatchlarTextHook.content || '');
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

export default TasklarBatchlarModal;
