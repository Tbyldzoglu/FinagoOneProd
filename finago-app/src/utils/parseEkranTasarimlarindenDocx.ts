/**
 * DOCX dosyasından Ekran Tasarımları verilerini parse eden utility
 * 
 * Amaç: DOCX içindeki 4 farklı tabloyu bulup modal form'unu otomatik doldurmak
 * - Tablo 1: Ekran Bilgileri (yatay format)
 * - Tablo 2: Alan Detayları (dikey format)  
 * - Tablo 3: Hesaplama Kuralları (yatay format)
 * - Tablo 4: Buton Tasarımları (dikey format)
 */

import mammoth from 'mammoth';

// Tablo 1: Ekran Bilgileri (4 satır, yatay)
export interface EkranBilgisiRow {
  label: string;
  value: string;
}

// Tablo 2: Alan Detayları (dikey, çok sütunlu)
export interface AlanDetayRow {
  id: number;
  alanAdi: string;
  tip: string;
  uzunluk: string;
  zorunlu: string;
  varsayilan: string;
  degistirilebilir: string;
  isKurallari: string;
}

// Tablo 3: Hesaplama Kuralları (yatay, tek satır başlık + veriler)
export interface HesaplamaKuraliRow {
  alanAdi: string;
  hesaplamaKuraliAciklama: string;
}

// Tablo 4: Buton Tasarımları (dikey, çok satır)
export interface ButonTasarimRow {
  butonAdi: string;
  aciklama: string;
  aktiflik: string;
  gorunurluk: string;
}

// Tüm parse edilen veriler
export interface EkranTasarimFields {
  ekranBilgileri: EkranBilgisiRow[];
  alanDetaylari: AlanDetayRow[];
  hesaplamaKurallari: HesaplamaKuraliRow[];
  butonTasarimlari: ButonTasarimRow[];
}

// Parse sonucu
export interface EkranTasarimParseResult {
  fields: EkranTasarimFields;
  validation: {
    found: boolean;
    mode: 'strict' | 'scan';
    errors: string[];
    warnings: string[];
    matchedLabels: string[];
    foundTables: {
      ekranBilgileri: boolean;
      alanDetaylari: boolean;
      hesaplamaKurallari: boolean;
      butonTasarimlari: boolean;
    };
  };
}

/**
 * Türkçe karakterleri normalize eder ve arama için hazırlar
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

/**
 * Tablo tipini belirlemek için etiket sözlükleri
 */
const EKRAN_BILGILERI_LABELS = [
  'ekran adi', 'ekran kodu', 'ekran adi kodu', 'amac', 'kullanici rolu', 
  'kullanici yetki', 'navigasyon', 'menu yolu', 'screen name', 'screen code'
];

const ALAN_DETAYLARI_LABELS = [
  'alan adi', 'tipi', 'tip', 'uzunluk', 'format', 'zorunlu', 'opsiyonel',
  'varsayilan deger', 'degistirilebilir', 'degistirilemez', 'is kurallari',
  'aciklama', 'field name', 'type', 'length', 'required', 'optional',
  'text', 'dropdown', 'date', 'checkbox', 'input', 'select', 'textarea',
  'mandatory', 'required field', 'field type', 'data type', 'column',
  'field', 'property', 'attribute', 'parameter', 'variable'
];

const HESAPLAMA_KURALLARI_LABELS = [
  'hesaplama kurali', 'hesaplama', 'kural', 'toplam tutar', 'kur degeri',
  'islem no', 'calculation rule', 'calculation', 'total amount'
];

const BUTON_TASARIMLARI_LABELS = [
  'buton adi', 'buton', 'aktiflik', 'gorunurluk', 'kaydet', 'guncelle',
  'sil', 'diyit', 'divit', 'temizle', 'bilgi getir', 'kapat', 'button name', 'button'
];

/**
 * Tablonun tipini belirler
 */
