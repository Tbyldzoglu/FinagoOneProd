import { useState, useCallback } from 'react';
import { parseTaskIsAkisiTextFromDocx } from '../utils/parseTaskIsAkisiTextFromDocx';

interface TaskIsAkisiTextValidation {
  found: boolean;
  mode: 'strict' | 'scan';
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

interface UseTaskIsAkisiTextReturn {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: TaskIsAkisiTextValidation | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  setIsProcessed: (processed: boolean) => void;
  resetContent: () => void;
}

export function useTaskIsAkisiText(): UseTaskIsAkisiTextReturn {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<TaskIsAkisiTextValidation | null>(null);

  const processFile = useCallback(async (file: File) => {
    console.log('🔍 Task İş Akışı Metni DOCX Parse Başlıyor:', file.name);
    
    setIsLoading(true);
    try {
      const result = await parseTaskIsAkisiTextFromDocx(file);
      
      console.log('🎯 Task İş Akışı Metni DOCX Parse Sonucu:', result);
      
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
      console.error('❌ Task İş Akışı Metni Parse Hatası:', error);
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
    console.log('🔄 Task İş Akışı Metni hook reset ediliyor');
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
