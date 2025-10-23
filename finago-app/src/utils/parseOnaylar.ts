import * as mammoth from 'mammoth';

export interface OnaylarRow {
  id: string;
  isim: string;        // İşlem Tipi olarak kullanılacak
  unvan: string;       // Onay Seviyesi olarak kullanılacak  
  tarih: string;       // Onay Süreci olarak kullanılacak
}

export interface OnaylarParseResult {
  tableRows: OnaylarRow[];
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

// Onaylar tablosu başlığını bul
function findOnaylarHeader(doc: Document): Element | null {
  console.log('🎯 Onaylar başlığı arıyor...');
  
  const allElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  console.log(`🔍 Toplam ${allElements.length} element taranacak`);
  
  const searchTerms = ['onaylar', 'approval', 'onay', 'onaylayan', 'onaylayici'];
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = normalizeText(element.textContent || '');
    
    for (const term of searchTerms) {
      if (text.includes(term)) {
        console.log(`🎯 Onaylar başlığı bulundu: "${element.textContent}" (${text}) - arama terimi: "${term}"`);
        return element;
      }
    }
    
    // Debug: İlk 50 elementi logla
    if (i < 50 && text.length > 2) {
      console.log(`🔍 Element ${i}: "${element.textContent?.slice(0, 50)}..." → "${text.slice(0, 30)}..."`);
    }
  }
  
  console.log('❌ Onaylar başlığı bulunamadı');
  return null;
}

// Tablo kolonlarını eşle
function mapColumns(headerCells: Element[]): { 
  isimIndex: number; 
  unvanIndex: number; 
  tarihIndex: number;
  offset: number;
} {
  console.log('🔍 Kolon eşleme başlıyor...');
  
  let isimIndex = -1;
  let unvanIndex = -1;
  let tarihIndex = -1;
  let offset = 0;
  
  // İlk kolon boş veya numara ise offset uygula
  if (headerCells.length > 0) {
    const firstCellText = normalizeText(headerCells[0].textContent || '');
    console.log(`🔍 İlk kolon analizi: "${headerCells[0].textContent}" → "${firstCellText}"`);
    
    if (firstCellText === '' || firstCellText.includes('sira') || firstCellText.includes('no') || firstCellText === '#' || /^\d+$/.test(firstCellText)) {
      offset = 1;
      console.log('✅ İlk kolon numara/boş, offset=1 uygulanıyor');
    }
  }
  
  for (let i = 0; i < headerCells.length; i++) {
    const cellText = normalizeText(headerCells[i].textContent || '');
    console.log(`📋 Kolon ${i}: "${headerCells[i].textContent}" → "${cellText}"`);
    
    // İşlem Tipi kolonu (isim alanına map)
    if (cellText.includes('islem tipi') || cellText.includes('işlem tipi') || cellText.includes('islem') || cellText.includes('işlem')) {
      isimIndex = i;
      console.log(`✅ İşlem Tipi kolonu bulundu: ${i}`);
    }
    // Onay Seviyesi kolonu (unvan alanına map)
    else if (cellText.includes('onay seviyesi') || cellText.includes('seviye') || cellText.includes('level')) {
      unvanIndex = i;
      console.log(`✅ Onay Seviyesi kolonu bulundu: ${i}`);
    }
    // Onay Süreci kolonu (tarih alanına map)
    else if (cellText.includes('onay sureci') || cellText.includes('süreç') || cellText.includes('surec') || cellText.includes('process')) {
      tarihIndex = i;
      console.log(`✅ Onay Süreci kolonu bulundu: ${i}`);
    }
    // Legacy İsim/Ünvan/Tarih kolonları
    else if (cellText.includes('isim') || cellText.includes('ad') || cellText.includes('name') || cellText.includes('adi')) {
      isimIndex = i;
      console.log(`✅ İsim kolonu bulundu: ${i}`);
    }
    else if (cellText.includes('unvan') || cellText.includes('title') || cellText.includes('pozisyon') || cellText.includes('position')) {
      unvanIndex = i;
      console.log(`✅ Ünvan kolonu bulundu: ${i}`);
    }
    else if (cellText.includes('tarih') || cellText.includes('date') || cellText.includes('gun') || cellText.includes('gün')) {
      tarihIndex = i;
      console.log(`✅ Tarih kolonu bulundu: ${i}`);
    }
  }
  
  console.log(`📊 Kolon eşleme sonucu: İsim=${isimIndex}, Ünvan=${unvanIndex}, Tarih=${tarihIndex}, Offset=${offset}`);
  
  return { isimIndex, unvanIndex, tarihIndex, offset };
}

