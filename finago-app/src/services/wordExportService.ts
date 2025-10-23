/**
 * Word Export Service
 * Frontend'den word export API'lerini çağırmak için
 */

const API_BASE_URL = process.env.REACT_APP_DATABASE_API_URL;

export interface WordExportResponse {
  success: boolean;
  message?: string;
  fileName?: string;
  downloadPath?: string;
  dataCount?: number;
  error?: string;
}

export interface TemplateListResponse {
  success: boolean;
  templates: string[];
  error?: string;
}

/**
 * Dokümanı Word formatında export et
 */
export const exportDocumentToWord = async (
  documentName: string, 
  userId: string = 'default',
  templateFileName: string = 'Analiz Güncel verisyon v3.docx'
): Promise<WordExportResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/word-export/${encodeURIComponent(documentName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        templateFileName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Word export hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Word dosyasını indir
 */
export const downloadWordFile = async (fileName: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/word-export/download/${fileName}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Blob olarak indir
    const blob = await response.blob();
    
    // Download link oluştur
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Download'ı başlat
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Dosya indirme hatası:', error);
    throw error;
  }
};

/**
 * Mevcut template'leri listele
 */
export const getAvailableTemplates = async (): Promise<TemplateListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/word-export/templates`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Template listesi hatası:', error);
    return {
      success: false,
      templates: [],
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Dokümanı export et ve hemen indir
 */
export const exportAndDownload = async (
  documentName: string,
  userId: string = 'default',
  templateFileName: string = 'Analiz Güncel verisyon v3.docx'
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Önce export et
    const exportResult = await exportDocumentToWord(documentName, userId, templateFileName);
    
    if (!exportResult.success) {
      return {
        success: false,
        error: exportResult.error || 'Export başarısız'
      };
    }

    // Export başarılıysa indir
    if (exportResult.fileName) {
      await downloadWordFile(exportResult.fileName);
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Dosya adı alınamadı'
      };
    }

  } catch (error) {
    console.error('Export ve download hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};
