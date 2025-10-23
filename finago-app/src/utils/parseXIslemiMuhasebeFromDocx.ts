/**
 * DOCX'ten X İşlemi Muhasebesi tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "X İşlemi Muhasebesi" tablolarını bulur ve parse eder.
 * Tablo yapısı: Şube Kodu, Müşteri Numarası, Defter, Borç/Alacak, Tutar, Döviz Cinsi, Açıklama
 */

import mammoth from 'mammoth';

// X İşlemi Muhasebesi satırı interface'i
export interface XIslemiMuhasebeItem {
  id: number;
  data: {
    subeKodu: string;
    musteriNo: string;
    defter: string;
    borcAlacak: string;
    tutar: string;
    dovizCinsi: string;
    aciklama: string;
  };
}

// Parse sonucu interface'i
export interface XIslemiMuhasebeParseResult {
  tableRows: XIslemiMuhasebeItem[];
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

// X İşlemi Muhasebesi tablosu için etiket listesi
const X_ISLEMI_MUHASEBE_LABELS = [
  'sube kodu', 'sube', 'branch code', 'branch', 'musteri numarasi', 'musteri no',
  'customer number', 'customer', 'defter', 'ledger', 'borc alacak', 'borc',
  'alacak', 'debit credit', 'debit', 'credit', 'tutar', 'amount', 'miktar',
  'doviz cinsi', 'doviz', 'currency', 'aciklama', 'description', 'explanation',
  'muhasebe', 'accounting', 'islemi', 'operation', 'transaction', 'hareket'
];

/**
 * Tablonun X İşlemi Muhasebesi tablosu olup olmadığını kontrol eder
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
    const isMatch = X_ISLEMI_MUHASEBE_LABELS.some(label => 
      cellText.includes(label) || label.includes(cellText)
    );
    if (isMatch) {
      matchCount++;
      console.log(`🎯 determineTableType eşleşme: "${cellText}"`);
    }
  }

  console.log(`🔍 determineTableType sonucu: ${matchCount} eşleşme (minimum 3 gerekli)`);
  // En az 3 etiket eşleşmesi olmalı
  return matchCount >= 3;
}

/**
 * X İşlemi Muhasebesi tablosunu parse eder
 */
function parseXIslemiMuhasebeTable(table: Element): XIslemiMuhasebeItem[] {
  const rows = table.querySelectorAll('tr');
  const results: XIslemiMuhasebeItem[] = [];
  
  if (rows.length < 2) return results; // Header + en az 1 data row olmalı

  console.log('🔍 parseXIslemiMuhasebeTable - Toplam satır:', rows.length);

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
    if (cellText.includes('sube') && (cellText.includes('kodu') || cellText.includes('code'))) {
      columnMap['subeKodu'] = i;
      console.log(`✅ subeKodu mapping: ${i}`);
    } else if (cellText.includes('sube') || cellText.includes('branch')) {
      columnMap['subeKodu'] = i;
      console.log(`✅ subeKodu mapping (genel): ${i}`);
    } else if (cellText.includes('musteri') && (cellText.includes('numarasi') || cellText.includes('no'))) {
      columnMap['musteriNo'] = i;
      console.log(`✅ musteriNo mapping: ${i}`);
    } else if (cellText.includes('musteri') || cellText.includes('customer')) {
      columnMap['musteriNo'] = i;
      console.log(`✅ musteriNo mapping (genel): ${i}`);
    } else if (cellText.includes('defter') || cellText.includes('ledger')) {
      columnMap['defter'] = i;
      console.log(`✅ defter mapping: ${i}`);
    } else if (cellText.includes('borc') && cellText.includes('alacak')) {
      columnMap['borcAlacak'] = i;
      console.log(`✅ borcAlacak mapping: ${i}`);
    } else if (cellText.includes('borc') || cellText.includes('alacak') || cellText.includes('debit') || cellText.includes('credit')) {
      columnMap['borcAlacak'] = i;
      console.log(`✅ borcAlacak mapping (genel): ${i}`);
    } else if (cellText.includes('tutar') || cellText.includes('amount') || cellText.includes('miktar')) {
      columnMap['tutar'] = i;
      console.log(`✅ tutar mapping: ${i}`);
    } else if (cellText.includes('doviz') && cellText.includes('cinsi')) {
      columnMap['dovizCinsi'] = i;
      console.log(`✅ dovizCinsi mapping: ${i}`);
    } else if (cellText.includes('doviz') || cellText.includes('currency')) {
      columnMap['dovizCinsi'] = i;
      console.log(`✅ dovizCinsi mapping (genel): ${i}`);
    } else if (cellText.includes('aciklama') || cellText.includes('description') || cellText.includes('explanation')) {
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

    const muhasebeItem: XIslemiMuhasebeItem = {
      id: rowIndex,
      data: {
        subeKodu: columnMap['subeKodu'] !== undefined ? (cells[columnMap['subeKodu']]?.textContent || '').trim() : '',
        musteriNo: columnMap['musteriNo'] !== undefined ? (cells[columnMap['musteriNo']]?.textContent || '').trim() : '',
        defter: columnMap['defter'] !== undefined ? (cells[columnMap['defter']]?.textContent || '').trim() : '',
        borcAlacak: columnMap['borcAlacak'] !== undefined ? (cells[columnMap['borcAlacak']]?.textContent || '').trim() : '',
        tutar: columnMap['tutar'] !== undefined ? (cells[columnMap['tutar']]?.textContent || '').trim() : '',
        dovizCinsi: columnMap['dovizCinsi'] !== undefined ? (cells[columnMap['dovizCinsi']]?.textContent || '').trim() : '',
        aciklama: columnMap['aciklama'] !== undefined ? (cells[columnMap['aciklama']]?.textContent || '').trim() : ''
      }
    };

    console.log(`✅ Satır ${rowIndex} eklendi:`, {
      subeKodu: muhasebeItem.data.subeKodu,
      musteriNo: muhasebeItem.data.musteriNo,
      defter: muhasebeItem.data.defter,
      borcAlacak: muhasebeItem.data.borcAlacak,
      tutar: muhasebeItem.data.tutar
    });
    results.push(muhasebeItem);
  }

  console.log('📊 parseXIslemiMuhasebeTable sonucu:', results.length, 'satır');
  return results;
}

/**
 * X İşlemi Muhasebesi başlığını arar
 */
function findXIslemiMuhasebeHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'x islemi muhasebesi', 'islemi muhasebesi', 'muhasebe', 'accounting',
    'muhasebe kayitlari', 'accounting records', 'mali kayitlar', 'financial records',
    'borc alacak', 'debit credit', 'yevmiye', 'journal', 'defteri kebir',
    'general ledger', 'hesap hareketleri', 'account movements'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 X İşlemi Muhasebesi başlığı bulundu: "${header.textContent}" (${keyword})`);
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
export async function parseXIslemiMuhasebeFromDocx(file: File): Promise<XIslemiMuhasebeParseResult> {
  console.log('🔍 DOCX X İşlemi Muhasebesi Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: XIslemiMuhasebeParseResult = {
      tableRows: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findXIslemiMuhasebeHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve X İşlemi Muhasebesi tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseXIslemiMuhasebeTable(table);
        
        if (rows.length > 0) {
          parseResult.tableRows = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'satır bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo X İşlemi Muhasebesi tablosu değil');
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
        const rows = parseXIslemiMuhasebeTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} satır (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: X İşlemi Muhasebesi tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('X İşlemi Muhasebesi tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    const rows = parseXIslemiMuhasebeTable(bestCandidate.table);
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
