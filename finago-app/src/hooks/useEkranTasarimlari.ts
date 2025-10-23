/**
 * useEkranTasarimlari Hook
 * 
 * DOCX dosyası seçildiğinde parseEkranTasarimlarindenDocx çağırır;
 * dönen fields ile modal form'unu controlled olarak set eder;
 * validation.errors/warnings'ı banner'da gösterir.
 */

import { useState, useCallback } from 'react';
import { 
  parseEkranTasarimlarindenDocx, 
  EkranTasarimFields,
  EkranTasarimParseResult,
  EkranBilgisiRow,
  AlanDetayRow,
  HesaplamaKuraliRow,
  ButonTasarimRow
} from '../utils/parseEkranTasarimlarindenDocx';

// Modal'ın FormData yapısı
interface FormData {
  ekranBilgileri: EkranBilgisiRow[];
  alanDetaylari: AlanDetayRow[];
  hesaplamaKurallari: HesaplamaKuraliRow[];
  butonTasarimlari: ButonTasarimRow[];
  aciklamaMetni: string;
}

export interface UseEkranTasarimlariState {
  // Form verileri
  formData: FormData;
  
  // Durum yönetimi
  isLoading: boolean;
  isProcessed: boolean;
  
  // Validasyon sonuçları
  validation: EkranTasarimParseResult['validation'] | null;
  
  // İşlemler
  processFile: (file: File) => Promise<void>;
  resetForm: () => void;
  updateTableCell: (tableType: keyof FormData, rowIndex: number, field: string, value: string) => void;
  addRowToTable: (tableType: keyof FormData) => void;
  removeRowFromTable: (tableType: keyof FormData, rowIndex: number) => void;
}

const initialFormData: FormData = {
  ekranBilgileri: [
    { label: 'Ekran Adı / Kodu', value: '' },
    { label: 'Amaç', value: '' },
    { label: 'Kullanıcı Rolü / Yetki', value: '' },
    { label: 'Navigasyon (Menü Yolu)', value: '' }
  ],
  alanDetaylari: [
    { id: 1, alanAdi: '', tip: '', uzunluk: '', zorunlu: '', varsayilan: '', degistirilebilir: '', isKurallari: '' }
  ],
  hesaplamaKurallari: [
    { alanAdi: 'Toplam Tutar', hesaplamaKuraliAciklama: '' },
    { alanAdi: 'Kur Değeri', hesaplamaKuraliAciklama: '' },
    { alanAdi: 'İşlem No', hesaplamaKuraliAciklama: '' }
  ],
  butonTasarimlari: [
    { butonAdi: 'Kaydet', aciklama: '', aktiflik: '', gorunurluk: '' },
    { butonAdi: 'Güncelle', aciklama: '', aktiflik: '', gorunurluk: '' },
    { butonAdi: 'Sil', aciklama: '', aktiflik: '', gorunurluk: '' },
    { butonAdi: 'Divit', aciklama: '', aktiflik: '', gorunurluk: '' },
    { butonAdi: 'Temizle', aciklama: '', aktiflik: '', gorunurluk: '' },
    { butonAdi: 'Bilgi Getir', aciklama: '', aktiflik: '', gorunurluk: '' },
    { butonAdi: 'Kapat', aciklama: '', aktiflik: '', gorunurluk: '' }
  ],
  aciklamaMetni: ''
};

/**
 * Parse edilen field'ları modal FormData formatına dönüştürür
 */
function convertParsedFieldsToFormData(parsedFields: EkranTasarimFields, currentFormData: FormData): FormData {
  const newFormData: FormData = { ...currentFormData };

  // Ekran Bilgileri - parse edilen değerlerle mevcut label'ları eşleştir
  if (parsedFields.ekranBilgileri.length > 0) {
    newFormData.ekranBilgileri = newFormData.ekranBilgileri.map(existing => {
      // Parse edilen verilerden eşleşen label'ı bul
      const match = parsedFields.ekranBilgileri.find(parsed => 
        existing.label.toLowerCase().includes(parsed.label.toLowerCase()) ||
        parsed.label.toLowerCase().includes(existing.label.toLowerCase())
      );
      
      return match ? { ...existing, value: match.value } : existing;
    });
  }

  // Alan Detayları - parse edilen verilerle değiştir (eğer varsa)
  if (parsedFields.alanDetaylari.length > 0) {
    newFormData.alanDetaylari = parsedFields.alanDetaylari;
  }

  // Hesaplama Kuralları - parse edilen verilerle mevcut alanları eşleştir
  if (parsedFields.hesaplamaKurallari.length > 0) {
    newFormData.hesaplamaKurallari = newFormData.hesaplamaKurallari.map(existing => {
      // Parse edilen verilerden eşleşen alan adını bul
      const match = parsedFields.hesaplamaKurallari.find(parsed => 
        existing.alanAdi.toLowerCase().includes(parsed.alanAdi.toLowerCase()) ||
        parsed.alanAdi.toLowerCase().includes(existing.alanAdi.toLowerCase())
      );
      
      return match ? { ...existing, hesaplamaKuraliAciklama: match.hesaplamaKuraliAciklama } : existing;
    });
    
    // Parse edilen yeni alanları da ekle
    const newRules = parsedFields.hesaplamaKurallari.filter(parsed =>
      !newFormData.hesaplamaKurallari.some(existing =>
        existing.alanAdi.toLowerCase().includes(parsed.alanAdi.toLowerCase()) ||
        parsed.alanAdi.toLowerCase().includes(existing.alanAdi.toLowerCase())
      )
    );
    newFormData.hesaplamaKurallari.push(...newRules);
  }

  // Buton Tasarımları - parse edilen verilerle mevcut butonları eşleştir
  if (parsedFields.butonTasarimlari.length > 0) {
    newFormData.butonTasarimlari = newFormData.butonTasarimlari.map(existing => {
      // Parse edilen verilerden eşleşen buton adını bul
      const match = parsedFields.butonTasarimlari.find(parsed => {
        const existingLower = existing.butonAdi.toLowerCase();
        const parsedLower = parsed.butonAdi.toLowerCase();
        
        // Tam eşleşme, içerme veya benzer kelimeler (divit/diyit)
        return existingLower === parsedLower ||
               existingLower.includes(parsedLower) ||
               parsedLower.includes(existingLower) ||
               (existingLower === 'divit' && parsedLower === 'diyit') ||
               (existingLower === 'diyit' && parsedLower === 'divit');
      });
      
      return match ? { 
        ...existing, 
        aciklama: match.aciklama,
        aktiflik: match.aktiflik,
        gorunurluk: match.gorunurluk
      } : existing;
    });
    
    // Parse edilen yeni butonları da ekle
    const newButtons = parsedFields.butonTasarimlari.filter(parsed =>
      !newFormData.butonTasarimlari.some(existing => {
        const existingLower = existing.butonAdi.toLowerCase();
        const parsedLower = parsed.butonAdi.toLowerCase();
        
        // Tam eşleşme, içerme veya benzer kelimeler (divit/diyit)
        return existingLower === parsedLower ||
               existingLower.includes(parsedLower) ||
               parsedLower.includes(existingLower) ||
               (existingLower === 'divit' && parsedLower === 'diyit') ||
               (existingLower === 'diyit' && parsedLower === 'divit');
      })
    );
    newFormData.butonTasarimlari.push(...newButtons);
  }

  return newFormData;
}

