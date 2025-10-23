/**
 * Database tablolarını kontrol eden script
 */

const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function checkTables() {
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
    
    // Tüm tabloları listele
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    const tables = result.recordset;
    
    console.log('\n📋 Database Tabloları:');
    console.log('=======================');
    tables.forEach(table => {
      console.log(`✅ ${table.TABLE_NAME}`);
    });
    
    // analiz_faz2 tablosunun var olup olmadığını kontrol et
    const faz2Result = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'analiz_faz2'
    `);
    
    if (faz2Result.recordset[0].count > 0) {
      console.log('\n🎯 analiz_faz2 tablosu MEVCUT ✅');
      
      // Tablo yapısını göster
      const columnsResult = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'analiz_faz2'
      `);
      const columns = columnsResult.recordset;
      
      console.log('\n📊 analiz_faz2 Sütun Sayısı:', columns.length);
      console.log('🤖 Gereksinim sütunları:', columns.filter(col => col.COLUMN_NAME.startsWith('gereksinim_')).length);
    } else {
      console.log('\n❌ analiz_faz2 tablosu BULUNAMADI');
    }
    
    // analiz_faz1 tablosunu da kontrol et
    const faz1Result = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'analiz_faz1'
    `);
    
    if (faz1Result.recordset[0].count > 0) {
      console.log('\n🎯 analiz_faz1 tablosu MEVCUT ✅');
    } else {
      console.log('\n❌ analiz_faz1 tablosu BULUNAMADI');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkTables();
