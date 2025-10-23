/**
 * DOCX'ten Onay Süreci tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Onay Süreci" tablolarını bulur ve parse eder.
 * Tablo yapısı: İşlem Tipi, Onay Seviyesi, Onay Süreci, Açıklama
 */

import mammoth from 'mammoth';

// Onay Süreci satırı interface'i
export interface OnaySureciItem {
  id: string;
  data: {
    islemTipi: string;
    onaySeviyesi: string;
    onaySureci: string;
    aciklama: string;
  };
}

// Parse sonucu interface'i
export interface OnaySureciParseResult {
  tableRows: OnaySureciItem[];
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

// Onay Süreci tablosu için etiket listesi
const ONAY_SURECI_LABELS = [
  'islem tipi', 'islem tip', 'islem', 'transaction type', 'operation type', 'process type',
  'tipi', 'tip', 'type', 'kind', 'category', 'tur',
  'onay seviyesi', 'onay seviye', 'approval level', 'level', 'seviye', 'derece',
  'onay sureci', 'onay', 'sureci', 'approval process', 'approval', 'process',
  'aciklama', 'description', 'explanation', 'note', 'comment', 'tanim',
  'onay mekanizmasi', 'approval mechanism', 'onay akisi', 'approval flow',
  'onaylama', 'approve', 'confirm', 'validation', 'dogrulama'
];

/**
 * Tablonun Onay Süreci tablosu olup olmadığını kontrol eder
 */
function determineTableType(table: Element): boolean {
  const rows = table.querySelectorAll('tr');
  if (rows.length === 0) return false;

  // İlk satır (header) kontrolü
  const headerRow = rows[0];
  const headerCells = headerRow.querySelectorAll('td, th');
  
  // İlk sütunda "#" varsa offset uygula
  let startIndex = 0;
  if (headerCells.length > 0) {
    const firstCellText = normalizeText(headerCells[0].textContent || '');
    if (firstCellText === '' || firstCellText === '#' || firstCellText.includes('numara') || firstCellText.includes('sira')) {
      startIndex = 1;
    }
  }
  
  let matchCount = 0;
  for (let i = startIndex; i < headerCells.length; i++) {
    const cellText = normalizeText(headerCells[i].textContent || '');
    const isMatch = ONAY_SURECI_LABELS.some(label => 
      cellText.includes(label) || label.includes(cellText)
    );
    if (isMatch) {
      matchCount++;
      console.log(`🎯 determineTableType eşleşme: "${cellText}"`);
    }
  }

  console.log(`🔍 determineTableType sonucu: ${matchCount} eşleşme (minimum 3 gerekli)`);
  // En az 3 etiket eşleşmesi olmalı (Onay Süreci tablosu için)
  return matchCount >= 3;
}

/**
 * Onay Süreci tablosunu parse eder
 */
function parseOnaySureciTable(table: Element): OnaySureciItem[] {
  const rows = table.querySelectorAll('tr');
  const results: OnaySureciItem[] = [];
  
  if (rows.length < 2) return results; // Header + en az 1 data row olmalı

  console.log('🔍 parseOnaySureciTable - Toplam satır:', rows.length);

  // Header satırını analiz et (sütun mapping için)
  const headerRow = rows[0];
  const headerCells = headerRow.querySelectorAll('td, th');
  const columnMap: { [key: string]: number } = {};

  // İlk sütunda "#" varsa offset uygula
  let offset = 0;
  if (headerCells.length > 0) {
    const firstCellText = normalizeText(headerCells[0].textContent || '');
    if (firstCellText === '' || firstCellText === '#' || firstCellText.includes('numara') || firstCellText.includes('sira')) {
      offset = 1;
      console.log('🔢 İlk sütun numara/boş, offset=1 uygulanıyor');
    }
  }

  for (let i = 0; i < headerCells.length; i++) {
    const cellText = normalizeText(headerCells[i].textContent || '');
    const originalText = headerCells[i].textContent || '';
    console.log(`🏷️ Header ${i}: "${originalText}" → normalized: "${cellText}"`);

    // Sütun mapping
    if (cellText.includes('islem') && cellText.includes('tipi')) {
      columnMap['islemTipi'] = i;
      console.log(`✅ islemTipi mapping: ${i}`);
    } else if (cellText.includes('islem') && cellText.includes('tip')) {
      columnMap['islemTipi'] = i;
      console.log(`✅ islemTipi mapping (tip): ${i}`);
    } else if (cellText.includes('islem') || cellText.includes('transaction') || cellText.includes('operation')) {
      columnMap['islemTipi'] = i;
      console.log(`✅ islemTipi mapping (genel): ${i}`);
    } else if (cellText.includes('tipi') || cellText.includes('tip') || cellText.includes('type')) {
      columnMap['islemTipi'] = i;
      console.log(`✅ islemTipi mapping (type): ${i}`);
    } else if (cellText.includes('onay') && cellText.includes('seviyesi')) {
      columnMap['onaySeviyesi'] = i;
      console.log(`✅ onaySeviyesi mapping: ${i}`);
    } else if (cellText.includes('onay') && cellText.includes('seviye')) {
      columnMap['onaySeviyesi'] = i;
      console.log(`✅ onaySeviyesi mapping (seviye): ${i}`);
    } else if (cellText.includes('seviyesi') || cellText.includes('seviye') || cellText.includes('level')) {
      columnMap['onaySeviyesi'] = i;
      console.log(`✅ onaySeviyesi mapping (genel): ${i}`);
    } else if (cellText.includes('onay') && cellText.includes('sureci')) {
      columnMap['onaySureci'] = i;
      console.log(`✅ onaySureci mapping: ${i}`);
    } else if (cellText.includes('onay') && (cellText.includes('surec') || cellText.includes('process'))) {
      columnMap['onaySureci'] = i;
      console.log(`✅ onaySureci mapping (process): ${i}`);
    } else if (cellText.includes('sureci') || cellText.includes('surec') || cellText.includes('process') || cellText.includes('approval')) {
      columnMap['onaySureci'] = i;
      console.log(`✅ onaySureci mapping (genel): ${i}`);
    } else if (cellText.includes('aciklama') || cellText.includes('description') || cellText.includes('explanation') || cellText.includes('note')) {
      columnMap['aciklama'] = i;
      console.log(`✅ aciklama mapping: ${i}`);
    }
  }

  console.log('📊 Sütun mapping:', columnMap);
  console.log('📊 Offset:', offset);

  // Data satırlarını işle
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const cells = row.querySelectorAll('td, th');
    
    if (cells.length === 0) continue;

    console.log(`📝 Satır ${rowIndex}: ${cells.length} hücre`);

    // Boş satırları atla (tüm hücreler boş)
    const hasContent = Array.from(cells).some(cell => 
      (cell.textContent || '').trim().length > 0
    );
    if (!hasContent) {
      console.log(`⏭️ Satır ${rowIndex}: Boş, atlanıyor`);
      continue;
    }

    // Detaylı data çekme ile debug
    const islemTipiIndex = columnMap['islemTipi'] !== undefined ? columnMap['islemTipi'] + offset : -1;
    const onaySeviyesiIndex = columnMap['onaySeviyesi'] !== undefined ? columnMap['onaySeviyesi'] + offset : -1;
    const onaySureciIndex = columnMap['onaySureci'] !== undefined ? columnMap['onaySureci'] + offset : -1;
    const aciklamaIndex = columnMap['aciklama'] !== undefined ? columnMap['aciklama'] + offset : -1;

    console.log(`📍 Satır ${rowIndex} sütun indexleri:`, {
      islemTipi: islemTipiIndex,
      onaySeviyesi: onaySeviyesiIndex,
      onaySureci: onaySureciIndex,
      aciklama: aciklamaIndex
    });

    const onaySureciItem: OnaySureciItem = {
      id: rowIndex.toString(),
      data: {
        islemTipi: islemTipiIndex >= 0 && cells[islemTipiIndex] ? (cells[islemTipiIndex].textContent || '').trim() : '',
        onaySeviyesi: onaySeviyesiIndex >= 0 && cells[onaySeviyesiIndex] ? (cells[onaySeviyesiIndex].textContent || '').trim() : '',
        onaySureci: onaySureciIndex >= 0 && cells[onaySureciIndex] ? (cells[onaySureciIndex].textContent || '').trim() : '',
        aciklama: aciklamaIndex >= 0 && cells[aciklamaIndex] ? (cells[aciklamaIndex].textContent || '').trim() : ''
      }
    };

    // Her hücrenin raw içeriğini de logla
    console.log(`📱 Satır ${rowIndex} raw hücre içerikleri:`);
    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
      const cellContent = cells[cellIndex]?.textContent || '';
      console.log(`  Hücre ${cellIndex}: "${cellContent}"`);
    }

