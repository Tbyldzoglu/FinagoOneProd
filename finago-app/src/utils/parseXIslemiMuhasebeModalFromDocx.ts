/**
 * DOCX'ten X İşlemi Muhasebesi Modal form verilerini parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "X İşlemi Muhasebesi" form verilerini bulur ve parse eder.
 * Form alanları: İşlem Tanımı, İlgili Ürün/Modül, Tetikleyici Olay, Muhasebe Kaydının İzleneceği Ekran, Hata Yönetimi
 */

import mammoth from 'mammoth';

// X İşlemi Muhasebesi Modal form field'ları
export interface XIslemiMuhasebeModalFields {
  islemTanimi: string;
  ilgiliUrunModul: string;
  tetikleyiciOlay: string;
  muhasebeKaydininiIzlenecegiEkran: string;
  hataYonetimi: string;
}

// Parse sonucu interface'i
export interface XIslemiMuhasebeModalParseResult {
  fields: XIslemiMuhasebeModalFields;
  found: boolean;
  mode: 'strict' | 'scan';
  errors: string[];
  warnings: string[];
  matchedLabels: string[];
}

/**
 * Metni normalize eder (Türkçe karakterler, küçük harf, noktalama temizliği)
 */
function normalizeText(text: string): string {
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

// Label dictionary - normalized label'dan field key'e mapping
const LABEL_DICTIONARY: { [key: string]: keyof XIslemiMuhasebeModalFields } = {
  // İşlem Tanımı variations
  'islem tanimi': 'islemTanimi',
  'islem': 'islemTanimi',
  'tanim': 'islemTanimi',
  'tanimlama': 'islemTanimi',
  'transaction definition': 'islemTanimi',
  'operation definition': 'islemTanimi',
  'process definition': 'islemTanimi',
  'definition': 'islemTanimi',
  'aciklama': 'islemTanimi',
  'description': 'islemTanimi',

  // İlgili Ürün / Modül variations
  'ilgili urun modul': 'ilgiliUrunModul',
  'ilgili urun': 'ilgiliUrunModul',
  'ilgili modul': 'ilgiliUrunModul',
  'urun modul': 'ilgiliUrunModul',
  'urun': 'ilgiliUrunModul',
  'modul': 'ilgiliUrunModul',
  'product module': 'ilgiliUrunModul',
  'related product': 'ilgiliUrunModul',
  'related module': 'ilgiliUrunModul',
  'product': 'ilgiliUrunModul',
  'module': 'ilgiliUrunModul',
  'sistem': 'ilgiliUrunModul',
  'system': 'ilgiliUrunModul',

  // Tetikleyici Olay variations
  'tetikleyici olay': 'tetikleyiciOlay',
  'tetikleyici': 'tetikleyiciOlay',
  'olay': 'tetikleyiciOlay',
  'trigger event': 'tetikleyiciOlay',
  'trigger': 'tetikleyiciOlay',
  'event': 'tetikleyiciOlay',
  'sebep': 'tetikleyiciOlay',
  'reason': 'tetikleyiciOlay',
  'cause': 'tetikleyiciOlay',
  'baslatici': 'tetikleyiciOlay',
  'initiator': 'tetikleyiciOlay',

  // Muhasebe Kaydının İzleneceği Ekran variations
  'muhasebe kaydinin izlenecegi ekran': 'muhasebeKaydininiIzlenecegiEkran',
  'muhasebe kaydinin ekrani': 'muhasebeKaydininiIzlenecegiEkran',
  'muhasebe ekrani': 'muhasebeKaydininiIzlenecegiEkran',
  'kayit ekrani': 'muhasebeKaydininiIzlenecegiEkran',
  'izleme ekrani': 'muhasebeKaydininiIzlenecegiEkran',
  'accounting screen': 'muhasebeKaydininiIzlenecegiEkran',
  'record screen': 'muhasebeKaydininiIzlenecegiEkran',
  'monitoring screen': 'muhasebeKaydininiIzlenecegiEkran',
  'tracking screen': 'muhasebeKaydininiIzlenecegiEkran',
  'ekran': 'muhasebeKaydininiIzlenecegiEkran',
  'screen': 'muhasebeKaydininiIzlenecegiEkran',
  'interface': 'muhasebeKaydininiIzlenecegiEkran',
  'arayuz': 'muhasebeKaydininiIzlenecegiEkran',

  // Hata Yönetimi variations
  'hata yonetimi': 'hataYonetimi',
  'hata': 'hataYonetimi',
  'yonetimi': 'hataYonetimi',
  'error management': 'hataYonetimi',
  'error handling': 'hataYonetimi',
  'exception handling': 'hataYonetimi',
  'error': 'hataYonetimi',
  'exception': 'hataYonetimi',
  'istisna': 'hataYonetimi',
  'sorun': 'hataYonetimi',
  'problem': 'hataYonetimi',
  'cozum': 'hataYonetimi',
  'solution': 'hataYonetimi'
};

/**
 * Normalize edilmiş label'dan field key'i bulur
 */
function findFieldKeyByLabel(normalizedLabel: string): keyof XIslemiMuhasebeModalFields | null {
  // Exact match
  if (LABEL_DICTIONARY[normalizedLabel]) {
    return LABEL_DICTIONARY[normalizedLabel];
  }

  // Partial match - label içinde dictionary key'i var mı?
  for (const dictKey in LABEL_DICTIONARY) {
    if (normalizedLabel.includes(dictKey) || dictKey.includes(normalizedLabel)) {
      return LABEL_DICTIONARY[dictKey];
    }
  }

  return null;
}

/**
 * Hücre çiftini işler (label-value pair)
 */
function processCellPair(
  labelCell: Element,
  valueCell: Element,
  fields: XIslemiMuhasebeModalFields,
  matchedLabels: string[]
): void {
  const labelText = normalizeText(labelCell.textContent || '');
  const valueText = (valueCell.textContent || '').trim();

  console.log(`🔍 processCellPair: "${labelCell.textContent}" → "${labelText}" = "${valueText}"`);

  if (labelText && valueText) {
    const fieldKey = findFieldKeyByLabel(labelText);
    if (fieldKey) {
      fields[fieldKey] = valueText;
      matchedLabels.push(`${labelText} → ${fieldKey}`);
      console.log(`✅ Eşleşme bulundu: ${labelText} → ${fieldKey} = "${valueText}"`);
    } else {
      console.log(`⚠️ Eşleşme bulunamadı: "${labelText}"`);
    }
  }
}

/**
 * Tablodan veri çıkarır
 */
function extractDataFromTable(
  table: Element,
  fields: XIslemiMuhasebeModalFields,
  matchedLabels: string[]
): void {
  const rows = table.querySelectorAll('tr');
  console.log(`📊 extractDataFromTable: ${rows.length} satır bulundu`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td, th');

    console.log(`📝 Satır ${i}: ${cells.length} hücre`);

    if (cells.length >= 2) {
      // Template A: [label][value][label][value] (4 hücre)
      if (cells.length >= 4) {
        console.log(`🔄 Template A (4 hücre) işleniyor...`);
        processCellPair(cells[0], cells[1], fields, matchedLabels);
        processCellPair(cells[2], cells[3], fields, matchedLabels);
      }
      // Template C: [label][value][empty] (3 hücre) - üçüncü hücre boş olabilir
      else if (cells.length === 3) {
        console.log(`🔄 Template C (3 hücre) işleniyor...`);
        processCellPair(cells[0], cells[1], fields, matchedLabels);
        // Üçüncü hücre dolu ise onu da kontrol et (ek bilgi olabilir)
        const thirdCellText = (cells[2].textContent || '').trim();
        if (thirdCellText) {
          console.log(`ℹ️ Üçüncü hücre içeriği: "${thirdCellText}"`);
        }
      }
      // Template B: [label][value] (2 hücre)
      else if (cells.length === 2) {
        console.log(`🔄 Template B (2 hücre) işleniyor...`);
        processCellPair(cells[0], cells[1], fields, matchedLabels);
      }
    }
  }
}

/**
 * X İşlemi Muhasebesi başlığını arar
 */
function findXIslemiMuhasebeModalHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'x islemi muhasebesi', 'islemi muhasebesi', 'muhasebe bilgileri', 'accounting information',
    'muhasebe formu', 'accounting form', 'islem tanimi', 'transaction definition', 
    'operation definition', 'tetikleyici olay', 'trigger event', 'hata yonetimi', 'error management',
    // Daha spesifik anahtar kelimeler ekleyelim
    'x işlemi muhasebesi modal', 'x işlemi muhasebe modal', 'muhasebe modal',
    'işlem tanımı tetikleyici', 'muhasebe kaydının izleneceği'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    // Önce çok spesifik anahtar kelimeleri kontrol et
    const specificKeywords = [
      'x islemi muhasebesi', 'islemi muhasebesi', 'muhasebe bilgileri',
      'x işlemi muhasebesi modal', 'x işlemi muhasebe modal', 'muhasebe modal',
      'işlem tanımı tetikleyici', 'muhasebe kaydının izleneceği'
    ];
    
    for (const keyword of specificKeywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 X İşlemi Muhasebesi Modal başlığı bulundu (spesifik): "${header.textContent}" (${keyword})`);
        return header;
      }
    }
    
    // Talep Değerlendirmesi tablosu başlıklarını atla
    if (headerText.includes('mevzuat gereksinimi') || 
        headerText.includes('yeni bir urun') || 
        headerText.includes('degerlendirme') ||
        headerText.includes('evaluation')) {
      console.log(`⏭️ Talep Değerlendirmesi tablosu atlandı: "${header.textContent}"`);
      continue;
    }
    
    // Sadece "muhasebe" kelimesi olan başlıkları atla (çok genel)
    if (headerText === 'muhasebe' && header.textContent && header.textContent.trim().length < 20) {
      console.log(`⏭️ Çok genel başlık atlandı: "${header.textContent}"`);
      continue;
    }
    
    // Genel anahtar kelimeleri kontrol et
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 X İşlemi Muhasebesi Modal başlığı bulundu (genel): "${header.textContent}" (${keyword})`);
        return header;
      }
    }
  }
  
  return null;
}

