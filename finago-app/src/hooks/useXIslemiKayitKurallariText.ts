import { useState, useCallback } from 'react';
import { parseXIslemiKayitKurallariTextFromDocx } from '../utils/parseXIslemiKayitKurallariTextFromDocx';

interface XIslemiKayitKurallariTextValidation {
  found: boolean;
  mode: 'strict' | 'scan';
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

interface UseXIslemiKayitKurallariTextReturn {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: XIslemiKayitKurallariTextValidation | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  resetContent: () => void;
}

export function useXIslemiKayitKurallariText(): UseXIslemiKayitKurallariTextReturn {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<XIslemiKayitKurallariTextValidation | null>(null);

  const processFile = useCallback(async (file: File) => {
    console.log('🔍 X İşlemi Kayıt Kuralları Metni DOCX Parse Başlıyor:', file.name);
    
    setIsLoading(true);
    try {
      const result = await parseXIslemiKayitKurallariTextFromDocx(file);
      
      console.log('🎯 X İşlemi Kayıt Kuralları Metni DOCX Parse Sonucu:', result);
      
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
      console.error('❌ X İşlemi Kayıt Kuralları Metni Parse Hatası:', error);
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
    console.log('🔄 X İşlemi Kayıt Kuralları Metni hook reset ediliyor');
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
