/**
 * Paydaşlar ve Kullanıcılar Modal Bileşeni
 * Paydaşlar ve kullanıcılar tablosu ve LLM chat alanı içeren modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/PaydaslarKullanicilarModal.css';
import LLMChat from './LLMChat';
import { usePaydaslarKullanicilar } from '../hooks/usePaydaslarKullanicilar';
import { updateAnalizFaz1 } from '../services/analizService';
import authService from '../services/authService';
import { markModalAsSaved } from '../services/modalChangeTracker';

interface PaydaslarKullanicilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionTitle: string;
  selectedFile?: File | null;
}

interface PaydaslarKullanicilarRow {
  id: string;
  data: {
    paydasEkipKullaniciBilgileri: string;
    paydasEkipKullaniciBilgileriAciklama: string;
    uyumFraudEkibiGorusu: string;
    uyumFraudEkibiGorusuAciklama: string;
    hukukEkibiGorusu: string;
    hukukEkibiGorusuAciklama: string;
    teftisIcKontrolGorusu: string;
    teftisIcKontrolGorusuAciklama: string;
    operasyonEkibiGorusu: string;
    operasyonEkibiGorusuAciklama: string;
  };
}

const PaydaslarKullanicilarModal: React.FC<PaydaslarKullanicilarModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionTitle,
  selectedFile
}) => {
  const {
    formData,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateField
  } = usePaydaslarKullanicilar();

  // Kaydetme state'i
  const [isSaving, setIsSaving] = useState(false);
  const [faz2Suggestion, setFaz2Suggestion] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // DOCX dosyası seçildiğinde işle (sadece bir kez)
  useEffect(() => {
    console.log('📄 PaydaslarKullanicilarModal useEffect:', { isOpen, selectedFile: selectedFile?.name, isProcessed });
    if (isOpen && selectedFile && !isProcessed && !isLoading) {
      console.log('📄 PaydaslarKullanicilarModal: DOCX dosyası işleniyor:', selectedFile.name);
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
      
      if (suggestions.paydaslarKullanicilar) {
        let suggestionContent = suggestions.paydaslarKullanicilar;
        
        if (typeof suggestionContent === 'string') {
          try {
            const parsed = JSON.parse(suggestionContent);
            suggestionContent = parsed.content || suggestionContent;
          } catch (e) {}
        }
        
        console.log('✅ Faz2 önerisi localStorage\'dan alındı (Paydaşlar ve Kullanıcılar)');
        setFaz2Suggestion(suggestionContent);
      } else {
        setFaz2Suggestion('');
      }
    } catch (error) {
      console.error('❌ Faz2 önerisi okuma hatası:', error);
      setFaz2Suggestion('');
    }
  }, [isOpen]);

  // Kaydet fonksiyonu - Paydaşlar ve Kullanıcılar verilerini database'e kaydet
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Paydaşlar ve Kullanıcılar verilerini JSON formatında hazırla
      const paydaslarKullanicilarData = {
        title: 'Paydaşlar ve Kullanıcılar',
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
      
      console.log('💾 Paydaşlar ve Kullanıcılar kaydediliyor:', { 
        selectedFile: selectedFile.name,
        formFieldCount: Object.keys(formData).length
      });
      
      const result = await updateAnalizFaz1(selectedFile.name, {
        paydaslar_kullanicilar: JSON.stringify(paydaslarKullanicilarData, null, 2)
      });
      
      if (result.success) {
        console.log('✅ Paydaşlar ve Kullanıcılar başarıyla kaydedildi:', result);
        markModalAsSaved('paydaslar-kullanicilar'); // Modal kaydedildi olarak işaretle
      } else {
        console.error('❌ Paydaşlar ve Kullanıcılar kaydetme hatası:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Paydaşlar ve Kullanıcılar kaydetme hatası:', error);
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
      onClose();
    }
  };



  if (!isOpen) return null;

  return createPortal(
    <div className="paydaslar-kullanicilar-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="paydaslar-kullanicilar-modal"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="paydaslar-kullanicilar-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('paydaslar_kullanicilar_formdata', JSON.stringify(formData));
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="paydaslar-kullanicilar-content">
          {/* Sol Taraf - Tablo */}
          <div className="table-panel">
            <div className="panel-header">
              <div className="panel-title">
                📊 Paydaşlar ve Kullanıcılar Tablosu
              </div>
            </div>
            
            <div className="table-container">
              <table className="paydaslar-kullanicilar-table">
                <tbody>
                  <tr>
                    <td className="label-cell">Paydaş ekip & kullanıcı bilgileri</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Paydaş ekip & kullanıcı bilgileri"
                        value={formData.data.paydasEkipKullaniciBilgileri}
                        onChange={(e) => updateField('paydasEkipKullaniciBilgileri', e.target.value)}
                      />
                    </td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Açıklama"
                        value={formData.data.paydasEkipKullaniciBilgileriAciklama}
                        onChange={(e) => updateField('paydasEkipKullaniciBilgileriAciklama', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Uyum & Fraud Ekibi Görüşü alındı mı?</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Uyum & Fraud Ekibi Görüşü"
                        value={formData.data.uyumFraudEkibiGorusu}
                        onChange={(e) => updateField('uyumFraudEkibiGorusu', e.target.value)}
                      />
                    </td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Açıklama"
                        value={formData.data.uyumFraudEkibiGorusuAciklama}
                        onChange={(e) => updateField('uyumFraudEkibiGorusuAciklama', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Hukuk Ekibi Görüşü alındı mı?</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Hukuk Ekibi Görüşü"
                        value={formData.data.hukukEkibiGorusu}
                        onChange={(e) => updateField('hukukEkibiGorusu', e.target.value)}
                      />
                    </td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Açıklama"
                        value={formData.data.hukukEkibiGorusuAciklama}
                        onChange={(e) => updateField('hukukEkibiGorusuAciklama', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Teftiş/ İç Kontrol Birimleri Görüşü alındı mı?</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Teftiş/ İç Kontrol Birimleri Görüşü"
                        value={formData.data.teftisIcKontrolGorusu}
                        onChange={(e) => updateField('teftisIcKontrolGorusu', e.target.value)}
                      />
                    </td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Açıklama"
                        value={formData.data.teftisIcKontrolGorusuAciklama}
                        onChange={(e) => updateField('teftisIcKontrolGorusuAciklama', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Operasyon Ekibi Görüşü alındı mı?</td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Operasyon Ekibi Görüşü"
                        value={formData.data.operasyonEkibiGorusu}
                        onChange={(e) => updateField('operasyonEkibiGorusu', e.target.value)}
                      />
                    </td>
                    <td className="input-cell">
                      <input 
                        type="text" 
                        className="table-input" 
                        placeholder="Açıklama"
                        value={formData.data.operasyonEkibiGorusuAciklama}
                        onChange={(e) => updateField('operasyonEkibiGorusuAciklama', e.target.value)}
                      />
                    </td>
                  </tr>
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
        <div className="paydaslar-kullanicilar-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('paydaslar_kullanicilar_formdata', JSON.stringify(formData));
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

export default PaydaslarKullanicilarModal;