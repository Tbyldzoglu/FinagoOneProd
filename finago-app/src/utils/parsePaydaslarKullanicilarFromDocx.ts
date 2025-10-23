/**
 * DOCX'ten Paydaşlar ve Kullanıcılar formunu parse eden utility
 * 
 * Bu utility, DOCX dosyalarından "Paydaşlar ve Kullanıcılar" form verilerini bulur ve parse eder.
 * Form yapısı: Label-Value çiftleri şeklinde form tablosu
 */

import mammoth from 'mammoth';

// Paydaşlar ve Kullanıcılar satırı interface'i
export interface PaydaslarKullanicilarItem {
  id: string;
  data: {
    paydasEkipKullaniciBilgileri: string;
    paydasEkipKullaniciBilgileriAciklama: string;
    uyumFraudEkibiGorusu: string;
    uyumFraudEkibiGorusuAciklama: string;
    hukukEkibiGorusu: string;
    hukukEkibiGorusuAciklama: string;
    teftisIcKontrolGorusu: string;
    teftisIcKontrolGorusuAciklama: string;
    operasyonEkibiGorusu: string;
    operasyonEkibiGorusuAciklama: string;
  };
}

// Parse sonucu interface'i
export interface PaydaslarKullanicilarParseResult {
  formData: PaydaslarKullanicilarItem;
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
    // "/" karakterini boşluk olarak çevir ama sonra "i c" → "ic" düzelt
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    // "i c" şeklinde ayrılan "iç" kelimelerini düzelt
    .replace(/\bi\s+c\b/g, 'ic')
    // "t e f t i s" şeklinde ayrılan kelimeleri düzelt (fazla boşluk varsa)
    .replace(/\bt\s+e\s+f\s+t\s+i\s+s\b/g, 'teftis')
    .trim();
}

// Etiket eşleme sözlüğü (normalized text → field key)
const LABEL_DICTIONARY: { [key: string]: string } = {
  // Paydaş ekip & kullanıcı bilgileri
  'paydas ekip kullanici bilgileri': 'paydasEkipKullaniciBilgileri',
  'paydas ekip ve kullanici bilgileri': 'paydasEkipKullaniciBilgileri',
  'paydas kullanici bilgileri': 'paydasEkipKullaniciBilgileri',
  'paydas bilgileri': 'paydasEkipKullaniciBilgileri',
  'ekip kullanici bilgileri': 'paydasEkipKullaniciBilgileri',
  'kullanici bilgileri': 'paydasEkipKullaniciBilgileri',
  'stakeholder information': 'paydasEkipKullaniciBilgileri',
  'team information': 'paydasEkipKullaniciBilgileri',
  'user information': 'paydasEkipKullaniciBilgileri',

  // Uyum & Fraud ekibi görüşü
  'uyum fraud ekibi gorusu': 'uyumFraudEkibiGorusu',
  'uyum ve fraud ekibi gorusu': 'uyumFraudEkibiGorusu',
  'uyum fraud gorusu': 'uyumFraudEkibiGorusu',
  'uyum ekibi gorusu': 'uyumFraudEkibiGorusu',
  'fraud ekibi gorusu': 'uyumFraudEkibiGorusu',
  'compliance fraud opinion': 'uyumFraudEkibiGorusu',
  'compliance opinion': 'uyumFraudEkibiGorusu',
  'fraud opinion': 'uyumFraudEkibiGorusu',

  // Hukuk ekibi görüşü
  'hukuk ekibi gorusu': 'hukukEkibiGorusu',
  'hukuk gorusu': 'hukukEkibiGorusu',
  'legal ekibi gorusu': 'hukukEkibiGorusu',
  'legal gorusu': 'hukukEkibiGorusu',
  'legal opinion': 'hukukEkibiGorusu',
  'legal team opinion': 'hukukEkibiGorusu',

  // Teftiş & İç kontrol görüşü
  'teftis ic kontrol gorusu': 'teftisIcKontrolGorusu',
  'teftis ve ic kontrol gorusu': 'teftisIcKontrolGorusu',
  'teftis ic kontrol': 'teftisIcKontrolGorusu',
  'teftis gorusu': 'teftisIcKontrolGorusu',
  'ic kontrol gorusu': 'teftisIcKontrolGorusu',
  'teftis ic kontrol birimleri gorusu': 'teftisIcKontrolGorusu',
  'teftis ic kontrol birimleri gorusu alindi mi': 'teftisIcKontrolGorusu',
  'ic kontrol birimleri gorusu': 'teftisIcKontrolGorusu',
  'ic kontrol birimleri': 'teftisIcKontrolGorusu',
  'teftis birimleri gorusu': 'teftisIcKontrolGorusu',
  'teftis birimleri': 'teftisIcKontrolGorusu',
  // "/" işaretli versiyonlar (normalize edilmeden önce)
  'teftis i c kontrol birimleri gorusu alindi mi': 'teftisIcKontrolGorusu',
  'teftis i c kontrol birimleri gorusu': 'teftisIcKontrolGorusu',
  'teftis i c kontrol gorusu': 'teftisIcKontrolGorusu',
  'i c kontrol birimleri gorusu': 'teftisIcKontrolGorusu',
  'i c kontrol birimleri': 'teftisIcKontrolGorusu',
  'audit internal control opinion': 'teftisIcKontrolGorusu',
  'audit opinion': 'teftisIcKontrolGorusu',
  'internal control opinion': 'teftisIcKontrolGorusu',

  // Operasyon ekibi görüşü
  'operasyon ekibi gorusu': 'operasyonEkibiGorusu',
  'operasyon gorusu': 'operasyonEkibiGorusu',
  'operation ekibi gorusu': 'operasyonEkibiGorusu',
  'operation gorusu': 'operasyonEkibiGorusu',
  'operations opinion': 'operasyonEkibiGorusu',
  'operation opinion': 'operasyonEkibiGorusu',
  'ops opinion': 'operasyonEkibiGorusu'
};

