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

interface KapsamDisindaTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// KAPSAM DIŞINDA KALAN KONULAR / MADDELER metin başlığını bul
function findKapsamDisindaTextHeader(doc: Document): Element | null {
  console.log('🔍 KAPSAM DIŞINDA KALAN KONULAR / MADDELER METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler - Kapsam Dışında
    'kapsam disinda kalan konular',
    'kapsam dışında kalan konular',
    'kapsam disinda kalan maddeler',
    'kapsam dışında kalan maddeler',
    'kapsam disinda konular',
    'kapsam dışında konular',
    'kapsam disinda maddeler',
    'kapsam dışında maddeler',
    'kapsam disinda',
    'kapsam dışında',
    'out of scope',
    'out of scope topics',
    'out of scope items',
    'out of scope subjects',
    'outside scope',
    'outside the scope',
    'excluded from scope',
    'excluded topics',
    'excluded items',
    'excluded subjects',
    'scope exclusions',
    'exclusions',
    // Kapsam + Dahil Değil
    'kapsam dahil degil',
    'kapsam dahil değil',
    'kapsama dahil degil',
    'kapsama dahil değil',
    'kapsama dahil olmayan',
    'kapsama girmez',
    'kapsama giren',
    'kapsamda degil',
    'kapsamda değil',
    'kapsamda olmayan',
    'not in scope',
    'not included in scope',
    'not covered',
    'not covered by',
    'not within scope',
    // Hariç tutma
    'haric tutulan',
    'hariç tutulan',
    'haric tutulmasi',
    'hariç tutulması',
    'haric tutulmak',
    'hariç tutulmak',
    'haric konular',
    'hariç konular',
    'haric maddeler',
    'hariç maddeler',
    'excluded',
    'excluding',
    'exception',
    'exceptions',
    'exempt',
    'exempted',
    'exemptions',
    // İstisna
    'istisna',
    'istisnalar',
    'istisna edilen',
    'istisna konular',
    'istisna maddeler',
    'exception',
    'exceptions',
    'exceptional',
    'exceptional cases',
    'special cases',
    'ozel durumlar',
    'özel durumlar',
    // Sinirlar
    'sinirlar',
    'sınırlar',
    'sinirlilklar',
    'sınırlılıklar',
    'sinirlamalar',
    'sınırlamalar',
    'boundaries',
    'boundary',
    'limits',
    'limitations',
    'limitations and exclusions',
    'constraints',
    'restrictions',
    // Dahil Olmayan
    'dahil olmayan konular',
    'dahil olmayan maddeler',
    'dahil olmayan',
    'dahil edilmeyen',
    'dahil edilmez',
    'not included',
    'not encompassed',
    'not covered',
    'does not include',
    'will not include',
    'excludes',
    // Genel kapsam terimleri (Sadece spesifik kombinasyonlar)
    'comprehensive scope exclusions',
    'comprehensive coverage exclusions',
    // Proje kapsam terimleri
    'proje kapsami',
    'proje kapsamı',
    'project scope',
    'calisma kapsami',
    'çalışma kapsamı',
    'work scope',
    'scope of work',
    'görev kapsami',
    'görev kapsamı',
    'task scope',
    'uygulama kapsami',
    'uygulama kapsamı',
    'application scope',
    'sistem kapsami',
    'sistem kapsamı',
    'system scope',
    // Çıkarma terimleri
    'cikarilan',
    'çıkarılan',
    'cikarilmis',
    'çıkarılmış',
    'cikarilacak',
    'çıkarılacak',
    'removed',
    'removed from',
    'taken out',
    'left out',
    'omitted',
    'omitted from',
    // Tanım dışı
    'tanim disinda',
    'tanım dışında',
    'tanimda olmayan',
    'tanımda olmayan',
    'outside definition',
    'not defined',
    'undefined',
    'not specified',
    'unspecified',
    // Numaralı başlıklar
    '1.3',
    '1.4',
    '2.3',
    '2.4',
    '3.3',
    '3.4',
    '8.',
    '8.1',
    '8.2',
    '9.',
    '9.1',
    '9.2',
    '10.',
    '10.1',
    '10.2',
    '1. kapsam disinda',
    '1.1 kapsam disinda',
    '2. kapsam disinda',
    '2.1 kapsam disinda',
    '1. haric',
    '1.1 hariç',
    '2. haric',
    '2.1 hariç',
    '1. istisna',
    '1.1 istisna',
    '2. istisna',
    '2.1 istisna',
    // İlişkili terimler
    'uygulanmaz',
    'uygulanmayacak',
    'not applicable',
    'n/a',
    'gecerli degil',
    'geçerli değil',
    'not valid',
    'invalid',
    'kabul edilmez',
    'kabul edilmeyecek',
    'not accepted',
    'unacceptable',
    'red edilmis',
    'red edilmiş',
    'rejected',
    'reddedilen',
    'declined'
  ];
  
  console.log('🔍 KAPSAM DIŞINDA KALAN KONULAR / MADDELER METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
  // Önce h1-h6 başlıkları ara
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log(`📋 ${headings.length} başlık elementi bulundu`);
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const text = heading.textContent?.trim() || '';
    const normalized = normalizeText(text);
    console.log(`🔍 Başlık ${i + 1}: "${text}" → "${normalized}"`);
    
    // Diğer modal başlıklarını geç
    if (normalized.includes('amac') && normalized.includes('kapsam')) {
      console.log(`🚫 "Amaç ve Kapsam" başlığı atlandı: "${text}"`);
      continue;
    }
    if (normalized.includes('planlanan') && normalized.includes('isleyis')) {
      console.log(`🚫 "Planlanan İşleyiş" başlığı atlandı: "${text}"`);
      continue;
    }
    if (normalized.includes('mevcut') && normalized.includes('isleyis')) {
      console.log(`🚫 "Mevcut İşleyiş" başlığı atlandı: "${text}"`);
      continue;
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term)) {
        console.log(`🎯 KAPSAM DIŞINDA KALAN KONULAR / MADDELER METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
    
    // Diğer modal başlıklarını/içeriklerini geç
    if (normalized.includes('amac') && normalized.includes('kapsam')) {
      if (i < 100) {
        console.log(`🚫 "Amaç ve Kapsam" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    if (normalized.includes('planlanan') && normalized.includes('isleyis')) {
      if (i < 100) {
        console.log(`🚫 "Planlanan İşleyiş" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    if (normalized.includes('mevcut') && normalized.includes('isleyis')) {
      if (i < 100) {
        console.log(`🚫 "Mevcut İşleyiş" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    
    // Debug: İlk 100 elementi logla
    if (i < 100) {
      console.log(`🔍 Element ${i + 1}: "${text.substring(0, 80)}..." → "${normalized.substring(0, 80)}..."`);
      
      // Eğer kapsam dışında terimleri içeriyorsa özel işaretle
      if ((normalized.includes('kapsam') && normalized.includes('disinda')) ||
          (normalized.includes('out') && normalized.includes('scope')) ||
          (normalized.includes('haric') && normalized.includes('tutulan'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 KAPSAM DIŞINDA KALAN KONULAR / MADDELER METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ KAPSAM DIŞINDA KALAN KONULAR / MADDELER METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 KAPSAM DIŞINDA KALAN KONULAR / MADDELER METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (Kapsam Dışında tablolarını geç)`);
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
  console.log(`✅ KAPSAM DIŞINDA KALAN KONULAR / MADDELER METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForKapsamDisindaTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Kapsam Dışında Kalan Konular / Maddeler Metni aranıyor...');
  
  const keywords = [
    // ÇOK YÜKSEK öncelik - Kapsam Dışında tam eşleşme
    'kapsam disinda kalan konular', 'kapsam dışında kalan konular', 'kapsam disinda kalan maddeler',
    'kapsam dışında kalan maddeler', 'kapsam disinda konular', 'kapsam dışında konular',
    'kapsam disinda maddeler', 'kapsam dışında maddeler', 'kapsam disinda', 'kapsam dışında',
    'out of scope', 'out of scope topics', 'out of scope items', 'outside scope', 'excluded from scope',
    // YÜKSEK öncelik - Hariç tutma
    'haric tutulan', 'hariç tutulan', 'haric tutulmasi', 'hariç tutulması',
    'haric konular', 'hariç konular', 'haric maddeler', 'hariç maddeler',
    'excluded', 'excluding', 'excluded topics', 'excluded items', 'scope exclusions', 'exclusions',
    // YÜKSEK öncelik - Dahil olmayan
    'kapsam dahil degil', 'kapsam dahil değil', 'kapsama dahil degil', 'kapsama dahil değil',
    'kapsama dahil olmayan', 'kapsama girmez', 'kapsamda degil', 'kapsamda değil', 'kapsamda olmayan',
    'not in scope', 'not included in scope', 'not covered', 'not within scope',
    'dahil olmayan konular', 'dahil olmayan maddeler', 'dahil olmayan', 'dahil edilmeyen',
    // ORTA-YÜKSEK öncelik - İstisna
    'istisna', 'istisnalar', 'istisna edilen', 'istisna konular', 'istisna maddeler',
    'exception', 'exceptions', 'exceptional', 'exceptional cases', 'special cases',
    'ozel durumlar', 'özel durumlar',
    // ORTA-YÜKSEK öncelik - Sınırlar
    'sinirlar', 'sınırlar', 'sinirlilklar', 'sınırlılıklar', 'sinirlamalar', 'sınırlamalar',
    'boundaries', 'boundary', 'limits', 'limitations', 'limitations and exclusions',
    'constraints', 'restrictions',
    // ORTA öncelik - Proje kapsam
    'proje kapsami', 'proje kapsamı', 'project scope', 'calisma kapsami', 'çalışma kapsamı',
    'work scope', 'scope of work', 'görev kapsami', 'görev kapsamı', 'task scope',
    'uygulama kapsami', 'uygulama kapsamı', 'application scope', 'sistem kapsami', 'sistem kapsamı', 'system scope',
    // ORTA öncelik - Çıkarma terimleri
    'cikarilan', 'çıkarılan', 'cikarilmis', 'çıkarılmış', 'cikarilacak', 'çıkarılacak',
    'removed', 'removed from', 'taken out', 'left out', 'omitted', 'omitted from',
    // ORTA öncelik - Tanım dışı
    'tanim disinda', 'tanım dışında', 'tanimda olmayan', 'tanımda olmayan',
    'outside definition', 'not defined', 'undefined', 'not specified', 'unspecified',
    // DÜŞÜK öncelik - Sadece spesifik kapsam kombinasyonları
    'scope exclusions', 'scope limitations', 'kapsamli haric', 'kapsamlı hariç',
    // DÜŞÜK öncelik - Uygulanabilirlik
    'uygulanmaz', 'uygulanmayacak', 'not applicable', 'gecerli degil', 'geçerli değil',
    'not valid', 'invalid', 'kabul edilmez', 'kabul edilmeyecek', 'not accepted', 'unacceptable',
    'red edilmis', 'red edilmiş', 'rejected', 'reddedilen', 'declined'
  ];
  
  const blacklistKeywords = [
    'içindekiler', 'contents', 'table', 'tablo', 'page', 'sayfa',
    'başlık', 'title', 'index', 'menu', 'bölüm', 'section',
    'fonksiyonel gereksinimler', 'fonksiyonel', 'functional requirements',
    'fonksiyonel olmayan gereksinimler', 'non functional requirements',
    'ekran gereksinimleri', 'screen requirements', 'ui requirements',
    // Diğer modal içeriklerinden kaçın
    'amaç ve kapsam', 'amac ve kapsam', 'purpose and scope', 'objective and scope',
    'mevcut işleyiş', 'mevcut isleyis', 'current process', 'existing process',
    'planlanan işleyiş', 'planlanan isleyis', 'planned process', 'future process',
    'gereksinimler', 'requirements', 'talep', 'değerlendirme',
    'doküman', 'document', 'tarihçe', 'history', 'x ekrani', 'x ekranı',
    'ekran tasarimlari', 'ekran tasarımları', 'ekran tasarim',
    'tasklar batchlar', 'tasklar batchler', 'task is akisi', 'task iş akışı',
    'conversion ve migration', 'conversion migration', 'donusum ve migrasyon',
    'diagram ve akislar', 'diagram ve akışlar', 'diagram akislar', 'diagram akışlar',
    // X İşlemi modal'larından kaçın
    'x islemi vergi komisyon', 'x işlemi vergi komisyon', 'x islemi vergi ve komisyon',
    'x işlemi vergi ve komisyon', 'x vergi komisyon', 'x vergi ve komisyon',
    'x islemi kayit kurallari', 'x işlemi kayıt kuralları',
    'x islemi muhasebe deseni', 'x işlemi muhasebe deseni',
    'x islemi muhasebe senaryolari', 'x işlemi muhasebe senaryoları',
    'x islemi ornek kayitlar', 'x işlemi örnek kayıtlar',
    'x islemi muhasebe', 'x işlemi muhasebe', 'x muhasebe', 'x accounting',
    // Diğer modalların içerikleri
    'entegrasyonlar', 'mesajlar', 'parametreler', 'yetkilendirme',
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar',
    'case1', 'case 1', 'test senaryolari', 'test senaryoları',
    'kimlik dogrulama', 'kimlik doğrulama', 'log yonetimi', 'log yönetimi',
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
    
    // Diğer modal içeriklerini açıkça filtrele
    if (normalized.includes('amac') && normalized.includes('kapsam')) {
      continue;
    }
    if (normalized.includes('planlanan') && normalized.includes('isleyis')) {
      continue;
    }
    if (normalized.includes('mevcut') && normalized.includes('isleyis')) {
      continue;
    }
    
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
    
    // Skorlama - Kapsam Dışında spesifik
    let score = 0;
    
    // Keyword puanları (Kapsam Dışında odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Tam kapsam dışında eşleşme
      if (keyword.includes('kapsam') && keyword.includes('disinda') && keyword.includes('kalan') && keyword.includes('konular')) {
        score += count * 100; // En önemli - tam eşleşme
      } else if (keyword.includes('out') && keyword.includes('scope') && keyword.includes('topics')) {
        score += count * 95; // İngilizce tam eşleşme
      }
      // YÜKSEK öncelik - Kapsam dışında kısa
      else if (keyword === 'kapsam disinda' || keyword === 'kapsam dışında') {
        score += count * 90; // Kapsam dışında
      } else if (keyword === 'out of scope') {
        score += count * 85; // Out of scope
      }
      // YÜKSEK öncelik - Hariç tutma
      else if (keyword.includes('haric') && keyword.includes('tutulan')) {
        score += count * 80; // Hariç tutulan
      } else if (keyword === 'excluded' || keyword === 'excluding') {
        score += count * 75; // Excluded
      }
      // ORTA-YÜKSEK öncelik - Dahil olmayan
      else if (keyword.includes('dahil') && keyword.includes('degil')) {
        score += count * 70; // Dahil değil
      } else if (keyword.includes('not') && keyword.includes('scope')) {
        score += count * 65; // Not in scope
      }
      // ORTA öncelik - İstisna ve sınırlar
      else if (keyword === 'istisna' || keyword === 'istisnalar') {
        score += count * 60; // İstisna
      } else if (keyword === 'exception' || keyword === 'exceptions') {
        score += count * 55; // Exception
      } else if (keyword.includes('sinir') || keyword.includes('sinirlama')) {
        score += count * 50; // Sınırlar
      } else if (keyword === 'limitations' || keyword === 'restrictions') {
        score += count * 45; // Limitations
      }
      // DÜŞÜK öncelik - Genel terimler
      else if (keyword === 'kapsam' || keyword === 'scope') {
        score += count * 30; // Kapsam
      } else {
        score += count * 25; // Diğer terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Orta-yüksek eşik - Kapsam Dışında için seçici
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
export async function parseKapsamDisindaTextFromDocx(file: File): Promise<KapsamDisindaTextParseResult> {
  console.log('🔍 DOCX Kapsam Dışında Kalan Konular / Maddeler Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findKapsamDisindaTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Kapsam Dışında Kalan Konular / Maddeler Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Kapsam Dışında Kalan Konular / Maddeler Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Kapsam Dışında Kalan Konular / Maddeler Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForKapsamDisindaTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Kapsam Dışında Kalan Konular / Maddeler Metni Parse Sonucu (SCAN):', {
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
      errors: ['Kapsam Dışında Kalan Konular / Maddeler Metni içeriği bulunamadı'],
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
