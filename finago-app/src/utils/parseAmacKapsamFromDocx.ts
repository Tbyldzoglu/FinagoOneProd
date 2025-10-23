/**
 * Amaç ve Kapsam parser - DOCX dosyasından metin içeriği çıkarır
 */

import mammoth from 'mammoth';

export interface AmacKapsamResult {
  content: string;
  validation: {
    found: boolean;
    mode: 'strict' | 'scan';
    errors: string[];
    warnings: string[];
    matchedLabels: string[];
  };
}

/**
 * Türkçe karakterleri normalize eder ve metni temizler
 */
function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u') 
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Amaç ve Kapsam başlığını DOCX'te arar
 */
function findAmacKapsamHeader(dom: Document): Element | null {
  const searchTerms = [
    'amac ve kapsam',
    'amac kapsam', 
    'purpose and scope',
    'amac',
    'kapsam',
    'scope',
    'purpose',
    '1. amac',
    '1.1 amac',
    '1. kapsam',
    '1.1 kapsam'
  ];

  console.log('🔍 GELIŞMIŞ: Amaç ve Kapsam başlığı aranıyor...');

  // Önce başlık elementlerini kontrol et
  const headerElements = dom.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log(`📋 ${headerElements.length} başlık elementi bulundu`);
  
  for (let i = 0; i < headerElements.length; i++) {
    const element = headerElements[i];
    const text = normalizeText(element.textContent || '');
    const originalText = (element.textContent || '').trim();
    
    console.log(`🔍 Başlık ${i + 1}: "${originalText}" → "${text}"`);
    
    for (const term of searchTerms) {
      if (text.includes(term)) {
        console.log(`🎯 BAŞLIK BULUNDU: "${originalText}" (term: ${term})`);
        return element;
      }
    }
  }

  console.log('⚠️ Başlıklarda bulunamadı, tüm elementlerde aranıyor...');

  // Tüm text elementlerini kontrol et
  const allElements = dom.querySelectorAll('p, div, span, td, th, strong, b');
  console.log(`📋 ${allElements.length} element taranıyor`);
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = normalizeText(element.textContent || '');
    const originalText = (element.textContent || '').trim();
    
    if (originalText.length < 5 || originalText.length > 100) continue;
    
    for (const term of searchTerms) {
      if (text.includes(term)) {
        console.log(`🎯 ELEMENT BULUNDU: "${originalText}" (term: ${term})`);
        return element;
      }
    }
  }

  console.log('❌ Hiçbir yerde Amaç ve Kapsam başlığı bulunamadı');
  return null;
}

/**
 * Başlığın altındaki metin içeriğini toplar - BASİT YAKLAŞIM
 */
