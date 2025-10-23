/**
 * useDocumentHistory Hook
 * 
 * DOCX dosyası seçildiğinde parseDocumentHistoryFromDocx çağırır;
 * dönen rows ile modal table'ını controlled olarak set eder;
 * validation.errors/warnings'ı banner'da gösterir.
 */

import { useState, useCallback } from 'react';
import { 
  parseDocumentHistoryFromDocx, 
  DocumentHistoryRow, 
  DocumentHistoryParseResult,
  DocumentHistoryFields 
} from '../utils/parseDocumentHistoryFromDocx';

export interface UseDocumentHistoryState {
  // Table satırları
  rows: DocumentHistoryRow[];
  
  // Durum yönetimi
  isLoading: boolean;
  isProcessed: boolean;
  
  // Validasyon sonuçları
  validation: DocumentHistoryParseResult['validation'] | null;
  
  // İşlemler
  processFile: (file: File) => Promise<void>;
  resetRows: () => void;
  updateRowData: (rowId: string, field: keyof DocumentHistoryFields, value: string) => void;
  addRow: () => void;
  removeRow: (rowId: string) => void;
}

const initialRow: DocumentHistoryRow = {
  id: '1',
  data: {
    tarih: '',
    versiyon: '',
    degisiklikYapan: '',
    aciklama: ''
  }
};

/**
 * Doküman Tarihçesi yönetimi için React Hook
 */
export function useDocumentHistory(): UseDocumentHistoryState {
  const [rows, setRows] = useState<DocumentHistoryRow[]>([initialRow]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<DocumentHistoryParseResult['validation'] | null>(null);

  /**
   * DOCX dosyasını işler ve table satırlarını doldurur
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setIsProcessed(false);
    setValidation(null);

    try {
      // DOCX'i parse et
      const result = await parseDocumentHistoryFromDocx(file);
      
      // Sonuçları state'e kaydet
      if (result.rows.length > 0) {
        setRows(result.rows); // Sadece gerçek dosya değerleri
      } else {
        // Hiç satır bulunamadıysa boş satır bırak
        setRows([initialRow]);
      }
      
      setValidation(result.validation);
      setIsProcessed(true);

      // Debug için console'a log
      console.log('DOCX Doküman Tarihçesi Parse Sonucu:', {
        found: result.validation.found,
        mode: result.validation.mode,
        matchedLabels: result.validation.matchedLabels,
        rowCount: result.rows.length,
        errors: result.validation.errors,
        warnings: result.validation.warnings
      });

    } catch (error) {
      // Parse hatası durumunda validation'a hata ekle
      setValidation({
        found: false,
        mode: "strict",
        errors: [`dosya_isleme_hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: [],
        matchedLabels: []
      });
      setIsProcessed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Table satırlarını sıfırlar
   */
  const resetRows = useCallback((): void => {
    setRows([initialRow]);
    setValidation(null);
    setIsProcessed(false);
  }, []);

  /**
   * Tek bir satırın tek bir alanını günceller
   */
  const updateRowData = useCallback((rowId: string, field: keyof DocumentHistoryFields, value: string): void => {
    setRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, data: { ...row.data, [field]: value } }
        : row
    ));
  }, []);

  /**
   * Yeni satır ekler
   */
  const addRow = useCallback((): void => {
    const newId = Date.now().toString();
    const newRow: DocumentHistoryRow = {
      id: newId,
      data: {
        tarih: '',
        versiyon: '',
        degisiklikYapan: '',
        aciklama: ''
      }
    };
    setRows(prev => [...prev, newRow]);
  }, []);

  /**
   * Satır siler
   */
  const removeRow = useCallback((rowId: string): void => {
    setRows(prev => prev.length > 1 ? prev.filter(row => row.id !== rowId) : prev);
  }, []);

  return {
    rows,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetRows,
    updateRowData,
    addRow,
    removeRow
  };
}
