/**
 * Database'den LLM Analiz verilerini yükleme servisi
 * Faz1 tablosundan son kaydı alıp hook'lara yükler
 */

import { getLatestAnalizFaz1 } from './analizService';

export interface LoadedAnalysisData {
  success: boolean;
  data?: {
    amac_kapsam?: any;
    talep_bilgileri?: any;
    dokuman_tarihcesi?: any;
    talep_degerlendirmesi?: any;
    mevcut_isleyis?: any;
    planlanan_isleyis?: any;
    fonksiyonel_gereksinimler?: any;
    ekran_gereksinimleri?: any;
    x_ekrani?: any;
    ekran_tasarimlari?: any;
    tasklar_batchlar?: any;
    task_is_akisi?: any;
    entegrasyonlar?: any;
    mesajlar?: any;
    parametreler?: any;
    conversation_migration?: any;
    diagram_akislar?: any;
    muhasebe?: any;
    x_islemi_muhasebesi?: any;
    x_islemi_muhasebe_deseni?: any;
    case1?: any;
    x_islemi_kayit_kurallari?: any;
    x_islemi_vergi_komisyon?: any;
    x_islemi_muhasebe_senaryolari?: any;
    x_islemi_ornek_kayitlar?: any;
    fonksiyonel_olmayan_gereksinimler?: any;
    kimlik_dogrulama_log?: any;
    yetkilendirme_onay?: any;
    veri_kritikligi?: any;
    paydaslar_kullanicilar?: any;
    kapsam_disinda?: any;
    kabul_kriterleri?: any;
    onaylar?: any;
    ekler?: any;
    yuklenen_dokuman?: string;
  };
  error?: string;
}

/**
 * Database'den son analiz kaydını yükler ve parse eder
 */
