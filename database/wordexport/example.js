/**
 * Örnek kullanım scripti
 */

const WordExportService = require('./index');

async function exampleUsage() {
  console.log('📚 Word Export Örnek Kullanım\n');
  
  const service = new WordExportService();
  
  try {
    // 1. Mevcut dokümanları listele
    console.log('1. Mevcut dokümanları listele:');
    const documents = await service.listDocuments();
    console.log(`   ${documents.length} doküman bulundu\n`);
    
    if (documents.length === 0) {
      console.log('⚠️ Hiç doküman bulunamadı. Önce veritabanına veri ekleyin.');
      return;
    }
    
    // 2. Mevcut template'leri listele
    console.log('2. Mevcut template\'leri listele:');
    const templates = await service.listTemplates();
    console.log(`   ${templates.length} template bulundu\n`);
    
    if (templates.length === 0) {
      console.log('⚠️ Hiç template bulunamadı. templates/ klasörüne .docx dosyası ekleyin.');
      return;
    }
    
    // 3. İlk doküman için talep bilgileri export
    const firstDoc = documents[0];
    const templateName = templates[0];
    
    console.log('3. Talep bilgileri export:');
    console.log(`   Doküman: ${firstDoc.doc_id}`);
    console.log(`   Template: ${templateName}`);
    
    const result = await service.exportTalepBilgileri(
      firstDoc.doc_id,
      firstDoc.user_id,
      templateName
    );
    
    if (result.success) {
      console.log(`   ✅ Başarılı: ${result.outputPath}`);
      console.log(`   📊 Veri sayısı: ${result.dataCount}`);
      
      // Veri önizleme
      console.log('\n   📝 Veri Önizleme:');
      Object.keys(result.data).forEach(key => {
        const value = result.data[key];
        console.log(`      ${key}: "${value}"`);
      });
    } else {
      console.log(`   ❌ Hata: ${result.error}`);
    }
    
    console.log('\n4. Template placeholder\'larını kontrol et:');
    const placeholders = await service.listTemplatePlaceholders(templateName);
    console.log(`   ${placeholders.length} placeholder bulundu:`);
    placeholders.forEach(placeholder => {
      console.log(`      {{${placeholder}}}`);
    });
    
    console.log('\n5. Output dosyalarını listele:');
    const outputs = await service.listOutputs();
    console.log(`   ${outputs.length} output dosyası:`);
    outputs.forEach(output => {
      console.log(`      ${output}`);
    });
    
  } catch (error) {
    console.error('❌ Örnek çalıştırma hatası:', error.message);
  }
}

// Script çalıştır
if (require.main === module) {
  exampleUsage().catch(console.error);
}

module.exports = { exampleUsage };