// Paydaşlar ve Kullanıcılar için kullanılabilecek etiketler
const PAYDASLAR_KULLANICILAR_LABELS = [
  'paydas', 'paydaş', 'stakeholder', 'kullanici', 'kullanıcı', 'user',
  'ekip', 'team', 'uyum', 'compliance', 'fraud', 'hukuk', 'legal',
  'teftis', 'teftiş', 'audit', 'ic kontrol', 'iç kontrol', 'internal control',
  'birimleri', 'birimler', 'units', 'departments',
  'operasyon', 'operation', 'operations', 'goruş', 'görüş', 'opinion',
  'alindi mi', 'alındı mı', 'obtained'
];

/**
 * 2 hücreli satırı işler (Template B: [label][value])
 */
function processCellPair(labelText: string, valueText: string): { key: string; value: string } | null {
  const normalizedLabel = normalizeText(labelText);
  console.log(`🔍 processCellPair: "${labelText}" → "${normalizedLabel}"`);
  
  // "/" karakteri debug'u
  if (labelText.includes('/')) {
    console.log(`🔧 "/" karakter tespit edildi: "${labelText}"`);
    console.log(`🔧 Normalize sonrası: "${normalizedLabel}"`);
  }
  
  // Etiket sözlüğünde tam eşleşme ara
  const exactMatch = LABEL_DICTIONARY[normalizedLabel];
  if (exactMatch) {
    console.log(`✅ Tam eşleşme bulundu: ${exactMatch}`);
    return { key: exactMatch, value: valueText.trim() };
  }
  
  // Kısmi eşleşme ara
  for (const [dictKey, fieldKey] of Object.entries(LABEL_DICTIONARY)) {
    if (normalizedLabel.includes(dictKey) || dictKey.includes(normalizedLabel)) {
      console.log(`✅ Kısmi eşleşme bulundu: ${fieldKey} (${dictKey}) - Label: "${labelText}"`);
      return { key: fieldKey, value: valueText.trim() };
    }
  }
  
  // Debug: En yakın eşleşmeleri göster
  const closestMatches = Object.keys(LABEL_DICTIONARY).filter(key => {
    const words = normalizedLabel.split(' ');
    const keyWords = key.split(' ');
    return words.some(word => keyWords.some(keyWord => 
      word.includes(keyWord) || keyWord.includes(word)
    ));
  });
  
  if (closestMatches.length > 0) {
    console.log(`🔍 Yakın eşleşmeler: [${closestMatches.join(', ')}] - Label: "${labelText}"`);
  }
  
  console.log(`❌ Eşleşme bulunamadı: "${normalizedLabel}"`);
  return null;
}

