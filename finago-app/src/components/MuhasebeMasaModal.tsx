import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/MuhasebeMasaModal.css';
import LLMChat from './LLMChat';

interface MuhasebeMasaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
}

const MuhasebeMasaModal: React.FC<MuhasebeMasaModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId
}) => {
  const [textContent, setTextContent] = useState<string>('');
  
  // Modal kapandığında state'i temizle
  useEffect(() => {
    if (!isOpen) {
      setTextContent('');
    }
  }, [isOpen]);
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Modal kapanırken localStorage'a kaydet
        localStorage.setItem('muhasebe_masa_textcontent', textContent);
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
      localStorage.setItem('muhasebe_masa_textcontent', textContent);
      onClose();
    }
  };

  // Text area değişikliklerini handle et
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="muhasebe-masa-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="muhasebe-masa-container"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="muhasebe-masa-header">
          <h2 className="modal-title">{sectionTitle}</h2>
          <div className="header-actions">
            <button 
              className="close-button"
              onClick={() => {
                // Modal kapanırken localStorage'a kaydet
                localStorage.setItem('muhasebe_masa_textcontent', textContent);
                onClose();
              }}
              aria-label="Modalı kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="muhasebe-masa-content">
          {/* Sol Taraf - Text Area */}
          <div className="text-panel">
            <div className="panel-header">
              <div className="panel-title">
                📝 Metin Düzenleyici
              </div>
            </div>
            <div className="text-container">
              <textarea
                className="text-editor"
                value={textContent}
                onChange={handleTextChange}
                placeholder="Buraya metin içeriğinizi yazabilirsiniz..."
                autoFocus
              />
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            <LLMChat sectionId={sectionId} sectionTitle={sectionTitle} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="muhasebe-masa-footer">
          <div className="footer-info">
            <span className="save-status">Son kaydedilme: Henüz kaydedilmedi</span>
            <span className="char-count">{textContent.length} karakter</span>
          </div>
          <div className="footer-actions">
            <button className="cancel-button" onClick={() => {
              // Modal kapanırken localStorage'a kaydet
              localStorage.setItem('muhasebe_masa_textcontent', textContent);
              onClose();
            }}>
              × İptal
            </button>
            <button className="save-button">
              ✓ Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MuhasebeMasaModal;