/**
 * Tablonun X İşlemi Muhasebesi Modal tablosu olup olmadığını kontrol eder
 */
function isXIslemiMuhasebeModalTable(table: Element): boolean {
  const cells = table.querySelectorAll('td, th');
  let hasXIslemiFields = 0;
  let hasTalepDegerlendirmeFields = 0;
  
  // X İşlemi Muhasebesi Modal alanları
  const xIslemiKeywords = [
    'islem tanimi', 'tetikleyici olay', 'hata yonetimi', 
    'muhasebe kaydinin izlenecegi', 'ekran', 'transaction definition',
    'trigger event', 'error management', 'accounting screen'
  ];
  
  // Talep Değerlendirmesi alanları (bunları içeriyorsa yanlış tablo)
  const talepDegerlendirmeKeywords = [
    'mevzuat gereksinimi', 'yeni bir urun', 'muhasebe degisikligi',
    'dis firma entegrasyonu', 'raporlama etkisi', 'batch is etkisi',
    'dijital kanallara', 'bildirim olusturulmali', 'conversion gereksinimi'
  ];
  
  for (let i = 0; i < cells.length; i++) {
    const cellText = normalizeText(cells[i].textContent || '');
    
    // X İşlemi Muhasebesi Modal alanlarını say
    for (const keyword of xIslemiKeywords) {
      if (cellText.includes(keyword)) {
        hasXIslemiFields++;
        break;
      }
    }
    
    // Talep Değerlendirmesi alanlarını say
    for (const keyword of talepDegerlendirmeKeywords) {
      if (cellText.includes(keyword)) {
        hasTalepDegerlendirmeFields++;
        break;
      }
    }
  }
  
  console.log(`🔍 Tablo analizi: X İşlemi alanları=${hasXIslemiFields}, Talep Değerlendirmesi alanları=${hasTalepDegerlendirmeFields}`);
  
  // Talep Değerlendirmesi alanları varsa bu yanlış tablo
  if (hasTalepDegerlendirmeFields > 0) {
    console.log(`❌ Bu Talep Değerlendirmesi tablosu, X İşlemi Muhasebesi Modal değil`);
    return false;
  }
  
  // X İşlemi alanları varsa doğru tablo
  if (hasXIslemiFields > 0) {
    console.log(`✅ Bu X İşlemi Muhasebesi Modal tablosu`);
    return true;
  }
  
  console.log(`⚠️ Belirsiz tablo türü`);
  return false;
}