// Onaylar tablosunu parse et
function parseOnaylarTable(table: Element): OnaylarRow[] {
  console.log('🔍 parseOnaylarTable başlıyor...');
  
  const rows: OnaylarRow[] = [];
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
  const { isimIndex, unvanIndex, tarihIndex, offset } = mapColumns(Array.from(headerCells));
  
  if (isimIndex === -1) {
    console.log('❌ İsim kolonu bulunamadı');
    return rows;
  }
  
  console.log(`🔧 Offset uygulanıyor: ${offset}`);
  
  // Veri satırlarını işle (header'ı atla)
  for (let i = 1; i < tableRows.length; i++) {
    const row = tableRows[i];
    const cells = row.querySelectorAll('td, th');
    
    if (cells.length === 0) continue;
    
    // Offset uygulayarak doğru hücreleri al
    const isim = cells[isimIndex]?.textContent?.trim() || '';
    const unvan = unvanIndex !== -1 ? (cells[unvanIndex]?.textContent?.trim() || '') : '';
    const tarih = tarihIndex !== -1 ? (cells[tarihIndex]?.textContent?.trim() || '') : '';
    
    console.log(`📊 Satır ${i} (${cells.length} hücre): İsim[${isimIndex}]="${isim}", Ünvan[${unvanIndex}]="${unvan}", Tarih[${tarihIndex}]="${tarih}"`);
    
    // Boş satırları atla
    if (!isim && !unvan && !tarih) {
      console.log(`⏭️ Satır ${i}: Boş satır atlandı`);
      continue;
    }
    
    const rowData: OnaylarRow = {
      id: `onaylar-${i}`,
      isim,
      unvan,
      tarih
    };
    
    rows.push(rowData);
    console.log(`✅ Satır ${i}: İsim="${isim}", Ünvan="${unvan}", Tarih="${tarih}"`);
  }
  
  console.log(`📊 parseOnaylarTable sonucu: ${rows.length} satır`);
  return rows;
}

