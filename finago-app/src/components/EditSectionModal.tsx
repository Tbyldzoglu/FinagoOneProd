import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTalepBilgileri } from '../hooks/useTalepBilgileri';
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/EditSectionModal.css';

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  buttonPosition?: { x: number; y: number };
  selectedFile?: File | null;
}

const EditSectionModal: React.FC<EditSectionModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  buttonPosition,
  selectedFile
}) => {
  // Talep Bilgileri hook'u
  const {
    fields,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetFields,
    updateField
  } = useTalepBilgileri();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);

  // Kaydet fonksiyonu
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Talep Bilgileri verilerini JSON formatında hazırla
      const talepBilgileriData = {
        title: 'Talep Bilgileri',
        fields: fields,
        validation: {
          found: validation?.found || false,
          mode: validation?.mode || 'strict',
          errors: validation?.errors || [],
          warnings: validation?.warnings || [],
          matchedLabels: validation?.matchedLabels || []
        },
        isProcessed: true,
        isLoading: false,
        timestamp: new Date().toISOString()
      };

      const updateData = {
        talep_bilgileri: JSON.stringify(talepBilgileriData, null, 2)
      };
      
      console.log('💾 Talep Bilgileri kaydediliyor:', { 
        sectionId, 
        fields: fields,
        content: JSON.stringify(talepBilgileriData, null, 2).substring(0, 100) + '...' 
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, updateData);
      
      if (result.success) {
        console.log('✅ Talep Bilgileri başarıyla kaydedildi:', result);
        markModalAsSaved('talep-bilgileri'); // Modal kaydedildi olarak işaretle
        // TODO: Success message göster
      } else {
        console.error('❌ Talep Bilgileri kaydetme hatası:', result.error);
        // TODO: Error message göster
      }
      
    } catch (error) {
      console.error('❌ Talep Bilgileri kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
      
      // Modal açıldığında ilk input'a focus at
      setTimeout(() => {
        const firstInput = document.querySelector('.modal-container .form-input') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
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

  // Modal artık fullscreen, pozisyon hesaplama gerekmez

  const modalContent = (
    <div className="modal-overlay">
      <div 
        className="modal-container"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{sectionTitle}</h2>
            <span className="modal-subtitle">Bölüm Düzenleme</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Talep Bilgileri Formu */}
          <div className="form-container">
            <div className="form-row double">
              <div className="form-field">
                <label className="form-label">Talep No</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={fields.talep_no}
                  onChange={(e) => updateField('talep_no', e.target.value)}
                  placeholder="Talep No girin..."
                />
              </div>
              <div className="form-field">
                <label className="form-label">Talep Adı</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={fields.talep_adi}
                  onChange={(e) => updateField('talep_adi', e.target.value)}
                  placeholder="Talep Adı girin..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Talep Sahibi İş Birimi</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={fields.talep_sahibi_is_birimi}
                  onChange={(e) => updateField('talep_sahibi_is_birimi', e.target.value)}
                  placeholder="Talep Sahibi İş Birimi girin..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Talep Sahibi Kurum</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={fields.talep_sahibi_kurum}
                  onChange={(e) => updateField('talep_sahibi_kurum', e.target.value)}
                  placeholder="Talep Sahibi Kurum girin..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Talep Yöneticisi</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={fields.talep_yoneticisi}
                  onChange={(e) => updateField('talep_yoneticisi', e.target.value)}
                  placeholder="Talep Yöneticisi girin..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Teknik Ekipler</label>
                <textarea 
                  className="form-textarea"
                  value={fields.teknik_ekipler}
                  onChange={(e) => updateField('teknik_ekipler', e.target.value)}
                  placeholder="Teknik Ekipler girin..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
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
  );

  // Portal kullanarak modal'ı body'e direkt render et
  return createPortal(modalContent, document.body);
};

export default EditSectionModal;
