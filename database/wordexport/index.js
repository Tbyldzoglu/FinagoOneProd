/**
 * Ana Word Export servisi
 */

const DatabaseService = require('./database');
const DataParser = require('./dataParser');
const WordExporter = require('./wordExporter');

class WordExportService {
  constructor() {
    this.db = new DatabaseService();
    this.parser = new DataParser();
    this.exporter = new WordExporter();
  }

  /**
   * Belirli bir doküman için Word export yap
   */
  async exportDocument(docId, userId = 'default', templateFileName, outputFileName = null) {
    try {
      console.log(`🔄 Doküman export başlatılıyor: ${docId}`);
      
      // Database'e bağlan
      await this.db.connect();
      
      // Modal verilerini çek
      const modalData = await this.db.getModalData(docId, userId);
      console.log('✅ Modal verileri çekildi');
      
      // Verileri parse et
      const parsedData = this.parser.parseAllModals(modalData);
      console.log(`✅ Veriler parse edildi: ${Object.keys(parsedData).length} alan`);
      
      // Output dosya adını oluştur
      if (!outputFileName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        outputFileName = `${docId}_${timestamp}.docx`;
      }
      
      // Word dokümanını oluştur
      const outputPath = await this.exporter.exportWord(templateFileName, parsedData, outputFileName);
      
      console.log(`✅ Export tamamlandı: ${outputPath}`);
      return {
        success: true,
        outputPath: outputPath,
        dataCount: Object.keys(parsedData).length
      };
      
    } catch (error) {
      console.error('❌ Export hatası:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.db.disconnect();
    }
  }

  /**
   * Sadece talep bilgileri için export yap
   */
  async exportTalepBilgileri(docId, userId = 'default', templateFileName, outputFileName = null) {
    try {
      console.log(`🔄 Talep Bilgileri export başlatılıyor: ${docId}`);
      
      // Database'e bağlan
      await this.db.connect();
      
      // Sadece talep bilgileri modal verisini çek
      const talepData = await this.db.getModalColumn(docId, userId, 'talep_bilgileri_modal');
      
      if (!talepData) {
        throw new Error('Talep bilgileri verisi bulunamadı');
      }
      
      // Talep bilgilerini parse et
      const parsedData = this.parser.parseTalepBilgileri(talepData);
      console.log(`✅ Talep bilgileri parse edildi: ${Object.keys(parsedData).length} alan`);
      
      // Output dosya adını oluştur
      if (!outputFileName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        outputFileName = `talep_bilgileri_${docId}_${timestamp}.docx`;
      }
      
      // Word dokümanını oluştur
      const outputPath = await this.exporter.exportWord(templateFileName, parsedData, outputFileName);
      
      console.log(`✅ Talep Bilgileri export tamamlandı: ${outputPath}`);
      return {
        success: true,
        outputPath: outputPath,
        dataCount: Object.keys(parsedData).length,
        data: parsedData
      };
      
    } catch (error) {
      console.error('❌ Talep Bilgileri export hatası:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.db.disconnect();
    }
  }

  /**
   * Tüm dokümanları listele
   */
  async listDocuments() {
    try {
      await this.db.connect();
      const documents = await this.db.getAllDocuments();
      await this.db.disconnect();
      return documents;
    } catch (error) {
      console.error('❌ Doküman listesi hatası:', error.message);
      throw error;
    }
  }

  /**
   * Template'leri listele
   */
  async listTemplates() {
    return await this.exporter.listTemplates();
  }

  /**
   * Output dosyalarını listele
   */
  async listOutputs() {
    return await this.exporter.listOutputs();
  }

  /**
   * Template placeholder'larını listele
   */
  async listTemplatePlaceholders(templateFileName) {
    return await this.exporter.generatePlaceholderList(templateFileName);
  }

  /**
   * Veri ve template uyumluluğunu kontrol et
   */
  async validateTemplate(templateFileName, docId, userId = 'default') {
    try {
      await this.db.connect();
      const modalData = await this.db.getModalData(docId, userId);
      const parsedData = this.parser.parseAllModals(modalData);
      await this.db.disconnect();
      
      return await this.exporter.validateData(templateFileName, parsedData);
    } catch (error) {
      console.error('❌ Template validation hatası:', error.message);
      throw error;
    }
  }

  /**
   * Batch export - birden fazla doküman
   */
  async batchExport(templateFileName, docIds, userId = 'default') {
    const results = [];
    
    for (const docId of docIds) {
      const result = await this.exportDocument(docId, userId, templateFileName);
      results.push({
        docId: docId,
        ...result
      });
    }
    
    return results;
  }
}

module.exports = WordExportService;
