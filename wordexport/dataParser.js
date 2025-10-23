/**
 * JSON verilerini etiket-text çiftlerine çeviren parser
 */

class DataParser {
  constructor() {
    this.placeholderPrefix = '{{';
    this.placeholderSuffix = '}}';
  }

  /**
   * Talep Bilgileri modal verisini parse et
   */
  parseTalepBilgileri(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Veri yapısını kontrol et - fields veya formData
    let formData = null;
    if (modalData.fields) {
      formData = modalData.fields;
    } else if (modalData.formData) {
      formData = modalData.formData;
    }

    if (formData) {
      // Form alanlarını etiket-text çiftlerine çevir
      Object.keys(formData).forEach(key => {
        const value = formData[key] || '';
        result[key] = this.cleanValue(value);
      });
    }

    // Meta bilgileri ekle
    if (modalData.title) {
      result['modal_title'] = modalData.title;
    }
    if (modalData.timestamp) {
      result['export_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }
    if (modalData.isProcessed) {
      result['is_processed'] = modalData.isProcessed ? 'Evet' : 'Hayır';
    }

    return result;
  }

  /**
   * Doküman Tarihçesi modal verisini parse et
   */
  parseDocumentHistory(modalData) {
    if (!modalData) {
      return {};
    }

    console.log('🔍 Document History Debug:', JSON.stringify(modalData, null, 2));

    const result = {};

    // Veri yapısını kontrol et - database'den gelen format 'rows' array'i
    let tableData = null;
    if (modalData.rows && Array.isArray(modalData.rows)) {
      // Database formatı: rows array'inde her row'da data objesi var
      tableData = modalData.rows.map(row => row.data);
    } else if (modalData.tableRows && Array.isArray(modalData.tableRows)) {
      tableData = modalData.tableRows;
    } else if (modalData.formData && modalData.formData.tableRows) {
      tableData = modalData.formData.tableRows;
    }

    console.log('🔍 Table Data Found:', tableData);

    if (tableData && Array.isArray(tableData)) {
      // Her satır için ayrı field'lar oluştur (tarih_1, tarih_2, tarih_3...)
      const maxRows = 10; // Template'de maksimum satır sayısı
      
      // Gerçek verileri ekle
      tableData.forEach((row, index) => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(field => {
            const value = row[field] || '';
            result[`${field}_${index + 1}`] = this.cleanValue(value);
          });
        }
      });
      
      // Boş satırlar için boş string ekle (gizleme için)
      for (let i = tableData.length; i < maxRows; i++) {
        const rowIndex = i + 1;
        result[`tarih_${rowIndex}`] = '';
        result[`versiyon_${rowIndex}`] = '';
        result[`degisiklikYapan_${rowIndex}`] = '';
        result[`aciklama_${rowIndex}`] = '';
        
        // Satır görünürlük kontrolü için
        result[`show_row_${rowIndex}`] = false;
      }
      
      // Dolu satırlar için görünürlük true
      for (let i = 0; i < tableData.length; i++) {
        result[`show_row_${i + 1}`] = true;
      }
      
      // İlk satırın değerlerini de direkt field ismiyle ekle
      if (tableData.length > 0) {
        const firstRow = tableData[0];
        if (firstRow && typeof firstRow === 'object') {
          Object.keys(firstRow).forEach(field => {
            const value = firstRow[field] || '';
            result[field] = this.cleanValue(value);
          });
        }
      }
      
      // Satır sayısını da ekle
      result.row_count = tableData.length;
    }

    // Meta bilgileri ekle
    if (modalData.title) {
      result['tarihce_modal_title'] = modalData.title;
    }
    if (modalData.timestamp) {
      result['tarihce_export_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * X İşlemi Muhasebesi modal verisini parse et
   */
  parseXIslemiMuhasebesi(modalData) {
    if (!modalData || !modalData.formData) {
      return {};
    }

    const formData = modalData.formData;
    const result = {};

    // Form alanlarını etiket-text çiftlerine çevir
    Object.keys(formData).forEach(key => {
      const value = formData[key] || '';
      result[key] = this.cleanValue(value);
    });

    // Meta bilgileri ekle
    if (modalData.title) {
      result['modal_title'] = modalData.title;
    }
    if (modalData.timestamp) {
      result['export_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * Case1 modal verisini parse et (tablo verisi)
   */
  parseCase1(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Basit alanlar
    if (modalData.title) {
      result['modal_title'] = modalData.title;
    }
    if (modalData.content) {
      result['content'] = this.cleanValue(modalData.content);
    }

    // Tablo verilerini parse et
    if (modalData.tableRows && Array.isArray(modalData.tableRows)) {
      modalData.tableRows.forEach((row, index) => {
        if (row.data) {
          Object.keys(row.data).forEach(field => {
            const value = row.data[field] || '';
            result[`row_${index + 1}_${field}`] = this.cleanValue(value);
          });
        }
      });
    }

    return result;
  }

  /**
   * Ekran Tasarımları modal verisini parse et
   */
  parseEkranTasarimlari(modalData) {
    
    if (!modalData) {
      return {};
    }

    const result = {};

    // Yeni yapı: formData yerine tableData kullan
    const formData = modalData.tableData || modalData.formData;
    
    if (!formData) {
      return {};
    }

    // Ekran Bilgileri tablosu - sabit başlıklar için fixed field'lar
    if (formData.ekranBilgileri && Array.isArray(formData.ekranBilgileri)) {
      formData.ekranBilgileri.forEach((row) => {
        const label = this.normalizeLabel(row.label);
        result[label] = this.cleanValue(row.value);
      });
    }

    // Alan Detayları tablosu
    if (formData.alanDetaylari && Array.isArray(formData.alanDetaylari)) {
      formData.alanDetaylari.forEach((row, index) => {
        result[`alan_detay_${index + 1}_alan_adi`] = this.cleanValue(row.alanAdi);
        result[`alan_detay_${index + 1}_tip`] = this.cleanValue(row.tip);
        result[`alan_detay_${index + 1}_uzunluk`] = this.cleanValue(row.uzunluk);
        result[`alan_detay_${index + 1}_zorunlu`] = this.cleanValue(row.zorunlu);
        result[`alan_detay_${index + 1}_varsayilan`] = this.cleanValue(row.varsayilan);
        result[`alan_detay_${index + 1}_degistirilebilir`] = this.cleanValue(row.degistirilebilir);
        result[`alan_detay_${index + 1}_is_kurallari`] = this.cleanValue(row.isKurallari);
      });
    }
    
    // Transfer sonrası eksik tablo verilerini boş değerlerle doldur
    // Template'de en fazla 10 satır olduğunu varsayıyoruz
    for (let i = 1; i <= 10; i++) {
      if (!result[`alan_detay_${i}_alan_adi`]) {
        result[`alan_detay_${i}_alan_adi`] = '';
        result[`alan_detay_${i}_tip`] = '';
        result[`alan_detay_${i}_uzunluk`] = '';
        result[`alan_detay_${i}_zorunlu`] = '';
        result[`alan_detay_${i}_varsayilan`] = '';
        result[`alan_detay_${i}_degistirilebilir`] = '';
        result[`alan_detay_${i}_is_kurallari`] = '';
      }
    }

    // Hesaplama Kuralları tablosu
    if (formData.hesaplamaKurallari && Array.isArray(formData.hesaplamaKurallari)) {
      formData.hesaplamaKurallari.forEach((row, index) => {
        result[`hesaplama_kural_${index + 1}_alan_adi`] = this.cleanValue(row.alanAdi);
        result[`hesaplama_kural_${index + 1}_hesaplama_kurali_aciklama`] = this.cleanValue(row.hesaplamaKuraliAciklama);
      });
    }
    
    // Transfer sonrası eksik hesaplama kurallarını boş değerlerle doldur
    for (let i = 1; i <= 10; i++) {
      if (!result[`hesaplama_kural_${i}_alan_adi`]) {
        result[`hesaplama_kural_${i}_alan_adi`] = '';
        result[`hesaplama_kural_${i}_hesaplama_kurali_aciklama`] = '';
      }
    }
    
    // Transfer sonrası eksik text alanlarını boş değerlerle doldur
    const textFields = [
      'tasklar_batchlar_text', 'entegrasyonlar_text', 'mesajlar_text', 
      'parametreler_text', 'task_is_akisi_text', 'diagram_akislar_text',
      'muhasebe_text', 'x_islemi_muhasebe_deseni_text', 'case1_text',
      'x_islemi_kayit_kurallari_text', 'x_islemi_vergi_komisyon_text',
      'x_islemi_muhasebe_senaryolari_text', 'x_islemi_ornek_kayitlar_text',
      'fonksiyonel_olmayan_gereksinimler_text', 'kimlik_dogrulama_log_text',
      'yetkilendirme_onay_text', 'veri_kritikligi_text', 'paydaslar_kullanicilar_text',
      'kapsam_disinda_text', 'kabul_kriterleri_text', 'onaylar_text', 'ekler_text'
    ];
    
    textFields.forEach(field => {
      if (!result[field]) {
        result[field] = '';
      }
    });

    // Buton Tasarımları tablosu
    if (formData.butonTasarimlari && Array.isArray(formData.butonTasarimlari)) {
      formData.butonTasarimlari.forEach((row, index) => {
        result[`buton_tasarim_${index + 1}_buton_adi`] = this.cleanValue(row.butonAdi);
        result[`buton_tasarim_${index + 1}_aciklama`] = this.cleanValue(row.aciklama);
        result[`buton_tasarim_${index + 1}_aktiflik`] = this.cleanValue(row.aktiflik);
        result[`buton_tasarim_${index + 1}_gorunurluk`] = this.cleanValue(row.gorunurluk);
      });
    }

    // Açıklama metni - boş olsa bile field oluştur
    result['aciklama_metni'] = this.cleanValue(formData.aciklamaMetni || '');

    // Text content'i de kontrol et (modalData seviyesinde) - database key'i ile aynı
    if (modalData.textContent) {
      result['textContent'] = this.cleanValue(modalData.textContent);
    } else {
      result['textContent'] = '';
    }

    return result;
  }

  /**
   * Tasklar/Batchlar modal verisini parse et
   */
  parseTasklarBatchlar(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};
    
    // Text content (modalData seviyesinde)
    if (modalData.textContent) {
      result['tasklar_batchlar_text'] = this.cleanValue(modalData.textContent);
    }
    
    // Form data veya table data kontrol et
    const formData = modalData.formData || modalData.tableData;
    if (!formData) {
      return result;
    }

    // Açıklama metni
    if (formData.aciklamaMetni) {
      result['tasklar_batchlar_aciklama'] = this.cleanValue(formData.aciklamaMetni);
    }

    // Task/Batch tablosu
    const maxRows = 10; // Maksimum satır sayısı
    const tableData = formData.taskBatchTable || [];
    
    // Gerçek verileri ekle
    tableData.forEach((row, index) => {
      const rowNum = index + 1;
      result[`task_batch_${rowNum}_yeni_mevcut`] = this.cleanValue(row.yeniMevcut);
      result[`task_batch_${rowNum}_task_job_adi`] = this.cleanValue(row.taskJobAdi);
      result[`task_batch_${rowNum}_tanim`] = this.cleanValue(row.tanim);
      result[`task_batch_${rowNum}_sorumlu_sistem`] = this.cleanValue(row.sorumluSistem);
      result[`task_batch_${rowNum}_calisma_saati`] = this.cleanValue(row.calismaSaati);
      result[`task_batch_${rowNum}_calisma_sikligi`] = this.cleanValue(row.calismaSikligi);
      result[`task_batch_${rowNum}_bagimliliklar`] = this.cleanValue(row.bagimliliklar);
      result[`task_batch_${rowNum}_alert_mekanizmasi`] = this.cleanValue(row.alertMekanizmasi);
      result[`task_batch_${rowNum}_alternatif_calistirma`] = this.cleanValue(row.alternatifCalistirmaYontemi);
    });
    
    // Boş satırlar için boş string ekle (gizleme için)
    for (let i = tableData.length; i < maxRows; i++) {
      const rowNum = i + 1;
      result[`task_batch_${rowNum}_yeni_mevcut`] = '';
      result[`task_batch_${rowNum}_task_job_adi`] = '';
      result[`task_batch_${rowNum}_tanim`] = '';
      result[`task_batch_${rowNum}_sorumlu_sistem`] = '';
      result[`task_batch_${rowNum}_calisma_saati`] = '';
      result[`task_batch_${rowNum}_calisma_sikligi`] = '';
      result[`task_batch_${rowNum}_bagimliliklar`] = '';
      result[`task_batch_${rowNum}_alert_mekanizmasi`] = '';
      result[`task_batch_${rowNum}_alternatif_calistirma`] = '';
    }

    // Meta bilgileri
    if (modalData.title) {
      result['tasklar_batchlar_title'] = modalData.title;
    }
    if (modalData.timestamp) {
      result['tasklar_batchlar_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * Entegrasyonlar modal verisini parse et
   */
  parseEntegrasyonlar(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Meta bilgileri
    if (modalData.title) {
      result['entegrasyonlar_title'] = modalData.title;
    }

    // Entegrasyonlar tablosu
    const maxRows = 10; // Maksimum satır sayısı
    const tableData = modalData.entegrasyonlar || modalData.tableData || [];
    
    // Gerçek verileri ekle
    tableData.forEach((row, index) => {
      const rowNum = index + 1;
      result[`entegrasyon_${rowNum}_adi`] = this.cleanValue(row.entegrasyonAdi);
      result[`entegrasyon_${rowNum}_amac`] = this.cleanValue(row.amac);
      result[`entegrasyon_${rowNum}_sorumlu_sistemler`] = this.cleanValue(row.sorumluSistemler);
    });
    
    // Boş satırlar için boş string ekle (gizleme için)
    for (let i = tableData.length; i < maxRows; i++) {
      const rowNum = i + 1;
      result[`entegrasyon_${rowNum}_adi`] = '';
      result[`entegrasyon_${rowNum}_amac`] = '';
      result[`entegrasyon_${rowNum}_sorumlu_sistemler`] = '';
    }

    // Meta bilgileri
    if (modalData.timestamp) {
      result['entegrasyonlar_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * Mesajlar/Uyarılar/Bilgilendirmeler modal verisini parse et
   */
  parseMesajlar(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Meta bilgileri
    if (modalData.title) {
      result['mesajlar_title'] = modalData.title;
    }

    // Mesajlar tablosu
    const maxRows = 10; // Maksimum satır sayısı
    const tableData = modalData.mesajlar || modalData.tableData || [];
    
    // Gerçek verileri ekle
    tableData.forEach((row, index) => {
      const rowNum = index + 1;
      result[`mesaj_${rowNum}_tipi`] = this.cleanValue(row.mesajTipi);
      result[`mesaj_${rowNum}_case`] = this.cleanValue(row.case);
      result[`mesaj_${rowNum}_dili`] = this.cleanValue(row.mesajDili);
      result[`mesaj_${rowNum}_metin`] = this.cleanValue(row.mesajMetin);
    });
    
    // Boş satırlar için boş string ekle (gizleme için)
    for (let i = tableData.length; i < maxRows; i++) {
      const rowNum = i + 1;
      result[`mesaj_${rowNum}_tipi`] = '';
      result[`mesaj_${rowNum}_case`] = '';
      result[`mesaj_${rowNum}_dili`] = '';
      result[`mesaj_${rowNum}_metin`] = '';
    }

    // Meta bilgileri
    if (modalData.timestamp) {
      result['mesajlar_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * Parametreler ve Tanımlar modal verisini parse et
   */
  parseParametreler(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Meta bilgileri
    if (modalData.title) {
      result['parametreler_title'] = modalData.title;
    }

    // Parametreler tablosu (yatay - tek satır)
    const tableData = modalData.parametreler || modalData.tableData || [];
    
    // İlk parametreyi al (yatay tabloda tek satır - template uyumluluğu için _1 suffix)
    if (tableData.length > 0) {
      const data = tableData[0].data || tableData[0]; // data wrapper'ı varsa kullan, yoksa direkt row'u kullan
      
      result['parametre_1_adi'] = this.cleanValue(data.parametreAdi);
      result['parametre_1_aciklama'] = this.cleanValue(data.aciklama);
      result['parametre_1_kapsam_kullanim_alani'] = this.cleanValue(data.kapsamKullanimAlani);
      result['parametre_1_varsayilan_deger'] = this.cleanValue(data.varsayilanDeger);
      result['parametre_1_deger_araligi'] = this.cleanValue(data.degerAraligi);
      result['parametre_1_yetki'] = this.cleanValue(data.parametreYetkisi);
    } else {
      // Veri yoksa boş değerler
      result['parametre_1_adi'] = '';
      result['parametre_1_aciklama'] = '';
      result['parametre_1_kapsam_kullanim_alani'] = '';
      result['parametre_1_varsayilan_deger'] = '';
      result['parametre_1_deger_araligi'] = '';
      result['parametre_1_yetki'] = '';
    }

    // Meta bilgileri
    if (modalData.timestamp) {
      result['parametreler_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * X İşlemi Muhasebesi modal verisini parse et
   */
  parseXIslemiMuhasebesi(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Meta bilgileri
    if (modalData.title) {
      result['x_islemi_muhasebesi_title'] = modalData.title;
    }

    // Form data kontrol et
    const formData = modalData.formData;
    if (formData) {
      result['x_islemi_tanimi'] = this.cleanValue(formData.islemTanimi);
      result['x_islemi_ilgili_urun_modul'] = this.cleanValue(formData.ilgiliUrunModul);
      result['x_islemi_tetikleyici_olay'] = this.cleanValue(formData.tetikleyiciOlay);
      result['x_islemi_muhasebe_kaydinin_izlenecegi_ekran'] = this.cleanValue(formData.muhasebeKaydininiIzlenecegiEkran);
      result['x_islemi_hata_yonetimi'] = this.cleanValue(formData.hataYonetimi);
    }

    // Meta bilgileri
    if (modalData.timestamp) {
      result['x_islemi_muhasebesi_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * Case1 - X İşlemi Muhasebe modalını parse et
   */
  parseCase1(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};
    // tableData.tableRows veya direkt tableRows kontrol et
    const tableData = (modalData.tableData && modalData.tableData.tableRows) || modalData.tableRows || [];

    // Title'ı ekle
    if (modalData.title) {
      result['case1_title'] = this.cleanValue(modalData.title);
    }

    // Timestamp ekle
    if (modalData.timestamp) {
      result['case1_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    // Her satır için placeholder'lar oluştur
    tableData.forEach((row, index) => {
      const rowIndex = index + 1;
      const rowData = row.data || {};

      // Her field için placeholder oluştur
      Object.keys(rowData).forEach(fieldKey => {
        const fieldValue = this.cleanValue(rowData[fieldKey] || '');
        result[`case1_${rowIndex}_${fieldKey}`] = fieldValue;
      });
    });

    // Boş satırlar için placeholder'lar oluştur (10 satıra kadar)
    for (let i = tableData.length + 1; i <= 10; i++) {
      const fields = ['subeKodu', 'musteriNo', 'defter', 'borcAlacak', 'tutar', 'dovizCinsi', 'aciklama'];
      fields.forEach(field => {
        result[`case1_${i}_${field}`] = '';
      });
    }

    console.log('🎯 Case1 Parse Result:', Object.keys(result).length, 'placeholders created');
    return result;
  }

  /**
   * Yetkilendirme ve Onay Mekanizmaları modalını parse et
   */
  parseYetkilendirmeOnay(modalData) {
    if (!modalData || !modalData.modals) {
      return {};
    }

    const result = {};

    // Title'ı ekle
    if (modalData.title) {
      result['yetkilendirme_onay_title'] = this.cleanValue(modalData.title);
    }

    // Timestamp ekle
    if (modalData.timestamp) {
      result['yetkilendirme_onay_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    // Yetkilendirme tablosu
    if (modalData.modals.yetkilendirme && modalData.modals.yetkilendirme.tableData) {
      const yetkilendirmeRows = modalData.modals.yetkilendirme.tableData.tableRows || [];
      
      // Her satır için placeholder'lar oluştur
      yetkilendirmeRows.forEach((row, index) => {
        const rowIndex = index + 1;
        const rowData = row.data || {};

        // Her field için placeholder oluştur
        Object.keys(rowData).forEach(fieldKey => {
          const fieldValue = this.cleanValue(rowData[fieldKey] || '');
          result[`yetkilendirme_${rowIndex}_${fieldKey}`] = fieldValue;
        });
      });

      // Boş satırlar için placeholder'lar oluştur (10 satıra kadar)
      for (let i = yetkilendirmeRows.length + 1; i <= 10; i++) {
        const fields = ['rolKullanici', 'ekranIslem', 'goruntuleme', 'ekleme', 'guncelleme', 'silme', 'onaylama'];
        fields.forEach(field => {
          result[`yetkilendirme_${i}_${field}`] = '';
        });
      }
    }

    // Onay Süreci tablosu
    if (modalData.modals.onaySureci && modalData.modals.onaySureci.tableData) {
      const onayRows = modalData.modals.onaySureci.tableData.tableRows || [];
      
      // Her satır için placeholder'lar oluştur
      onayRows.forEach((row, index) => {
        const rowIndex = index + 1;
        const rowData = row.data || {};

        // Her field için placeholder oluştur
        Object.keys(rowData).forEach(fieldKey => {
          const fieldValue = this.cleanValue(rowData[fieldKey] || '');
          result[`onay_sureci_${rowIndex}_${fieldKey}`] = fieldValue;
        });
      });

      // Boş satırlar için placeholder'lar oluştur (10 satıra kadar)
      for (let i = onayRows.length + 1; i <= 10; i++) {
        const fields = ['islemTipi', 'onaySeviyesi', 'onaySureci', 'aciklama'];
        fields.forEach(field => {
          result[`onay_sureci_${i}_${field}`] = '';
        });
      }
    }

    console.log('🎯 Yetkilendirme ve Onay Parse Result:', Object.keys(result).length, 'placeholders created');
    return result;
  }

  /**
   * Veri Kritikliği modalını parse et
   */
  parseVeriKritikligi(modalData) {
    if (!modalData || !modalData.tableData) {
      return {};
    }

    const result = {};
    const tableData = modalData.tableData.tableRows || [];

    // Title'ı ekle
    if (modalData.title) {
      result['veri_kritikligi_title'] = this.cleanValue(modalData.title);
    }

    // Timestamp ekle
    if (modalData.timestamp) {
      result['veri_kritikligi_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    // Her satır için placeholder'lar oluştur
    tableData.forEach((row, index) => {
      const rowIndex = index + 1;
      const rowData = row.data || {};

      // Her field için placeholder oluştur
      Object.keys(rowData).forEach(fieldKey => {
        const fieldValue = this.cleanValue(rowData[fieldKey] || '');
        result[`veri_kritikligi_${rowIndex}_${fieldKey}`] = fieldValue;
      });
    });

    // Boş satırlar için placeholder'lar oluştur (10 satıra kadar)
    for (let i = tableData.length + 1; i <= 10; i++) {
      const fields = ['sira', 'veriAdi', 'tabloAdi', 'veriAdiAciklamasi', 'gizlilik', 'butunluk', 'erisilebilirlik', 'hassasVeriMi', 'sirVeriMi'];
      fields.forEach(field => {
        result[`veri_kritikligi_${i}_${field}`] = '';
      });
    }

    console.log('🎯 Veri Kritikliği Parse Result:', Object.keys(result).length, 'placeholders created');
    return result;
  }

  /**
   * Paydaşlar ve Kullanıcılar modalını parse et
   */
  parsePaydaslarKullanicilar(modalData) {
    if (!modalData || !modalData.formData) {
      return {};
    }

    const result = {};
    const formData = modalData.formData.data || {};

    // Title'ı ekle
    if (modalData.title) {
      result['paydaslar_kullanicilar_title'] = this.cleanValue(modalData.title);
    }

    // Timestamp ekle
    if (modalData.timestamp) {
      result['paydaslar_kullanicilar_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    // Her form field'ı için placeholder oluştur
    Object.keys(formData).forEach(fieldKey => {
      const fieldValue = this.cleanValue(formData[fieldKey] || '');
      // Field adını placeholder olarak kullan (underscore case)
      const placeholderKey = this.normalizeLabel(fieldKey);
      result[placeholderKey] = fieldValue;
    });

    console.log('🎯 Paydaşlar ve Kullanıcılar Parse Result:', Object.keys(result).length, 'placeholders created');
    return result;
  }

  /**
   * Kabul Kriterleri modalını parse et
   */
  parseKabulKriterleri(modalData) {
    if (!modalData || !modalData.tableData) {
      return {};
    }

    const result = {};
    const tableData = modalData.tableData.tableRows || [];

    // Title'ı ekle
    if (modalData.title) {
      result['kabul_kriterleri_title'] = this.cleanValue(modalData.title);
    }

    // Timestamp ekle
    if (modalData.timestamp) {
      result['kabul_kriterleri_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    // Her satır için placeholder'lar oluştur
    tableData.forEach((row, index) => {
      const rowIndex = index + 1;
      
      // kriterIs, aciklama, islemler fieldları
      result[`kabul_kriterleri_${rowIndex}_kriterIs`] = this.cleanValue(row.kriterIs || '');
      result[`kabul_kriterleri_${rowIndex}_aciklama`] = this.cleanValue(row.aciklama || '');
      result[`kabul_kriterleri_${rowIndex}_islemler`] = this.cleanValue(row.islemler || '');
    });

    // Boş satırlar için placeholder'lar oluştur (10 satıra kadar)
    for (let i = tableData.length + 1; i <= 10; i++) {
      result[`kabul_kriterleri_${i}_kriterIs`] = '';
      result[`kabul_kriterleri_${i}_aciklama`] = '';
      result[`kabul_kriterleri_${i}_islemler`] = '';
    }

    console.log('🎯 Kabul Kriterleri Parse Result:', Object.keys(result).length, 'placeholders created');
    return result;
  }

  /**
   * Onaylar modalını parse et
   */
  parseOnaylar(modalData) {
    if (!modalData || !modalData.tableData) {
      return {};
    }

    const result = {};
    const tableData = modalData.tableData.tableRows || [];

    // Title'ı ekle
    if (modalData.title) {
      result['onaylar_title'] = this.cleanValue(modalData.title);
    }

    // Timestamp ekle
    if (modalData.timestamp) {
      result['onaylar_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    // Her satır için placeholder'lar oluştur
    tableData.forEach((row, index) => {
      const rowIndex = index + 1;
      
      // isim, unvan, tarih fieldları
      result[`onaylar_${rowIndex}_isim`] = this.cleanValue(row.isim || '');
      result[`onaylar_${rowIndex}_unvan`] = this.cleanValue(row.unvan || '');
      result[`onaylar_${rowIndex}_tarih`] = this.cleanValue(row.tarih || '');
    });

    // Boş satırlar için placeholder'lar oluştur (10 satıra kadar)
    for (let i = tableData.length + 1; i <= 10; i++) {
      result[`onaylar_${i}_isim`] = '';
      result[`onaylar_${i}_unvan`] = '';
      result[`onaylar_${i}_tarih`] = '';
    }

    console.log('🎯 Onaylar Parse Result:', Object.keys(result).length, 'placeholders created');
    return result;
  }

  /**
   * Talep Değerlendirmesi modal verisini parse et - Talep Bilgileri tarzında basit
   */
  parseTalepDegerlendirmesi(modalData) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Veri yapısını kontrol et - fields veya formData
    let formData = null;
    if (modalData.fields) {
      formData = modalData.fields;
    } else if (modalData.formData) {
      formData = modalData.formData;
    }

    if (formData) {
      // Form alanlarını flatten et - nested objeler için
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        
        if (value && typeof value === 'object' && value.yanit !== undefined) {
          // Yanit ve açıklama içeren objeler - flatten et
          result[`${key}_yanit`] = this.cleanValue(value.yanit);
          result[`${key}_aciklama`] = this.cleanValue(value.aciklama);
        } else {
          // Direkt değerler (urunAdi gibi)
          result[key] = this.cleanValue(value);
        }
      });
    }

    // Meta bilgileri ekle
    if (modalData.title) {
      result['modal_title'] = modalData.title;
    }
    if (modalData.timestamp) {
      result['export_timestamp'] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }
    if (modalData.isProcessed) {
      result['is_processed'] = modalData.isProcessed ? 'Evet' : 'Hayır';
    }

    return result;
  }

  /**
   * Basit text modal verisini parse et
   */
  parseTextModal(modalData, fieldName) {
    if (!modalData) {
      return {};
    }

    const result = {};

    // Eğer modalData string ise, direkt kullan
    if (typeof modalData === 'string') {
      result[fieldName] = this.cleanValue(modalData);
      return result;
    }

    // Eğer content property'si varsa onu kullan
    if (modalData.content) {
      result[fieldName] = this.cleanValue(modalData.content);
    }
    // Eğer content yoksa ama modalData direkt text ise
    else if (typeof modalData === 'string') {
      result[fieldName] = this.cleanValue(modalData);
    }
    // Eğer hiçbiri yoksa boş string
    else {
      result[fieldName] = '';
    }
    
    if (modalData.title) {
      result[`${fieldName}_title`] = modalData.title;
    }
    if (modalData.timestamp) {
      result[`${fieldName}_timestamp`] = new Date(modalData.timestamp).toLocaleString('tr-TR');
    }

    return result;
  }

  /**
   * Tüm modal verilerini birleştir
   */
  parseAllModals(modalData) {
    const result = {};
    

    // Talep Bilgileri
    if (modalData.talep_bilgileri_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let talepData = modalData.talep_bilgileri_modal;
        
        // Eğer string ise parse et
        if (typeof talepData === 'string') {
          talepData = JSON.parse(talepData);
        }
        
        // Çifte JSON kontrol et
        if (talepData && talepData.content) {
          let contentData = talepData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              talepData = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          } else {
            talepData = contentData;
          }
        }
        
        Object.assign(result, this.parseTalepBilgileri(talepData));
      } catch (error) {
        console.log('❌ Talep Bilgileri parse hatası:', error.message);
      }
    } else {
      // Boş veri için placeholder değerler ekle
      result.talep_no = '';
      result.talep_adi = '';
      result.talep_sahibi_is_birimi = '';
      result.talep_sahibi_kurum = '';
      result.talep_yoneticisi = '';
      result.teknik_ekipler = '';
    }

    // Doküman Tarihçesi
    console.log('🔍 Dokuman Tarihcesi Check:', {
      exists: !!modalData.dokuman_tarihcesi,
      value: modalData.dokuman_tarihcesi
    });
    
    if (modalData.dokuman_tarihcesi) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let tarihceData = modalData.dokuman_tarihcesi;
        
        // Eğer string ise parse et
        if (typeof tarihceData === 'string') {
          tarihceData = JSON.parse(tarihceData);
        }
        
        // Çifte JSON kontrol et
        if (tarihceData && tarihceData.content) {
          let contentData = tarihceData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              tarihceData = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          } else {
            tarihceData = contentData;
          }
        }
        
        Object.assign(result, this.parseDocumentHistory(tarihceData));
      } catch (error) {
        console.log('❌ Doküman Tarihçesi parse hatası:', error.message);
      }
    } else {
      // Boş veri için placeholder değerler ekle - tablo formatında
      const maxRows = 10; // Template'de maksimum satır sayısı
      
      for (let i = 1; i <= maxRows; i++) {
        result[`tarih_${i}`] = '';
        result[`versiyon_${i}`] = '';
        result[`degisiklikYapan_${i}`] = '';
        result[`aciklama_${i}`] = '';
        result[`show_row_${i}`] = false;
      }
      
      // Eski format için de ekle (uyumluluk)
      result.tarih = '';
      result.versiyon = '';
      result.degisiklikYapan = '';
      result.aciklama = '';
    }

    // Talep Değerlendirmesi
    if (modalData.talep_degerlendirmesi_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let talepDegRawData = modalData.talep_degerlendirmesi_modal;
        
        // Eğer string ise parse et
        if (typeof talepDegRawData === 'string') {
          talepDegRawData = JSON.parse(talepDegRawData);
        }
        
        // Çifte JSON parse - content içindeki JSON'u da parse et
        if (talepDegRawData.content) {
          let talepDegData = talepDegRawData.content;
          // Content da string olabilir
          if (typeof talepDegData === 'string') {
            try {
              talepDegData = JSON.parse(talepDegData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          }
          const talepResult = this.parseTalepDegerlendirmesi(talepDegData);
          Object.assign(result, talepResult);
        } else {
          // Content yoksa direkt parse et
          const talepResult = this.parseTalepDegerlendirmesi(talepDegRawData);
          Object.assign(result, talepResult);
        }
      } catch (error) {
        console.log('❌ Talep Değerlendirmesi parse hatası:', error.message);
      }
    } else {
      // Boş veri için placeholder değerler ekle
      result.mevcutGereksinimiVar_yanit = '';
      result.mevcutGereksinimiVar_aciklama = '';
      result.urunAdi = '';
      result.yeniBirUrunMu_yanit = '';
      result.yeniBirUrunMu_aciklama = '';
      result.muhasabeDeğisikligiVar_yanit = '';
      result.muhasabeDeğisikligiVar_aciklama = '';
      result.disFirmaEntegrasyonu_yanit = '';
      result.disFirmaEntegrasyonu_aciklama = '';
      result.raporlamaEtkisi_yanit = '';
      result.raporlamaEtkisi_aciklama = '';
      result.odemeGgbEtkisi_yanit = '';
      result.odemeGgbEtkisi_aciklama = '';
      result.uyumFraudSenaryolari_yanit = '';
      result.uyumFraudSenaryolari_aciklama = '';
      result.dijitalKanallardaEtkisi_yanit = '';
      result.dijitalKanallardaEtkisi_aciklama = '';
      result.batchIsEtkisi_yanit = '';
      result.batchIsEtkisi_aciklama = '';
      result.bildirimOlusturulmali_yanit = '';
      result.bildirimOlusturulmali_aciklama = '';
      result.conversionGereksinimiVar_yanit = '';
      result.conversionGereksinimiVar_aciklama = '';
    }

    // X İşlemi Muhasebesi
    if (modalData.x_islemi_muhasebesi) {
      const xIslemiData = JSON.parse(modalData.x_islemi_muhasebesi);
      Object.assign(result, this.parseXIslemiMuhasebesi(xIslemiData));
    }

    // Case1
    if (modalData.case1) {
      const case1Data = JSON.parse(modalData.case1);
      Object.assign(result, this.parseCase1(case1Data));
    }

    // Helper function: Ekran Tasarımları placeholder'larını ekle
    const addEkranTasarimlariPlaceholders = () => {
      // Ekran Bilgileri için common field'lar
      result.ekran_adi_kodu = result.ekran_adi_kodu || '';
      result.ekran_aciklamasi = result.ekran_aciklamasi || '';
      result.ekran_tipi = result.ekran_tipi || '';
      result.erisim_yetkisi = result.erisim_yetkisi || '';
      result.navigasyon = result.navigasyon || '';
      result.sayfalama = result.sayfalama || '';
      result.filtreleme = result.filtreleme || '';
      result.siralama = result.siralama || '';
      result.disa_aktarma = result.disa_aktarma || '';
      result.yazdirma = result.yazdirma || '';
      result.textContent = result.textContent || '';
      
      // Alan Detayları tablosu için placeholder'lar
      for (let i = 1; i <= 10; i++) {
        result[`alan_detay_${i}_alan_adi`] = result[`alan_detay_${i}_alan_adi`] || '';
        result[`alan_detay_${i}_tip`] = result[`alan_detay_${i}_tip`] || '';
        result[`alan_detay_${i}_uzunluk`] = result[`alan_detay_${i}_uzunluk`] || '';
        result[`alan_detay_${i}_zorunlu`] = result[`alan_detay_${i}_zorunlu`] || '';
        result[`alan_detay_${i}_varsayilan`] = result[`alan_detay_${i}_varsayilan`] || '';
        result[`alan_detay_${i}_degistirilebilir`] = result[`alan_detay_${i}_degistirilebilir`] || '';
        result[`alan_detay_${i}_is_kurallari`] = result[`alan_detay_${i}_is_kurallari`] || '';
      }
      
      // Hesaplama Kuralları tablosu için placeholder'lar
      for (let i = 1; i <= 10; i++) {
        result[`hesaplama_kural_${i}_alan_adi`] = result[`hesaplama_kural_${i}_alan_adi`] || '';
        result[`hesaplama_kural_${i}_hesaplama_kurali_aciklama`] = result[`hesaplama_kural_${i}_hesaplama_kurali_aciklama`] || '';
      }
      
      // Validation Kuralları tablosu için placeholder'lar
      for (let i = 1; i <= 10; i++) {
        result[`validation_kural_${i}_alan_adi`] = result[`validation_kural_${i}_alan_adi`] || '';
        result[`validation_kural_${i}_kural_aciklama`] = result[`validation_kural_${i}_kural_aciklama`] || '';
      }
      
      // Buton Tasarımları tablosu için placeholder'lar
      for (let i = 1; i <= 10; i++) {
        result[`buton_tasarim_${i}_buton_adi`] = result[`buton_tasarim_${i}_buton_adi`] || '';
        result[`buton_tasarim_${i}_aciklama`] = result[`buton_tasarim_${i}_aciklama`] || '';
        result[`buton_tasarim_${i}_konum`] = result[`buton_tasarim_${i}_konum`] || '';
        result[`buton_tasarim_${i}_renk`] = result[`buton_tasarim_${i}_renk`] || '';
        result[`buton_tasarim_${i}_boyut`] = result[`buton_tasarim_${i}_boyut`] || '';
        result[`buton_tasarim_${i}_aktiflik`] = result[`buton_tasarim_${i}_aktiflik`] || '';
        result[`buton_tasarim_${i}_gorunurluk`] = result[`buton_tasarim_${i}_gorunurluk`] || '';
      }
    };
    
    // Ekran Tasarımları
    if (modalData.ekran_tasarimlari_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let ekranRawData = modalData.ekran_tasarimlari_modal;
        
        // Eğer string ise parse et
        if (typeof ekranRawData === 'string') {
          ekranRawData = JSON.parse(ekranRawData);
        }
        
        // Çifte JSON parse - content kontrol et
        if (ekranRawData.content) {
          let ekranData = ekranRawData.content;
          // Content da string olabilir
          if (typeof ekranData === 'string') {
            try {
              ekranData = JSON.parse(ekranData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          }
          const ekranResult = this.parseEkranTasarimlari(ekranData);
          Object.assign(result, ekranResult);
        } else {
          // Content yoksa direkt parse et
          const ekranResult = this.parseEkranTasarimlari(ekranRawData);
          Object.assign(result, ekranResult);
        }
      } catch (error) {
        console.log('❌ Ekran Tasarımları parse hatası:', error.message);
      }
    }
    
    // Her durumda placeholder'ları ekle (eksik olanlar için)
    addEkranTasarimlariPlaceholders();

    // Tasklar/Batchlar
    if (modalData.tasklar_batchlar_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let tasklarRawData = modalData.tasklar_batchlar_modal;
        
        // Eğer string ise parse et
        if (typeof tasklarRawData === 'string') {
          tasklarRawData = JSON.parse(tasklarRawData);
        }
        
        // Çifte JSON parse - content kontrol et
        if (tasklarRawData.content) {
          let tasklarData = tasklarRawData.content;
          // Content da string olabilir
          if (typeof tasklarData === 'string') {
            try {
              tasklarData = JSON.parse(tasklarData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          }
          const tasklarResult = this.parseTasklarBatchlar(tasklarData);
          Object.assign(result, tasklarResult);
        } else {
          // Content yoksa direkt parse et
          const tasklarResult = this.parseTasklarBatchlar(tasklarRawData);
          Object.assign(result, tasklarResult);
        }
      } catch (error) {
        console.log('❌ Tasklar/Batchlar parse hatası:', error.message);
      }
    } else {
      // Boş veri için placeholder değerler ekle
      result.tasklar_batchlar_text = '';
      result.tasklar_batchlar_aciklama = '';
      
      // Tasklar tablosu için placeholder'lar
      for (let i = 1; i <= 10; i++) {
        result[`task_${i}_task_adi`] = '';
        result[`task_${i}_aciklama`] = '';
        result[`task_${i}_tetikleyici`] = '';
        result[`task_${i}_calisma_zamanlamasi`] = '';
        result[`task_${i}_bagimliliklar`] = '';
        result[`task_${i}_hata_yonetimi`] = '';
      }
      
      // Batchlar tablosu için placeholder'lar
      for (let i = 1; i <= 10; i++) {
        result[`batch_${i}_batch_adi`] = '';
        result[`batch_${i}_aciklama`] = '';
        result[`batch_${i}_calisma_zamanlamasi`] = '';
        result[`batch_${i}_bagimliliklar`] = '';
        result[`batch_${i}_hata_yonetimi`] = '';
      }
      
      // Task/Batch tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`task_batch_${i}_yeni_mevcut`] = '';
        result[`task_batch_${i}_task_job_adi`] = '';
        result[`task_batch_${i}_tanim`] = '';
        result[`task_batch_${i}_sorumlu_sistem`] = '';
        result[`task_batch_${i}_calisma_saati`] = '';
        result[`task_batch_${i}_calisma_sikligi`] = '';
        result[`task_batch_${i}_bagimliliklar`] = '';
        result[`task_batch_${i}_alert_mekanizmasi`] = '';
        result[`task_batch_${i}_alternatif_calistirma`] = '';
      }
      
      // Entegrasyonlar tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`entegrasyon_${i}_adi`] = '';
        result[`entegrasyon_${i}_amac`] = '';
        result[`entegrasyon_${i}_sorumlu_sistemler`] = '';
      }
      
      // Mesajlar tablosu - TEMPLATE'E GÖRE  
      for (let i = 1; i <= 10; i++) {
        result[`mesaj_${i}_tipi`] = '';
        result[`mesaj_${i}_case`] = '';
        result[`mesaj_${i}_dili`] = '';
        result[`mesaj_${i}_metin`] = '';
      }
      
      // Case1 tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`case1_${i}_subeKodu`] = '';
        result[`case1_${i}_musteriNo`] = '';
        result[`case1_${i}_defter`] = '';
        result[`case1_${i}_borcAlacak`] = '';
        result[`case1_${i}_tutar`] = '';
        result[`case1_${i}_dovizCinsi`] = '';
        result[`case1_${i}_aciklama`] = '';
      }
      
      // Yetkilendirme tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`yetkilendirme_${i}_rolKullanici`] = '';
        result[`yetkilendirme_${i}_ekranIslem`] = '';
        result[`yetkilendirme_${i}_goruntuleme`] = '';
        result[`yetkilendirme_${i}_ekleme`] = '';
        result[`yetkilendirme_${i}_guncelleme`] = '';
        result[`yetkilendirme_${i}_silme`] = '';
        result[`yetkilendirme_${i}_onaylama`] = '';
      }
      
      // Onay Süreci tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`onay_sureci_${i}_islemTipi`] = '';
        result[`onay_sureci_${i}_onaySeviyesi`] = '';
        result[`onay_sureci_${i}_onaySureci`] = '';
        result[`onay_sureci_${i}_aciklama`] = '';
      }
      
      // Veri Kritikliği tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`veri_kritikligi_${i}_sira`] = '';
        result[`veri_kritikligi_${i}_veriAdi`] = '';
        result[`veri_kritikligi_${i}_tabloAdi`] = '';
        result[`veri_kritikligi_${i}_veriAdiAciklamasi`] = '';
        result[`veri_kritikligi_${i}_gizlilik`] = '';
        result[`veri_kritikligi_${i}_butunluk`] = '';
        result[`veri_kritikligi_${i}_erisilebilirlik`] = '';
        result[`veri_kritikligi_${i}_hassasVeriMi`] = '';
        result[`veri_kritikligi_${i}_sirVeriMi`] = '';
      }
      
      // Kabul Kriterleri tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`kabul_kriterleri_${i}_kriterIs`] = '';
        result[`kabul_kriterleri_${i}_aciklama`] = '';
      }
      
      // Onaylar tablosu - TEMPLATE'E GÖRE
      for (let i = 1; i <= 10; i++) {
        result[`onaylar_${i}_isim`] = '';
        result[`onaylar_${i}_unvan`] = '';
        result[`onaylar_${i}_tarih`] = '';
      }
    }

    // Entegrasyonlar modal (tablo-based)
    if (modalData.entegrasyonlar_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let entegrasyonlarRawData = modalData.entegrasyonlar_modal;
        
        // Eğer string ise parse et
        if (typeof entegrasyonlarRawData === 'string') {
          entegrasyonlarRawData = JSON.parse(entegrasyonlarRawData);
        }
        
        if (entegrasyonlarRawData.content) {
          let entegrasyonlarData = entegrasyonlarRawData.content;
          // Content da string olabilir
          if (typeof entegrasyonlarData === 'string') {
            try {
              entegrasyonlarData = JSON.parse(entegrasyonlarData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          }
          const entegrasyonlarResult = this.parseEntegrasyonlar(entegrasyonlarData);
          Object.assign(result, entegrasyonlarResult);
        } else {
          // Content yoksa direkt parse et
          const entegrasyonlarResult = this.parseEntegrasyonlar(entegrasyonlarRawData);
          Object.assign(result, entegrasyonlarResult);
        }
      } catch (error) {
        console.log('❌ Entegrasyonlar parse hatası:', error.message);
      }
    } else {
      // Entegrasyonlar için placeholder'lar
      result.entegrasyonlar_text = '';
      for (let i = 1; i <= 10; i++) {
        result[`entegrasyon_${i}_sistem_adi`] = '';
        result[`entegrasyon_${i}_protokol`] = '';
        result[`entegrasyon_${i}_format`] = '';
        result[`entegrasyon_${i}_siklik`] = '';
        result[`entegrasyon_${i}_yon`] = '';
        result[`entegrasyon_${i}_aciklama`] = '';
        result[`entegrasyon_${i}_veri_tipi`] = '';
        result[`entegrasyon_${i}_guvenlik`] = '';
      }
    }

    // Mesajlar modal (tablo-based)
    if (modalData.mesajlar_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let mesajlarRawData = modalData.mesajlar_modal;
        
        // Eğer string ise parse et
        if (typeof mesajlarRawData === 'string') {
          mesajlarRawData = JSON.parse(mesajlarRawData);
        }
        
        if (mesajlarRawData.content) {
          let mesajlarData = mesajlarRawData.content;
          // Content da string olabilir
          if (typeof mesajlarData === 'string') {
            try {
              mesajlarData = JSON.parse(mesajlarData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          }
          const mesajlarResult = this.parseMesajlar(mesajlarData);
          Object.assign(result, mesajlarResult);
        } else {
          // Content yoksa direkt parse et
          const mesajlarResult = this.parseMesajlar(mesajlarRawData);
          Object.assign(result, mesajlarResult);
        }
      } catch (error) {
        console.log('❌ Mesajlar parse hatası:', error.message);
      }
    } else {
      // Mesajlar için placeholder'lar
      result.mesajlar_text = '';
      for (let i = 1; i <= 10; i++) {
        result[`mesaj_${i}_mesaj_adi`] = '';
        result[`mesaj_${i}_kaynak`] = '';
        result[`mesaj_${i}_hedef`] = '';
        result[`mesaj_${i}_format`] = '';
        result[`mesaj_${i}_siklik`] = '';
        result[`mesaj_${i}_aciklama`] = '';
        result[`mesaj_${i}_veri_yapisi`] = '';
        result[`mesaj_${i}_guvenlik`] = '';
      }
    }

    // Parametreler modal (tablo-based)
    if (modalData.parametreler_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let parametrelerRawData = modalData.parametreler_modal;
        
        // Eğer string ise parse et
        if (typeof parametrelerRawData === 'string') {
          parametrelerRawData = JSON.parse(parametrelerRawData);
        }
        
        if (parametrelerRawData.content) {
          let parametrelerData = parametrelerRawData.content;
          // Content da string olabilir
          if (typeof parametrelerData === 'string') {
            try {
              parametrelerData = JSON.parse(parametrelerData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
            }
          }
          const parametrelerResult = this.parseParametreler(parametrelerData);
          Object.assign(result, parametrelerResult);
        } else {
          // Content yoksa direkt parse et
          const parametrelerResult = this.parseParametreler(parametrelerRawData);
          Object.assign(result, parametrelerResult);
        }
      } catch (error) {
        console.log('❌ Parametreler parse hatası:', error.message);
      }
    } else {
      // Parametreler için placeholder'lar
      result.parametreler_text = '';
      for (let i = 1; i <= 10; i++) {
        result[`parametre_${i}_parametre_adi`] = '';
        result[`parametre_${i}_tip`] = '';
        result[`parametre_${i}_varsayilan_deger`] = '';
        result[`parametre_${i}_aciklama`] = '';
        result[`parametre_${i}_zorunlu`] = '';
        result[`parametre_${i}_deger_araligi`] = '';
      }
    }

    // X İşlemi Muhasebesi modal (form-based)
    if (modalData.x_islemi_muhasebesi_modal) {
      try {
        const xIslemiRawData = JSON.parse(modalData.x_islemi_muhasebesi_modal);
        if (xIslemiRawData.content) {
          // Double JSON parsing
          const xIslemiData = JSON.parse(xIslemiRawData.content);
          const xIslemiResult = this.parseXIslemiMuhasebesi(xIslemiData);
          Object.assign(result, xIslemiResult);
        } else {
          // Content yoksa direkt parse et
          const xIslemiResult = this.parseXIslemiMuhasebesi(xIslemiRawData);
          Object.assign(result, xIslemiResult);
        }
      } catch (error) {
        console.log('❌ X İşlemi Muhasebesi parse hatası:', error.message);
      }
    }

    // Case1 modal
    if (modalData.case1_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let rawData = modalData.case1_modal;
        
        // Eğer string ise parse et
        if (typeof rawData === 'string') {
          rawData = JSON.parse(rawData);
        }
        
        let case1Data = rawData;
        
        // Çifte JSON kontrol et
        if (rawData && rawData.content) {
          let contentData = rawData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              case1Data = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
              case1Data = rawData;
            }
          } else {
            case1Data = contentData;
          }
        }
        
        Object.assign(result, this.parseCase1(case1Data));
      } catch (error) {
        console.log('❌ Case1 parse hatası:', error.message);
      }
    }

    // Yetkilendirme ve Onay Mekanizmaları modal
    if (modalData.yetkilendirme_onay_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let rawData = modalData.yetkilendirme_onay_modal;
        
        // Eğer string ise parse et
        if (typeof rawData === 'string') {
          rawData = JSON.parse(rawData);
        }
        
        let yetkilendirmeData = rawData;
        
        // Çifte JSON kontrol et
        if (rawData && rawData.content) {
          let contentData = rawData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              yetkilendirmeData = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
              yetkilendirmeData = rawData;
            }
          } else {
            yetkilendirmeData = contentData;
          }
        }
        
        Object.assign(result, this.parseYetkilendirmeOnay(yetkilendirmeData));
      } catch (error) {
        console.log('❌ Yetkilendirme ve Onay parse hatası:', error.message);
      }
    }

    // Veri Kritikliği modal
    if (modalData.veri_kritikligi_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let rawData = modalData.veri_kritikligi_modal;
        
        // Eğer string ise parse et
        if (typeof rawData === 'string') {
          rawData = JSON.parse(rawData);
        }
        
        let veriKritikligiData = rawData;
        
        // Çifte JSON kontrol et
        if (rawData && rawData.content) {
          let contentData = rawData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              veriKritikligiData = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
              veriKritikligiData = rawData;
            }
          } else {
            veriKritikligiData = contentData;
          }
        }
        
        Object.assign(result, this.parseVeriKritikligi(veriKritikligiData));
      } catch (error) {
        console.log('❌ Veri Kritikliği parse hatası:', error.message);
      }
    }

    // Paydaşlar ve Kullanıcılar modal
    if (modalData.paydaslar_kullanicilar_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let rawData = modalData.paydaslar_kullanicilar_modal;
        
        // Eğer string ise parse et
        if (typeof rawData === 'string') {
          rawData = JSON.parse(rawData);
        }
        
        let paydaslarData = rawData;
        
        // Çifte JSON kontrol et
        if (rawData && rawData.content) {
          let contentData = rawData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              paydaslarData = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
              paydaslarData = rawData;
            }
          } else {
            paydaslarData = contentData;
          }
        }
        
        Object.assign(result, this.parsePaydaslarKullanicilar(paydaslarData));
      } catch (error) {
        console.log('❌ Paydaşlar ve Kullanıcılar parse hatası:', error.message);
      }
    }

    // Kabul Kriterleri modal
    if (modalData.kabul_kriterleri_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let rawData = modalData.kabul_kriterleri_modal;
        
        // Eğer string ise parse et
        if (typeof rawData === 'string') {
          rawData = JSON.parse(rawData);
        }
        
        let kabulKriterleriData = rawData;
        
        // Çifte JSON kontrol et
        if (rawData && rawData.content) {
          let contentData = rawData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              kabulKriterleriData = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
              kabulKriterleriData = rawData;
            }
          } else {
            kabulKriterleriData = contentData;
          }
        }
        
        Object.assign(result, this.parseKabulKriterleri(kabulKriterleriData));
      } catch (error) {
        console.log('❌ Kabul Kriterleri parse hatası:', error.message);
      }
    }

    // Onaylar modal
    if (modalData.onaylar_modal) {
      try {
        // Önce tipini kontrol et - object veya string olabilir
        let rawData = modalData.onaylar_modal;
        
        // Eğer string ise parse et
        if (typeof rawData === 'string') {
          rawData = JSON.parse(rawData);
        }
        
        let onaylarData = rawData;
        
        // Çifte JSON kontrol et
        if (rawData && rawData.content) {
          let contentData = rawData.content;
          // Content da string olabilir
          if (typeof contentData === 'string') {
            try {
              onaylarData = JSON.parse(contentData);
            } catch (e) {
              // Parse edilemezse olduğu gibi kullan
              onaylarData = rawData;
            }
          } else {
            onaylarData = contentData;
          }
        }
        
        Object.assign(result, this.parseOnaylar(onaylarData));
      } catch (error) {
        console.log('❌ Onaylar parse hatası:', error.message);
      }
    }

    // Text modallar - database.js'deki format ile eşleştir (_modal suffix'li)
    const textModals = [
      'amac_kapsam', 'mevcut_isleyis_modal', 'planlanan_isleyis_modal',
      'fonksiyonel_gereksinimler_modal', 'ekran_gereksinimleri_modal', 'x_ekrani_modal',
      'task_is_akisi_modal',
      'conversation_migration_modal', 'diagram_akislar_modal', 'muhasebe_modal',
      'x_islemi_muhasebe_deseni_modal',
      'x_islemi_kayit_kurallari_modal', 'x_islemi_vergi_komisyon_modal',
      'x_islemi_muhasebe_senaryolari_modal', 'x_islemi_ornek_kayitlar_modal',
      'fonksiyonel_olmayan_gereksinimler_modal', 'kimlik_dogrulama_log_modal',
      'kapsam_disinda_modal', 'ekler_modal'
    ];

    textModals.forEach(modalName => {
      if (modalData[modalName]) {
        console.log(`🔍 Text modal işleniyor: ${modalName}`);
        try {
          const rawData = JSON.parse(modalData[modalName]);
          let textContent = '';
          
          // Çifte JSON kontrol et (amac_kapsam gibi)
          if (rawData && rawData.content) {
            try {
              // İçteki JSON'u parse etmeye çalış
              const innerData = JSON.parse(rawData.content);
              if (innerData && innerData.content) {
                textContent = innerData.content;
              } else {
                textContent = rawData.content;
              }
            } catch (e) {
              // İçteki JSON parse edilemezse content'i direkt al
              textContent = rawData.content;
            }
          } else if (typeof rawData === 'string') {
            textContent = rawData;
          }
          
          console.log(`✅ ${modalName} content uzunluğu: ${textContent.length}`);
          
          // Field adını temizle (_modal suffix'ini kaldır)
          const fieldName = modalName.replace('_modal', '');
          result[fieldName] = this.cleanValue(textContent);
        } catch (error) {
          console.log(`❌ ${modalName} parse hatası:`, error.message);
          // JSON parse edilemezse direkt string olarak kullan
          const fieldName = modalName.replace('_modal', '');
          result[fieldName] = this.cleanValue(modalData[modalName]);
        }
      } else {
        console.log(`ℹ️ ${modalName} modal verisi yok, boş placeholder ekleniyor`);
        const fieldName = modalName.replace('_modal', '');
        result[fieldName] = '';
      }
    });

    // GERÇEK TEMPLATE'DEN ALINAN TÜM PLACEHOLDER'LAR
    const missingPlaceholders = [
      // Temel Talep Bilgileri
      'talep_no', 'talep_adi', 'talep_sahibi_is_birimi', 'talep_sahibi_kurum', 
      'talep_yoneticisi', 'teknik_ekipler',
      
      // Doküman Tarihçesi (zaten var ama ek güvenlik için)
      'tarih_1', 'tarih_2', 'tarih_3', 'tarih_4',
      'versiyon_1', 'versiyon_2', 'versiyon_3', 'versiyon_4',
      'degisiklikYapan_1', 'degisiklikYapan_2', 'degisiklikYapan_3', 'degisiklikYapan_4',
      'aciklama_1', 'aciklama_2', 'aciklama_3', 'aciklama_4',
      
      // Ana İçerik Alanları
      'amac_kapsam', 'mevcut_isleyis', 'planlanan_isleyis', 'fonksiyonel_gereksinimler',
      'ekran_gereksinimleri', 'x_ekrani', 'tasklar_batchlar_text', 'task_is_akisi',
      'conversation_migration', 'diagram_akislar', 'muhasebe', 'x_islemi_muhasebe_deseni',
      'x_islemi_kayit_kurallari', 'x_islemi_vergi_komisyon', 'x_islemi_muhasebe_senaryolari',
      'x_islemi_ornek_kayitlar', 'fonksiyonel_olmayan_gereksinimler', 'kimlik_dogrulama_log',
      'kapsam_disinda', 'ekler',
      
      // Talep Değerlendirmesi
      'mevcutGereksinimiVar_yanit', 'mevcutGereksinimiVar_aciklama',
      'urunAdi', 'yeniBirUrunMu_yanit', 'yeniBirUrunMu_aciklama',
      'muhasabeDeğisikligiVar_yanit', 'muhasabeDeğisikligiVar_aciklama',
      'disFirmaEntegrasyonu_yanit', 'disFirmaEntegrasyonu_aciklama',
      'raporlamaEtkisi_yanit', 'raporlamaEtkisi_aciklama',
      'odemeGgbEtkisi_yanit', 'odemeGgbEtkisi_aciklama',
      'uyumFraudSenaryolari_yanit', 'uyumFraudSenaryolari_aciklama',
      'dijitalKanallardaEtkisi_yanit', 'dijitalKanallardaEtkisi_aciklama',
      'batchIsEtkisi_yanit', 'batchIsEtkisi_aciklama',
      'bildirimOlusturulmali_yanit', 'bildirimOlusturulmali_aciklama',
      'conversionGereksinimiVar_yanit', 'conversionGereksinimiVar_aciklama',
      
      // Ekran Tasarımları
      'textContent', 'ekran_adi_kodu', 'amac', 'kullanici_rolu_yetki', 'navigasyon_menu_yolu',
      
      // Hesaplama Kuralları
      'hesaplama_kural_1_hesaplama_kurali_aciklama', 'hesaplama_kural_2_hesaplama_kurali_aciklama',
      'hesaplama_kural_3_hesaplama_kurali_aciklama',
      
      // X İşlemi Muhasebesi Detayları
      'x_islemi_tanimi', 'x_islemi_ilgili_urun_modul', 'x_islemi_tetikleyici_olay',
      'x_islemi_muhasebe_kaydinin_izlenecegi_ekran', 'x_islemi_hata_yonetimi',
      
      // Parametreler Detayları
      'parametre_1_adi', 'parametre_1_aciklama', 'parametre_1_kapsam_kullanim_alani',
      'parametre_1_varsayilan_deger', 'parametre_1_deger_araligi', 'parametre_1_yetki',
      
      // Paydaşlar & Kullanıcılar
      'paydasekipkullanicibilgileri', 'uyumfraudekibigorusu', 'uyumfraudekibigorusuaciklama',
      'hukukekibigorusu', 'hukukekibigorusuaciklama', 'teftisickontrolgorusu', 'teftisickontrolgorusuaciklama',
      'operasyonekibigorusu', 'operasyonekibigorusuaciklama'
    ];
    
    missingPlaceholders.forEach(placeholder => {
      if (!result[placeholder]) {
        result[placeholder] = '';
      }
    });

    return result;
  }

  /**
   * String'i camelCase formatına çevir
   */
  toCamelCase(str) {
    return str.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
  }

  /**
   * Label'ı field adına çevir (Türkçe karakter ve özel işaretleri temizle)
   */
  normalizeLabel(label) {
    if (!label) return '';
    
    return label.toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Değeri temizle ve formatla
   */
  cleanValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Evet' : 'Hayır';
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'string') {
      return value.trim();
    }
    
    return String(value).trim();
  }

  /**
   * Placeholder'ları oluştur
   */
  createPlaceholder(fieldName) {
    return `${this.placeholderPrefix}${fieldName}${this.placeholderSuffix}`;
  }

  /**
   * Tüm field'lar için placeholder listesi oluştur
   */
  generatePlaceholderList(data) {
    const placeholders = [];
    Object.keys(data).forEach(field => {
      placeholders.push({
        field: field,
        placeholder: this.createPlaceholder(field),
        value: data[field]
      });
    });
    return placeholders;
  }
}

module.exports = DataParser;
