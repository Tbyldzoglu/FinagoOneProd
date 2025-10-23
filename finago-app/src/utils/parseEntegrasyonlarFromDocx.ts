/**
 * DOCX'ten Entegrasyonlar tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Entegrasyonlar" tablolarını bulur ve parse eder.
 * Tablo yapısı: Entegrasyon Adı, Amaç, Sorumlu Sistemler
 */

import mammoth from 'mammoth';

// Entegrasyon satırı interface'i
export interface EntegrasyonItem {
  id: number;
  entegrasyonAdi: string;
  amac: string;
  sorumluSistemler: string;
}

// Parse sonucu interface'i
export interface EntegrasyonlarParseResult {
  entegrasyonlar: EntegrasyonItem[];
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

// Entegrasyonlar tablosu için etiket listesi
const ENTEGRASYONLAR_LABELS = [
  'entegrasyon adi', 'entegrasyon', 'integration', 'amac', 'amaci', 'purpose',
  'sorumlu sistem', 'sorumlu sistemler', 'sistem', 'sistemler', 'system', 'systems',
  'responsible system', 'responsible systems', 'hedef sistem', 'kaynak sistem',
  'api', 'webservice', 'web service', 'servis', 'service', 'baglanti', 'connection'
];

/**
 * Tablonun Entegrasyonlar tablosu olup olmadığını kontrol eder
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
    const isMatch = ENTEGRASYONLAR_LABELS.some(label => 
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
 * Entegrasyonlar tablosunu parse eder
 */
function parseEntegrasyonlarTable(table: Element): EntegrasyonItem[] {
  const rows = table.querySelectorAll('tr');
  const results: EntegrasyonItem[] = [];
  
  if (rows.length < 2) return results; // Header + en az 1 data row olmalı

  console.log('🔍 parseEntegrasyonlarTable - Toplam satır:', rows.length);

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
    if (cellText.includes('entegrasyon') && (cellText.includes('adi') || cellText.includes('ad'))) {
      columnMap['entegrasyonAdi'] = i;
      console.log(`✅ entegrasyonAdi mapping: ${i}`);
    } else if (cellText.includes('entegrasyon') || cellText.includes('integration')) {
      columnMap['entegrasyonAdi'] = i;
      console.log(`✅ entegrasyonAdi mapping (genel): ${i}`);
    } else if (cellText.includes('amac') || cellText.includes('purpose')) {
      columnMap['amac'] = i;
      console.log(`✅ amac mapping: ${i}`);
    } else if (cellText.includes('sorumlu') && (cellText.includes('sistem') || cellText.includes('system'))) {
      columnMap['sorumluSistemler'] = i;
      console.log(`✅ sorumluSistemler mapping: ${i}`);
    } else if (cellText.includes('sistem') || cellText.includes('system')) {
      columnMap['sorumluSistemler'] = i;
      console.log(`✅ sorumluSistemler mapping (genel): ${i}`);
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

    const entegrasyonItem: EntegrasyonItem = {
      id: rowIndex,
      entegrasyonAdi: columnMap['entegrasyonAdi'] !== undefined ? (cells[columnMap['entegrasyonAdi']]?.textContent || '').trim() : '',
      amac: columnMap['amac'] !== undefined ? (cells[columnMap['amac']]?.textContent || '').trim() : '',
      sorumluSistemler: columnMap['sorumluSistemler'] !== undefined ? (cells[columnMap['sorumluSistemler']]?.textContent || '').trim() : ''
    };

    console.log(`✅ Satır ${rowIndex} eklendi:`, {
      entegrasyonAdi: entegrasyonItem.entegrasyonAdi,
      amac: entegrasyonItem.amac.substring(0, 30) + (entegrasyonItem.amac.length > 30 ? '...' : ''),
      sorumluSistemler: entegrasyonItem.sorumluSistemler.substring(0, 30) + (entegrasyonItem.sorumluSistemler.length > 30 ? '...' : '')
    });
    results.push(entegrasyonItem);
  }

  console.log('📊 parseEntegrasyonlarTable sonucu:', results.length, 'satır');
  return results;
}

/**
 * Entegrasyonlar başlığını arar
 */
function findEntegrasyonlarHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'entegrasyonlar', 'entegrasyon', 'integration', 'integrations',
    'sistem entegrasyonlari', 'api entegrasyonlari', 'servis entegrasyonlari',
    'web service', 'webservice', 'dis sistem', 'external system'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Entegrasyonlar başlığı bulundu: "${header.textContent}" (${keyword})`);
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
export async function parseEntegrasyonlarFromDocx(file: File): Promise<EntegrasyonlarParseResult> {
  console.log('🔍 DOCX Entegrasyonlar Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: EntegrasyonlarParseResult = {
      entegrasyonlar: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findEntegrasyonlarHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve Entegrasyonlar tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseEntegrasyonlarTable(table);
        
        if (rows.length > 0) {
          parseResult.entegrasyonlar = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'satır bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo Entegrasyonlar tablosu değil');
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
        const rows = parseEntegrasyonlarTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} satır (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Entegrasyonlar tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Entegrasyonlar tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    const rows = parseEntegrasyonlarTable(bestCandidate.table);
    parseResult.entegrasyonlar = rows;
    parseResult.found = true;
    
    if (candidates.length > 1) {
      parseResult.warnings.push(`${candidates.length} aday tablo bulundu, en iyisi seçildi`);
    }
    
    console.log('✅ SCAN Mode başarılı:', rows.length, 'satır bulundu');
    return parseResult;
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      entegrasyonlar: [],
      found: false,
      mode: 'strict',
      errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
      warnings: [],
      matchedLabels: []
    };
  }
}
