// Entegrasyonlar Word export debug
const DatabaseService = require('./database.js');
const DataParser = require('./dataParser.js');
const WordExporter = require('./wordExporter.js');

async function testEntegrasyonlarExport() {
  console.log('=== ENTEGRASYONLAR WORD EXPORT DEBUG ===\n');
  
  const db = new DatabaseService();
  await db.connect();
  
  try {
    // Database'den veri çek
    const data = await db.getModalData('TestDoccc1.docx');
    
    // Parser ile placeholder'ları oluştur
    const parser = new DataParser();
    const result = parser.parseAllModals(data);
    
    console.log('🎯 Entegrasyonlar Placeholders:');
    Object.keys(result).filter(k => k.includes('entegrasyon')).forEach(key => {
      console.log(`${key}: "${result[key]}"`);
    });
    
    console.log('\n📝 Word Export Test:');
    
    // Basit template test
    const testData = {
      'entegrasyon_1_adi': result.entegrasyon_1_adi || '',
      'entegrasyon_1_amac': result.entegrasyon_1_amac || '',
      'entegrasyon_1_sorumlu_sistemler': result.entegrasyon_1_sorumlu_sistemler || '',
      'entegrasyonlar_title': result.entegrasyonlar_title || ''
    };
    
    console.log('Test verisi:', testData);
    
    // WordExporter test
    try {
      const wordExporter = new WordExporter();
      const outputPath = await wordExporter.exportToWord(
        'templates/Analiz Güncel verisyon v3.docx',
        testData,
        'output/entegrasyonlar_test.docx'
      );
      console.log('✅ Word export başarılı:', outputPath);
    } catch (exportError) {
      console.log('❌ Word export hatası:', exportError.message);
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await db.disconnect();
  }
}

testEntegrasyonlarExport();
