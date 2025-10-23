/**
 * Global Save Service
 * Tüm modalların kaydet fonksiyonlarını tek seferde çalıştırır
 */

import { updateAnalizFaz1 } from './analizService';

export interface GlobalSaveResult {
  success: boolean;
  savedModals: string[];
  failedModals: string[];
  errors: string[];
}

export interface ModalSaveFunction {
  modalName: string;
  saveFunction: () => Promise<void>;
  hasContent: () => boolean;
}

/**
 * Tüm modalların kaydet fonksiyonlarını çalıştırır
 */
export const saveAllModalContents = async (
  selectedFile: File,
  modalSaveFunctions: ModalSaveFunction[]
): Promise<GlobalSaveResult> => {
  const result: GlobalSaveResult = {
    success: true,
    savedModals: [],
    failedModals: [],
    errors: []
  };

  if (!selectedFile) {
    result.success = false;
    result.errors.push('Doküman seçilmemiş');
    return result;
  }

  console.log('🚀 Global kaydetme başlatılıyor:', selectedFile.name);

  for (const modalSave of modalSaveFunctions) {
    try {
      // İçerik var mı kontrol et
      if (!modalSave.hasContent()) {
        console.log(`ℹ️ ${modalSave.modalName} boş, atlanıyor`);
        continue;
      }

      console.log(`💾 ${modalSave.modalName} kaydediliyor...`);
      await modalSave.saveFunction();
      
      result.savedModals.push(modalSave.modalName);
      console.log(`✅ ${modalSave.modalName} başarıyla kaydedildi`);
      
    } catch (error) {
      result.failedModals.push(modalSave.modalName);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      result.errors.push(`${modalSave.modalName}: ${errorMessage}`);
      console.error(`❌ ${modalSave.modalName} kaydetme hatası:`, {
        error: error,
        errorMessage: errorMessage,
        modalName: modalSave.modalName
      });
    }
  }

  result.success = result.failedModals.length === 0;

  console.log('🎉 Global kaydetme tamamlandı:', {
    savedCount: result.savedModals.length,
    failedCount: result.failedModals.length,
    success: result.success
  });

  return result;
};
