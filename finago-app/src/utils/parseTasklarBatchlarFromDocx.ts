/**
 * DOCX'ten Taskler/Batchler tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Taskler/Batchler" tablolarını bulur ve parse eder.
 * Tablo yapısı: Yeni/Mevcut, Task/Job Adı, Tanım, Sorumlu Sistem/Modül, Çalışma Zamanı, vb.
 */

import mammoth from 'mammoth';

// Taskler/Batchler tablo satırı interface'i
export interface TaskBatchRow {
  id: number;
  yeniMevcut: string;
  taskJobAdi: string;
  tanim: string;
  sorumluSistem: string;
  calismaSaati: string;
  calismaSikligi: string;
  bagimliliklar: string;
  alertMekanizmasi: string;
  alternatifCalistirmaYontemi: string;
}

// Parse sonucu interface'i
export interface TasklarBatchlarParseResult {
  taskBatchTable: TaskBatchRow[];
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

// Taskler/Batchler tablosu için etiket listesi
const TASKLAR_BATCHLAR_LABELS = [
  'yeni mevcut', 'yeni', 'mevcut', 'task job adi', 'task adi', 'job adi', 'taskjob adi',
  'tanim', 'tanimlama', 'aciklama', 'sorumlu sistem', 'sorumlu modul', 'sistem', 'modul',
  'calisma zamani', 'calisma saati', 'calisma zaman', 'zaman', 'saat', 'calisma sikligi', 
  'siklik', 'sikligi', 'periyot', 'periyodik', 'tekrar', 'frequency', 'bagimliliklar', 'bagimlilik', 'alert mekanizmasi', 'alert', 
  'uyari', 'alternatif calistirma yontemi', 'alternatif', 'calistirma', 'yontemi',
  'taskler', 'batchler', 'tasklar', 'batchlar', 'gorev', 'gorevler', 'islem', 'islemler'
];

/**
 * Tablonun Taskler/Batchler tablosu olup olmadığını kontrol eder
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
    const isMatch = TASKLAR_BATCHLAR_LABELS.some(label => 
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
 * Taskler/Batchler tablosunu parse eder
 */
function parseTasklarBatchlarTable(table: Element): TaskBatchRow[] {
  const rows = table.querySelectorAll('tr');
  const results: TaskBatchRow[] = [];
  
  if (rows.length < 2) return results; // Header + en az 1 data row olmalı

  console.log('🔍 parseTasklarBatchlarTable - Toplam satır:', rows.length);

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

    // Sütun mapping (offset ile)
    if (cellText.includes('yeni') || cellText.includes('mevcut')) {
      columnMap['yeniMevcut'] = i;
      console.log(`✅ yeniMevcut mapping: ${i}`);
    } else if (cellText.includes('task') || cellText.includes('job')) {
      columnMap['taskJobAdi'] = i;
      console.log(`✅ taskJobAdi mapping: ${i}`);
    } else if (cellText.includes('tanim')) {
      columnMap['tanim'] = i;
      console.log(`✅ tanim mapping: ${i}`);
    } else if (cellText.includes('sorumlu') && (cellText.includes('sistem') || cellText.includes('modul'))) {
      columnMap['sorumluSistem'] = i;
      console.log(`✅ sorumluSistem mapping: ${i}`);
    } else if (cellText.includes('calisma') && cellText.includes('zaman')) {
      columnMap['calismaSaati'] = i;
      console.log(`✅ calismaSaati mapping: ${i}`);
    } else if (cellText.includes('calisma') && (cellText.includes('siklik') || cellText.includes('sikligi'))) {
      columnMap['calismaSikligi'] = i;
      console.log(`✅ calismaSikligi mapping: ${i}`);
    } else if (cellText.includes('siklik') || cellText.includes('sikligi') || cellText.includes('periyot') || cellText.includes('tekrar') || cellText.includes('frequency')) {
      columnMap['calismaSikligi'] = i;
      console.log(`✅ calismaSikligi mapping (genel): ${i}`);
    } else if (cellText.includes('bagimlilik')) {
      columnMap['bagimliliklar'] = i;
      console.log(`✅ bagimliliklar mapping: ${i}`);
    } else if (cellText.includes('alert') || cellText.includes('uyari')) {
      columnMap['alertMekanizmasi'] = i;
      console.log(`✅ alertMekanizmasi mapping: ${i}`);
    } else if (cellText.includes('alternatif')) {
      columnMap['alternatifCalistirmaYontemi'] = i;
      console.log(`✅ alternatifCalistirmaYontemi mapping: ${i}`);
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

    // Offset uygulanmış sütun indexleri ile veri çek
    const taskBatchRow: TaskBatchRow = {
      id: rowIndex,
      yeniMevcut: columnMap['yeniMevcut'] !== undefined ? (cells[columnMap['yeniMevcut']]?.textContent || '').trim() : '',
      taskJobAdi: columnMap['taskJobAdi'] !== undefined ? (cells[columnMap['taskJobAdi']]?.textContent || '').trim() : '',
      tanim: columnMap['tanim'] !== undefined ? (cells[columnMap['tanim']]?.textContent || '').trim() : '',
      sorumluSistem: columnMap['sorumluSistem'] !== undefined ? (cells[columnMap['sorumluSistem']]?.textContent || '').trim() : '',
      calismaSaati: columnMap['calismaSaati'] !== undefined ? (cells[columnMap['calismaSaati']]?.textContent || '').trim() : '',
      calismaSikligi: columnMap['calismaSikligi'] !== undefined ? (cells[columnMap['calismaSikligi']]?.textContent || '').trim() : '',
      bagimliliklar: columnMap['bagimliliklar'] !== undefined ? (cells[columnMap['bagimliliklar']]?.textContent || '').trim() : '',
      alertMekanizmasi: columnMap['alertMekanizmasi'] !== undefined ? (cells[columnMap['alertMekanizmasi']]?.textContent || '').trim() : '',
      alternatifCalistirmaYontemi: columnMap['alternatifCalistirmaYontemi'] !== undefined ? (cells[columnMap['alternatifCalistirmaYontemi']]?.textContent || '').trim() : ''
    };

    console.log(`✅ Satır ${rowIndex} eklendi:`, {
      yeniMevcut: taskBatchRow.yeniMevcut,
      taskJobAdi: taskBatchRow.taskJobAdi,
      tanim: taskBatchRow.tanim.substring(0, 30) + (taskBatchRow.tanim.length > 30 ? '...' : '')
    });
    results.push(taskBatchRow);
  }

  console.log('📊 parseTasklarBatchlarTable sonucu:', results.length, 'satır');
  return results;
}

/**
 * Taskler/Batchler başlığını arar
 */
function findTasklarBatchlarHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'taskler batchler', 'tasklar batchlar', 'task batch', 'taskler', 'batchler',
    'tasklar', 'batchlar', 'gorevler', 'isler', 'batch islemleri', 'toplu islemler',
    'job batch', 'job task', 'gorev listesi', 'islem listesi', 'otomasyon',
    'zamanlanmis islemler', 'periyodik islemler'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Taskler/Batchler başlığı bulundu: "${header.textContent}" (${keyword})`);
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
export async function parseTasklarBatchlarFromDocx(file: File): Promise<TasklarBatchlarParseResult> {
  console.log('🔍 DOCX Taskler/Batchler Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: TasklarBatchlarParseResult = {
      taskBatchTable: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findTasklarBatchlarHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve Tasklar/Batchlar tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseTasklarBatchlarTable(table);
        
        if (rows.length > 0) {
          parseResult.taskBatchTable = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'satır bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo Tasklar/Batchlar tablosu değil');
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
        const rows = parseTasklarBatchlarTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} satır (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Taskler/Batchler tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Taskler/Batchler tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    const rows = parseTasklarBatchlarTable(bestCandidate.table);
    parseResult.taskBatchTable = rows;
    parseResult.found = true;
    
    if (candidates.length > 1) {
      parseResult.warnings.push(`${candidates.length} aday tablo bulundu, en iyisi seçildi`);
    }
    
    console.log('✅ SCAN Mode başarılı:', rows.length, 'satır bulundu');
    return parseResult;
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      taskBatchTable: [],
      found: false,
      mode: 'strict',
      errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
      warnings: [],
      matchedLabels: []
    };
  }
}