/**
 * Tablonun Paydaşlar ve Kullanıcılar tablosu olup olmadığını kontrol eder
 */
function isPaydaslarKullanicilarTable(table: Element): boolean {
  const rows = table.querySelectorAll('tr');
  let paydaslarScore = 0;
  let wrongTableScore = 0;
  
  // Anti-patterns - bu kelimeler varsa yanlış tablo
  const antiPatterns = [
    'mevzuat gereksinimi', 'yeni bir urun', 'muhasebe degisikligi', 
    'dis firma entegrasyonu', 'raporlama etkisi', 'batch is etkisi',
    'uyum fraud senaryolari', 'dijital kanallara etkisi'
  ];
  
  // Paydaşlar patterns
  const paydaslarPatterns = [
    'paydas ekip', 'paydaslar', 'kullanici bilgileri', 
    'uyum fraud ekibi gorusu', 'hukuk ekibi gorusu',
    'teftis ic kontrol', 'teftis birimleri', 'ic kontrol birimleri',
    'operasyon ekibi gorusu'
  ];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td, th');
    
    for (let j = 0; j < cells.length; j++) {
      const cellText = normalizeText(cells[j].textContent || '');
      
      // Anti-pattern kontrolü
      antiPatterns.forEach(pattern => {
        if (cellText.includes(pattern)) {
          wrongTableScore++;
          console.log(`❌ Anti-pattern bulundu: "${pattern}" in "${cells[j].textContent}"`);
        }
      });
      
      // Paydaşlar pattern kontrolü
      paydaslarPatterns.forEach(pattern => {
        if (cellText.includes(pattern)) {
          paydaslarScore++;
          console.log(`✅ Paydaşlar pattern bulundu: "${pattern}" in "${cells[j].textContent}"`);
        }
      });
    }
  }
  
  console.log(`🏆 Tablo skoru: Paydaşlar=${paydaslarScore}, Yanlış=${wrongTableScore}`);
  
  // Eğer anti-pattern varsa ve paydaşlar pattern'i yoksa, yanlış tablo
  if (wrongTableScore > 0 && paydaslarScore === 0) {
    console.log(`❌ Bu tablo Paydaşlar ve Kullanıcılar tablosu değil (anti-pattern: ${wrongTableScore})`);
    return false;
  }
  
  // En az 2 paydaşlar pattern'i olmalı
  if (paydaslarScore >= 2) {
    console.log(`✅ Bu tablo Paydaşlar ve Kullanıcılar tablosu (score: ${paydaslarScore})`);
    return true;
  }
  
  console.log(`⚠️ Belirsiz tablo (Paydaşlar: ${paydaslarScore}, Anti: ${wrongTableScore})`);
  return false;
}

/**
 * Tablodaki verileri çıkarır
 */
