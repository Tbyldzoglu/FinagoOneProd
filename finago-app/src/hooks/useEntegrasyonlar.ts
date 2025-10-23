import { useState, useCallback } from 'react';
import { 
  parseEntegrasyonlarFromDocx, 
  EntegrasyonItem,
  EntegrasyonlarParseResult 
} from '../utils/parseEntegrasyonlarFromDocx';

// Hook'un döndürdüğü interface
interface UseEntegrasyonlarReturn {
  entegrasyonlar: EntegrasyonItem[];
  isLoading: boolean;
  isProcessed: boolean;
  validation: EntegrasyonlarParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateTableCell: (index: number, field: keyof EntegrasyonItem, value: string) => void;
  addRowToTable: () => void;
  removeRowFromTable: (index: number) => void;
}

// Initial form data
const getInitialEntegrasyonlar = (): EntegrasyonItem[] => ([
  { id: 1, entegrasyonAdi: '', amac: '', sorumluSistemler: '' }
]);

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToEntegrasyonlar(
  parsedFields: EntegrasyonlarParseResult
): EntegrasyonItem[] {
  if (!parsedFields.found || parsedFields.entegrasyonlar.length === 0) {
    return getInitialEntegrasyonlar();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newEntegrasyonlar: EntegrasyonItem[] = [];

  // Parse edilen satırları ekle
  parsedFields.entegrasyonlar.forEach((parsedItem, index) => {
    const newItem: EntegrasyonItem = {
      id: index + 1,
      entegrasyonAdi: parsedItem.entegrasyonAdi || '',
      amac: parsedItem.amac || '',
      sorumluSistemler: parsedItem.sorumluSistemler || ''
    };
    
    newEntegrasyonlar.push(newItem);
  });

  // Eğer hiç satır yoksa, en az bir boş satır ekle
  if (newEntegrasyonlar.length === 0) {
    newEntegrasyonlar.push({
      id: 1,
      entegrasyonAdi: '',
      amac: '',
      sorumluSistemler: ''
    });
  }

  return newEntegrasyonlar;
}

/**
 * Entegrasyonlar DOCX parsing hook'u
 */
export function useEntegrasyonlar(): UseEntegrasyonlarReturn {
  const [entegrasyonlar, setEntegrasyonlar] = useState<EntegrasyonItem[]>(getInitialEntegrasyonlar());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<EntegrasyonlarParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Entegrasyonlar DOCX işleniyor:', file.name);
    console.log('🔄 useEntegrasyonlar processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseEntegrasyonlarFromDocx(file);
      console.log('✅ DOCX Entegrasyonlar Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newEntegrasyonlar = convertParsedFieldsToEntegrasyonlar(result);
        setEntegrasyonlar(newEntegrasyonlar);
        console.log('✅ Entegrasyonlar data güncellendi:', newEntegrasyonlar);
      } else {
        console.log('⚠️ Entegrasyonlar tablosu bulunamadı');
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Dosya işleme hatası:', error);
      setValidation({
        entegrasyonlar: [],
        found: false,
        mode: 'strict',
        errors: ['Dosya işleme hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')],
        warnings: [],
        matchedLabels: []
      });
      setIsProcessed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetForm = useCallback(() => {
    setEntegrasyonlar(getInitialEntegrasyonlar());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateTableCell = useCallback((index: number, field: keyof EntegrasyonItem, value: string) => {
    setEntegrasyonlar(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const addRowToTable = useCallback(() => {
    setEntegrasyonlar(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(item => item.id)) + 1 : 1;
      return [
        ...prev,
        { id: newId, entegrasyonAdi: '', amac: '', sorumluSistemler: '' }
      ];
    });
  }, []);

  const removeRowFromTable = useCallback((index: number) => {
    setEntegrasyonlar(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    entegrasyonlar,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateTableCell,
    addRowToTable,
    removeRowFromTable
  };
}
