/**
 * Analiz Faz1 Database Service
 * Basit doküman analizi kaydetme servisi
 */

const API_BASE_URL = process.env.REACT_APP_DATABASE_API_URL;

export interface AnalizFaz1Data {
  id?: number;
  yuklenme_tarihi?: string;
  amac_kapsam?: string;
  talep_bilgileri?: string;
  dokuman_tarihcesi?: string;
  talep_degerlendirmesi?: string;
  mevcut_isleyis?: string;
  planlanan_isleyis?: string;
  fonksiyonel_gereksinimler?: string;
  ekran_gereksinimleri?: string;
  x_ekrani?: string;
  ekran_tasarimlari?: string;
  tasklar_batchlar?: string;
  task_is_akisi?: string;
  entegrasyonlar?: string;
  mesajlar?: string;
  parametreler?: string;
  conversation_migration?: string;
  diagram_akislar?: string;
  muhasebe?: string;
  x_islemi_muhasebesi?: string;
  x_islemi_muhasebe_deseni?: string;
  case1?: string;
  x_islemi_kayit_kurallari?: string;
  x_islemi_vergi_komisyon?: string;
  x_islemi_muhasebe_senaryolari?: string;
  x_islemi_ornek_kayitlar?: string;
  fonksiyonel_olmayan_gereksinimler?: string;
  kimlik_dogrulama_log?: string;
  yetkilendirme_onay?: string;
  veri_kritikligi?: string;
  paydaslar_kullanicilar?: string;
  kapsam_disinda?: string;
  kabul_kriterleri?: string;
  onaylar?: string;
  ekler?: string; // Yeni eklenen sütun
  yuklenen_dokuman: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Yeni doküman analizi kaydet
 */
export const saveAnalizFaz1 = async (data: Omit<AnalizFaz1Data, 'id' | 'yuklenme_tarihi'>): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analiz-faz1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Analiz kaydetme hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Tüm analiz kayıtlarını getir
 */
export const getAnalizFaz1List = async (): Promise<ApiResponse<AnalizFaz1Data[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analiz-faz1`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Analiz listesi getirme hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Son analiz kaydını getir
 */
export const getLatestAnalizFaz1 = async (): Promise<ApiResponse<AnalizFaz1Data>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analiz-faz1/latest`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Son analiz getirme hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Mevcut doküman analizini güncelle
 */
export const updateAnalizFaz1 = async (dokuman: string, data: Partial<Omit<AnalizFaz1Data, 'id' | 'yuklenme_tarihi' | 'yuklenen_dokuman'>>): Promise<ApiResponse> => {
  try {
    
    const response = await fetch(`${API_BASE_URL}/api/analiz-faz1/${encodeURIComponent(dokuman)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('❌ updateAnalizFaz1 hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Faz2 - Son kaydı (en yüksek ID) getir
 */
export const getLatestAnalizFaz2 = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analiz-faz2/latest`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Faz2 son kayıt getirme hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Database health check
 */
export const checkDatabaseHealth = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Database unhealthy: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Database health check hatası:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database erişilemez'
    };
  }
};
