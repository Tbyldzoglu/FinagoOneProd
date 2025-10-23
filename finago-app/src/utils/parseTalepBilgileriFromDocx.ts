/**
 * DOCX Talep Bilgileri Parser
 * 
 * Kesin kural: Hiçbir mock veri, fallback içerik, uydurma/örnek değer yok.
 * Yalnızca dosyadaki gerçek hücre metinleri kullanılır.
 * Bulunamayan alanlar boş kalır ve hata/uyarı listesinde raporlanır.
 */

import mammoth from 'mammoth';

// Dışa açık API türleri
export type TalepFields = {
  talep_no: string;
  talep_adi: string;
  talep_sahibi_is_birimi: string;
  talep_sahibi_kurum: string;
  talep_yoneticisi: string;
  teknik_ekipler: string;
};

export type ParseResult = {
  fields: TalepFields;
  validation: {
    found: boolean;                 // hedef tablo bulundu mu
    mode: "strict" | "scan";        // başlık altında bulunduysa "strict"; başlık bulunamadıysa tüm tablolar tarandıysa "scan"
    errors: string[];               // kırmızı (ör. tablo bulunamadı, yapı beklenmiyor)
    warnings: string[];             // sarı (ör. etiket varyasyonu, boş değer)
    matchedLabels: string[];        // tespit edilen etiket adlarının normalize listesi
  };
};

/**
 * Türkçe karakterleri normalize eder ve temizler
 * "çğıöşü → c g i o s u"; küçük harfe çevir; \s+ → tek boşluk; noktalama kaldır
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Etiket sözlüğü - normalize & birebir eşleşme
 * Yalnızca etiket adları için tolerans, değerler için uydurma yok
 */
const LABEL_DICTIONARY: Record<string, string[]> = {
  talep_no: ["talep no", "talep numarasi", "talep #", "talep id"],
  talep_adi: ["talep adi", "talep ismi", "talep basligi"],
  talep_sahibi_is_birimi: ["talep sahibi is birimi", "is birimi", "business unit"],
  talep_sahibi_kurum: ["talep sahibi kurum", "kurum", "sirket", "grup"],
  talep_yoneticisi: ["talep yoneticisi", "sponsor", "is birimi yoneticisi"],
  teknik_ekipler: ["teknik ekipler", "it ekipleri", "gelistirme ekipleri"]
};

/**
 * Normalize edilmiş etiket metnini alan anahtarına çevirir
 */
function findFieldKeyByLabel(normalizedText: string): string | null {
  for (const [fieldKey, labels] of Object.entries(LABEL_DICTIONARY)) {
    if (labels.includes(normalizedText)) {
      return fieldKey;
    }
  }
  return null;
}

/**
 * HTML table elementinden veri çıkarır
 * Şablon A (ilk satır 4 hücre): [etiket][değer][etiket][değer]
 * Şablon B (diğer satırlar 2 hücre): [etiket][değer]
 */
function extractDataFromTable(table: Element, warnings: string[], matchedLabels: string[]): TalepFields {
  const fields: TalepFields = {
    talep_no: '',
    talep_adi: '',
    talep_sahibi_is_birimi: '',
    talep_sahibi_kurum: '',
    talep_yoneticisi: '',
    teknik_ekipler: ''
  };

  const rows = table.querySelectorAll('tr');
  const processedFields = new Set<string>(); // Duplikasyon kontrolü için

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
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
    if (rowIndex === 0 && cellTexts.length === 4) {
      // Şablon A: İlk satır 4 hücre [etiket][değer][etiket][değer]
      processCellPair(cellTexts[0], cellTexts[1], fields, warnings, matchedLabels, processedFields);
      processCellPair(cellTexts[2], cellTexts[3], fields, warnings, matchedLabels, processedFields);
    } else if (cellTexts.length === 2) {
      // Şablon B: 2 hücre [etiket][değer]
      processCellPair(cellTexts[0], cellTexts[1], fields, warnings, matchedLabels, processedFields);
    } else if (cellTexts.length > 0) {
      // Beklenmeyen satır yapısı
      warnings.push(`beklenmeyen_satir_yapisi: Satır ${rowIndex + 1} - ${cellTexts.length} hücre`);
    }
  }

  return fields;
}

/**
 * Etiket-değer çiftini işler ve alana yazar
 */
function processCellPair(
  labelText: string, 
  valueText: string, 
  fields: TalepFields, 
  warnings: string[], 
  matchedLabels: string[], 
  processedFields: Set<string>
): void {
  const normalizedLabel = normalizeText(labelText);
  const fieldKey = findFieldKeyByLabel(normalizedLabel);

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
 * HTML'de "Talep Bilgileri" başlığını bulur
 * Başlık normalize ederek tam/kısmi eşle (küçük harf, Türkçe sadeleştirme, boşluk/noktalama toleransı)
 */
function findTalepBilgileriHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const targetText = normalizeText('Talep Bilgileri');

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerText = normalizeText(header.textContent || '');
    if (headerText.includes(targetText) || targetText.includes(headerText)) {
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
    // Sibling'lerde ara
    currentElement = currentElement.nextElementSibling;
    if (currentElement && currentElement.tagName.toLowerCase() === 'table') {
      return currentElement;
    }
  }

  return null;
}

/**
 * Tablodaki etiket sayısını hesaplar (≥4 etiket kontrolü için)
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
 * DOCX dosyasını parse eder ve Talep Bilgileri tablosunu bulur
 */
export async function parseTalepBilgileriFromDocx(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    fields: {
      talep_no: '',
      talep_adi: '',
      talep_sahibi_is_birimi: '',
      talep_sahibi_kurum: '',
      talep_yoneticisi: '',
      teknik_ekipler: ''
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
    // 1. DOCX → HTML: mammoth.convertToHtml ile HTML string üret
    const arrayBuffer = await file.arrayBuffer();
    const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
    const htmlString = mammothResult.value;

    // 2. HTML'i DOM'a parse et
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // 3. Başlık hedefleme (STRICT): "Talep Bilgileri" başlığını bul
    const headerElement = findTalepBilgileriHeader(doc);
    
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
      const candidateTables: Element[] = [];

      // Tüm tablolarda ≥4 etiket aranır
      for (let i = 0; i < allTables.length; i++) {
        const table = allTables[i];
        const labelCount = countMatchingLabels(table);
        if (labelCount >= 4) {
          candidateTables.push(table);
        }
      }

      if (candidateTables.length === 1) {
        // Tek aday tablo bulundu
        result.validation.found = true;
        result.fields = extractDataFromTable(
          candidateTables[0], 
          result.validation.warnings, 
          result.validation.matchedLabels
        );
      } else if (candidateTables.length === 0) {
        // Hiç aday yok
        result.validation.found = false;
        result.validation.errors.push("talep_bilgileri_tablosu_bulunamadi");
      } else {
        // Birden fazla aday
        result.validation.found = false;
        result.validation.errors.push("birden_fazla_olasi_talep_bilgileri_tablosu");
      }
    }

  } catch (error) {
    result.validation.errors.push(`dosya_parse_hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }

  return result;
}