function extractDataFromTable(table: Element): PaydaslarKullanicilarItem {
  console.log('🔍 extractDataFromTable başlıyor...');
  
  // Önce tablonun doğru tablo olup olmadığını kontrol et
  if (!isPaydaslarKullanicilarTable(table)) {
    console.log('❌ Bu tablo Paydaşlar ve Kullanıcılar tablosu değil, boş veri döndürülüyor');
    return {
      id: '1',
      data: {
        paydasEkipKullaniciBilgileri: '',
        paydasEkipKullaniciBilgileriAciklama: '',
        uyumFraudEkibiGorusu: '',
        uyumFraudEkibiGorusuAciklama: '',
        hukukEkibiGorusu: '',
        hukukEkibiGorusuAciklama: '',
        teftisIcKontrolGorusu: '',
        teftisIcKontrolGorusuAciklama: '',
        operasyonEkibiGorusu: '',
        operasyonEkibiGorusuAciklama: ''
      }
    };
  }
  
  const rows = table.querySelectorAll('tr');
  const data = {
    paydasEkipKullaniciBilgileri: '',
    paydasEkipKullaniciBilgileriAciklama: '',
    uyumFraudEkibiGorusu: '',
    uyumFraudEkibiGorusuAciklama: '',
    hukukEkibiGorusu: '',
    hukukEkibiGorusuAciklama: '',
    teftisIcKontrolGorusu: '',
    teftisIcKontrolGorusuAciklama: '',
    operasyonEkibiGorusu: '',
    operasyonEkibiGorusuAciklama: ''
  };
  
  const matchedLabels: string[] = [];
  const warnings: string[] = [];
  
  console.log(`📊 Toplam satır sayısı: ${rows.length}`);
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td, th');
    
    console.log(`📝 Satır ${i}: ${cells.length} hücre`);
    
    if (cells.length === 3) {
      // Template C: [label][value][açıklama] - Paydaşlar modalının yapısı
      const labelText = cells[0].textContent || '';
      const valueText = cells[1].textContent || '';
      const aciklamaText = cells[2].textContent || '';
      
      console.log(`📝 Satır ${i} - Label: "${labelText}", Value: "${valueText}", Açıklama: "${aciklamaText}"`);
      
      if (labelText.trim()) {
        // Ana değer için
        const result = processCellPair(labelText, valueText);
        if (result) {
          (data as any)[result.key] = result.value;
          matchedLabels.push(result.key);
          console.log(`✅ Ana veri atandı: ${result.key} = "${result.value}"`);
          
          // Açıklama için
          const aciklamaKey = result.key + 'Aciklama';
          if (aciklamaText.trim()) {
            (data as any)[aciklamaKey] = aciklamaText.trim();
            console.log(`✅ Açıklama atandı: ${aciklamaKey} = "${aciklamaText.trim()}"`);
          }
        }
      }
    } else if (cells.length >= 2) {
      // Template B: [label][value]
      const labelText = cells[0].textContent || '';
      const valueText = cells[1].textContent || '';
      
      console.log(`📝 Satır ${i} - Label: "${labelText}", Value: "${valueText}"`);
      
      if (labelText.trim() && valueText.trim()) {
        const result = processCellPair(labelText, valueText);
        if (result) {
          (data as any)[result.key] = result.value;
          matchedLabels.push(result.key);
          console.log(`✅ Veri atandı: ${result.key} = "${result.value}"`);
        }
      }
    } else if (cells.length === 4) {
      // Template A: [label][value][label][value]
      const pairs = [
        { label: cells[0].textContent || '', value: cells[1].textContent || '' },
        { label: cells[2].textContent || '', value: cells[3].textContent || '' }
      ];
      
      console.log(`📝 Satır ${i} - 4 hücre, 2 çift işleniyor`);
      
      pairs.forEach((pair, pairIndex) => {
        if (pair.label.trim() && pair.value.trim()) {
          const result = processCellPair(pair.label, pair.value);
          if (result) {
            (data as any)[result.key] = result.value;
            matchedLabels.push(result.key);
            console.log(`✅ Çift ${pairIndex + 1} - Veri atandı: ${result.key} = "${result.value}"`);
          }
        }
      });
    } else {
      console.log(`⏭️ Satır ${i}: ${cells.length} hücre, desteklenmeyen format`);
    }
  }
  
  return {
    id: '1',
    data
  };
}

