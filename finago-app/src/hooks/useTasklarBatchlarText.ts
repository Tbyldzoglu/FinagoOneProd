import { useState, useCallback } from 'react';
import { parseTasklarBatchlarTextFromDocx } from '../utils/parseTasklarBatchlarTextFromDocx';

interface TasklarBatchlarTextValidation {
  found: boolean;
  mode: 'strict' | 'scan';
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

interface UseTasklarBatchlarTextReturn {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: TasklarBatchlarTextValidation | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  resetContent: () => void;
}

export function useTasklarBatchlarText(): UseTasklarBatchlarTextReturn {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<TasklarBatchlarTextValidation | null>(null);

  const processFile = useCallback(async (file: File) => {
    console.log('🔍 Tasklar/Batchlar Metni DOCX Parse Başlıyor:', file.name);
    
    setIsLoading(true);
    try {
      const result = await parseTasklarBatchlarTextFromDocx(file);
      
      console.log('🎯 Tasklar/Batchlar Metni DOCX Parse Sonucu:', result);
      
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
      console.error('❌ Tasklar/Batchlar Metni Parse Hatası:', error);
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
    console.log('🔄 Tasklar/Batchlar Metni hook reset ediliyor');
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
