/**
 * DOCX dosyasından Talep Değerlendirmesi verilerini parse eden utility
 * 
 * Amaç: DOCX içindeki "Talep Değerlendirmesi" tablosunu bulup form alanlarını otomatik doldurmak
 * Yaklaşım: Etiket-değer eşleştirmesi ile form field'larını populate etme
 */

import mammoth from 'mammoth';

// Talep Değerlendirmesi form field'ları
export interface TalepDegerlendirmesiFields {
  mevcutGereksinimiVar_yanit: string;
  mevcutGereksinimiVar_aciklama: string;
  urunAdi: string;
  yeniBirUrunMu_yanit: string;
  yeniBirUrunMu_aciklama: string;
  muhasabeDeğisikligiVar_yanit: string;
  muhasabeDeğisikligiVar_aciklama: string;
  disFirmaEntegrasyonu_yanit: string;
  disFirmaEntegrasyonu_aciklama: string;
  raporlamaEtkisi_yanit: string;
  raporlamaEtkisi_aciklama: string;
  odemeGgbEtkisi_yanit: string;
  odemeGgbEtkisi_aciklama: string;
  uyumFraudSenaryolari_yanit: string;
  uyumFraudSenaryolari_aciklama: string;
  dijitalKanallardaEtkisi_yanit: string;
  dijitalKanallardaEtkisi_aciklama: string;
  batchIsEtkisi_yanit: string;
  batchIsEtkisi_aciklama: string;
  bildirimOlusturulmali_yanit: string;
  bildirimOlusturulmali_aciklama: string;
  conversionGereksinimiVar_yanit: string;
  conversionGereksinimiVar_aciklama: string;
}

