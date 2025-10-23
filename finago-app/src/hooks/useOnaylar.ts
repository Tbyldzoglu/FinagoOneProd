import { useState, useCallback, useMemo } from 'react';
import { parseOnaylarFromDocx, OnaylarRow, OnaylarParseResult } from '../utils/parseOnaylar';

export interface UseOnaylarReturn {
  // State
  tableRows: OnaylarRow[];
  parseResult: OnaylarParseResult | null;
  isLoading: boolean;
  isProcessed: boolean;
  
  // Actions
  processFile: (file: File) => Promise<void>;
  addRow: () => void;
  removeRow: (id: string) => void;
  updateRow: (id: string, field: keyof OnaylarRow, value: string) => void;
  resetData: () => void;
  
  // Computed
  hasData: boolean;
  isEmpty: boolean;
}

const createEmptyRow = (index: number): OnaylarRow => ({
  id: `onaylar-new-${Date.now()}-${index}`,
  isim: '',
  unvan: '',
  tarih: ''
});

export function useOnaylar(): UseOnaylarReturn {
  const [tableRows, setTableRows] = useState<OnaylarRow[]>([
    createEmptyRow(1)
  ]);
  const [parseResult, setParseResult] = useState<OnaylarParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  // DOCX dosyasını işle
  const processFile = useCallback(async (file: File) => {
    if (isProcessed || isLoading) {
      console.log('🔄 Zaten işlenmiş veya işleniyor, atlanıyor');
      return;
    }

    console.log('🔄 Onaylar DOCX işleniyor:', file.name);
    console.log('🔄 useOnaylar processFile çalışıyor!');
    
    setIsLoading(true);
    
    try {
      const result = await parseOnaylarFromDocx(file);
      console.log('✅ DOCX Onaylar Parse Sonucu:', result);
      
      setParseResult(result);
      
      if (result.found && result.tableRows.length > 0) {
        setTableRows(result.tableRows);
        console.log('✅ Onaylar data güncellendi:', result.tableRows);
      } else {
        console.log('⚠️ Onaylar tablosu bulunamadı veya boş');
        // Varsayılan boş satırları koru
      }
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ DOCX işleme hatası:', error);
      setParseResult({
        tableRows: [],
        found: false,
        mode: 'strict',
        errors: [`İşleme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: [],
        matchedLabels: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [isProcessed, isLoading]);

  // Yeni satır ekle
  const addRow = useCallback(() => {
    const newRow = createEmptyRow(tableRows.length + 1);
    setTableRows(prev => [...prev, newRow]);
    console.log('✅ Yeni satır eklendi:', newRow.id);
  }, [tableRows.length]);

  // Satır sil
  const removeRow = useCallback((id: string) => {
    setTableRows(prev => {
      const filtered = prev.filter(row => row.id !== id);
      console.log('🗑️ Satır silindi:', id);
      return filtered;
    });
  }, []);

  // Satır güncelle
  const updateRow = useCallback((id: string, field: keyof OnaylarRow, value: string) => {
    setTableRows(prev => 
      prev.map(row => 
        row.id === id 
          ? { ...row, [field]: value }
          : row
      )
    );
  }, []);

  // Verileri sıfırla
  const resetData = useCallback(() => {
    setTableRows([createEmptyRow(1)]);
    setParseResult(null);
    setIsProcessed(false);
    setIsLoading(false);
    console.log('🔄 Onaylar verileri sıfırlandı');
  }, []);

  // Computed values
  const hasData = useMemo(() => 
    tableRows.some(row => row.isim.trim() || row.unvan.trim() || row.tarih.trim()),
    [tableRows]
  );

  const isEmpty = useMemo(() => 
    tableRows.length === 0 || !hasData,
    [tableRows.length, hasData]
  );

  return {
    // State
    tableRows,
    parseResult,
    isLoading,
    isProcessed,
    
    // Actions
    processFile,
    addRow,
    removeRow,
    updateRow,
    resetData,
    
    // Computed
    hasData,
    isEmpty
  };
}
