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

interface XIslemiMuhasebeDeseniTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// X İŞLEMİ MUHASEBE DESENİ metin başlığını bul
function findXIslemiMuhasebeDeseniTextHeader(doc: Document): Element | null {
  console.log('🔍 X İŞLEMİ MUHASEBE DESENİ METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler
    'x islemi muhasebe deseni',
    'x işlemi muhasebe deseni',
    'x islemi muhasebesel desen',
    'x işlemi muhasebesel desen',
    'x muhasebe deseni',
    'x muhasebesel desen',
    'x islemi desen',
    'x işlemi desen',
    'x islemi muhasebe modeli',
    'x işlemi muhasebe modeli',
    'x islemi muhasebe yapisi',
    'x işlemi muhasebe yapısı',
    'x islemi muhasebe sekli',
    'x işlemi muhasebe şekli',
    'x muhasebe modeli',
    'x muhasebe yapisi',
    'x muhasebe yapısı',
    'x muhasebe sekli',
    'x muhasebe şekli',
    'x accounting pattern',
    'x accounting model',
    'x accounting structure',
    'x transaction pattern',
    'x transaction model',
    'x transaction structure',
    'muhasebe deseni',
    'muhasebesel desen',
    'muhasebe modeli',
    'muhasebe yapisi',
    'muhasebe yapısı',
    'muhasebe sekli',
    'muhasebe şekli',
    'accounting pattern',
    'accounting model',
    'accounting structure',
    'desen x',
    'model x',
    'yapı x',
    'yapisi x',
    'pattern x',
    'model x islemi',
    'desen x islemi',
    'yapı x islemi',
    'pattern x islemi',
    'structure x islemi',
    // Muhasebe spesifik desen terimleri
    'yevmiye deseni',
    'journal pattern',
    'kayit deseni',
    'kayıt deseni',
    'record pattern',
    'fis deseni',
    'fiş deseni',
    'voucher pattern',
    'hesap deseni',
    'account pattern',
    'muhasebe akisi',
    'muhasebe akışı',
    'accounting flow',
    'mali desen',
    'financial pattern',
    'finansal desen',
    'financial model',
    'mali model',
    // Numaralı başlıklar
    '4.1.9',
    '9. x islemi',
    '9.1 x islemi',
    '10. x islemi',
    '10.1 x islemi',
    '9. muhasebe desen',
    '9.1 muhasebe desen',
    '10. muhasebe desen',
    '10.1 muhasebe desen',
    '11. x islemi',
    '11.1 x islemi',
    '12. x islemi',
    '12.1 x islemi',
    // İlişkili terimler
    'x islemi sureci',
    'x işlemi süreci',
    'x transaction process',
    'x process pattern',
    'x surec deseni',
    'x süreç deseni',
    'x process model'
  ];
  
  console.log('🔍 X İŞLEMİ MUHASEBE DESENİ METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        console.log(`🎯 X İŞLEMİ MUHASEBE DESENİ METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer x işlemi muhasebe deseni terimleri içeriyorsa özel işaretle
      if ((normalized.includes('x') && normalized.includes('muhasebe') && normalized.includes('desen')) ||
          (normalized.includes('muhasebe') && normalized.includes('desen')) ||
          (normalized.includes('x') && normalized.includes('islemi') && normalized.includes('desen'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 X İŞLEMİ MUHASEBE DESENİ METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ X İŞLEMİ MUHASEBE DESENİ METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 X İŞLEMİ MUHASEBE DESENİ METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (X İşlemi Muhasebe Deseni tablolarını geç)`);
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
  console.log(`✅ X İŞLEMİ MUHASEBE DESENİ METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForXIslemiMuhasebeDeseniTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: X İşlemi Muhasebe Deseni Metni aranıyor...');
  
  const keywords = [
    // YÜKSEK öncelik - X İşlemi Muhasebe Deseni spesifik
    'x islemi muhasebe deseni', 'x işlemi muhasebe deseni', 'x islemi muhasebesel desen',
    'x işlemi muhasebesel desen', 'x muhasebe deseni', 'x muhasebesel desen',
    'x islemi desen', 'x işlemi desen', 'x islemi muhasebe modeli', 'x işlemi muhasebe modeli',
    'x islemi muhasebe yapisi', 'x işlemi muhasebe yapısı', 'x muhasebe modeli',
    'x accounting pattern', 'x accounting model', 'x transaction pattern',
    // ORTA-YÜKSEK öncelik - Muhasebe deseni kavramları
    'muhasebe deseni', 'muhasebesel desen', 'muhasebe modeli', 'muhasebe yapisi',
    'muhasebe yapısı', 'muhasebe sekli', 'muhasebe şekli', 'accounting pattern',
    'accounting model', 'accounting structure', 'yevmiye deseni', 'journal pattern',
    'kayit deseni', 'kayıt deseni', 'record pattern', 'fis deseni', 'fiş deseni',
    'voucher pattern', 'hesap deseni', 'account pattern', 'muhasebe akisi',
    'muhasebe akışı', 'accounting flow', 'mali desen', 'financial pattern',
    'finansal desen', 'financial model', 'mali model',
    // ORTA öncelik - X işlemi terimleri
    'x islemi', 'x işlemi', 'x transaction', 'x islemi sureci', 'x işlemi süreci',
    'x transaction process', 'x process pattern', 'x surec deseni', 'x süreç deseni',
    'x process model', 'desen x', 'model x', 'yapı x', 'pattern x',
    // DÜŞÜK öncelik - Genel desen terimleri
    'desen', 'model', 'yapı', 'yapisi', 'pattern', 'structure', 'framework',
    'template', 'şablon', 'format', 'biçim', 'stil', 'style', 'approach',
    'yaklasim', 'yaklaşım', 'yontem', 'yöntem', 'method', 'metodoloji', 'methodology'
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
    // Diğer X İşlemi modal'larını ayır
    'x islemi muhasebe', 'x işlemi muhasebe', /* ama "deseni" olmadan */
    'x islemi kayit kurallari', 'x işlemi kayıt kuralları',
    'x islemi vergi komisyon', 'x işlemi vergi komisyon',
    'x islemi muhasebe senaryolari', 'x işlemi muhasebe senaryoları',
    'x islemi ornek kayitlar', 'x işlemi örnek kayıtlar',
    // Diğer modalların içerikleri
    'entegrasyonlar', 'mesajlar', 'parametreler', 'yetkilendirme',
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar',
    'case1', 'case 1', 'test senaryolari', 'test senaryoları',
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
    
    // Skorlama - X İşlemi Muhasebe Deseni spesifik
    let score = 0;
    
    // Keyword puanları (X İşlemi Muhasebe Deseni odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - X + Muhasebe + Desen kombinasyonu
      if (keyword.includes('x') && keyword.includes('muhasebe') && keyword.includes('desen')) {
        score += count * 60; // En önemli - X İşlemi Muhasebe Deseni
      } else if (keyword.includes('x') && keyword.includes('islemi') && keyword.includes('desen')) {
        score += count * 55; // X İşlemi Desen
      } else if (keyword.includes('x') && keyword.includes('muhasebe') && keyword.includes('model')) {
        score += count * 50; // X İşlemi Muhasebe Model
      }
      // YÜKSEK öncelik - Muhasebe Deseni spesifik
      else if (keyword.includes('muhasebe') && keyword.includes('desen')) {
        score += count * 45; // Muhasebe Deseni
      } else if (keyword.includes('accounting') && keyword.includes('pattern')) {
        score += count * 40; // Accounting Pattern
      } else if (keyword.includes('yevmiye') && keyword.includes('desen')) {
        score += count * 35; // Yevmiye Deseni
      }
      // ORTA-YÜKSEK öncelik - X İşlemi terimleri
      else if (keyword.includes('x') && keyword.includes('islemi')) {
        score += count * 35; // X İşlemi
      } else if (keyword === 'x islemi' || keyword === 'x işlemi') {
        score += count * 30; // X İşlemi ana terim
      }
      // ORTA öncelik - Desen/Model terimleri
      else if (keyword === 'muhasebe deseni' || keyword === 'muhasebe modeli') {
        score += count * 30; // Muhasebe desen/model
      } else if (keyword === 'desen' || keyword === 'model' || keyword === 'pattern') {
        score += count * 20; // Genel desen terimleri
      }
      // DÜŞÜK öncelik
      else {
        score += count * 15; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Yüksek eşik - X İşlemi Muhasebe Deseni için çok seçici
    if (score > 35) {
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
export async function parseXIslemiMuhasebeDeseniTextFromDocx(file: File): Promise<XIslemiMuhasebeDeseniTextParseResult> {
  console.log('🔍 DOCX X İşlemi Muhasebe Deseni Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findXIslemiMuhasebeDeseniTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 X İşlemi Muhasebe Deseni Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['X İşlemi Muhasebe Deseni Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['X İşlemi Muhasebe Deseni Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForXIslemiMuhasebeDeseniTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 X İşlemi Muhasebe Deseni Metni Parse Sonucu (SCAN):', {
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
      errors: ['X İşlemi Muhasebe Deseni Metni içeriği bulunamadı'],
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
