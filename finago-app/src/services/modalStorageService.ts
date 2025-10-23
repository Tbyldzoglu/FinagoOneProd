/**
 * Modal Storage Service
 * Tüm modallar için localStorage desteği
 */

// Modal data'sını localStorage'a kaydet
export const saveModalToStorage = (modalName: string, data: any) => {
  const storageKey = `${modalName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_data`;
  localStorage.setItem(storageKey, JSON.stringify(data));
  console.log(`💾 ${modalName} localStorage'a kaydedildi: ${storageKey}`);
};

// Modal data'sını localStorage'dan al
export const getModalFromStorage = (modalName: string) => {
  const storageKey = `${modalName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_data`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : null;
};

// Modal'ın content'i var mı kontrol et
export const hasModalContent = (modalName: string, hookData: any) => {
  const storedData = getModalFromStorage(modalName);
  const data = storedData || hookData;
  
  if (!data) return false;
  
  // Object tipinde data (fields, formData)
  if (typeof data === 'object' && !Array.isArray(data)) {
    return Object.values(data).some(value => 
      value && (typeof value === 'string' ? value.trim() : true)
    );
  }
  
  // Array tipinde data (rows, tableRows, entegrasyonlar, vs.)
  if (Array.isArray(data)) {
    return data.length > 0;
  }
  
  // String tipinde data
  if (typeof data === 'string') {
    return data.trim().length > 0;
  }
  
  return false;
};

// Tüm modallar için localStorage key'lerini temizle
export const clearAllModalStorage = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('_data') || key.includes('_fields') || key.includes('_content')) {
      localStorage.removeItem(key);
    }
  });
  console.log('🗑️ Tüm modal localStorage verileri temizlendi');
};
