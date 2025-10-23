import { useState, useCallback } from 'react';
import { 
  parseOnaySureciFromDocx, 
  OnaySureciItem,
  OnaySureciParseResult 
} from '../utils/parseOnaySureciFromDocx';

// Hook'un döndürdüğü interface
interface UseOnaySureciReturn {
  onaySureciRows: OnaySureciItem[];
  isLoading: boolean;
  isProcessed: boolean;
  validation: OnaySureciParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateOnaySureciRow: (rowId: string, field: string, value: string) => void;
  addOnaySureciRow: () => void;
  removeOnaySureciRow: (rowId: string) => void;
}

// Initial form data
const getInitialOnaySureciRows = (): OnaySureciItem[] => ([
  {
    id: '1',
    data: {
      islemTipi: '',
      onaySeviyesi: '',
      onaySureci: '',
      aciklama: ''
    }
  }
]);

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToOnaySureciRows(
  parsedFields: OnaySureciParseResult
): OnaySureciItem[] {
  if (!parsedFields.found || parsedFields.tableRows.length === 0) {
    return getInitialOnaySureciRows();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newOnaySureciRows: OnaySureciItem[] = [];

  // Parse edilen satırları ekle
  parsedFields.tableRows.forEach((parsedItem, index) => {
    const newItem: OnaySureciItem = {
      id: (index + 1).toString(),
      data: {
        islemTipi: parsedItem.data.islemTipi || '',
        onaySeviyesi: parsedItem.data.onaySeviyesi || '',
        onaySureci: parsedItem.data.onaySureci || '',
        aciklama: parsedItem.data.aciklama || ''
      }
    };
    
    newOnaySureciRows.push(newItem);
  });

  // Eğer hiç satır yoksa, varsayılan satırları ekle
  if (newOnaySureciRows.length === 0) {
    return getInitialOnaySureciRows();
  }

  return newOnaySureciRows;
}

/**
 * Onay Süreci DOCX parsing hook'u
 */
export function useOnaySureci(): UseOnaySureciReturn {
  const [onaySureciRows, setOnaySureciRows] = useState<OnaySureciItem[]>(getInitialOnaySureciRows());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<OnaySureciParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Onay Süreci DOCX işleniyor:', file.name);
    console.log('🔄 useOnaySureci processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseOnaySureciFromDocx(file);
      console.log('✅ DOCX Onay Süreci Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newOnaySureciRows = convertParsedFieldsToOnaySureciRows(result);
        setOnaySureciRows(newOnaySureciRows);
        console.log('✅ Onay Süreci data güncellendi:', newOnaySureciRows);
      } else {
        console.log('⚠️ Onay Süreci tablosu bulunamadı');
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Dosya işleme hatası:', error);
      setValidation({
        tableRows: [],
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
    setOnaySureciRows(getInitialOnaySureciRows());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateOnaySureciRow = useCallback((rowId: string, field: string, value: string) => {
    setOnaySureciRows(prev => 
      prev.map(row => 
        row.id === rowId 
          ? { ...row, data: { ...row.data, [field]: value } }
          : row
      )
    );
  }, []);

  const addOnaySureciRow = useCallback(() => {
    setOnaySureciRows(prev => {
      const newId = (Math.max(...prev.map(row => parseInt(row.id))) + 1).toString();
      const newRow: OnaySureciItem = {
        id: newId,
        data: {
          islemTipi: '',
          onaySeviyesi: '',
          onaySureci: '',
          aciklama: ''
        }
      };
      return [...prev, newRow];
    });
  }, []);

  const removeOnaySureciRow = useCallback((rowId: string) => {
    setOnaySureciRows(prev => {
      if (prev.length > 1) {
        return prev.filter(row => row.id !== rowId);
      }
      return prev;
    });
  }, []);

  return {
    onaySureciRows,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateOnaySureciRow,
    addOnaySureciRow,
    removeOnaySureciRow
  };
}
