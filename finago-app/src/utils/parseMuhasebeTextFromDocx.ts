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

interface MuhasebeTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// MUHASEBE metin başlığını bul
function findMuhasebeTextHeader(doc: Document): Element | null {
  console.log('🔍 MUHASEBE METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler
    'muhasebe',
    'muhasebesi',
    'muhasebesel',
    'muhasebe kayitlari',
    'muhasebe kayıtları',
    'muhasebe islemi',
    'muhasebe işlemi',
    'muhasebe sureci',
    'muhasebe süreci',
    'muhasebe uygulamasi',
    'muhasebe uygulaması',
    'muhasebe sistemi',
    'muhasebe entegrasyonu',
    'accounting',
    'accounting process',
    'accounting system',
    'financial records',
    'mali kayitlar',
    'mali kayıtlar',
    'mali islemler',
    'mali işlemler',
    'finansal kayitlar',
    'finansal kayıtlar',
    'finansal islemler',
    'finansal işlemler',
    'yevmiye',
    'yevmiye kaydi',
    'yevmiye kaydı',
    'yevmiye kayitlari',
    'yevmiye kayıtları',
    'journal entry',
    'journal entries',
    'defteri kebir',
    'general ledger',
    'hesap plani',
    'hesap planı',
    'chart of accounts',
    'fis',
    'fiş',
    'fisler',
    'fişler',
    'voucher',
    'vouchers',
    'makbuz',
    'makbuzlar',
    'receipt',
    'receipts',
    'fatura',
    'faturalar',
    'invoice',
    'invoices',
    'defter',
    'defterler',
    'book',
    'books',
    'ledger',
    'kayit',
    'kayıt',
    'kayitlar',
    'kayıtlar',
    'record',
    'records',
    'tahakkuk',
    'accrual',
    'tahsilatlar',
    'collections',
    'ödeme',
    'ödemeler',
    'payment',
    'payments',
    'borc',
    'borç',
    'borclar',
    'borçlar',
    'debt',
    'debts',
    'alacak',
    'alacaklar',
    'credit',
    'credits',
    'receivables',
    // Numaralı başlıklar
    '4.1.8',
    '8. muhasebe',
    '8.1 muhasebe',
    '9. muhasebe',
    '9.1 muhasebe',
    '10. muhasebe',
    '10.1 muhasebe',
    '7. mali',
    '7.1 mali',
    '8. mali',
    '8.1 mali',
    '9. mali',
    '9.1 mali',
    // Spesifik muhasebe konuları
    'maliyet muhasebesi',
    'cost accounting',
    'yonetim muhasebesi',
    'yönetim muhasebesi',
    'management accounting',
    'finansal muhasebe',
    'financial accounting',
    'vergi muhasebesi',
    'tax accounting',
    'bilanço',
    'balance sheet',
    'gelir tablosu',
    'income statement',
    'nakit akisi',
    'nakit akışı',
    'cash flow'
  ];
  
  console.log('🔍 MUHASEBE METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        // X İşlemi Muhasebe çakışmasını önle
        if (normalized.includes('x') && normalized.includes('islemi') && normalized.includes('muhasebe')) {
          console.log(`🚫 X İŞLEMİ MUHASEBE ATLANILIYOR: "${text}" (çakışma önlendi)`);
          continue;
        }
        console.log(`🎯 MUHASEBE METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer muhasebe terimleri içeriyorsa özel işaretle
      if (normalized.includes('muhasebe') || normalized.includes('accounting') || normalized.includes('mali') || 
          normalized.includes('finansal') || normalized.includes('yevmiye') || normalized.includes('fis')) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        // X İşlemi Muhasebe çakışmasını önle
        if (normalized.includes('x') && normalized.includes('islemi') && normalized.includes('muhasebe')) {
          console.log(`🚫 X İŞLEMİ MUHASEBE ELEMENT ATLANILIYOR: "${text}" (çakışma önlendi)`);
          continue;
        }
        console.log(`🎯 MUHASEBE METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ MUHASEBE METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 MUHASEBE METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (Muhasebe tablolarını geç)`);
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
  console.log(`✅ MUHASEBE METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForMuhasebeTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Muhasebe Metni aranıyor...');
  
  const keywords = [
    // YÜKSEK öncelik - Muhasebe spesifik
    'muhasebe', 'muhasebesi', 'muhasebesel', 'muhasebe kayitlari', 'muhasebe kayıtları',
    'muhasebe islemi', 'muhasebe işlemi', 'muhasebe sureci', 'muhasebe süreci',
    'muhasebe uygulamasi', 'muhasebe uygulaması', 'muhasebe sistemi', 'muhasebe entegrasyonu',
    'accounting', 'accounting process', 'accounting system', 'financial records',
    'mali kayitlar', 'mali kayıtlar', 'mali islemler', 'mali işlemler',
    'finansal kayitlar', 'finansal kayıtlar', 'finansal islemler', 'finansal işlemler',
    // ORTA öncelik - Muhasebe kavramları
    'yevmiye', 'yevmiye kaydi', 'yevmiye kaydı', 'yevmiye kayitlari', 'yevmiye kayıtları',
    'journal entry', 'journal entries', 'defteri kebir', 'general ledger',
    'hesap plani', 'hesap planı', 'chart of accounts', 'fis', 'fiş', 'fisler', 'fişler',
    'voucher', 'vouchers', 'makbuz', 'makbuzlar', 'receipt', 'receipts',
    'fatura', 'faturalar', 'invoice', 'invoices', 'defter', 'defterler',
    'book', 'books', 'ledger', 'kayit', 'kayıt', 'kayitlar', 'kayıtlar',
    'record', 'records', 'tahakkuk', 'accrual', 'tahsilatlar', 'collections',
    // DÜŞÜK öncelik - İlişkili terimler
    'ödeme', 'ödemeler', 'payment', 'payments', 'borc', 'borç', 'borclar', 'borçlar',
    'debt', 'debts', 'alacak', 'alacaklar', 'credit', 'credits', 'receivables',
    'maliyet muhasebesi', 'cost accounting', 'yonetim muhasebesi', 'yönetim muhasebesi',
    'management accounting', 'finansal muhasebe', 'financial accounting',
    'vergi muhasebesi', 'tax accounting', 'bilanço', 'balance sheet',
    'gelir tablosu', 'income statement', 'nakit akisi', 'nakit akışı', 'cash flow'
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
    // X İşlemi Muhasebe'yi hariç tut
    'x islemi muhasebe', 'x işlemi muhasebe', 'x islemi muhasebesinde', 'x işlemi muhasebesinde',
    'x islemi muhasebesi', 'x işlemi muhasebesi', 'x muhasebe', 'x muhasebesinde',
    'muhasebe deseni', 'kayit kurallari', 'kayıt kuralları',
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
    
    // Skorlama - Muhasebe spesifik
    let score = 0;
    
    // Keyword puanları (Muhasebe odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Muhasebe ana terimler
      if (keyword === 'muhasebe' || keyword === 'muhasebesi' || keyword === 'accounting') {
        score += count * 50; // En önemli
      } else if (keyword.includes('muhasebe') && keyword.includes('sistem')) {
        score += count * 45; // Muhasebe sistemi
      } else if (keyword.includes('muhasebe') && (keyword.includes('islemi') || keyword.includes('işlemi'))) {
        score += count * 40; // Muhasebe işlemi
      }
      // YÜKSEK öncelik - Mali/Finansal terimler
      else if (keyword.includes('mali') || keyword.includes('finansal') || keyword === 'financial') {
        score += count * 35; // Mali/Finansal kelimeler
      } else if (keyword === 'yevmiye' || keyword === 'journal' || keyword === 'ledger') {
        score += count * 30; // Muhasebe kavramları
      } else if (keyword.includes('kayit') || keyword.includes('kayıt') || keyword === 'record') {
        score += count * 25; // Kayıt terimleri
      }
      // ORTA öncelik
      else if (keyword.includes('fis') || keyword.includes('fiş') || keyword.includes('voucher')) {
        score += count * 20; // Fiş/Voucher terimleri
      } else if (keyword.includes('fatura') || keyword.includes('invoice') || keyword.includes('makbuz')) {
        score += count * 20; // Belge terimleri
      }
      // DÜŞÜK öncelik
      else {
        score += count * 15; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Yüksek eşik - Muhasebe için seçici
    if (score > 30) {
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
export async function parseMuhasebeTextFromDocx(file: File): Promise<MuhasebeTextParseResult> {
  console.log('🔍 DOCX Muhasebe Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findMuhasebeTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Muhasebe Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Muhasebe Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Muhasebe Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForMuhasebeTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Muhasebe Metni Parse Sonucu (SCAN):', {
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
      errors: ['Muhasebe Metni içeriği bulunamadı'],
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