// Onaylar tablosunu doğrula
function isOnaylarTable(table: Element): boolean {
  const headerRow = table.querySelector('tr');
  if (!headerRow) return false;
  
  const headerCells = headerRow.querySelectorAll('td, th');
  const headerTexts = Array.from(headerCells).map(cell => normalizeText(cell.textContent || ''));
  
  // Anti-pattern: Bu tablolar kesinlikle Onaylar tablosu değil
  const antiPatterns = [
    'ekran adi kodu', 'mevzuat gereksinimi', 'talep degerlendirmesi', 'alan adi',
    'hesaplama kurali', 'buton adi', 'task job', 'entegrasyon adi', 'mesaj tipi',
    'parametre adi', 'veri adi', 'kriter', 'sube kodu', 'rol kullanici',
    'goruntuleme', 'ekleme', 'guncelleme', 'silme'
  ];
  
  const hasAntiPattern = headerTexts.some(text => 
    antiPatterns.some(pattern => text.includes(pattern))
  );
  
  if (hasAntiPattern) {
    console.log(`❌ Anti-pattern bulundu, Onaylar tablosu değil: [${headerTexts.join(', ')}]`);
    return false;
  }
  
  // Tablo içeriğini kontrol et - Test35 varsa Veri Kritikliği tablosu
  const allRows = table.querySelectorAll('tr');
  let hasTest35 = false;
  for (let i = 1; i < Math.min(allRows.length, 4); i++) { // İlk 3 veri satırını kontrol et
    const cells = allRows[i].querySelectorAll('td, th');
    for (let j = 0; j < cells.length; j++) {
      const cellText = normalizeText(cells[j].textContent || '');
      if (cellText.includes('test35') || cellText.includes('test 35')) {
        hasTest35 = true;
        break;
      }
    }
    if (hasTest35) break;
  }
  
  if (hasTest35) {
    console.log(`❌ Test35 verisi bulundu, bu Veri Kritikliği tablosu: [${headerTexts.join(', ')}]`);
    return false;
  }
  
  // "İsim" veya "Ad" kelimelerini ara (ama ekran adı değil!)
  const hasIsim = headerTexts.some(text => 
    (text.includes('isim') || text.includes('ad') || text.includes('name') || text.includes('adi')) &&
    !text.includes('ekran') && !text.includes('alan') && !text.includes('task') && !text.includes('job')
  );
  
  // "Ünvan" veya "Pozisyon" kelimelerini ara
  const hasUnvan = headerTexts.some(text => 
    text.includes('unvan') || text.includes('title') || text.includes('pozisyon') || text.includes('position')
  );
  
  // "Tarih" kelimesini ara
  const hasTarih = headerTexts.some(text => 
    text.includes('tarih') || text.includes('date') || text.includes('gun') || text.includes('gün')
  );
  
  // Onay-spesifik kelimeler
  const hasOnayPattern = headerTexts.some(text =>
    text.includes('onay') || text.includes('approval') || text.includes('onaylayan') || text.includes('imza')
  );
  
  console.log(`🔍 Tablo doğrulama: hasIsim=${hasIsim}, hasUnvan=${hasUnvan}, hasTarih=${hasTarih}, hasOnayPattern=${hasOnayPattern}, hasTest35=${hasTest35}`);
  console.log(`📋 Header metinleri: [${headerTexts.join(', ')}]`);
  
  // Daha sıkı kriter: En az 2 koşul sağlanmalı veya onay kelimesi olmalı
  return (hasIsim && hasUnvan) || (hasIsim && hasTarih) || hasOnayPattern;
}

// Ana parse fonksiyonu
export async function parseOnaylarFromDocx(file: File): Promise<OnaylarParseResult> {
  console.log('🔍 DOCX Onaylar Parse Başlıyor:', file.name);
  
  const parseResult: OnaylarParseResult = {
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
    const header = findOnaylarHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      
      // Başlıktan sonraki tüm elementleri kontrol et
      let nextElement = header.nextElementSibling;
      while (nextElement) {
        if (nextElement.tagName === 'TABLE') {
          console.log('✅ Tablo bulundu, doğruluğu kontrol ediliyor...');
          
          if (isOnaylarTable(nextElement)) {
            console.log('✅ Onaylar tablosu doğrulandı, parse ediliyor...');
            parseResult.tableRows = parseOnaylarTable(nextElement);
            parseResult.found = true;
            parseResult.mode = 'strict';
            
            if (parseResult.tableRows.length === 0) {
              parseResult.warnings.push('Tablo bulundu ancak veri satırı bulunamadı');
            }
            
            return parseResult;
          } else {
            console.log('⚠️ Başlık bulundu ama sonraki tablo Onaylar tablosu değil');
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
      
      // Tablo header'larını logla
      const headerRow = table.querySelector('tr');
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('td, th');
        const headers = Array.from(headerCells).map(cell => cell.textContent || '').join(' | ');
        console.log(`📋 Tablo ${i + 1} headers: [${headers}]`);
      }
      
      if (isOnaylarTable(table)) {
        const rows = parseOnaylarTable(table);
        const score = rows.length;
        
        if (score > 0) {
          candidates.push({ table, score });
          console.log(`📊 ✅ Tablo ${i + 1}: ${score} satır (aday) - Headers: [${headerRow ? Array.from(headerRow.querySelectorAll('td, th')).map(c => c.textContent).join(', ') : ''}]`);
        }
      } else {
        console.log(`📊 ❌ Tablo ${i + 1}: Onaylar tablosu değil`);
      }
    }
    
    if (candidates.length === 0) {
      parseResult.errors.push('Onaylar tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }
    
    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`🏆 En iyi aday seçildi: ${bestCandidate.score} satır`);
    
    parseResult.tableRows = parseOnaylarTable(bestCandidate.table);
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
