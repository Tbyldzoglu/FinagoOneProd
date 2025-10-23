/**
 * Amaç ve Kapsam yönetimi için React Hook
 */

import { useState, useCallback } from 'react';
import { parseAmacKapsamFromDocx, AmacKapsamResult } from '../utils/parseAmacKapsamFromDocx';

export interface UseAmacKapsamState {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: AmacKapsamResult['validation'] | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  setIsProcessed: (processed: boolean) => void;
  resetContent: () => void;
}

/**
 * Amaç ve Kapsam yönetimi için React Hook
 */
export function useAmacKapsam(): UseAmacKapsamState {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<AmacKapsamResult['validation'] | null>(null);

  /**
   * DOCX dosyasını işler ve içeriği doldurur
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setIsProcessed(false);
    setValidation(null);

    try {
      // DOCX'i parse et
      const result = await parseAmacKapsamFromDocx(file);
      
      // Sonuçları state'e kaydet
      setContent(result.content);
      setValidation(result.validation);
      setIsProcessed(true);

      // Debug için console'a log (geliştirme aşamasında)
      console.log('🎯 Amaç ve Kapsam DOCX Parse Sonucu:', {
        found: result.validation.found,
        mode: result.validation.mode,
        contentLength: result.content.length,
        matchedLabels: result.validation.matchedLabels,
        errors: result.validation.errors,
        warnings: result.validation.warnings
      });

    } catch (error) {
      // Parse hatası durumunda validation'a hata ekle
      setValidation({
        found: false,
        mode: "strict",
        errors: [`dosya_isleme_hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: [],
        matchedLabels: []
      });
      setIsProcessed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * İçeriği manuel olarak günceller
   */
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    // İçerik güncellendiğinde otomatik olarak processed yap
    if (newContent && newContent.trim()) {
      setIsProcessed(true);
      setValidation({
        found: true,
        mode: "strict",
        errors: [],
        warnings: [],
        matchedLabels: ['manual_load']
      });
    }
  }, []);

  /**
   * İşlenme durumunu manuel olarak set eder
   */
  const setIsProcessedManually = useCallback((processed: boolean) => {
    setIsProcessed(processed);
  }, []);

  /**
   * İçeriği sıfırlar
   */
  const resetContent = useCallback(() => {
    setContent('');
    setValidation(null);
    setIsProcessed(false);
    setIsLoading(false);
  }, []);

  return {
    content,
    isLoading,
    isProcessed,
    validation,
    processFile,
    updateContent,
    setIsProcessed: setIsProcessedManually,
    resetContent
  };
}