/**
 * Bir elemandan sonraki tabloyu bulur
 */
function findNextTable(startElement: Element): Element | null {
  let current = startElement.nextElementSibling;
  
  while (current) {
    if (current.tagName.toLowerCase() === 'table') {
      return current;
    }
    
    // İç içe tablolar için
    const nestedTable = current.querySelector('table');
    if (nestedTable) {
      return nestedTable;
    }
    
    current = current.nextElementSibling;
  }
  
  return null;
}

/**
 * Tabloda eşleşen etiket sayısını sayar
 */
function countMatchingLabels(table: Element): number {
  const cells = table.querySelectorAll('td, th');
  let matchCount = 0;
  const matchedFields: string[] = [];

  console.log(`🔍 countMatchingLabels - Toplam hücre sayısı: ${cells.length}`);

  for (let i = 0; i < cells.length; i++) {
    const cellText = normalizeText(cells[i].textContent || '');
    const originalText = cells[i].textContent || '';
    
    // Sadece anlamlı hücreleri logla (boş değilse)
    if (originalText.trim()) {
      console.log(`🏷️ Hücre ${i}: "${originalText}" → "${cellText}"`);

      const fieldKey = findFieldKeyByLabel(cellText);
      if (fieldKey) {
        matchCount++;
        matchedFields.push(`${cellText} → ${fieldKey}`);
        console.log(`🎯 Eşleşme: "${cellText}" → ${fieldKey}`);
      }
    }
  }

  console.log(`🔢 Toplam eşleşen etiket sayısı: ${matchCount}`);
  if (matchedFields.length > 0) {
    console.log(`✅ Eşleşen alanlar: ${matchedFields.join(', ')}`);
  }
  return matchCount;
}

