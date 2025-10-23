import React, { useState, useRef, useEffect } from 'react';
import '../styles/LLMChat.css';
import { getModalContentForChat } from '../services/databaseService';
import authService from '../services/authService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isFaz2Suggestion?: boolean;
}

interface LLMChatProps {
  sectionId?: string;
  sectionTitle: string;
  sectionContent?: string;
  onSectionUpdate?: (content: string) => void;
  className?: string;
  getAllModalContents?: () => any; // Tüm modal içeriklerini getiren fonksiyon
  selectedFile?: File | null; // Seçili dosya
  faz2Suggestion?: string; // Faz2'den gelen öneri
}

const LLMChat: React.FC<LLMChatProps> = ({
  sectionId,
  sectionTitle,
  sectionContent = '',
  onSectionUpdate,
  className = '',
  getAllModalContents,
  selectedFile,
  faz2Suggestion
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Merhaba! ${sectionTitle} bölümü hakkında size nasıl yardımcı olabilirim? Bu bölümü geliştirmek, düzenlemek veya içerik önerileri almak için benimle sohbet edebilirsiniz.`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Webhook URL'ini env'den al
  const getWebhookUrl = () => {
    const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_CHAT_MODAL || `${process.env.REACT_APP_N8N_WEBHOOK_URL}/webhook-test/ChatModal`;
    console.log('🎯 Webhook URL:', webhookUrl);
    return webhookUrl;
  };

  // Test webhook connection
  const testWebhook = async () => {
    const webhookUrl = getWebhookUrl();
    console.log('🧪 Webhook bağlantısı test ediliyor...');
    console.log('🌐 Webhook URL:', webhookUrl);
    console.log('🔧 Mode:', process.env.REACT_APP_WEBHOOK_MODE || 'production');
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET'
      });
      console.log('🧪 Test response status:', response.status);
      const text = await response.text();
      console.log('🧪 Test response text:', text);
    } catch (error) {
      console.error('🧪 Test hatası:', error);
    }
  };

  // Component mount'ta webhook test et
  useEffect(() => {
    testWebhook();
  }, []);

  // Faz2 önerisi varsa mesajlara ekle
  useEffect(() => {
    console.log('🔍 LLMChat - faz2Suggestion prop değeri:', faz2Suggestion);
    console.log('🔍 LLMChat - faz2Suggestion type:', typeof faz2Suggestion);
    console.log('🔍 LLMChat - faz2Suggestion length:', faz2Suggestion?.length);
    
    if (faz2Suggestion && faz2Suggestion.trim()) {
      console.log('✅ LLMChat - faz2Suggestion geçerli, mesajlara ekleniyor');
      setMessages(prev => {
        const hasFaz2Suggestion = prev.some(m => m.isFaz2Suggestion);
        console.log('🔍 LLMChat - Mevcut mesajlarda Faz2 önerisi var mı?', hasFaz2Suggestion);
        
        if (!hasFaz2Suggestion) {
          const suggestionMessage: Message = {
            id: 'faz2-suggestion',
            role: 'system',
            content: faz2Suggestion,
            timestamp: new Date(),
            isFaz2Suggestion: true
          };
          console.log('💡 Faz2 önerisi mesajlara eklendi:', suggestionMessage);
          return [...prev, suggestionMessage];
        }
        return prev;
      });
    } else {
      console.log('⚠️ LLMChat - faz2Suggestion boş veya geçersiz');
    }
  }, [faz2Suggestion]);

  // LLM response'undan text çıkarma fonksiyonu
  const extractTextFromField = (field: any): string => {
    if (typeof field === 'string') {
      return field.trim();
    } else if (field && typeof field === 'object') {
      // Array kontrolü (örn: content[0].text)
      if (Array.isArray(field) && field.length > 0) {
        // İlk element'i kontrol et
        return extractTextFromField(field[0]);
      }
      // Object kontrolü (nested yapılar için)
      if (field.text) {
        return extractTextFromField(field.text);
      }
      if (field.content) {
        return extractTextFromField(field.content);
      }
      if (field.message) {
        return extractTextFromField(field.message);
      }
      if (field.value) {
        return extractTextFromField(field.value);
      }
      // Eğer hiçbiri yoksa JSON olarak döndür
      return JSON.stringify(field, null, 2);
    }
    return String(field || '');
  };

  // Deep search for text content
  const deepSearchForText = (obj: any): string => {
    if (typeof obj === 'string') {
      return obj;
    }
    
    if (obj && typeof obj === 'object') {
      // Sırayla anahtar değerleri kontrol et
      const searchKeys = ['text', 'content', 'message', 'response', 'output', 'result', 'value'];
      
      for (const key of searchKeys) {
        if (obj[key] !== undefined) {
          const result = extractTextFromField(obj[key]);
          if (result && result.trim() !== '') {
            return result;
          }
        }
      }
      
      // Hiçbir şey bulunamadıysa tüm obj'yi string yap
      return JSON.stringify(obj, null, 2);
    }
    
    return String(obj || 'Boş yanıt');
  };

  // Text content formatlaması (frontend'de)
  const formatTextContent = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    // Eğer zaten satır sonları varsa, sadece temizle
    if (text.includes('\n')) {
      return text.trim();
    }
    
    // Satır sonları yoksa, cümle sonlarına ekle
    return text
      // Nokta + boşluk + büyük harf -> paragraf
      .replace(/\.\s+([A-ZÇĞIİÖŞÜĞ])/g, '.\n\n$1')
      // Soru işareti + boşluk + büyük harf -> paragraf
      .replace(/\?\s+([A-ZÇĞIİÖŞÜĞ])/g, '?\n\n$1')
      // Ünlem işareti + boşluk + büyük harf -> paragraf
      .replace(/!\s+([A-ZÇĞIİÖŞÜĞ])/g, '!\n\n$1')
      // Fazla boşlukları temizle
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle send message with n8n webhook
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const webhookUrl = getWebhookUrl();
      console.log('🔄 n8n webhook\'una mesaj gönderiliyor...');
      console.log('🌐 Webhook URL:', webhookUrl);
      console.log('🔧 Mode:', process.env.REACT_APP_WEBHOOK_MODE || 'production');
      
      // Kullanıcı bilgisi
      const currentUser = authService.getUser();
      
      // Tüm modal içeriklerini topla - SADECE HOOK'LARDAN
      console.log('💡 Hook\'lardan tüm modal içerikleri alınıyor (güncel veriler)');
      const allModalContents = getAllModalContents ? getAllModalContents() : {};
      
      console.log('🔍 Selected File:', selectedFile?.name || 'YOK');
      console.log('📊 Hook\'lardan alınan modal sayısı:', Object.keys(allModalContents).length);
      
      // DEBUG: İçerikleri kontrol et
      console.log('🔍 DEBUG sectionId:', sectionId);
      console.log('🔍 DEBUG sectionContent:', sectionContent);
      console.log('🔍 DEBUG allModalContents keys:', Object.keys(allModalContents));
      console.log('🔍 DEBUG allModalContents[sectionId]:', allModalContents[sectionId || 'unknown']);
      console.log('🔍 DEBUG PROBLEM: sectionContent vs state content match?', 
        sectionContent === allModalContents[sectionId || 'unknown']?.content);
      
      // Güncel modal verisini oluştur
      const currentModalFresh = {
        title: sectionTitle,
        id: sectionId || 'unknown',
        content: sectionContent || '',
        timestamp: new Date().toISOString()
      };
      
      console.log('🎯 DEBUG - currentModalFresh:', {
        id: currentModalFresh.id,
        title: currentModalFresh.title,
        contentLength: currentModalFresh.content.length,
        contentPreview: currentModalFresh.content.substring(0, 200)
      });

      // AllModalContents'i güncel currentModal ile güncelle
      const currentModalData = allModalContents[sectionId || 'unknown'] || {};
      
      // Her durumda tüm modalleri gönder (DB'den veya hook'lardan)
      console.log('📤 Tüm modaller gönderiliyor (DB veya hook\'lardan)');
      const updatedAllModalContents = {
        ...allModalContents,
        [sectionId || 'unknown']: {
          ...currentModalData,
          title: currentModalFresh.title,
          content: currentModalFresh.content, // GÜNCEL İÇERİK ZORLA
          // Eğer tablo modalı ise tableData'yı koru
          ...(currentModalData.tableData && { tableData: currentModalData.tableData }),
          timestamp: currentModalFresh.timestamp
        }
      };
      
      // Temiz serializable format için sadece gerekli alanları seç
      const cleanAllModalsContent = Object.fromEntries(
        Object.entries(updatedAllModalContents).map(([key, modal]: [string, any]) => {
          console.log(`🧹 Cleaning modal ${key}:`, {
            hasContent: !!modal.content,
            contentLength: modal.content?.length || 0,
            hasTableData: !!modal.tableData,
            title: modal.title
          });
          
          return [
            key,
            {
              id: modal.id || key,
              title: modal.title || '',
              content: modal.content || '',
              tableData: modal.tableData || null,
              isProcessed: modal.isProcessed || false,
              isLoading: modal.isLoading || false,
              timestamp: modal.timestamp || null
            }
          ];
        })
      );
      
      console.log('✅ cleanAllModalsContent created:', Object.keys(cleanAllModalsContent));
      console.log('✅ cleanAllModalsContent sample (amac-kapsam):', JSON.stringify(cleanAllModalsContent['amac-kapsam'], null, 2));
      console.log('✅ cleanAllModalsContent sample (mevcut-isleyis):', JSON.stringify(cleanAllModalsContent['mevcut-isleyis'], null, 2));
      console.log('✅ cleanAllModalsContent sample (planlanan-isleyis):', JSON.stringify(cleanAllModalsContent['planlanan-isleyis'], null, 2));
      
      // Webhook payload - Ayrılmış parametreler
      const payload = {
        // Kullanıcı mesajı
        message: userInput,
        
        // Kullanıcı ID
        user_id: currentUser?.id || null,
        
        // Mevcut modal içeriği (aktif olan modal)
        currentModal: currentModalFresh,
        
        // Tüm sistem içeriği (tablolar dahil) - GÜNCEL VE TEMİZ HALİ (kullanıcıya özel)
        allModalsContent: cleanAllModalsContent,
        
        // Sistem context bilgileri
        systemContext: {
          totalModals: Object.keys(cleanAllModalsContent).length,
          activeModalId: sectionId || 'unknown',
          activeModalTitle: sectionTitle,
          hasProcessedDocx: Object.values(cleanAllModalsContent).some((modal: any) => modal.isProcessed),
          processedModalsCount: Object.values(cleanAllModalsContent).filter((modal: any) => modal.isProcessed).length,
          modalsWithContent: Object.values(cleanAllModalsContent).filter((modal: any) => modal.content?.length > 0 || modal.tableData).length,
          processingStatus: Object.fromEntries(
            Object.entries(cleanAllModalsContent).map(([key, modal]: [string, any]) => [
              key, 
              {
                hasTextContent: (modal.content?.length || 0) > 0,
                hasTableData: !!modal.tableData,
                isProcessed: modal.isProcessed,
                isLoading: modal.isLoading
              }
            ])
          )
        }
      };
      
      console.log('📤 Payload:', payload);
      console.log('📤 Payload.allModalsContent type:', typeof payload.allModalsContent);
      console.log('📤 Payload.allModalsContent keys:', Object.keys(payload.allModalsContent));
      console.log('📤 Payload.allModalsContent serialization test:');
      try {
        const serialized = JSON.stringify(payload);
        console.log('✅ Serialization başarılı, boyut:', serialized.length, 'bytes');
        console.log('📤 Payload JSON (ilk 2000 karakter):', serialized.substring(0, 2000));
      } catch (e) {
        console.error('❌ Serialization hatası:', e);
      }

      // n8n webhook'una POST request (timeout ile)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 saniye timeout
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📡 Webhook response status:', response.status);
      console.log('📡 Webhook response statusText:', response.statusText);
      console.log('📡 Webhook response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`Webhook error: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📄 Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed response data:', data);
      } catch (parseError) {
        console.warn('⚠️ Response is not JSON, using as plain text:', responseText);
        data = { response: responseText };
      }

      // n8n'den gelen response'u parse et
      console.log('🔍 Data type:', typeof data);
      console.log('🔍 Data keys:', data ? Object.keys(data) : 'No data');
      console.log('🔍 Full data object:', JSON.stringify(data, null, 2));
      
      let assistantResponse = '';
      
      // Farklı response formatlarını kontrol et
      if (typeof data === 'string') {
        assistantResponse = data;
      } else if (data && typeof data === 'object') {
        // LLM node'undan gelen content yapısını parse et
        if (data.response !== undefined) {
          assistantResponse = extractTextFromField(data.response);
        } else if (data.message !== undefined) {
          assistantResponse = extractTextFromField(data.message);
        } else if (data.content !== undefined) {
          assistantResponse = extractTextFromField(data.content);
        } else if (data.text !== undefined) {
          assistantResponse = extractTextFromField(data.text);
        } else if (data.output !== undefined) {
          assistantResponse = extractTextFromField(data.output);
        } else if (data.result !== undefined) {
          assistantResponse = extractTextFromField(data.result);
        } else {
          // Hiçbir bilinen format değilse, tüm data'yı kontrol et
          console.warn('⚠️ Bilinmeyen response formatı, deep search yapılıyor');
          assistantResponse = deepSearchForText(data);
        }
      } else {
        assistantResponse = 'Üzgünüm, şu anda bir yanıt oluşturamıyorum. Lütfen tekrar deneyin.';
      }
      
      console.log('✅ Final assistant response:', assistantResponse);
      console.log('✅ Assistant response type:', typeof assistantResponse);
      console.log('✅ Assistant response length:', assistantResponse?.length || 0);

      // Boş response kontrolü ve frontend formatlaması
      if (!assistantResponse || assistantResponse.trim() === '') {
        console.warn('⚠️ Boş response alındı, fallback mesaj kullanılıyor');
        assistantResponse = `🤖 n8n workflow'undan boş yanıt alındı.\n\n🔧 Kontrol edilecekler:\n• LLM node'u çalışıyor mu?\n• "Respond to Webhook" body'sinde doğru field kullanılıyor mu?\n\n📋 Alınan raw data:\n${JSON.stringify(data, null, 2)}`;
      } else {
        // Frontend'de formatlamalama yap
        assistantResponse = formatTextContent(assistantResponse);
      }

      // Message object'inin content'inin string olduğunu garanti et
      let finalContent = '';
      if (typeof assistantResponse === 'string') {
        finalContent = assistantResponse;
      } else if (assistantResponse && typeof assistantResponse === 'object') {
        // Object ise detaylı string'e çevir
        finalContent = `🔧 Object Response Received:\n${JSON.stringify(assistantResponse, null, 2)}`;
      } else {
        finalContent = String(assistantResponse || 'Boş yanıt alındı');
      }
      
      console.log('✅ Final content type:', typeof finalContent);
      console.log('✅ Final content preview:', finalContent.substring(0, 100));
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('❌ n8n webhook hatası:', error);
      
      let errorDetails = 'Bilinmeyen hata';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorDetails = 'Zaman aşımı (30 saniye) - n8n workflow\'u çok uzun sürdü';
        } else if (error.message.includes('Failed to fetch')) {
          errorDetails = 'Bağlantı hatası - n8n server\'ına ulaşılamıyor. CORS veya network problemi olabilir.';
        } else {
          errorDetails = error.message;
        }
      }

      // Hata durumunda fallback mesaj
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `🚫 AI servisine ulaşılamıyor:\n\n${errorDetails}\n\n🔧 Kontrol edilecekler:\n• n8n server'ı çalışıyor mu? (http://localhost:5678)\n• Webhook aktif mi?\n• CORS ayarları doğru mu?\n• Workflow'da hata var mı?`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format message content with proper line breaks and formatting
  const formatMessageContent = (content: string) => {
    // Önce mevcut \n karakterlerini işle
    let formattedContent = content;
    
    // Eğer \n karakteri yoksa, cümle sonlarına satır sonu ekle
    if (!content.includes('\n')) {
      formattedContent = content
        // Soru işaretinden sonra satır sonu
        .replace(/\?\s+/g, '?\n\n')
        // Nokta + büyük harften önce satır sonu (yeni paragraf başlangıcı)
        .replace(/\.\s+([A-ZÇĞıİÖŞÜ])/g, '.\n\n$1')
        // Ünlem işaretinden sonra satır sonu
        .replace(/!\s+/g, '!\n\n');
    }
    
    return formattedContent.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line.trim()}
        {index < formattedContent.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`llm-chat ${className}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <div className="chat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="10" r="1" fill="currentColor"/>
              <circle cx="15" cy="10" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h3>AI Asistan</h3>
            <span className="chat-subtitle">{sectionTitle}</span>
          </div>
        </div>
        <div className="chat-status">
          <div className="status-dot online"></div>
          <span>Çevrimiçi</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${
              message.role === 'user' ? 'user-message' : 
              message.role === 'system' ? 'system-message' : 
              'assistant-message'
            }`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? (
                <div className="user-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              ) : message.role === 'system' ? (
                <div className="system-avatar">
                  💡
                </div>
              ) : (
                <div className="ai-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12h8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="message-content">
              {message.isFaz2Suggestion && (
                <div className="faz2-badge">Faz2 Aktarım Önerisi</div>
              )}
              <div className="message-bubble">
                <div className="message-text">
                  {typeof message.content === 'string' ? 
                    formatMessageContent(message.content)
                    : JSON.stringify(message.content)
                  }
                </div>
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-avatar">
              <div className="ai-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12h8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <div className="message-content">
              <div className="message-bubble loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="ai-status">n8n ile bağlantı kuruluyor...</div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`${sectionTitle} hakkında bir soru sorun...`}
            className="chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="input-help">
          <span>Enter ile gönder, Shift+Enter ile yeni satır</span>
        </div>
      </div>
    </div>
  );
};

export default LLMChat;