// Parse sonucu
export interface TalepDegerlendirmesiParseResult {
  fields: TalepDegerlendirmesiFields;
  validation: {
    found: boolean;
    mode: 'strict' | 'scan';
    errors: string[];
    warnings: string[];
    matchedLabels: string[];
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
 * Etiket sözlüğü - Normalize edilmiş etiket metinlerini field key'lerine eşler
 */
const LABEL_DICTIONARY: Record<string, keyof TalepDegerlendirmesiFields> = {
  // Mevzuat Gereksinimi
  'mevzuat gereksinimi var mi': 'mevcutGereksinimiVar_yanit',
  'mevzuat gereksinimi': 'mevcutGereksinimiVar_yanit',
  'mevzuat gereksinimi aciklama': 'mevcutGereksinimiVar_aciklama',
  'mevzuat gereksinimi aciklamasi': 'mevcutGereksinimiVar_aciklama',

  // Ürün Adı
  'urun adi': 'urunAdi',
  'urun': 'urunAdi',
  'urun ismi': 'urunAdi',

  // Yeni Ürün
  'yeni bir urun mu': 'yeniBirUrunMu_yanit',
  'yeni urun': 'yeniBirUrunMu_yanit',
  'yeni urun mu': 'yeniBirUrunMu_yanit',
  'yeni bir urun': 'yeniBirUrunMu_yanit',
  'yeni urun mi': 'yeniBirUrunMu_yanit',
  'yeni bir urun mi': 'yeniBirUrunMu_yanit',
  'yenibirurunmu': 'yeniBirUrunMu_yanit',
  'new product': 'yeniBirUrunMu_yanit',
  'yeni bir urun aciklama': 'yeniBirUrunMu_aciklama',
  'yeni urun aciklama': 'yeniBirUrunMu_aciklama',
  'yeni bir urun aciklamasi': 'yeniBirUrunMu_aciklama',
  'yeni urun aciklamasi': 'yeniBirUrunMu_aciklama',

  // Muhasebe Değişikliği
  'muhasebe degisikligi var mi': 'muhasabeDeğisikligiVar_yanit',
  'muhasebe degisikligi': 'muhasabeDeğisikligiVar_yanit',
  'muhasebe degisikligi aciklama': 'muhasabeDeğisikligiVar_aciklama',
  'muhasebe degisikligi aciklamasi': 'muhasabeDeğisikligiVar_aciklama',

  // Dış Firma Entegrasyonu
  'dis firma entegrasyonu gerekiyor mu': 'disFirmaEntegrasyonu_yanit',
  'dis firma entegrasyonu': 'disFirmaEntegrasyonu_yanit',
  'entegrasyon': 'disFirmaEntegrasyonu_yanit',
  'dis firma entegrasyonu aciklama': 'disFirmaEntegrasyonu_aciklama',
  'entegrasyon aciklama': 'disFirmaEntegrasyonu_aciklama',

  // Raporlama Etkisi
  'raporlama etkisi var mi': 'raporlamaEtkisi_yanit',
  'raporlama etkisi': 'raporlamaEtkisi_yanit',
  'raporlama': 'raporlamaEtkisi_yanit',
  'raporlama etkisi aciklama': 'raporlamaEtkisi_aciklama',
  'raporlama aciklama': 'raporlamaEtkisi_aciklama',

  // Ödeme/GGB Etkisi
  'odeme ggb etkisi var mi': 'odemeGgbEtkisi_yanit',
  'odeme ggb etkisi': 'odemeGgbEtkisi_yanit',
  'a odeme ggb etkisi var mi': 'odemeGgbEtkisi_yanit',
  'ggb etkisi': 'odemeGgbEtkisi_yanit',
  'odeme etkisi': 'odemeGgbEtkisi_yanit',
  'odeme ggb etkisi aciklama': 'odemeGgbEtkisi_aciklama',
  'ggb aciklama': 'odemeGgbEtkisi_aciklama',

  // Uyum & Fraud Senaryoları
  'uyum fraud senaryolari var mi': 'uyumFraudSenaryolari_yanit',
  'uyum fraud senaryolari': 'uyumFraudSenaryolari_yanit',
  'fraud senaryolari': 'uyumFraudSenaryolari_yanit',
  'uyum senaryolari': 'uyumFraudSenaryolari_yanit',
  'uyum fraud senaryolari aciklama': 'uyumFraudSenaryolari_aciklama',
  'fraud aciklama': 'uyumFraudSenaryolari_aciklama',

  // Dijital Kanallar Etkisi
  'dijital kanallara etkisi var mi': 'dijitalKanallardaEtkisi_yanit',
  'dijital kanallara etkisi': 'dijitalKanallardaEtkisi_yanit',
  'dijital kanal etkisi': 'dijitalKanallardaEtkisi_yanit',
  'dijital etkisi': 'dijitalKanallardaEtkisi_yanit',
  'dijital kanallara etkisi aciklama': 'dijitalKanallardaEtkisi_aciklama',
  'dijital kanal aciklama': 'dijitalKanallardaEtkisi_aciklama',

  // Batch İş Etkisi
  'batch is etkisi olacak mi': 'batchIsEtkisi_yanit',
  'batch is etkisi': 'batchIsEtkisi_yanit',
  'batch etkisi': 'batchIsEtkisi_yanit',
  'batch is': 'batchIsEtkisi_yanit',
  'batch is etkisi aciklama': 'batchIsEtkisi_aciklama',
  'batch aciklama': 'batchIsEtkisi_aciklama',

  // Bildirim
  'bildirim olusturulmali mi': 'bildirimOlusturulmali_yanit',
  'bildirim olusturulmali': 'bildirimOlusturulmali_yanit',
  'bildirim': 'bildirimOlusturulmali_yanit',
  'sms mail push': 'bildirimOlusturulmali_yanit',
  'bildirim olusturulmali aciklama': 'bildirimOlusturulmali_aciklama',
  'bildirim aciklama': 'bildirimOlusturulmali_aciklama',

  // Conversion Gereksinimi
  'conversion gereksinimi var mi': 'conversionGereksinimiVar_yanit',
  'conversion gereksinimi': 'conversionGereksinimiVar_yanit',
  'conversion': 'conversionGereksinimiVar_yanit',
  'conversion gereksinimi aciklama': 'conversionGereksinimiVar_aciklama',
  'conversion aciklama': 'conversionGereksinimiVar_aciklama'
};

/**
 * Normalize edilmiş etiket metnine göre field key bulur
 */
function findFieldKeyByLabel(normalizedText: string): keyof TalepDegerlendirmesiFields | null {
  // Direkt eşleşme
  if (LABEL_DICTIONARY[normalizedText]) {
    return LABEL_DICTIONARY[normalizedText];
  }

  // Kısmi eşleşme (etiket içinde anahtar kelime geçiyor mu?)
  for (const [labelKey, fieldKey] of Object.entries(LABEL_DICTIONARY)) {
    if (normalizedText.includes(labelKey) || labelKey.includes(normalizedText)) {
      return fieldKey;
    }
  }

  return null;
}

/**
 * Etiket-değer çiftini işler ve alana yazar
 */
function processCellPair(
  labelText: string, 
  valueText: string, 
  fields: TalepDegerlendirmesiFields, 
  warnings: string[], 
  matchedLabels: string[], 
  processedFields: Set<string>
): void {
  const normalizedLabel = normalizeText(labelText);
  const fieldKey = findFieldKeyByLabel(normalizedLabel);
  
  console.log(`🔍 processCellPair: "${labelText}" → "${normalizedLabel}" → ${fieldKey || 'EŞLEŞMEDI'} = "${valueText}"`);

  if (fieldKey) {
    matchedLabels.push(normalizedLabel);

    // Duplikasyon kontrolü
    if (processedFields.has(fieldKey)) {
      warnings.push(`duplikasyon: ${fieldKey}`);
      return; // İlk dolu değer kalır
    }

    // Değer boşsa uyarı ver ama yine de işle
    if (valueText === '') {
      warnings.push(`bos_deger: ${fieldKey}`);
    }

    // Değeri alana yaz (boşsa boş string kalır)
    (fields as any)[fieldKey] = valueText;
    processedFields.add(fieldKey);
  }
}

/**
 * HTML table elementinden veri çıkarır
 */
function extractDataFromTable(table: Element, warnings: string[], matchedLabels: string[]): TalepDegerlendirmesiFields {
  console.log('🔍 extractDataFromTable başlıyor...');
  const fields: TalepDegerlendirmesiFields = {
    mevcutGereksinimiVar_yanit: '',
    mevcutGereksinimiVar_aciklama: '',
    urunAdi: '',
    yeniBirUrunMu_yanit: '',
    yeniBirUrunMu_aciklama: '',
    muhasabeDeğisikligiVar_yanit: '',
    muhasabeDeğisikligiVar_aciklama: '',
    disFirmaEntegrasyonu_yanit: '',
    disFirmaEntegrasyonu_aciklama: '',
    raporlamaEtkisi_yanit: '',
    raporlamaEtkisi_aciklama: '',
    odemeGgbEtkisi_yanit: '',
    odemeGgbEtkisi_aciklama: '',
    uyumFraudSenaryolari_yanit: '',
    uyumFraudSenaryolari_aciklama: '',
    dijitalKanallardaEtkisi_yanit: '',
    dijitalKanallardaEtkisi_aciklama: '',
    batchIsEtkisi_yanit: '',
    batchIsEtkisi_aciklama: '',
    bildirimOlusturulmali_yanit: '',
    bildirimOlusturulmali_aciklama: '',
    conversionGereksinimiVar_yanit: '',
    conversionGereksinimiVar_aciklama: ''
  };

  const tableRows = table.querySelectorAll('tr');
  const processedFields = new Set<string>(); // Duplikasyon kontrolü için

  for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
    const row = tableRows[rowIndex];
    const cells = Array.from(row.querySelectorAll('td, th'));
    const cellTexts = cells.map(cell => {
      // textContent ile hücre metnini al, trim + tek boşluk normalize et
      return cell.textContent?.trim().replace(/\s+/g, ' ') || '';
    });

    // Boş satırları atla
    if (cellTexts.every(text => text === '')) {
      continue;
    }

    // Şablon kontrolü
    if (cellTexts.length === 4) {
      // Şablon A: 4 hücre [etiket][değer][etiket][değer] 
      processCellPair(cellTexts[0], cellTexts[1], fields, warnings, matchedLabels, processedFields);
      processCellPair(cellTexts[2], cellTexts[3], fields, warnings, matchedLabels, processedFields);
    } else if (cellTexts.length === 3) {
      // Şablon B: 3 hücre [soru][yanıt][açıklama] - Talep Değerlendirmesi formatı
      const soruText = cellTexts[0];
      const yanitText = cellTexts[1];
      const aciklamaText = cellTexts[2];

      console.log(`🔍 3-hücre satır: Soru="${soruText}" Yanıt="${yanitText}" Açıklama="${aciklamaText}"`);

      // Soru için yanıt field'ını bul - önce direkt soru metnini dene
      let yanitFieldKey = findFieldKeyByLabel(normalizeText(soruText));
      if (!yanitFieldKey || !yanitFieldKey.endsWith('_yanit')) {
        // Eğer direkt eşleşmezse " yanit" ekleyerek dene
        yanitFieldKey = findFieldKeyByLabel(normalizeText(soruText + ' yanit'));
      }
      
      const aciklamaFieldKey = findFieldKeyByLabel(normalizeText(soruText + ' aciklama'));
      
      console.log(`🔍 Field arama: "${soruText}" → yanıt="${yanitFieldKey || 'EŞLEŞMEDI'}" açıklama="${aciklamaFieldKey || 'EŞLEŞMEDI'}"`);

      if (yanitFieldKey && yanitFieldKey.endsWith('_yanit')) {
        matchedLabels.push(normalizeText(soruText));
        (fields as any)[yanitFieldKey] = yanitText;
        processedFields.add(yanitFieldKey);

        // Açıklama field'ını da doldur
        const baseFieldName = yanitFieldKey.replace('_yanit', '');
        const aciklamaKey = `${baseFieldName}_aciklama` as keyof TalepDegerlendirmesiFields;
        if (fields.hasOwnProperty(aciklamaKey)) {
          (fields as any)[aciklamaKey] = aciklamaText;
          processedFields.add(aciklamaKey);
        }
      }
    } else if (cellTexts.length === 2) {
      // Şablon C: 2 hücre [etiket][değer]
      processCellPair(cellTexts[0], cellTexts[1], fields, warnings, matchedLabels, processedFields);
    } else if (cellTexts.length > 0) {
      // Beklenmeyen satır yapısı
      warnings.push(`beklenmeyen_satir_yapisi: Satır ${rowIndex + 1} - ${cellTexts.length} hücre`);
    }
  }

  return fields;
}

/**
 * HTML'de "Talep Değerlendirmesi" başlığını bulur
 */
function findTalepDegerlendirmesiHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const targetTexts = [
    'talep degerlendirmesi', 
    'degerlendirme', 
    'talep degerlendirme',
    'degerlendirme tablosu',
    'talep analizi',
    'talep incelemesi',
    'evaluation',
    'assessment'
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
 * Başlık elementinden sonra gelen ilk table'ı bulur
 */
function findNextTable(headerElement: Element): Element | null {
  let currentElement: Element | null = headerElement;
  
  while (currentElement) {
    currentElement = currentElement.nextElementSibling;
    if (currentElement && currentElement.tagName.toLowerCase() === 'table') {
      return currentElement;
    }
  }

  return null;
}

/**
 * Tablodaki etiket sayısını hesaplar (≥3 etiket kontrolü için)
 */
function countMatchingLabels(table: Element): number {
  const rows = table.querySelectorAll('tr');
  let labelCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = Array.from(row.querySelectorAll('td, th'));
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const cellText = normalizeText(cell.textContent || '');
      if (findFieldKeyByLabel(cellText)) {
        labelCount++;
      }
    }
  }

