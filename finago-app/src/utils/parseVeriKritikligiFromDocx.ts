/**
 * DOCX'ten Veri Kritikliği tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Veri Kritikliği" tablolarını bulur ve parse eder.
 * Tablo yapısı: Sıra, Veri Adı, Tablo Adı, Veri Adı Açıklaması, Gizlilik, Bütünlük, Erişilebilirlik, Hassas veri mi, Sır Veri mi?
 */

import mammoth from 'mammoth';

// Veri Kritikliği satırı interface'i
export interface VeriKritikligiItem {
  id: string;
  data: {
    sira: string;
    veriAdi: string;
    tabloAdi: string;
    veriAdiAciklamasi: string;
    gizlilik: string;
    butunluk: string;
    erisilebilirlik: string;
    hassasVeriMi: string;
    sirVeriMi: string;
  };
}

// Parse sonucu interface'i
export interface VeriKritikligiParseResult {
  tableRows: VeriKritikligiItem[];
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

// Veri Kritikliği tablosu için etiket listesi
const VERI_KRITIKLIGI_LABELS = [
  'sira', 'numara', 'number', 'no', 'index', 'sequence',
  'veri adi', 'veri', 'data name', 'data', 'bilgi', 'information', 'alan adi', 'field name',
  'tablo adi', 'tablo', 'table name', 'table', 'cetvel', 'dosya', 'file',
  'veri adi aciklamasi', 'aciklama', 'description', 'explanation', 'tanim', 'definition', 'detay',
  'gizlilik', 'confidentiality', 'secret', 'privacy', 'sir', 'mahrem', 'gizli',
  'butunluk', 'bütünlük', 'integrity', 'wholeness', 'tamlik', 'butun',
  'erisilebilirlik', 'erişilebilirlik', 'accessibility', 'availability', 'ulasilabilirlik', 'erisim',
  'hassas veri mi', 'hassas veri', 'hassas', 'sensitive data', 'sensitive', 'kritik', 'hassas mi',
  'sir veri mi', 'sir veri', 'sir', 'confidential data', 'confidential', 'gizli veri', 'sir mi',
  'veri kritikligi', 'data criticality', 'veri guvenligi', 'data security',
  'kritiklik', 'criticality', 'security level', 'guvenlik seviyesi'
];

/**
 * Tablonun Veri Kritikliği tablosu olup olmadığını kontrol eder
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
    const isMatch = VERI_KRITIKLIGI_LABELS.some(label => 
      cellText.includes(label) || label.includes(cellText)
    );
    if (isMatch) {
      matchCount++;
      console.log(`🎯 determineTableType eşleşme: "${cellText}"`);
    }
  }

  console.log(`🔍 determineTableType sonucu: ${matchCount} eşleşme (minimum 5 gerekli)`);
  // En az 5 etiket eşleşmesi olmalı (Veri Kritikliği tablosu için - 9 sütun var)
  return matchCount >= 5;
}

/**
 * Veri Kritikliği tablosunu parse eder
 */
function parseVeriKritikligiTable(table: Element): VeriKritikligiItem[] {
  const rows = table.querySelectorAll('tr');
  const results: VeriKritikligiItem[] = [];
  
  if (rows.length < 2) return results; // Header + en az 1 data row olmalı

  console.log('🔍 parseVeriKritikligiTable - Toplam satır:', rows.length);

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

    // Sütun mapping - daha spesifik kontroller
    if (cellText.includes('sira') || cellText.includes('numara') || cellText.includes('number') || cellText.includes('no') || cellText === '#') {
      columnMap['sira'] = i;
      console.log(`✅ sira mapping: ${i}`);
    } else if ((cellText.includes('veri') && cellText.includes('adi') && !cellText.includes('aciklama') && !cellText.includes('tablo')) || 
               (cellText.includes('alan') && cellText.includes('adi')) || 
               cellText.includes('field name') || 
               cellText.includes('data name')) {
      columnMap['veriAdi'] = i;
      console.log(`✅ veriAdi mapping: ${i}`);
    } else if ((cellText.includes('tablo') && cellText.includes('adi')) || 
               cellText.includes('table name') || 
               cellText.includes('tablo') || 
               cellText.includes('table') || 
               cellText.includes('dosya') || 
               cellText.includes('file')) {
      columnMap['tabloAdi'] = i;
      console.log(`✅ tabloAdi mapping: ${i}`);
    } else if ((cellText.includes('veri') && cellText.includes('adi') && cellText.includes('aciklama')) || 
               cellText.includes('aciklama') || 
               cellText.includes('description') || 
               cellText.includes('explanation') || 
               cellText.includes('detay') || 
               cellText.includes('tanim')) {
      columnMap['veriAdiAciklamasi'] = i;
      console.log(`✅ veriAdiAciklamasi mapping: ${i}`);
    } else if (cellText.includes('gizlilik') || 
               cellText.includes('confidentiality') || 
               cellText.includes('privacy') || 
               cellText.includes('gizli') || 
               cellText.includes('mahrem')) {
      columnMap['gizlilik'] = i;
      console.log(`✅ gizlilik mapping: ${i}`);
    } else if (cellText.includes('butunluk') || 
               cellText.includes('bütünlük') || 
               cellText.includes('integrity') || 
               cellText.includes('butun') || 
               cellText.includes('tamlik')) {
      columnMap['butunluk'] = i;
      console.log(`✅ butunluk mapping: ${i}`);
    } else if (cellText.includes('erisilebilirlik') || 
               cellText.includes('erişilebilirlik') || 
               cellText.includes('accessibility') || 
               cellText.includes('erisim') || 
               cellText.includes('availability') || 
               cellText.includes('ulasilabilirlik')) {
      columnMap['erisilebilirlik'] = i;
      console.log(`✅ erisilebilirlik mapping: ${i}`);
    } else if ((cellText.includes('hassas') && (cellText.includes('veri') || cellText.includes('mi'))) || 
               cellText.includes('sensitive data') || 
               cellText.includes('sensitive') || 
               cellText.includes('kritik') || 
               cellText.includes('hassas mi')) {
      columnMap['hassasVeriMi'] = i;
      console.log(`✅ hassasVeriMi mapping: ${i}`);
    } else if ((cellText.includes('sir') && (cellText.includes('veri') || cellText.includes('mi'))) || 
               cellText.includes('confidential data') || 
               cellText.includes('confidential') || 
               cellText.includes('gizli veri') || 
               cellText.includes('sir mi') || 
               cellText.includes('secret')) {
      columnMap['sirVeriMi'] = i;
      console.log(`✅ sirVeriMi mapping: ${i}`);
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
    const siraIndex = columnMap['sira'] !== undefined ? columnMap['sira'] : -1;
    const veriAdiIndex = columnMap['veriAdi'] !== undefined ? columnMap['veriAdi'] : -1;
    const tabloAdiIndex = columnMap['tabloAdi'] !== undefined ? columnMap['tabloAdi'] : -1;
    const veriAdiAciklamasiIndex = columnMap['veriAdiAciklamasi'] !== undefined ? columnMap['veriAdiAciklamasi'] : -1;
    const gizlilikIndex = columnMap['gizlilik'] !== undefined ? columnMap['gizlilik'] : -1;
    const butunlukIndex = columnMap['butunluk'] !== undefined ? columnMap['butunluk'] : -1;
    const erisilebilirlikIndex = columnMap['erisilebilirlik'] !== undefined ? columnMap['erisilebilirlik'] : -1;
    const hassasVeriMiIndex = columnMap['hassasVeriMi'] !== undefined ? columnMap['hassasVeriMi'] : -1;
    const sirVeriMiIndex = columnMap['sirVeriMi'] !== undefined ? columnMap['sirVeriMi'] : -1;

    console.log(`🔢 Satır ${rowIndex} için hesaplanan indeksler:`, {
      siraIndex, veriAdiIndex, tabloAdiIndex, veriAdiAciklamasiIndex,
      gizlilikIndex, butunlukIndex, erisilebilirlikIndex, hassasVeriMiIndex, sirVeriMiIndex
    });

    // Her hücrenin ham içeriğini yazdır
    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
      const cellContent = (cells[cellIndex].textContent || '').trim();
      console.log(`📝 Hücre ${cellIndex}: "${cellContent}"`);
    }

    const extractedData = {
      sira: siraIndex >= 0 && cells[siraIndex] ? (cells[siraIndex].textContent || '').trim() : '',
      veriAdi: veriAdiIndex >= 0 && cells[veriAdiIndex] ? (cells[veriAdiIndex].textContent || '').trim() : '',
      tabloAdi: tabloAdiIndex >= 0 && cells[tabloAdiIndex] ? (cells[tabloAdiIndex].textContent || '').trim() : '',
      veriAdiAciklamasi: veriAdiAciklamasiIndex >= 0 && cells[veriAdiAciklamasiIndex] ? (cells[veriAdiAciklamasiIndex].textContent || '').trim() : '',
      gizlilik: gizlilikIndex >= 0 && cells[gizlilikIndex] ? (cells[gizlilikIndex].textContent || '').trim() : '',
      butunluk: butunlukIndex >= 0 && cells[butunlukIndex] ? (cells[butunlukIndex].textContent || '').trim() : '',
      erisilebilirlik: erisilebilirlikIndex >= 0 && cells[erisilebilirlikIndex] ? (cells[erisilebilirlikIndex].textContent || '').trim() : '',
      hassasVeriMi: hassasVeriMiIndex >= 0 && cells[hassasVeriMiIndex] ? (cells[hassasVeriMiIndex].textContent || '').trim() : '',
      sirVeriMi: sirVeriMiIndex >= 0 && cells[sirVeriMiIndex] ? (cells[sirVeriMiIndex].textContent || '').trim() : ''
    };

    console.log(`📋 Satır ${rowIndex} çıkarılan data:`, extractedData);

    const veriKritikligiItem: VeriKritikligiItem = {
      id: rowIndex.toString(),
      data: extractedData
    };

    console.log(`✅ Satır ${rowIndex} eklendi:`, {
      sira: veriKritikligiItem.data.sira,
      veriAdi: veriKritikligiItem.data.veriAdi,
      tabloAdi: veriKritikligiItem.data.tabloAdi,
      gizlilik: veriKritikligiItem.data.gizlilik
    });
    results.push(veriKritikligiItem);
  }