function determineTableType(table: Element): 'ekranBilgileri' | 'alanDetaylari' | 'hesaplamaKurallari' | 'butonTasarimlari' | null {
  const allCells = Array.from(table.querySelectorAll('td, th'));
  const cellTexts = allCells.map(cell => normalizeText(cell.textContent || ''));
  
  console.log(`🔍 Tablo hücre içerikleri: [${cellTexts.slice(0, 10).join(' | ')}${cellTexts.length > 10 ? '...' : ''}]`);
  
  // Her tablo tipi için eşleşme sayısını hesapla
  const ekranBilgileriScore = EKRAN_BILGILERI_LABELS.reduce((score, label) => 
    score + (cellTexts.some(text => text.includes(label) || label.includes(text)) ? 1 : 0), 0
  );
  
  const alanDetaylariScore = ALAN_DETAYLARI_LABELS.reduce((score, label) => {
    const matches = cellTexts.filter(text => text.includes(label) || label.includes(text));
    if (matches.length > 0) {
      console.log(`🔍 Alan Detayları eşleşme: "${label}" → [${matches.join(', ')}]`);
    }
    return score + (matches.length > 0 ? 1 : 0);
  }, 0);
  
  const hesaplamaKurallariScore = HESAPLAMA_KURALLARI_LABELS.reduce((score, label) => 
    score + (cellTexts.some(text => text.includes(label) || label.includes(text)) ? 1 : 0), 0
  );
  
  const butonTasarimlariScore = BUTON_TASARIMLARI_LABELS.reduce((score, label) => 
    score + (cellTexts.some(text => text.includes(label) || label.includes(text)) ? 1 : 0), 0
  );

  console.log(`🔍 Tablo skorları: Ekran=${ekranBilgileriScore}, Alan=${alanDetaylariScore}, Hesaplama=${hesaplamaKurallariScore}, Buton=${butonTasarimlariScore}`);

  // En yüksek skora sahip tablo tipini döndür (minimum 2 eşleşme gerekli)
  const maxScore = Math.max(ekranBilgileriScore, alanDetaylariScore, hesaplamaKurallariScore, butonTasarimlariScore);
  
  if (maxScore < 2) return null;
  
  if (ekranBilgileriScore === maxScore) return 'ekranBilgileri';
  if (alanDetaylariScore === maxScore) return 'alanDetaylari';
  if (hesaplamaKurallariScore === maxScore) return 'hesaplamaKurallari';
  if (butonTasarimlariScore === maxScore) return 'butonTasarimlari';
  
  return null;
}

/**
 * Ekran Bilgileri tablosunu parse eder (yatay format)
 */
function parseEkranBilgileriTable(table: Element): EkranBilgisiRow[] {
  const rows: EkranBilgisiRow[] = [];
  const tableRows = table.querySelectorAll('tr');
  
  console.log(`🔍 Ekran Bilgileri parse: ${tableRows.length} satır`);

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];
    const cells = Array.from(row.querySelectorAll('td, th'));
    
    if (cells.length >= 2) {
      const label = cells[0].textContent?.trim() || '';
      const value = cells[1].textContent?.trim() || '';
      
      if (label) {
        console.log(`🔍 Ekran Bilgisi: "${label}" = "${value}"`);
        rows.push({ label, value });
      }
    }
  }
  
  return rows;
}

/**
 * Alan Detayları tablosunu parse eder (dikey format)
 */
function parseAlanDetaylariTable(table: Element): AlanDetayRow[] {
  const rows: AlanDetayRow[] = [];
  const tableRows = table.querySelectorAll('tr');
  
  console.log(`🔍 Alan Detayları parse: ${tableRows.length} satır`);
  
  if (tableRows.length === 0) return rows;

  // İlk satır başlık olabilir, kontrol et
  let startIndex = 0;
  if (tableRows.length > 1) {
    const firstRowCells = Array.from(tableRows[0].querySelectorAll('td, th'));
    const firstRowText = firstRowCells.map(cell => normalizeText(cell.textContent || '')).join(' ');
    console.log(`🔍 İlk satır metni: "${firstRowText}"`);
    console.log(`🔍 İlk satır hücre sayısı: ${firstRowCells.length}`);
    
    if (firstRowText.includes('alan adi') || firstRowText.includes('tip') || firstRowText.includes('uzunluk')) {
      console.log('✅ Başlık satırı tespit edildi, atlanıyor');
      startIndex = 1; // Başlık satırını atla
    } else {
      console.log('❌ Başlık satırı tespit edilmedi, tüm satırlar işlenecek');
    }
  }

  for (let i = startIndex; i < tableRows.length; i++) {
    const row = tableRows[i];
    const cells = Array.from(row.querySelectorAll('td, th'));
    
    console.log(`🔍 Satır ${i}: ${cells.length} hücre`);
    const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
    console.log(`🔍 Satır ${i} içeriği: [${cellTexts.join(' | ')}]`);
    
    // Hücre sayısını esnetip minimum 3 sütun yeterli olsun
    if (cells.length >= 3) {
      // İlk hücre boşsa (sıra numarası olabilir), bir sonrakinden başla
      let offset = 0;
      if (cells[0]?.textContent?.trim() === '' && cells.length > 7) {
        offset = 1; // İlk hücreyi atla
        console.log('🔍 İlk hücre boş, offset=1 uygulandı');
      }
      
      const alanDetay: AlanDetayRow = {
        id: i - startIndex + 1,
        alanAdi: cells[0 + offset]?.textContent?.trim() || '',
        tip: cells[1 + offset]?.textContent?.trim() || '',
        uzunluk: cells[2 + offset]?.textContent?.trim() || '',
        zorunlu: cells[3 + offset]?.textContent?.trim() || '',
        varsayilan: cells[4 + offset]?.textContent?.trim() || '',
        degistirilebilir: cells[5 + offset]?.textContent?.trim() || '',
        isKurallari: cells[6 + offset]?.textContent?.trim() || ''
      };
      
      console.log(`🔍 Oluşturulan alan detayı:`, alanDetay);
      
      // En az alan adı dolu ise ekle
      if (alanDetay.alanAdi) {
        console.log(`✅ Alan Detayı eklendi: "${alanDetay.alanAdi}" - ${alanDetay.tip}`);
        rows.push(alanDetay);
      } else {
        console.log(`❌ Alan adı boş, satır eklenmedi`);
      }
    } else {
      console.log(`❌ Yetersiz hücre sayısı (${cells.length}), en az 3 gerekli`);
    }
  }
  
  return rows;
}

