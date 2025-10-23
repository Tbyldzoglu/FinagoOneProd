const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function initDatabase() {
  let pool;
  
  try {
    console.log('🔗 Connecting to MSSQL...');
    
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
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
    
    pool = await sql.connect(config);
    console.log('✅ MSSQL connection established');
    
    // Modal isimlerini tanımla
    const MODAL_COLUMNS = [
      'case1_modal',
      'conversion_migration_modal',
      'diagram_akislar_modal',
      'document_history_modal',
      'edit_section_modal',
      'ekler_modal',
      'ekran_tasarimlari_modal',
      'entegrasyonlar_modal',
      'fonksiyonel_olmayan_gereksinimler_modal',
      'kabul_kriterleri_modal',
      'kapsam_disinda_modal',
      'kimlik_dogrulama_log_modal',
      'mesajlar_modal',
      'muhasebe_masa_modal',
      'muhasebe_modal',
      'onaylar_modal',
      'parametreler_modal',
      'paydaslar_kullanicilar_modal',
      'section_chat_modal',
      'talep_bilgileri_modal',
      'talep_degerlendirmesi_modal',
      'tasklar_batchlar_modal',
      'veri_kritikligi_modal',
      'x_islemi_kayit_kurallari_modal',
      'x_islemi_muhasebe_deseni_modal',
      'x_islemi_muhasebe_modal',
      'x_islemi_muhasebe_senaryolari_modal',
      'x_islemi_ornek_kayitlar_modal',
      'x_islemi_vergi_komisyon_modal',
      'yetkilendirme_onay_modal'
    ];
    
    // Tabloyu oluştur
    const modalColumns = MODAL_COLUMNS.map(col => `[${col}] NVARCHAR(MAX)`).join(',\n  ');
    
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'modal_contents')
      BEGIN
        CREATE TABLE modal_contents (
          id INT IDENTITY(1,1) PRIMARY KEY,
          doc_id NVARCHAR(255) NOT NULL,
          user_id NVARCHAR(255) NOT NULL DEFAULT 'default',
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          ${modalColumns},
          CONSTRAINT unique_doc_user UNIQUE (doc_id, user_id)
        );
        
        CREATE INDEX idx_doc_id ON modal_contents (doc_id);
        CREATE INDEX idx_user_id ON modal_contents (user_id);
        CREATE INDEX idx_created_at ON modal_contents (created_at);
      END
    `;
    
    await pool.request().query(createTableQuery);
    console.log('✅ modal_contents tablosu oluşturuldu');
    
    // Test verisi ekle (opsiyonel)
    const countResult = await pool.request().query(
      'SELECT COUNT(*) as count FROM modal_contents'
    );
    
    if (countResult.recordset[0].count === 0) {
      console.log('📝 Test verisi ekleniyor...');
      
      const testDocId = 'test_document_' + Date.now();
      const testUserId = 'test_user';
      
      await pool.request()
        .input('doc_id', sql.NVarChar, testDocId)
        .input('user_id', sql.NVarChar, testUserId)
        .input('talep_bilgileri_modal', sql.NVarChar(sql.MAX), JSON.stringify({
          title: 'Test Talep Bilgileri',
          content: 'Bu bir test içeriğidir',
          timestamp: new Date().toISOString()
        }))
        .query(`
          INSERT INTO modal_contents (doc_id, user_id, talep_bilgileri_modal) 
          VALUES (@doc_id, @user_id, @talep_bilgileri_modal)
        `);
      
      console.log(`✅ Test verisi eklendi (DocID: ${testDocId})`);
    }
    
    // Tablo yapısını göster
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'modal_contents'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📋 Tablo Yapısı:');
    console.log('================');
    columnsResult.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME} | ${col.DATA_TYPE} | ${col.IS_NULLABLE} | ${col.COLUMN_DEFAULT}`);
    });
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`👤 User: ${process.env.DB_USER}`);
    console.log(`📁 Modal Count: ${MODAL_COLUMNS.length}`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    if (error.code === 'ELOGIN') {
      console.error('🔐 Login failed. Please check your database credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please make sure SQL Server is running');
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// CLI çalıştırma
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
