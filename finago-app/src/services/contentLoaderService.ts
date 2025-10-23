/**
 * Content Loader Service
 * Modal içeriklerini localStorage'dan alır
 */

export const getContentFromStorage = (sectionId: string): string => {
  const storageKey = `${sectionId.replace('-', '_')}_content`;
  return localStorage.getItem(storageKey) || '';
};

export const getAllModalContentsFromStorage = () => {
  const contents: { [key: string]: string } = {};
  
  // Text-based modallar - SectionChatModal'da desteklenen tüm modallar
  const textModalIds = [
    'amac-kapsam',
    'mevcut-isleyis', 
    'planlanan-isleyis',
    'fonksiyonel-gereksinimler',
    'ekran-gereksinimleri',
    'x-ekrani',
    'task-is-akisi',
    'conversation-migration',
    'diagram-akislar',
    'muhasebe',
    'x-islemi-muhasebe-deseni',
    'x-islemi-kayit-kurallari',
    'x-islemi-vergi-komisyon',
    'x-islemi-muhasebe-senaryolari',
    'x-islemi-ornek-kayitlar',
    'fonksiyonel-olmayan-gereksinimler',
    'kimlik-dogrulama-log',
    'kapsam-disinda',
    'ekler'
  ];

  textModalIds.forEach(modalId => {
    const content = getContentFromStorage(modalId);
    if (content && content.trim()) {
      contents[modalId] = content;
    }
  });

  return contents;
};