/**
 * Hesaplama Kuralları tablosunu parse eder (yatay format)
 */
function parseHesaplamaKurallariTable(table: Element): HesaplamaKuraliRow[] {
  const rows: HesaplamaKuraliRow[] = [];
  const tableRows = table.querySelectorAll('tr');
  
  console.log(`🔍 Hesaplama Kuralları parse: ${tableRows.length} satır`);

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];
    const cells = Array.from(row.querySelectorAll('td, th'));
    
    console.log(`🔍 Hesaplama Satır ${i}: ${cells.length} hücre`);
    const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
    console.log(`🔍 Hesaplama Satır ${i} içeriği: [${cellTexts.join(' | ')}]`);
    
    if (cells.length >= 2) {
      // İlk hücre boşsa başlık satırı olabilir, atla
      const firstCellText = cells[0].textContent?.trim() || '';
      const firstCellNormalized = normalizeText(firstCellText);
      
      // Başlık satırını atla
      if (firstCellNormalized.includes('alan adi') || firstCellNormalized.includes('hesaplama')) {
        console.log(`🔍 Hesaplama başlık satırı atlandı: "${firstCellText}"`);
        continue;
      }
      
      const alanAdi = cells[0].textContent?.trim() || '';
      const hesaplamaKuraliAciklama = cells[1].textContent?.trim() || '';
      
      console.log(`🔍 Hesaplama Kuralı deneme: "${alanAdi}" = "${hesaplamaKuraliAciklama}"`);
      
      if (alanAdi) {
        console.log(`✅ Hesaplama Kuralı eklendi: "${alanAdi}" = "${hesaplamaKuraliAciklama}"`);
        rows.push({ alanAdi, hesaplamaKuraliAciklama });
      } else {
        console.log(`❌ Alan adı boş, hesaplama kuralı eklenmedi`);
      }
    }
  }
  
  return rows;
}

/**
 * Buton Tasarımları tablosunu parse eder (dikey format)
 */
function parseButonTasarimlariTable(table: Element): ButonTasarimRow[] {
  const rows: ButonTasarimRow[] = [];
  const tableRows = table.querySelectorAll('tr');
  
  console.log(`🔍 Buton Tasarımları parse: ${tableRows.length} satır`);
  
  if (tableRows.length === 0) return rows;

  // İlk satır başlık olabilir, kontrol et
  let startIndex = 0;
  if (tableRows.length > 1) {
    const firstRowCells = Array.from(tableRows[0].querySelectorAll('td, th'));
    const firstRowText = firstRowCells.map(cell => normalizeText(cell.textContent || '')).join(' ');
    console.log(`🔍 Buton ilk satır metni: "${firstRowText}"`);
    
    if (firstRowText.includes('buton adi') || firstRowText.includes('aciklama') || firstRowText.includes('aktiflik')) {
      console.log('✅ Buton başlık satırı tespit edildi, atlanıyor');
      startIndex = 1; // Başlık satırını atla
    } else {
      console.log('❌ Buton başlık satırı tespit edilmedi, tüm satırlar işlenecek');
    }
  }

  for (let i = startIndex; i < tableRows.length; i++) {
    const row = tableRows[i];
    const cells = Array.from(row.querySelectorAll('td, th'));
    
    console.log(`🔍 Buton Satır ${i}: ${cells.length} hücre`);
    const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
    console.log(`🔍 Buton Satır ${i} içeriği: [${cellTexts.join(' | ')}]`);
    
    if (cells.length >= 4) { // En az 4 sütun bekliyoruz
      const butonTasarim: ButonTasarimRow = {
        butonAdi: cells[0]?.textContent?.trim() || '',
        aciklama: cells[1]?.textContent?.trim() || '',
        aktiflik: cells[2]?.textContent?.trim() || '',
        gorunurluk: cells[3]?.textContent?.trim() || ''
      };
      
      console.log(`🔍 Oluşturulan buton tasarımı:`, butonTasarim);
      
      // En az buton adı dolu ise ekle
      if (butonTasarim.butonAdi) {
        console.log(`✅ Buton Tasarımı eklendi: "${butonTasarim.butonAdi}" - ${butonTasarim.aciklama}`);
        rows.push(butonTasarim);
      } else {
        console.log(`❌ Buton adı boş, satır eklenmedi`);
      }
    } else {
      console.log(`❌ Yetersiz hücre sayısı (${cells.length}), en az 4 gerekli`);
    }
  }
  
  return rows;
}

