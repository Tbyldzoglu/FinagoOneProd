import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LLMChat from './LLMChat';
import { useTalepDegerlendirmesi } from '../hooks/useTalepDegerlendirmesi';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/TalepDegerlendirmesiModal.css';

interface FormDataItem {
  yanit: string;
  aciklama: string;
}

interface FormData {
  mevcutGereksinimiVar: FormDataItem;
  urunAdi: string;
  yeniBirUrunMu: FormDataItem;
  muhasabeDeğisikligiVar: FormDataItem;
  disFirmaEntegrasyonu: FormDataItem;
  raporlamaEtkisi: FormDataItem;
  odemeGgbEtkisi: FormDataItem;
  uyumFraudSenaryolari: FormDataItem;
  dijitalKanallardaEtkisi: FormDataItem;
  batchIsEtkisi: FormDataItem;
  bildirimOlusturulmali: FormDataItem;
  conversionGereksinimiVar: FormDataItem;
}

interface TalepDegerlendirmesiModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  selectedFile?: File | null;
}

const TalepDegerlendirmesiModal: React.FC<TalepDegerlendirmesiModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  selectedFile
}) => {
  // Talep Değerlendirmesi hook'u
  const {
    formData,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateField
  } = useTalepDegerlendirmesi();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  
  // Faz2'den gelen öneri state'i
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  // Dosya seçildiğinde otomatik işle (Faz2 aktarımı yoksa)
  useEffect(() => {
    if (!isOpen) return;
    
    // Faz2 aktarımı varsa DOCX parse etme
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    if (faz2Suggestions) {
      try {
        const suggestions = JSON.parse(faz2Suggestions);
        if (suggestions.talepDegerlendirmesi) {
          console.log('✅ Faz2 aktarımı mevcut, DOCX parse atlanıyor (Talep Değerlendirmesi)');
          return;
        }
      } catch (error) {
        console.error('❌ Faz2 suggestions parse hatası:', error);
      }
    }
    
    // Normal DOCX yükleme
    if (selectedFile && !isProcessed && !isLoading) {
      console.log('📄 DOCX işleniyor (Talep Değerlendirmesi):', selectedFile.name);
      processFile(selectedFile);
    }
  }, [isOpen, selectedFile, isProcessed, isLoading, processFile]);

  // Modal açıldığında Faz2 önerisini localStorage'dan oku
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      // Faz2 önerilerini localStorage'dan al
      const storedSuggestions = localStorage.getItem('faz2_suggestions');
      
      console.log('🔍 DEBUG - localStorage faz2_suggestions:', storedSuggestions);
      
      if (!storedSuggestions) {
        console.log('⚠️ Faz2 önerileri bulunamadı');
        setFaz2Suggestion('');
        return;
      }
      
      const suggestions = JSON.parse(storedSuggestions);
      console.log('🔍 DEBUG - Parsed suggestions:', suggestions);
      console.log('🔍 DEBUG - talepDegerlendirmesi value:', suggestions.talepDegerlendirmesi);
      
      if (suggestions.talepDegerlendirmesi) {
        // Faz2'den gelen veri JSON string olabilir, parse et
        let suggestionContent = suggestions.talepDegerlendirmesi;
        
        // Eğer string ise ve JSON formatındaysa parse et
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            // Eğer content field'ı varsa onu kullan
            suggestionContent = parsed.content || suggestionContent;
            console.log('🔍 DEBUG - Parsed content from JSON:', suggestionContent);
          } catch (e) {
            // Parse edilemezse raw string'i kullan
            console.log('🔍 DEBUG - Using raw string content');
          }
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Talep Değerlendirmesi)');
        console.log('✅ Setting faz2Suggestion:', suggestionContent);
        setFaz2Suggestion(suggestionContent);
      } else {
        console.log('⚠️ Talep Değerlendirmesi önerisi bulunamadı');
        console.log('⚠️ Available keys:', Object.keys(suggestions));
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Talep Değerlendirmesi verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Talep Değerlendirmesi verilerini JSON formatında hazırla
      const talepDegerlendirmesiData = {
        title: 'Talep Değerlendirmesi',
        formData: formData,
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
      
      console.log('💾 Talep Değerlendirmesi kaydediliyor:', { 
        selectedFile: selectedFile.name,
        formData: Object.keys(formData).length + ' alan'
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        talep_degerlendirmesi: JSON.stringify(talepDegerlendirmesiData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Talep Değerlendirmesi başarıyla kaydedildi:', result);
        markModalAsSaved('talep-degerlendirmesi'); // Modal kaydedildi olarak işaretle
        // TODO: Success message göster
      } else {
        console.error('❌ Talep Değerlendirmesi kaydetme hatası:', result.error);
        // TODO: Error message göster
      }
      
    } catch (error) {
      console.error('❌ Talep Değerlendirmesi kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      
      // HTML ve body'yi orijinal haline döndür
      const html = document.documentElement;
      const body = document.body;
      
      // Overflow'u reset et
      html.style.overflow = '';
      html.style.overflowX = '';
      html.style.overflowY = '';
      body.style.overflow = '';
      body.style.overflowX = '';
      body.style.overflowY = '';
      
      // Boyutları reset et
      html.style.width = '';
      html.style.height = '';
      body.style.width = '';
      body.style.height = '';
      body.style.margin = '';
      body.style.padding = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="talep-degerlendirmesi-overlay">
      <div className="talep-degerlendirmesi-container">
        {/* Modal Header */}
        <div className="talep-degerlendirmesi-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{sectionTitle}</h2>
            <span className="modal-subtitle">Değerlendirme Tablosu ve AI Desteği</span>
          </div>
          <button className="modal-close-btn" onClick={() => {
            // Modal kapanırken localStorage'a kaydet
            localStorage.setItem('talep_degerlendirmesi_formdata', JSON.stringify(formData));
            onClose();
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="talep-degerlendirmesi-content">
          {/* Sol Taraf - Değerlendirme Tablosu */}
          <div className="evaluation-table-panel">
            <div className="panel-header">
              <div className="panel-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="9" y="7" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Talep Değerlendirme Tablosu</span>
              </div>
              <div className="panel-info">
                <span className="completion-status">12 alan • 0 tamamlandı</span>
              </div>
            </div>
            
            <div className="evaluation-table-container">
              <table className="evaluation-table">
                <thead>
                  <tr>
                    <th className="question-header">Soru</th>
                    <th className="answer-header">Yanıt</th>
                    <th className="explanation-header">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="question-cell">Mevzuat Gereksinimi Var mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.mevcutGereksinimiVar.yanit}
                        onChange={(e) => updateField('mevcutGereksinimiVar', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.mevcutGereksinimiVar.aciklama}
                        onChange={(e) => updateField('mevcutGereksinimiVar', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr className="single-column-row">
                    <td className="question-cell">Ürün Adı:</td>
                    <td className="single-answer-cell" colSpan={2}>
                      <input 
                        type="text"
                        value={formData.urunAdi}
                        onChange={(e) => updateField('urunAdi', e.target.value)}
                        className="table-input"
                        placeholder="Ürün adını girin..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Yeni bir ürün mü?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.yeniBirUrunMu.yanit}
                        onChange={(e) => updateField('yeniBirUrunMu', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.yeniBirUrunMu.aciklama}
                        onChange={(e) => updateField('yeniBirUrunMu', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Muhasebe Değişikliği var mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.muhasabeDeğisikligiVar.yanit}
                        onChange={(e) => updateField('muhasabeDeğisikligiVar', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.muhasabeDeğisikligiVar.aciklama}
                        onChange={(e) => updateField('muhasabeDeğisikligiVar', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Dış Firma Entegrasyonu gerekiyor mu?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.disFirmaEntegrasyonu.yanit}
                        onChange={(e) => updateField('disFirmaEntegrasyonu', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.disFirmaEntegrasyonu.aciklama}
                        onChange={(e) => updateField('disFirmaEntegrasyonu', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Raporlama Etkisi var mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.raporlamaEtkisi.yanit}
                        onChange={(e) => updateField('raporlamaEtkisi', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.raporlamaEtkisi.aciklama}
                        onChange={(e) => updateField('raporlamaEtkisi', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">A Ödeme/ GGB Etkisi var mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.odemeGgbEtkisi.yanit}
                        onChange={(e) => updateField('odemeGgbEtkisi', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.odemeGgbEtkisi.aciklama}
                        onChange={(e) => updateField('odemeGgbEtkisi', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Uyum & Fraud Senaryoları var mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.uyumFraudSenaryolari.yanit}
                        onChange={(e) => updateField('uyumFraudSenaryolari', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.uyumFraudSenaryolari.aciklama}
                        onChange={(e) => updateField('uyumFraudSenaryolari', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Dijital kanallara etkisi var mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.dijitalKanallardaEtkisi.yanit}
                        onChange={(e) => updateField('dijitalKanallardaEtkisi', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.dijitalKanallardaEtkisi.aciklama}
                        onChange={(e) => updateField('dijitalKanallardaEtkisi', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Batch iş etkisi olacak mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.batchIsEtkisi.yanit}
                        onChange={(e) => updateField('batchIsEtkisi', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.batchIsEtkisi.aciklama}
                        onChange={(e) => updateField('batchIsEtkisi', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Bildirim oluşturulmalı mı? (SMS / Mail / Push )</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.bildirimOlusturulmali.yanit}
                        onChange={(e) => updateField('bildirimOlusturulmali', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="SMS/Mail/Push"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.bildirimOlusturulmali.aciklama}
                        onChange={(e) => updateField('bildirimOlusturulmali', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="question-cell">Conversion Gereksinimi var mı?</td>
                    <td className="answer-cell">
                      <input 
                        type="text"
                        value={formData.conversionGereksinimiVar.yanit}
                        onChange={(e) => updateField('conversionGereksinimiVar', e.target.value, 'yanit')}
                        className="table-input"
                        placeholder="Evet/Hayır"
                      />
                    </td>
                    <td className="explanation-cell">
                      <input 
                        type="text"
                        value={formData.conversionGereksinimiVar.aciklama}
                        onChange={(e) => updateField('conversionGereksinimiVar', e.target.value, 'aciklama')}
                        className="table-input"
                        placeholder="Açıklama..."
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              sectionContent={JSON.stringify(formData, null, 2)}
              className="talep-chat"
              faz2Suggestion={faz2Suggestion}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="talep-degerlendirmesi-footer">
          <div className="footer-info">
            <span className="last-saved">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="modal-btn secondary" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('talep_degerlendirmesi_formdata', JSON.stringify(formData));
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

export default TalepDegerlendirmesiModal;
