import { useState, useCallback } from 'react';
import { 
  parseVeriKritikligiFromDocx, 
  VeriKritikligiItem,
  VeriKritikligiParseResult 
} from '../utils/parseVeriKritikligiFromDocx';

// Hook'un döndürdüğü interface
interface UseVeriKritikligiReturn {
  tableRows: VeriKritikligiItem[];
  isLoading: boolean;
  isProcessed: boolean;
  validation: VeriKritikligiParseResult | null;
  processFile: (file: File | null) => Promise<void>;
  resetForm: () => void;
  updateRowData: (rowId: string, field: string, value: string) => void;
  addRow: () => void;
  removeRow: (rowId: string) => void;
}

// Initial form data
const getInitialTableRows = (): VeriKritikligiItem[] => ([
  {
    id: '1',
    data: {
      sira: '',
      veriAdi: '',
      tabloAdi: '',
      veriAdiAciklamasi: '',
      gizlilik: '',
      butunluk: '',
      erisilebilirlik: '',
      hassasVeriMi: '',
      sirVeriMi: ''
    }
  }
]);

/**
 * Parse edilen verileri form data'ya dönüştürür
 */
function convertParsedFieldsToTableRows(
  parsedFields: VeriKritikligiParseResult
): VeriKritikligiItem[] {
  if (!parsedFields.found || parsedFields.tableRows.length === 0) {
    return getInitialTableRows();
  }

  // Parse edilen verileri mevcut form yapısına uyarla
  const newTableRows: VeriKritikligiItem[] = [];

  // Parse edilen satırları ekle
  parsedFields.tableRows.forEach((parsedItem, index) => {
    const newItem: VeriKritikligiItem = {
      id: (index + 1).toString(),
      data: {
        sira: parsedItem.data.sira || '',
        veriAdi: parsedItem.data.veriAdi || '',
        tabloAdi: parsedItem.data.tabloAdi || '',
        veriAdiAciklamasi: parsedItem.data.veriAdiAciklamasi || '',
        gizlilik: parsedItem.data.gizlilik || '',
        butunluk: parsedItem.data.butunluk || '',
        erisilebilirlik: parsedItem.data.erisilebilirlik || '',
        hassasVeriMi: parsedItem.data.hassasVeriMi || '',
        sirVeriMi: parsedItem.data.sirVeriMi || ''
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
 * Veri Kritikliği DOCX parsing hook'u
 */
export function useVeriKritikligi(): UseVeriKritikligiReturn {
  const [tableRows, setTableRows] = useState<VeriKritikligiItem[]>(getInitialTableRows());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [validation, setValidation] = useState<VeriKritikligiParseResult | null>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }

    console.log('🔄 Veri Kritikliği DOCX işleniyor:', file.name);
    console.log('🔄 useVeriKritikligi processFile çalışıyor!');
    setIsLoading(true);
    setIsProcessed(false);

    try {
      const result = await parseVeriKritikligiFromDocx(file);
      console.log('✅ DOCX Veri Kritikliği Parse Sonucu:', result);
      
      setValidation(result);
      
      if (result.found) {
        const newTableRows = convertParsedFieldsToTableRows(result);
        setTableRows(newTableRows);
        console.log('✅ Veri Kritikliği data güncellendi:', newTableRows);
      } else {
        console.log('⚠️ Veri Kritikliği tablosu bulunamadı');
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

  const updateRowData = useCallback((rowId: string, field: string, value: string) => {
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
      const newId = (Math.max(...prev.map(row => parseInt(row.id))) + 1).toString();
      const newRow: VeriKritikligiItem = {
        id: newId,
        data: {
          sira: '',
          veriAdi: '',
          tabloAdi: '',
          veriAdiAciklamasi: '',
          gizlilik: '',
          butunluk: '',
          erisilebilirlik: '',
          hassasVeriMi: '',
          sirVeriMi: ''
        }
      };
      return [...prev, newRow];
    });
  }, []);

  const removeRow = useCallback((rowId: string) => {
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
