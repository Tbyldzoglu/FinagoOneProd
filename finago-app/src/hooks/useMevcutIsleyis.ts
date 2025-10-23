/**
 * Mevcut İşleyiş yönetimi için React Hook
 */

import { useState, useCallback } from 'react';
import { parseMevcutIsleyisFromDocx, MevcutIsleyisResult } from '../utils/parseMevcutIsleyisFromDocx';

export interface UseMevcutIsleyisState {
  content: string;
  isLoading: boolean;
  isProcessed: boolean;
  validation: MevcutIsleyisResult['validation'] | null;
  processFile: (file: File) => Promise<void>;
  updateContent: (content: string) => void;
  setIsProcessed: (processed: boolean) => void;
  resetContent: () => void;
}

/**
 * Mevcut İşleyiş yönetimi için React Hook
 */
export function useMevcutIsleyis(): UseMevcutIsleyisState {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [validation, setValidation] = useState<MevcutIsleyisResult['validation'] | null>(null);

  /**
   * DOCX dosyasını işler ve içeriği doldurur
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setIsProcessed(false);
    setValidation(null);

    try {
      // DOCX'i parse et
      const result = await parseMevcutIsleyisFromDocx(file);
      
      // Sonuçları state'e kaydet
      setContent(result.content);
      setValidation(result.validation);
      setIsProcessed(true);

      // Debug için console'a log (geliştirme aşamasında)
      console.log('🎯 Mevcut İşleyiş DOCX Parse Sonucu:', {
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
    setIsProcessed,
    resetContent
  };
}
