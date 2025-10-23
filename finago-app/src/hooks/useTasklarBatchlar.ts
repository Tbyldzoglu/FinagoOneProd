import { useState, useCallback } from 'react';
import { 
  parseTasklarBatchlarFromDocx, 
  TaskBatchRow,
  TasklarBatchlarParseResult 
} from '../utils/parseTasklarBatchlarFromDocx';

// Form data interface
interface FormData {
  taskBatchTable: TaskBatchRow[];
  aciklamaMetni: string;
}

// Hook'un döndürdüğü interface
interface UseTasklarBatchlarReturn {
  formData: FormData;
  isLoading: boolean;
  isProcessed: boolean;
  validation: TasklarBatchlarParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateTableCell: (rowIndex: number, field: keyof TaskBatchRow, value: string) => void;
  updateAciklamaMetni: (value: string) => void;
  addRowToTable: () => void;
  removeRowFromTable: (rowIndex: number) => void;
}

// Initial form data
const getInitialFormData = (): FormData => ({
  taskBatchTable: [
    { 
      id: 1, 
      yeniMevcut: '', 
      taskJobAdi: '', 
      tanim: '', 
      sorumluSistem: '', 
      calismaSaati: '', 
      calismaSikligi: '', 
      bagimliliklar: '', 
      alertMekanizmasi: '', 
      alternatifCalistirmaYontemi: '' 
    }
  ],
  aciklamaMetni: ''
});

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToFormData(
  parsedFields: TasklarBatchlarParseResult,
  currentFormData: FormData
): FormData {
  if (!parsedFields.found || parsedFields.taskBatchTable.length === 0) {
    return currentFormData;
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newFormData: FormData = {
    ...currentFormData,
    taskBatchTable: []
  };

  // Parse edilen satırları ekle
  parsedFields.taskBatchTable.forEach((parsedRow, index) => {
    const newRow: TaskBatchRow = {
      id: index + 1,
      yeniMevcut: parsedRow.yeniMevcut || '',
      taskJobAdi: parsedRow.taskJobAdi || '',
      tanim: parsedRow.tanim || '',
      sorumluSistem: parsedRow.sorumluSistem || '',
      calismaSaati: parsedRow.calismaSaati || '',
      calismaSikligi: parsedRow.calismaSikligi || '',
      bagimliliklar: parsedRow.bagimliliklar || '',
      alertMekanizmasi: parsedRow.alertMekanizmasi || '',
      alternatifCalistirmaYontemi: parsedRow.alternatifCalistirmaYontemi || ''
    };
    
    newFormData.taskBatchTable.push(newRow);
  });

  // Eğer hiç satır yoksa, en az bir boş satır ekle
  if (newFormData.taskBatchTable.length === 0) {
    newFormData.taskBatchTable.push({
      id: 1,
      yeniMevcut: '',
      taskJobAdi: '',
      tanim: '',
      sorumluSistem: '',
      calismaSaati: '',
      calismaSikligi: '',
      bagimliliklar: '',
      alertMekanizmasi: '',
      alternatifCalistirmaYontemi: ''
    });
  }

  return newFormData;
}

/**
 * Taskler/Batchler DOCX parsing hook'u
 */
export function useTasklarBatchlar(): UseTasklarBatchlarReturn {
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<TasklarBatchlarParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Taskler/Batchler DOCX işleniyor:', file.name);
    console.log('🔄 useTasklarBatchlar processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseTasklarBatchlarFromDocx(file);
      console.log('✅ DOCX Taskler/Batchlar Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newFormData = convertParsedFieldsToFormData(result, getInitialFormData());
        setFormData(newFormData);
        console.log('✅ Form data güncellendi:', newFormData);
      } else {
        console.log('⚠️ Taskler/Batchlar tablosu bulunamadı');
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Dosya işleme hatası:', error);
      setValidation({
        taskBatchTable: [],
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
  }, []); // formData dependency'sini kaldırdık

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateTableCell = useCallback((rowIndex: number, field: keyof TaskBatchRow, value: string) => {
    setFormData(prev => ({
      ...prev,
      taskBatchTable: prev.taskBatchTable.map((row, index) => 
        index === rowIndex ? { ...row, [field]: value } : row
      )
    }));
  }, []);

  const updateAciklamaMetni = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      aciklamaMetni: value
    }));
  }, []);

  const addRowToTable = useCallback(() => {
    setFormData(prev => {
      const newId = prev.taskBatchTable.length > 0 ? Math.max(...prev.taskBatchTable.map(row => row.id)) + 1 : 1;
      return {
        ...prev,
        taskBatchTable: [...prev.taskBatchTable, {
          id: newId,
          yeniMevcut: '',
          taskJobAdi: '',
          tanim: '',
          sorumluSistem: '',
          calismaSaati: '',
          calismaSikligi: '',
          bagimliliklar: '',
          alertMekanizmasi: '',
          alternatifCalistirmaYontemi: ''
        }]
      };
    });
  }, []);

  const removeRowFromTable = useCallback((rowIndex: number) => {
    setFormData(prev => ({
      ...prev,
      taskBatchTable: prev.taskBatchTable.filter((_, index) => index !== rowIndex)
    }));
  }, []);

  return {
    formData,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateTableCell,
    updateAciklamaMetni,
    addRowToTable,
    removeRowFromTable
  };
}
