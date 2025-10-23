import { useState, useCallback } from 'react';
import { 
  parseMesajlarFromDocx, 
  MesajItem,
  MesajlarParseResult 
} from '../utils/parseMesajlarFromDocx';

// Hook'un döndürdüğü interface
interface UseMesajlarReturn {
  mesajlar: MesajItem[];
  isLoading: boolean;
  isProcessed: boolean;
  validation: MesajlarParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateTableCell: (index: number, field: keyof MesajItem, value: string) => void;
  addRowToTable: () => void;
  removeRowFromTable: (index: number) => void;
}

// Initial form data
const getInitialMesajlar = (): MesajItem[] => ([
  { id: 1, mesajTipi: '', case: '', mesajDili: '', mesajMetin: '' }
]);

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToMesajlar(
  parsedFields: MesajlarParseResult
): MesajItem[] {
  if (!parsedFields.found || parsedFields.mesajlar.length === 0) {
    return getInitialMesajlar();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newMesajlar: MesajItem[] = [];

  // Parse edilen satırları ekle
  parsedFields.mesajlar.forEach((parsedItem, index) => {
    const newItem: MesajItem = {
      id: index + 1,
      mesajTipi: parsedItem.mesajTipi || '',
      case: parsedItem.case || '',
      mesajDili: parsedItem.mesajDili || '',
      mesajMetin: parsedItem.mesajMetin || ''
    };
    
    newMesajlar.push(newItem);
  });

  // Eğer hiç satır yoksa, en az bir boş satır ekle
  if (newMesajlar.length === 0) {
    newMesajlar.push({
      id: 1,
      mesajTipi: '',
      case: '',
      mesajDili: '',
      mesajMetin: ''
    });
  }

  return newMesajlar;
}

/**
 * Mesajlar DOCX parsing hook'u
 */
export function useMesajlar(): UseMesajlarReturn {
  const [mesajlar, setMesajlar] = useState<MesajItem[]>(getInitialMesajlar());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<MesajlarParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Mesajlar DOCX işleniyor:', file.name);
    console.log('🔄 useMesajlar processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseMesajlarFromDocx(file);
      console.log('✅ DOCX Mesajlar Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newMesajlar = convertParsedFieldsToMesajlar(result);
        setMesajlar(newMesajlar);
        console.log('✅ Mesajlar data güncellendi:', newMesajlar);
      } else {
        console.log('⚠️ Mesajlar tablosu bulunamadı');
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Dosya işleme hatası:', error);
      setValidation({
        mesajlar: [],
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
    setMesajlar(getInitialMesajlar());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateTableCell = useCallback((index: number, field: keyof MesajItem, value: string) => {
    setMesajlar(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const addRowToTable = useCallback(() => {
    setMesajlar(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(item => item.id)) + 1 : 1;
      return [
        ...prev,
        { id: newId, mesajTipi: '', case: '', mesajDili: '', mesajMetin: '' }
      ];
    });
  }, []);

  const removeRowFromTable = useCallback((index: number) => {
    setMesajlar(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    mesajlar,
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
