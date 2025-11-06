// Task İş Akışı debug testi
const DataParser = require('./dataParser.js');
const DatabaseService = require('./database.js');

async function testTaskIsAkisi() {
  console.log('=== TASK İŞ AKIŞI DEBUG TEST ===\n');
  
  const db = new DatabaseService();
  await db.connect();
  
  try {
    const data = await db.getModalData('Analiz Güncel verisyon v3.docx');
    console.log('📊 Database\'den gelen task_is_akisi_modal:');
    console.log(data.task_is_akisi_modal ? 'Mevcut' : 'Yok');
    
    if (data.task_is_akisi_modal) {
      const parsed = JSON.parse(data.task_is_akisi_modal);
      console.log('📄 Parsed veri yapısı:', Object.keys(parsed));
      console.log('📝 Content mevcut:', !!parsed.content);
      if (parsed.content) {
        console.log('📰 İçerik uzunluğu:', parsed.content.length, 'karakter');
        console.log('📰 İçerik preview:', parsed.content.substring(0, 100) + '...');
      }
    }
    
    console.log('\n=== DATA PARSER TEST ===');
    const parser = new DataParser();
    const result = parser.parseAllModals(data);
    
    console.log('🎯 task_is_akisi placeholder:', result.task_is_akisi ? 'OLUŞTURULDU' : 'YOK');
    if (result.task_is_akisi) {
      console.log('📝 Değer uzunluğu:', result.task_is_akisi.length, 'karakter');
      console.log('📰 Değer preview:', result.task_is_akisi.substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await db.disconnect();
  }
}

testTaskIsAkisi();