/**
 * Paydaşlar ve Kullanıcılar başlığını arar
 */
function findPaydaslarKullanicilarHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, td, th');
  
  const keywords = [
    'paydaslar ve kullanicilar', 'paydaşlar ve kullanıcılar', 'stakeholders and users',
    'paydaslar kullanicilar', 'paydaşlar kullanıcılar', 'stakeholders users',
    'paydas kullanici', 'paydaş kullanıcı', 'stakeholder user',
    'ekip gorusleri', 'ekip görüşleri', 'team opinions',
    'ekip bilgileri', 'team information', 'kullanici bilgileri', 'kullanıcı bilgileri'
  ];
  
  // Anti-keywords - bu kelimeler varsa atla
  const antiKeywords = [
    'mevzuat gereksinimi', 'yeni bir urun', 'muhasebe degisikligi', 
    'dis firma entegrasyonu', 'raporlama etkisi', 'batch is etkisi',
    'talep degerlendirmesi', 'request evaluation', 'evaluation'
  ];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    // Anti-keyword kontrolü
    const hasAntiKeyword = antiKeywords.some(antiKeyword => 
      headerText.includes(antiKeyword)
    );
    
    if (hasAntiKeyword) {
      console.log(`⚠️ Anti-keyword bulundu, atlanıyor: "${header.textContent}"`);
      continue;
    }
    
    for (const keyword of keywords) {
      if (headerText.includes(keyword) || keyword.includes(headerText)) {
        console.log(`🎯 Paydaşlar ve Kullanıcılar başlığı bulundu: "${header.textContent}" (${keyword})`);
        return header;
      }
    }
  }
  
  return null;
}

/**
 * Tablo sayısı ve eşleşen etiket sayısını hesaplar (SCAN mode için)
 */
