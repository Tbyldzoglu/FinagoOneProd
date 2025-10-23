/**
 * useTalepDegerlendirmesi Hook
 * 
 * DOCX dosyası seçildiğinde parseTalepDegerlendirmesiFromDocx çağırır;
 * dönen fields ile modal form'unu controlled olarak set eder;
 * validation.errors/warnings'ı banner'da gösterir.
 */

import { useState, useCallback } from 'react';
import { 
  parseTalepDegerlendirmesiFromDocx, 
  TalepDegerlendirmesiFields,
  TalepDegerlendirmesiParseResult 
} from '../utils/parseTalepDegerlendirmesiFromDocx';

// Modal'ın FormData yapısı
interface FormDataItem {
  yanit: string;
  aciklama: string;
}

interface FormData {
  mevcutGereksinimiVar: FormDataItem;
  urunAdi: string;
  yeniBirUrunMu: FormDataItem;
  muhasabeDeğisikligiVar: FormDataItem;
  disFirmaEntegrasyonu: FormDataItem;
  raporlamaEtkisi: FormDataItem;
  odemeGgbEtkisi: FormDataItem;
  uyumFraudSenaryolari: FormDataItem;
  dijitalKanallardaEtkisi: FormDataItem;
  batchIsEtkisi: FormDataItem;
  bildirimOlusturulmali: FormDataItem;
  conversionGereksinimiVar: FormDataItem;
}

export interface UseTalepDegerlendirmesiState {
  // Form verileri
  formData: FormData;
  
  // Durum yönetimi
  isLoading: boolean;
  isProcessed: boolean;
  
  // Validasyon sonuçları
  validation: TalepDegerlendirmesiParseResult['validation'] | null;
  
  // İşlemler
  processFile: (file: File) => Promise<void>;
  resetForm: () => void;
  updateField: (field: keyof FormData, value: string, subField?: keyof FormDataItem) => void;
}

const initialFormData: FormData = {
  mevcutGereksinimiVar: { yanit: '', aciklama: '' },
  urunAdi: '',
  yeniBirUrunMu: { yanit: '', aciklama: '' },
  muhasabeDeğisikligiVar: { yanit: '', aciklama: '' },
  disFirmaEntegrasyonu: { yanit: '', aciklama: '' },
  raporlamaEtkisi: { yanit: '', aciklama: '' },
  odemeGgbEtkisi: { yanit: '', aciklama: '' },
  uyumFraudSenaryolari: { yanit: '', aciklama: '' },
  dijitalKanallardaEtkisi: { yanit: '', aciklama: '' },
  batchIsEtkisi: { yanit: '', aciklama: '' },
  bildirimOlusturulmali: { yanit: '', aciklama: '' },
  conversionGereksinimiVar: { yanit: '', aciklama: '' }
};

/**
 * Parse edilen field'ları modal FormData formatına dönüştürür
 */
function convertParsedFieldsToFormData(parsedFields: TalepDegerlendirmesiFields): FormData {
  return {
    mevcutGereksinimiVar: {
      yanit: parsedFields.mevcutGereksinimiVar_yanit,
      aciklama: parsedFields.mevcutGereksinimiVar_aciklama
    },
    urunAdi: parsedFields.urunAdi,
    yeniBirUrunMu: {
      yanit: parsedFields.yeniBirUrunMu_yanit,
      aciklama: parsedFields.yeniBirUrunMu_aciklama
    },
    muhasabeDeğisikligiVar: {
      yanit: parsedFields.muhasabeDeğisikligiVar_yanit,
      aciklama: parsedFields.muhasabeDeğisikligiVar_aciklama
    },
    disFirmaEntegrasyonu: {
      yanit: parsedFields.disFirmaEntegrasyonu_yanit,
      aciklama: parsedFields.disFirmaEntegrasyonu_aciklama
    },
    raporlamaEtkisi: {
      yanit: parsedFields.raporlamaEtkisi_yanit,
      aciklama: parsedFields.raporlamaEtkisi_aciklama
    },
    odemeGgbEtkisi: {
      yanit: parsedFields.odemeGgbEtkisi_yanit,
      aciklama: parsedFields.odemeGgbEtkisi_aciklama
    },
    uyumFraudSenaryolari: {
      yanit: parsedFields.uyumFraudSenaryolari_yanit,
      aciklama: parsedFields.uyumFraudSenaryolari_aciklama
    },
    dijitalKanallardaEtkisi: {
      yanit: parsedFields.dijitalKanallardaEtkisi_yanit,
      aciklama: parsedFields.dijitalKanallardaEtkisi_aciklama
    },
    batchIsEtkisi: {
      yanit: parsedFields.batchIsEtkisi_yanit,
      aciklama: parsedFields.batchIsEtkisi_aciklama
    },
    bildirimOlusturulmali: {
      yanit: parsedFields.bildirimOlusturulmali_yanit,
      aciklama: parsedFields.bildirimOlusturulmali_aciklama
    },
    conversionGereksinimiVar: {
      yanit: parsedFields.conversionGereksinimiVar_yanit,
      aciklama: parsedFields.conversionGereksinimiVar_aciklama
    }
  };
}

/**
 * Talep Değerlendirmesi yönetimi için React Hook
 */
export function useTalepDegerlendirmesi(): UseTalepDegerlendirmesiState {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<TalepDegerlendirmesiParseResult['validation'] | null>(null);

  /**
   * DOCX dosyasını işler ve form alanlarını doldurur
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setIsProcessed(false);
    setValidation(null);

    try {
      // DOCX'i parse et
      const result = await parseTalepDegerlendirmesiFromDocx(file);
      
      // Sonuçları state'e kaydet
      if (result.validation.found) {
        const convertedFormData = convertParsedFieldsToFormData(result.fields);
        setFormData(convertedFormData);
      } else {
        // Hiçbir veri bulunamadıysa boş form bırak
        setFormData(initialFormData);
      }
      
      setValidation(result.validation);
      setIsProcessed(true);

      // Debug için console'a log
      console.log('DOCX Talep Değerlendirmesi Parse Sonucu:', {
        found: result.validation.found,
        mode: result.validation.mode,
        matchedLabels: result.validation.matchedLabels,
        fieldCount: Object.values(result.fields).filter(v => v !== '').length,
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
   * Form'u sıfırlar
   */
  const resetForm = useCallback((): void => {
    setFormData(initialFormData);
    setValidation(null);
    setIsProcessed(false);
  }, []);

  /**
   * Tek bir form alanını günceller
   */
  const updateField = useCallback((field: keyof FormData, value: string, subField?: keyof FormDataItem): void => {
    setFormData(prev => ({
      ...prev,
      [field]: subField ? {
        ...(prev[field] as FormDataItem),
        [subField]: value
      } : value
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
