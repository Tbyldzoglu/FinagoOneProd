/**
 * DOCX Doküman Tarihçesi Parser
 * 
 * Kesin kural: Hiçbir mock veri, fallback içerik, uydurma/örnek değer yok.
 * Yalnızca dosyadaki gerçek hücre metinleri kullanılır.
 * Bulunamayan alanlar boş kalır ve hata/uyarı listesinde raporlanır.
 */

import mammoth from 'mammoth';

// Dışa açık API türleri
export type DocumentHistoryFields = {
  tarih: string;
  versiyon: string;
  degisiklikYapan: string;
  aciklama: string;
};

export type DocumentHistoryRow = {
  id: string;
  data: DocumentHistoryFields;
};

export type DocumentHistoryParseResult = {
  rows: DocumentHistoryRow[];
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
 */
const LABEL_DICTIONARY: Record<string, string[]> = {
  tarih: ["tarih", "date", "gun", "zaman", "tarih"],
  versiyon: ["versiyon", "version", "surum", "v", "ver"],
  degisiklikYapan: [
    "degisikligi yapan",
    "degisiklik yapan", 
    "yapan", 
    "yazar", 
    "author", 
    "kisi", 
    "kullanici",
    "degistiren",
    "duzenleyen",
    "hazırlayan",
    "hazirlayan",
    "editör",
    "editor",
    "kim",
    "adi",
    "isim",
    "ad",
    "sorumlu",
    "degisikligi yapan kisi",
    "degisiklik yapan kisi"
  ],
  aciklama: ["aciklama", "description", "detay", "not", "yorum", "desc", "bilgi"]
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
 * Header-based approach: İlk satır başlık, diğer satırlar veri
 */
function extractDataFromTable(table: Element, warnings: string[], matchedLabels: string[]): DocumentHistoryRow[] {
  const rows: DocumentHistoryRow[] = [];
  const tableRows = table.querySelectorAll('tr');
  
  if (tableRows.length === 0) {
    warnings.push("tablo_bos");
    return rows;
  }

  // İlk satırı başlık olarak kabul et ve alan sıralamasını belirle
  const headerRow = tableRows[0];
  const headerCells = Array.from(headerRow.querySelectorAll('td, th'));
  const fieldMapping: (string | null)[] = [];

  headerCells.forEach((cell, index) => {
    const originalText = cell.textContent || '';
    const cellText = normalizeText(originalText);
    const fieldKey = findFieldKeyByLabel(cellText);
    fieldMapping.push(fieldKey);
    
    if (fieldKey) {
      matchedLabels.push(cellText);
    }
  });

  // Veri satırlarını işle (başlık satırından sonra)
  for (let i = 1; i < tableRows.length; i++) {
    const row = tableRows[i];
    const cells = Array.from(row.querySelectorAll('td, th'));
    
    // Boş satırları atla
    const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
    if (cellTexts.every(text => text === '')) {
      continue;
    }

    const rowData: DocumentHistoryFields = {
      tarih: '',
      versiyon: '',
      degisiklikYapan: '',
      aciklama: ''
    };

    // Her hücreyi ilgili alana eşle
    cells.forEach((cell, cellIndex) => {
      if (cellIndex < fieldMapping.length && fieldMapping[cellIndex]) {
        const fieldKey = fieldMapping[cellIndex] as keyof DocumentHistoryFields;
        const cellValue = cell.textContent?.trim().replace(/\s+/g, ' ') || '';
        rowData[fieldKey] = cellValue;
      }
    });

    // En az bir alan dolu ise satırı ekle
    if (Object.values(rowData).some(value => value !== '')) {
      rows.push({
        id: `row-${i}`,
        data: rowData
      });
    }
  }

  return rows;
}

/**
 * HTML'de "Doküman Tarihçesi" başlığını bulur
 */
function findDocumentHistoryHeader(doc: Document): Element | null {
  const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const targetTexts = [
    'dokuman tarihcesi', 
    'document history', 
    'tarihce', 
    'history',
    'dokuman tarihcesi tablosu',
    'tarihce tablosu',
    'versiyonlar',
    'revizyon',
    'revision'
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
 * Tablodaki etiket sayısını hesaplar (≥2 etiket kontrolü için)
 * Header-based: Sadece ilk satırdaki başlıkları kontrol et
 */
function countMatchingLabels(table: Element): number {
  const rows = table.querySelectorAll('tr');
  let labelCount = 0;

  if (rows.length > 0) {
    const firstRow = rows[0];
    const cells = Array.from(firstRow.querySelectorAll('td, th'));
    
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const cellText = normalizeText(cell.textContent || '');
      const fieldKey = findFieldKeyByLabel(cellText);
      if (fieldKey) {
        labelCount++;
      }
    }
  }

  return labelCount;
}

/**
 * Ana parsing fonksiyonu
 */
export async function parseDocumentHistoryFromDocx(file: File): Promise<DocumentHistoryParseResult> {
  const result: DocumentHistoryParseResult = {
    rows: [],
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
    const headerElement = findDocumentHistoryHeader(doc);
    
    if (headerElement) {
      // Başlık bulundu - STRICT mode
      result.validation.mode = "strict";
      
      const nextTable = findNextTable(headerElement);
      if (nextTable) {
        result.validation.found = true;
        result.rows = extractDataFromTable(
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

      // Tüm tablolarda ≥2 etiket aranır (Doküman tarihçesi için daha az etiket yeterli)
      for (let i = 0; i < allTables.length; i++) {
        const table = allTables[i];
        const labelCount = countMatchingLabels(table);
        if (labelCount >= 2) {
          candidateTables.push({ table, labelCount });
        }
      }

      if (candidateTables.length === 1) {
        // Tek aday tablo bulundu
        result.validation.found = true;
        result.rows = extractDataFromTable(
          candidateTables[0].table, 
          result.validation.warnings, 
          result.validation.matchedLabels
        );
      } else if (candidateTables.length === 0) {
        // Hiç aday yok
        result.validation.found = false;
        result.validation.errors.push("dokuman_tarihcesi_tablosu_bulunamadi");
      } else {
        // Birden fazla aday - En çok etiket eşleşeni seç
        candidateTables.sort((a, b) => b.labelCount - a.labelCount);
        const bestTable = candidateTables[0];
        
        result.validation.found = true;
        result.rows = extractDataFromTable(
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
