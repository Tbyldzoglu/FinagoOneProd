/**
 * Test Senaryosu Üretici Sayfası
 * Analiz dokümanı yükleyip test senaryoları üretir
 */

import React, { useState, useCallback, useRef } from 'react';
import '../styles/TestSenaryoPage.css';
import mammoth from 'mammoth';
import JSZip from 'jszip';

interface TestSenaryoState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
}

interface TestSenaryoResult {
  testSenaryolari: string;
  confidence: number;
  tokens_used: number;
  generation_time: number;
}

interface TestSenaryoPageProps {
  onNavigate?: (page: string) => void;
}

const TestSenaryoPage: React.FC<TestSenaryoPageProps> = ({ onNavigate }) => {
  // State yönetimi
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testSenaryoState, setTestSenaryoState] = useState<TestSenaryoState>({
    status: 'idle',
    progress: 0,
    currentStep: ''
  });
  const [testSenaryoResult, setTestSenaryoResult] = useState<TestSenaryoResult | null>(null);
  const [editableContent, setEditableContent] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Dosya seçim işleyicisi
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setSelectedFile(file);
      setTestSenaryoResult(null);
      setEditableContent('');
    } else {
      alert('Lütfen geçerli bir DOCX dosyası seçin.');
    }
  }, []);

  /**
   * DOCX'den structured data çıkarma
   */
  const extractStructuredFromDocx = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    
    // Mammoth options - daha tolerant parsing
    const options = {
      arrayBuffer,
      ignoreEmptyParagraphs: true,
      convertImage: mammoth.images.imgElement(function(image: any) {
        return image.read("base64").then(function(imageBuffer: string) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    };
    
    try {
      const result = await mammoth.convertToHtml(options);
      
      // Hataları logla (varsa)
      if (result.messages && result.messages.length > 0) {
        console.warn('⚠️ Mammoth parse uyarıları:', result.messages);
      }
      
      // HTML'i parse et
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, 'text/html');
      
      return doc;
    } catch (error) {
      console.error('❌ Mammoth parse hatası:', error);
      
      // Fallback 1: Basit text extraction dene
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log('ℹ️ Fallback 1: Raw text extraction kullanıldı');
        
        // Raw text'i HTML'e çevir
        const htmlContent = result.value
          .split('\n')
          .map(line => `<p>${line}</p>`)
          .join('');
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        return doc;
      } catch (fallbackError1) {
        console.error('❌ Fallback 1 başarısız:', fallbackError1);
        
        // Fallback 2: JSZip ile doğrudan XML'den text extraction
        try {
          console.log('ℹ️ Fallback 2: JSZip ile XML extraction deneniyor...');
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(arrayBuffer);
          
          // word/document.xml dosyasını oku
          const documentXml = await zipContent.file('word/document.xml')?.async('text');
          
          if (!documentXml) {
            throw new Error('word/document.xml bulunamadı');
          }
          
          // XML'den text node'ları çıkar (basit regex ile)
          // <w:t>...</w:t> etiketleri arasındaki text'leri al
          const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
          const textContent = textMatches 
            ? textMatches.map(match => {
                const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
                return textMatch ? textMatch[1] : '';
              }).join(' ')
            : '';
          
          console.log(`✅ JSZip extraction başarılı: ${textContent.length} karakter`);
          
          // Text'i HTML paragraflarına çevir
          const htmlContent = textContent
            .split(/[.!?]\s+/)
            .filter(sentence => sentence.trim().length > 0)
            .map(sentence => `<p>${sentence.trim()}.</p>`)
            .join('');
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent || '<p>Boş doküman</p>', 'text/html');
          
          return doc;
        } catch (fallbackError2) {
          console.error('❌ Fallback 2 (JSZip) da başarısız:', fallbackError2);
          throw new Error('DOCX dosyası okunamadı. Export edilmiş dosyalar için test senaryosu oluşturulamaz. Lütfen orijinal Word dosyasını yükleyin.');
        }
      }
    }
  };
  
  const processDocumentStructure = (doc: Document, fileName: string) => {
    const htmlContent = doc.body.innerHTML;
    
    // Görselleri çıkar ve etiketle
    const images: Array<{id: string, type: string, alt: string}> = [];
    let imageIndex = 0;
    
    // Base64 görselleri çıkar
    const base64Images = htmlContent.match(/data:image\/([^;]+);base64,[A-Za-z0-9+/=]+/gi);
    if (base64Images) {
      base64Images.forEach((match) => {
        const parts = match.match(/data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)/);
        if (parts) {
          images.push({
            id: `image_${imageIndex++}`,
            type: parts[1],
            alt: `Görsel ${imageIndex}`
          });
        }
      });
    }
    
    // img taglarındaki görselleri çıkar
    const imgTags = htmlContent.match(/<img[^>]*>/gi);
    if (imgTags) {
      imgTags.forEach((imgTag) => {
        const altMatch = imgTag.match(/alt="([^"]*)"/);
        const alt = altMatch ? altMatch[1] : `Görsel ${imageIndex + 1}`;
        images.push({
          id: `image_${imageIndex++}`,
          type: 'unknown',
          alt: alt
        });
      });
    }
    
    // HTML'den görselleri kısa etiketlerle değiştir
    let cleanHtml = htmlContent
      .replace(/<img[^>]*>/gi, (match) => {
        const altMatch = match.match(/alt="([^"]*)"/);
        const alt = altMatch ? altMatch[1] : `Görsel ${imageIndex}`;
        return `[GÖRSEL: ${alt}]`;
      })
      .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/gi, '[GÖRSEL: Base64]')
      .replace(/src="[^"]*\.(jpg|jpeg|png|gif|bmp|webp)"/gi, 'src="[GÖRSEL]"')
      .replace(/\s+/g, ' ')
      .trim();

    // HTML'i hiyerarşik düz metne çevir (başlık yapısını koruyarak)
    const plainText = cleanHtml
      // Başlık hiyerarşisini koru
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
      // Paragrafları koru
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
      // Listeleri koru
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      // Tabloları koru (başlık ve içerik ayrımı ile)
      .replace(/<table[^>]*>/gi, '\n[Tablo Başlangıcı]\n')
      .replace(/<\/table>/gi, '\n[Tablo Sonu]\n')
      .replace(/<tr[^>]*>/gi, '')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<td[^>]*>(.*?)<\/td>/gi, '| $1 ')
      .replace(/<th[^>]*>(.*?)<\/th>/gi, '| [BAŞLIK] $1 [BAŞLIK] ')
      // Diğer HTML taglarını kaldır
      .replace(/<[^>]*>/g, '')
      // HTML entity'leri düzelt
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Fazla boşlukları temizle
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
    
    const structuredData = {
      fileName: fileName,
      content: plainText, // Hiyerarşik düz metin
      images: images, // Görsel etiketleri
      elements: Array.from(doc.body.children).map((element, index) => ({
        id: `element_${index}`,
        type: element.tagName.toLowerCase(),
        text: element.textContent || '',
        html: element.outerHTML
      })),
      stats: {
        totalElements: doc.body.children.length,
        totalCharacters: plainText.length,
        hasTables: plainText.includes('[Tablo Başlangıcı]'),
        hasLists: plainText.includes('•'),
        hasImages: images.length > 0,
        imageCount: images.length
      },
      timestamp: new Date().toISOString()
    };

    return structuredData;
  };

  /**
   * Test senaryosu üretme
   */
  const handleGenerateTestSenaryo = useCallback(async () => {
    if (!selectedFile) return;

    setTestSenaryoState({
      status: 'uploading',
      progress: 10,
      currentStep: 'Doküman yükleniyor...'
    });

    try {
      // 1. DOCX'i parse et
      const doc = await extractStructuredFromDocx(selectedFile);
      
      // 2. Structured data'ya çevir
      const structuredData = processDocumentStructure(doc, selectedFile.name);
      
      setTestSenaryoState({
        status: 'processing',
        progress: 30,
        currentStep: 'Test senaryosu analizi başlatılıyor...'
      });

      console.log('📊 Test Senaryosu - Structured data:', {
        elements: structuredData.stats.totalElements,
        characters: structuredData.stats.totalCharacters,
        hasTables: structuredData.stats.hasTables,
        hasLists: structuredData.stats.hasLists,
        hasImages: structuredData.stats.hasImages,
        imageCount: structuredData.stats.imageCount
      });

      // 2. N8N webhook'una gönder
      const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_TEST_SENARYO || `${process.env.REACT_APP_N8N_WEBHOOK_URL}/webhook/Test`;
      const payload = {
        fileName: selectedFile.name,
        content: structuredData.content, // Temizlenmiş HTML içerik
        images: structuredData.images, // Görsel etiketleri
        stats: structuredData.stats, // İstatistikler
        analysisType: 'test_senaryolari',
        hasVisualContent: structuredData.images.length > 0,
        processingMode: structuredData.images.length > 0 ? 'text_and_images' : 'text_only',
        timestamp: new Date().toISOString()
      };

      console.log('🚀 Test Senaryosu - N8N webhook\'una gönderiliyor:', {
        url: webhookUrl,
        payload: {
          fileName: payload.fileName,
          contentLength: payload.content.length,
          imageCount: payload.images.length,
          hasVisualContent: payload.hasVisualContent,
          processingMode: payload.processingMode,
          analysisType: payload.analysisType,
          stats: payload.stats
        }
      });

      setTestSenaryoState({
        status: 'processing',
        progress: 50,
        currentStep: payload.hasVisualContent 
          ? 'AI hibrit test senaryosu üretiliyor (metin + görseller)...'
          : 'AI test senaryosu üretiliyor (sadece metin)...'
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Test Senaryosu - N8N response:', result);

      setTestSenaryoState({
        status: 'processing',
        progress: 80,
        currentStep: 'Test senaryosu işleniyor...'
      });

      // 4. Sonucu işle - farklı response formatlarını kontrol et
      let testSenaryoData = null;

      // Format 1: result.success && result.data
      if (result.success && result.data) {
        testSenaryoData = {
          testSenaryolari: result.data.test_senaryolari || result.data.response || result.data.message || 'Test senaryosu üretildi',
          confidence: result.data.confidence || 0.85,
          tokens_used: result.data.tokens_used || 0,
          generation_time: result.data.generation_time || 0
        };
      }
      // Format 2: result.data doğrudan
      else if (result.data) {
        testSenaryoData = {
          testSenaryolari: result.data.test_senaryolari || result.data.response || result.data.message || result.data || 'Test senaryosu üretildi',
          confidence: result.data.confidence || 0.85,
          tokens_used: result.data.tokens_used || 0,
          generation_time: result.data.generation_time || 0
        };
      }
      // Format 3: result doğrudan
      else if (result.test_senaryolari || result.response || result.message) {
        testSenaryoData = {
          testSenaryolari: result.test_senaryolari || result.response || result.message || 'Test senaryosu üretildi',
          confidence: result.confidence || 0.85,
          tokens_used: result.tokens_used || 0,
          generation_time: result.generation_time || 0
        };
      }
      // Format 4: result.result
      else if (result.result) {
        testSenaryoData = {
          testSenaryolari: result.result,
          confidence: 0.85,
          tokens_used: 0,
          generation_time: 0
        };
      }
      // Format 5: String response
      else if (typeof result === 'string') {
        testSenaryoData = {
          testSenaryolari: result,
          confidence: 0.85,
          tokens_used: 0,
          generation_time: 0
        };
      }

      if (testSenaryoData) {
        setTestSenaryoResult(testSenaryoData);
        setEditableContent(testSenaryoData.testSenaryolari);

        setTestSenaryoState({
          status: 'completed',
          progress: 100,
          currentStep: 'Test senaryosu başarıyla üretildi!'
        });
      } else {
        console.error('❌ Beklenmeyen response formatı:', result);
        throw new Error(`Beklenmeyen response formatı: ${JSON.stringify(result)}`);
      }

    } catch (error) {
      console.error('❌ Test Senaryosu - Hata:', error);
      setTestSenaryoState({
        status: 'error',
        progress: 0,
        currentStep: `Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      });
    }
  }, [selectedFile]);

  /**
   * Dosya seçim butonu
   */
  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Sayfayı sıfırla
   */
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setTestSenaryoState({
      status: 'idle',
      progress: 0,
      currentStep: ''
    });
    setTestSenaryoResult(null);
    setEditableContent('');
  }, []);

  return (
    <div className="test-senaryo-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>🧪 Test Senaryosu Üretici</h1>
            <p>Analiz dokümanınızı yükleyin ve AI destekli test senaryoları üretin</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleReset}>
              🔄 Sıfırla
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        {/* Dosya Seçimi */}
        <div className="file-selection-section">
          <div className="section-header">
            <h2>📄 Analiz Dokümanı Seçin</h2>
            <p>Test senaryosu üretmek için DOCX formatında analiz dokümanınızı yükleyin</p>
          </div>
          
          <div className="file-input-container">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div className="file-drop-zone" onClick={handleFileButtonClick}>
              {selectedFile ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button className="change-file-btn">Değiştir</button>
                </div>
              ) : (
                <div className="file-placeholder">
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    <h3>Dosya Seçin</h3>
                    <p>DOCX formatında analiz dokümanınızı yükleyin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* İşlem Durumu */}
        {testSenaryoState.status !== 'idle' && (
          <div className="processing-section">
            <div className="section-header">
              <h2>⚙️ İşlem Durumu</h2>
            </div>
            
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${testSenaryoState.progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {testSenaryoState.progress}% - {testSenaryoState.currentStep}
              </div>
            </div>
          </div>
        )}

        {/* Test Senaryosu Sonucu */}
        {testSenaryoResult && (
          <div className="result-section">
            <div className="section-header">
              <h2>🎯 Üretilen Test Senaryoları</h2>
              <p>AI tarafından üretilen test senaryolarını inceleyin ve düzenleyin</p>
            </div>
            
            
            <div className="editable-content">
              <div className="content-header">
                <h3>Test Senaryoları</h3>
                <div className="content-actions">
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      navigator.clipboard.writeText(editableContent);
                      // Toast notification eklenebilir
                    }}
                  >
                    📋 Kopyala
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      const blob = new Blob([editableContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `test-senaryolari-${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    💾 Kaydet
                  </button>
                </div>
              </div>
              
              <div className="content-display">
                <div className="scenario-content">
                  {editableContent.split('\n').map((line, index) => {
                    // Başlık formatı
                    if (line.match(/^\*\*\d+\.\s+.*\*\*$/)) {
                      return (
                        <div key={index} className="scenario-title">
                          <div className="scenario-number">
                            {line.match(/^\*\*(\d+)\./)?.[1]}
                          </div>
                          <div className="scenario-title-text">
                            {line.replace(/^\*\*\d+\.\s+/, '').replace(/\*\*$/, '')}
                          </div>
                        </div>
                      );
                    }
                    
                    // Alt başlık formatı
                    if (line.match(/^\*\*.*\*\*$/)) {
                      return (
                        <div key={index} className="scenario-subtitle">
                          {line.replace(/\*\*/g, '')}
                        </div>
                      );
                    }
                    
                    // Adım formatı
                    if (line.match(/^\d+\.\s+\*\*Adım:\*\*/)) {
                      return (
                        <div key={index} className="scenario-step">
                          <div className="step-number">
                            {line.match(/^(\d+)\./)?.[1]}
                          </div>
                          <div className="step-content">
                            {line.replace(/^\d+\.\s+\*\*Adım:\*\*\s*/, '')}
                          </div>
                        </div>
                      );
                    }
                    
                    // Normal paragraf
                    if (line.trim()) {
                      return (
                        <div key={index} className="scenario-paragraph">
                          {line}
                        </div>
                      );
                    }
                    
                    // Boş satır
                    return <div key={index} className="scenario-spacer"></div>;
                  })}
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Hata Durumu */}
        {testSenaryoState.status === 'error' && (
          <div className="error-section">
            <div className="error-card">
              <div className="error-icon">❌</div>
              <div className="error-content">
                <h3>Hata Oluştu</h3>
                <p>{testSenaryoState.currentStep}</p>
                <button className="btn btn-primary" onClick={handleReset}>
                  Tekrar Dene
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ana Aksiyon Butonu */}
        <div className="action-section">
          <button
            className="btn btn-primary btn-large"
            onClick={handleGenerateTestSenaryo}
            disabled={!selectedFile || testSenaryoState.status === 'processing'}
          >
            {testSenaryoState.status === 'processing' ? (
              <>
                <span className="spinner"></span>
                Test Senaryosu Üretiliyor...
              </>
            ) : (
              <>
                🚀 Test Senaryosu Üret
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSenaryoPage;
