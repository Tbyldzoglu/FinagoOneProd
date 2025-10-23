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

interface DiagramAkislarTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// DIAGRAM VE AKIŞLAR metin başlığını bul
function findDiagramAkislarTextHeader(doc: Document): Element | null {
  console.log('🔍 DIAGRAM VE AKIŞLAR METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler (Diagram + Akış BİRLEŞİK - Task İş Akışı'ndan farklı)
    'diagram ve akislar',
    'diagram ve akışlar',
    'diagram akislar',
    'diagram akışlar',
    'diagram ve akis',
    'diagram ve akış',
    'diagrams and flows',
    'diagramlar ve akislar',
    'diagramlar ve akışlar',
    'diagramlar akislar',
    'diagramlar akışlar',
    'akis diagramlari',
    'akış diagramları',
    'akis diyagramlari',
    'akış diyagramları',
    'flow diagrams',
    'workflow diagrams',
    'process diagrams',
    'sistem akislari',
    'sistem akışları',
    'is akis diagrami',
    'iş akış diagramı',
    'is sureci diagrami',
    'iş süreci diagramı',
    // Diagram spesifik terimler (Akış olmadan)
    'diagram',
    'diagrams',
    'diyagram',
    'diyagramlar',
    'flowchart',
    'surec diagrami',
    'süreç diagramı',
    'surecler diagrami',
    'süreçler diagramı',
    // Numaralı başlıklar
    '4.1.7',
    '7. diagram',
    '7.1 diagram',
    '8. diagram',
    '8.1 diagram',
    '9. diagram',
    '9.1 diagram',
    '10. diagram',
    '10.1 diagram',
    // Spesifik diagram türleri
    'veri akis diagrami',
    'veri akış diagramı',
    'data flow diagram',
    'entity relationship',
    'er diagram',
    'use case diagram',
    'activity diagram',
    'sequence diagram',
    'class diagram',
    'uml diagram',
    'bpmn diagram',
    'network diagram',
    'ağ diagramı',
    'mimari diagram',
    'architecture diagram'
  ];
  
  console.log('🔍 DIAGRAM VE AKIŞLAR METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        // Task İş Akışı çakışmasını önle
        if (normalized.includes('task') && normalized.includes('is') && normalized.includes('akisi')) {
          console.log(`🚫 TASK İŞ AKIŞI ATLANILIYOR: "${text}" (çakışma önlendi)`);
          continue;
        }
        console.log(`🎯 DIAGRAM VE AKIŞLAR METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer diagram/akış terimleri içeriyorsa özel işaretle
      if (normalized.includes('diagram') || normalized.includes('akis') || normalized.includes('akış') || 
          normalized.includes('flow') || normalized.includes('surec') || normalized.includes('süreç')) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        // Task İş Akışı çakışmasını önle
        if (normalized.includes('task') && normalized.includes('is') && normalized.includes('akisi')) {
          console.log(`🚫 TASK İŞ AKIŞI ELEMENT ATLANILIYOR: "${text}" (çakışma önlendi)`);
          continue;
        }
        console.log(`🎯 DIAGRAM VE AKIŞLAR METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ DIAGRAM VE AKIŞLAR METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 DIAGRAM VE AKIŞLAR METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (Diagram/Akışlar tablolarını geç)`);
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
  console.log(`✅ DIAGRAM VE AKIŞLAR METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForDiagramAkislarTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Diagram ve Akışlar Metni aranıyor...');
  
  const keywords = [
    // YÜKSEK öncelik - Diagram ve Akışlar spesifik
    'diagram ve akislar', 'diagram ve akışlar', 'diagram akislar', 'diagram akışlar',
    'diagramlar ve akislar', 'diagramlar ve akışlar', 'diagrams and flows',
    'akis diagramlari', 'akış diagramları', 'akis diyagramlari', 'akış diyagramları',
    'flow diagrams', 'workflow diagrams', 'process diagrams',
    'sistem akislari', 'sistem akışları', 'is akis diagrami', 'iş akış diagramı',
    'is sureci diagrami', 'iş süreci diagramı',
    // ORTA öncelik - Ana terimler
    'diagram', 'diagrams', 'diyagram', 'diyagramlar',
    'akis', 'akış', 'akislar', 'akışlar', 'flow', 'flows', 'flowchart',
    'surec', 'süreç', 'surecler', 'süreçler',
    // DÜŞÜK öncelik - Spesifik diagram türleri
    'veri akis diagrami', 'veri akış diagramı', 'data flow diagram',
    'entity relationship', 'er diagram', 'use case diagram',
    'activity diagram', 'sequence diagram', 'class diagram',
    'uml diagram', 'bpmn', 'process map', 'process mapping',
    'visualization', 'görselleştirme', 'chart', 'grafik',
    'şema', 'schema', 'model', 'modeling', 'modelleme'
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
    'task is akisi', 'task iş akışı', 'is akisi', 'iş akışı' /* Task İş Akışı çakışmasını önle */,
    'conversion ve migration', 'conversion migration', 'donusum ve migrasyon',
    'veri donusumu', 'veri dönüşümü', 'veri migrasyonu', 'data conversion',
    'data migration', 'aktarim', 'aktarım', 'transfer', 'gecis', 'geçiş',
    // Diğer modalların içerikleri (GENİŞLETİLDİ)
    'entegrasyonlar', 'mesajlar', 'parametreler', 'muhasebe', 'yetkilendirme',
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar',
    'x islemi muhasebe', 'x işlemi muhasebe', 'muhasebe deseni', 'kayit kurallari',
    'kayıt kuralları', 'case1', 'case 1', 'test senaryolari', 'test senaryoları',
    // Tablo parser'larından kaçın
    'talep bilgileri', 'sistem bilgileri', 'proje bilgileri',
    'uygulamalar tablosu', 'veritabanlari tablosu', 'veritabanları tablosu',
    'donanim tablosu', 'donanım tablosu', 'network tablosu', 'ağ tablosu',
    // Conversation/Migration spesifik terimler
    'veri cevrim', 'veri çevrim', 'sistem migrasyonu', 'sistem geçişi',
    'platform migrasyonu', 'platform geçişi', 'veri transferi', 'data transfer',
    'import', 'export', 'backup', 'restore', 'sync', 'senkronizasyon'
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
    
    // Skorlama - Diagram/Akışlar spesifik
    let score = 0;
    
    // Keyword puanları (Diagram/Akışlar odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Birleşik terimler (Diagram + Akış spesifik)
      if ((keyword.includes('diagram') && keyword.includes('akis')) || 
          (keyword.includes('diagram') && keyword.includes('akış'))) {
        score += count * 50; // En önemli - Diagram ve Akışlar kombinasyonu
      } else if (keyword.includes('flow diagram') || keyword.includes('workflow diagram')) {
        score += count * 45; // Flow diagram spesifik
      } else if (keyword.includes('process diagram') || keyword.includes('akis diyagram')) {
        score += count * 40; // Process diagram türleri
      }
      // YÜKSEK öncelik - Diagram spesifik terimler
      else if (keyword === 'diagram' || keyword === 'diyagram' || keyword === 'flowchart') {
        score += count * 35; // Diagram ana kelimeler
      } else if (keyword === 'akış' || keyword === 'akis' || keyword === 'flow') {
        score += count * 30; // Akış ana kelimeler
      } else if (keyword.includes('uml') || keyword.includes('bpmn') || keyword.includes('er diagram')) {
        score += count * 30; // Profesyonel diagram türleri
      }
      // ORTA-YÜKSEK öncelik - Süreç terimleri
      else if (keyword.includes('surec') || keyword.includes('süreç') || keyword.includes('process')) {
        score += count * 25; // Süreç terimleri
      } else if (keyword.includes('visualization') || keyword.includes('görsel') || keyword.includes('chart')) {
        score += count * 20; // Görselleştirme terimleri
      }
      // ORTA öncelik - Modeling terimler
      else if (keyword.includes('model') || keyword.includes('schema') || keyword.includes('şema')) {
        score += count * 15; // Modeling terimleri
      }
      // DÜŞÜK öncelik
      else {
        score += count * 10; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Yüksek eşik - Diagram/Akışlar için daha seçici
    if (score > 25) {
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
export async function parseDiagramAkislarTextFromDocx(file: File): Promise<DiagramAkislarTextParseResult> {
  console.log('🔍 DOCX Diagram ve Akışlar Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findDiagramAkislarTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Diagram ve Akışlar Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Diagram ve Akışlar Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Diagram ve Akışlar Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForDiagramAkislarTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Diagram ve Akışlar Metni Parse Sonucu (SCAN):', {
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
      errors: ['Diagram ve Akışlar Metni içeriği bulunamadı'],
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
