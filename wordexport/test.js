/**
 * Test scripti - Word Export fonksiyonlarını test et
 */

const WordExportService = require('./index');
const fs = require('fs').promises;
const path = require('path');

async function runTests() {
  console.log('🧪 Word Export Test Başlatılıyor...\n');
  
  const service = new WordExportService();
  
  try {
    // Test 1: Doküman listesini getir
    console.log('📋 Test 1: Doküman listesi');
    console.log('========================');
    const documents = await service.listDocuments();
    console.log(`✅ ${documents.length} doküman bulundu`);
    documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.doc_id} (${doc.user_id}) - ${doc.updated_at}`);
    });
    console.log('');

    // Test 2: Template listesini getir
    console.log('📄 Test 2: Template listesi');
    console.log('==========================');
    const templates = await service.listTemplates();
    console.log(`✅ ${templates.length} template bulundu`);
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template}`);
    });
    console.log('');

    // Test 3: İlk doküman için talep bilgileri export
    if (documents.length > 0) {
      const firstDoc = documents[0];
      console.log('📊 Test 3: Talep Bilgileri Export');
      console.log('=================================');
      console.log(`Doküman: ${firstDoc.doc_id}`);
      
      // Template kontrolü
      if (templates.length > 0) {
        const templateName = templates[0];
        console.log(`Template: ${templateName}`);
        
        // Export işlemi
        const result = await service.exportTalepBilgileri(
          firstDoc.doc_id, 
          firstDoc.user_id, 
          templateName
        );
        
        if (result.success) {
          console.log(`✅ Export başarılı: ${result.outputPath}`);
          console.log(`📊 Veri sayısı: ${result.dataCount}`);
          
          // Veri önizleme
          console.log('\n📝 Veri Önizleme:');
          Object.keys(result.data).slice(0, 5).forEach(key => {
            const value = result.data[key];
            console.log(`   ${key}: "${value}"`);
          });
          if (Object.keys(result.data).length > 5) {
            console.log(`   ... ve ${Object.keys(result.data).length - 5} alan daha`);
          }
        } else {
          console.log(`❌ Export hatası: ${result.error}`);
        }
      } else {
        console.log('⚠️ Template bulunamadı, test atlanıyor');
      }
    } else {
      console.log('⚠️ Doküman bulunamadı, test atlanıyor');
    }
    console.log('');

    // Test 4: Template placeholder'larını listele
    if (templates.length > 0) {
      console.log('🏷️ Test 4: Template Placeholder\'ları');
      console.log('====================================');
      const templateName = templates[0];
      const placeholders = await service.listTemplatePlaceholders(templateName);
      console.log(`Template: ${templateName}`);
      console.log(`✅ ${placeholders.length} placeholder bulundu`);
      placeholders.forEach((placeholder, index) => {
        console.log(`   ${index + 1}. {{${placeholder}}}`);
      });
    }
    console.log('');

    // Test 5: Output dosyalarını listele
    console.log('📁 Test 5: Output Dosyaları');
    console.log('===========================');
    const outputs = await service.listOutputs();
    console.log(`✅ ${outputs.length} output dosyası bulundu`);
    outputs.forEach((output, index) => {
      console.log(`   ${index + 1}. ${output}`);
    });
    console.log('');

    console.log('🎉 Tüm testler tamamlandı!');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
    console.error(error.stack);
  }
}

// Test çalıştır
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
