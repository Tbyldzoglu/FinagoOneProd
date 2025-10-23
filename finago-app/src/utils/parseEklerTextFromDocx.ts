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

interface EklerTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// EKLER metin başlığını bul
function findEklerTextHeader(doc: Document): Element | null {
  console.log('🔍 EKLER METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler - Ekler (Sadece "ekler", "ek" çok genel)
    'ekler',
    'ek dosyalar',
    'ek dosyalari',
    'ek belgeler',
    'ek belgeleri',
    'appendix',
    'appendices',
    'attachments',
    'attachment',
    'appendices and attachments',
    'ek ve belgeler',
    'ek ve dosyalar',
    'dokuman ekleri',
    'doküman ekleri',
    'document attachments',
    'document appendix',
    'document appendices',
    // Ek türleri
    'ek listesi',
    'ek liste',
    'appendix list',
    'attachment list',
    'list of attachments',
    'list of appendices',
    'eklenen dosyalar',
    'eklenen belgeler',
    'attached files',
    'attached documents',
    'included files',
    'included documents',
    'supporting documents',
    'supporting files',
    'destekleyici belgeler',
    'destekleyici dosyalar',
    // Referans ekleri
    'referans ekleri',
    'referans belgeleri',
    'reference attachments',
    'reference documents',
    'reference materials',
    'referans materyalleri',
    'kaynaklar',
    'kaynak belgeler',
    'source documents',
    'source materials',
    'kaynak materyaller',
    // İlgili belgeler
    'ilgili belgeler',
    'ilgili dosyalar',
    'related documents',
    'related files',
    'related materials',
    'ilgili materyaller',
    'bagimli belgeler',
    'bağımlı belgeler',
    'dependent documents',
    'linked documents',
    'bagli belgeler',
    'bağlı belgeler',
    // Ek kategorileri
    'ek kategorileri',
    'ek kategori',
    'attachment categories',
    'appendix categories',
    'ek turleri',
    'ek türleri',
    'attachment types',
    'appendix types',
    'ek siniflandirmasi',
    'ek sınıflandırması',
    'attachment classification',
    'appendix classification',
    // Dokümantasyon ekleri
    'dokumantasyon ekleri',
    'dokümantasyon ekleri',
    'documentation attachments',
    'documentation appendices',
    'teknik belgeler',
    'technical documents',
    'technical attachments',
    'teknik ekler',
    'is belgeleri',
    'iş belgeleri',
    'business documents',
    'business attachments',
    'isletme belgeleri',
    'işletme belgeleri',
    // Veri ekleri
    'veri ekleri',
    'veri dosyalari',
    'veri dosyaları',
    'data attachments',
    'data files',
    'data documents',
    'veri belgeleri',
    'bilgi ekleri',
    'information attachments',
    'information documents',
    'bilgi belgeleri',
    // Şema ve formatlar
    'sema ekleri',
    'şema ekleri',
    'schema attachments',
    'schema documents',
    'format ekleri',
    'format belgeleri',
    'format specifications',
    'format specifications ekleri',
    'sablonlar',
    'şablonlar',
    'templates',
    'template files',
    'sablon dosyalari',
    'şablon dosyaları',
    // Örnek belgeler
    'ornek belgeler',
    'örnek belgeler',
    'ornek dosyalar',
    'örnek dosyalar',
    'sample documents',
    'sample files',
    'sample attachments',
    'example documents',
    'example files',
    'ornek ekler',
    'örnek ekler',
    'example attachments',
    // Konfigürasyon ekleri
    'konfigurasyonlar',
    'konfigurasyon ekleri',
    'configuration files',
    'configuration attachments',
    'config files',
    'ayar dosyalari',
    'ayar dosyaları',
    'settings files',
    'settings attachments',
    'parametreler eki',
    'parameters attachment',
    // Log ve rapor ekleri
    'log ekleri',
    'log dosyalari',
    'log dosyaları',
    'log files',
    'log attachments',
    'rapor ekleri',
    'report attachments',
    'report files',
    'raporlar eki',
    'reports attachment',
    // Test ekleri
    'test ekleri',
    'test dosyalari',
    'test dosyaları',
    'test files',
    'test attachments',
    'test belgeleri',
    'test documents',
    'test senaryolari eki',
    'test senaryoları eki',
    'test scenarios attachment',
    // Yedek ve arşiv
    'yedek ekleri',
    'backup files',
    'backup attachments',
    'arsiv ekleri',
    'arşiv ekleri',
    'archive files',
    'archive attachments',
    'archived documents',
    'arsivlenmis belgeler',
    'arşivlenmiş belgeler',
    // Diğer ek türleri
    'image ekleri',
    'resim ekleri',
    'image files',
    'image attachments',
    'media ekleri',
    'media files',
    'media attachments',
    'multimedya ekleri',
    'multimedia attachments',
    'video ekleri',
    'video files',
    'audio ekleri',
    'audio files',
    'ses ekleri',
    'ses dosyalari',
    'ses dosyaları',
    // Numaralı başlıklar
    '8.',
    '8.1',
    '8.2',
    '9.',
    '9.1',
    '9.2',
    '10.',
    '10.1',
    '10.2',
    '11.',
    '11.1',
    '11.2',
    '1. ekler',
    '1.1 ekler',
    '2. ekler',
    '2.1 ekler',
    '1. ek',
    '1.1 ek',
    '2. ek',
    '2.1 ek',
    '1. appendix',
    '1.1 appendix',
    '2. appendix',
    '2.1 appendix',
    '1. attachment',
    '1.1 attachment',
    '2. attachment',
    '2.1 attachment',
    // Sadece çok spesifik kombinasyonlar
    'ek dosyalar listesi',
    'attachment files list',
    'appendix documents list'
  ];
  
  console.log('🔍 EKLER METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
    if (normalized.includes('kapsam') && normalized.includes('disinda')) {
      console.log(`🚫 "Kapsam Dışında" başlığı atlandı: "${text}"`);
      continue;
    }
    if (normalized.includes('fonksiyonel') && normalized.includes('gereksinimler')) {
      console.log(`🚫 "Fonksiyonel Gereksinimler" başlığı atlandı: "${text}"`);
      continue;
    }
    if (normalized.includes('ekran') && normalized.includes('gereksinimler')) {
      console.log(`🚫 "Ekran Gereksinimleri" başlığı atlandı: "${text}"`);
      continue;
    }
    if ((normalized.includes('x ekrani') || normalized.includes('x ekran')) && !normalized.includes('ekler')) {
      console.log(`🚫 "X Ekranı" başlığı atlandı: "${text}"`);
      continue;
    }
    if ((normalized.includes('y ekrani') || normalized.includes('y ekran')) && !normalized.includes('ekler')) {
      console.log(`🚫 "Y Ekranı" başlığı atlandı: "${text}"`);
      continue;
    }
    if ((normalized.includes('z ekrani') || normalized.includes('z ekran')) && !normalized.includes('ekler')) {
      console.log(`🚫 "Z Ekranı" başlığı atlandı: "${text}"`);
      continue;
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term)) {
        console.log(`🎯 EKLER METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
    if (normalized.includes('kapsam') && normalized.includes('disinda')) {
      if (i < 100) {
        console.log(`🚫 "Kapsam Dışında" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    if (normalized.includes('fonksiyonel') && normalized.includes('gereksinimler')) {
      if (i < 100) {
        console.log(`🚫 "Fonksiyonel Gereksinimler" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    if (normalized.includes('ekran') && normalized.includes('gereksinimler')) {
      if (i < 100) {
        console.log(`🚫 "Ekran Gereksinimleri" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    if ((normalized.includes('x ekrani') || normalized.includes('x ekran')) && !normalized.includes('ekler')) {
      if (i < 100) {
        console.log(`🚫 "X Ekranı" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    if ((normalized.includes('y ekrani') || normalized.includes('y ekran')) && !normalized.includes('ekler')) {
      if (i < 100) {
        console.log(`🚫 "Y Ekranı" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    if ((normalized.includes('z ekrani') || normalized.includes('z ekran')) && !normalized.includes('ekler')) {
      if (i < 100) {
        console.log(`🚫 "Z Ekranı" içeriği atlandı: "${text.substring(0, 50)}..."`);
      }
      continue;
    }
    
    // Debug: İlk 100 elementi logla
    if (i < 100) {
      console.log(`🔍 Element ${i + 1}: "${text.substring(0, 80)}..." → "${normalized.substring(0, 80)}..."`);
      
      // Eğer ekler terimleri içeriyorsa özel işaretle
      if (normalized.includes('ekler') || normalized.includes('appendix') || normalized.includes('attachment')) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel ek terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 EKLER METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ EKLER METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 EKLER METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (Ekler tablolarını geç)`);
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
  console.log(`✅ EKLER METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForEklerTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Ekler Metni aranıyor...');
  
  const keywords = [
    // ÇOK YÜKSEK öncelik - Ekler tam eşleşme (Sadece spesifik terimler)
    'ekler', 'ek dosyalar', 'ek dosyalari', 'ek belgeler', 'ek belgeleri',
    'appendix', 'appendices', 'attachments', 'attachment',
    'appendices and attachments', 'ek ve belgeler', 'ek ve dosyalar',
    'dokuman ekleri', 'doküman ekleri', 'document attachments', 'document appendix',
    // YÜKSEK öncelik - Ek listesi
    'ek listesi', 'ek liste', 'appendix list', 'attachment list',
    'list of attachments', 'list of appendices', 'eklenen dosyalar', 'eklenen belgeler',
    'attached files', 'attached documents', 'included files', 'included documents',
    // YÜKSEK öncelik - Destekleyici belgeler
    'supporting documents', 'supporting files', 'destekleyici belgeler', 'destekleyici dosyalar',
    'referans ekleri', 'referans belgeleri', 'reference attachments', 'reference documents',
    'reference materials', 'referans materyalleri', 'kaynaklar', 'kaynak belgeler',
    // ORTA-YÜKSEK öncelik - İlgili belgeler
    'ilgili belgeler', 'ilgili dosyalar', 'related documents', 'related files',
    'related materials', 'ilgili materyaller', 'bagimli belgeler', 'bağımlı belgeler',
    'dependent documents', 'linked documents', 'bagli belgeler', 'bağlı belgeler',
    // ORTA-YÜKSEK öncelik - Ek kategorileri
    'ek kategorileri', 'ek kategori', 'attachment categories', 'appendix categories',
    'ek turleri', 'ek türleri', 'attachment types', 'appendix types',
    'ek siniflandirmasi', 'ek sınıflandırması', 'attachment classification', 'appendix classification',
    // ORTA öncelik - Dokümantasyon ekleri
    'dokumantasyon ekleri', 'dokümantasyon ekleri', 'documentation attachments', 'documentation appendices',
    'teknik belgeler', 'technical documents', 'technical attachments', 'teknik ekler',
    'is belgeleri', 'iş belgeleri', 'business documents', 'business attachments',
    'isletme belgeleri', 'işletme belgeleri',
    // ORTA öncelik - Veri ekleri
    'veri ekleri', 'veri dosyalari', 'veri dosyaları', 'data attachments', 'data files',
    'data documents', 'veri belgeleri', 'bilgi ekleri', 'information attachments',
    'information documents', 'bilgi belgeleri',
    // ORTA öncelik - Şema ve formatlar
    'sema ekleri', 'şema ekleri', 'schema attachments', 'schema documents',
    'format ekleri', 'format belgeleri', 'format specifications', 'sablonlar', 'şablonlar',
    'templates', 'template files', 'sablon dosyalari', 'şablon dosyaları',
    // DÜŞÜK-ORTA öncelik - Örnek belgeler
    'ornek belgeler', 'örnek belgeler', 'ornek dosyalar', 'örnek dosyalar',
    'sample documents', 'sample files', 'sample attachments', 'example documents',
    'example files', 'ornek ekler', 'örnek ekler', 'example attachments',
    // DÜŞÜK-ORTA öncelik - Konfigürasyon
    'konfigurasyonlar', 'konfigurasyon ekleri', 'configuration files', 'configuration attachments',
    'config files', 'ayar dosyalari', 'ayar dosyaları', 'settings files', 'settings attachments',
    // DÜŞÜK öncelik - Log ve rapor
    'log ekleri', 'log dosyalari', 'log dosyaları', 'log files', 'log attachments',
    'rapor ekleri', 'report attachments', 'report files', 'raporlar eki', 'reports attachment',
    // DÜŞÜK öncelik - Test ekleri
    'test ekleri', 'test dosyalari', 'test dosyaları', 'test files', 'test attachments',
    'test belgeleri', 'test documents', 'test senaryolari eki', 'test senaryoları eki',
    // DÜŞÜK öncelik - Medya (Sadece spesifik)
    'image ekleri listesi', 'resim ekleri listesi', 'media ekleri listesi',
    'multimedya ekleri listesi', 'video ekleri listesi', 'audio ekleri listesi'
  ];
  
  const blacklistKeywords = [
    'içindekiler', 'contents', 'table', 'tablo', 'page', 'sayfa',
    'başlık', 'title', 'index', 'menu', 'bölüm', 'section',
    'fonksiyonel gereksinimler', 'fonksiyonel', 'functional requirements',
    'fonksiyonel olmayan gereksinimler', 'non functional requirements',
    'ekran gereksinimleri', 'screen requirements', 'ui requirements',
    'gereksinimler', 'requirements', 'requirement', 'gereksinim',
    // Diğer modal içeriklerinden kaçın
    'amaç ve kapsam', 'amac ve kapsam', 'purpose and scope', 'objective and scope',
    'mevcut işleyiş', 'mevcut isleyis', 'current process', 'existing process',
    'planlanan işleyiş', 'planlanan isleyis', 'planned process', 'future process',
    'gereksinimler', 'requirements', 'talep', 'değerlendirme',
    'doküman', 'document', 'tarihçe', 'history',
    // Ekran modalları
    'x ekrani', 'x ekranı', 'x ekran', 'y ekrani', 'y ekranı', 'y ekran',
    'z ekrani', 'z ekranı', 'z ekran', 'ekran tasarimlari', 'ekran tasarımları', 'ekran tasarim',
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
    'kapsam disinda', 'kapsam dışında', 'out of scope', 'excluded',
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
    if (normalized.includes('kapsam') && normalized.includes('disinda')) {
      continue;
    }
    if (normalized.includes('fonksiyonel') && normalized.includes('gereksinimler')) {
      continue;
    }
    if (normalized.includes('ekran') && normalized.includes('gereksinimler')) {
      continue;
    }
    if ((normalized.includes('x ekrani') || normalized.includes('x ekran')) && !normalized.includes('ekler')) {
      continue;
    }
    if ((normalized.includes('y ekrani') || normalized.includes('y ekran')) && !normalized.includes('ekler')) {
      continue;
    }
    if ((normalized.includes('z ekrani') || normalized.includes('z ekran')) && !normalized.includes('ekler')) {
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
    
    // Skorlama - Ekler spesifik
    let score = 0;
    
    // Keyword puanları (Ekler odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Tam ekler eşleşme
      if (keyword === 'ekler') {
        score += count * 100; // En önemli - ekler
      } else if (keyword === 'appendix' || keyword === 'appendices') {
        score += count * 95; // İngilizce appendix
      } else if (keyword === 'attachments' || keyword === 'attachment') {
        score += count * 90; // İngilizce attachments
      }
      // YÜKSEK öncelik - Ek listesi ve belgeler
      else if (keyword.includes('ek listesi') || keyword.includes('ek liste')) {
        score += count * 85; // Ek listesi
      } else if (keyword.includes('ek dosyalar') || keyword.includes('ek belgeler')) {
        score += count * 80; // Ek dosyalar/belgeler
      } else if (keyword.includes('list of attachments') || keyword.includes('list of appendices')) {
        score += count * 75; // İngilizce listeler
      }
      // ORTA-YÜKSEK öncelik - Destekleyici ve referans
      else if (keyword.includes('supporting') || keyword.includes('destekleyici')) {
        score += count * 70; // Supporting documents
      } else if (keyword.includes('reference') || keyword.includes('referans')) {
        score += count * 65; // Reference materials
      }
      // ORTA öncelik - İlgili belgeler
      else if (keyword.includes('related') || keyword.includes('ilgili')) {
        score += count * 60; // İlgili belgeler
      } else if (keyword.includes('dependent') || keyword.includes('bagimli') || keyword.includes('bağımlı')) {
        score += count * 55; // Bağımlı belgeler
      }
      // ORTA öncelik - Kategoriler ve türler
      else if (keyword.includes('categories') || keyword.includes('kategoriler')) {
        score += count * 50; // Kategoriler
      } else if (keyword.includes('types') || keyword.includes('turleri') || keyword.includes('türleri')) {
        score += count * 45; // Türler
      }
      // DÜŞÜK öncelik - Spesifik türler
      else if (keyword.includes('technical') || keyword.includes('teknik')) {
        score += count * 40; // Teknik belgeler
      } else if (keyword.includes('data') || keyword.includes('veri')) {
        score += count * 35; // Veri ekleri
      } else {
        score += count * 30; // Diğer terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Çok yüksek eşik - Ekler için en seçici
    if (score > 50) {
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
export async function parseEklerTextFromDocx(file: File): Promise<EklerTextParseResult> {
  console.log('🔍 DOCX Ekler Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findEklerTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Ekler Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Ekler Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Ekler Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForEklerTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Ekler Metni Parse Sonucu (SCAN):', {
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
      errors: ['Ekler Metni içeriği bulunamadı'],
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
