/**
 * analiz_faz2 tablosunu oluşturan migration script - MSSQL Version
 * LLM Tabanlı Gereksinim Analizi sonuçları için
 */

const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function createAnalizFaz2Table() {
  let pool;
  
  try {
    console.log('🔗 MSSQL bağlantısı kuruluyor...');
    
    const config = {
      server: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    };
    
    pool = await sql.connect(config);
    console.log('✅ MSSQL bağlantısı başarılı');
    
    // analiz_faz2 tablosunu oluştur - faz1 ile aynı yapıda ama gereksinim_ prefix'li
    const createTableSQL = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='analiz_faz2' AND xtype='U')
      CREATE TABLE analiz_faz2 (
        id INT IDENTITY(1,1) PRIMARY KEY,
        yuklenme_tarihi DATETIME2 DEFAULT GETDATE(),
        
        -- LLM tarafından üretilen gereksinim içerikleri
        gereksinim_amac_kapsam NVARCHAR(MAX),
        gereksinim_talep_bilgileri NVARCHAR(MAX),
        gereksinim_dokuman_tarihcesi NVARCHAR(MAX),
        gereksinim_talep_degerlendirmesi NVARCHAR(MAX),
        gereksinim_mevcut_isleyis NVARCHAR(MAX),
        gereksinim_planlanan_isleyis NVARCHAR(MAX),
        gereksinim_fonksiyonel_gereksinimler NVARCHAR(MAX),
        gereksinim_ekran_gereksinimleri NVARCHAR(MAX),
        gereksinim_x_ekrani NVARCHAR(MAX),
        gereksinim_ekran_tasarimlari NVARCHAR(MAX),
        gereksinim_tasklar_batchlar NVARCHAR(MAX),
        gereksinim_task_is_akisi NVARCHAR(MAX),
        gereksinim_entegrasyonlar NVARCHAR(MAX),
        gereksinim_mesajlar NVARCHAR(MAX),
        gereksinim_parametreler NVARCHAR(MAX),
        gereksinim_conversation_migration NVARCHAR(MAX),
        gereksinim_diagram_akislar NVARCHAR(MAX),
        gereksinim_muhasebe NVARCHAR(MAX),
        gereksinim_x_islemi_muhasebesi NVARCHAR(MAX),
        gereksinim_x_islemi_muhasebe_deseni NVARCHAR(MAX),
        gereksinim_case1 NVARCHAR(MAX),
        gereksinim_x_islemi_kayit_kurallari NVARCHAR(MAX),
        gereksinim_x_islemi_vergi_komisyon NVARCHAR(MAX),
        gereksinim_x_islemi_muhasebe_senaryolari NVARCHAR(MAX),
        gereksinim_x_islemi_ornek_kayitlar NVARCHAR(MAX),
        gereksinim_fonksiyonel_olmayan_gereksinimler NVARCHAR(MAX),
        gereksinim_kimlik_dogrulama_log NVARCHAR(MAX),
        gereksinim_yetkilendirme_onay NVARCHAR(MAX),
        gereksinim_veri_kritikligi NVARCHAR(MAX),
        gereksinim_paydaslar_kullanicilar NVARCHAR(MAX),
        gereksinim_kapsam_disinda NVARCHAR(MAX),
        gereksinim_kabul_kriterleri NVARCHAR(MAX),
        gereksinim_onaylar NVARCHAR(MAX),
        gereksinim_ekler NVARCHAR(MAX),
        
        -- Kaynak doküman bilgisi
        yuklenen_dokuman NVARCHAR(255) NOT NULL,
        
        -- LLM metadata
        llm_model NVARCHAR(100) DEFAULT 'openai-gpt-4',
        generation_status NVARCHAR(20) DEFAULT 'processing',
        total_tokens_used INT DEFAULT 0,
        generation_time_seconds DECIMAL(10,2) DEFAULT 0.00,
        confidence_score DECIMAL(3,2) DEFAULT 0.00,
        
        -- Transfer durumu
        transferred_to_faz1 BIT DEFAULT 0,
        transfer_date DATETIME2 NULL
      );
    `;
    
    await pool.request().query(createTableSQL);
    console.log('✅ analiz_faz2 tablosu oluşturuldu');
    
    // Indexler oluştur
    const indexQueries = [
      'CREATE INDEX idx_yuklenme_tarihi_faz2 ON analiz_faz2 (yuklenme_tarihi)',
      'CREATE INDEX idx_dokuman_faz2 ON analiz_faz2 (yuklenen_dokuman)',
      'CREATE INDEX idx_status_faz2 ON analiz_faz2 (generation_status)',
      'CREATE INDEX idx_transferred_faz2 ON analiz_faz2 (transferred_to_faz1)',
      'CREATE INDEX idx_llm_model_faz2 ON analiz_faz2 (llm_model)'
    ];
    
    for (const indexQuery of indexQueries) {
      try {
        await pool.request().query(indexQuery);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log(`⚠️ Index oluşturma uyarısı: ${error.message}`);
        }
      }
    }
    
    // Tablo yapısını göster
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'analiz_faz2'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📋 analiz_faz2 Tablo Yapısı:');
    console.log('=====================================');
    result.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME} | ${col.DATA_TYPE} | ${col.IS_NULLABLE} | ${col.COLUMN_DEFAULT}`);
    });
    
    // Tablo istatistikleri
    console.log('\n📊 Tablo İstatistikleri:');
    console.log(`📁 Toplam sütun sayısı: ${result.recordset.length}`);
    console.log(`🤖 Gereksinim sütunları: ${result.recordset.filter(col => col.COLUMN_NAME.startsWith('gereksinim_')).length}`);
    console.log(`⚙️ Metadata sütunları: ${result.recordset.filter(col => ['llm_model', 'generation_status', 'total_tokens_used', 'generation_time_seconds', 'confidence_score'].includes(col.COLUMN_NAME)).length}`);
    console.log(`🔄 Transfer sütunları: ${result.recordset.filter(col => ['transferred_to_faz1', 'transfer_date'].includes(col.COLUMN_NAME)).length}`);
    
    console.log('\n🎉 analiz_faz2 tablosu hazır!');
    console.log('💡 Bu tablo şunları içerir:');
    console.log('   - ✅ LLM tarafından üretilen gereksinim içerikleri');
    console.log('   - ✅ Üretim metadata (model, tokens, süre, güven)');
    console.log('   - ✅ Transfer tracking (faz1 e aktarım durumu)');
    console.log('   - ✅ Performance indexleri');
    
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error.message);
    if (error.code === 'ELOGIN') {
      console.error('🔐 Erişim hatası. .env dosyasındaki database bilgilerini kontrol edin');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

if (require.main === module) {
  createAnalizFaz2Table();
}

module.exports = { createAnalizFaz2Table };