function countMatchingLabels(table: Element): number {
  const rows = table.querySelectorAll('tr');
  let matchCount = 0;
  
  console.log(`🔍 countMatchingLabels - Satır sayısı: ${rows.length}`);
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td, th');
    
    for (let j = 0; j < cells.length; j++) {
      const cellText = normalizeText(cells[j].textContent || '');
      
      // Label dictionary'de eşleşme var mı?
      const hasExactMatch = LABEL_DICTIONARY[cellText];
      const hasPartialMatch = Object.keys(LABEL_DICTIONARY).some(key => 
        cellText.includes(key) || key.includes(cellText)
      );
      
      // Genel etiketlerle eşleşme var mı?
      const hasGeneralMatch = PAYDASLAR_KULLANICILAR_LABELS.some(label =>
        cellText.includes(label) || label.includes(cellText)
      );
      
      if (hasExactMatch || hasPartialMatch || hasGeneralMatch) {
        matchCount++;
        console.log(`🏷️ Eşleşme: "${cells[j].textContent}" → "${cellText}"`);
      }
    }
  }
  
  console.log(`🔢 Toplam eşleşen etiket sayısı: ${matchCount}`);
  return matchCount;
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
export async function parsePaydaslarKullanicilarFromDocx(file: File): Promise<PaydaslarKullanicilarParseResult> {
  console.log('🔍 DOCX Paydaşlar ve Kullanıcılar Parse Başlıyor:', file.name);
  
  try {
    // DOCX'i HTML'e çevir
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = result.value;
    console.log('📄 HTML Dönüştürme Tamamlandı, uzunluk:', html.length);
    
    // HTML'i DOM'a çevir
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const parseResult: PaydaslarKullanicilarParseResult = {
      formData: {
        id: '1',
        data: {
          paydasEkipKullaniciBilgileri: '',
          paydasEkipKullaniciBilgileriAciklama: '',
          uyumFraudEkibiGorusu: '',
          uyumFraudEkibiGorusuAciklama: '',
          hukukEkibiGorusu: '',
          hukukEkibiGorusuAciklama: '',
          teftisIcKontrolGorusu: '',
          teftisIcKontrolGorusuAciklama: '',
          operasyonEkibiGorusu: '',
          operasyonEkibiGorusuAciklama: ''
        }
      },
      found: false,
      mode: 'strict',
      errors: [],
      warnings: [],
      matchedLabels: []
    };

    // STRICT Mode: Başlık ara ve sonrasındaki tabloyu bul
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    const header = findPaydaslarKullanicilarHeader(doc);
    
    if (header) {
      console.log('✅ Başlık bulundu, sonraki tabloyu arıyor...');
      const table = findNextTable(header);
      
      if (table) {
        console.log('✅ Tablo bulundu, doğru tablo olup olmadığı kontrol ediliyor...');
        
        // Önce tablonun doğru tablo olup olmadığını kontrol et
        if (isPaydaslarKullanicilarTable(table)) {
          console.log('✅ Doğru tablo onaylandı, parse ediliyor...');
          const extractedData = extractDataFromTable(table);
          
          // En az bir alan dolu mu kontrol et
          const hasData = Object.values(extractedData.data).some(value => value.trim().length > 0);
          
          if (hasData) {
            parseResult.formData = extractedData;
            parseResult.found = true;
            parseResult.mode = 'strict';
            console.log('✅ STRICT Mode başarılı:', extractedData);
            return parseResult;
          } else {
            console.log('⚠️ Doğru tablo bulundu ama veri yok');
          }
        } else {
          console.log('❌ Bulunan tablo Paydaşlar ve Kullanıcılar tablosu değil, SCAN mode\'a geçiliyor');
        }
      } else {
        console.log('⚠️ Başlık bulundu ama sonraki tablo bulunamadı');
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
      
      // Önce tablo türünü kontrol et
      if (isPaydaslarKullanicilarTable(table)) {
        const score = countMatchingLabels(table);
        candidates.push({ table, score });
        console.log(`📊 Tablo ${i + 1}: Paydaşlar tablosu onaylandı, ${score} etiket eşleşmesi (aday)`);
      } else {
        console.log(`📊 Tablo ${i + 1}: Paydaşlar tablosu değil, atlanıyor`);
      }
    }

    if (candidates.length === 0) {
      parseResult.errors.push('Paydaşlar ve Kullanıcılar tablosu bulunamadı');
      console.log('❌ Hiçbir aday tablo bulunamadı');
      return parseResult;
    }

    // En yüksek skorlu tabloyu seç
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`✅ En iyi aday seçildi: ${bestCandidate.score} etiket eşleşmesi`);
    
    const extractedData = extractDataFromTable(bestCandidate.table);
    
    // En az bir alan dolu mu kontrol et
    const hasData = Object.values(extractedData.data).some(value => value.trim().length > 0);
    
    if (hasData) {
      parseResult.formData = extractedData;
      parseResult.found = true;
      
      if (candidates.length > 1) {
        parseResult.warnings.push(`${candidates.length} aday tablo bulundu, en iyisi seçildi`);
      }
      
      console.log('✅ SCAN Mode başarılı:', extractedData);
    } else {
      parseResult.errors.push('Tabloda veri bulunamadı');
      console.log('❌ Aday tablo bulundu ama veri yok');
    }
    
    return parseResult;
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      formData: {
        id: '1',
        data: {
          paydasEkipKullaniciBilgileri: '',
          paydasEkipKullaniciBilgileriAciklama: '',
          uyumFraudEkibiGorusu: '',
          uyumFraudEkibiGorusuAciklama: '',
          hukukEkibiGorusu: '',
          hukukEkibiGorusuAciklama: '',
          teftisIcKontrolGorusu: '',
          teftisIcKontrolGorusuAciklama: '',
          operasyonEkibiGorusu: '',
          operasyonEkibiGorusuAciklama: ''
        }
      },
      found: false,
      mode: 'strict',
      errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
      warnings: [],
      matchedLabels: []
    };
  }
}
