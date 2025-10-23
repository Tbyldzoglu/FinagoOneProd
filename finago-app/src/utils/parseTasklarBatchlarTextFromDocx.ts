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

interface TasklarBatchlarTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// TASKLAR/BATCHLAR metin başlığını bul
function findTasklarBatchlarTextHeader(doc: Document): Element | null {
  console.log('🔍 TASKLAR/BATCHLAR METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    'tasklar batchlar',
    'tasklar batchler',
    'task is akisi',
    'task iş akışı',
    'task is akisi',
    'task iş akışı',
    'tasklar',
    'batchlar',
    'batchler',
    'task',
    'batch',
    'batch islem',
    'batch işlem',
    'task yonetimi',
    'task yönetimi',
    'is akisi',
    'iş akışı',
    'task flow',
    'batch process',
    'workflow',
    'job process',
    'task process',
    'otomatik islem',
    'otomatik işlem',
    'zamanli islem',
    'zamanlı işlem',
    'periyodik',
    'periodic',
    'scheduled',
    '8. tasklar',
    '8.1 tasklar',
    '9. tasklar',
    '9.1 tasklar',
    '8. batch',
    '9. batch',
    '10. tasklar',
    '10.1 tasklar',
    '11. tasklar',
    '11.1 tasklar'
  ];
  
  console.log('🔍 TASKLAR/BATCHLAR METNİ: Başlık aranıyor...', searchTerms);
  
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
        console.log(`🎯 TASKLAR/BATCHLAR METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
    
    // Debug: İlk 50 elementi logla
    if (i < 50) {
      console.log(`🔍 Element ${i + 1}: "${text.substring(0, 60)}..." → "${normalized.substring(0, 60)}..."`);
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 100) { // Kısa başlık benzeri metinler
        console.log(`🎯 TASKLAR/BATCHLAR METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ TASKLAR/BATCHLAR METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 TASKLAR/BATCHLAR METNİ: Başlık altındaki içerik toplaniyor...');
  
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
    
    // Tablo içeriği atla (tasklar/batchlar tablolarını geç)
    if (tagName === 'table' || currentElement.querySelector('table')) {
      console.log(`🚫 Tablo atlandı (Tasklar/Batchlar tablo parseri ayrı)`);
      elementCount++;
      currentElement = currentElement.nextElementSibling;
      continue;
    }
    
    // İyi görünen içerik (çok esnek)
    if (text.length >= 3) {
      content.push(text);
      console.log(`✅ İçerik eklendi (${text.length} kar): "${text.substring(0, 100)}..."`);
      
      // İlk 3 paragrafı bulduktan sonra dur (sadece tasklar/batchlar metni)
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
  console.log(`✅ TASKLAR/BATCHLAR METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForTasklarBatchlarTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Tasklar/Batchlar Metni aranıyor...');
  
  const keywords = [
    'tasklar batchlar', 'tasklar batchler', 'task is akisi', 'task iş akışı',
    'tasklar', 'batchlar', 'batchler', 'batch islem', 'batch işlem',
    'task yonetimi', 'task yönetimi', 'is akisi', 'iş akışı',
    'task flow', 'batch process', 'workflow', 'job process', 'task process',
    'otomatik', 'automatic', 'zamanlanmis', 'zamanlanmış', 'scheduled',
    'periyodik', 'periodic', 'batch', 'task',
    'otomatik islem', 'otomatik işlem', 'zamanli islem', 'zamanlı işlem',
    'job', 'islem', 'işlem', 'isler', 'işler', 'gorev', 'görev',
    'program', 'servis', 'service', 'arka plan', 'background',
    'calisma', 'çalışma', 'running', 'execution', 'icra', 'running'
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
    
    // Çok kısa veya blacklist kontrolü
    if (text.length < 30) continue;
    
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
    
    // Skorlama - task/batch/workflow spesifik
    let score = 0;
    
    // Keyword puanları (task/batch/workflow terimleri daha yüksek puan)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      if (keyword.includes('task') || keyword.includes('batch') || keyword.includes('workflow')) {
        score += count * 25; // Task/batch terimleri daha önemli
      } else if (keyword.includes('akisi') || keyword.includes('akışı') || keyword.includes('yonetimi')) {
        score += count * 20; // İş akışı terimleri önemli
      } else {
        score += count * 10;
      }
    }
    
    // Uzunluk puanı (daha uzun metinler tercih edilir)
    score += Math.min(text.length / 10, 30);
    
    // Daha düşük eşik (debug için)
    if (score > 10) {
      candidates.push({ element, score, content: text });
      console.log(`📊 Aday bulundu: Skor ${score}, "${text.substring(0, 80)}..."`);
    }
  }
  
  // En yüksek skorlu adayları al
  candidates.sort((a, b) => b.score - a.score);
  
  console.log(`📊 ${candidates.length} aday bulundu`);
  for (let i = 0; i < Math.min(3, candidates.length); i++) {
    const candidate = candidates[i];
    console.log(`🏆 Aday ${i + 1}: Skor ${candidate.score}, "${candidate.content.substring(0, 100)}..."`);
  }
  
  if (candidates.length > 0) {
    const topCandidates = candidates.slice(0, 3);
    const result = topCandidates.map(c => c.content).join('\n\n');
    console.log(`✅ SCAN mode sonuç: ${result.length} karakter`);
    return result;
  }
  
  console.log('❌ SCAN mode\'da uygun içerik bulunamadı');
  return '';
}

// Ana parse fonksiyonu
export async function parseTasklarBatchlarTextFromDocx(file: File): Promise<TasklarBatchlarTextParseResult> {
  console.log('🔍 DOCX Tasklar/Batchlar Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findTasklarBatchlarTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Tasklar/Batchlar Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Tasklar/Batchlar Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Tasklar/Batchlar Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForTasklarBatchlarTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Tasklar/Batchlar Metni Parse Sonucu (SCAN):', {
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
      errors: ['Tasklar/Batchlar Metni içeriği bulunamadı'],
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
