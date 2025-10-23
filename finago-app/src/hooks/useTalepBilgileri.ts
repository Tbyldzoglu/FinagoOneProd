/**
 * useTalepBilgileri Hook
 * 
 * DOCX dosyası seçildiğinde parseTalepBilgileriFromDocx çağırır;
 * dönen fields ile modal input'larını controlled olarak set eder;
 * validation.errors/warnings'ı banner'da gösterir.
 * 
 * Hiçbir yerde "placeholder örnek veri" kullanmaz.
 * Input'lar sadece gerçek dosya değerini gösterir.
 */

import { useState, useCallback } from 'react';
import { parseTalepBilgileriFromDocx, TalepFields, ParseResult } from '../utils/parseTalepBilgileriFromDocx';

export interface UseTalepBilgileriState {
  // Form alanları
  fields: TalepFields;
  
  // Durum yönetimi
  isLoading: boolean;
  isProcessed: boolean;
  
  // Validasyon sonuçları
  validation: ParseResult['validation'] | null;
  
  // İşlemler
  processFile: (file: File) => Promise<void>;
  resetFields: () => void;
  updateField: (fieldName: keyof TalepFields, value: string) => void;
}

const initialFields: TalepFields = {
  talep_no: '',
  talep_adi: '',
  talep_sahibi_is_birimi: '',
  talep_sahibi_kurum: '',
  talep_yoneticisi: '',
  teknik_ekipler: ''
};

/**
 * Talep Bilgileri yönetimi için React Hook
 */
export function useTalepBilgileri(): UseTalepBilgileriState {
  const [fields, setFields] = useState<TalepFields>(initialFields);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<ParseResult['validation'] | null>(null);

  /**
   * DOCX dosyasını işler ve form alanlarını doldurur
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setIsProcessed(false);
    setValidation(null);

    try {
      // DOCX'i parse et
      const result = await parseTalepBilgileriFromDocx(file);
      
      // Sonuçları state'e kaydet
      setFields(result.fields); // Sadece gerçek dosya değerleri
      setValidation(result.validation);
      setIsProcessed(true);

      // Debug için console'a log (geliştirme aşamasında)
      console.log('DOCX Parse Sonucu:', {
        found: result.validation.found,
        mode: result.validation.mode,
        matchedLabels: result.validation.matchedLabels,
        fields: result.fields,
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
   * Form alanlarını sıfırlar
   */
  const resetFields = useCallback((): void => {
    setFields(initialFields);
    setValidation(null);
    setIsProcessed(false);
  }, []);

  /**
   * Tek bir form alanını günceller
   */
  const updateField = useCallback((fieldName: keyof TalepFields, value: string): void => {
    setFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  return {
    fields,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetFields,
    updateField
  };
}