  return labelCount;
}

/**
 * Ana parsing fonksiyonu
 */
export async function parseTalepDegerlendirmesiFromDocx(file: File): Promise<TalepDegerlendirmesiParseResult> {
  console.log('🔍 DOCX Talep Değerlendirmesi Parse Başlıyor:', file.name);
  const result: TalepDegerlendirmesiParseResult = {
    fields: {
      mevcutGereksinimiVar_yanit: '',
      mevcutGereksinimiVar_aciklama: '',
      urunAdi: '',
      yeniBirUrunMu_yanit: '',
      yeniBirUrunMu_aciklama: '',
      muhasabeDeğisikligiVar_yanit: '',
      muhasabeDeğisikligiVar_aciklama: '',
      disFirmaEntegrasyonu_yanit: '',
      disFirmaEntegrasyonu_aciklama: '',
      raporlamaEtkisi_yanit: '',
      raporlamaEtkisi_aciklama: '',
      odemeGgbEtkisi_yanit: '',
      odemeGgbEtkisi_aciklama: '',
      uyumFraudSenaryolari_yanit: '',
      uyumFraudSenaryolari_aciklama: '',
      dijitalKanallardaEtkisi_yanit: '',
      dijitalKanallardaEtkisi_aciklama: '',
      batchIsEtkisi_yanit: '',
      batchIsEtkisi_aciklama: '',
      bildirimOlusturulmali_yanit: '',
      bildirimOlusturulmali_aciklama: '',
      conversionGereksinimiVar_yanit: '',
      conversionGereksinimiVar_aciklama: ''
    },
    validation: {
      found: false,
      mode: "strict",
      errors: [],
      warnings: [],
      matchedLabels: []
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

    // 3. Başlık hedefleme (STRICT)
    const headerElement = findTalepDegerlendirmesiHeader(doc);
    
    if (headerElement) {
      // Başlık bulundu - STRICT mode
      result.validation.mode = "strict";
      
      const nextTable = findNextTable(headerElement);
      if (nextTable) {
        result.validation.found = true;
        result.fields = extractDataFromTable(
          nextTable, 
          result.validation.warnings, 
          result.validation.matchedLabels
        );
      } else {
        result.validation.errors.push("baslik_bulundu_ama_tablo_yok");
      }
    } else {
      // Başlık bulunamadı - SCAN mode
      result.validation.mode = "scan";
      
      const allTables = doc.querySelectorAll('table');
      const candidateTables: { table: Element; labelCount: number }[] = [];

      // Tüm tablolarda ≥3 etiket aranır (Talep Değerlendirmesi için daha yüksek eşik)
      for (let i = 0; i < allTables.length; i++) {
        const table = allTables[i];
        const labelCount = countMatchingLabels(table);
        if (labelCount >= 3) {
          candidateTables.push({ table, labelCount });
        }
      }

      if (candidateTables.length === 1) {
        // Tek aday tablo bulundu
        result.validation.found = true;
        result.fields = extractDataFromTable(
          candidateTables[0].table, 
          result.validation.warnings, 
          result.validation.matchedLabels
        );
      } else if (candidateTables.length === 0) {
        // Hiç aday yok
        result.validation.found = false;
        result.validation.errors.push("talep_degerlendirmesi_tablosu_bulunamadi");
      } else {
        // Birden fazla aday - En çok etiket eşleşeni seç
        candidateTables.sort((a, b) => b.labelCount - a.labelCount);
        const bestTable = candidateTables[0];
        
        result.validation.found = true;
        result.fields = extractDataFromTable(
          bestTable.table, 
          result.validation.warnings, 
          result.validation.matchedLabels
        );
      }
    }

  } catch (error) {
    result.validation.errors.push(`dosya_parse_hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }

  return result;
}
