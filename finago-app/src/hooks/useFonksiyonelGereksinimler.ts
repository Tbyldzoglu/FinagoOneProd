import { useState, useCallback } from 'react';
import { parseFonksiyonelGereksinimlerFromDocx } from '../utils/parseFonksiyonelGereksinimlerFromDocx';

interface FonksiyonelGereksinimlerValidation {
  found: boolean;
  mode: 'strict' | 'scan';
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

interface UseFonksiyonelGereksinimlerReturn {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: FonksiyonelGereksinimlerValidation | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  setIsProcessed: (processed: boolean) => void;
  resetContent: () => void;
}

export function useFonksiyonelGereksinimler(): UseFonksiyonelGereksinimlerReturn {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<FonksiyonelGereksinimlerValidation | null>(null);

  const processFile = useCallback(async (file: File) => {
    console.log('🔍 Fonksiyonel Gereksinimler DOCX Parse Başlıyor:', file.name);
    
    setIsLoading(true);
    try {
      const result = await parseFonksiyonelGereksinimlerFromDocx(file);
      
      console.log('🎯 Fonksiyonel Gereksinimler DOCX Parse Sonucu:', result);
      
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
      console.error('❌ Fonksiyonel Gereksinimler Parse Hatası:', error);
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
    console.log('🔄 Fonksiyonel Gereksinimler hook reset ediliyor');
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
