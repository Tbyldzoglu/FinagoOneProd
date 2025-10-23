import { useState, useCallback } from 'react';
import { 
  parseXIslemiMuhasebeFromDocx, 
  XIslemiMuhasebeItem,
  XIslemiMuhasebeParseResult 
} from '../utils/parseXIslemiMuhasebeFromDocx';

// Hook'un döndürdüğü interface
interface UseXIslemiMuhasebeReturn {
  tableRows: XIslemiMuhasebeItem[];
  isLoading: boolean;
  isProcessed: boolean;
  validation: XIslemiMuhasebeParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateRowData: (rowId: number, field: string, value: string) => void;
  addRow: () => void;
  removeRow: (rowId: number) => void;
}

// Initial form data
const getInitialTableRows = (): XIslemiMuhasebeItem[] => ([
  { id: 1, data: { subeKodu: '', musteriNo: '', defter: '', borcAlacak: '', tutar: '', dovizCinsi: '', aciklama: '' } },
  { id: 2, data: { subeKodu: '', musteriNo: '', defter: '', borcAlacak: '', tutar: '', dovizCinsi: '', aciklama: '' } },
  { id: 3, data: { subeKodu: '', musteriNo: '', defter: '', borcAlacak: '', tutar: '', dovizCinsi: '', aciklama: '' } }
]);

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToTableRows(
  parsedFields: XIslemiMuhasebeParseResult
): XIslemiMuhasebeItem[] {
  if (!parsedFields.found || parsedFields.tableRows.length === 0) {
    return getInitialTableRows();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newTableRows: XIslemiMuhasebeItem[] = [];

  // Parse edilen satırları ekle
  parsedFields.tableRows.forEach((parsedItem, index) => {
    const newItem: XIslemiMuhasebeItem = {
      id: index + 1,
      data: {
        subeKodu: parsedItem.data.subeKodu || '',
        musteriNo: parsedItem.data.musteriNo || '',
        defter: parsedItem.data.defter || '',
        borcAlacak: parsedItem.data.borcAlacak || '',
        tutar: parsedItem.data.tutar || '',
        dovizCinsi: parsedItem.data.dovizCinsi || '',
        aciklama: parsedItem.data.aciklama || ''
      }
    };
    
    newTableRows.push(newItem);
  });

  // Eğer hiç satır yoksa, varsayılan satırları ekle
  if (newTableRows.length === 0) {
    return getInitialTableRows();
  }

  return newTableRows;
}

/**
 * X İşlemi Muhasebesi DOCX parsing hook'u
 */
export function useXIslemiMuhasebe(): UseXIslemiMuhasebeReturn {
  const [tableRows, setTableRows] = useState<XIslemiMuhasebeItem[]>(getInitialTableRows());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<XIslemiMuhasebeParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 X İşlemi Muhasebesi DOCX işleniyor:', file.name);
    console.log('🔄 useXIslemiMuhasebe processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseXIslemiMuhasebeFromDocx(file);
      console.log('✅ DOCX X İşlemi Muhasebesi Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newTableRows = convertParsedFieldsToTableRows(result);
        setTableRows(newTableRows);
        console.log('✅ X İşlemi Muhasebesi data güncellendi:', newTableRows);
      } else {
        console.log('⚠️ X İşlemi Muhasebesi tablosu bulunamadı');
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
    setTableRows(getInitialTableRows());
    setValidation(null);
    setIsProcessed(false);
  }, []);

  const updateRowData = useCallback((rowId: number, field: string, value: string) => {
    setTableRows(prev => 
      prev.map(row => 
        row.id === rowId 
          ? { ...row, data: { ...row.data, [field]: value } }
          : row
      )
    );
  }, []);

  const addRow = useCallback(() => {
    setTableRows(prev => {
      const newId = Math.max(...prev.map(row => row.id)) + 1;
      const newRow: XIslemiMuhasebeItem = {
        id: newId,
        data: { subeKodu: '', musteriNo: '', defter: '', borcAlacak: '', tutar: '', dovizCinsi: '', aciklama: '' }
      };
      return [...prev, newRow];
    });
  }, []);

  const removeRow = useCallback((rowId: number) => {
    setTableRows(prev => {
      if (prev.length > 1) {
        return prev.filter(row => row.id !== rowId);
      }
      return prev;
    });
  }, []);

  return {
    tableRows,
    isLoading,
    isProcessed,
    validation,
    processFile,
    resetForm,
    updateRowData,
    addRow,
    removeRow
  };
}
