import { useState, useCallback } from 'react';
import { 
  parseParametrelerFromDocx, 
  ParametreItem,
  ParametrelerParseResult 
} from '../utils/parseParametrelerFromDocx';

// Hook'un döndürdüğü interface
interface UseParametrelerReturn {
  parametreler: ParametreItem[];
  isLoading: boolean;
  isProcessed: boolean;
  validation: ParametrelerParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateTableCell: (id: string, field: string, value: string) => void;
  addParametre: () => void;
  removeParametre: (id: string) => void;
}

// Initial form data
const getInitialParametreler = (): ParametreItem[] => ([
  {
    id: '1',
    data: {
      parametreAdi: '',
      aciklama: '',
      kapsamKullanimAlani: '',
      varsayilanDeger: '',
      degerAraligi: '',
      parametreYetkisi: ''
    }
  }
]);

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToParametreler(
  parsedFields: ParametrelerParseResult
): ParametreItem[] {
  if (!parsedFields.found || parsedFields.parametreler.length === 0) {
    return getInitialParametreler();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newParametreler: ParametreItem[] = [];

  // Parse edilen parametreleri ekle
  parsedFields.parametreler.forEach((parsedItem, index) => {
    const newItem: ParametreItem = {
      id: (index + 1).toString(),
      data: {
        parametreAdi: parsedItem.data.parametreAdi || '',
        aciklama: parsedItem.data.aciklama || '',
        kapsamKullanimAlani: parsedItem.data.kapsamKullanimAlani || '',
        varsayilanDeger: parsedItem.data.varsayilanDeger || '',
        degerAraligi: parsedItem.data.degerAraligi || '',
        parametreYetkisi: parsedItem.data.parametreYetkisi || ''
      }
    };
    
    newParametreler.push(newItem);
  });

  // Eğer hiç parametre yoksa, en az bir boş parametre ekle
  if (newParametreler.length === 0) {
    newParametreler.push({
      id: '1',
      data: {
        parametreAdi: '',
        aciklama: '',
        kapsamKullanimAlani: '',
        varsayilanDeger: '',
        degerAraligi: '',
        parametreYetkisi: ''
      }
    });
  }

  return newParametreler;
}

/**
 * Parametreler DOCX parsing hook'u
 */
export function useParametreler(): UseParametrelerReturn {
  const [parametreler, setParametreler] = useState<ParametreItem[]>(getInitialParametreler());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<ParametrelerParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Parametreler DOCX işleniyor:', file.name);
    console.log('🔄 useParametreler processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseParametrelerFromDocx(file);
      console.log('✅ DOCX Parametreler Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newParametreler = convertParsedFieldsToParametreler(result);
        setParametreler(newParametreler);
        console.log('✅ Parametreler data güncellendi:', newParametreler);
      } else {
        console.log('⚠️ Parametreler tablosu bulunamadı');
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Dosya işleme hatası:', error);
      setValidation({
        parametreler: [],
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
    setParametreler(getInitialParametreler());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateTableCell = useCallback((id: string, field: string, value: string) => {
    setParametreler(prev => 
      prev.map(item => 
        item.id === id ? { 
          ...item, 
          data: { ...item.data, [field]: value } 
        } : item
      )
    );
  }, []);

  const addParametre = useCallback(() => {
    setParametreler(prev => {
      const newId = (Math.max(...prev.map(item => parseInt(item.id))) + 1).toString();
      return [
        ...prev,
        {
          id: newId,
          data: {
            parametreAdi: '',
            aciklama: '',
            kapsamKullanimAlani: '',
            varsayilanDeger: '',
            degerAraligi: '',
            parametreYetkisi: ''
          }
        }
      ];
    });
  }, []);

  const removeParametre = useCallback((id: string) => {
    setParametreler(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    parametreler,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateTableCell,
    addParametre,
    removeParametre
  };
}
