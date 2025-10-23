const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function cleanupFallbackRecords() {
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
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
    
    pool = await sql.connect(config);
    console.log('✅ MSSQL bağlantısı başarılı');
    
    // Fallback kayıtları say
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM analiz_faz2 
      WHERE gereksinim_amac_kapsam = 'Analiz tamamlandı ancak içerik alınamadı.'
         OR gereksinim_amac_kapsam = ''
         OR gereksinim_amac_kapsam IS NULL
         OR confidence_score <= 0.5
         OR generation_status != 'completed'
    `);
    
    console.log(`📊 Bulunan fallback kayıt sayısı: ${countResult.recordset[0].count}`);
    
    if (countResult.recordset[0].count > 0) {
      // Fallback kayıtları sil
      const deleteResult = await pool.request().query(`
        DELETE FROM analiz_faz2 
        WHERE gereksinim_amac_kapsam = 'Analiz tamamlandı ancak içerik alınamadı.'
           OR gereksinim_amac_kapsam = ''
           OR gereksinim_amac_kapsam IS NULL
           OR confidence_score <= 0.5
           OR generation_status != 'completed'
      `);
      
      console.log(`🧹 ${deleteResult.rowsAffected[0]} adet fallback kayıt temizlendi`);
      
      // Kalan kayıtları kontrol et
      const remainingResult = await pool.request().query(`
        SELECT TOP 5 id, gereksinim_amac_kapsam, confidence_score, generation_status 
        FROM analiz_faz2 
        ORDER BY id DESC
      `);
      
      console.log('📋 Kalan kayıtlar:');
      remainingResult.recordset.forEach(row => {
        console.log(`  ID: ${row.id}, Status: ${row.generation_status}, Confidence: ${row.confidence_score}`);
        console.log(`  Content: ${row.gereksinim_amac_kapsam ? row.gereksinim_amac_kapsam.substring(0, 50) + '...' : 'NULL'}`);
      });
      
    } else {
      console.log('✅ Temizlenecek fallback kayıt bulunamadı');
    }
    
  } catch (error) {
    console.error('❌ Temizleme hatası:', error);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Bağlantı kapatıldı');
    }
  }
}

cleanupFallbackRecords();