  console.log('📊 parseVeriKritikligiTable sonucu:', results.length, 'satır');
  return results;
}

/**
 * Veri Kritikliği başlığını arar
 */
function findVeriKritikligiHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'veri kritikligi', 'veri kritikliği', 'data criticality', 'veri guvenligi', 'data security',
    'veri siniflandirma', 'data classification', 'bilgi guvenligi', 'information security',
    'hassas veri', 'sensitive data', 'gizli veri', 'confidential data',
    'veri koruma', 'data protection', 'gizlilik butunluk', 'confidentiality integrity',
    'veri yonetimi', 'data management', 'bilgi yonetimi', 'information management'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Veri Kritikliği başlığı bulundu: "${header.textContent}" (${keyword})`);
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
export async function parseVeriKritikligiFromDocx(file: File): Promise<VeriKritikligiParseResult> {
  console.log('🔍 DOCX Veri Kritikliği Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: VeriKritikligiParseResult = {
      tableRows: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findVeriKritikligiHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve Veri Kritikliği tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseVeriKritikligiTable(table);
        
        if (rows.length > 0) {
          parseResult.tableRows = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'satır bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo Veri Kritikliği tablosu değil');
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
        const rows = parseVeriKritikligiTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} satır (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Veri Kritikliği tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Veri Kritikliği tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    const rows = parseVeriKritikligiTable(bestCandidate.table);
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