/**
 * Ana parsing fonksiyonu
 */
export async function parseXIslemiMuhasebeModalFromDocx(file: File): Promise<XIslemiMuhasebeModalParseResult> {
  console.log('🔍 DOCX X İşlemi Muhasebesi Modal Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: XIslemiMuhasebeModalParseResult = {
      fields: {
        islemTanimi: '',
        ilgiliUrunModul: '',
        tetikleyiciOlay: '',
        muhasebeKaydininiIzlenecegiEkran: '',
        hataYonetimi: ''
      },
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findXIslemiMuhasebeModalHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table) {
        console.log('✅ Tablo bulundu, tablo türü kontrol ediliyor...');
        
        // Tablo türünü kontrol et
        if (isXIslemiMuhasebeModalTable(table)) {
          console.log('✅ Doğru tablo türü, parse ediliyor...');
          extractDataFromTable(table, parseResult.fields, parseResult.matchedLabels);
          
          // En az bir field doldurulmuş mu kontrol et
          const hasData = Object.values(parseResult.fields).some(value => value.trim().length > 0);
          
          if (hasData) {
            parseResult.found = true;
            parseResult.mode = 'strict';
            console.log('✅ STRICT Mode başarılı, veriler bulundu');
            return parseResult;
          }
        } else {
          console.log('❌ Yanlış tablo türü, SCAN mode\'a geçiliyor...');
        }
      }
    }

    // SCAN Mode: Tüm tabloları tara
    console.log('❌ Başlık bulunamadı veya veri yok, SCAN mode başlıyor...');
    parseResult.mode = 'scan';
    
    const tables = doc.querySelectorAll('table');
    console.log('📊 Toplam tablo sayısı:', tables.length);
    
    const candidates: { table: Element; score: number }[] = [];
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      
      // Önce tablo türünü kontrol et
      if (!isXIslemiMuhasebeModalTable(table)) {
        console.log(`📊 Tablo ${i + 1}: Yanlış tablo türü (atlandı)`);
        continue;
      }
      
      const score = countMatchingLabels(table);
      
      // En az 2 etiket eşleşmesi olmalı (X İşlemi Muhasebesi Modal için)
      if (score >= 2) {
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} etiket eşleşti (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: ${score} etiket eşleşti (yetersiz, minimum 2 gerekli)`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('X İşlemi Muhasebesi Modal verisi bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} etiket eşleşmesi`);
    
    // Reset fields and matchedLabels for fresh parsing
    parseResult.fields = {
      islemTanimi: '',
      ilgiliUrunModul: '',
      tetikleyiciOlay: '',
      muhasebeKaydininiIzlenecegiEkran: '',
      hataYonetimi: ''
    };
    parseResult.matchedLabels = [];
    
    extractDataFromTable(bestCandidate.table, parseResult.fields, parseResult.matchedLabels);
    
    // En az bir field doldurulmuş mu kontrol et
    const hasData = Object.values(parseResult.fields).some(value => value.trim().length > 0);
    
    if (hasData) {
      parseResult.found = true;
      
      if (candidates.length > 1) {
        parseResult.warnings.push(`${candidates.length} aday tablo bulundu, en iyisi seçildi`);
      }
      
      console.log('✅ SCAN Mode başarılı, veriler bulundu');
    } else {
      parseResult.errors.push('Veriler parse edilemedi');
      console.log('❌ SCAN Mode: Veriler parse edilemedi');
    }
    
    return parseResult;
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      fields: {
        islemTanimi: '',
        ilgiliUrunModul: '',
        tetikleyiciOlay: '',
        muhasebeKaydininiIzlenecegiEkran: '',
        hataYonetimi: ''
      },
      found: false,
      mode: 'strict',
      errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
      warnings: [],
      matchedLabels: []
    };
  }
}
