/**
 * Rapor Tablolarına Puan Sütunları Ekleme
 * NOT: Bu script'i çalıştırmadan önce veritabanı bağlantı bilgilerini kontrol edin
 */

const sql = require('mssql');

// Veritabanı bağlantı bilgileri
const config = {
  server: 'FNG-TDB',
  port: 1433,
  user: 'analiz_dokumani',
  password: 'Star202534**',
  database: 'analiz_dokumani',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function addPuanColumns() {
  try {
    console.log('🔄 Veritabanına bağlanılıyor...');
    const pool = await sql.connect(config);
    console.log('✅ Veritabanına bağlandı\n');
    
    // İlk Ay Raporu
    console.log('📋 İlk Ay Raporu - Puan sütunları ekleniyor...');
    const ilkAyPuanlar = ['soru1_puan', 'soru2_puan', 'soru3_puan', 'soru4_puan'];
    
    for (const puan of ilkAyPuanlar) {
      try {
        const checkResult = await pool.request().query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'IlkAyRapor' AND COLUMN_NAME = '${puan}'
        `);
        
        if (checkResult.recordset.length === 0) {
          await pool.request().query(`
            ALTER TABLE IlkAyRapor 
            ADD ${puan} INT NULL
          `);
          await pool.request().query(`
            ALTER TABLE IlkAyRapor 
            ADD CONSTRAINT CK_IlkAyRapor_${puan} CHECK (${puan} >= 1 AND ${puan} <= 5)
          `);
          console.log(`  ✅ ${puan} eklendi`);
        } else {
          console.log(`  ⚠️  ${puan} zaten mevcut`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  ${puan} zaten mevcut`);
        } else {
          console.error(`  ❌ ${puan} eklenirken hata:`, error.message);
        }
      }
    }
    
    // İkinci Ay Raporu - TÜM PUAN KOLONLARI
    console.log('\n📋 İkinci Ay Raporu - Puan sütunları ekleniyor...');
    const ikinciAyPuanlar = ['soru1_puan', 'soru2_puan', 'soru3_puan', 'soru4_puan'];
    
    for (const puan of ikinciAyPuanlar) {
      try {
        const checkResult = await pool.request().query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'IkinciAyRapor' AND COLUMN_NAME = '${puan}'
        `);
        
        if (checkResult.recordset.length === 0) {
          await pool.request().query(`
            ALTER TABLE IkinciAyRapor 
            ADD ${puan} INT NULL
          `);
          await pool.request().query(`
            ALTER TABLE IkinciAyRapor 
            ADD CONSTRAINT CK_IkinciAyRapor_${puan} CHECK (${puan} >= 1 AND ${puan} <= 5)
          `);
          console.log(`  ✅ ${puan} eklendi`);
        } else {
          console.log(`  ⚠️  ${puan} zaten mevcut`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  ${puan} zaten mevcut`);
        } else {
          console.error(`  ❌ ${puan} eklenirken hata:`, error.message);
        }
      }
    }
    
    // Standart Rapor
    console.log('\n📋 Standart Rapor - Puan sütunları ekleniyor...');
    const standartPuanlar = [
      'soru1_puan', 'soru2_puan', 'soru3_puan', 
      'soru4_puan', 'soru5_puan', 'soru6_puan', 
      'soru7_puan', 'soru8_puan', 'soru9_puan'
    ];
    
    for (const puan of standartPuanlar) {
      try {
        const checkResult = await pool.request().query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'StandartRapor' AND COLUMN_NAME = '${puan}'
        `);
        
        if (checkResult.recordset.length === 0) {
          await pool.request().query(`
            ALTER TABLE StandartRapor 
            ADD ${puan} INT NULL
          `);
          await pool.request().query(`
            ALTER TABLE StandartRapor 
            ADD CONSTRAINT CK_StandartRapor_${puan} CHECK (${puan} >= 1 AND ${puan} <= 5)
          `);
          console.log(`  ✅ ${puan} eklendi`);
        } else {
          console.log(`  ⚠️  ${puan} zaten mevcut`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  ${puan} zaten mevcut`);
        } else {
          console.error(`  ❌ ${puan} eklenirken hata:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Puan sütunları başarıyla eklendi!');
    
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    throw error;
  } finally {
    await sql.close();
  }
}

addPuanColumns()
  .then(() => {
    console.log('\n🎯 İşlem tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script hatası:', error.message);
    process.exit(1);
  });

