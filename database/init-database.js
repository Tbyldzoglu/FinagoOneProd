const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function initDatabase() {
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
    
    // Database kontrolü (MSSQL'de database zaten var)
    console.log(`✅ Database '${config.database}' bağlantısı başarılı`);
    
    // analiz_faz1 tablosunu oluştur
    const createTableSQL = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='analiz_faz1' AND xtype='U')
      CREATE TABLE analiz_faz1 (
        id INT IDENTITY(1,1) PRIMARY KEY,
        yuklenme_tarihi DATETIME2 DEFAULT GETDATE(),
        amac_kapsam NVARCHAR(MAX),
        yuklenen_dokuman NVARCHAR(255) NOT NULL
      );
    `;
    
    await pool.request().query(createTableSQL);
    console.log('✅ analiz_faz1 tablosu oluşturuldu');
    
    // Tablo yapısını göster
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'analiz_faz1'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📋 Tablo Yapısı:');
    console.log('================');
    result.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME} | ${col.DATA_TYPE} | ${col.IS_NULLABLE}`);
    });
    
    // Test verisi ekle
    const countResult = await pool.request().query('SELECT COUNT(*) as count FROM analiz_faz1');
    if (countResult.recordset[0].count === 0) {
      await pool.request().query(
        'INSERT INTO analiz_faz1 (amac_kapsam, yuklenen_dokuman) VALUES (@amac_kapsam, @yuklenen_dokuman)',
        {
          amac_kapsam: 'Test amaç ve kapsam bilgisi',
          yuklenen_dokuman: 'test_dokuman.docx'
        }
      );
      console.log('✅ Test verisi eklendi');
    }
    
    console.log('\n🎉 Database hazır!');
    
  } catch (error) {
    console.error('❌ Database hatası:', error.message);
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
  initDatabase();
}

module.exports = { initDatabase };
