import * as mammoth from 'mammoth';

export interface KabulKriterleriRow {
  id: string;
  kriterIs: string;
  aciklama: string;
  islemler: string;
}

export interface KabulKriterleriParseResult {
  tableRows: KabulKriterleriRow[];
  found: boolean;
  mode: 'strict' | 'scan';
  errors: string[];
  warnings: string[];
  matchedLabels: string[];
}

// Türkçe karakterleri normalize et
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[çĉ]/g, 'c')
    .replace(/[ğĝ]/g, 'g')
    .replace(/[ıîi̇]/g, 'i')
    .replace(/[öôò]/g, 'o')
    .replace(/[şŝ]/g, 's')
    .replace(/[üûù]/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kabul Kriterleri tablosu başlığını bul
function findKabulKriterleriHeader(doc: Document): Element | null {
  console.log('🎯 Kabul Kriterleri başlığı arıyor...');
  
  const allElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = normalizeText(element.textContent || '');
    
    if (text.includes('kabul') && text.includes('kriterleri')) {
      console.log(`🎯 Kabul Kriterleri başlığı bulundu: "${element.textContent}" (${text})`);
      return element;
    }
  }
  
  console.log('❌ Kabul Kriterleri başlığı bulunamadı');
  return null;
}

// Tablo kolonlarını eşle
function mapColumns(headerCells: Element[]): { 
  kriterIsIndex: number; 
  aciklamaIndex: number; 
  islemlerIndex: number; 
} {
  console.log('🔍 Kolon eşleme başlıyor...');
  
  let kriterIsIndex = -1;
  let aciklamaIndex = -1;
  let islemlerIndex = -1;
  
  for (let i = 0; i < headerCells.length; i++) {
    const cellText = normalizeText(headerCells[i].textContent || '');
    console.log(`📋 Kolon ${i}: "${headerCells[i].textContent}" → "${cellText}"`);
    
    // Kriter / İş kolonu
    if (cellText.includes('kriter') && (cellText.includes('is') || cellText.includes('iş'))) {
      kriterIsIndex = i;
      console.log(`✅ Kriter/İş kolonu bulundu: ${i}`);
    }
    // Açıklama kolonu
    else if (cellText.includes('aciklama') || cellText.includes('açıklama') || cellText.includes('tanim') || cellText.includes('description')) {
      aciklamaIndex = i;
      console.log(`✅ Açıklama kolonu bulundu: ${i}`);
    }
    // İşlemler kolonu
    else if (cellText.includes('islemler') || cellText.includes('işlemler') || cellText.includes('action') || cellText.includes('operations') || cellText.includes('islem') || cellText.includes('işlem') || cellText.includes('yapilacaklar') || cellText.includes('yapılacaklar') || cellText.includes('todo')) {
      islemlerIndex = i;
      console.log(`✅ İşlemler kolonu bulundu: ${i}`);
    }
  }
  
  console.log(`📊 Kolon eşleme sonucu: Kriter/İş=${kriterIsIndex}, Açıklama=${aciklamaIndex}, İşlemler=${islemlerIndex}`);
  
  
  return { kriterIsIndex, aciklamaIndex, islemlerIndex };
}

// Kabul Kriterleri tablosunu parse et
function parseKabulKriterleriTable(table: Element): KabulKriterleriRow[] {
  console.log('🔍 parseKabulKriterleriTable başlıyor...');
  
  const rows: KabulKriterleriRow[] = [];
  const tableRows = table.querySelectorAll('tr');
  
  if (tableRows.length === 0) {
    console.log('❌ Tablo satırı bulunamadı');
    return rows;
  }
  
  // İlk satırı header olarak kabul et
  const headerRow = tableRows[0];
  const headerCells = headerRow.querySelectorAll('td, th');
  
  if (headerCells.length === 0) {
    console.log('❌ Header hücreleri bulunamadı');
    return rows;
  }
  
  // Kolon indekslerini bul
  const { kriterIsIndex, aciklamaIndex, islemlerIndex } = mapColumns(Array.from(headerCells));
  
  if (kriterIsIndex === -1) {
    console.log('❌ Kriter/İş kolonu bulunamadı');
    return rows;
  }
  
  // Veri satırlarını işle (header'ı atla)
  for (let i = 1; i < tableRows.length; i++) {
    const row = tableRows[i];
    const cells = row.querySelectorAll('td, th');
    
    if (cells.length === 0) continue;
    
    const kriterIs = cells[kriterIsIndex]?.textContent?.trim() || '';
    const aciklama = aciklamaIndex !== -1 ? (cells[aciklamaIndex]?.textContent?.trim() || '') : '';
    const islemler = islemlerIndex !== -1 ? (cells[islemlerIndex]?.textContent?.trim() || '') : '';
    
    
    // Boş satırları atla
    if (!kriterIs && !aciklama && !islemler) {
      console.log(`⏭️ Satır ${i}: Boş satır atlandı`);
      continue;
    }
    
    const rowData: KabulKriterleriRow = {
      id: `kabul-kriterleri-${i}`,
      kriterIs,
      aciklama,
      islemler
    };
    
    rows.push(rowData);
    console.log(`✅ Satır ${i}: Kriter="${kriterIs}", Açıklama="${aciklama}", İşlemler="${islemler}"`);
  }
  
  console.log(`📊 parseKabulKriterleriTable sonucu: ${rows.length} satır`);
  return rows;
}

