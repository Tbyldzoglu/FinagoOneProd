/**
 * Modal Change Tracker Service
 * 
 * Faz1 modallarındaki değişiklikleri takip eder
 * Her modalın son değişiklik ve son kaydetme zamanını tutar
 * Word indirme öncesi kaydedilmemiş değişiklikleri kontrol eder
 */

// Modal tanımları - Tüm Faz1 modalları
export const FAZ1_MODALS = [
  { id: 'talep-bilgileri', name: 'Talep Bilgileri' },
  { id: 'talep-degerlendirmesi', name: 'Talep Değerlendirmesi' },
  { id: 'amac-kapsam', name: 'Amaç ve Kapsam' },
  { id: 'mevcut-isleyis', name: 'Mevcut İşleyiş' },
  { id: 'planlanan-isleyis', name: 'Planlanan İşleyiş' },
  { id: 'fonksiyonel-gereksinimler', name: 'Fonksiyonel Gereksinimler' },
  { id: 'ekran-gereksinimleri', name: 'Ekran Gereksinimleri' },
  { id: 'ekran-tasarimlari', name: 'Ekran Tasarımları' },
  { id: 'x-ekrani', name: 'X Ekranı' },
  { id: 'task-is-akisi', name: 'Task İş Akışı' },
  { id: 'tasklar-batchlar', name: 'Tasklar ve Batchlar' },
  { id: 'entegrasyonlar', name: 'Entegrasyonlar' },
  { id: 'mesajlar', name: 'Mesajlar' },
  { id: 'parametreler', name: 'Parametreler' },
  { id: 'conversation-migration', name: 'Conversion ve Migration' },
  { id: 'diagram-akislar', name: 'Diagram ve Akışlar' },
  { id: 'muhasebe', name: 'Muhasebe' },
  { id: 'x-islemi-muhasebe', name: 'X İşlemi Muhasebe' },
  { id: 'x-islemi-muhasebe-deseni', name: 'X İşlemi Muhasebe Deseni' },
  { id: 'x-islemi-kayit-kurallari', name: 'X İşlemi Kayıt Kuralları' },
  { id: 'x-islemi-vergi-komisyon', name: 'X İşlemi Vergi Komisyon' },
  { id: 'x-islemi-muhasebe-senaryolari', name: 'X İşlemi Muhasebe Senaryoları' },
  { id: 'x-islemi-ornek-kayitlar', name: 'X İşlemi Örnek Kayıtlar' },
  { id: 'fonksiyonel-olmayan-gereksinimler', name: 'Fonksiyonel Olmayan Gereksinimler' },
  { id: 'kimlik-dogrulama-log', name: 'Kimlik Doğrulama ve Log' },
  { id: 'yetkilendirme-onay', name: 'Yetkilendirme ve Onay' },
  { id: 'veri-kritikligi', name: 'Veri Kritikliği' },
  { id: 'paydaslar-kullanicilar', name: 'Paydaşlar ve Kullanıcılar' },
  { id: 'kapsam-disinda', name: 'Kapsam Dışında' },
  { id: 'kabul-kriterleri', name: 'Kabul Kriterleri' },
  { id: 'onaylar', name: 'Onaylar' },
  { id: 'ekler', name: 'Ekler' }
];

/**
 * Modal içeriği değiştirildiğinde çağrılır
 * localStorage'a son değişiklik zamanını yazar
 */
export const markModalAsModified = (modalId: string): void => {
  const timestamp = Date.now();
  localStorage.setItem(`modal_${modalId}_modified`, timestamp.toString());
  
  console.log(`📝 Modal değiştirildi: ${modalId} (${new Date(timestamp).toLocaleTimeString()})`);
};

/**
 * Modal kaydedildiğinde çağrılır
 * localStorage'a son kaydetme zamanını yazar
 */
export const markModalAsSaved = (modalId: string): void => {
  const timestamp = Date.now();
  localStorage.setItem(`modal_${modalId}_saved`, timestamp.toString());
  
  // Modified timestamp'i sil veya saved ile aynı yap
  localStorage.setItem(`modal_${modalId}_modified`, timestamp.toString());
  
  console.log(`✅ Modal kaydedildi: ${modalId} (${new Date(timestamp).toLocaleTimeString()})`);
};

/**
 * Belirli bir modalda kaydedilmemiş değişiklik var mı kontrol eder
 */
export const isModalDirty = (modalId: string): boolean => {
  const modifiedStr = localStorage.getItem(`modal_${modalId}_modified`);
  const savedStr = localStorage.getItem(`modal_${modalId}_saved`);
  
  // Hiç değiştirilmemişse dirty değil
  if (!modifiedStr) return false;
  
  const modified = parseInt(modifiedStr, 10);
  const saved = savedStr ? parseInt(savedStr, 10) : 0;
  
  // Modified timestamp, saved timestamp'den büyükse dirty
  return modified > saved;
};

/**
 * Tüm modallarda kaydedilmemiş değişiklikleri kontrol eder
 * @returns Kaydedilmemiş değişikliği olan modal isimleri
 */
export const hasUnsavedChanges = (): { count: number; modals: string[] } => {
  const unsavedModals: string[] = [];
  
  FAZ1_MODALS.forEach(modal => {
    if (isModalDirty(modal.id)) {
      unsavedModals.push(modal.name);
    }
  });
  
  return {
    count: unsavedModals.length,
    modals: unsavedModals
  };
};

/**
 * Tüm modal değişiklik kayıtlarını temizler
 * (Örn: Yeni doküman başlatılırken)
 */
export const clearAllChangeTracking = (): void => {
  FAZ1_MODALS.forEach(modal => {
    localStorage.removeItem(`modal_${modal.id}_modified`);
    localStorage.removeItem(`modal_${modal.id}_saved`);
  });
  
  console.log('🧹 Tüm modal değişiklik kayıtları temizlendi');
};

/**
 * Tüm modallara "kaydedildi" işareti koyar
 * (Örn: Global save sonrasında)
 */
export const markAllAsSaved = (): void => {
  const timestamp = Date.now();
  
  FAZ1_MODALS.forEach(modal => {
    localStorage.setItem(`modal_${modal.id}_saved`, timestamp.toString());
    localStorage.setItem(`modal_${modal.id}_modified`, timestamp.toString());
  });
  
  console.log('✅ Tüm modaller kaydedildi olarak işaretlendi');
};

/**
 * Debug için - tüm modal durumlarını göster
 */
export const debugModalStates = (): void => {
  console.log('🔍 Modal Durumları:');
  console.log('═'.repeat(60));
  
  FAZ1_MODALS.forEach(modal => {
    const isDirty = isModalDirty(modal.id);
    const modifiedStr = localStorage.getItem(`modal_${modal.id}_modified`);
    const savedStr = localStorage.getItem(`modal_${modal.id}_saved`);
    
    console.log(`${isDirty ? '❌' : '✅'} ${modal.name.padEnd(35)} | Modified: ${modifiedStr ? new Date(parseInt(modifiedStr)).toLocaleTimeString() : 'Yok'} | Saved: ${savedStr ? new Date(parseInt(savedStr)).toLocaleTimeString() : 'Yok'}`);
  });
  
  console.log('═'.repeat(60));
  const { count, modals } = hasUnsavedChanges();
  console.log(`Toplam kaydedilmemiş değişiklik: ${count}`);
  if (count > 0) {
    console.log('Modaller:', modals.join(', '));
  }
};

