import { useState, useCallback, useMemo } from 'react';
import { parseKabulKriterleriFromDocx, KabulKriterleriRow, KabulKriterleriParseResult } from '../utils/parseKabulKriterleri';

export interface UseKabulKriterleriReturn {
  // State
  tableRows: KabulKriterleriRow[];
  parseResult: KabulKriterleriParseResult | null;
  isLoading: boolean;
  isProcessed: boolean;
  
  // Actions
  processFile: (file: File) => Promise<void>;
  addRow: () => void;
  removeRow: (id: string) => void;
  updateRow: (id: string, field: keyof KabulKriterleriRow, value: string) => void;
  resetData: () => void;
  
  // Computed
  hasData: boolean;
  isEmpty: boolean;
}

const createEmptyRow = (index: number): KabulKriterleriRow => ({
  id: `kabul-kriterleri-new-${Date.now()}-${index}`,
  kriterIs: '',
  aciklama: '',
  islemler: ''
});

export function useKabulKriterleri(): UseKabulKriterleriReturn {
  const [tableRows, setTableRows] = useState<KabulKriterleriRow[]>([
    createEmptyRow(1),
    createEmptyRow(2),
    createEmptyRow(3)
  ]);
  const [parseResult, setParseResult] = useState<KabulKriterleriParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  // DOCX dosyasını işle
  const processFile = useCallback(async (file: File) => {
    if (isProcessed || isLoading) {
      console.log('🔄 Zaten işlenmiş veya işleniyor, atlanıyor');
      return;
    }

    console.log('🔄 Kabul Kriterleri DOCX işleniyor:', file.name);
    console.log('🔄 useKabulKriterleri processFile çalışıyor!');
    
    setIsLoading(true);
    
    try {
      const result = await parseKabulKriterleriFromDocx(file);
      console.log('✅ DOCX Kabul Kriterleri Parse Sonucu:', result);
      
      setParseResult(result);
      
      if (result.found && result.tableRows.length > 0) {
        setTableRows(result.tableRows);
        console.log('✅ Kabul Kriterleri data güncellendi:', result.tableRows);
      } else {
        console.log('⚠️ Kabul Kriterleri tablosu bulunamadı veya boş');
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
  const updateRow = useCallback((id: string, field: keyof KabulKriterleriRow, value: string) => {
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
    setTableRows([
      createEmptyRow(1),
      createEmptyRow(2),
      createEmptyRow(3)
    ]);
    setParseResult(null);
    setIsProcessed(false);
    setIsLoading(false);
    console.log('🔄 Kabul Kriterleri verileri sıfırlandı');
  }, []);

  // Computed values
  const hasData = useMemo(() => 
    tableRows.some(row => row.kriterIs.trim() || row.aciklama.trim() || row.islemler.trim()),
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
