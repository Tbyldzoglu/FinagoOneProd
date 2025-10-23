import mammoth from 'mammoth';

// Türkçe karakter normalizasyonu
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/i c/g, 'ic')
    .replace(/t e f t i s/g, 'teftis');
}

interface XIslemiMuhasebeSenaryolariTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// X İŞLEMİ MUHASEBE SENARYOLARI metin başlığını bul
function findXIslemiMuhasebeSenaryolariTextHeader(doc: Document): Element | null {
  console.log('🔍 X İŞLEMİ MUHASEBE SENARYOLARI METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler - X İşlemi Muhasebe Senaryoları
    'x islemi muhasebe senaryolari',
    'x işlemi muhasebe senaryoları',
    'x islemi muhasebe senaryolari',
    'x işlemi muhasebe senaryolari',
    'x islemi muhasebe senaryolar',
    'x işlemi muhasebe senaryolar',
    'x islemi muhasebe senaryosu',
    'x işlemi muhasebe senaryosu',
    'x muhasebe senaryolari',
    'x muhasebe senaryoları',
    'x muhasebe senaryolar',
    'x muhasebe senaryosu',
    'x accounting scenarios',
    'x accounting scenario',
    'muhasebe senaryolari x',
    'muhasebe senaryoları x',
    'muhasebe senaryolar x',
    'accounting scenarios x',
    'accounting scenario x',
    // X İşlemi Muhasebe + Senaryo
    'x islemi muhasebe senaryo',
    'x işlemi muhasebe senaryo',
    'x muhasebe senaryo',
    'x accounting scenario',
    'x islemi senaryo',
    'x işlemi senaryo',
    'x senaryo muhasebe',
    'x scenario accounting',
    // Spesifik muhasebe senaryoları
    'x islemi muhasebe ornekleri',
    'x işlemi muhasebe örnekleri',
    'x islemi muhasebe durumlari',
    'x işlemi muhasebe durumları',
    'x islemi muhasebe vakalar',
    'x işlemi muhasebe vakalar',
    'x islemi muhasebe case',
    'x işlemi muhasebe case',
    'x muhasebe ornekleri',
    'x muhasebe örnekleri',
    'x muhasebe durumlari',
    'x muhasebe durumları',
    'x muhasebe vakalar',
    'x muhasebe case',
    'x accounting examples',
    'x accounting cases',
    'x accounting situations',
    // Senaryo odaklı terimler
    'muhasebe senaryolari',
    'muhasebe senaryoları',
    'muhasebe senaryolar',
    'muhasebe senaryosu',
    'accounting scenarios',
    'accounting scenario',
    'muhasebe ornekleri',
    'muhasebe örnekleri',
    'muhasebe durumlari',
    'muhasebe durumları',
    'muhasebe vakalar',
    'muhasebe case',
    'accounting examples',
    'accounting cases',
    'accounting situations',
    // X İşlemi + farklı senaryo ifadeleri
    'x islemi senaryo analizi',
    'x işlemi senaryo analizi',
    'x islemi durum analizi',
    'x işlemi durum analizi',
    'x islemi vaka analizi',
    'x işlemi vaka analizi',
    'x islemi case study',
    'x işlemi case study',
    'x senaryo analizi',
    'x durum analizi',
    'x vaka analizi',
    'x case study',
    'x scenario analysis',
    'x case analysis',
    'x situation analysis',
    // Muhasebe + senaryo kombinasyonları
    'muhasebe senaryo analizi',
    'muhasebe durum analizi',
    'muhasebe vaka analizi',
    'muhasebe case study',
    'accounting scenario analysis',
    'accounting case study',
    'accounting situation analysis',
    // Numaralı başlıklar
    '4.1.12',
    '12. x islemi',
    '12.1 x islemi',
    '13. x islemi',
    '13.1 x islemi',
    '14. x islemi',
    '14.1 x islemi',
    '12. muhasebe',
    '12.1 muhasebe',
    '13. muhasebe',
    '13.1 muhasebe',
    '12. senaryo',
    '12.1 senaryo',
    '13. senaryo',
    '13.1 senaryo',
    '15. x islemi',
    '15.1 x islemi',
    '16. x islemi',
    '16.1 x islemi',
    // İlişkili terimler
    'x islemi muhasebe test',
    'x işlemi muhasebe test',
    'x islemi muhasebe simulasyon',
    'x işlemi muhasebe simulasyon',
    'x muhasebe test',
    'x muhasebe simulasyon',
    'x accounting test',
    'x accounting simulation',
    'muhasebe test senaryolari',
    'muhasebe test senaryoları',
    'accounting test scenarios',
    'muhasebe simulasyon',
    'accounting simulation'
  ];
  
  console.log('🔍 X İŞLEMİ MUHASEBE SENARYOLARI METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
  // Önce h1-h6 başlıkları ara
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log(`📋 ${headings.length} başlık elementi bulundu`);
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const text = heading.textContent?.trim() || '';
    const normalized = normalizeText(text);
    console.log(`🔍 Başlık ${i + 1}: "${text}" → "${normalized}"`);
    
    for (const term of searchTerms) {
      if (normalized.includes(term)) {
        console.log(`🎯 X İŞLEMİ MUHASEBE SENARYOLARI METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
        return heading;
      }
    }
  }
  
  // Başlık bulunamadı, tüm elementlerde ara
  console.log('🔍 Başlıklarda bulunamadı, tüm elementlerde aranıyor...');
  const allElements = doc.querySelectorAll('p, div, span, td, th');
  console.log(`📋 Toplam ${allElements.length} element taranacak`);
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent?.trim() || '';
    const normalized = normalizeText(text);
    
    // Debug: İlk 100 elementi logla
    if (i < 100) {
      console.log(`🔍 Element ${i + 1}: "${text.substring(0, 80)}..." → "${normalized.substring(0, 80)}..."`);
      
      // Eğer x işlemi muhasebe senaryoları terimleri içeriyorsa özel işaretle
      if ((normalized.includes('x') && normalized.includes('muhasebe') && normalized.includes('senaryo')) ||
          (normalized.includes('x') && normalized.includes('accounting') && normalized.includes('scenario'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 X İŞLEMİ MUHASEBE SENARYOLARI METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ X İŞLEMİ MUHASEBE SENARYOLARI METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 X İŞLEMİ MUHASEBE SENARYOLARI METNİ: Başlık altındaki içerik toplaniyor...');
  
  const content: string[] = [];
  let currentElement = headerElement.nextElementSibling;
  let elementCount = 0;
  const maxElements = 20;
  
  console.log(`🎯 Başlangıç elementi: "${headerElement.textContent?.substring(0, 30)}..."`);
  
  while (currentElement && elementCount < maxElements) {
    const tagName = currentElement.tagName.toLowerCase();
    const text = currentElement.textContent?.trim() || '';
    
    console.log(`🔍 Element ${elementCount + 1}: [${tagName}] "${text.substring(0, 50)}..."`);
    
    // Yeni başlık bulundu, dur (daha katı kontrol)
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) && text.length > 3) {
      console.log(`🛑 Yeni başlık bulundu, durduruluyor: "${text}"`);
      break;
    }
    
    // Başlık benzeri metinler de kontrol et (büyük harfli, kısa metinler)
    if (text.length < 50 && text.length > 5 && text === text.toUpperCase() && !text.includes('.')) {
      console.log(`🛑 Başlık benzeri metin bulundu, durduruluyor: "${text}"`);
      break;
    }
    
    // Boş içerik atla (çok esnek uzunluk)
    if (!text || text.length < 3) {
      console.log(`⏭️ Çok kısa, atlandı: "${text}"`);
      elementCount++;
      currentElement = currentElement.nextElementSibling;
      continue;
    }
    
    // Tablo içeriği atla
    if (tagName === 'table' || currentElement.querySelector('table')) {
      console.log(`🚫 Tablo atlandı (X İşlemi Muhasebe Senaryoları tablolarını geç)`);
      elementCount++;
      currentElement = currentElement.nextElementSibling;
      continue;
    }
    
    // İyi görünen içerik (çok esnek)
    if (text.length >= 3) {
      content.push(text);
      console.log(`✅ İçerik eklendi (${text.length} kar): "${text.substring(0, 100)}..."`);
      
      // İlk 3 paragrafı bulduktan sonra dur
      if (content.length >= 3) {
        console.log('🎯 3 paragraf bulundu, yeterli');
        break;
      }
    } else {
      console.log(`🤔 Çok kısa ama kayıt altında: "${text}"`);
    }
    
    elementCount++;
    currentElement = currentElement.nextElementSibling;
  }
  
  const result = content.join('\n\n');
  console.log(`✅ X İŞLEMİ MUHASEBE SENARYOLARI METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForXIslemiMuhasebeSenaryolariTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: X İşlemi Muhasebe Senaryoları Metni aranıyor...');
  
  const keywords = [
    // ÇOK YÜKSEK öncelik - X İşlemi Muhasebe Senaryoları spesifik
    'x islemi muhasebe senaryolari', 'x işlemi muhasebe senaryoları', 'x islemi muhasebe senaryolar',
    'x işlemi muhasebe senaryolar', 'x islemi muhasebe senaryosu', 'x işlemi muhasebe senaryosu',
    'x muhasebe senaryolari', 'x muhasebe senaryoları', 'x muhasebe senaryolar', 'x muhasebe senaryosu',
    'x accounting scenarios', 'x accounting scenario',
    // YÜKSEK öncelik - X İşlemi Muhasebe + Senaryo
    'x islemi muhasebe senaryo', 'x işlemi muhasebe senaryo', 'x muhasebe senaryo',
    'x islemi senaryo', 'x işlemi senaryo', 'x senaryo muhasebe', 'x scenario accounting',
    // YÜKSEK öncelik - X İşlemi Muhasebe Örnekleri/Durumları
    'x islemi muhasebe ornekleri', 'x işlemi muhasebe örnekleri', 'x islemi muhasebe durumlari',
    'x işlemi muhasebe durumları', 'x islemi muhasebe vakalar', 'x işlemi muhasebe vakalar',
    'x islemi muhasebe case', 'x işlemi muhasebe case', 'x muhasebe ornekleri', 'x muhasebe örnekleri',
    'x muhasebe durumlari', 'x muhasebe durumları', 'x muhasebe vakalar', 'x muhasebe case',
    'x accounting examples', 'x accounting cases', 'x accounting situations',
    // ORTA-YÜKSEK öncelik - Senaryo analizi
    'x islemi senaryo analizi', 'x işlemi senaryo analizi', 'x islemi durum analizi',
    'x işlemi durum analizi', 'x islemi vaka analizi', 'x işlemi vaka analizi',
    'x islemi case study', 'x işlemi case study', 'x senaryo analizi', 'x durum analizi',
    'x vaka analizi', 'x case study', 'x scenario analysis', 'x case analysis', 'x situation analysis',
    // ORTA öncelik - Genel muhasebe senaryoları
    'muhasebe senaryolari', 'muhasebe senaryoları', 'muhasebe senaryolar', 'muhasebe senaryosu',
    'accounting scenarios', 'accounting scenario', 'muhasebe ornekleri', 'muhasebe örnekleri',
    'muhasebe durumlari', 'muhasebe durumları', 'muhasebe vakalar', 'muhasebe case',
    'accounting examples', 'accounting cases', 'accounting situations',
    // ORTA öncelik - X İşlemi test/simulasyon
    'x islemi muhasebe test', 'x işlemi muhasebe test', 'x islemi muhasebe simulasyon',
    'x işlemi muhasebe simulasyon', 'x muhasebe test', 'x muhasebe simulasyon',
    'x accounting test', 'x accounting simulation',
    // DÜŞÜK öncelik - X işlemi terimleri
    'x islemi', 'x işlemi', 'x transaction', 'x islemi muhasebe', 'x işlemi muhasebe',
    'x muhasebe', 'x accounting', 'muhasebe senaryo analizi', 'muhasebe durum analizi',
    'muhasebe vaka analizi', 'muhasebe case study', 'accounting scenario analysis',
    'accounting case study', 'accounting situation analysis',
    // DÜŞÜK öncelik - Genel terimler
    'senaryo', 'scenario', 'senaryolar', 'scenarios', 'muhasebe', 'accounting',
    'ornek', 'örnek', 'example', 'durum', 'situation', 'vaka', 'case', 'analiz', 'analysis'
  ];
  
  const blacklistKeywords = [
    'içindekiler', 'contents', 'table', 'tablo', 'page', 'sayfa',
    'başlık', 'title', 'index', 'menu', 'bölüm', 'section',
    'fonksiyonel gereksinimler', 'fonksiyonel', 'functional requirements',
    'ekran gereksinimleri', 'screen requirements', 'ui requirements',
    'amaç ve kapsam', 'mevcut işleyiş', 'planlanan işleyiş',
    'gereksinimler', 'requirements', 'talep', 'değerlendirme',
    'doküman', 'document', 'tarihçe', 'history', 'x ekrani', 'x ekranı',
    'ekran tasarimlari', 'ekran tasarımları', 'ekran tasarim',
    'tasklar batchlar', 'tasklar batchler', 'task is akisi', 'task iş akışı',
    'conversion ve migration', 'conversion migration', 'donusum ve migrasyon',
    'diagram ve akislar', 'diagram ve akışlar', 'diagram akislar', 'diagram akışlar',
    // Diğer X İşlemi modal'larını ayır (ama muhasebe kısmı hariç)
    'x islemi vergi komisyon', 'x işlemi vergi komisyon', 'x islemi vergi ve komisyon',
    'x işlemi vergi ve komisyon', 'x vergi komisyon', 'x vergi ve komisyon',
    'x islemi kayit kurallari', 'x işlemi kayıt kuralları',
    'x islemi muhasebe deseni', 'x işlemi muhasebe deseni', /* ama senaryolar hariç */
    'x islemi ornek kayitlar', 'x işlemi örnek kayıtlar',
    // Spesifik olmayan X İşlemi Muhasebe terimlerini filtrele (sadece ana muhasebe)
    'genel muhasebe x', 'general accounting x', 'temel muhasebe x', 'basic accounting x',
    // Diğer modalların içerikleri
    'entegrasyonlar', 'mesajlar', 'parametreler', 'yetkilendirme',
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar',
    'case1', 'case 1', 'test senaryolari', 'test senaryoları', /* ama muhasebe test senaryoları hariç */
    // Tablo parser'larından kaçın
    'talep bilgileri', 'sistem bilgileri', 'proje bilgileri',
    'uygulamalar tablosu', 'veritabanlari tablosu', 'veritabanları tablosu',
    'donanim tablosu', 'donanım tablosu', 'network tablosu', 'ağ tablosu'
  ];
  
  const allElements = doc.querySelectorAll('p, div, span');
  const candidates: { element: Element; score: number; content: string }[] = [];
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent?.trim() || '';
    const normalized = normalizeText(text);
    
    // Çok kısa veya blacklist kontrolü
    if (text.length < 20) continue;
    
    let isBlacklisted = false;
    for (const blackword of blacklistKeywords) {
      if (normalized.includes(blackword)) {
        isBlacklisted = true;
        break;
      }
    }
    if (isBlacklisted) continue;
    
    // Sadece sayı/noktalama işareti olanlar atla
    if (/^[\d.\s)-]+$/.test(text)) continue;
    
    // Tablo içeriği atla
    if (element.closest('table')) continue;
    
    // Skorlama - X İşlemi Muhasebe Senaryoları spesifik
    let score = 0;
    
    // Keyword puanları (X İşlemi Muhasebe Senaryoları odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - X + Muhasebe + Senaryolar kombinasyonu
      if (keyword.includes('x') && keyword.includes('muhasebe') && keyword.includes('senaryol')) {
        score += count * 80; // En önemli - X İşlemi Muhasebe Senaryoları
      } else if (keyword.includes('x') && keyword.includes('accounting') && keyword.includes('scenario')) {
        score += count * 75; // X Accounting Scenarios
      }
      // YÜKSEK öncelik - X + Muhasebe + Senaryo
      else if (keyword.includes('x') && keyword.includes('muhasebe') && keyword.includes('senaryo')) {
        score += count * 70; // X İşlemi Muhasebe Senaryo
      } else if (keyword.includes('x') && keyword.includes('muhasebe') && (keyword.includes('ornek') || keyword.includes('durum') || keyword.includes('vaka') || keyword.includes('case'))) {
        score += count * 65; // X İşlemi Muhasebe Örnekleri/Durumları/Vakalar
      }
      // ORTA-YÜKSEK öncelik - X + Senaryo Analizi
      else if (keyword.includes('x') && keyword.includes('senaryo') && keyword.includes('analiz')) {
        score += count * 60; // X İşlemi Senaryo Analizi
      } else if (keyword.includes('x') && keyword.includes('scenario') && keyword.includes('analysis')) {
        score += count * 55; // X Scenario Analysis
      }
      // ORTA öncelik - X + Muhasebe
      else if (keyword.includes('x') && keyword.includes('muhasebe')) {
        score += count * 50; // X İşlemi Muhasebe
      } else if (keyword.includes('x') && keyword.includes('accounting')) {
        score += count * 45; // X Accounting
      }
      // ORTA öncelik - Muhasebe + Senaryolar
      else if (keyword.includes('muhasebe') && keyword.includes('senaryol')) {
        score += count * 45; // Muhasebe Senaryoları
      } else if (keyword.includes('accounting') && keyword.includes('scenario')) {
        score += count * 40; // Accounting Scenarios
      }
      // ORTA öncelik - X + Senaryo
      else if (keyword.includes('x') && keyword.includes('senaryo')) {
        score += count * 40; // X İşlemi Senaryo
      } else if (keyword.includes('x') && keyword.includes('scenario')) {
        score += count * 35; // X Scenario
      }
      // DÜŞÜK öncelik - X İşlemi
      else if (keyword === 'x islemi' || keyword === 'x işlemi') {
        score += count * 30; // X İşlemi ana terim
      }
      // DÜŞÜK öncelik - Genel terimler
      else {
        score += count * 20; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Çok yüksek eşik - X İşlemi Muhasebe Senaryoları için çok seçici
    if (score > 40) {
      candidates.push({ element, score, content: text });
      console.log(`📊 Aday bulundu: Skor ${score}, "${text.substring(0, 80)}..."`);
    }
  }
  
  // En yüksek skorlu adayları al
  candidates.sort((a, b) => b.score - a.score);
  
  console.log(`📊 ${candidates.length} aday bulundu`);
  
  // İlk 10 adayı göster
  for (let i = 0; i < Math.min(10, candidates.length); i++) {
    const candidate = candidates[i];
    console.log(`🏆 Aday ${i + 1}: Skor ${candidate.score}, "${candidate.content.substring(0, 120)}..."`);
  }
  
  if (candidates.length > 0) {
    // İlk 5 adayı al
    const topCandidates = candidates.slice(0, 5);
    const result = topCandidates.map(c => c.content).join('\n\n');
    console.log(`✅ SCAN mode sonuç: ${result.length} karakter`);
    return result;
  }
  
  console.log('❌ SCAN mode\'da uygun içerik bulunamadı');
  return '';
}

// Ana parse fonksiyonu
export async function parseXIslemiMuhasebeSenaryolariTextFromDocx(file: File): Promise<XIslemiMuhasebeSenaryolariTextParseResult> {
  console.log('🔍 DOCX X İşlemi Muhasebe Senaryoları Metni Parse Başlıyor:', file.name);
  
  try {
    console.log(`📄 Dosya okunuyor: ${file.name} (${file.size} bytes)`);
    
    // Dosyayı klonla
    const arrayBuffer = await file.arrayBuffer();
    const clonedBuffer = arrayBuffer.slice(0);
    const result = await mammoth.convertToHtml({ arrayBuffer: clonedBuffer });
    
    console.log(`📄 HTML Dönüştürme Tamamlandı, uzunluk: ${result.value.length}`);
    
    if (result.messages && result.messages.length > 0) {
      console.log('⚠️ Mammoth uyarıları:', result.messages);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, 'text/html');
    
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    
    // STRICT Mode: Başlık bul
    const headerElement = findXIslemiMuhasebeSenaryolariTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 X İşlemi Muhasebe Senaryoları Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['X İşlemi Muhasebe Senaryoları Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['X İşlemi Muhasebe Senaryoları Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForXIslemiMuhasebeSenaryolariTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 X İşlemi Muhasebe Senaryoları Metni Parse Sonucu (SCAN):', {
        found: true,
        mode: 'scan',
        contentLength: scanContent.length,
        matchedLabels: ['Content Found via Scan'],
        errors: [],
        warnings: ['İçerik alternatif yöntemle bulundu']
      });
      
      return {
        found: true,
        mode: 'scan',
        content: scanContent.trim(),
        contentLength: scanContent.length,
        matchedLabels: ['Content Found via Scan'],
        errors: [],
        warnings: ['İçerik alternatif yöntemle bulundu']
      };
    }
    
    // Hiçbir şey bulunamadı
    return {
      found: false,
      mode: 'strict',
      content: '',
      contentLength: 0,
      matchedLabels: [],
      errors: ['X İşlemi Muhasebe Senaryoları Metni içeriği bulunamadı'],
      warnings: []
    };
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      found: false,
      mode: 'strict',
      content: '',
      contentLength: 0,
      matchedLabels: [],
      errors: [`Parse hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
      warnings: []
    };
  }
}