export const loadLatestAnalysisData = async (): Promise<LoadedAnalysisData> => {
  try {
    console.log('📋 Database\'den son analiz kaydı yükleniyor...');
    
    const response = await getLatestAnalizFaz1();
    
    if (!response.success || !response.data) {
      console.log('⚠️ Database\'de analiz kaydı bulunamadı');
      return {
        success: false,
        error: 'Analiz kaydı bulunamadı'
      };
    }

    const rawData = response.data;
    console.log('📊 Ham database verisi alındı:', rawData.yuklenen_dokuman);

    // JSON string'leri parse et
    const parsedData: any = {};
    
    // Her alan için JSON parse işlemi
    const fields = [
      'amac_kapsam', 'talep_bilgileri', 'dokuman_tarihcesi', 'talep_degerlendirmesi',
      'mevcut_isleyis', 'planlanan_isleyis', 'fonksiyonel_gereksinimler', 
      'ekran_gereksinimleri', 'x_ekrani', 'ekran_tasarimlari', 'tasklar_batchlar',
      'task_is_akisi', 'entegrasyonlar', 'mesajlar', 'parametreler',
      'conversation_migration', 'diagram_akislar', 'muhasebe', 'x_islemi_muhasebesi',
      'x_islemi_muhasebe_deseni', 'case1', 'x_islemi_kayit_kurallari',
      'x_islemi_vergi_komisyon', 'x_islemi_muhasebe_senaryolari', 'x_islemi_ornek_kayitlar',
      'fonksiyonel_olmayan_gereksinimler', 'kimlik_dogrulama_log', 'yetkilendirme_onay',
      'veri_kritikligi', 'paydaslar_kullanicilar', 'kapsam_disinda',
      'kabul_kriterleri', 'onaylar', 'ekler'
    ];

    fields.forEach(field => {
      const fieldValue = (rawData as any)[field];
      console.log(`🔍 DEBUG - Field: ${field}, Value: ${fieldValue ? 'DOLU' : 'BOŞ'} (${typeof fieldValue})`);
      
      if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim()) {
        try {
          parsedData[field] = JSON.parse(fieldValue);
          console.log(`✅ ${field} parse edildi`);
        } catch (parseError) {
          console.warn(`⚠️ ${field} JSON parse hatası:`, parseError);
          // Parse edilemeyen veriyi raw olarak kaydet
          parsedData[field] = {
            title: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            content: fieldValue,
            isProcessed: false,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // Boş alan için hiçbir şey yapma - parsedData[field] undefined kalacak
        console.log(`ℹ️ ${field} boş, atlanıyor`);
      }
    });

    parsedData.yuklenen_dokuman = rawData.yuklenen_dokuman;

    return {
      success: true,
      data: parsedData
    };

  } catch (error) {
    console.error('❌ Database veri yükleme hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Hook'lara veri yükleme utility fonksiyonu
 */
export const loadDataToHooks = (data: LoadedAnalysisData['data'], hooks: any) => {
  if (!data) return;

  console.log('🔄 Hook\'lara veri yükleniyor...');
  
  // DEBUG: Gelen data'yı kontrol et
  console.log('🔍 DEBUG - loadDataToHooks gelen data.muhasebe:', data.muhasebe);
  console.log('🔍 DEBUG - loadDataToHooks gelen data.x_islemi_muhasebe_deseni:', data.x_islemi_muhasebe_deseni);
  console.log('🔍 DEBUG - loadDataToHooks gelen data.x_islemi_kayit_kurallari:', data.x_islemi_kayit_kurallari);

  // Amaç Kapsam
  if (data.amac_kapsam && hooks.amacKapsamHook) {
    console.log('🔍 DEBUG - Amaç kapsam verisi:', data.amac_kapsam);
    
    // Content JSON string içindeyse parse et
    let actualContent = '';
    if (data.amac_kapsam.content) {
      if (data.amac_kapsam.content.startsWith('```json')) {
        // JSON string formatında geliyorsa parse et
        try {
          const jsonMatch = data.amac_kapsam.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ JSON parse hatası, raw content kullanılıyor');
          actualContent = data.amac_kapsam.content;
        }
      } else {
        actualContent = data.amac_kapsam.content;
      }
    }
    
    console.log('🔍 DEBUG - Hook\'a gönderilen content:', actualContent.substring(0, 100) + '...');
    
    // Hook'a yükle
    hooks.amacKapsamHook.updateContent(actualContent);
    
    // localStorage'a da kaydet (backup olarak)
    localStorage.setItem('amac_kapsam_content', actualContent);
    
    console.log('✅ Amaç Kapsam hook\'una ve localStorage\'a veri yüklendi');
  }

  // Mevcut İşleyiş
  if (data.mevcut_isleyis && hooks.mevcutIsleyisHook) {
    console.log('🔍 DEBUG - Mevcut işleyiş verisi:', data.mevcut_isleyis);
    
    let actualContent = '';
    if (data.mevcut_isleyis.content) {
      if (data.mevcut_isleyis.content.startsWith('```json')) {
        try {
          const jsonMatch = data.mevcut_isleyis.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Mevcut işleyiş JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Mevcut işleyiş JSON parse hatası, raw content kullanılıyor');
          actualContent = data.mevcut_isleyis.content;
        }
      } else {
        actualContent = data.mevcut_isleyis.content;
      }
    }
    
    hooks.mevcutIsleyisHook.updateContent(actualContent);
    localStorage.setItem('mevcut_isleyis_content', actualContent);
    console.log('✅ Mevcut İşleyiş hook\'una veri yüklendi');
  }

  // Planlanan İşleyiş
  if (data.planlanan_isleyis && hooks.planlananIsleyisHook) {
    console.log('🔍 DEBUG - Planlanan işleyiş verisi:', data.planlanan_isleyis);
    
    let actualContent = '';
    if (data.planlanan_isleyis.content) {
      if (data.planlanan_isleyis.content.startsWith('```json')) {
        try {
          const jsonMatch = data.planlanan_isleyis.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Planlanan işleyiş JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Planlanan işleyiş JSON parse hatası, raw content kullanılıyor');
          actualContent = data.planlanan_isleyis.content;
        }
      } else {
        actualContent = data.planlanan_isleyis.content;
      }
    }
    
    hooks.planlananIsleyisHook.updateContent(actualContent);
    localStorage.setItem('planlanan_isleyis_content', actualContent);
    console.log('✅ Planlanan İşleyiş hook\'una veri yüklendi');
  }

  // Fonksiyonel Gereksinimler
  if (data.fonksiyonel_gereksinimler && hooks.fonksiyonelGereksinimlerHook) {
    console.log('🔍 DEBUG - Fonksiyonel Gereksinimler verisi:', data.fonksiyonel_gereksinimler);
    
    let actualContent = '';
    if (data.fonksiyonel_gereksinimler.content) {
      if (data.fonksiyonel_gereksinimler.content.startsWith('```json')) {
        try {
          const jsonMatch = data.fonksiyonel_gereksinimler.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Fonksiyonel Gereksinimler JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Fonksiyonel Gereksinimler JSON parse hatası, raw content kullanılıyor');
          actualContent = data.fonksiyonel_gereksinimler.content;
        }
      } else {
        actualContent = data.fonksiyonel_gereksinimler.content;
      }
    }
    
    hooks.fonksiyonelGereksinimlerHook.updateContent(actualContent);
    localStorage.setItem('fonksiyonel_gereksinimler_content', actualContent);
    console.log('✅ Fonksiyonel Gereksinimler hook\'una veri yüklendi');
  }

  // Ekran Gereksinimleri
  if (data.ekran_gereksinimleri && hooks.ekranGereksinimlerHook) {
    console.log('🔍 DEBUG - Ekran Gereksinimleri verisi:', data.ekran_gereksinimleri);
    
    let actualContent = '';
    if (data.ekran_gereksinimleri.content) {
      if (data.ekran_gereksinimleri.content.startsWith('```json')) {
        try {
          const jsonMatch = data.ekran_gereksinimleri.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Ekran Gereksinimleri JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Ekran Gereksinimleri JSON parse hatası, raw content kullanılıyor');
          actualContent = data.ekran_gereksinimleri.content;
        }
      } else {
        actualContent = data.ekran_gereksinimleri.content;
      }
    }
    
    hooks.ekranGereksinimlerHook.updateContent(actualContent);
    localStorage.setItem('ekran_gereksinimleri_content', actualContent);
    console.log('✅ Ekran Gereksinimleri hook\'una veri yüklendi');
  }

  // X Ekranı
  if (data.x_ekrani && hooks.xEkraniHook) {
    console.log('🔍 DEBUG - X Ekranı verisi:', data.x_ekrani);
    
    let actualContent = '';
    if (data.x_ekrani.content) {
      if (data.x_ekrani.content.startsWith('```json')) {
        try {
          const jsonMatch = data.x_ekrani.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - X Ekranı JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ X Ekranı JSON parse hatası, raw content kullanılıyor');
          actualContent = data.x_ekrani.content;
        }
      } else {
        actualContent = data.x_ekrani.content;
      }
    }
    
    hooks.xEkraniHook.updateContent(actualContent);
    localStorage.setItem('x_ekrani_content', actualContent);
    console.log('✅ X Ekranı hook\'una veri yüklendi');
  }

  // Task İş Akışı
  if (data.task_is_akisi && hooks.taskIsAkisiHook) {
    console.log('🔍 DEBUG - Task İş Akışı verisi:', data.task_is_akisi);
    
    let actualContent = '';
    if (data.task_is_akisi.content) {
      if (data.task_is_akisi.content.startsWith('```json')) {
        try {
          const jsonMatch = data.task_is_akisi.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Task İş Akışı JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Task İş Akışı JSON parse hatası, raw content kullanılıyor');
          actualContent = data.task_is_akisi.content;
        }
      } else {
        actualContent = data.task_is_akisi.content;
      }
    }
    
    hooks.taskIsAkisiHook.updateContent(actualContent);
    localStorage.setItem('task_is_akisi_content', actualContent);
    console.log('✅ Task İş Akışı hook\'una veri yüklendi');
  }

  // Conversion Migration
  if (data.conversation_migration && hooks.conversionMigrationHook) {
    console.log('🔍 DEBUG - Conversion Migration verisi:', data.conversation_migration);
    
    let actualContent = '';
    if (data.conversation_migration.content) {
      if (data.conversation_migration.content.startsWith('```json')) {
        try {
          const jsonMatch = data.conversation_migration.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Conversion Migration JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Conversion Migration JSON parse hatası, raw content kullanılıyor');
          actualContent = data.conversation_migration.content;
        }
      } else {
        actualContent = data.conversation_migration.content;
      }
    }
    
    hooks.conversionMigrationHook.updateContent(actualContent);
    localStorage.setItem('conversation_migration_content', actualContent);
    console.log('✅ Conversion Migration hook\'una veri yüklendi');
  }

  // Diagram Akışlar
  if (data.diagram_akislar && hooks.diagramAkislarHook) {
    console.log('🔍 DEBUG - Diagram Akışlar verisi:', data.diagram_akislar);
    
    let actualContent = '';
    if (data.diagram_akislar.content) {
      if (data.diagram_akislar.content.startsWith('```json')) {
        try {
          const jsonMatch = data.diagram_akislar.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Diagram Akışlar JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Diagram Akışlar JSON parse hatası, raw content kullanılıyor');
          actualContent = data.diagram_akislar.content;
        }
      } else {
        actualContent = data.diagram_akislar.content;
      }
    }
    
    hooks.diagramAkislarHook.updateContent(actualContent);
    localStorage.setItem('diagram_akislar_content', actualContent);
    console.log('✅ Diagram Akışlar hook\'una veri yüklendi');
  }

  // MUHASEBE MODALLARI - Çalışmayan modalları düzelt
  console.log('🔄 Muhasebe modallarına veri yükleniyor...');

  // Muhasebe
  if (data.muhasebe && hooks.muhasebeHook) {
    console.log('🔍 DEBUG - Muhasebe verisi:', data.muhasebe);
    
    let actualContent = '';
    if (data.muhasebe.content) {
      if (data.muhasebe.content.startsWith('```json')) {
        try {
          const jsonMatch = data.muhasebe.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Muhasebe JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Muhasebe JSON parse hatası, raw content kullanılıyor');
          actualContent = data.muhasebe.content;
        }
      } else {
        actualContent = data.muhasebe.content;
      }
    }
    
    hooks.muhasebeHook.updateContent(actualContent);
    localStorage.setItem('muhasebe_content', actualContent);
    console.log('✅ Muhasebe hook\'una veri yüklendi');
  }

  // X İşlemi Muhasebe Deseni
  if (data.x_islemi_muhasebe_deseni && hooks.xIslemiMuhasebeDeseniHook) {
    console.log('🔍 DEBUG - X İşlemi Muhasebe Deseni verisi:', data.x_islemi_muhasebe_deseni);
    
    let actualContent = '';
    if (data.x_islemi_muhasebe_deseni.content) {
      if (data.x_islemi_muhasebe_deseni.content.startsWith('```json')) {
        try {
          const jsonMatch = data.x_islemi_muhasebe_deseni.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - X İşlemi Muhasebe Deseni JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ X İşlemi Muhasebe Deseni JSON parse hatası, raw content kullanılıyor');
          actualContent = data.x_islemi_muhasebe_deseni.content;
        }
      } else {
        actualContent = data.x_islemi_muhasebe_deseni.content;
      }
    }
    
    hooks.xIslemiMuhasebeDeseniHook.updateContent(actualContent);
    localStorage.setItem('x_islemi_muhasebe_deseni_content', actualContent);
    console.log('✅ X İşlemi Muhasebe Deseni hook\'una veri yüklendi');
  }

  // X İşlemi Kayıt Kuralları
  if (data.x_islemi_kayit_kurallari && hooks.xIslemiKayitKurallariHook) {
    console.log('🔍 DEBUG - X İşlemi Kayıt Kuralları verisi:', data.x_islemi_kayit_kurallari);
    
    let actualContent = '';
    if (data.x_islemi_kayit_kurallari.content) {
      if (data.x_islemi_kayit_kurallari.content.startsWith('```json')) {
        try {
          const jsonMatch = data.x_islemi_kayit_kurallari.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - X İşlemi Kayıt Kuralları JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ X İşlemi Kayıt Kuralları JSON parse hatası, raw content kullanılıyor');
          actualContent = data.x_islemi_kayit_kurallari.content;
        }
      } else {
        actualContent = data.x_islemi_kayit_kurallari.content;
      }
    }
    
    hooks.xIslemiKayitKurallariHook.updateContent(actualContent);
    localStorage.setItem('x_islemi_kayit_kurallari_content', actualContent);
    console.log('✅ X İşlemi Kayıt Kuralları hook\'una veri yüklendi');
  }

  // X İşlemi Vergi Komisyon
  if (data.x_islemi_vergi_komisyon && hooks.xIslemiVergiKomisyonHook) {
    console.log('🔍 DEBUG - X İşlemi Vergi Komisyon verisi:', data.x_islemi_vergi_komisyon);
    
    let actualContent = '';
    if (data.x_islemi_vergi_komisyon.content) {
      if (data.x_islemi_vergi_komisyon.content.startsWith('```json')) {
        try {
          const jsonMatch = data.x_islemi_vergi_komisyon.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - X İşlemi Vergi Komisyon JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ X İşlemi Vergi Komisyon JSON parse hatası, raw content kullanılıyor');
          actualContent = data.x_islemi_vergi_komisyon.content;
        }
      } else {
        actualContent = data.x_islemi_vergi_komisyon.content;
      }
    }
    
    hooks.xIslemiVergiKomisyonHook.updateContent(actualContent);
    localStorage.setItem('x_islemi_vergi_komisyon_content', actualContent);
    console.log('✅ X İşlemi Vergi Komisyon hook\'una veri yüklendi');
  }

  // X İşlemi Muhasebe Senaryoları
  if (data.x_islemi_muhasebe_senaryolari && hooks.xIslemiMuhasebeSenaryolariHook) {
    console.log('🔍 DEBUG - X İşlemi Muhasebe Senaryoları verisi:', data.x_islemi_muhasebe_senaryolari);
    
    let actualContent = '';
    if (data.x_islemi_muhasebe_senaryolari.content) {
      if (data.x_islemi_muhasebe_senaryolari.content.startsWith('```json')) {
        try {
          const jsonMatch = data.x_islemi_muhasebe_senaryolari.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - X İşlemi Muhasebe Senaryoları JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ X İşlemi Muhasebe Senaryoları JSON parse hatası, raw content kullanılıyor');
          actualContent = data.x_islemi_muhasebe_senaryolari.content;
        }
      } else {
        actualContent = data.x_islemi_muhasebe_senaryolari.content;
      }
    }
    
    hooks.xIslemiMuhasebeSenaryolariHook.updateContent(actualContent);
    localStorage.setItem('x_islemi_muhasebe_senaryolari_content', actualContent);
    console.log('✅ X İşlemi Muhasebe Senaryoları hook\'una veri yüklendi');
  }

  // X İşlemi Örnek Kayıtlar
  if (data.x_islemi_ornek_kayitlar && hooks.xIslemiOrnekKayitlarHook) {
    console.log('🔍 DEBUG - X İşlemi Örnek Kayıtlar verisi:', data.x_islemi_ornek_kayitlar);
    
    let actualContent = '';
    if (data.x_islemi_ornek_kayitlar.content) {
      if (data.x_islemi_ornek_kayitlar.content.startsWith('```json')) {
        try {
          const jsonMatch = data.x_islemi_ornek_kayitlar.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - X İşlemi Örnek Kayıtlar JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ X İşlemi Örnek Kayıtlar JSON parse hatası, raw content kullanılıyor');
          actualContent = data.x_islemi_ornek_kayitlar.content;
        }
      } else {
        actualContent = data.x_islemi_ornek_kayitlar.content;
      }
    }
    
    hooks.xIslemiOrnekKayitlarHook.updateContent(actualContent);
    localStorage.setItem('x_islemi_ornek_kayitlar_content', actualContent);
    console.log('✅ X İşlemi Örnek Kayıtlar hook\'una veri yüklendi');
  }

  // Fonksiyonel Olmayan Gereksinimler
  if (data.fonksiyonel_olmayan_gereksinimler && hooks.fonksiyonelOlmayanGereksinimlerHook) {
    console.log('🔍 DEBUG - Fonksiyonel Olmayan Gereksinimler verisi:', data.fonksiyonel_olmayan_gereksinimler);
    
    let actualContent = '';
    if (data.fonksiyonel_olmayan_gereksinimler.content) {
      if (data.fonksiyonel_olmayan_gereksinimler.content.startsWith('```json')) {
        try {
          const jsonMatch = data.fonksiyonel_olmayan_gereksinimler.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Fonksiyonel Olmayan Gereksinimler JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Fonksiyonel Olmayan Gereksinimler JSON parse hatası, raw content kullanılıyor');
          actualContent = data.fonksiyonel_olmayan_gereksinimler.content;
        }
      } else {
        actualContent = data.fonksiyonel_olmayan_gereksinimler.content;
      }
    }
    
    hooks.fonksiyonelOlmayanGereksinimlerHook.updateContent(actualContent);
    localStorage.setItem('fonksiyonel_olmayan_gereksinimler_content', actualContent);
    console.log('✅ Fonksiyonel Olmayan Gereksinimler hook\'una veri yüklendi');
  }

  // Kimlik Doğrulama ve Log Yönetimi
  if (data.kimlik_dogrulama_log && hooks.kimlikDogrulamaLogHook) {
    console.log('🔍 DEBUG - Kimlik Doğrulama Log verisi:', data.kimlik_dogrulama_log);
    
    let actualContent = '';
    if (data.kimlik_dogrulama_log.content) {
      if (data.kimlik_dogrulama_log.content.startsWith('```json')) {
        try {
          const jsonMatch = data.kimlik_dogrulama_log.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Kimlik Doğrulama Log JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Kimlik Doğrulama Log JSON parse hatası, raw content kullanılıyor');
          actualContent = data.kimlik_dogrulama_log.content;
        }
      } else {
        actualContent = data.kimlik_dogrulama_log.content;
      }
    }
    
    hooks.kimlikDogrulamaLogHook.updateContent(actualContent);
    localStorage.setItem('kimlik_dogrulama_log_content', actualContent);
    console.log('✅ Kimlik Doğrulama Log hook\'una veri yüklendi');
  }

  // Kapsam Dışında Kalan Konular/Maddeler
  if (data.kapsam_disinda && hooks.kapsamDisindaHook) {
    console.log('🔍 DEBUG - Kapsam Dışında verisi:', data.kapsam_disinda);
    
    let actualContent = '';
    if (data.kapsam_disinda.content) {
      if (data.kapsam_disinda.content.startsWith('```json')) {
        try {
          const jsonMatch = data.kapsam_disinda.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Kapsam Dışında JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Kapsam Dışında JSON parse hatası, raw content kullanılıyor');
          actualContent = data.kapsam_disinda.content;
        }
      } else {
        actualContent = data.kapsam_disinda.content;
      }
    }
    
    hooks.kapsamDisindaHook.updateContent(actualContent);
    localStorage.setItem('kapsam_disinda_content', actualContent);
    console.log('✅ Kapsam Dışında hook\'una veri yüklendi');
  }

  // Ekler
  if (data.ekler && hooks.eklerHook) {
    console.log('🔍 DEBUG - Ekler verisi:', data.ekler);
    
    let actualContent = '';
    if (data.ekler.content) {
      if (data.ekler.content.startsWith('```json')) {
        try {
          const jsonMatch = data.ekler.content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            actualContent = parsedJson.content || '';
            console.log('🔍 DEBUG - Ekler JSON içinden content alındı:', actualContent.substring(0, 100) + '...');
          }
        } catch (e) {
          console.warn('⚠️ Ekler JSON parse hatası, raw content kullanılıyor');
          actualContent = data.ekler.content;
        }
      } else {
        actualContent = data.ekler.content;
      }
    }
    
    hooks.eklerHook.updateContent(actualContent);
    localStorage.setItem('ekler_content', actualContent);
    console.log('✅ Ekler hook\'una veri yüklendi');
  }

  // DİĞER HOOK'LAR - Sadece export için processed yap
  console.log('🔄 Diğer hook\'lar sadece export için hazırlanıyor...');

  // Export çalışması için diğer hook'ları processed yap
  const processedHooks = [
    'amacKapsamHook', 'mevcutIsleyisHook', 'planlananIsleyisHook',
    'fonksiyonelGereksinimlerHook', 'ekranGereksinimlerHook', 'xEkraniHook',
    'taskIsAkisiHook', 'conversionMigrationHook', 'diagramAkislarHook',
    'muhasebeHook', 'xIslemiMuhasebeDeseniHook', 'xIslemiKayitKurallariHook',
    'xIslemiVergiKomisyonHook', 'xIslemiMuhasebeSenaryolariHook', 'xIslemiOrnekKayitlarHook',
    'fonksiyonelOlmayanGereksinimlerHook', 'kimlikDogrulamaLogHook', 'kapsamDisindaHook', 'eklerHook'
  ];
  
  Object.keys(hooks).forEach(hookName => {
    const hook = hooks[hookName];
    if (hook && !processedHooks.includes(hookName)) {
      // Processed hook'lar dışındaki hook'ları sadece export için hazırla
      if (hook.setIsProcessed) {
        hook.setIsProcessed(true);
        console.log(`✅ ${hookName} processed yapıldı (database kaydı yok)`);
      }
      // updateContent ÇAĞIRMA! Bu database kaydı tetikliyor
    }
  });
  
  console.log('🎉 Tüm hook\'lara veri yükleme ve export hazırlığı tamamlandı!');
};
