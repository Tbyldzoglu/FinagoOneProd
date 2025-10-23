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

interface XIslemiVergiKomisyonTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// X İŞLEMİ VERGİ / KOMİSYON metin başlığını bul
function findXIslemiVergiKomisyonTextHeader(doc: Document): Element | null {
  console.log('🔍 X İŞLEMİ VERGİ / KOMİSYON METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler - Vergi/Komisyon birlikte
    'x islemi vergi komisyon',
    'x işlemi vergi komisyon',
    'x islemi vergi ve komisyon',
    'x işlemi vergi ve komisyon',
    'x islemi vergi komisyonlar',
    'x işlemi vergi komisyonlar',
    'x vergi komisyon',
    'x vergi ve komisyon',
    'x vergi komisyonlar',
    'x transaction tax commission',
    'x tax commission',
    'x tax and commission',
    'vergi komisyon x',
    'vergi ve komisyon x',
    'tax commission x',
    'tax and commission x',
    // Sadece Vergi
    'x islemi vergi',
    'x işlemi vergi',
    'x islemi vergiler',
    'x işlemi vergiler',
    'x islemi vergilendirme',
    'x işlemi vergilendirme',
    'x vergi',
    'x vergiler',
    'x vergilendirme',
    'x tax',
    'x taxes',
    'x taxation',
    'x transaction tax',
    'vergi x',
    'vergiler x',
    'tax x',
    'taxes x',
    // Sadece Komisyon
    'x islemi komisyon',
    'x işlemi komisyon',
    'x islemi komisyonlar',
    'x işlemi komisyonlar',
    'x komisyon',
    'x komisyonlar',
    'x commission',
    'x commissions',
    'x fee',
    'x fees',
    'komisyon x',
    'komisyonlar x',
    'commission x',
    'commissions x',
    // Genel vergi terimleri
    'vergi hesaplama',
    'vergi hesabi',
    'vergi hesabı',
    'vergi orani',
    'vergi oranı',
    'tax calculation',
    'tax rate',
    'vergi matrah',
    'tax base',
    'kdv',
    'vat',
    'bsmv',
    'otv',
    'gelir vergisi',
    'income tax',
    'kurumlar vergisi',
    'corporate tax',
    'stopaj',
    'withholding tax',
    'tevkifat',
    'withholding',
    // Genel komisyon terimleri
    'komisyon hesaplama',
    'komisyon hesabi',
    'komisyon hesabı',
    'komisyon orani',
    'komisyon oranı',
    'commission calculation',
    'commission rate',
    'ucret',
    'ücret',
    'fee',
    'masraf',
    'expense',
    'gider',
    'cost',
    'banka komisyonu',
    'bank commission',
    'islem ucreti',
    'işlem ücreti',
    'transaction fee',
    'transfer ucreti',
    'transfer ücreti',
    'transfer fee',
    // Numaralı başlıklar
    '4.1.11',
    '11. x islemi',
    '11.1 x islemi',
    '12. x islemi',
    '12.1 x islemi',
    '11. vergi',
    '11.1 vergi',
    '12. vergi',
    '12.1 vergi',
    '11. komisyon',
    '11.1 komisyon',
    '12. komisyon',
    '12.1 komisyon',
    '13. x islemi',
    '13.1 x islemi',
    '14. x islemi',
    '14.1 x islemi',
    // İlişkili terimler
    'x islemi maliyetleri',
    'x işlemi maliyetleri',
    'x transaction costs',
    'x operation costs',
    'x process fees',
    'mali yukumluuk',
    'mali yükümlülük',
    'financial obligation',
    'vergi borcu',
    'tax liability',
    'komisyon borcu',
    'commission liability'
  ];
  
  console.log('🔍 X İŞLEMİ VERGİ / KOMİSYON METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        console.log(`🎯 X İŞLEMİ VERGİ / KOMİSYON METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer x işlemi vergi komisyon terimleri içeriyorsa özel işaretle
      if ((normalized.includes('x') && (normalized.includes('vergi') || normalized.includes('komisyon'))) ||
          (normalized.includes('vergi') && normalized.includes('komisyon')) ||
          (normalized.includes('tax') && normalized.includes('commission'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 X İŞLEMİ VERGİ / KOMİSYON METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ X İŞLEMİ VERGİ / KOMİSYON METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 X İŞLEMİ VERGİ / KOMİSYON METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (X İşlemi Vergi/Komisyon tablolarını geç)`);
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
  console.log(`✅ X İŞLEMİ VERGİ / KOMİSYON METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForXIslemiVergiKomisyonTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: X İşlemi Vergi / Komisyon Metni aranıyor...');
  
  const keywords = [
    // YÜKSEK öncelik - X İşlemi Vergi/Komisyon spesifik
    'x islemi vergi komisyon', 'x işlemi vergi komisyon', 'x islemi vergi ve komisyon',
    'x işlemi vergi ve komisyon', 'x vergi komisyon', 'x vergi ve komisyon',
    'x transaction tax commission', 'x tax commission', 'x tax and commission',
    // ORTA-YÜKSEK öncelik - X İşlemi Vergi
    'x islemi vergi', 'x işlemi vergi', 'x islemi vergiler', 'x işlemi vergiler',
    'x islemi vergilendirme', 'x işlemi vergilendirme', 'x vergi', 'x vergiler',
    'x tax', 'x taxes', 'x taxation', 'x transaction tax',
    // ORTA-YÜKSEK öncelik - X İşlemi Komisyon
    'x islemi komisyon', 'x işlemi komisyon', 'x islemi komisyonlar', 'x işlemi komisyonlar',
    'x komisyon', 'x komisyonlar', 'x commission', 'x commissions', 'x fee', 'x fees',
    // ORTA öncelik - Vergi terimleri
    'vergi hesaplama', 'vergi hesabi', 'vergi hesabı', 'vergi orani', 'vergi oranı',
    'tax calculation', 'tax rate', 'vergi matrah', 'tax base', 'kdv', 'vat', 'bsmv', 'otv',
    'gelir vergisi', 'income tax', 'kurumlar vergisi', 'corporate tax', 'stopaj',
    'withholding tax', 'tevkifat', 'withholding',
    // ORTA öncelik - Komisyon terimleri
    'komisyon hesaplama', 'komisyon hesabi', 'komisyon hesabı', 'komisyon orani', 'komisyon oranı',
    'commission calculation', 'commission rate', 'ucret', 'ücret', 'fee', 'masraf', 'expense',
    'gider', 'cost', 'banka komisyonu', 'bank commission', 'islem ucreti', 'işlem ücreti',
    'transaction fee', 'transfer ucreti', 'transfer ücreti', 'transfer fee',
    // DÜŞÜK öncelik - X işlemi terimleri
    'x islemi', 'x işlemi', 'x transaction', 'x islemi maliyetleri', 'x işlemi maliyetleri',
    'x transaction costs', 'x operation costs', 'x process fees', 'mali yukumluuk', 'mali yükümlülük',
    'financial obligation', 'vergi borcu', 'tax liability', 'komisyon borcu', 'commission liability',
    // DÜŞÜK öncelik - Genel terimler
    'vergi', 'vergiler', 'tax', 'taxes', 'komisyon', 'komisyonlar', 'commission', 'commissions',
    'vergilendirme', 'taxation', 'hesaplama', 'calculation', 'oran', 'oranı', 'rate'
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
    'x islemi muhasebe', 'x işlemi muhasebe', /* ama "vergi/komisyon" olmadan */
    'x islemi muhasebe deseni', 'x işlemi muhasebe deseni',
    'x islemi kayit kurallari', 'x işlemi kayıt kuralları',
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
    
    // Skorlama - X İşlemi Vergi/Komisyon spesifik
    let score = 0;
    
    // Keyword puanları (X İşlemi Vergi/Komisyon odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - X + Vergi + Komisyon kombinasyonu
      if (keyword.includes('x') && keyword.includes('vergi') && keyword.includes('komisyon')) {
        score += count * 70; // En önemli - X İşlemi Vergi Komisyon
      } else if (keyword.includes('x') && keyword.includes('tax') && keyword.includes('commission')) {
        score += count * 65; // X Tax Commission
      }
      // YÜKSEK öncelik - X + Vergi veya X + Komisyon
      else if (keyword.includes('x') && keyword.includes('vergi')) {
        score += count * 55; // X İşlemi Vergi
      } else if (keyword.includes('x') && keyword.includes('komisyon')) {
        score += count * 55; // X İşlemi Komisyon
      } else if (keyword.includes('x') && keyword.includes('tax')) {
        score += count * 50; // X Tax
      } else if (keyword.includes('x') && keyword.includes('commission')) {
        score += count * 50; // X Commission
      }
      // ORTA-YÜKSEK öncelik - Vergi/Komisyon spesifik terimler
      else if (keyword.includes('vergi') && keyword.includes('hesap')) {
        score += count * 40; // Vergi hesaplama
      } else if (keyword.includes('komisyon') && keyword.includes('hesap')) {
        score += count * 40; // Komisyon hesaplama
      } else if (keyword === 'kdv' || keyword === 'vat' || keyword === 'bsmv' || keyword === 'otv') {
        score += count * 35; // Spesifik vergiler
      }
      // ORTA öncelik - X İşlemi terimleri
      else if (keyword.includes('x') && keyword.includes('islemi')) {
        score += count * 35; // X İşlemi
      } else if (keyword === 'x islemi' || keyword === 'x işlemi') {
        score += count * 30; // X İşlemi ana terim
      }
      // ORTA öncelik - Vergi/Komisyon ana terimleri
      else if (keyword === 'vergi' || keyword === 'vergiler' || keyword === 'tax' || keyword === 'taxes') {
        score += count * 25; // Vergi
      } else if (keyword === 'komisyon' || keyword === 'komisyonlar' || keyword === 'commission' || keyword === 'commissions') {
        score += count * 25; // Komisyon
      }
      // DÜŞÜK öncelik
      else {
        score += count * 15; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Yüksek eşik - X İşlemi Vergi/Komisyon için çok seçici
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
export async function parseXIslemiVergiKomisyonTextFromDocx(file: File): Promise<XIslemiVergiKomisyonTextParseResult> {
  console.log('🔍 DOCX X İşlemi Vergi / Komisyon Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findXIslemiVergiKomisyonTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 X İşlemi Vergi / Komisyon Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['X İşlemi Vergi / Komisyon Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['X İşlemi Vergi / Komisyon Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForXIslemiVergiKomisyonTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 X İşlemi Vergi / Komisyon Metni Parse Sonucu (SCAN):', {
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
      errors: ['X İşlemi Vergi / Komisyon Metni içeriği bulunamadı'],
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