function extractContentAfterHeader(header: Element, dom: Document): string {
  console.log('📝 BASİT: Başlık altındaki içerik toplaniyor...');
  
  const content: string[] = [];
  let currentElement: Element | null = header;
  let elementCount = 0;
  const maxElements = 20; // Daha az element tara
  
  console.log(`🎯 Başlangıç elementi: "${header.textContent?.substring(0, 50)}..."`);
  
  // Başlıktan sonraki elementleri topla
  while (currentElement && elementCount < maxElements) {
    // Bir sonraki element'i al
    if (currentElement.nextElementSibling) {
      currentElement = currentElement.nextElementSibling;
    } else if (currentElement.parentElement?.nextElementSibling) {
      currentElement = currentElement.parentElement.nextElementSibling;
    } else {
      console.log('🔚 Sonraki element bulunamadı');
      break;
    }
    
    const text = (currentElement.textContent || '').trim();
    const tagName = currentElement.tagName.toLowerCase();
    
    console.log(`🔍 Element ${elementCount + 1}: [${tagName}] "${text.substring(0, 80)}..."`);
    
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
      continue;
    }
    
    // Tablo içeriği atla
    if (tagName === 'table' || currentElement.querySelector('table')) {
      console.log(`🚫 Tablo atlandı`);
      elementCount++;
      continue;
    }
    
    // İyi görünen içerik (çok esnek)
    if (text.length >= 3) {
      content.push(text);
      console.log(`✅ İçerik eklendi (${text.length} kar): "${text.substring(0, 100)}..."`);
      
      // İlk 5 paragrafı bulduktan sonra dur (daha fazla içerik topla)
      if (content.length >= 5) {
        console.log('🎯 5 paragraf bulundu, yeterli');
        break;
      }
    } else {
      console.log(`🤔 Çok kısa ama kayıt altında: "${text}"`);
    }
    
    elementCount++;
  }
  
  const result = content.join('\n\n');
  console.log(`✅ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  
  return result;
}

/**
 * SCAN mode: Tüm dökümanı tarayarak en uygun içeriği bulur
 */
function scanForAmacKapsamContent(dom: Document): string {
  console.log('🔍 SCAN mode: Amaç ve Kapsam içeriği aranıyor...');
  
  const keywords = [
    'amac', 'kapsam', 'hedef', 'scope', 'purpose', 'objective',
    'proje', 'sistem', 'uygulama', 'dokuman', 'document'
  ];
  
  // Blacklist - içindekiler tablosu vb. için
  const blacklistKeywords = [
    'içindekiler', 'contents', 'index', 'tablo', 'table', 'sayfa', 'page',
    'bölüm', 'section', 'madde'
  ];
  
  const allElements = dom.querySelectorAll('p, div, td, span');
  const candidates: { element: Element; score: number; text: string }[] = [];
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = (element.textContent || '').trim();
    
    if (text.length < 100) continue; // Çok kısa metinleri atla
    
    const normalizedText = normalizeText(text);
    
    // Blacklist kontrolü
    let isBlacklisted = false;
    for (const blackKeyword of blacklistKeywords) {
      if (normalizedText.includes(blackKeyword)) {
        isBlacklisted = true;
        break;
      }
    }
    
    // Sadece rakam/numara içeren satırları atla
    if (/^[\d.\s)-]+$/.test(text) || isBlacklisted) {
      continue;
    }
    
    let score = 0;
    
    // Keyword scoring
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        score += keyword === 'amac' || keyword === 'kapsam' ? 5 : 2;
      }
    }
    
    // Uzunluk bonusu (uzun metinler daha değerli)
    if (text.length > 200) score += 3;
    if (text.length > 500) score += 5;
    if (text.length > 1000) score += 7;
    
    // Amaç/Kapsam kombinasyonu bonus
    if (normalizedText.includes('amac') && normalizedText.includes('kapsam')) {
      score += 10;
    }
    
    // Anti-pattern - çok genel ifadeler için penalty
    if (normalizedText.includes('1.') || normalizedText.includes('2.') || 
        normalizedText.includes('3.') || normalizedText.includes('4.')) {
      score -= 5;
    }
    
    if (score > 0) {
      candidates.push({ element, score, text });
      console.log(`🎯 Aday bulundu (skor: ${score}): "${text.substring(0, 80)}..."`);
    }
  }
  
  // En yüksek skorlu adayı seç
  candidates.sort((a, b) => b.score - a.score);
  
  if (candidates.length > 0) {
    const best = candidates[0];
    console.log(`🏆 En iyi aday seçildi (skor: ${best.score}): "${best.text.substring(0, 100)}..."`);
    return best.text;
  }
  
  console.log('❌ SCAN mode\'da uygun içerik bulunamadı');
  return '';
}

/**
 * Ana parsing fonksiyonu
 */
export async function parseAmacKapsamFromDocx(file: File): Promise<AmacKapsamResult> {
  console.log(`🔍 DOCX Amaç ve Kapsam Parse Başlıyor: ${file.name}`);
  
  const validation = {
    found: false,
    mode: 'strict' as 'strict' | 'scan',
    errors: [] as string[],
    warnings: [] as string[],
    matchedLabels: [] as string[]
  };

  try {
    // File'ı güvenli şekilde oku (clone)
    console.log(`📄 Dosya okunuyor: ${file.name} (${file.size} bytes)`);
    
    // ArrayBuffer'ı al ve kopyala
    const arrayBuffer = await file.arrayBuffer();
    const clonedBuffer = arrayBuffer.slice(0);
    
    // DOCX'i HTML'e dönüştür
    const result = await mammoth.convertToHtml({ arrayBuffer: clonedBuffer });
    const htmlContent = result.value;
    
    console.log(`📄 HTML Dönüştürme Tamamlandı, uzunluk: ${htmlContent.length}`);
    
    if (!htmlContent) {
      validation.errors.push('html_donusturme_hatasi');
      return { content: '', validation };
    }

    // DOM'a çevir
    const parser = new DOMParser();
    const dom = parser.parseFromString(htmlContent, 'text/html');
    
    let content = '';
    
    // STRICT Mode: Başlık arayarak içerik bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findAmacKapsamHeader(dom);
    
    if (header) {
      validation.mode = 'strict';
      validation.found = true;
      validation.matchedLabels.push('amac_kapsam_basligi');
      
      content = extractContentAfterHeader(header, dom);
      
      if (!content) {
        validation.warnings.push('basluk_bulundu_icerik_bos');
      }
    } else {
      // SCAN Mode: Tüm dökümanı tara
      console.log('❌ Başlık bulunamadı, SCAN mode başlıyor...');
      validation.mode = 'scan';
      
      content = scanForAmacKapsamContent(dom);
      
      if (content) {
        validation.found = true;
        validation.matchedLabels.push('scan_mode_icerik');
        validation.warnings.push('basluk_bulunamadi_scan_kullanildi');
      } else {
        validation.errors.push('hicbir_icerik_bulunamadi');
      }
    }
    
    // Sonuçları logla
    console.log('📊 Parse Sonucu:', {
      found: validation.found,
      mode: validation.mode,
      contentLength: content.length,
      matchedLabels: validation.matchedLabels,
      errors: validation.errors,
      warnings: validation.warnings
    });

    return { content, validation };

  } catch (error) {
    console.error('❌ Parse hatası:', error);
    validation.errors.push(`parse_hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    return { content: '', validation };
  }
}
