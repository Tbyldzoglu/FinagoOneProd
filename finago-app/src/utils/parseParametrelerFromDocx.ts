/**
 * DOCX'ten Parametreler/Tanımlar tablosunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Parametreler/Tanımlar" tablolarını bulur ve parse eder.
 * Tablo yapısı: Parametre Adı, Açıklama, Kapsam/Kullanım Alanı, Varsayılan Değer, Değer Aralığı, Parametre Yetkisi
 */

import mammoth from 'mammoth';

// Parametre satırı interface'i
export interface ParametreItem {
  id: string;
  data: {
    parametreAdi: string;
    aciklama: string;
    kapsamKullanimAlani: string;
    varsayilanDeger: string;
    degerAraligi: string;
    parametreYetkisi: string;
  };
}

// Parse sonucu interface'i
export interface ParametrelerParseResult {
  parametreler: ParametreItem[];
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

// Parametreler tablosu için etiket listesi
const PARAMETRELER_LABELS = [
  'parametre adi', 'parametre', 'parameter', 'aciklama', 'description',
  'kapsam', 'kullanim alani', 'kapsam kullanim alani', 'scope', 'usage area', 'kullanim', 'usage', 'varsayilan deger', 
  'default value', 'deger araligi', 'value range', 'parametre yetkisi',
  'parameter authority', 'yetki', 'authority', 'permission', 'izin',
  'config', 'configuration', 'ayar', 'setting', 'tanimlama', 'definition'
];

/**
 * Tablonun Parametreler tablosu olup olmadığını kontrol eder
 */
function determineTableType(table: Element): boolean {
  const rows = table.querySelectorAll('tr');
  if (rows.length === 0) return false;

  // Tüm satırları kontrol et (dikey form yapısı için)
  let matchCount = 0;
  const allText = table.textContent || '';
  const normalizedText = normalizeText(allText);
  
  for (const label of PARAMETRELER_LABELS) {
    if (normalizedText.includes(label)) {
      matchCount++;
      console.log(`🎯 determineTableType eşleşme: "${label}"`);
    }
  }

  console.log(`🔍 determineTableType sonucu: ${matchCount} eşleşme (minimum 3 gerekli)`);
  // En az 3 etiket eşleşmesi olmalı
  return matchCount >= 3;
}

/**
 * Parametreler tablosunu parse eder (dikey form yapısı)
 */
function parseParametrelerTable(table: Element): ParametreItem[] {
  const rows = table.querySelectorAll('tr');
  const results: ParametreItem[] = [];
  
  if (rows.length < 2) return results; // En az birkaç satır olmalı

  console.log('🔍 parseParametrelerTable - Toplam satır:', rows.length);

  // Label dictionary for field mapping
  const LABEL_DICTIONARY: { [key: string]: string } = {
    'parametre adi': 'parametreAdi',
    'parametre': 'parametreAdi',
    'parameter': 'parametreAdi',
    'aciklama': 'aciklama',
    'description': 'aciklama',
    'tanim': 'aciklama',
    'kapsam': 'kapsamKullanimAlani',
    'kullanim alani': 'kapsamKullanimAlani',
    'kapsam kullanim alani': 'kapsamKullanimAlani',
    'scope': 'kapsamKullanimAlani',
    'usage area': 'kapsamKullanimAlani',
    'alan': 'kapsamKullanimAlani',
    'kullanim': 'kapsamKullanimAlani',
    'usage': 'kapsamKullanimAlani',
    'varsayilan deger': 'varsayilanDeger',
    'varsayilan': 'varsayilanDeger',
    'default value': 'varsayilanDeger',
    'default': 'varsayilanDeger',
    'deger araligi': 'degerAraligi',
    'aralik': 'degerAraligi',
    'value range': 'degerAraligi',
    'range': 'degerAraligi',
    'parametre yetkisi': 'parametreYetkisi',
    'yetki': 'parametreYetkisi',
    'authority': 'parametreYetkisi',
    'permission': 'parametreYetkisi',
    'izin': 'parametreYetkisi'
  };

  // Parametreleri grupla (her parametre için bir grup)
  let currentParametre: any = null;
  let parametreCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const cells = row.querySelectorAll('td, th');
    
    if (cells.length < 2) continue;

    const labelCell = cells[0];
    const valueCell = cells[1];
    const labelText = normalizeText(labelCell.textContent || '');
    const valueText = (valueCell.textContent || '').trim();

    console.log(`📝 Satır ${rowIndex}: "${labelCell.textContent}" → normalized: "${labelText}" → value: "${valueText}"`);

    // Label'ı field'a map et
    const fieldKey = LABEL_DICTIONARY[labelText];
    
    if (fieldKey) {
      console.log(`🎯 Label eşleşti: "${labelText}" → ${fieldKey}`);
      // Yeni parametre başlıyor (parametre adı ile)
      if (fieldKey === 'parametreAdi' && valueText) {
        // Önceki parametreyi kaydet
        if (currentParametre && Object.keys(currentParametre.data).some(key => currentParametre.data[key])) {
          results.push(currentParametre);
          console.log(`✅ Parametre ${parametreCount} kaydedildi:`, currentParametre.data.parametreAdi);
        }
        
        // Yeni parametre başlat
        parametreCount++;
        currentParametre = {
          id: parametreCount.toString(),
          data: {
            parametreAdi: valueText,
            aciklama: '',
            kapsamKullanimAlani: '',
            varsayilanDeger: '',
            degerAraligi: '',
            parametreYetkisi: ''
          }
        };
        console.log(`🆕 Yeni parametre başladı: "${valueText}"`);
      } else if (currentParametre && fieldKey !== 'parametreAdi') {
        // Mevcut parametreye field ekle
        currentParametre.data[fieldKey] = valueText;
        console.log(`📝 ${fieldKey} eklendi: "${valueText}"`);
      }
    } else {
      console.log(`⚠️ Tanınmayan label: "${labelText}"`);
    }
  }

