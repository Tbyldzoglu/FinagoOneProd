/**
 * DOCX'ten Yetkilendirme tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Yetkilendirme" tablolarını bulur ve parse eder.
 * Tablo yapısı: Rol/Kullanıcı, Ekran/İşlem, Görüntüleme, Ekleme, Güncelleme, Silme, Onaylama
 */

import mammoth from 'mammoth';

// Yetkilendirme satırı interface'i
export interface YetkilendirmeItem {
  id: string;
  data: {
    rolKullanici: string;
    ekranIslem: string;
    goruntuleme: string;
    ekleme: string;
    guncelleme: string;
    silme: string;
    onaylama: string;
  };
}

// Parse sonucu interface'i
export interface YetkilendirmeParseResult {
  tableRows: YetkilendirmeItem[];
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

// Yetkilendirme tablosu için etiket listesi
const YETKILENDIRME_LABELS = [
  'rol kullanici', 'rol', 'kullanici', 'user', 'role', 'person', 'kisi',
  'ekran islem', 'ekran', 'islem', 'screen', 'operation', 'transaction', 'process',
  'goruntuleme', 'view', 'display', 'show', 'read', 'okuma', 'gosterme',
  'ekleme', 'add', 'create', 'insert', 'yeni', 'olusturma', 'yaratma',
  'guncelleme', 'update', 'modify', 'edit', 'degistirme', 'duzenleme',
  'silme', 'delete', 'remove', 'drop', 'kaldirma', 'cikarma',
  'onaylama', 'approve', 'approval', 'confirm', 'confirmation', 'dogrulama',
  'yetki', 'authorization', 'permission', 'access', 'erisim', 'izin',
  'yetkilendirme', 'authorization table', 'permission table', 'access control'
];

/**
 * Tablonun Yetkilendirme tablosu olup olmadığını kontrol eder
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
    const isMatch = YETKILENDIRME_LABELS.some(label => 
      cellText.includes(label) || label.includes(cellText)
    );
    if (isMatch) {
      matchCount++;
      console.log(`🎯 determineTableType eşleşme: "${cellText}"`);
    }
  }

  console.log(`🔍 determineTableType sonucu: ${matchCount} eşleşme (minimum 4 gerekli)`);
  // En az 4 etiket eşleşmesi olmalı (Yetkilendirme tablosu için)
  return matchCount >= 4;
}

/**
 * Yetkilendirme tablosunu parse eder
 */
function parseYetkilendirmeTable(table: Element): YetkilendirmeItem[] {
  const rows = table.querySelectorAll('tr');
  const results: YetkilendirmeItem[] = [];
  
  if (rows.length < 2) return results; // Header + en az 1 data row olmalı

  console.log('🔍 parseYetkilendirmeTable - Toplam satır:', rows.length);

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
    if (cellText.includes('rol') && cellText.includes('kullanici')) {
      columnMap['rolKullanici'] = i;
      console.log(`✅ rolKullanici mapping: ${i}`);
    } else if (cellText.includes('rol') || cellText.includes('kullanici') || cellText.includes('user') || cellText.includes('role')) {
      columnMap['rolKullanici'] = i;
      console.log(`✅ rolKullanici mapping (genel): ${i}`);
    } else if (cellText.includes('ekran') && cellText.includes('islem')) {
      columnMap['ekranIslem'] = i;
      console.log(`✅ ekranIslem mapping: ${i}`);
    } else if (cellText.includes('ekran') || cellText.includes('islem') || cellText.includes('screen') || cellText.includes('operation')) {
      columnMap['ekranIslem'] = i;
      console.log(`✅ ekranIslem mapping (genel): ${i}`);
    } else if (cellText.includes('goruntuleme') || cellText.includes('view') || cellText.includes('display') || cellText.includes('okuma')) {
      columnMap['goruntuleme'] = i;
      console.log(`✅ goruntuleme mapping: ${i}`);
    } else if (cellText.includes('ekleme') || cellText.includes('add') || cellText.includes('create') || cellText.includes('olusturma')) {
      columnMap['ekleme'] = i;
      console.log(`✅ ekleme mapping: ${i}`);
    } else if (cellText.includes('guncelleme') || cellText.includes('update') || cellText.includes('modify') || cellText.includes('degistirme')) {
      columnMap['guncelleme'] = i;
      console.log(`✅ guncelleme mapping: ${i}`);
    } else if (cellText.includes('silme') || cellText.includes('delete') || cellText.includes('remove') || cellText.includes('kaldirma')) {
      columnMap['silme'] = i;
      console.log(`✅ silme mapping: ${i}`);
    } else if (cellText.includes('onaylama') || cellText.includes('approve') || cellText.includes('approval') || cellText.includes('dogrulama')) {
      columnMap['onaylama'] = i;
      console.log(`✅ onaylama mapping: ${i}`);
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

    const yetkilendirmeItem: YetkilendirmeItem = {
      id: rowIndex.toString(),
      data: {
        rolKullanici: columnMap['rolKullanici'] !== undefined ? (cells[columnMap['rolKullanici'] + offset]?.textContent || '').trim() : '',
        ekranIslem: columnMap['ekranIslem'] !== undefined ? (cells[columnMap['ekranIslem'] + offset]?.textContent || '').trim() : '',
        goruntuleme: columnMap['goruntuleme'] !== undefined ? (cells[columnMap['goruntuleme'] + offset]?.textContent || '').trim() : '',
        ekleme: columnMap['ekleme'] !== undefined ? (cells[columnMap['ekleme'] + offset]?.textContent || '').trim() : '',
        guncelleme: columnMap['guncelleme'] !== undefined ? (cells[columnMap['guncelleme'] + offset]?.textContent || '').trim() : '',
        silme: columnMap['silme'] !== undefined ? (cells[columnMap['silme'] + offset]?.textContent || '').trim() : '',
        onaylama: columnMap['onaylama'] !== undefined ? (cells[columnMap['onaylama'] + offset]?.textContent || '').trim() : ''
      }
    };

    console.log(`✅ Satır ${rowIndex} eklendi:`, {
      rolKullanici: yetkilendirmeItem.data.rolKullanici,
      ekranIslem: yetkilendirmeItem.data.ekranIslem,
      goruntuleme: yetkilendirmeItem.data.goruntuleme,
      ekleme: yetkilendirmeItem.data.ekleme
    });
    results.push(yetkilendirmeItem);
  }

  console.log('📊 parseYetkilendirmeTable sonucu:', results.length, 'satır');
  return results;
}

/**
 * Yetkilendirme başlığını arar
 */
function findYetkilendirmeHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'yetkilendirme', 'authorization', 'yetki', 'permission', 'access control',
    'rol kullanici', 'user roles', 'yetkilendirme tablosu', 'authorization table',
    'erisim kontrolu', 'access management', 'kullanici yetkileri', 'user permissions',
    'rol bazli erisim', 'role based access', 'yetki matrisi', 'permission matrix'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Yetkilendirme başlığı bulundu: "${header.textContent}" (${keyword})`);
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
export async function parseYetkilendirmeFromDocx(file: File): Promise<YetkilendirmeParseResult> {
  console.log('🔍 DOCX Yetkilendirme Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: YetkilendirmeParseResult = {
      tableRows: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findYetkilendirmeHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve Yetkilendirme tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseYetkilendirmeTable(table);
        
        if (rows.length > 0) {
          parseResult.tableRows = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'satır bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo Yetkilendirme tablosu değil');
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
        const rows = parseYetkilendirmeTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} satır (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Yetkilendirme tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Yetkilendirme tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    const rows = parseYetkilendirmeTable(bestCandidate.table);
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
