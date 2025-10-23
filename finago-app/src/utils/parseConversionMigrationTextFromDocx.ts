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

interface ConversionMigrationTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// CONVERSION VE MIGRATION metin başlığını bul
function findConversionMigrationTextHeader(doc: Document): Element | null {
  console.log('🔍 CONVERSION VE MIGRATION METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler
    'conversion ve migration',
    'conversion migration',
    'conversion and migration',
    'donusum ve migrasyon',
    'dönüşüm ve migrasyon',
    'donusum migrasyon',
    'dönüşüm migrasyon',
    'veri donusumu',
    'veri dönüşümü',
    'veri migrasyonu',
    'data conversion',
    'data migration',
    'migration',
    'migrasyon',
    'conversion',
    'donusum',
    'dönüşüm',
    'cevirim',
    'çevirim',
    'aktarim',
    'aktarım',
    'transfer',
    'gecis',
    'geçiş',
    'tasima',
    'taşıma',
    // Numaralı başlıklar
    '4.1.6',
    '6. conversion',
    '6.1 conversion',
    '7. conversion',
    '7.1 conversion',
    '6. migration',
    '6.1 migration',
    '7. migration',
    '7.1 migration',
    '8. conversion',
    '8.1 conversion',
    '9. conversion',
    '9.1 conversion',
    '8. migration',
    '8.1 migration',
    '9. migration',
    '9.1 migration',
    // Alternatif yazımlar
    'veri cevrim',
    'veri çevrim',
    'sistem migrasyonu',
    'sistem geçişi',
    'platform migrasyonu',
    'platform geçişi'
  ];
  
  console.log('🔍 CONVERSION VE MIGRATION METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        console.log(`🎯 CONVERSION VE MIGRATION METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer conversion/migration terimleri içeriyorsa özel işaretle
      if (normalized.includes('conversion') || normalized.includes('migration') || normalized.includes('donusum') || 
          normalized.includes('migrasyon') || normalized.includes('cevirim') || normalized.includes('aktarim')) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 CONVERSION VE MIGRATION METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ CONVERSION VE MIGRATION METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 CONVERSION VE MIGRATION METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (Conversion/Migration tablolarını geç)`);
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
  console.log(`✅ CONVERSION VE MIGRATION METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForConversionMigrationTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Conversion ve Migration Metni aranıyor...');
  
  const keywords = [
    // YÜKSEK öncelik - Conversion ve Migration spesifik
    'conversion ve migration', 'conversion migration', 'conversion and migration',
    'donusum ve migrasyon', 'dönüşüm ve migrasyon', 'donusum migrasyon', 'dönüşüm migrasyon',
    'veri donusumu', 'veri dönüşümü', 'veri migrasyonu', 'data conversion', 'data migration',
    // ORTA öncelik - Ana terimler
    'migration', 'migrasyon', 'conversion', 'donusum', 'dönüşüm',
    'cevirim', 'çevirim', 'aktarim', 'aktarım', 'transfer',
    'gecis', 'geçiş', 'tasima', 'taşıma',
    // DÜŞÜK öncelik - İlişkili terimler
    'veri cevrim', 'veri çevrim', 'sistem migrasyonu', 'sistem geçişi',
    'platform migrasyonu', 'platform geçişi', 'veri transferi',
    'data transfer', 'import', 'export', 'aktif', 'pasif',
    'backup', 'restore', 'sync', 'senkronizasyon',
    'transform', 'donusturme', 'dönüştürme', 'format'
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
    // Diğer modalların içerikleri
    'entegrasyonlar', 'mesajlar', 'parametreler', 'muhasebe', 'yetkilendirme',
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar',
    'diagram akislar', 'diagram akışlar'
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
    
    // Skorlama - Conversion/Migration spesifik
    let score = 0;
    
    // Keyword puanları (Conversion/Migration odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Birleşik terimler
      if (keyword.includes('conversion') && keyword.includes('migration')) {
        score += count * 40; // En önemli
      } else if (keyword.includes('veri') && (keyword.includes('donusum') || keyword.includes('migrasyon'))) {
        score += count * 35; // Veri dönüşümü/migrasyonu çok önemli
      }
      // YÜKSEK öncelik - Ana terimler
      else if (keyword === 'migration' || keyword === 'migrasyon' || keyword === 'conversion') {
        score += count * 30; // Ana kelimeler
      } else if (keyword === 'donusum' || keyword === 'dönüşüm' || keyword === 'aktarim' || keyword === 'aktarım') {
        score += count * 25; // Türkçe ana terimler
      } else if (keyword.includes('gecis') || keyword.includes('geçiş') || keyword.includes('transfer')) {
        score += count * 20; // Geçiş/transfer terimleri
      }
      // ORTA öncelik
      else if (keyword.includes('sistem') || keyword.includes('platform') || keyword.includes('veri')) {
        score += count * 15; // Sistem/platform/veri terimleri
      }
      // DÜŞÜK öncelik
      else {
        score += count * 10; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Orta eşik
    if (score > 15) {
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
export async function parseConversionMigrationTextFromDocx(file: File): Promise<ConversionMigrationTextParseResult> {
  console.log('🔍 DOCX Conversion ve Migration Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findConversionMigrationTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Conversion ve Migration Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Conversion ve Migration Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Conversion ve Migration Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForConversionMigrationTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Conversion ve Migration Metni Parse Sonucu (SCAN):', {
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
      errors: ['Conversion ve Migration Metni içeriği bulunamadı'],
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
