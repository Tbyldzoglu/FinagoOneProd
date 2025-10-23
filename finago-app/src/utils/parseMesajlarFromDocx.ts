/**
 * DOCX'ten Mesajlar/Uyarılar/Bilgilendirmeler tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Mesajlar/Uyarılar/Bilgilendirmeler" tablolarını bulur ve parse eder.
 * Tablo yapısı: Mesaj Tipi, Case, Mesaj Dili, Mesaj Metin
 */

import mammoth from 'mammoth';

// Mesaj satırı interface'i
export interface MesajItem {
  id: number;
  mesajTipi: string;
  case: string;
  mesajDili: string;
  mesajMetin: string;
}

// Parse sonucu interface'i
export interface MesajlarParseResult {
  mesajlar: MesajItem[];
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

// Mesajlar tablosu için etiket listesi
const MESAJLAR_LABELS = [
  'mesaj tipi', 'mesaj', 'message type', 'message', 'case', 'durum',
  'mesaj dili', 'dil', 'language', 'mesaj metin', 'metin', 'text',
  'uyari', 'warning', 'bilgilendirme', 'information', 'error', 'hata',
  'success', 'basarili', 'info', 'bilgi', 'alert', 'notification'
];

/**
 * Tablonun Mesajlar tablosu olup olmadığını kontrol eder
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
    const isMatch = MESAJLAR_LABELS.some(label => 
      cellText.includes(label) || label.includes(cellText)
    );
    if (isMatch) {
      matchCount++;
      console.log(`🎯 determineTableType eşleşme: "${cellText}"`);
    }
  }

  console.log(`🔍 determineTableType sonucu: ${matchCount} eşleşme (minimum 2 gerekli)`);
  // En az 2 etiket eşleşmesi olmalı
  return matchCount >= 2;
}

/**
 * Mesajlar tablosunu parse eder
 */
function parseMesajlarTable(table: Element): MesajItem[] {
  const rows = table.querySelectorAll('tr');
  const results: MesajItem[] = [];
  
  if (rows.length < 2) return results; // Header + en az 1 data row olmalı

  console.log('🔍 parseMesajlarTable - Toplam satır:', rows.length);

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
    if (cellText.includes('mesaj') && cellText.includes('tipi')) {
      columnMap['mesajTipi'] = i;
      console.log(`✅ mesajTipi mapping: ${i}`);
    } else if (cellText.includes('mesaj') && (cellText.includes('type') || cellText.includes('tip'))) {
      columnMap['mesajTipi'] = i;
      console.log(`✅ mesajTipi mapping (genel): ${i}`);
    } else if (cellText.includes('case') || cellText.includes('durum')) {
      columnMap['case'] = i;
      console.log(`✅ case mapping: ${i}`);
    } else if (cellText.includes('mesaj') && cellText.includes('dili')) {
      columnMap['mesajDili'] = i;
      console.log(`✅ mesajDili mapping: ${i}`);
    } else if (cellText.includes('dil') || cellText.includes('language')) {
      columnMap['mesajDili'] = i;
      console.log(`✅ mesajDili mapping (genel): ${i}`);
    } else if (cellText.includes('mesaj') && (cellText.includes('metin') || cellText.includes('text'))) {
      columnMap['mesajMetin'] = i;
      console.log(`✅ mesajMetin mapping: ${i}`);
    } else if (cellText.includes('metin') || cellText.includes('text') || cellText.includes('message')) {
      columnMap['mesajMetin'] = i;
      console.log(`✅ mesajMetin mapping (genel): ${i}`);
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

    const mesajItem: MesajItem = {
      id: rowIndex,
      mesajTipi: columnMap['mesajTipi'] !== undefined ? (cells[columnMap['mesajTipi']]?.textContent || '').trim() : '',
      case: columnMap['case'] !== undefined ? (cells[columnMap['case']]?.textContent || '').trim() : '',
      mesajDili: columnMap['mesajDili'] !== undefined ? (cells[columnMap['mesajDili']]?.textContent || '').trim() : '',
      mesajMetin: columnMap['mesajMetin'] !== undefined ? (cells[columnMap['mesajMetin']]?.textContent || '').trim() : ''
    };

    console.log(`✅ Satır ${rowIndex} eklendi:`, {
      mesajTipi: mesajItem.mesajTipi,
      case: mesajItem.case,
      mesajDili: mesajItem.mesajDili,
      mesajMetin: mesajItem.mesajMetin.substring(0, 30) + (mesajItem.mesajMetin.length > 30 ? '...' : '')
    });
    results.push(mesajItem);
  }

  console.log('📊 parseMesajlarTable sonucu:', results.length, 'satır');
  return results;
}

/**
 * Mesajlar başlığını arar
 */
function findMesajlarHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'mesajlar', 'mesaj', 'messages', 'uyarilar', 'uyari', 'warnings', 'warning',
    'bilgilendirmeler', 'bilgilendirme', 'notifications', 'notification',
    'hata mesajlari', 'error messages', 'sistem mesajlari', 'system messages',
    'kullanici mesajlari', 'user messages', 'alert mesajlari'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Mesajlar başlığı bulundu: "${header.textContent}" (${keyword})`);
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
export async function parseMesajlarFromDocx(file: File): Promise<MesajlarParseResult> {
  console.log('🔍 DOCX Mesajlar Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: MesajlarParseResult = {
      mesajlar: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findMesajlarHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve Mesajlar tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseMesajlarTable(table);
        
        if (rows.length > 0) {
          parseResult.mesajlar = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'satır bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo Mesajlar tablosu değil');
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
        const rows = parseMesajlarTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} satır (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Mesajlar tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Mesajlar tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    const rows = parseMesajlarTable(bestCandidate.table);
    parseResult.mesajlar = rows;
    parseResult.found = true;
    
    if (candidates.length > 1) {
      parseResult.warnings.push(`${candidates.length} aday tablo bulundu, en iyisi seçildi`);
    }
    
    console.log('✅ SCAN Mode başarılı:', rows.length, 'satır bulundu');
    return parseResult;
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      mesajlar: [],
      found: false,
      mode: 'strict',
      errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
      warnings: [],
      matchedLabels: []
    };
  }
}
