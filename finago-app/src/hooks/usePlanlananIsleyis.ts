import { useState, useCallback } from 'react';
import { parsePlanlananIsleyisFromDocx } from '../utils/parsePlanlananIsleyisFromDocx';

interface PlanlananIsleyisValidation {
  found: boolean;
  mode: 'strict' | 'scan';
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

interface UsePlanlananIsleyisReturn {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: PlanlananIsleyisValidation | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  setIsProcessed: (processed: boolean) => void;
  resetContent: () => void;
}

export function usePlanlananIsleyis(): UsePlanlananIsleyisReturn {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<PlanlananIsleyisValidation | null>(null);

  const processFile = useCallback(async (file: File) => {
    console.log('🔍 Planlanan İşleyiş DOCX Parse Başlıyor:', file.name);
    
    setIsLoading(true);
    try {
      const result = await parsePlanlananIsleyisFromDocx(file);
      
      console.log('🎯 Planlanan İşleyiş DOCX Parse Sonucu:', result);
      
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
      console.error('❌ Planlanan İşleyiş Parse Hatası:', error);
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
    console.log('🔄 Planlanan İşleyiş hook reset ediliyor');
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