  // Son parametreyi kaydet
  if (currentParametre && Object.keys(currentParametre.data).some(key => currentParametre.data[key])) {
    results.push(currentParametre);
    console.log(`✅ Son parametre kaydedildi:`, currentParametre.data.parametreAdi);
  }

  console.log('📊 parseParametrelerTable sonucu:', results.length, 'parametre');
  return results;
}

/**
 * Parametreler başlığını arar
 */
function findParametrelerHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'parametreler', 'parametre', 'parameters', 'parameter',
    'tanimlar', 'tanim', 'definitions', 'definition',
    'ayarlar', 'ayar', 'settings', 'setting',
    'konfigurasyonlar', 'konfiguration', 'configuration',
    'sistem parametreleri', 'system parameters',
    'uygulama parametreleri', 'application parameters'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Parametreler başlığı bulundu: "${header.textContent}" (${keyword})`);
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
export async function parseParametrelerFromDocx(file: File): Promise<ParametrelerParseResult> {
  console.log('🔍 DOCX Parametreler Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: ParametrelerParseResult = {
      parametreler: [],
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findParametrelerHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table && determineTableType(table)) {
        console.log('✅ Tablo bulundu ve Parametreler tablosu olarak doğrulandı, parse ediliyor...');
        const rows = parseParametrelerTable(table);
        
        if (rows.length > 0) {
          parseResult.parametreler = rows;
          parseResult.found = true;
          parseResult.mode = 'strict';
          console.log('✅ STRICT Mode başarılı:', rows.length, 'parametre bulundu');
          return parseResult;
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo Parametreler tablosu değil');
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
        const rows = parseParametrelerTable(table);
        const score = rows.length;
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: ${score} parametre (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Parametreler tablosu değil`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Parametreler tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} parametre`);
    
    const rows = parseParametrelerTable(bestCandidate.table);
    parseResult.parametreler = rows;
    parseResult.found = true;
    
    if (candidates.length > 1) {
      parseResult.warnings.push(`${candidates.length} aday tablo bulundu, en iyisi seçildi`);
    }
    
    console.log('✅ SCAN Mode başarılı:', rows.length, 'parametre bulundu');
    return parseResult;
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      parametreler: [],
      found: false,
      mode: 'strict',
      errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
      warnings: [],
      matchedLabels: []
    };
  }
}
