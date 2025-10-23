import { useState, useCallback } from 'react';
import { parseEkranGereksinimlerFromDocx } from '../utils/parseEkranGereksinimlerFromDocx';

interface EkranGereksinimlerValidation {
  found: boolean;
  mode: 'strict' | 'scan';
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

interface UseEkranGereksinimlerReturn {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: EkranGereksinimlerValidation | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  setIsProcessed: (processed: boolean) => void;
  resetContent: () => void;
}

export function useEkranGereksinimleri(): UseEkranGereksinimlerReturn {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<EkranGereksinimlerValidation | null>(null);

  const processFile = useCallback(async (file: File) => {
    console.log('🔍 Ekran Gereksinimleri DOCX Parse Başlıyor:', file.name);
    
    setIsLoading(true);
    try {
      const result = await parseEkranGereksinimlerFromDocx(file);
      
      console.log('🎯 Ekran Gereksinimleri DOCX Parse Sonucu:', result);
      
      setContent(result.content);
      setValidation({
        found: result.found,
        mode: result.mode,
        contentLength: result.contentLength,
        matchedLabels: result.matchedLabels,
        errors: result.errors,
        warnings: result.warnings
      });
      
      setIsProcessed(true);
    } catch (error) {
      console.error('❌ Ekran Gereksinimleri Parse Hatası:', error);
      setValidation({
        found: false,
        mode: 'strict',
        contentLength: 0,
        matchedLabels: [],
        errors: [`Parse hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: []
      });
      setIsProcessed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    // İçerik güncellendiğinde otomatik olarak processed yap
    if (newContent && newContent.trim()) {
      setIsProcessed(true);
      setValidation({
        found: true,
        mode: "strict",
        contentLength: newContent.length,
        matchedLabels: ['manual_load'],
        errors: [],
        warnings: []
      });
    }
  }, []);

  const resetContent = useCallback(() => {
    console.log('🔄 Ekran Gereksinimleri hook reset ediliyor - Daha spesifik arama ile');
    setContent('');
    setIsLoading(false);
    setIsProcessed(false);
    setValidation(null);
  }, []);

  return {
    content,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateContent,
    setIsProcessed,
    resetContent
  };
}
