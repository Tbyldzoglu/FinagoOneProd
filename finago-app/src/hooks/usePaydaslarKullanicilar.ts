import { useState, useCallback } from 'react';
import { 
  parsePaydaslarKullanicilarFromDocx, 
  PaydaslarKullanicilarItem,
  PaydaslarKullanicilarParseResult 
} from '../utils/parsePaydaslarKullanicilarFromDocx';

// Hook'un döndürdüğü interface
interface UsePaydaslarKullanicilarReturn {
  formData: PaydaslarKullanicilarItem;
  isLoading: boolean;
  isProcessed: boolean;
  validation: PaydaslarKullanicilarParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateField: (field: string, value: string) => void;
}

// Initial form data
const getInitialFormData = (): PaydaslarKullanicilarItem => ({
  id: '1',
  data: {
    paydasEkipKullaniciBilgileri: '',
    paydasEkipKullaniciBilgileriAciklama: '',
    uyumFraudEkibiGorusu: '',
    uyumFraudEkibiGorusuAciklama: '',
    hukukEkibiGorusu: '',
    hukukEkibiGorusuAciklama: '',
    teftisIcKontrolGorusu: '',
    teftisIcKontrolGorusuAciklama: '',
    operasyonEkibiGorusu: '',
    operasyonEkibiGorusuAciklama: ''
  }
});

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToFormData(
  parsedFields: PaydaslarKullanicilarParseResult
): PaydaslarKullanicilarItem {
  if (!parsedFields.found) {
    return getInitialFormData();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newFormData: PaydaslarKullanicilarItem = {
    id: '1',
    data: {
      paydasEkipKullaniciBilgileri: parsedFields.formData.data.paydasEkipKullaniciBilgileri || '',
      paydasEkipKullaniciBilgileriAciklama: parsedFields.formData.data.paydasEkipKullaniciBilgileriAciklama || '',
      uyumFraudEkibiGorusu: parsedFields.formData.data.uyumFraudEkibiGorusu || '',
      uyumFraudEkibiGorusuAciklama: parsedFields.formData.data.uyumFraudEkibiGorusuAciklama || '',
      hukukEkibiGorusu: parsedFields.formData.data.hukukEkibiGorusu || '',
      hukukEkibiGorusuAciklama: parsedFields.formData.data.hukukEkibiGorusuAciklama || '',
      teftisIcKontrolGorusu: parsedFields.formData.data.teftisIcKontrolGorusu || '',
      teftisIcKontrolGorusuAciklama: parsedFields.formData.data.teftisIcKontrolGorusuAciklama || '',
      operasyonEkibiGorusu: parsedFields.formData.data.operasyonEkibiGorusu || '',
      operasyonEkibiGorusuAciklama: parsedFields.formData.data.operasyonEkibiGorusuAciklama || ''
    }
  };

  return newFormData;
}

/**
 * Paydaşlar ve Kullanıcılar DOCX parsing hook'u
 */
export function usePaydaslarKullanicilar(): UsePaydaslarKullanicilarReturn {
  const [formData, setFormData] = useState<PaydaslarKullanicilarItem>(getInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<PaydaslarKullanicilarParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Paydaşlar ve Kullanıcılar DOCX işleniyor:', file.name);
    console.log('🔄 usePaydaslarKullanicilar processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parsePaydaslarKullanicilarFromDocx(file);
      console.log('✅ DOCX Paydaşlar ve Kullanıcılar Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newFormData = convertParsedFieldsToFormData(result);
        setFormData(newFormData);
        console.log('✅ Paydaşlar ve Kullanıcılar data güncellendi:', newFormData);
      } else {
        console.log('⚠️ Paydaşlar ve Kullanıcılar formu bulunamadı');
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Dosya işleme hatası:', error);
      setValidation({
        formData: getInitialFormData(),
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

  const updateField = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
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
