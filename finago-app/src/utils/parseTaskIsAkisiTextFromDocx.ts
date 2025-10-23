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

interface TaskIsAkisiTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// TASK İŞ AKIŞI metin başlığını bul
function findTaskIsAkisiTextHeader(doc: Document): Element | null {
  console.log('🔍 TASK İŞ AKIŞI METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler
    'task is akisi',
    'task iş akışı',
    'task akisi',
    'task akışı',
    'is akisi',
    'iş akışı',
    'task flow',
    'workflow',
    'business process',
    'process flow',
    'task yonetimi',
    'task yönetimi',
    'is sureci',
    'iş süreci',
    'task sureci',
    'task süreci',
    'otomatik islem',
    'otomatik işlem',
    'zamanli islem',
    'zamanlı işlem',
    'batch process',
    'job flow',
    // Tek kelimeli - sadece iş akışı spesifik
    'akis',
    'akış',
    'flow',
    'workflow',
    'surec',
    'süreç',
    // NOT: 'task', 'batch', 'job', 'process', 'islem' çıkarıldı (Tasklar/Batchlar ile karışmasın)
    // Numaralı başlıklar
    '8. task',
    '8.1 task',
    '9. task',
    '9.1 task',
    '10. task',
    '10.1 task',
    '11. task',
    '12. task',
    '8. is akisi',
    '8.1 is akisi',
    '9. is akisi',
    '9.1 is akisi',
    '10. is akisi',
    '11. is akisi',
    // Alternatif yazımlar
    'task akışı',
    'task akisi',
    'iş akışı',
    'iş akisi',
    'işakışı',
    'işakisi',
    'taskakışı',
    'taskakisi'
  ];
  
  console.log('🔍 TASK İŞ AKIŞI METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        console.log(`🎯 TASK İŞ AKIŞI METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
    
    // Debug: İlk 100 elementi logla (daha fazla debug)
    if (i < 100) {
      console.log(`🔍 Element ${i + 1}: "${text.substring(0, 80)}..." → "${normalized.substring(0, 80)}..."`);
      
      // Eğer "task", "akış", "iş" gibi kelimeler içeriyorsa özel işaretle
      if (normalized.includes('task') || normalized.includes('akis') || normalized.includes('is') || 
          normalized.includes('flow') || normalized.includes('process') || normalized.includes('islem')) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 100) { // Kısa başlık benzeri metinler
        console.log(`🎯 TASK İŞ AKIŞI METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ TASK İŞ AKIŞI METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 TASK İŞ AKIŞI METNİ: Başlık altındaki içerik toplaniyor...');
  
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
    
    // Tablo içeriği atla (task iş akışı tablolarını geç)
    if (tagName === 'table' || currentElement.querySelector('table')) {
      console.log(`🚫 Tablo atlandı (Task İş Akışı tablo parseri ayrı)`);
      elementCount++;
      currentElement = currentElement.nextElementSibling;
      continue;
    }
    
    // İyi görünen içerik (çok esnek)
    if (text.length >= 3) {
      content.push(text);
      console.log(`✅ İçerik eklendi (${text.length} kar): "${text.substring(0, 100)}..."`);
      
      // İlk 3 paragrafı bulduktan sonra dur (sadece task iş akışı metni)
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
  console.log(`✅ TASK İŞ AKIŞI METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForTaskIsAkisiTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Task İş Akışı Metni aranıyor...');
  
  const keywords = [
    // ÇOK YÜKSEK öncelik - Task İş Akışı spesifik
    'task is akisi', 'task iş akışı', 'task akisi', 'task akışı',
    'is akisi', 'iş akışı', 'task flow', 'workflow', 'business process',
    'process flow', 'task yonetimi', 'task yönetimi', 'is sureci', 'iş süreci',
    'task sureci', 'task süreci',
    // YÜKSEK öncelik - İş akışı terimleri (Tasklar/Batchlar değil)
    'akisi', 'akışı', 'akis', 'akış', 'flow', 'workflow', 'surec', 'süreç',
    'yonetim', 'yönetimi', 'process', 'procedure', 'prosedur',
    // ORTA öncelik - Genel terimler (dikkatli kullan)
    'otomatik islem', 'otomatik işlem', 'zamanli islem', 'zamanlı işlem',
    'otomatik', 'automatic', 'zamanlanmis', 'zamanlanmış', 'scheduled',
    'periyodik', 'periodic', 'program', 'servis', 'service',
    'running', 'execution', 'isletme', 'işletme',
    // DÜŞÜK öncelik - Az puanla kullan
    'sistem', 'system', 'platform', 'uygulama', 'application',
    'fonksiyon', 'function', 'metod', 'method'
    // NOT: 'task', 'batch', 'job' çıkarıldı çünkü Tasklar/Batchlar ile karışıyor
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
    // Tasklar/Batchlar içeriklerini hariç tut
    'tasklar batchlar', 'tasklar batchler', 'tasklar/batchlar',
    'yeni/mevcut', 'yeni mevcut', 'sorumlu sistem', 'çalışma saati', 'çalışma sıklığı',
    'bağımlılıklar', 'task/job adı', 'task job adı', 'taskjob adı',
    'calısma saati', 'calısma sıklıgı', 'bagımlılıklar', 'bagimliliklar',
    'sorumlu sistem', 'calisma', 'calışma', 'sıklıgı', 'sikligı',
    // Diğer modalların içerikleri
    'entegrasyonlar', 'mesajlar', 'parametreler', 'muhasebe', 'yetkilendirme',
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar'
  ];
  
  const allElements = doc.querySelectorAll('p, div, span');
  const candidates: { element: Element; score: number; content: string }[] = [];
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent?.trim() || '';
    const normalized = normalizeText(text);
    
    // Çok kısa veya blacklist kontrolü (daha toleranslı)
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
    
    // Tablo içeriği atla (tablolar ayrı parse edilir)
    if (element.closest('table')) continue;
    
    // Skorlama - task/iş akışı spesifik
    let score = 0;
    
    // Keyword puanları (Task İş Akışı odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Task İş Akışı birleşik terimleri
      if (keyword.includes('task') && (keyword.includes('akis') || keyword.includes('akış'))) {
        score += count * 40; // Task iş akışı terimleri EN ÖNEMLİ
      } else if (keyword.includes('is akis') || keyword.includes('iş akış') || keyword === 'workflow') {
        score += count * 35; // İş akışı/workflow terimleri çok önemli
      } 
      // YÜKSEK öncelik - İş akışı spesifik terimler
      else if (keyword === 'akış' || keyword === 'akis' || keyword === 'flow') {
        score += count * 30; // Akış/flow kelimelerini öncelikle
      } else if (keyword.includes('process') || keyword.includes('surec') || keyword.includes('prosedur')) {
        score += count * 25; // Süreç terimleri önemli
      } else if (keyword.includes('yonetim') || keyword.includes('yönetim')) {
        score += count * 20; // Yönetim terimleri önemli
      }
      // ORTA öncelik - Otomatik işlem terimleri
      else if (keyword.includes('otomatik') || keyword.includes('zamanl') || keyword.includes('periyodik')) {
        score += count * 15; // Otomatik işlem terimleri
      }
      // DÜŞÜK öncelik - Genel terimler
      else {
        score += count * 5; // Genel terimler çok düşük puan
      }
    }
    
    // Uzunluk puanı (daha uzun metinler tercih edilir)
    score += Math.min(text.length / 20, 20);
    
    // Orta eşik (daha selektif)
    if (score > 15) {
      candidates.push({ element, score, content: text });
      console.log(`📊 Aday bulundu: Skor ${score}, "${text.substring(0, 80)}..."`);
    }
  }
  
  // En yüksek skorlu adayları al
  candidates.sort((a, b) => b.score - a.score);
  
  console.log(`📊 ${candidates.length} aday bulundu`);
  
  // Tüm adayları göster (debug için)
  for (let i = 0; i < Math.min(10, candidates.length); i++) {
    const candidate = candidates[i];
    console.log(`🏆 Aday ${i + 1}: Skor ${candidate.score}, "${candidate.content.substring(0, 120)}..."`);
  }
  
  if (candidates.length > 0) {
    // İlk 5 adayı al (daha fazla içerik)
    const topCandidates = candidates.slice(0, 5);
    const result = topCandidates.map(c => c.content).join('\n\n');
    console.log(`✅ SCAN mode sonuç: ${result.length} karakter`);
    return result;
  }
  
  console.log('❌ SCAN mode\'da uygun içerik bulunamadı');
  return '';
}

// Ana parse fonksiyonu
export async function parseTaskIsAkisiTextFromDocx(file: File): Promise<TaskIsAkisiTextParseResult> {
  console.log('🔍 DOCX Task İş Akışı Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findTaskIsAkisiTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Task İş Akışı Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Task İş Akışı Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Task İş Akışı Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForTaskIsAkisiTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Task İş Akışı Metni Parse Sonucu (SCAN):', {
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
      errors: ['Task İş Akışı Metni içeriği bulunamadı'],
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
