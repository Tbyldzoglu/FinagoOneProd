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

interface XIslemiKayitKurallariTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// X İŞLEMİ KAYIT KURALLARI metin başlığını bul
function findXIslemiKayitKurallariTextHeader(doc: Document): Element | null {
  console.log('🔍 X İŞLEMİ KAYIT KURALLARI METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler
    'x islemi kayit kurallari',
    'x işlemi kayıt kuralları',
    'x islemi kayit kurali',
    'x işlemi kayıt kuralı',
    'x kayit kurallari',
    'x kayıt kuralları',
    'x kayit kurali',
    'x kayıt kuralı',
    'x islemi kurallar',
    'x işlemi kurallar',
    'x islemi kurallari',
    'x işlemi kuralları',
    'x islemi kural',
    'x işlemi kural',
    'x kurallar',
    'x kurallari',
    'x kuralları',
    'x kural',
    'x recording rules',
    'x record rules',
    'x transaction rules',
    'x entry rules',
    'x booking rules',
    'kayit kurallari x',
    'kayıt kuralları x',
    'kurallar x',
    'kurallari x',
    'kuralları x',
    'rules x',
    'x islemi standartlari',
    'x işlemi standartları',
    'x islemi politikalari',
    'x işlemi politikaları',
    'x islemi yonergeleri',
    'x işlemi yönergeleri',
    'x islemi prosedur',
    'x işlemi prosedür',
    'x islemi usul',
    'x işlemi usul',
    'x islemi esaslar',
    'x işlemi esaslar',
    // Kayıt kuralları spesifik terimleri
    'kayit kurallari',
    'kayıt kuralları',
    'kayit kurali',
    'kayıt kuralı',
    'recording rules',
    'record rules',
    'booking rules',
    'entry rules',
    'muhasebe kayit kurallari',
    'muhasebe kayıt kuralları',
    'accounting recording rules',
    'accounting rules',
    'mali kayit kurallari',
    'mali kayıt kuralları',
    'finansal kayit kurallari',
    'finansal kayıt kuralları',
    'yevmiye kayit kurallari',
    'yevmiye kayıt kuralları',
    'journal entry rules',
    'defteri kebir kurallari',
    'defteri kebir kuralları',
    'ledger rules',
    'fis kurallari',
    'fiş kuralları',
    'voucher rules',
    'belge kurallari',
    'belge kuralları',
    'document rules',
    // Numaralı başlıklar
    '4.1.10',
    '10. x islemi',
    '10.1 x islemi',
    '11. x islemi',
    '11.1 x islemi',
    '10. kayit kural',
    '10.1 kayit kural',
    '11. kayit kural',
    '11.1 kayit kural',
    '12. x islemi',
    '12.1 x islemi',
    '13. x islemi',
    '13.1 x islemi',
    // İlişkili terimler
    'x islemi rehberi',
    'x işlemi rehberi',
    'x islemi kilavuzu',
    'x işlemi kılavuzu',
    'x transaction guide',
    'x process rules',
    'x operation rules',
    'x execution rules'
  ];
  
  console.log('🔍 X İŞLEMİ KAYIT KURALLARI METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        console.log(`🎯 X İŞLEMİ KAYIT KURALLARI METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer x işlemi kayıt kuralları terimleri içeriyorsa özel işaretle
      if ((normalized.includes('x') && normalized.includes('kayit') && normalized.includes('kural')) ||
          (normalized.includes('x') && normalized.includes('islemi') && normalized.includes('kural')) ||
          (normalized.includes('kayit') && normalized.includes('kural'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 X İŞLEMİ KAYIT KURALLARI METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ X İŞLEMİ KAYIT KURALLARI METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 X İŞLEMİ KAYIT KURALLARI METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (X İşlemi Kayıt Kuralları tablolarını geç)`);
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
  console.log(`✅ X İŞLEMİ KAYIT KURALLARI METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForXIslemiKayitKurallariTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: X İşlemi Kayıt Kuralları Metni aranıyor...');
  
  const keywords = [
    // YÜKSEK öncelik - X İşlemi Kayıt Kuralları spesifik
    'x islemi kayit kurallari', 'x işlemi kayıt kuralları', 'x islemi kayit kurali', 'x işlemi kayıt kuralı',
    'x kayit kurallari', 'x kayıt kuralları', 'x kayit kurali', 'x kayıt kuralı',
    'x islemi kurallar', 'x işlemi kurallar', 'x islemi kurallari', 'x işlemi kuralları',
    'x recording rules', 'x record rules', 'x transaction rules', 'x entry rules', 'x booking rules',
    // ORTA-YÜKSEK öncelik - Kayıt kuralları kavramları
    'kayit kurallari', 'kayıt kuralları', 'kayit kurali', 'kayıt kuralı',
    'recording rules', 'record rules', 'booking rules', 'entry rules',
    'muhasebe kayit kurallari', 'muhasebe kayıt kuralları', 'accounting recording rules', 'accounting rules',
    'mali kayit kurallari', 'mali kayıt kuralları', 'finansal kayit kurallari', 'finansal kayıt kuralları',
    'yevmiye kayit kurallari', 'yevmiye kayıt kuralları', 'journal entry rules',
    'defteri kebir kurallari', 'defteri kebir kuralları', 'ledger rules',
    'fis kurallari', 'fiş kuralları', 'voucher rules', 'belge kurallari', 'belge kuralları', 'document rules',
    // ORTA öncelik - X işlemi terimleri
    'x islemi', 'x işlemi', 'x transaction', 'x islemi standartlari', 'x işlemi standartları',
    'x islemi politikalari', 'x işlemi politikaları', 'x islemi yonergeleri', 'x işlemi yönergeleri',
    'x islemi prosedur', 'x işlemi prosedür', 'x islemi usul', 'x işlemi usul',
    'x islemi esaslar', 'x işlemi esaslar', 'x islemi rehberi', 'x işlemi rehberi',
    'x islemi kilavuzu', 'x işlemi kılavuzu', 'x transaction guide', 'x process rules',
    // DÜŞÜK öncelik - Genel kural terimleri
    'kurallar', 'kurallari', 'kuralları', 'kural', 'rules', 'rule', 'standartlar',
    'standartları', 'standards', 'politikalar', 'politikaları', 'policies',
    'yonergeler', 'yönergeler', 'guidelines', 'prosedur', 'prosedür', 'procedure',
    'usul', 'method', 'esaslar', 'principles', 'rehber', 'guide', 'kilavuz', 'kılavuz'
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
    'x islemi muhasebe', 'x işlemi muhasebe', /* ama "kuralları" olmadan */
    'x islemi muhasebe deseni', 'x işlemi muhasebe deseni',
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
    
    // Skorlama - X İşlemi Kayıt Kuralları spesifik
    let score = 0;
    
    // Keyword puanları (X İşlemi Kayıt Kuralları odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - X + Kayıt + Kuralları kombinasyonu
      if (keyword.includes('x') && keyword.includes('kayit') && keyword.includes('kural')) {
        score += count * 65; // En önemli - X İşlemi Kayıt Kuralları
      } else if (keyword.includes('x') && keyword.includes('islemi') && keyword.includes('kural')) {
        score += count * 60; // X İşlemi Kuralları
      } else if (keyword.includes('x') && keyword.includes('recording') && keyword.includes('rules')) {
        score += count * 55; // X Recording Rules
      }
      // YÜKSEK öncelik - Kayıt Kuralları spesifik
      else if (keyword.includes('kayit') && keyword.includes('kural')) {
        score += count * 50; // Kayıt Kuralları
      } else if (keyword.includes('recording') && keyword.includes('rules')) {
        score += count * 45; // Recording Rules
      } else if (keyword.includes('muhasebe') && keyword.includes('kayit') && keyword.includes('kural')) {
        score += count * 40; // Muhasebe Kayıt Kuralları
      }
      // ORTA-YÜKSEK öncelik - X İşlemi terimleri
      else if (keyword.includes('x') && keyword.includes('islemi')) {
        score += count * 35; // X İşlemi
      } else if (keyword === 'x islemi' || keyword === 'x işlemi') {
        score += count * 30; // X İşlemi ana terim
      }
      // ORTA öncelik - Kural terimleri
      else if (keyword === 'kayit kurallari' || keyword === 'kayıt kuralları') {
        score += count * 30; // Kayıt kuralları
      } else if (keyword === 'kurallar' || keyword === 'kurallari' || keyword === 'rules') {
        score += count * 20; // Genel kurallar
      }
      // DÜŞÜK öncelik
      else {
        score += count * 15; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Yüksek eşik - X İşlemi Kayıt Kuralları için çok seçici
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
export async function parseXIslemiKayitKurallariTextFromDocx(file: File): Promise<XIslemiKayitKurallariTextParseResult> {
  console.log('🔍 DOCX X İşlemi Kayıt Kuralları Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findXIslemiKayitKurallariTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 X İşlemi Kayıt Kuralları Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['X İşlemi Kayıt Kuralları Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['X İşlemi Kayıt Kuralları Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForXIslemiKayitKurallariTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 X İşlemi Kayıt Kuralları Metni Parse Sonucu (SCAN):', {
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
      errors: ['X İşlemi Kayıt Kuralları Metni içeriği bulunamadı'],
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