// Kabul Kriterleri tablosunu doğrula
function isKabulKriterleriTable(table: Element): boolean {
  const headerRow = table.querySelector('tr');
  if (!headerRow) return false;
  
  const headerCells = headerRow.querySelectorAll('td, th');
  const headerTexts = Array.from(headerCells).map(cell => normalizeText(cell.textContent || ''));
  
  // "Kriter" ve "İş" kelimelerini ara
  const hasKriterIs = headerTexts.some(text => 
    text.includes('kriter') && (text.includes('is') || text.includes('iş'))
  );
  
  // "Açıklama" kelimesini ara
  const hasAciklama = headerTexts.some(text => 
    text.includes('aciklama') || text.includes('açıklama')
  );
  
  console.log(`🔍 Tablo doğrulama: hasKriterIs=${hasKriterIs}, hasAciklama=${hasAciklama}`);
  console.log(`📋 Header metinleri: [${headerTexts.join(', ')}]`);
  
  return hasKriterIs && hasAciklama;
}

// Ana parse fonksiyonu
export async function parseKabulKriterleriFromDocx(file: File): Promise<KabulKriterleriParseResult> {
  console.log('🔍 DOCX Kabul Kriterleri Parse Başlıyor:', file.name);
  
  const parseResult: KabulKriterleriParseResult = {
    tableRows: [],
    found: false,
    mode: 'strict',
    errors: [],
    warnings: [],
    matchedLabels: []
  };
  
  try {
    // DOCX'i HTML'e dönüştür
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlContent = result.value;
    
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', htmlContent.length);
    
    // DOM parser ile parse et
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // STRICT MODE: Başlık ara ve sonraki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findKabulKriterleriHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      
      // Başlıktan sonraki tüm elementleri kontrol et
      let nextElement = header.nextElementSibling;
      while (nextElement) {
        if (nextElement.tagName === 'TABLE') {
          console.log('✅ Tablo bulundu, doğruluğu kontrol ediliyor...');
          
          if (isKabulKriterleriTable(nextElement)) {
            console.log('✅ Kabul Kriterleri tablosu doğrulandı, parse ediliyor...');
            parseResult.tableRows = parseKabulKriterleriTable(nextElement);
            parseResult.found = true;
            parseResult.mode = 'strict';
            
            if (parseResult.tableRows.length === 0) {
              parseResult.warnings.push('Tablo bulundu ancak veri satırı bulunamadı');
            }
            
            return parseResult;
          } else {
            console.log('⚠️ Başlık bulundu ama sonraki tablo Kabul Kriterleri tablosu değil');
          }
        }
        nextElement = nextElement.nextElementSibling;
      }
      
      console.log('⚠️ Başlık bulundu ama sonrasında uygun tablo bulunamadı');
    }
    
    // SCAN MODE: Tüm tabloları tara
    console.log('❌ Başlık bulunamadı, SCAN mode başlıyor...');
    parseResult.mode = 'scan';
    
    const tables = doc.querySelectorAll('table');
    console.log('📊 Toplam tablo sayısı:', tables.length);
    
    const candidates: { table: Element; score: number }[] = [];
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      console.log(`🔍 Tablo ${i + 1} kontrol ediliyor...`);
      
      if (isKabulKriterleriTable(table)) {
        const rows = parseKabulKriterleriTable(table);
        const score = rows.length;
        
        if (score > 0) {
          candidates.push({ table, score });
          console.log(`📊 ✅ Tablo ${i + 1}: ${score} satır (aday)`);
        }
      } else {
        console.log(`📊 ❌ Tablo ${i + 1}: Kabul Kriterleri tablosu değil`);
      }
    }
    
    if (candidates.length === 0) {
      parseResult.errors.push('Kabul Kriterleri tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }
    
    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`🏆 En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    parseResult.tableRows = parseKabulKriterleriTable(bestCandidate.table);
    parseResult.found = true;
    
    if (candidates.length > 1) {
      parseResult.warnings.push(`Birden fazla aday tablo bulundu (${candidates.length}), en yüksek skorlu seçildi`);
    }
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    parseResult.errors.push(`Parse hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
  
  return parseResult;
}
