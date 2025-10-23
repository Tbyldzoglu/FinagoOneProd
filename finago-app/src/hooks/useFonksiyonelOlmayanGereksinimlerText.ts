import { useState, useCallback } from 'react';
import { parseFonksiyonelOlmayanGereksinimlerTextFromDocx } from '../utils/parseFonksiyonelOlmayanGereksinimlerTextFromDocx';

interface FonksiyonelOlmayanGereksinimlerTextValidation {
  found: boolean;
  mode: 'strict' | 'scan';
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

interface UseFonksiyonelOlmayanGereksinimlerTextReturn {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: FonksiyonelOlmayanGereksinimlerTextValidation | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  resetContent: () => void;
}

export function useFonksiyonelOlmayanGereksinimlerText(): UseFonksiyonelOlmayanGereksinimlerTextReturn {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<FonksiyonelOlmayanGereksinimlerTextValidation | null>(null);

  const processFile = useCallback(async (file: File) => {
    console.log('🔍 Fonksiyonel Olmayan Gereksinimler Metni DOCX Parse Başlıyor:', file.name);
    
    setIsLoading(true);
    try {
      const result = await parseFonksiyonelOlmayanGereksinimlerTextFromDocx(file);
      
      console.log('🎯 Fonksiyonel Olmayan Gereksinimler Metni DOCX Parse Sonucu:', result);
      
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
      console.error('❌ Fonksiyonel Olmayan Gereksinimler Metni Parse Hatası:', error);
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
  }, []);

  const resetContent = useCallback(() => {
    console.log('🔄 Fonksiyonel Olmayan Gereksinimler Metni hook reset ediliyor');
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
    resetContent
  };
}
