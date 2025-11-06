/**
 * Word template export functionality
 */

const createReport = require('docx-templates').default;
const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');

class WordExporter {
  constructor() {
    // Absolute path kullan - wordexport klasörü içindeki templates
    const wordexportDir = __dirname; // Bu dosyanın bulunduğu klasör (wordexport)
    this.templatePath = process.env.TEMPLATE_PATH || path.join(wordexportDir, 'templates');
    this.outputPath = process.env.OUTPUT_PATH || path.join(wordexportDir, 'output');
  }

  /**
   * Export edilen DOCX'ten mammoth.js ile uyumsuz elementleri temizle
   */
  async cleanDocxForMammoth(docxPath) {
    try {
      console.log('🧹 Mammoth için DOCX temizleniyor:', docxPath);
      
      // DOCX'i ZIP olarak aç
      const zip = new AdmZip(docxPath);
      const zipEntries = zip.getEntries();
      
      // word/document.xml'i bul ve oku
      const documentEntry = zipEntries.find(entry => entry.entryName === 'word/document.xml');
      if (!documentEntry) {
        console.warn('⚠️ word/document.xml bulunamadı, temizlik atlanıyor');
        return;
      }
      
      let documentXml = documentEntry.getData().toString('utf8');
      const originalLength = documentXml.length;
      
      // Sorunlu elementleri temizle
      // 1. Content Controls (w:sdt) - Mammoth'un okuyamadığı yapılar
      documentXml = documentXml.replace(/<w:sdt\b[^>]*>[\s\S]*?<\/w:sdt>/g, (match) => {
        // İçindeki metni koru, sadece control yapısını kaldır
        const textMatch = match.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
        return textMatch ? textMatch.join('') : '';
      });
      
      // 2. Field Characters (w:fldChar) - Özel field yapıları
      documentXml = documentXml.replace(/<w:fldChar\b[^>]*\/>/g, '');
      
      // 3. Field Simple (w:fldSimple) - Basit field'lar
      documentXml = documentXml.replace(/<w:fldSimple\b[^>]*>[\s\S]*?<\/w:fldSimple>/g, (match) => {
        const textMatch = match.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
        return textMatch ? textMatch.join('') : '';
      });
      
      // 4. Instrtext (w:instrText) - Field instruction text
      documentXml = documentXml.replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, '');
      
      // 5. BookmarkStart/End - Gereksiz bookmark'lar
      documentXml = documentXml.replace(/<w:bookmarkStart[^>]*\/>/g, '');
      documentXml = documentXml.replace(/<w:bookmarkEnd[^>]*\/>/g, '');
      
      const cleanedLength = documentXml.length;
      console.log(`✂️ Temizleme tamamlandı: ${originalLength} → ${cleanedLength} bytes (${originalLength - cleanedLength} bytes temizlendi)`);
      
      // Temizlenmiş XML'i ZIP'e geri yaz
      zip.updateFile('word/document.xml', Buffer.from(documentXml, 'utf8'));
      
      // Temizlenmiş DOCX'i kaydet
      zip.writeZip(docxPath);
      
      console.log('✅ DOCX mammoth uyumlu hale getirildi');
      
    } catch (error) {
      console.error('❌ DOCX temizleme hatası:', error.message);
      // Hata olsa bile devam et, orijinal dosya korunsun
    }
  }

  /**
   * Word template'ini veri ile doldur ve yeni dosya oluştur
   */
  async exportWord(templateFileName, data, outputFileName) {
    try {
      // Template dosya yolunu oluştur
      const templatePath = path.join(this.templatePath, templateFileName);
      
      // Template dosyasının var olduğunu kontrol et
      await fs.access(templatePath);
      
      // Template'i oku
      const templateBuffer = await fs.readFile(templatePath);
      
      // Debug: Data field sayısını logla
      console.log(`🔍 Export Data: ${Object.keys(data).length} fields`);
      
      // Text field'larının object yerine string olduğundan emin ol
      const processedData = { ...data };
      Object.keys(processedData).forEach(key => {
        const value = processedData[key];
        if (value && typeof value === 'object' && value.content) {
          console.log(`🔧 Converting ${key} from object to string`);
          processedData[key] = value.content;
        }
        
        // Çok uzun değerleri logla (muhtemelen sorun kaynağı)
        if (typeof processedData[key] === 'string' && processedData[key].length > 10000) {
          console.warn(`⚠️ ${key} çok uzun (${processedData[key].length} karakter)`);
        }
      });
      
      console.log('✅ Data işlendi, template dolduruluyor...');
      
      // Template'i dinamik olarak düzenle (doküman tarihçesi için)
      // ⚠️ DEVRE DIŞI: adjustTableRows XML'i bozuyor, template'de tüm satırları tanımlıyoruz
      let modifiedTemplate = templateBuffer;
      // if (data.row_count && data.row_count > 0) {
      //   modifiedTemplate = await this.adjustTableRows(templateBuffer, data.row_count);
      // }
      console.log('ℹ️ Template düzenlemesi atlandı (tüm satırlar template\'de mevcut)');
      
      // Word dokümanını oluştur
      const report = await createReport({
        template: modifiedTemplate,
        data: processedData,
        cmdDelimiter: ['{{', '}}'], // {{}} formatını kullan
        additionalJsContext: {
          // Ek JavaScript fonksiyonları
          formatDate: (date) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('tr-TR');
          },
          formatCurrency: (amount) => {
            if (!amount) return '0,00 ₺';
            return new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(amount);
          },
          formatNumber: (num) => {
            if (!num) return '0';
            return new Intl.NumberFormat('tr-TR').format(num);
          },
          upperCase: (str) => {
            if (!str) return '';
            return str.toString().toUpperCase();
          },
          lowerCase: (str) => {
            if (!str) return '';
            return str.toString().toLowerCase();
          },
          capitalize: (str) => {
            if (!str) return '';
            return str.toString().charAt(0).toUpperCase() + str.toString().slice(1).toLowerCase();
          }
        }
      });

      // Output klasörünü oluştur
      await this.ensureOutputDirectory();
      
      // Output dosya yolunu oluştur
      const outputPath = path.join(this.outputPath, outputFileName);
      
      // Dosyayı kaydet
      await fs.writeFile(outputPath, report);
      
      console.log(`✅ Word dokümanı oluşturuldu: ${outputPath}`);
      
      // Mammoth.js ile uyumlu hale getir
      await this.cleanDocxForMammoth(outputPath);
      
      return outputPath;
      
    } catch (error) {
      console.error('❌ Word export hatası:', error.message);
      throw error;
    }
  }

  /**
   * Output klasörünü oluştur
   */
  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputPath);
    } catch (error) {
      await fs.mkdir(this.outputPath, { recursive: true });
      console.log(`✅ Output klasörü oluşturuldu: ${this.outputPath}`);
    }
  }

  /**
   * Template dosyasının var olduğunu kontrol et
   */
  async checkTemplate(templateFileName) {
    const templatePath = path.join(this.templatePath, templateFileName);
    try {
      await fs.access(templatePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mevcut template'leri listele
   */
  async listTemplates() {
    try {
      const files = await fs.readdir(this.templatePath);
      return files.filter(file => 
        file.toLowerCase().endsWith('.docx') || 
        file.toLowerCase().endsWith('.doc')
      );
    } catch (error) {
      console.error('❌ Template listesi alınamadı:', error.message);
      return [];
    }
  }

  /**
   * Output dosyalarını listele
   */
  async listOutputs() {
    try {
      const files = await fs.readdir(this.outputPath);
      return files.filter(file => 
        file.toLowerCase().endsWith('.docx') || 
        file.toLowerCase().endsWith('.doc')
      );
    } catch (error) {
      console.error('❌ Output listesi alınamadı:', error.message);
      return [];
    }
  }

  /**
   * Belirli bir template için placeholder listesi oluştur
   */
  async generatePlaceholderList(templateFileName) {
    try {
      const templatePath = path.join(this.templatePath, templateFileName);
      const templateBuffer = await fs.readFile(templatePath);
      
      // Template içeriğini string olarak oku (basit regex ile placeholder'ları bul)
      const content = templateBuffer.toString();
      const placeholderRegex = /\{\{([^}]+)\}\}/g;
      const placeholders = [];
      let match;
      
      while ((match = placeholderRegex.exec(content)) !== null) {
        placeholders.push(match[1].trim());
      }
      
      // Tekrarları kaldır
      return [...new Set(placeholders)];
      
    } catch (error) {
      console.error('❌ Placeholder listesi oluşturulamadı:', error.message);
      return [];
    }
  }

  /**
   * Veri ve template placeholder'larını karşılaştır
   */
  async validateData(templateFileName, data) {
    const templatePlaceholders = await this.generatePlaceholderList(templateFileName);
    const dataKeys = Object.keys(data);
    
    const missing = templatePlaceholders.filter(placeholder => 
      !dataKeys.includes(placeholder)
    );
    
    const extra = dataKeys.filter(key => 
      !templatePlaceholders.includes(key)
    );
    
    return {
      valid: missing.length === 0,
      missing: missing,
      extra: extra,
      templatePlaceholders: templatePlaceholders,
      dataKeys: dataKeys
    };
  }

  /**
   * Template'deki tablo satırlarını dinamik olarak ayarla
   */
  async adjustTableRows(templateBuffer, rowCount) {
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(templateBuffer);
      
      // document.xml dosyasını bul ve düzenle
      const documentXml = zip.getEntry('word/document.xml');
      if (!documentXml) {
        console.log('⚠️ document.xml bulunamadı, template değiştirilmedi');
        return templateBuffer;
      }
      
      let xmlContent = documentXml.getData().toString('utf8');
      console.log('🔍 XML içerik uzunluğu:', xmlContent.length);
      
      // tarih kelimesini içeren kısımları bul
      const tarikKeywordMatches = xmlContent.match(/tarih[^}]*}/g);
      console.log('🔍 tarih içeren kısımlar:', tarikKeywordMatches?.slice(0, 5));
      
      // w:tr etiketlerini bul - farklı formatları dene
      const trMatches1 = xmlContent.match(/<w:tr[\s\S]*?<\/w:tr>/g);
      const trMatches2 = xmlContent.match(/<w:tr[^>]*>[\s\S]*?<\/w:tr>/g);
      const trMatches3 = xmlContent.match(/w:tr/g);
      
      console.log('🔍 w:tr pattern 1 sayısı:', trMatches1?.length || 0);
      console.log('🔍 w:tr pattern 2 sayısı:', trMatches2?.length || 0);
      console.log('🔍 w:tr kelime sayısı:', trMatches3?.length || 0);
      
      // En çok bulunan pattern'i kullan
      const trMatches = trMatches1 || trMatches2;
      
      // Tablo satırı pattern'ini test et
      if (trMatches && trMatches.length > 0) {
        console.log('🔍 İlk w:tr örneği:', trMatches[0].substring(0, 300) + '...');
      }
      
      // Doküman tarihçesi tablosundaki satırları bul ve düzenle
      // tarih_ kelimesini içeren satırları bul - çok esnek pattern
      const rowPattern = /(<w:tr[^>]*>[\s\S]*?tarih_[\s\S]*?<\/w:tr>)/g;
      const foundRows = [];
      let match;
      
      // Reset regex
      rowPattern.lastIndex = 0;
      
      while ((match = rowPattern.exec(xmlContent)) !== null) {
        // Satır numarasını match içerisinden çıkar
        const rowNumberMatch = match[1].match(/tarih_(\d+)/);
        const rowNumber = rowNumberMatch ? parseInt(rowNumberMatch[1]) : 0;
        
        foundRows.push({
          rowNumber: rowNumber,
          fullMatch: match[1], // İlk grup tüm tr elementi
          index: match.index
        });
        
        // Sonsuz döngüyü önle
        if (foundRows.length > 50) break;
      }
      
      // Debug: İlk birkaç karakteri göster
      if (foundRows.length > 0) {
        console.log('🔍 İlk satır XML preview:', foundRows[0].fullMatch.substring(0, 200) + '...');
      }
      
      console.log(`🔍 Bulunan tablo satırları: ${foundRows.length}`);
      foundRows.forEach(row => {
        console.log(`   Satır ${row.rowNumber} - Index: ${row.index}`);
      });
      
      // Gereksiz satırları kaldır (rowCount'tan büyük olanları)
      const rowsToRemove = foundRows.filter(row => row.rowNumber > rowCount);
      
      if (rowsToRemove.length > 0) {
        console.log(`🗑️ ${rowsToRemove.length} satır kaldırılacak`);
        
        // Sondan başlayarak kaldır (index'ler değişmesin)
        rowsToRemove.sort((a, b) => b.index - a.index);
        
        let offset = 0;
        for (const row of rowsToRemove) {
          console.log(`   Kaldırılıyor: Satır ${row.rowNumber} (Index: ${row.index - offset})`);
          const actualIndex = row.index - offset;
          const actualLength = row.fullMatch.length;
          
          xmlContent = xmlContent.slice(0, actualIndex) + xmlContent.slice(actualIndex + actualLength);
          offset += actualLength;
        }
        
        // Yeni XML'i zip'e geri yaz
        zip.updateFile('word/document.xml', Buffer.from(xmlContent, 'utf8'));
        
        return zip.toBuffer();
      }
      
      return templateBuffer; // Değişiklik yoksa orijinali döndür
      
    } catch (error) {
      console.log('⚠️ Template düzenleme hatası:', error.message);
      return templateBuffer;
    }
  }

  /**
   * Batch export - birden fazla doküman için export
   */
  async batchExport(templateFileName, documentsData) {
    const results = [];
    
    for (const docData of documentsData) {
      try {
        const outputFileName = `${docData.docId}_${new Date().getTime()}.docx`;
        const outputPath = await this.exportWord(templateFileName, docData.data, outputFileName);
        results.push({
          success: true,
          docId: docData.docId,
          outputPath: outputPath
        });
      } catch (error) {
        results.push({
          success: false,
          docId: docData.docId,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = WordExporter;