/**
 * Ekran Tasarımları yönetimi için React Hook
 */
export function useEkranTasarimlari(): UseEkranTasarimlariState {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<EkranTasarimParseResult['validation'] | null>(null);

  /**
   * DOCX dosyasını işler ve form alanlarını doldurur
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setIsProcessed(false);
    setValidation(null);

    try {
      // DOCX'i parse et
      const result = await parseEkranTasarimlarindenDocx(file);
      
      // Sonuçları state'e kaydet
      if (result.validation.found) {
        const convertedFormData = convertParsedFieldsToFormData(result.fields, formData);
        setFormData(convertedFormData);
      } else {
        // Hiçbir veri bulunamadıysa mevcut form'u koru
        // setFormData(initialFormData); // Bu satırı kaldırdık
      }
      
      setValidation(result.validation);
      setIsProcessed(true);

      // Debug için console'a log
      console.log('DOCX Ekran Tasarımları Parse Sonucu:', {
        found: result.validation.found,
        foundTables: result.validation.foundTables,
        matchedLabels: result.validation.matchedLabels,
        errors: result.validation.errors,
        warnings: result.validation.warnings
      });

    } catch (error) {
      // Parse hatası durumunda validation'a hata ekle
      setValidation({
        found: false,
        mode: "scan",
        errors: [`dosya_isleme_hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: [],
        matchedLabels: [],
        foundTables: {
          ekranBilgileri: false,
          alanDetaylari: false,
          hesaplamaKurallari: false,
          butonTasarimlari: false
        }
      });
      setIsProcessed(true);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  /**
   * Form'u sıfırlar
   */
  const resetForm = useCallback((): void => {
    setFormData(initialFormData);
    setValidation(null);
    setIsProcessed(false);
  }, []);

  /**
   * Tablo hücresini günceller
   */
  const updateTableCell = useCallback((tableType: keyof FormData, rowIndex: number, field: string, value: string): void => {
    if (tableType === 'aciklamaMetni') {
      // Açıklama metni için özel güncelleme
      setFormData(prev => ({ ...prev, aciklamaMetni: value }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [tableType]: (prev[tableType] as any[]).map((row, index) => 
        index === rowIndex ? { ...row, [field]: value } : row
      )
    }));
  }, []);

  /**
   * Tabloya yeni satır ekler
   */
  const addRowToTable = useCallback((tableType: keyof FormData): void => {
    setFormData(prev => {
      switch (tableType) {
        case 'alanDetaylari':
          const newId = prev.alanDetaylari.length > 0 ? Math.max(...prev.alanDetaylari.map(row => row.id)) + 1 : 1;
          return {
            ...prev,
            alanDetaylari: [...prev.alanDetaylari, {
              id: newId,
              alanAdi: '',
              tip: '',
              uzunluk: '',
              zorunlu: '',
              varsayilan: '',
              degistirilebilir: '',
              isKurallari: ''
            }]
          };
        case 'butonTasarimlari':
          return {
            ...prev,
            butonTasarimlari: [...prev.butonTasarimlari, {
              butonAdi: '',
              aciklama: '',
              aktiflik: '',
              gorunurluk: ''
            }]
          };
        default:
          return prev;
      }
    });
  }, []);

  /**
   * Tablodan satır siler
   */
  const removeRowFromTable = useCallback((tableType: keyof FormData, rowIndex: number): void => {
    setFormData(prev => {
      switch (tableType) {
        case 'alanDetaylari':
          return {
            ...prev,
            alanDetaylari: prev.alanDetaylari.filter((_, index) => index !== rowIndex)
          };
        case 'butonTasarimlari':
          return {
            ...prev,
            butonTasarimlari: prev.butonTasarimlari.filter((_, index) => index !== rowIndex)
          };
        default:
          return prev;
      }
    });
  }, []);

  return {
    formData,
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