    console.log(`✅ Satır ${rowIndex} eklendi:`, {
      islemTipi: onaySureciItem.data.islemTipi,
      onaySeviyesi: onaySureciItem.data.onaySeviyesi,
      onaySureci: onaySureciItem.data.onaySureci,
      aciklama: onaySureciItem.data.aciklama
    });
    results.push(onaySureciItem);
  }

  console.log('📊 parseOnaySureciTable sonucu:', results.length, 'satır');
  return results;
}

/**
 * Onay Süreci başlığını arar
 */
function findOnaySureciHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'onay sureci', 'onay süreci', 'approval process', 'onay mekanizmasi', 'approval mechanism',
    'onay akisi', 'approval flow', 'onaylama sureci', 'onaylama süreci', 'approval workflow',
    'onay tablosu', 'approval table', 'onay seviyesi', 'approval level', 'islem onay',
    'transaction approval', 'onay matrisi', 'approval matrix'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Onay Süreci başlığı bulundu: "${header.textContent}" (${keyword})`);
        return header;
      }
    }
  }
  
  return null;
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
 * Ana parsing fonksiyonu
 */
export async function parseOnaySureciFromDocx(file: File): Promise<OnaySureciParseResult> {
  console.log('🔍 DOCX Onay Süreci Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: OnaySureciParseResult = {
      tableRows: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findOnaySureciHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve Onay Süreci tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseOnaySureciTable(table);
        
        if (rows.length > 0) {
          parseResult.tableRows = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'satır bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo Onay Süreci tablosu değil');
      }
    }

    // SCAN Mode: Tüm tabloları tara
    console.log('❌ Başlık bulunamadı, SCAN mode başlıyor...');
    parseResult.mode = 'scan';
    
    const tables = doc.querySelectorAll('table');
    console.log('📊 Toplam tablo sayısı:', tables.length);
    
    const candidates: { table: Element; score: number }[] = [];
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      if (determineTableType(table)) {
        const rows = parseOnaySureciTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} satır (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Onay Süreci tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Onay Süreci tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    const rows = parseOnaySureciTable(bestCandidate.table);
    parseResult.tableRows = rows;
    parseResult.found = true;
    
    if (candidates.length > 1) {
      parseResult.warnings.push(`${candidates.length} aday tablo bulundu, en iyisi seçildi`);
    }
    
    console.log('✅ SCAN Mode başarılı:', rows.length, 'satır bulundu');
    return parseResult;
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      tableRows: [],
      found: false,
      mode: 'strict',
      errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
      warnings: [],
      matchedLabels: []
    };
  }
}
