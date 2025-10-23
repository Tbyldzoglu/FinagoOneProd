import { useState, useCallback } from 'react';
import { 
  parseXIslemiMuhasebeModalFromDocx, 
  XIslemiMuhasebeModalFields,
  XIslemiMuhasebeModalParseResult 
} from '../utils/parseXIslemiMuhasebeModalFromDocx';

// Hook'un döndürdüğü interface
interface UseXIslemiMuhasebeModalReturn {
  formData: XIslemiMuhasebeModalFields;
  isLoading: boolean;
  isProcessed: boolean;
  validation: XIslemiMuhasebeModalParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateField: (field: keyof XIslemiMuhasebeModalFields, value: string) => void;
}

// Initial form data
const getInitialFormData = (): XIslemiMuhasebeModalFields => ({
  islemTanimi: '',
  ilgiliUrunModul: '',
  tetikleyiciOlay: '',
  muhasebeKaydininiIzlenecegiEkran: '',
  hataYonetimi: ''
});

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToFormData(
  parsedFields: XIslemiMuhasebeModalParseResult
): XIslemiMuhasebeModalFields {
  if (!parsedFields.found) {
    return getInitialFormData();
  }

  return {
    islemTanimi: parsedFields.fields.islemTanimi || '',
    ilgiliUrunModul: parsedFields.fields.ilgiliUrunModul || '',
    tetikleyiciOlay: parsedFields.fields.tetikleyiciOlay || '',
    muhasebeKaydininiIzlenecegiEkran: parsedFields.fields.muhasebeKaydininiIzlenecegiEkran || '',
    hataYonetimi: parsedFields.fields.hataYonetimi || ''
  };
}

/**
 * X İşlemi Muhasebesi Modal DOCX parsing hook'u
 */
export function useXIslemiMuhasebeModal(): UseXIslemiMuhasebeModalReturn {
  const [formData, setFormData] = useState<XIslemiMuhasebeModalFields>(getInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<XIslemiMuhasebeModalParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 X İşlemi Muhasebesi Modal DOCX işleniyor:', file.name);
    console.log('🔄 useXIslemiMuhasebeModal processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseXIslemiMuhasebeModalFromDocx(file);
      console.log('✅ DOCX X İşlemi Muhasebesi Modal Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newFormData = convertParsedFieldsToFormData(result);
        setFormData(newFormData);
        console.log('✅ X İşlemi Muhasebesi Modal data güncellendi:', newFormData);
      } else {
        console.log('⚠️ X İşlemi Muhasebesi Modal verisi bulunamadı');
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Dosya işleme hatası:', error);
      setValidation({
        fields: getInitialFormData(),
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
    setFormData(getInitialFormData());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateField = useCallback((field: keyof XIslemiMuhasebeModalFields, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return {
    formData,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateField
  };
}
