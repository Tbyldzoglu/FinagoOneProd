/**
 * LLM Tabanlı Gereksinim Analizi Bileşeni
 * AI destekli gereksinim analizi ve faz1'e aktarım sistemi
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import '../styles/LLMRequirementAnalysis.css';
import mammoth from 'mammoth';
import { getModalContentForChat } from '../services/databaseService';
import authService from '../services/authService';

interface AnalysisState {
  status: 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
}

interface GeneratedContent {
  amac_kapsam: string;
  confidence: number;
  tokens_used: number;
  generation_time: number;
}

interface LLMRequirementAnalysisProps {
  onNavigate?: (page: string) => void;
}

const LLMRequirementAnalysis: React.FC<LLMRequirementAnalysisProps> = ({ onNavigate }) => {
  // State yönetimi
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
    currentStep: ''
  });
  const [isTransferring, setIsTransferring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sayfa yüklendiğinde localStorage'daki Faz2 önerilerini temizle
  useEffect(() => {
    console.log('🧹 LLM Requirement Analysis yüklendi, Faz2 önerilerini temizliyorum...');
    localStorage.removeItem('faz2_suggestions');
    localStorage.removeItem('faz1_transfer_data');
  }, []); // Boş dependency array - sadece component mount olduğunda çalışır

  /**
   * Dosya seçim işleyicisi
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setSelectedFile(file);
    } else {
      alert('Lütfen geçerli bir DOCX dosyası seçin.');
    }
  }, []);

  /**
   * Dosya yükleme ve analiz başlatma
   */
  const handleAnalyzeDocument = useCallback(async () => {
    if (!selectedFile) return;

    console.log('🚀 handleAnalyzeDocument BAŞLADI');
    console.log('📝 additionalNotes STATE değeri:', additionalNotes);
    console.log('📝 additionalNotes length:', additionalNotes.length);

    setAnalysisState({
      status: 'uploading',
      progress: 10,
      currentStep: 'Doküman yükleniyor...'
    });

    try {
      // 1. DOCX'i structured JSON'a çevir
      const structuredData = await extractStructuredFromDocx(selectedFile);
      
      setAnalysisState({
        status: 'analyzing',
        progress: 30,
        currentStep: 'AI analizi başlatılıyor...'
      });

      console.log('📊 Structured data:', {
        elements: structuredData.stats.totalElements,
        characters: structuredData.stats.totalCharacters,
        hasTables: structuredData.stats.hasTables,
        hasLists: structuredData.stats.hasLists
      });

      // 2. Faz1 formatına çevir
      const faz1Format = convertToFaz1Format(structuredData);
      console.log('🔄 Faz1 format conversion:', {
        fields: Object.keys(faz1Format).length,
        hasAmacKapsam: !!faz1Format.amac_kapsam,
        hasFonksiyonel: !!faz1Format.fonksiyonel_gereksinimler
      });

      // 3. N8N webhook'una Faz1 uyumlu format gönder
      const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_GEREKSINIM_ANALIZ || `${process.env.REACT_APP_N8N_WEBHOOK_URL}/webhook-test/GereksinimdenAnaliz`;
      const currentUser = authService.getUser();
      
      console.log('🔍 DEBUG additionalNotes:', {
        raw: additionalNotes,
        trimmed: additionalNotes.trim(),
        final: additionalNotes.trim() || null,
        length: additionalNotes.length
      });
      
      const payload = {
        fileName: selectedFile.name,
        documentStructure: structuredData,  // Original structured data
        faz1Format: faz1Format,           // Faz1 uyumlu format
        analysisType: 'amac_kapsam',
        timestamp: new Date().toISOString(),
        user_id: currentUser?.id || null,  // Kullanıcı ID'si
        additionalNotes: additionalNotes.trim() || null  // Kullanıcının ek notları
      };

      console.log('📤 Gönderilen payload.additionalNotes:', payload.additionalNotes);

      setAnalysisState(prev => ({
        ...prev,
        progress: 50,
        currentStep: 'LLM analizi devam ediyor...'
      }));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const result = await response.json();

       // LLM response'unu parse et
       let llmResponse;
       try {
         // LLM'den gelen JSON string'i parse et
         const responseText = result.generated_content || result.response || '';
         if (responseText.includes('```json')) {
           // Markdown JSON block'undan JSON'u çıkar
           const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
           if (jsonMatch) {
             llmResponse = JSON.parse(jsonMatch[1]);
             // Timestamp'i ekle
             llmResponse.timestamp = new Date().toISOString();
           }
         } else {
           // Direkt JSON parse dene
           llmResponse = JSON.parse(responseText);
           llmResponse.timestamp = new Date().toISOString();
         }
       } catch (parseError) {
         console.warn('LLM response parse edilemedi, fallback kullanılıyor:', parseError);
         llmResponse = {
           title: 'Amaç ve Kapsam',
           content: result.generated_content || result.response || 'Analiz tamamlandı ancak içerik alınamadı.',
           validation: {
             found: true,
             mode: 'strict',
             errors: [],
             warnings: [],
             matchedLabels: ['amac_kapsam_basligi']
           },
           isProcessed: true,
           timestamp: new Date().toISOString()
         };
       }

       // Sonucu state'e kaydet
       const content: GeneratedContent = {
         amac_kapsam: llmResponse.content,
         confidence: result.confidence || 0.85,
         tokens_used: result.tokens_used || 0,
         generation_time: result.generation_time || 0
       };

      // Faz2 database'e kaydet - SADECE GERÇEK VERİ İÇERENLER
      if (content.amac_kapsam && content.amac_kapsam !== 'Analiz tamamlandı ancak içerik alınamadı.') {
        try {
          await fetch(`${process.env.REACT_APP_DATABASE_API_URL}/api/analiz-faz2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gereksinim_amac_kapsam: content.amac_kapsam,
              yuklenen_dokuman: selectedFile.name,
              llm_model: 'openai-gpt-4',
              generation_status: 'completed',
              total_tokens_used: content.tokens_used,
              generation_time_seconds: content.generation_time,
              confidence_score: content.confidence
            })
          });
          console.log('✅ Faz2 database kaydı tamamlandı');
          
          // Analiz tamamlandı
          setAnalysisState({
            status: 'completed',
            progress: 100,
            currentStep: '✅ Analiz tamamlandı ve veritabanına kaydedildi!'
          });
        } catch (dbError) {
          console.warn('⚠️ Faz2 veritabanı kaydı başarısız:', dbError);
          setAnalysisState({
            status: 'completed',
            progress: 100,
            currentStep: '⚠️ Analiz tamamlandı ama veritabanına kaydedilemedi'
          });
        }
      } else {
        console.log('⚠️ Geçersiz veri - Faz2\'ye kaydedilmedi');
        setAnalysisState({
          status: 'completed',
          progress: 100,
          currentStep: '⚠️ Analiz tamamlandı ama içerik alınamadı'
        });
      }

    } catch (error) {
      console.error('❌ Analiz hatası:', error);
      setAnalysisState({
        status: 'error',
        progress: 100,
        currentStep: `❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      });
    }
  }, [selectedFile, additionalNotes]);

  /**
   * Faz1'e aktarma işlemi - En yüksek ID'li Faz2 kaydından tüm modal bilgilerini aktar
   */
  const handleTransferToPhase1 = useCallback(async () => {
    setIsTransferring(true);

    try {
      // Önce kullanıcının en yüksek ID'li Faz2 kaydını al
      const currentUser = authService.getUser();
      const userId = currentUser?.id;
      
      console.log('🔍 Faz2 latest çağrılıyor...');
      console.log('👤 Current User:', currentUser);
      console.log('👤 User ID:', userId);
      
      if (!userId) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }
      
      const url = `${process.env.REACT_APP_DATABASE_API_URL}/api/analiz-faz2/latest?user_id=${userId}`;
      console.log('📡 Request URL:', url);
      
      const faz2Response = await fetch(url);
      
      if (!faz2Response.ok) {
        throw new Error('Faz2 kaydı alınamadı');
      }

      const faz2Result = await faz2Response.json();
      
      if (!faz2Result.success || !faz2Result.data) {
        throw new Error('Faz2 verisi bulunamadı');
      }

      const faz2Data = faz2Result.data;
      console.log('📋 En yüksek ID\'li Faz2 kaydı alındı:', faz2Data.id);
      
      // DEBUG: Faz2 verilerini kontrol et
      console.log('🔍 DEBUG - Faz2 Muhasebe verisi:', faz2Data.gereksinim_muhasebe);
      console.log('🔍 DEBUG - Faz2 X İşlemi Muhasebe Deseni:', faz2Data.gereksinim_x_islemi_muhasebe_deseni);
      console.log('🔍 DEBUG - Faz2 X İşlemi Kayıt Kuralları:', faz2Data.gereksinim_x_islemi_kayit_kurallari);
      console.log('🔍 DEBUG - Faz2 X İşlemi Vergi Komisyon:', faz2Data.gereksinim_x_islemi_vergi_komisyon);
      console.log('🔍 DEBUG - Faz2 Fonksiyonel Olmayan:', faz2Data.gereksinim_fonksiyonel_olmayan_gereksinimler);
      console.log('🔍 DEBUG - Faz2 Kimlik Doğrulama:', faz2Data.gereksinim_kimlik_dogrulama_log);
      console.log('🔍 DEBUG - Faz2 Kapsam Dışında:', faz2Data.gereksinim_kapsam_disinda);
      console.log('🔍 DEBUG - Faz2 Ekler:', faz2Data.gereksinim_ekler);
      console.log('🔍 DEBUG - Faz2 Talep Bilgileri:', faz2Data.gereksinim_talep_bilgileri);
      console.log('🔍 DEBUG - Faz2 Doküman Tarihçesi:', faz2Data.gereksinim_dokuman_tarihcesi);
      console.log('🔍 DEBUG - Faz2 Talep Değerlendirmesi:', faz2Data.gereksinim_talep_degerlendirmesi);

      // Helper fonksiyon: Faz2'den gelen JSON'dan content çıkar ve Faz1 formatına çevir
      const createJsonField = (title: string, faz2JsonString: string | null | undefined): string => {
        if (!faz2JsonString || !faz2JsonString.trim()) {
          return '';
        }
        
        try {
          // Faz2'den gelen JSON string'i parse et
          const faz2Data = JSON.parse(faz2JsonString);
          const actualContent = faz2Data.content || faz2JsonString; // content varsa onu al, yoksa raw string'i al
          
          // Faz1 formatında JSON oluştur
          return JSON.stringify({
            title,
            content: actualContent,
            validation: { found: true, mode: 'strict', errors: [], warnings: [] },
            isProcessed: true,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn(`⚠️ ${title} JSON parse hatası, raw content kullanılıyor:`, error);
          // Parse edilemezse raw content'i kullan
          return JSON.stringify({
            title,
            content: faz2JsonString,
            validation: { found: true, mode: 'strict', errors: [], warnings: [] },
            isProcessed: true,
            timestamp: new Date().toISOString()
          });
        }
      };

      // Faz2 verilerini Faz1 formatına çevir - TÜM TEXT MODAL'LAR AKTARILACAK
      const faz1Data = {
        yuklenen_dokuman: faz2Data.yuklenen_dokuman || 'Faz2_Transfer',
        
        // Amaç kapsam dolu
        amac_kapsam: faz2Data.gereksinim_amac_kapsam ? JSON.stringify({
          title: 'Amaç ve Kapsam',
          content: faz2Data.gereksinim_amac_kapsam,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Mevcut işleyiş dolu
        mevcut_isleyis: faz2Data.gereksinim_mevcut_isleyis ? JSON.stringify({
          title: 'Mevcut İşleyiş',
          content: faz2Data.gereksinim_mevcut_isleyis,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Planlanan işleyiş dolu
        planlanan_isleyis: faz2Data.gereksinim_planlanan_isleyis ? JSON.stringify({
          title: 'Planlanan İşleyiş',
          content: faz2Data.gereksinim_planlanan_isleyis,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Fonksiyonel Gereksinimler dolu
        fonksiyonel_gereksinimler: faz2Data.gereksinim_fonksiyonel_gereksinimler ? JSON.stringify({
          title: 'Fonksiyonel Gereksinimler',
          content: faz2Data.gereksinim_fonksiyonel_gereksinimler,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Ekran Gereksinimleri dolu
        ekran_gereksinimleri: faz2Data.gereksinim_ekran_gereksinimleri ? JSON.stringify({
          title: 'Ekran Gereksinimleri',
          content: faz2Data.gereksinim_ekran_gereksinimleri,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // X Ekranı dolu
        x_ekrani: faz2Data.gereksinim_x_ekrani ? JSON.stringify({
          title: 'X Ekranı',
          content: faz2Data.gereksinim_x_ekrani,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Task İş Akışı dolu
        task_is_akisi: faz2Data.gereksinim_task_is_akisi ? JSON.stringify({
          title: 'Task İş Akışı',
          content: faz2Data.gereksinim_task_is_akisi,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Conversion Migration dolu
        conversation_migration: faz2Data.gereksinim_conversation_migration ? JSON.stringify({
          title: 'Conversion ve Migration',
          content: faz2Data.gereksinim_conversation_migration,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Diagram Akışlar dolu
        diagram_akislar: faz2Data.gereksinim_diagram_akislar ? JSON.stringify({
          title: 'Diagram ve Akışlar',
          content: faz2Data.gereksinim_diagram_akislar,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // Talep Bilgileri - Faz2'den aktarılacak
        talep_bilgileri: faz2Data.gereksinim_talep_bilgileri ? JSON.stringify({
          title: 'Talep Bilgileri',
          fields: (() => {
            try {
              // Faz2'den gelen veri ```json ile başlıyor olabilir, temizle
              let cleanData = faz2Data.gereksinim_talep_bilgileri;
              if (cleanData.startsWith('```json')) {
                const jsonMatch = cleanData.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                  cleanData = jsonMatch[1];
                }
              }
              const parsed = JSON.parse(cleanData);
              console.log('🔍 DEBUG - Talep Bilgileri parsed fields:', parsed.fields);
              return parsed.fields || {};
            } catch (error) {
              console.warn('⚠️ Talep Bilgileri JSON parse hatası:', error);
              return {};
            }
          })(),
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',
        
        // Doküman Tarihçesi - Faz2'den aktarılacak
        dokuman_tarihcesi: faz2Data.gereksinim_dokuman_tarihcesi ? JSON.stringify({
          title: 'Doküman Tarihçesi',
          rows: (() => {
            try {
              // Faz2'den gelen veri ```json ile başlıyor olabilir, temizle
              let cleanData = faz2Data.gereksinim_dokuman_tarihcesi;
              if (cleanData.startsWith('```json')) {
                const jsonMatch = cleanData.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                  cleanData = jsonMatch[1];
                }
              }
              const parsed = JSON.parse(cleanData);
              console.log('🔍 DEBUG - Doküman Tarihçesi parsed rows:', parsed.rows);
              return parsed.rows || [];
            } catch (error) {
              console.warn('⚠️ Doküman Tarihçesi JSON parse hatası:', error);
              return [];
            }
          })(),
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',
        
        // Talep Değerlendirmesi - Faz2'den aktarılacak
        talep_degerlendirmesi: faz2Data.gereksinim_talep_degerlendirmesi ? JSON.stringify({
          title: 'Talep Değerlendirmesi',
          content: faz2Data.gereksinim_talep_degerlendirmesi,
          validation: { found: true, mode: 'strict', errors: [], warnings: [] },
          isProcessed: true,
          timestamp: new Date().toISOString()
        }) : '',

        // TABLO MODAL'LAR - Faz2'den aktarılacak (createJsonField kullanarak)
        ekran_tasarimlari: createJsonField('Ekran Tasarımları', faz2Data.gereksinim_ekran_tasarimlari),
        tasklar_batchlar: createJsonField('Tasklar ve Batchlar', faz2Data.gereksinim_tasklar_batchlar),
        entegrasyonlar: createJsonField('Entegrasyonlar', faz2Data.gereksinim_entegrasyonlar),
        mesajlar: createJsonField('Mesajlar', faz2Data.gereksinim_mesajlar),
        parametreler: createJsonField('Parametreler', faz2Data.gereksinim_parametreler),
        
        // YENİ EKLENEN MODAL'LAR - Faz2'den aktarılacak (createJsonField kullanarak)
        muhasebe: createJsonField('Muhasebe', faz2Data.gereksinim_muhasebe),
        x_islemi_muhasebe_deseni: createJsonField('X İşlemi Muhasebe Deseni', faz2Data.gereksinim_x_islemi_muhasebe_deseni),
        x_islemi_kayit_kurallari: createJsonField('X İşlemi Kayıt Kuralları', faz2Data.gereksinim_x_islemi_kayit_kurallari),
        x_islemi_vergi_komisyon: createJsonField('X İşlemi Vergi Komisyon', faz2Data.gereksinim_x_islemi_vergi_komisyon),
        x_islemi_muhasebe_senaryolari: createJsonField('X İşlemi Muhasebe Senaryoları', faz2Data.gereksinim_x_islemi_muhasebe_senaryolari),
        x_islemi_ornek_kayitlar: createJsonField('X İşlemi Örnek Kayıtlar', faz2Data.gereksinim_x_islemi_ornek_kayitlar),
        fonksiyonel_olmayan_gereksinimler: createJsonField('Fonksiyonel Olmayan Gereksinimler', faz2Data.gereksinim_fonksiyonel_olmayan_gereksinimler),
        kimlik_dogrulama_log: createJsonField('Kimlik Doğrulama ve Log Yönetimi', faz2Data.gereksinim_kimlik_dogrulama_log),
        kapsam_disinda: createJsonField('Kapsam Dışında Kalan Konular/Maddeler', faz2Data.gereksinim_kapsam_disinda),
        ekler: createJsonField('Ekler', faz2Data.gereksinim_ekler),

        // DİĞER MODAL'LAR - Faz2'den aktarılacak (createJsonField kullanarak)
        x_islemi_muhasebesi: createJsonField('X İşlemi Muhasebesi', faz2Data.gereksinim_x_islemi_muhasebesi),
        case1: createJsonField('Case 1', faz2Data.gereksinim_case1),
        yetkilendirme_onay: createJsonField('Yetkilendirme ve Onay', faz2Data.gereksinim_yetkilendirme_onay),
        veri_kritikligi: createJsonField('Veri Kritikliği', faz2Data.gereksinim_veri_kritikligi),
        paydaslar_kullanicilar: createJsonField('Paydaşlar ve Kullanıcılar', faz2Data.gereksinim_paydaslar_kullanicilar),
        kabul_kriterleri: createJsonField('Kabul Kriterleri', faz2Data.gereksinim_kabul_kriterleri),
        onaylar: createJsonField('Onaylar', faz2Data.gereksinim_onaylar),
        
        // Kullanıcı bilgisi
        user_id: authService.getUser()?.id || null
      };

      // DEBUG: User ID kontrolü
      console.log('👤 FAZ1 TRANSFER - User ID:', faz1Data.user_id);
      console.log('👤 FAZ1 TRANSFER - Auth User:', authService.getUser());

      // DEBUG: Faz1'e gönderilen veriyi kontrol et
      console.log('🔍 DEBUG - Faz1\'e gönderilen Muhasebe:', faz1Data.muhasebe);
      console.log('🔍 DEBUG - Faz1\'e gönderilen X İşlemi Muhasebe Deseni:', faz1Data.x_islemi_muhasebe_deseni);
      console.log('🔍 DEBUG - Faz1\'e gönderilen X İşlemi Kayıt Kuralları:', faz1Data.x_islemi_kayit_kurallari);
      console.log('🔍 DEBUG - Faz1\'e gönderilen X İşlemi Vergi Komisyon:', faz1Data.x_islemi_vergi_komisyon);
      console.log('🔍 DEBUG - Faz1\'e gönderilen Talep Bilgileri:', faz1Data.talep_bilgileri);
      console.log('🔍 DEBUG - Faz1\'e gönderilen Doküman Tarihçesi:', faz1Data.dokuman_tarihcesi);
      console.log('🔍 DEBUG - Faz1\'e gönderilen Talep Değerlendirmesi:', faz1Data.talep_degerlendirmesi);

      // LLM Analysis (Faz1) API'sine gönder
      const transferResponse = await fetch(`${process.env.REACT_APP_DATABASE_API_URL}/api/analiz-faz1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(faz1Data)
      });

      if (!transferResponse.ok) {
        throw new Error('Faz1 transfer failed');
      }

      const transferResult = await transferResponse.json();
      console.log('✅ Faz1 transfer successful:', transferResult);

      // Başarı mesajı göster ve Faz1 sayfasına yönlendir
      alert(`✅ Faz2 kaydı (ID: ${faz2Data.id}) başarıyla Faz1'e aktarıldı!\n\nLLM Tabanlı Analiz sayfasına yönlendiriliyorsunuz...`);
      
      // Transfer edilen veriyi localStorage'a kaydet ki Faz1 sayfası yüklensin
      localStorage.setItem('faz1_transfer_data', JSON.stringify({
        transferred: true,
        timestamp: new Date().toISOString(),
        sourceId: faz2Data.id
      }));
      
      // Faz2 tablo modal önerilerini localStorage'a kaydet
      const faz2Suggestions: any = {};
      
      if (faz2Data.gereksinim_talep_degerlendirmesi) {
        faz2Suggestions.talepDegerlendirmesi = faz2Data.gereksinim_talep_degerlendirmesi;
      }
      if (faz2Data.gereksinim_x_islemi_muhasebesi) {
        faz2Suggestions.xIslemiMuhasebesi = faz2Data.gereksinim_x_islemi_muhasebesi;
      }
      if (faz2Data.gereksinim_case1) {
        faz2Suggestions.case1 = faz2Data.gereksinim_case1;
      }
      if (faz2Data.gereksinim_muhasebe_masa) {
        faz2Suggestions.muhasebeMasa = faz2Data.gereksinim_muhasebe_masa;
      }
      if (faz2Data.gereksinim_entegrasyonlar) {
        faz2Suggestions.entegrasyonlar = faz2Data.gereksinim_entegrasyonlar;
      }
      if (faz2Data.gereksinim_mesajlar) {
        faz2Suggestions.mesajlar = faz2Data.gereksinim_mesajlar;
      }
      if (faz2Data.gereksinim_parametreler) {
        faz2Suggestions.parametreler = faz2Data.gereksinim_parametreler;
      }
      if (faz2Data.gereksinim_ekran_tasarimlari) {
        faz2Suggestions.ekranTasarimlari = faz2Data.gereksinim_ekran_tasarimlari;
      }
      if (faz2Data.gereksinim_tasklar_batchlar) {
        faz2Suggestions.tasklarBatchlar = faz2Data.gereksinim_tasklar_batchlar;
      }
      if (faz2Data.gereksinim_paydaslar_kullanicilar) {
        faz2Suggestions.paydaslarKullanicilar = faz2Data.gereksinim_paydaslar_kullanicilar;
      }
      if (faz2Data.gereksinim_veri_kritikligi) {
        faz2Suggestions.veriKritikligi = faz2Data.gereksinim_veri_kritikligi;
      }
      if (faz2Data.gereksinim_yetkilendirme_onay) {
        faz2Suggestions.yetkilendirmeOnay = faz2Data.gereksinim_yetkilendirme_onay;
      }
      if (faz2Data.gereksinim_kabul_kriterleri) {
        faz2Suggestions.kabulKriterleri = faz2Data.gereksinim_kabul_kriterleri;
      }
      if (faz2Data.gereksinim_onaylar) {
        faz2Suggestions.onaylar = faz2Data.gereksinim_onaylar;
      }
      
      localStorage.setItem('faz2_suggestions', JSON.stringify(faz2Suggestions));
      console.log('✅ Faz2 önerileri localStorage\'a kaydedildi:', Object.keys(faz2Suggestions));
      console.log('🔍 DEBUG - faz2Suggestions içeriği:', faz2Suggestions);
      
      // Hemen kontrol et yazıldı mı
      const checkStorage = localStorage.getItem('faz2_suggestions');
      console.log('🔍 DEBUG - localStorage\'dan okunan:', checkStorage);
      
      // 1.5 saniye sonra Faz1 sayfasına yönlendir
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('llm-tabani-analiz');
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Transfer hatası:', error);
      alert('❌ Transfer sırasında hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsTransferring(false);
    }
  }, []);

  /**
   * Dosyayı base64'e çevirme
   */
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // data:application/...;base64, prefix'ini kaldır
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  // DOCX'i structured JSON'a çevir
  const extractStructuredFromDocx = async (file: File): Promise<any> => {
    try {
      console.log('📄 DOCX structured parse başlatılıyor...');
      
      // ArrayBuffer'a çevir
      const arrayBuffer = await file.arrayBuffer();
      
      // Mammoth ile hem HTML hem text çıkar
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      
      console.log('✅ DOCX HTML parse başarılı');
      
      // HTML'i structured JSON'a çevir
      const structuredContent = parseHtmlToStructured(htmlResult.value);
      
      return {
        success: true,
        document: {
          metadata: {
            source: file.name,
            extractedAt: new Date().toISOString(),
            method: 'mammoth_html_parsing',
            originalSize: arrayBuffer.byteLength
          },
          content: structuredContent,
          rawText: textResult.value,
          htmlContent: htmlResult.value
        },
        stats: {
          totalElements: structuredContent.length,
          totalCharacters: textResult.value.length,
          hasImages: htmlResult.value.includes('<img'),
          hasTables: htmlResult.value.includes('<table'),
          hasLists: htmlResult.value.includes('<ul') || htmlResult.value.includes('<ol')
        }
      };
      
    } catch (error) {
      console.error('❌ DOCX structured parse hatası:', error);
      throw new Error('DOCX dosyası parse edilemedi');
    }
  };

  // HTML'i structured JSON'a parse et
  const parseHtmlToStructured = (html: string): any[] => {
    const elements: any[] = [];
    
    // Block element regex
    const blockRegex = /<(h[1-6]|p|table|ul|ol|div|blockquote)[^>]*?>([\s\S]*?)<\/\1>/gi;
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi;
    
    let match;
    let lastIndex = 0;
    
    // Parse block elements
    while ((match = blockRegex.exec(html)) !== null) {
      const [fullMatch, tagName, content] = match;
      const cleanContent = cleanHtmlText(content);
      
      if (cleanContent.trim()) {
        const element: any = {
          type: getElementType(tagName),
          content: cleanContent
        };
        
        // Special handling
        if (tagName === 'table') {
          element.tableData = parseTable(fullMatch);
        } else if (tagName === 'ul' || tagName === 'ol') {
          element.listItems = parseList(fullMatch);
          element.listType = tagName === 'ul' ? 'unordered' : 'ordered';
        } else if (tagName.match(/h[1-6]/)) {
          element.level = parseInt(tagName.charAt(1));
        }
        
        elements.push(element);
      }
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Parse images
    let imageMatch;
    while ((imageMatch = imageRegex.exec(html)) !== null) {
      elements.push({
        type: 'image',
        src: imageMatch[1],
        alt: imageMatch[2] || ''
      });
    }
    
    return elements;
  };

  // Element type helper
  const getElementType = (tagName: string): string => {
    const typeMap: { [key: string]: string } = {
      'h1': 'heading', 'h2': 'heading', 'h3': 'heading',
      'h4': 'heading', 'h5': 'heading', 'h6': 'heading',
      'p': 'paragraph', 'table': 'table', 'ul': 'list',
      'ol': 'list', 'div': 'section', 'blockquote': 'quote'
    };
    return typeMap[tagName] || 'text';
  };

  // Parse table helper
  const parseTable = (tableHtml: string): string[][] => {
    const rows: string[][] = [];
    const rowRegex = /<tr[^>]*?>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<t[hd][^>]*?>([\s\S]*?)<\/t[hd]>/gi;
    
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const cells: string[] = [];
      let cellMatch;
      
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cleanHtmlText(cellMatch[1]));
      }
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    return rows;
  };

  // Parse list helper
  const parseList = (listHtml: string): string[] => {
    const items: string[] = [];
    const itemRegex = /<li[^>]*?>([\s\S]*?)<\/li>/gi;
    
    let itemMatch;
    while ((itemMatch = itemRegex.exec(listHtml)) !== null) {
      const itemText = cleanHtmlText(itemMatch[1]);
      if (itemText.trim()) {
        items.push(itemText);
      }
    }
    
    return items;
  };

  // Clean HTML text
  const cleanHtmlText = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Structured JSON'u Faz1 Database formatına çevir (JSON structure ile)
  const convertToFaz1Format = (structuredData: any): any => {
    const document = structuredData.document;
    const content = document.content;
    
    // Faz1 field mapping - JSON structure format
    const faz1Fields = {
      amac_kapsam: {
        title: 'Amaç ve Kapsam',
        content: '',
        validation: {
          found: false,
          mode: 'strict',
          errors: [],
          warnings: [],
          matchedLabels: ['amac_kapsam_basligi']
        },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      talep_bilgileri: {
        title: 'Talep Bilgileri',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      dokuman_tarihcesi: {
        title: 'Doküman Tarihçesi',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      talep_degerlendirmesi: {
        title: 'Talep Değerlendirmesi',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      mevcut_isleyis: {
        title: 'Mevcut İşleyiş',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      planlanan_isleyis: {
        title: 'Planlanan İşleyiş',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      fonksiyonel_gereksinimler: {
        title: 'Fonksiyonel Gereksinimler',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      ekran_gereksinimleri: {
        title: 'Ekran Gereksinimleri',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      x_ekrani: {
        title: 'X Ekranı',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      ekran_tasarimlari: {
        title: 'Ekran Tasarımları',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      tasklar_batchlar: {
        title: 'Tasklar ve Batchlar',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      task_is_akisi: {
        title: 'Task İş Akışı',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      entegrasyonlar: {
        title: 'Entegrasyonlar',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      mesajlar: {
        title: 'Mesajlar',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      parametreler: {
        title: 'Parametreler',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      conversation_migration: {
        title: 'Conversation Migration',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      diagram_akislar: {
        title: 'Diagram Akışları',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      muhasebe: {
        title: 'Muhasebe',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      x_islemi_muhasebesi: {
        title: 'X İşlemi Muhasebesi',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      x_islemi_muhasebe_deseni: {
        title: 'X İşlemi Muhasebe Deseni',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      case1: {
        title: 'Case 1',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      x_islemi_kayit_kurallari: {
        title: 'X İşlemi Kayıt Kuralları',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      x_islemi_vergi_komisyon: {
        title: 'X İşlemi Vergi Komisyon',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      x_islemi_muhasebe_senaryolari: {
        title: 'X İşlemi Muhasebe Senaryoları',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      x_islemi_ornek_kayitlar: {
        title: 'X İşlemi Örnek Kayıtlar',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      fonksiyonel_olmayan_gereksinimler: {
        title: 'Fonksiyonel Olmayan Gereksinimler',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      kimlik_dogrulama_log: {
        title: 'Kimlik Doğrulama Log',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      yetkilendirme_onay: {
        title: 'Yetkilendirme Onay',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      veri_kritikligi: {
        title: 'Veri Kritikliği',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      paydaslar_kullanicilar: {
        title: 'Paydaşlar Kullanıcılar',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      kapsam_disinda: {
        title: 'Kapsam Dışında',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      kabul_kriterleri: {
        title: 'Kabul Kriterleri',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      onaylar: {
        title: 'Onaylar',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      },
      ekler: {
        title: 'Ekler',
        content: '',
        validation: { found: false, mode: 'strict', errors: [], warnings: [], matchedLabels: [] },
        isProcessed: true,
        timestamp: new Date().toISOString()
      }
    };

    // Content'i analiz ederek field'lara map et
    content.forEach((element: any) => {
      if (element.type === 'heading') {
        const heading = element.content.toLowerCase();
        
        // Başlıklara göre mapping - JSON content field'ına ekleme
        if (heading.includes('amaç') || heading.includes('kapsam')) {
          faz1Fields.amac_kapsam.content += element.content + '\n';
          faz1Fields.amac_kapsam.validation.found = true;
        } else if (heading.includes('talep') || heading.includes('bilgi')) {
          faz1Fields.talep_bilgileri.content += element.content + '\n';
          faz1Fields.talep_bilgileri.validation.found = true;
        } else if (heading.includes('tarihçe') || heading.includes('geçmiş')) {
          faz1Fields.dokuman_tarihcesi.content += element.content + '\n';
          faz1Fields.dokuman_tarihcesi.validation.found = true;
        } else if (heading.includes('değerlendirme') || heading.includes('analiz')) {
          faz1Fields.talep_degerlendirmesi.content += element.content + '\n';
          faz1Fields.talep_degerlendirmesi.validation.found = true;
        } else if (heading.includes('mevcut') || heading.includes('şu an')) {
          faz1Fields.mevcut_isleyis.content += element.content + '\n';
          faz1Fields.mevcut_isleyis.validation.found = true;
        } else if (heading.includes('planlanan') || heading.includes('gelecek')) {
          faz1Fields.planlanan_isleyis.content += element.content + '\n';
          faz1Fields.planlanan_isleyis.validation.found = true;
        } else if (heading.includes('fonksiyonel') && !heading.includes('olmayan')) {
          faz1Fields.fonksiyonel_gereksinimler.content += element.content + '\n';
          faz1Fields.fonksiyonel_gereksinimler.validation.found = true;
        } else if (heading.includes('ekran')) {
          faz1Fields.ekran_gereksinimleri.content += element.content + '\n';
          faz1Fields.ekran_gereksinimleri.validation.found = true;
        } else if (heading.includes('task') || heading.includes('görev')) {
          faz1Fields.tasklar_batchlar.content += element.content + '\n';
          faz1Fields.tasklar_batchlar.validation.found = true;
        } else if (heading.includes('entegrasyon') || heading.includes('api')) {
          faz1Fields.entegrasyonlar.content += element.content + '\n';
          faz1Fields.entegrasyonlar.validation.found = true;
        } else if (heading.includes('mesaj') || heading.includes('bildirim')) {
          faz1Fields.mesajlar.content += element.content + '\n';
          faz1Fields.mesajlar.validation.found = true;
        } else if (heading.includes('parametre') || heading.includes('ayar')) {
          faz1Fields.parametreler.content += element.content + '\n';
          faz1Fields.parametreler.validation.found = true;
        } else if (heading.includes('muhasebe')) {
          faz1Fields.muhasebe.content += element.content + '\n';
          faz1Fields.muhasebe.validation.found = true;
        } else if (heading.includes('güvenlik') || heading.includes('kimlik')) {
          faz1Fields.kimlik_dogrulama_log.content += element.content + '\n';
          faz1Fields.kimlik_dogrulama_log.validation.found = true;
        } else if (heading.includes('yetki') || heading.includes('onay')) {
          faz1Fields.yetkilendirme_onay.content += element.content + '\n';
          faz1Fields.yetkilendirme_onay.validation.found = true;
        } else if (heading.includes('kritik') || heading.includes('veri')) {
          faz1Fields.veri_kritikligi.content += element.content + '\n';
          faz1Fields.veri_kritikligi.validation.found = true;
        } else if (heading.includes('paydaş') || heading.includes('kullanıcı')) {
          faz1Fields.paydaslar_kullanicilar.content += element.content + '\n';
          faz1Fields.paydaslar_kullanicilar.validation.found = true;
        } else if (heading.includes('kapsam dışı') || heading.includes('hariç')) {
          faz1Fields.kapsam_disinda.content += element.content + '\n';
          faz1Fields.kapsam_disinda.validation.found = true;
        } else if (heading.includes('kabul') || heading.includes('kriter')) {
          faz1Fields.kabul_kriterleri.content += element.content + '\n';
          faz1Fields.kabul_kriterleri.validation.found = true;
        }
      } else if (element.type === 'paragraph') {
        // Paragraph içeriğine göre akıllı dağıtım
        const content = element.content.toLowerCase();
        
        if (content.includes('amaç') || content.includes('hedef')) {
          faz1Fields.amac_kapsam.content += element.content + '\n';
          faz1Fields.amac_kapsam.validation.found = true;
        } else if (content.includes('fonksiyonel gereksinim')) {
          faz1Fields.fonksiyonel_gereksinimler.content += element.content + '\n';
          faz1Fields.fonksiyonel_gereksinimler.validation.found = true;
        } else if (content.includes('ekran') || content.includes('arayüz')) {
          faz1Fields.ekran_gereksinimleri.content += element.content + '\n';
          faz1Fields.ekran_gereksinimleri.validation.found = true;
        } else {
          // Genel içerik - amac_kapsam'a ekle
          faz1Fields.amac_kapsam.content += element.content + '\n';
          faz1Fields.amac_kapsam.validation.found = true;
        }
      } else if (element.type === 'table') {
        // Tabloları temiz format'ta sakla - sadece tableData kullan
        let tableText = '📊 TABLO:\n';
        if (element.tableData && element.tableData.length > 0) {
          // Header row
          tableText += `📋 ${element.tableData[0].join(' | ')}\n`;
          tableText += '─'.repeat(50) + '\n';
          
          // Data rows
          element.tableData.slice(1).forEach((row: string[]) => {
            tableText += `   ${row.join(' | ')}\n`;
          });
        }
        faz1Fields.fonksiyonel_gereksinimler.content += tableText + '\n';
        faz1Fields.fonksiyonel_gereksinimler.validation.found = true;
      } else if (element.type === 'list') {
        // Listeleri structured format'ta sakla
        let listText = `LİSTE (${element.listType}):\n`;
        if (element.listItems) {
          element.listItems.forEach((item: string) => {
            listText += `• ${item}\n`;
          });
        }
        faz1Fields.fonksiyonel_gereksinimler.content += listText + '\n';
        faz1Fields.fonksiyonel_gereksinimler.validation.found = true;
      }
    });

    // Boş field'ları temizle - JSON structure'da content field'ını trim et
    Object.keys(faz1Fields).forEach(key => {
      const typedKey = key as keyof typeof faz1Fields;
      faz1Fields[typedKey].content = faz1Fields[typedKey].content.trim();
    });

    return {
      ...faz1Fields,
      yuklenen_dokuman: document.metadata.source,
      metadata: {
        originalStats: structuredData.stats,
        conversionMethod: 'structured_smart_mapping',
        convertedAt: new Date().toISOString()
      }
    };
  };

  /**
   * Yeniden analiz et
   */
  const handleResetAnalysis = useCallback(() => {
    setSelectedFile(null);
    setAdditionalNotes('');
    setAnalysisState({
      status: 'idle',
      progress: 0,
      currentStep: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="llm-requirement-analysis">
      {/* Header */}
      <div className="analysis-header">
        <div className="header-content">
          <h1>🔍 LLM Tabanlı Gereksinim Analizi</h1>
          <p>AI destekli gereksinim dokümanı analizi ve Faz1'e aktarım sistemi</p>
        </div>
        <div className="header-badge">
          <span className="badge ai">AI POWERED</span>
        </div>
      </div>

      <div className="analysis-body">
        {/* Dosya Yükleme Bölümü */}
        <div className="upload-section">
          <div className="section-header">
            <h3>📄 Gereksinim Dokümanı Yükle</h3>
            <p>DOCX formatındaki gereksinim dokümanınızı yükleyin</p>
          </div>

          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleFileSelect}
              className="file-input"
              id="docx-upload"
            />
            <label htmlFor="docx-upload" className="upload-label">
              <div className="upload-icon">📎</div>
              <div className="upload-text">
                {selectedFile ? (
                  <>
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </>
                ) : (
                  <>
                    <span>DOCX dosyası seçin veya sürükleyip bırakın</span>
                    <span className="file-hint">Maksimum 10MB</span>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Ek Bilgiler Text Alanı */}
          {selectedFile && analysisState.status === 'idle' && (
            <div className="additional-notes-section">
              <label htmlFor="additional-notes" className="notes-label">
                <span className="label-icon">📝</span>
                <span className="label-text">Ek Bilgiler ve Notlar</span>
                <span className="label-hint">(İsteğe Bağlı)</span>
              </label>
              <textarea
                id="additional-notes"
                className="additional-notes-input"
                placeholder="Doküman dışında eklemek istediğiniz bilgiler, özel gereksinimler, notlar veya açıklamalar..."
                value={additionalNotes}
                onChange={(e) => {
                  console.log('✏️ Textarea onChange:', e.target.value);
                  setAdditionalNotes(e.target.value);
                  console.log('✅ setAdditionalNotes çağrıldı:', e.target.value);
                }}
                rows={6}
              />
              <div className="notes-info">
                <span className="info-icon">💡</span>
                <span className="info-text">
                  Bu bilgiler AI analizi sırasında dikkate alınacaktır
                </span>
              </div>
            </div>
          )}

          {/* Analiz Başlat Butonu */}
          {selectedFile && analysisState.status === 'idle' && (
            <div className="action-buttons">
              <button 
                className="btn btn-primary analyze-btn"
                onClick={handleAnalyzeDocument}
              >
                <span className="btn-icon">🤖</span>
                <span>AI Analizi Başlat</span>
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleResetAnalysis}
              >
                <span>🔄 Sıfırla</span>
              </button>
            </div>
          )}
        </div>

        {/* Analiz Durumu */}
        {analysisState.status !== 'idle' && (
          <div className="analysis-status">
            <div className="status-header">
              <h3>🔄 Analiz Durumu</h3>
              <span className={`status-badge ${analysisState.status}`}>
                {analysisState.status === 'uploading' && '📤 Yükleniyor'}
                {analysisState.status === 'analyzing' && '🧠 Analiz Ediliyor'}
                {analysisState.status === 'completed' && '✅ Tamamlandı'}
                {analysisState.status === 'error' && '❌ Hata'}
              </span>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${analysisState.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{analysisState.currentStep}</span>
            </div>
          </div>
        )}

        {/* Faz1'e Aktarma */}
        {analysisState.status === 'completed' && (
          <div className="transfer-section">
            <div className="transfer-header">
              <h3>🚀 Faz1'e Aktarım</h3>
              <p>Oluşturulan içeriği LLM Tabanlı Analiz sayfasındaki "Amaç & Kapsam" modalına aktarın</p>
            </div>

            <div className="transfer-actions">
              <button 
                className="btn btn-success transfer-btn"
                onClick={handleTransferToPhase1}
                disabled={isTransferring}
              >
                {isTransferring ? (
                  <>
                    <span className="spinner"></span>
                    <span>Aktarılıyor...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📤</span>
                    <span>Faz1'e Aktar</span>
                  </>
                )}
              </button>

              <div className="transfer-info">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <span>Hedef: LLM Tabanlı Analiz → Amaç & Kapsam</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📄</span>
                  <span>Doküman: {selectedFile?.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LLMRequirementAnalysis;
