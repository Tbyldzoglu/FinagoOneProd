/**
 * Database connection and data retrieval functions - MSSQL Version
 */

const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

class DatabaseService {
  constructor() {
    this.pool = null;
    this.config = {
      server: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  }

  async connect() {
    try {
      this.pool = await sql.connect(this.config);
      console.log('✅ MSSQL Database bağlantısı başarılı');
    } catch (error) {
      console.error('❌ Database bağlantı hatası:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.close();
      console.log('✅ Database bağlantısı kapatıldı');
    }
  }

  /**
   * Belirli bir doküman ve kullanıcı için modal verilerini getir
   */
  async getModalData(docId, userId = 'default') {
    if (!this.pool) {
      throw new Error('Database bağlantısı yok');
    }

    try {
      // Önce modal_contents tablosunu kontrol et
      const tablesResult = await this.pool.request().query(
        "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'modal_contents'"
      );
      
      if (tablesResult.recordset.length > 0) {
        // modal_contents tablosu varsa onu kullan
        const req = this.pool.request();
        req.input('doc_id', sql.NVarChar(255), docId);
        req.input('user_id', sql.NVarChar(255), userId);
        const rowsResult = await req.query(
          'SELECT TOP 1 * FROM modal_contents WHERE doc_id = @doc_id AND user_id = @user_id ORDER BY updated_at DESC'
        );

        if (!rowsResult.recordset || rowsResult.recordset.length === 0) {
          throw new Error(`Doküman bulunamadı: ${docId}`);
        }

        return rowsResult.recordset[0];
      } else {
        // modal_contents yoksa analiz_faz1 tablosunu kullan
        // En büyük ID'ye sahip kaydı al (en son eklenen)
        const req = this.pool.request();
        req.input('doc', sql.NVarChar(255), docId);
        const rowsResult = await req.query(
          'SELECT TOP 1 * FROM analiz_faz1 WHERE yuklenen_dokuman = @doc ORDER BY id DESC'
        );

        if (!rowsResult.recordset || rowsResult.recordset.length === 0) {
          throw new Error(`Doküman bulunamadı: ${docId}`);
        }

        // Helper: JSON string veya object'i parse et
        const parseFieldSafely = (fieldValue) => {
          if (!fieldValue) return null;
          
          // Eğer JSON string ise parse et
          if (typeof fieldValue === 'string') {
            try {
              return JSON.parse(fieldValue);
            } catch (e) {
              // Parse edilemezse düz text olarak kabul et
              return { content: fieldValue };
            }
          }
          
          // Zaten object ise olduğu gibi döndür
          return fieldValue;
        };
        
        // analiz_faz1 formatını modal_contents formatına çevir
        const row = rowsResult.recordset[0];
        return {
          id: row.id,
          doc_id: docId,
          user_id: userId,
          created_at: row.yuklenme_tarihi,
          updated_at: row.yuklenme_tarihi,
          amac_kapsam: row.amac_kapsam ? JSON.stringify({content: row.amac_kapsam}) : null,
          talep_bilgileri_modal: parseFieldSafely(row.talep_bilgileri),
          dokuman_tarihcesi: parseFieldSafely(row.dokuman_tarihcesi),
          talep_degerlendirmesi_modal: parseFieldSafely(row.talep_degerlendirmesi),
          mevcut_isleyis_modal: row.mevcut_isleyis ? JSON.stringify({content: row.mevcut_isleyis}) : null,
          planlanan_isleyis_modal: row.planlanan_isleyis ? JSON.stringify({content: row.planlanan_isleyis}) : null,
          fonksiyonel_gereksinimler_modal: row.fonksiyonel_gereksinimler ? JSON.stringify({content: row.fonksiyonel_gereksinimler}) : null,
          ekran_gereksinimleri_modal: row.ekran_gereksinimleri ? JSON.stringify({content: row.ekran_gereksinimleri}) : null,
          x_ekrani_modal: row.x_ekrani ? JSON.stringify({content: row.x_ekrani}) : null,
          ekran_tasarimlari_modal: parseFieldSafely(row.ekran_tasarimlari),
          tasklar_batchlar_modal: parseFieldSafely(row.tasklar_batchlar),
          task_is_akisi_modal: row.task_is_akisi ? JSON.stringify({content: row.task_is_akisi}) : null,
          entegrasyonlar_modal: parseFieldSafely(row.entegrasyonlar),
          mesajlar_modal: parseFieldSafely(row.mesajlar),
          parametreler_modal: parseFieldSafely(row.parametreler),
          conversation_migration_modal: row.conversation_migration ? JSON.stringify({content: row.conversation_migration}) : null,
          diagram_akislar_modal: row.diagram_akislar ? JSON.stringify({content: row.diagram_akislar}) : null,
          muhasebe_modal: row.muhasebe ? JSON.stringify({content: row.muhasebe}) : null,
          x_islemi_muhasebesi_modal: row.x_islemi_muhasebesi ? JSON.stringify({content: row.x_islemi_muhasebesi}) : null,
          x_islemi_muhasebe_deseni_modal: row.x_islemi_muhasebe_deseni ? JSON.stringify({content: row.x_islemi_muhasebe_deseni}) : null,
          case1_modal: parseFieldSafely(row.case1),
          x_islemi_kayit_kurallari_modal: row.x_islemi_kayit_kurallari ? JSON.stringify({content: row.x_islemi_kayit_kurallari}) : null,
          x_islemi_vergi_komisyon_modal: row.x_islemi_vergi_komisyon ? JSON.stringify({content: row.x_islemi_vergi_komisyon}) : null,
          x_islemi_muhasebe_senaryolari_modal: row.x_islemi_muhasebe_senaryolari ? JSON.stringify({content: row.x_islemi_muhasebe_senaryolari}) : null,
          x_islemi_ornek_kayitlar_modal: row.x_islemi_ornek_kayitlar ? JSON.stringify({content: row.x_islemi_ornek_kayitlar}) : null,
          fonksiyonel_olmayan_gereksinimler_modal: row.fonksiyonel_olmayan_gereksinimler ? JSON.stringify({content: row.fonksiyonel_olmayan_gereksinimler}) : null,
          kimlik_dogrulama_log_modal: row.kimlik_dogrulama_log ? JSON.stringify({content: row.kimlik_dogrulama_log}) : null,
          yetkilendirme_onay_modal: parseFieldSafely(row.yetkilendirme_onay),
          veri_kritikligi_modal: parseFieldSafely(row.veri_kritikligi),
          paydaslar_kullanicilar_modal: parseFieldSafely(row.paydaslar_kullanicilar),
          kapsam_disinda_modal: row.kapsam_disinda ? JSON.stringify({content: row.kapsam_disinda}) : null,
          kabul_kriterleri_modal: parseFieldSafely(row.kabul_kriterleri),
          onaylar_modal: parseFieldSafely(row.onaylar),
          ekler_modal: row.ekler ? JSON.stringify({content: row.ekler}) : null
        };
      }
    } catch (error) {
      console.error('❌ Modal veri çekme hatası:', error.message);
      throw error;
    }
  }

  /**
   * Tüm dokümanları listele
   */
  async getAllDocuments() {
    if (!this.pool) {
      throw new Error('Database bağlantısı yok');
    }

    try {
      // Önce modal_contents tablosunu kontrol et
      const tablesResult = await this.pool.request().query(
        "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'modal_contents'"
      );
      
      if (tablesResult.recordset.length > 0) {
        // modal_contents tablosu varsa onu kullan
        const rowsResult = await this.pool.request().query(
          'SELECT doc_id, user_id, created_at, updated_at FROM modal_contents ORDER BY updated_at DESC'
        );
        return rowsResult.recordset;
      } else {
        // modal_contents yoksa analiz_faz1 tablosunu kullan
        const rowsResult = await this.pool.request().query(
          "SELECT yuklenen_dokuman as doc_id, 'default' as user_id, yuklenme_tarihi as created_at, yuklenme_tarihi as updated_at FROM analiz_faz1 ORDER BY yuklenme_tarihi DESC"
        );
        return rowsResult.recordset;
      }
    } catch (error) {
      console.error('❌ Doküman listesi çekme hatası:', error.message);
      throw error;
    }
  }

  /**
   * Belirli bir modal kolonunu getir
   */
  async getModalColumn(docId, userId, columnName) {
    if (!this.pool) {
      throw new Error('Database bağlantısı yok');
    }

    try {
      // Önce modal_contents tablosunu kontrol et
      const tablesResult = await this.pool.request().query(
        "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'modal_contents'"
      );
      
      if (tablesResult.recordset.length > 0) {
        // modal_contents tablosu varsa onu kullan
        const req = this.pool.request();
        req.input('doc_id', sql.NVarChar(255), docId);
        req.input('user_id', sql.NVarChar(255), userId);
        const rowsResult = await req.query(
          `SELECT TOP 1 ${columnName} FROM modal_contents WHERE doc_id = @doc_id AND user_id = @user_id ORDER BY updated_at DESC`
        );

        if (!rowsResult.recordset || rowsResult.recordset.length === 0) {
          return null;
        }

        const data = rowsResult.recordset[0][columnName];
        if (!data) {
          return null;
        }

        return JSON.parse(data);
      } else {
        // modal_contents yoksa analiz_faz1 tablosunu kullan
        // Column name mapping: talep_bilgileri_modal -> talep_bilgileri
        const mappedColumnName = columnName.replace('_modal', '');
        
        const req = this.pool.request();
        req.input('doc', sql.NVarChar(255), docId);
        const rowsResult = await req.query(
          `SELECT TOP 1 ${mappedColumnName} FROM analiz_faz1 WHERE yuklenen_dokuman = @doc ORDER BY id DESC`
        );

        if (!rowsResult.recordset || rowsResult.recordset.length === 0) {
          return null;
        }

        const data = rowsResult.recordset[0][mappedColumnName];
        if (!data) {
          return null;
        }

        // analiz_faz1'deki veri JSON string formatında, parse et
        try {
          return JSON.parse(data);
        } catch (error) {
          // JSON parse edilemezse content olarak döndür
          return { content: data };
        }
      }
    } catch (error) {
      console.error(`❌ ${columnName} veri çekme hatası:`, error.message);
      throw error;
    }
  }
}

module.exports = DatabaseService;
