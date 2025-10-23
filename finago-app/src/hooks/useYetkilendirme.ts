import { useState, useCallback } from 'react';
import { 
  parseYetkilendirmeFromDocx, 
  YetkilendirmeItem,
  YetkilendirmeParseResult 
} from '../utils/parseYetkilendirmeFromDocx';

// Hook'un döndürdüğü interface
interface UseYetkilendirmeReturn {
  yetkilendirmeRows: YetkilendirmeItem[];
  isLoading: boolean;
  isProcessed: boolean;
  validation: YetkilendirmeParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateYetkilendirmeRow: (rowId: string, field: string, value: string) => void;
  addYetkilendirmeRow: () => void;
  removeYetkilendirmeRow: (rowId: string) => void;
}

// Initial form data
const getInitialYetkilendirmeRows = (): YetkilendirmeItem[] => ([
  {
    id: '1',
    data: {
      rolKullanici: '',
      ekranIslem: '',
      goruntuleme: '',
      ekleme: '',
      guncelleme: '',
      silme: '',
      onaylama: ''
    }
  }
]);

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToYetkilendirmeRows(
  parsedFields: YetkilendirmeParseResult
): YetkilendirmeItem[] {
  if (!parsedFields.found || parsedFields.tableRows.length === 0) {
    return getInitialYetkilendirmeRows();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newYetkilendirmeRows: YetkilendirmeItem[] = [];

  // Parse edilen satırları ekle
  parsedFields.tableRows.forEach((parsedItem, index) => {
    const newItem: YetkilendirmeItem = {
      id: (index + 1).toString(),
      data: {
        rolKullanici: parsedItem.data.rolKullanici || '',
        ekranIslem: parsedItem.data.ekranIslem || '',
        goruntuleme: parsedItem.data.goruntuleme || '',
        ekleme: parsedItem.data.ekleme || '',
        guncelleme: parsedItem.data.guncelleme || '',
        silme: parsedItem.data.silme || '',
        onaylama: parsedItem.data.onaylama || ''
      }
    };
    
    newYetkilendirmeRows.push(newItem);
  });

  // Eğer hiç satır yoksa, varsayılan satırları ekle
  if (newYetkilendirmeRows.length === 0) {
    return getInitialYetkilendirmeRows();
  }

  return newYetkilendirmeRows;
}

/**
 * Yetkilendirme DOCX parsing hook'u
 */
export function useYetkilendirme(): UseYetkilendirmeReturn {
  const [yetkilendirmeRows, setYetkilendirmeRows] = useState<YetkilendirmeItem[]>(getInitialYetkilendirmeRows());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<YetkilendirmeParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Yetkilendirme DOCX işleniyor:', file.name);
    console.log('🔄 useYetkilendirme processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseYetkilendirmeFromDocx(file);
      console.log('✅ DOCX Yetkilendirme Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newYetkilendirmeRows = convertParsedFieldsToYetkilendirmeRows(result);
        setYetkilendirmeRows(newYetkilendirmeRows);
        console.log('✅ Yetkilendirme data güncellendi:', newYetkilendirmeRows);
      } else {
        console.log('⚠️ Yetkilendirme tablosu bulunamadı');
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
    setYetkilendirmeRows(getInitialYetkilendirmeRows());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateYetkilendirmeRow = useCallback((rowId: string, field: string, value: string) => {
    setYetkilendirmeRows(prev => 
      prev.map(row => 
        row.id === rowId 
          ? { ...row, data: { ...row.data, [field]: value } }
          : row
      )
    );
  }, []);

  const addYetkilendirmeRow = useCallback(() => {
    setYetkilendirmeRows(prev => {
      const newId = (Math.max(...prev.map(row => parseInt(row.id))) + 1).toString();
      const newRow: YetkilendirmeItem = {
        id: newId,
        data: {
          rolKullanici: '',
          ekranIslem: '',
          goruntuleme: '',
          ekleme: '',
          guncelleme: '',
          silme: '',
          onaylama: ''
        }
      };
      return [...prev, newRow];
    });
  }, []);

  const removeYetkilendirmeRow = useCallback((rowId: string) => {
    setYetkilendirmeRows(prev => {
      if (prev.length > 1) {
        return prev.filter(row => row.id !== rowId);
      }
      return prev;
    });
  }, []);

  return {
    yetkilendirmeRows,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateYetkilendirmeRow,
    addYetkilendirmeRow,
    removeYetkilendirmeRow
  };
}
