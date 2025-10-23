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

interface FonksiyonelOlmayanGereksinimlerTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// FONKSİYONEL OLMAYAN GEREKSİNİMLER metin başlığını bul
function findFonksiyonelOlmayanGereksinimlerTextHeader(doc: Document): Element | null {
  console.log('🔍 FONKSİYONEL OLMAYAN GEREKSİNİMLER METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler - Fonksiyonel Olmayan Gereksinimler
    'fonksiyonel olmayan gereksinimler',
    'fonksiyonel olmayan gereksinim',
    'fonksiyonel olmayan gereksinimler',
    'fonksiyonel olmayan gereksinimleri',
    'non functional requirements',
    'non functional requirement',
    'nonfunctional requirements',
    'nonfunctional requirement',
    'non-functional requirements',
    'non-functional requirement',
    'fonksiyonel disinda gereksinimler',
    'fonksiyonel dışında gereksinimler',
    'fonksiyonel disinda gereksinim',
    'fonksiyonel dışında gereksinim',
    'fonksiyonel disi gereksinimler',
    'fonksiyonel dışı gereksinimler',
    'fonksiyonel disi gereksinim',
    'fonksiyonel dışı gereksinim',
    // Kısaltmalar
    'nfr',
    'nfrs',
    'fo gereksinimler',
    'fol gereksinimler',
    'fon gereksinimler',
    'fo gereksinim',
    'fol gereksinim',
    'fon gereksinim',
    // Teknik gereksinimler
    'teknik gereksinimler',
    'teknik gereksinim',
    'teknik gereksinimler',
    'teknik gereksinimleri',
    'technical requirements',
    'technical requirement',
    'system requirements',
    'system requirement',
    'sistem gereksinimleri',
    'sistem gereksinim',
    'sistem gereksinimler',
    'sistem gereksinimler',
    // Performans gereksinimleri
    'performans gereksinimleri',
    'performans gereksinim',
    'performans gereksinimler',
    'performance requirements',
    'performance requirement',
    'hiz gereksinimleri',
    'hız gereksinimleri',
    'hiz gereksinim',
    'hız gereksinim',
    'speed requirements',
    'speed requirement',
    // Güvenlik gereksinimleri
    'guvenlik gereksinimleri',
    'güvenlik gereksinimleri',
    'guvenlik gereksinim',
    'güvenlik gereksinim',
    'security requirements',
    'security requirement',
    'emniyet gereksinimleri',
    'emniyet gereksinim',
    'safety requirements',
    'safety requirement',
    // Kullanılabilirlik gereksinimleri
    'kullanilabilirlik gereksinimleri',
    'kullanılabilirlik gereksinimleri',
    'kullanilabilirlik gereksinim',
    'kullanılabilirlik gereksinim',
    'usability requirements',
    'usability requirement',
    'user experience requirements',
    'user experience requirement',
    'ux requirements',
    'ux requirement',
    // Ölçeklenebilirlik gereksinimleri
    'olceklenebilirlik gereksinimleri',
    'ölçeklenebilirlik gereksinimleri',
    'olceklenebilirlik gereksinim',
    'ölçeklenebilirlik gereksinim',
    'scalability requirements',
    'scalability requirement',
    'genisletilebilirlik gereksinimleri',
    'genişletilebilirlik gereksinimleri',
    'genisletilebilirlik gereksinim',
    'genişletilebilirlik gereksinim',
    'extensibility requirements',
    'extensibility requirement',
    // Güvenilirlik gereksinimleri
    'guvenilirlik gereksinimleri',
    'güvenilirlik gereksinimleri',
    'guvenilirlik gereksinim',
    'güvenilirlik gereksinim',
    'reliability requirements',
    'reliability requirement',
    'kararliliik gereksinimleri',
    'kararlılık gereksinimleri',
    'kararliliik gereksinim',
    'kararlılık gereksinim',
    'stability requirements',
    'stability requirement',
    // Uyumluluk gereksinimleri
    'uyumluluk gereksinimleri',
    'uyumluluk gereksinim',
    'compatibility requirements',
    'compatibility requirement',
    'uygunluk gereksinimleri',
    'uygunluk gereksinim',
    'compliance requirements',
    'compliance requirement',
    // Erişilebilirlik gereksinimleri
    'erisilebilirlik gereksinimleri',
    'erişilebilirlik gereksinimleri',
    'erisilebilirlik gereksinim',
    'erişilebilirlik gereksinim',
    'accessibility requirements',
    'accessibility requirement',
    // Bakım gereksinimleri
    'bakim gereksinimleri',
    'bakım gereksinimleri',
    'bakim gereksinim',
    'bakım gereksinim',
    'maintenance requirements',
    'maintenance requirement',
    'bakabilirlik gereksinimleri',
    'bakabilirlik gereksinim',
    'maintainability requirements',
    'maintainability requirement',
    // Taşınabilirlik gereksinimleri
    'tasinabilirlik gereksinimleri',
    'taşınabilirlik gereksinimleri',
    'tasinabilirlik gereksinim',
    'taşınabilirlik gereksinim',
    'portability requirements',
    'portability requirement',
    // Kapasite gereksinimleri
    'kapasite gereksinimleri',
    'kapasite gereksinim',
    'capacity requirements',
    'capacity requirement',
    'hacim gereksinimleri',
    'hacim gereksinim',
    'volume requirements',
    'volume requirement',
    // Operasyonel gereksinimler
    'operasyonel gereksinimler',
    'operasyonel gereksinim',
    'operational requirements',
    'operational requirement',
    'isletimsel gereksinimler',
    'işletimsel gereksinimler',
    'isletimsel gereksinim',
    'işletimsel gereksinim',
    // Numaralı başlıklar
    '4.2',
    '4.2.1',
    '4.2.2',
    '5. fonksiyonel olmayan',
    '5.1 fonksiyonel olmayan',
    '6. fonksiyonel olmayan',
    '6.1 fonksiyonel olmayan',
    '5. teknik',
    '5.1 teknik',
    '6. teknik',
    '6.1 teknik',
    '5. performans',
    '5.1 performans',
    '6. performans',
    '6.1 performans',
    // İlişkili terimler
    'kalite gereksinimleri',
    'kalite gereksinim',
    'quality requirements',
    'quality requirement',
    'hizmet seviyesi gereksinimleri',
    'hizmet seviyesi gereksinim',
    'service level requirements',
    'service level requirement',
    'sla gereksinimleri',
    'sla gereksinim',
    'sla requirements',
    'sla requirement'
  ];
  
  console.log('🔍 FONKSİYONEL OLMAYAN GEREKSİNİMLER METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        console.log(`🎯 FONKSİYONEL OLMAYAN GEREKSİNİMLER METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer fonksiyonel olmayan gereksinimler terimleri içeriyorsa özel işaretle
      if ((normalized.includes('fonksiyonel') && normalized.includes('olmayan') && normalized.includes('gereksinim')) ||
          (normalized.includes('non') && normalized.includes('functional') && normalized.includes('requirement'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 FONKSİYONEL OLMAYAN GEREKSİNİMLER METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ FONKSİYONEL OLMAYAN GEREKSİNİMLER METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 FONKSİYONEL OLMAYAN GEREKSİNİMLER METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (Fonksiyonel Olmayan Gereksinimler tablolarını geç)`);
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
  console.log(`✅ FONKSİYONEL OLMAYAN GEREKSİNİMLER METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForFonksiyonelOlmayanGereksinimlerTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Fonksiyonel Olmayan Gereksinimler Metni aranıyor...');
  
  const keywords = [
    // ÇOK YÜKSEK öncelik - Fonksiyonel Olmayan Gereksinimler spesifik
    'fonksiyonel olmayan gereksinimler', 'fonksiyonel olmayan gereksinim', 'fonksiyonel olmayan gereksinimler',
    'fonksiyonel olmayan gereksinimleri', 'non functional requirements', 'non functional requirement',
    'nonfunctional requirements', 'nonfunctional requirement', 'non-functional requirements', 'non-functional requirement',
    'fonksiyonel disinda gereksinimler', 'fonksiyonel dışında gereksinimler', 'fonksiyonel disinda gereksinim',
    'fonksiyonel dışında gereksinim', 'fonksiyonel disi gereksinimler', 'fonksiyonel dışı gereksinimler',
    // YÜKSEK öncelik - Kısaltmalar ve teknik terimler
    'nfr', 'nfrs', 'fo gereksinimler', 'fol gereksinimler', 'fon gereksinimler',
    'teknik gereksinimler', 'teknik gereksinim', 'technical requirements', 'technical requirement',
    'system requirements', 'system requirement', 'sistem gereksinimleri', 'sistem gereksinim',
    // YÜKSEK öncelik - Performans gereksinimleri
    'performans gereksinimleri', 'performans gereksinim', 'performance requirements', 'performance requirement',
    'hiz gereksinimleri', 'hız gereksinimleri', 'hiz gereksinim', 'hız gereksinim',
    'speed requirements', 'speed requirement',
    // YÜKSEK öncelik - Güvenlik gereksinimleri
    'guvenlik gereksinimleri', 'güvenlik gereksinimleri', 'guvenlik gereksinim', 'güvenlik gereksinim',
    'security requirements', 'security requirement', 'emniyet gereksinimleri', 'emniyet gereksinim',
    'safety requirements', 'safety requirement',
    // ORTA-YÜKSEK öncelik - Kullanılabilirlik gereksinimleri
    'kullanilabilirlik gereksinimleri', 'kullanılabilirlik gereksinimleri', 'kullanilabilirlik gereksinim',
    'kullanılabilirlik gereksinim', 'usability requirements', 'usability requirement',
    'user experience requirements', 'user experience requirement', 'ux requirements', 'ux requirement',
    // ORTA-YÜKSEK öncelik - Ölçeklenebilirlik gereksinimleri
    'olceklenebilirlik gereksinimleri', 'ölçeklenebilirlik gereksinimleri', 'olceklenebilirlik gereksinim',
    'ölçeklenebilirlik gereksinim', 'scalability requirements', 'scalability requirement',
    'genisletilebilirlik gereksinimleri', 'genişletilebilirlik gereksinimleri', 'genisletilebilirlik gereksinim',
    'genişletilebilirlik gereksinim', 'extensibility requirements', 'extensibility requirement',
    // ORTA öncelik - Güvenilirlik gereksinimleri
    'guvenilirlik gereksinimleri', 'güvenilirlik gereksinimleri', 'guvenilirlik gereksinim', 'güvenilirlik gereksinim',
    'reliability requirements', 'reliability requirement', 'kararliliik gereksinimleri', 'kararlılık gereksinimleri',
    'kararliliik gereksinim', 'kararlılık gereksinim', 'stability requirements', 'stability requirement',
    // ORTA öncelik - Uyumluluk gereksinimleri
    'uyumluluk gereksinimleri', 'uyumluluk gereksinim', 'compatibility requirements', 'compatibility requirement',
    'uygunluk gereksinimleri', 'uygunluk gereksinim', 'compliance requirements', 'compliance requirement',
    // ORTA öncelik - Erişilebilirlik gereksinimleri
    'erisilebilirlik gereksinimleri', 'erişilebilirlik gereksinimleri', 'erisilebilirlik gereksinim',
    'erişilebilirlik gereksinim', 'accessibility requirements', 'accessibility requirement',
    // ORTA öncelik - Bakım gereksinimleri
    'bakim gereksinimleri', 'bakım gereksinimleri', 'bakim gereksinim', 'bakım gereksinim',
    'maintenance requirements', 'maintenance requirement', 'bakabilirlik gereksinimleri', 'bakabilirlik gereksinim',
    'maintainability requirements', 'maintainability requirement',
    // ORTA öncelik - Taşınabilirlik gereksinimleri
    'tasinabilirlik gereksinimleri', 'taşınabilirlik gereksinimleri', 'tasinabilirlik gereksinim',
    'taşınabilirlik gereksinim', 'portability requirements', 'portability requirement',
    // ORTA öncelik - Kapasite gereksinimleri
    'kapasite gereksinimleri', 'kapasite gereksinim', 'capacity requirements', 'capacity requirement',
    'hacim gereksinimleri', 'hacim gereksinim', 'volume requirements', 'volume requirement',
    // DÜŞÜK öncelik - Operasyonel gereksinimler
    'operasyonel gereksinimler', 'operasyonel gereksinim', 'operational requirements', 'operational requirement',
    'isletimsel gereksinimler', 'işletimsel gereksinimler', 'isletimsel gereksinim', 'işletimsel gereksinim',
    // DÜŞÜK öncelik - Kalite gereksinimleri
    'kalite gereksinimleri', 'kalite gereksinim', 'quality requirements', 'quality requirement',
    'hizmet seviyesi gereksinimleri', 'hizmet seviyesi gereksinim', 'service level requirements',
    'service level requirement', 'sla gereksinimleri', 'sla gereksinim', 'sla requirements', 'sla requirement',
    // DÜŞÜK öncelik - Genel terimler
    'gereksinimler', 'gereksinim', 'requirements', 'requirement', 'olmayan', 'non', 'functional',
    'teknik', 'technical', 'sistem', 'system', 'performans', 'performance', 'guvenlik', 'güvenlik', 'security'
  ];
  
  const blacklistKeywords = [
    'içindekiler', 'contents', 'table', 'tablo', 'page', 'sayfa',
    'başlık', 'title', 'index', 'menu', 'bölüm', 'section',
    // Fonksiyonel gereksinimler (bizim aradığımızın tersi)
    'fonksiyonel gereksinimler', 'functional requirements', 'fonksiyonel gereksinim', 'functional requirement',
    'amaç ve kapsam', 'mevcut işleyiş', 'planlanan işleyiş',
    'talep', 'değerlendirme', 'doküman', 'document', 'tarihçe', 'history',
    'x ekrani', 'x ekranı', 'ekran tasarimlari', 'ekran tasarımları', 'ekran tasarim',
    'ekran gereksinimleri', 'screen requirements', 'ui requirements',
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
    
    // Skorlama - Fonksiyonel Olmayan Gereksinimler spesifik
    let score = 0;
    
    // Keyword puanları (Fonksiyonel Olmayan Gereksinimler odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Fonksiyonel Olmayan Gereksinimler tam eşleşme
      if (keyword === 'fonksiyonel olmayan gereksinimler' || keyword === 'non functional requirements') {
        score += count * 100; // En önemli - tam eşleşme
      } else if (keyword === 'fonksiyonel olmayan gereksinim' || keyword === 'non functional requirement') {
        score += count * 95; // Tekil hali
      } else if (keyword === 'nonfunctional requirements' || keyword === 'non-functional requirements') {
        score += count * 90; // Alternatif yazımlar
      }
      // YÜKSEK öncelik - Spesifik teknik gereksinimler
      else if (keyword.includes('performans') && keyword.includes('gereksinim')) {
        score += count * 80; // Performans gereksinimleri
      } else if (keyword.includes('performance') && keyword.includes('requirement')) {
        score += count * 75; // Performance requirements
      } else if (keyword.includes('guvenlik') && keyword.includes('gereksinim')) {
        score += count * 80; // Güvenlik gereksinimleri
      } else if (keyword.includes('security') && keyword.includes('requirement')) {
        score += count * 75; // Security requirements
      }
      // ORTA-YÜKSEK öncelik - Diğer NFR kategorileri
      else if (keyword.includes('kullanilabilirlik') || keyword.includes('usability')) {
        score += count * 70; // Kullanılabilirlik
      } else if (keyword.includes('olceklenebilirlik') || keyword.includes('scalability')) {
        score += count * 70; // Ölçeklenebilirlik
      } else if (keyword.includes('guvenilirlik') || keyword.includes('reliability')) {
        score += count * 65; // Güvenilirlik
      }
      // ORTA öncelik - Genel NFR terimleri
      else if (keyword === 'nfr' || keyword === 'nfrs') {
        score += count * 60; // Kısaltmalar
      } else if (keyword.includes('teknik gereksinim') || keyword.includes('technical requirement')) {
        score += count * 55; // Teknik gereksinimler
      } else if (keyword.includes('sistem gereksinim') || keyword.includes('system requirement')) {
        score += count * 50; // Sistem gereksinimleri
      }
      // DÜŞÜK öncelik - Genel terimler
      else if (keyword === 'gereksinimler' || keyword === 'requirements') {
        score += count * 30; // Genel gereksinimler
      } else {
        score += count * 25; // Diğer terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Yüksek eşik - Fonksiyonel Olmayan Gereksinimler için seçici
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
export async function parseFonksiyonelOlmayanGereksinimlerTextFromDocx(file: File): Promise<FonksiyonelOlmayanGereksinimlerTextParseResult> {
  console.log('🔍 DOCX Fonksiyonel Olmayan Gereksinimler Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findFonksiyonelOlmayanGereksinimlerTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Fonksiyonel Olmayan Gereksinimler Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Fonksiyonel Olmayan Gereksinimler Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Fonksiyonel Olmayan Gereksinimler Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForFonksiyonelOlmayanGereksinimlerTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Fonksiyonel Olmayan Gereksinimler Metni Parse Sonucu (SCAN):', {
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
      errors: ['Fonksiyonel Olmayan Gereksinimler Metni içeriği bulunamadı'],
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