/**
 * HTML'de "Ekran Tasarımları" başlığını bulur
 */
function findEkranTasarimlariHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const targetTexts = [
    'ekran tasarimlari', 
    'ekran tasarimi',
    'screen design',
    'ui design',
    'tasarim',
    'design',
    'ekranlar',
    'screens'
  ];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    
    const matched = targetTexts.some(target => headerText.includes(target) || target.includes(headerText));
    if (matched) {
      return header;
    }
  }

  return null;
}

/**
 * Ana parsing fonksiyonu
 */
export async function parseEkranTasarimlarindenDocx(file: File): Promise<EkranTasarimParseResult> {
  console.log('🔍 DOCX Ekran Tasarımları Parse Başlıyor:', file.name);
  
  const result: EkranTasarimParseResult = {
    fields: {
      ekranBilgileri: [],
      alanDetaylari: [],
      hesaplamaKurallari: [],
      butonTasarimlari: []
    },
    validation: {
      found: false,
      mode: "scan",
      errors: [],
      warnings: [],
      matchedLabels: [],
      foundTables: {
        ekranBilgileri: false,
        alanDetaylari: false,
        hesaplamaKurallari: false,
        butonTasarimlari: false
      }
    }
  };

  try {
    // 1. DOCX → HTML
    const arrayBuffer = await file.arrayBuffer();
    const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
    const htmlString = mammothResult.value;

    // 2. HTML'i DOM'a parse et
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // 3. Tüm tabloları tara ve tiplerini belirle
    const allTables = doc.querySelectorAll('table');
    console.log('📊 Toplam tablo sayısı:', allTables.length);

    const foundTables: { [key: string]: Element } = {};

    for (let i = 0; i < allTables.length; i++) {
      const table = allTables[i];
      const tableType = determineTableType(table);
      
      if (tableType && !foundTables[tableType]) {
        console.log(`✅ ${tableType} tablosu bulundu (Tablo ${i + 1})`);
        foundTables[tableType] = table;
        result.validation.foundTables[tableType] = true;
      }
    }

    // 4. Bulunan tabloları parse et
    if (foundTables.ekranBilgileri) {
      result.fields.ekranBilgileri = parseEkranBilgileriTable(foundTables.ekranBilgileri);
      result.validation.matchedLabels.push('ekranBilgileri');
    }

    if (foundTables.alanDetaylari) {
      result.fields.alanDetaylari = parseAlanDetaylariTable(foundTables.alanDetaylari);
      result.validation.matchedLabels.push('alanDetaylari');
    }

    if (foundTables.hesaplamaKurallari) {
      result.fields.hesaplamaKurallari = parseHesaplamaKurallariTable(foundTables.hesaplamaKurallari);
      result.validation.matchedLabels.push('hesaplamaKurallari');
    }

    if (foundTables.butonTasarimlari) {
      result.fields.butonTasarimlari = parseButonTasarimlariTable(foundTables.butonTasarimlari);
      result.validation.matchedLabels.push('butonTasarimlari');
    }

    // 5. Sonuç değerlendirmesi
    const foundTableCount = Object.values(result.validation.foundTables).filter(Boolean).length;
    result.validation.found = foundTableCount > 0;

    if (foundTableCount === 0) {
      result.validation.errors.push("ekran_tasarimlari_tablosu_bulunamadi");
    } else {
      console.log(`🎉 ${foundTableCount}/4 tablo başarıyla parse edildi`);
    }

  } catch (error) {
    result.validation.errors.push(`dosya_parse_hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }

  return result;
}
