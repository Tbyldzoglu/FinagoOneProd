const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // .env dosyası database/ klasöründe

// Word Export servisini import et
let WordExportService;
try {
  WordExportService = require('./wordexport/index');
  console.log('✅ WordExportService başarıyla yüklendi');
} catch (error) {
  console.error('❌ WordExportService yükleme hatası:', error.message);
  console.log('⚠️ Word export özelliği devre dışı bırakılıyor');
}

const app = express();
const PORT = process.env.DATABASE_SERVICE_PORT;

// Middleware
app.use(cors({
  origin: process.env.DATABASE_SERVICE_CORS_ORIGIN
}));
app.use(express.json());

// MSSQL bağlantı konfigürasyonu
const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // Azure SQL için true yapın
    trustServerCertificate: true, // Self-signed sertifikalar için
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Health check
app.get('/health', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    await pool.request().query('SELECT 1');
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});


// Doküman analizi kaydet (yeni kayıt)
app.post('/api/analiz-faz1', async (req, res) => {
  try {
    const { amac_kapsam, talep_bilgileri, dokuman_tarihcesi, talep_degerlendirmesi, mevcut_isleyis, planlanan_isleyis, fonksiyonel_gereksinimler, ekran_gereksinimleri, x_ekrani, ekran_tasarimlari, tasklar_batchlar, task_is_akisi, entegrasyonlar, mesajlar, parametreler, conversation_migration, diagram_akislar, muhasebe, x_islemi_muhasebesi, x_islemi_muhasebe_deseni, case1, x_islemi_kayit_kurallari, x_islemi_vergi_komisyon, x_islemi_muhasebe_senaryolari, x_islemi_ornek_kayitlar, fonksiyonel_olmayan_gereksinimler, kimlik_dogrulama_log, yetkilendirme_onay, veri_kritikligi, paydaslar_kullanicilar, kapsam_disinda, kabul_kriterleri, onaylar, ekler, yuklenen_dokuman, user_id } = req.body;

    if (!yuklenen_dokuman) {
      return res.status(400).json({ error: 'yuklenen_dokuman gerekli' });
    }

    const pool = await sql.connect(config);
    const request = pool.request();

    const insertQuery = `
      INSERT INTO analiz_faz1 (
        amac_kapsam, talep_bilgileri, dokuman_tarihcesi, talep_degerlendirmesi, 
        mevcut_isleyis, planlanan_isleyis, fonksiyonel_gereksinimler, ekran_gereksinimleri, 
        x_ekrani, ekran_tasarimlari, tasklar_batchlar, task_is_akisi, entegrasyonlar, 
        mesajlar, parametreler, conversation_migration, diagram_akislar, muhasebe, 
        x_islemi_muhasebesi, x_islemi_muhasebe_deseni, case1, x_islemi_kayit_kurallari, 
        x_islemi_vergi_komisyon, x_islemi_muhasebe_senaryolari, x_islemi_ornek_kayitlar, 
        fonksiyonel_olmayan_gereksinimler, kimlik_dogrulama_log, yetkilendirme_onay, 
        veri_kritikligi, paydaslar_kullanicilar, kapsam_disinda, kabul_kriterleri, 
        onaylar, ekler, yuklenen_dokuman, user_id
      ) VALUES (
        @amac_kapsam, @talep_bilgileri, @dokuman_tarihcesi, @talep_degerlendirmesi, 
        @mevcut_isleyis, @planlanan_isleyis, @fonksiyonel_gereksinimler, @ekran_gereksinimleri, 
        @x_ekrani, @ekran_tasarimlari, @tasklar_batchlar, @task_is_akisi, @entegrasyonlar, 
        @mesajlar, @parametreler, @conversation_migration, @diagram_akislar, @muhasebe, 
        @x_islemi_muhasebesi, @x_islemi_muhasebe_deseni, @case1, @x_islemi_kayit_kurallari, 
        @x_islemi_vergi_komisyon, @x_islemi_muhasebe_senaryolari, @x_islemi_ornek_kayitlar, 
        @fonksiyonel_olmayan_gereksinimler, @kimlik_dogrulama_log, @yetkilendirme_onay, 
        @veri_kritikligi, @paydaslar_kullanicilar, @kapsam_disinda, @kabul_kriterleri, 
        @onaylar, @ekler, @yuklenen_dokuman, @user_id
      );
      SELECT SCOPE_IDENTITY() as insertId;
    `;

    // Parametreleri ekle
    request.input('amac_kapsam', sql.NVarChar, amac_kapsam || '');
    request.input('talep_bilgileri', sql.NVarChar, talep_bilgileri || '');
    request.input('dokuman_tarihcesi', sql.NVarChar, dokuman_tarihcesi || '');
    request.input('talep_degerlendirmesi', sql.NVarChar, talep_degerlendirmesi || '');
    request.input('mevcut_isleyis', sql.NVarChar, mevcut_isleyis || '');
    request.input('planlanan_isleyis', sql.NVarChar, planlanan_isleyis || '');
    request.input('fonksiyonel_gereksinimler', sql.NVarChar, fonksiyonel_gereksinimler || '');
    request.input('ekran_gereksinimleri', sql.NVarChar, ekran_gereksinimleri || '');
    request.input('x_ekrani', sql.NVarChar, x_ekrani || '');
    request.input('ekran_tasarimlari', sql.NVarChar, ekran_tasarimlari || '');
    request.input('tasklar_batchlar', sql.NVarChar, tasklar_batchlar || '');
    request.input('task_is_akisi', sql.NVarChar, task_is_akisi || '');
    request.input('entegrasyonlar', sql.NVarChar, entegrasyonlar || '');
    request.input('mesajlar', sql.NVarChar, mesajlar || '');
    request.input('parametreler', sql.NVarChar, parametreler || '');
    request.input('conversation_migration', sql.NVarChar, conversation_migration || '');
    request.input('diagram_akislar', sql.NVarChar, diagram_akislar || '');
    request.input('muhasebe', sql.NVarChar, muhasebe || '');
    request.input('x_islemi_muhasebesi', sql.NVarChar, x_islemi_muhasebesi || '');
    request.input('x_islemi_muhasebe_deseni', sql.NVarChar, x_islemi_muhasebe_deseni || '');
    request.input('case1', sql.NVarChar, case1 || '');
    request.input('x_islemi_kayit_kurallari', sql.NVarChar, x_islemi_kayit_kurallari || '');
    request.input('x_islemi_vergi_komisyon', sql.NVarChar, x_islemi_vergi_komisyon || '');
    request.input('x_islemi_muhasebe_senaryolari', sql.NVarChar, x_islemi_muhasebe_senaryolari || '');
    request.input('x_islemi_ornek_kayitlar', sql.NVarChar, x_islemi_ornek_kayitlar || '');
    request.input('fonksiyonel_olmayan_gereksinimler', sql.NVarChar, fonksiyonel_olmayan_gereksinimler || '');
    request.input('kimlik_dogrulama_log', sql.NVarChar, kimlik_dogrulama_log || '');
    request.input('yetkilendirme_onay', sql.NVarChar, yetkilendirme_onay || '');
    request.input('veri_kritikligi', sql.NVarChar, veri_kritikligi || '');
    request.input('paydaslar_kullanicilar', sql.NVarChar, paydaslar_kullanicilar || '');
    request.input('kapsam_disinda', sql.NVarChar, kapsam_disinda || '');
    request.input('kabul_kriterleri', sql.NVarChar, kabul_kriterleri || '');
    request.input('onaylar', sql.NVarChar, onaylar || '');
    request.input('ekler', sql.NVarChar, ekler || '');
    request.input('yuklenen_dokuman', sql.NVarChar(255), yuklenen_dokuman);
    request.input('user_id', sql.Int, user_id || null);

    const result = await request.query(insertQuery);
    
    res.json({ 
      success: true,
      id: result.recordset[0].insertId,
      message: 'Analiz kaydedildi'
    });
    
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mevcut kaydı güncelle (doküman adına göre)
app.put('/api/analiz-faz1/:dokuman', async (req, res) => {
  try {
    const dokuman = decodeURIComponent(req.params.dokuman);
    const { amac_kapsam, talep_bilgileri, dokuman_tarihcesi, talep_degerlendirmesi, mevcut_isleyis, planlanan_isleyis, fonksiyonel_gereksinimler, ekran_gereksinimleri, x_ekrani, ekran_tasarimlari, tasklar_batchlar, task_is_akisi, entegrasyonlar, mesajlar, parametreler, conversation_migration, diagram_akislar, muhasebe, x_islemi_muhasebesi, x_islemi_muhasebe_deseni, case1, x_islemi_kayit_kurallari, x_islemi_vergi_komisyon, x_islemi_muhasebe_senaryolari, x_islemi_ornek_kayitlar, fonksiyonel_olmayan_gereksinimler, kimlik_dogrulama_log, yetkilendirme_onay, veri_kritikligi, paydaslar_kullanicilar, kapsam_disinda, kabul_kriterleri, onaylar, ekler } = req.body;

    const pool = await sql.connect(config);
    const request = pool.request();

    // Önce mevcut kayıt var mı kontrol et
    request.input('dokuman', sql.NVarChar(255), dokuman);
    const existingResult = await request.query(
      'SELECT TOP 1 id FROM analiz_faz1 WHERE yuklenen_dokuman = @dokuman ORDER BY yuklenme_tarihi DESC'
    );

    console.log(`🔍 PUT /api/analiz-faz1/${dokuman} - Bulunan kayıt:`, existingResult.recordset[0]);

    if (existingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Doküman bulunamadı' });
    }

    const recordId = existingResult.recordset[0].id;

    // Sadece gönderilen alanları güncelle
    const updates = [];
    const request2 = pool.request();
    request2.input('id', sql.Int, recordId);

    if (amac_kapsam !== undefined) {
      updates.push('amac_kapsam = @amac_kapsam');
      request2.input('amac_kapsam', sql.NVarChar, amac_kapsam);
    }

    if (talep_bilgileri !== undefined) {
      updates.push('talep_bilgileri = @talep_bilgileri');
      request2.input('talep_bilgileri', sql.NVarChar, talep_bilgileri);
    }

    if (dokuman_tarihcesi !== undefined) {
      updates.push('dokuman_tarihcesi = @dokuman_tarihcesi');
      request2.input('dokuman_tarihcesi', sql.NVarChar, dokuman_tarihcesi);
    }

    if (talep_degerlendirmesi !== undefined) {
      updates.push('talep_degerlendirmesi = @talep_degerlendirmesi');
      request2.input('talep_degerlendirmesi', sql.NVarChar, talep_degerlendirmesi);
    }

    if (mevcut_isleyis !== undefined) {
      updates.push('mevcut_isleyis = @mevcut_isleyis');
      request2.input('mevcut_isleyis', sql.NVarChar, mevcut_isleyis);
    }

    if (planlanan_isleyis !== undefined) {
      updates.push('planlanan_isleyis = @planlanan_isleyis');
      request2.input('planlanan_isleyis', sql.NVarChar, planlanan_isleyis);
    }

    if (fonksiyonel_gereksinimler !== undefined) {
      updates.push('fonksiyonel_gereksinimler = @fonksiyonel_gereksinimler');
      request2.input('fonksiyonel_gereksinimler', sql.NVarChar, fonksiyonel_gereksinimler);
    }

    if (ekran_gereksinimleri !== undefined) {
      updates.push('ekran_gereksinimleri = @ekran_gereksinimleri');
      request2.input('ekran_gereksinimleri', sql.NVarChar, ekran_gereksinimleri);
    }

    if (x_ekrani !== undefined) {
      updates.push('x_ekrani = @x_ekrani');
      request2.input('x_ekrani', sql.NVarChar, x_ekrani);
    }

    if (ekran_tasarimlari !== undefined) {
      updates.push('ekran_tasarimlari = @ekran_tasarimlari');
      request2.input('ekran_tasarimlari', sql.NVarChar, ekran_tasarimlari);
    }

    if (tasklar_batchlar !== undefined) {
      updates.push('tasklar_batchlar = @tasklar_batchlar');
      request2.input('tasklar_batchlar', sql.NVarChar, tasklar_batchlar);
    }

    if (task_is_akisi !== undefined) {
      updates.push('task_is_akisi = @task_is_akisi');
      request2.input('task_is_akisi', sql.NVarChar, task_is_akisi);
    }

    if (entegrasyonlar !== undefined) {
      updates.push('entegrasyonlar = @entegrasyonlar');
      request2.input('entegrasyonlar', sql.NVarChar, entegrasyonlar);
    }

    if (mesajlar !== undefined) {
      updates.push('mesajlar = @mesajlar');
      request2.input('mesajlar', sql.NVarChar, mesajlar);
    }

    if (parametreler !== undefined) {
      updates.push('parametreler = @parametreler');
      request2.input('parametreler', sql.NVarChar, parametreler);
    }

    if (conversation_migration !== undefined) {
      updates.push('conversation_migration = @conversation_migration');
      request2.input('conversation_migration', sql.NVarChar, conversation_migration);
    }

    if (diagram_akislar !== undefined) {
      updates.push('diagram_akislar = @diagram_akislar');
      request2.input('diagram_akislar', sql.NVarChar, diagram_akislar);
    }

    if (muhasebe !== undefined) {
      updates.push('muhasebe = @muhasebe');
      request2.input('muhasebe', sql.NVarChar, muhasebe);
    }

    if (x_islemi_muhasebesi !== undefined) {
      updates.push('x_islemi_muhasebesi = @x_islemi_muhasebesi');
      request2.input('x_islemi_muhasebesi', sql.NVarChar, x_islemi_muhasebesi);
    }

    if (x_islemi_muhasebe_deseni !== undefined) {
      updates.push('x_islemi_muhasebe_deseni = @x_islemi_muhasebe_deseni');
      request2.input('x_islemi_muhasebe_deseni', sql.NVarChar, x_islemi_muhasebe_deseni);
    }

    if (case1 !== undefined) {
      updates.push('case1 = @case1');
      request2.input('case1', sql.NVarChar, case1);
    }

    if (x_islemi_kayit_kurallari !== undefined) {
      updates.push('x_islemi_kayit_kurallari = @x_islemi_kayit_kurallari');
      request2.input('x_islemi_kayit_kurallari', sql.NVarChar, x_islemi_kayit_kurallari);
    }

    if (x_islemi_vergi_komisyon !== undefined) {
      updates.push('x_islemi_vergi_komisyon = @x_islemi_vergi_komisyon');
      request2.input('x_islemi_vergi_komisyon', sql.NVarChar, x_islemi_vergi_komisyon);
    }

    if (x_islemi_muhasebe_senaryolari !== undefined) {
      updates.push('x_islemi_muhasebe_senaryolari = @x_islemi_muhasebe_senaryolari');
      request2.input('x_islemi_muhasebe_senaryolari', sql.NVarChar, x_islemi_muhasebe_senaryolari);
    }

    if (x_islemi_ornek_kayitlar !== undefined) {
      updates.push('x_islemi_ornek_kayitlar = @x_islemi_ornek_kayitlar');
      request2.input('x_islemi_ornek_kayitlar', sql.NVarChar, x_islemi_ornek_kayitlar);
    }

    if (fonksiyonel_olmayan_gereksinimler !== undefined) {
      updates.push('fonksiyonel_olmayan_gereksinimler = @fonksiyonel_olmayan_gereksinimler');
      request2.input('fonksiyonel_olmayan_gereksinimler', sql.NVarChar, fonksiyonel_olmayan_gereksinimler);
    }

    if (kimlik_dogrulama_log !== undefined) {
      updates.push('kimlik_dogrulama_log = @kimlik_dogrulama_log');
      request2.input('kimlik_dogrulama_log', sql.NVarChar, kimlik_dogrulama_log);
    }

    if (yetkilendirme_onay !== undefined) {
      updates.push('yetkilendirme_onay = @yetkilendirme_onay');
      request2.input('yetkilendirme_onay', sql.NVarChar, yetkilendirme_onay);
    }

    if (veri_kritikligi !== undefined) {
      updates.push('veri_kritikligi = @veri_kritikligi');
      request2.input('veri_kritikligi', sql.NVarChar, veri_kritikligi);
    }

    if (paydaslar_kullanicilar !== undefined) {
      updates.push('paydaslar_kullanicilar = @paydaslar_kullanicilar');
      request2.input('paydaslar_kullanicilar', sql.NVarChar, paydaslar_kullanicilar);
    }

    if (kapsam_disinda !== undefined) {
      updates.push('kapsam_disinda = @kapsam_disinda');
      request2.input('kapsam_disinda', sql.NVarChar, kapsam_disinda);
    }

    if (kabul_kriterleri !== undefined) {
      updates.push('kabul_kriterleri = @kabul_kriterleri');
      request2.input('kabul_kriterleri', sql.NVarChar, kabul_kriterleri);
    }

    if (onaylar !== undefined) {
      updates.push('onaylar = @onaylar');
      request2.input('onaylar', sql.NVarChar, onaylar);
    }

    if (ekler !== undefined) {
      updates.push('ekler = @ekler');
      request2.input('ekler', sql.NVarChar, ekler);
    }

    if (updates.length === 0) {
      return res.json({
        success: true,
        message: 'Güncellenecek alan yok',
        id: recordId
      });
    }

    const updateQuery = `UPDATE analiz_faz1 SET ${updates.join(', ')} WHERE id = @id`;
    await request2.query(updateQuery);

    return res.json({
      success: true,
      message: 'Analiz güncellendi',
      id: recordId
    });

  } catch (error) {
    console.error('Güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tüm kayıtları getir
app.get('/api/analiz-faz1', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(
      'SELECT * FROM analiz_faz1 ORDER BY yuklenme_tarihi DESC'
    );
    
    await pool.close();
    
    res.json({ 
      success: true,
      data: result.recordset 
    });
    
  } catch (error) {
    console.error('Getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat için tüm modal içeriklerini getir (en güncel kayıt)
app.post('/api/webhook/chat-modals', async (req, res) => {
  try {
    const { userId, user_id } = req.body;
    const finalUserId = userId || user_id; // Her iki formatı da destekle
    
    console.log('🔍 Chat modals getiriliyor');
    console.log('📥 Gelen userId:', userId);
    console.log('📥 Gelen user_id:', user_id);
    console.log('📥 Kullanılacak ID:', finalUserId);
    
    const pool = await sql.connect(config);
    const request = pool.request();
    
    let query = 'SELECT TOP 1 * FROM analiz_faz1';
    
    // User ID filtresi ekle
    if (finalUserId) {
      request.input('user_id', sql.Int, parseInt(finalUserId));
      query += ' WHERE user_id = @user_id';
      console.log('✅ User ID filtresi eklendi:', finalUserId);
    } else {
      console.warn('⚠️ User ID yok, TÜM kayıtlar çekilecek!');
    }
    
    query += ' ORDER BY id DESC';
    console.log('🔍 Query:', query);
    
    const result = await request.query(query);
    
    console.log(`🔍 Query sonucu: ${result.recordset?.length || 0} kayıt bulundu`);
    
    if (!result.recordset || result.recordset.length === 0) {
      await pool.close();
      return res.json({ 
        success: true,
        allModalsContent: {} 
      });
    }
    
    await pool.close();
    
    const row = result.recordset[0];
    
    console.log('📋 Veritabanından alınan satır bilgileri:');
    console.log('  - ID:', row.id);
    console.log('  - Yüklenen Doküman:', row.yuklenen_dokuman);
    console.log('  - Amaç Kapsam uzunluğu:', row.amac_kapsam?.length || 0);
    console.log('  - Mevcut İşleyiş uzunluğu:', row.mevcut_isleyis?.length || 0);
    console.log('  - Planlanan İşleyiş uzunluğu:', row.planlanan_isleyis?.length || 0);
    console.log('  - Fonksiyonel Gereksinimler uzunluğu:', row.fonksiyonel_gereksinimler?.length || 0);
    
    // Helper function: JSON string'i parse et ve content'i al
    const parseContent = (jsonString) => {
      if (!jsonString) return '';
      try {
        const parsed = JSON.parse(jsonString);
        return parsed.content || '';
      } catch (e) {
        // JSON değilse direkt string döndür
        return jsonString;
      }
    };
    
    // Tüm modal içeriklerini formatla
    const allModalsContent = {
      'amac-kapsam': {
        id: 'amac-kapsam',
        title: 'Amaç ve Kapsam',
        content: parseContent(row.amac_kapsam),
        isProcessed: !!row.amac_kapsam,
        timestamp: row.yuklenme_tarihi
      },
      'mevcut-isleyis': {
        id: 'mevcut-isleyis',
        title: 'Mevcut İşleyiş',
        content: parseContent(row.mevcut_isleyis),
        isProcessed: !!row.mevcut_isleyis,
        timestamp: row.yuklenme_tarihi
      },
      'planlanan-isleyis': {
        id: 'planlanan-isleyis',
        title: 'Planlanan İşleyiş',
        content: parseContent(row.planlanan_isleyis),
        isProcessed: !!row.planlanan_isleyis,
        timestamp: row.yuklenme_tarihi
      },
      'fonksiyonel-gereksinimler': {
        id: 'fonksiyonel-gereksinimler',
        title: 'Fonksiyonel Gereksinimler',
        content: parseContent(row.fonksiyonel_gereksinimler),
        isProcessed: !!row.fonksiyonel_gereksinimler,
        timestamp: row.yuklenme_tarihi
      },
      'ekran-gereksinimleri': {
        id: 'ekran-gereksinimleri',
        title: 'Ekran Gereksinimleri',
        content: parseContent(row.ekran_gereksinimleri),
        isProcessed: !!row.ekran_gereksinimleri,
        timestamp: row.yuklenme_tarihi
      },
      'x-ekrani': {
        id: 'x-ekrani',
        title: 'X Ekranı',
        content: parseContent(row.x_ekrani),
        isProcessed: !!row.x_ekrani,
        timestamp: row.yuklenme_tarihi
      },
      'task-is-akisi': {
        id: 'task-is-akisi',
        title: 'Task İş Akışı',
        content: parseContent(row.task_is_akisi),
        isProcessed: !!row.task_is_akisi,
        timestamp: row.yuklenme_tarihi
      },
      'conversion-migration': {
        id: 'conversion-migration',
        title: 'Conversion ve Migration',
        content: parseContent(row.conversion_migration),
        isProcessed: !!row.conversion_migration,
        timestamp: row.yuklenme_tarihi
      },
      'diagram-akislar': {
        id: 'diagram-akislar',
        title: 'Diagram ve Akışlar',
        content: parseContent(row.diagram_akislar),
        isProcessed: !!row.diagram_akislar,
        timestamp: row.yuklenme_tarihi
      },
      'muhasebe': {
        id: 'muhasebe',
        title: 'Muhasebe',
        content: parseContent(row.muhasebe),
        isProcessed: !!row.muhasebe,
        timestamp: row.yuklenme_tarihi
      },
      'x-islemi-muhasebe-deseni': {
        id: 'x-islemi-muhasebe-deseni',
        title: 'X İşlemi Muhasebe Deseni',
        content: parseContent(row.x_islemi_muhasebe_deseni),
        isProcessed: !!row.x_islemi_muhasebe_deseni,
        timestamp: row.yuklenme_tarihi
      },
      'x-islemi-kayit-kurallari': {
        id: 'x-islemi-kayit-kurallari',
        title: 'X İşlemi Kayıt Kuralları',
        content: parseContent(row.x_islemi_kayit_kurallari),
        isProcessed: !!row.x_islemi_kayit_kurallari,
        timestamp: row.yuklenme_tarihi
      },
      'x-islemi-vergi-komisyon': {
        id: 'x-islemi-vergi-komisyon',
        title: 'X İşlemi Vergi / Komisyon',
        content: parseContent(row.x_islemi_vergi_komisyon),
        isProcessed: !!row.x_islemi_vergi_komisyon,
        timestamp: row.yuklenme_tarihi
      },
      'x-islemi-muhasebe-senaryolari': {
        id: 'x-islemi-muhasebe-senaryolari',
        title: 'X İşlemi Muhasebe Senaryoları',
        content: parseContent(row.x_islemi_muhasebe_senaryolari),
        isProcessed: !!row.x_islemi_muhasebe_senaryolari,
        timestamp: row.yuklenme_tarihi
      },
      'x-islemi-ornek-kayitlar': {
        id: 'x-islemi-ornek-kayitlar',
        title: 'X İşlemi Örnek Kayıtlar',
        content: parseContent(row.x_islemi_ornek_kayitlar),
        isProcessed: !!row.x_islemi_ornek_kayitlar,
        timestamp: row.yuklenme_tarihi
      },
      'fonksiyonel-olmayan-gereksinimler': {
        id: 'fonksiyonel-olmayan-gereksinimler',
        title: 'Fonksiyonel Olmayan Gereksinimler',
        content: parseContent(row.fonksiyonel_olmayan_gereksinimler),
        isProcessed: !!row.fonksiyonel_olmayan_gereksinimler,
        timestamp: row.yuklenme_tarihi
      },
      'kimlik-dogrulama-log': {
        id: 'kimlik-dogrulama-log',
        title: 'Kimlik Doğrulama ve Log',
        content: parseContent(row.kimlik_dogrulama_log),
        isProcessed: !!row.kimlik_dogrulama_log,
        timestamp: row.yuklenme_tarihi
      },
      'kapsam-disinda': {
        id: 'kapsam-disinda',
        title: 'Kapsam Dışında',
        content: parseContent(row.kapsam_disinda),
        isProcessed: !!row.kapsam_disinda,
        timestamp: row.yuklenme_tarihi
      },
      'ekler': {
        id: 'ekler',
        title: 'Ekler',
        content: parseContent(row.ekler),
        isProcessed: !!row.ekler,
        timestamp: row.yuklenme_tarihi
      },
      // Tablo modalları
      'ekran-tasarimlari': {
        id: 'ekran-tasarimlari',
        title: 'Ekran Tasarımları',
        content: '',
        tableData: row.ekran_tasarimlari ? (typeof row.ekran_tasarimlari === 'string' ? JSON.parse(row.ekran_tasarimlari) : row.ekran_tasarimlari) : null,
        isProcessed: !!row.ekran_tasarimlari,
        timestamp: row.yuklenme_tarihi
      },
      'tasklar-batchlar': {
        id: 'tasklar-batchlar',
        title: 'Tasklar ve Batchlar',
        content: '',
        tableData: row.tasklar_batchlar ? (typeof row.tasklar_batchlar === 'string' ? JSON.parse(row.tasklar_batchlar) : row.tasklar_batchlar) : null,
        isProcessed: !!row.tasklar_batchlar,
        timestamp: row.yuklenme_tarihi
      },
      'entegrasyonlar': {
        id: 'entegrasyonlar',
        title: 'Entegrasyonlar',
        content: '',
        tableData: row.entegrasyonlar ? (typeof row.entegrasyonlar === 'string' ? JSON.parse(row.entegrasyonlar) : row.entegrasyonlar) : null,
        isProcessed: !!row.entegrasyonlar,
        timestamp: row.yuklenme_tarihi
      },
      'mesajlar': {
        id: 'mesajlar',
        title: 'Mesajlar',
        content: '',
        tableData: row.mesajlar ? (typeof row.mesajlar === 'string' ? JSON.parse(row.mesajlar) : row.mesajlar) : null,
        isProcessed: !!row.mesajlar,
        timestamp: row.yuklenme_tarihi
      },
      'parametreler': {
        id: 'parametreler',
        title: 'Parametreler',
        content: '',
        tableData: row.parametreler ? (typeof row.parametreler === 'string' ? JSON.parse(row.parametreler) : row.parametreler) : null,
        isProcessed: !!row.parametreler,
        timestamp: row.yuklenme_tarihi
      },
      'talep-bilgileri': {
        id: 'talep-bilgileri',
        title: 'Talep Bilgileri',
        content: '',
        tableData: row.talep_bilgileri ? (typeof row.talep_bilgileri === 'string' ? JSON.parse(row.talep_bilgileri) : row.talep_bilgileri) : null,
        isProcessed: !!row.talep_bilgileri,
        timestamp: row.yuklenme_tarihi
      },
      'document-history': {
        id: 'document-history',
        title: 'Döküman Tarihçesi',
        content: '',
        tableData: row.dokuman_tarihcesi ? (typeof row.dokuman_tarihcesi === 'string' ? JSON.parse(row.dokuman_tarihcesi) : row.dokuman_tarihcesi) : null,
        isProcessed: !!row.dokuman_tarihcesi,
        timestamp: row.yuklenme_tarihi
      },
      'talep-degerlendirmesi': {
        id: 'talep-degerlendirmesi',
        title: 'Talep Değerlendirmesi',
        content: '',
        tableData: row.talep_degerlendirmesi ? (typeof row.talep_degerlendirmesi === 'string' ? JSON.parse(row.talep_degerlendirmesi) : row.talep_degerlendirmesi) : null,
        isProcessed: !!row.talep_degerlendirmesi,
        timestamp: row.yuklenme_tarihi
      },
      'kabul-kriterleri': {
        id: 'kabul-kriterleri',
        title: 'Kabul Kriterleri',
        content: '',
        tableData: row.kabul_kriterleri ? (typeof row.kabul_kriterleri === 'string' ? JSON.parse(row.kabul_kriterleri) : row.kabul_kriterleri) : null,
        isProcessed: !!row.kabul_kriterleri,
        timestamp: row.yuklenme_tarihi
      },
      'onaylar': {
        id: 'onaylar',
        title: 'Onaylar',
        content: '',
        tableData: row.onaylar ? (typeof row.onaylar === 'string' ? JSON.parse(row.onaylar) : row.onaylar) : null,
        isProcessed: !!row.onaylar,
        timestamp: row.yuklenme_tarihi
      },
      'paydaslar-kullanicilar': {
        id: 'paydaslar-kullanicilar',
        title: 'Paydaşlar ve Kullanıcılar',
        content: '',
        tableData: row.paydaslar_kullanicilar ? (typeof row.paydaslar_kullanicilar === 'string' ? JSON.parse(row.paydaslar_kullanicilar) : row.paydaslar_kullanicilar) : null,
        isProcessed: !!row.paydaslar_kullanicilar,
        timestamp: row.yuklenme_tarihi
      },
      'veri-kritikligi': {
        id: 'veri-kritikligi',
        title: 'Veri Kritikliği',
        content: '',
        tableData: row.veri_kritikligi ? (typeof row.veri_kritikligi === 'string' ? JSON.parse(row.veri_kritikligi) : row.veri_kritikligi) : null,
        isProcessed: !!row.veri_kritikligi,
        timestamp: row.yuklenme_tarihi
      },
      'yetkilendirme': {
        id: 'yetkilendirme',
        title: 'Yetkilendirme',
        content: '',
        tableData: row.yetkilendirme ? (typeof row.yetkilendirme === 'string' ? JSON.parse(row.yetkilendirme) : row.yetkilendirme) : null,
        isProcessed: !!row.yetkilendirme,
        timestamp: row.yuklenme_tarihi
      },
      'x-islemi-muhasebe': {
        id: 'x-islemi-muhasebe',
        title: 'X İşlemi Muhasebe',
        content: '',
        tableData: row.x_islemi_muhasebe ? (typeof row.x_islemi_muhasebe === 'string' ? JSON.parse(row.x_islemi_muhasebe) : row.x_islemi_muhasebe) : null,
        isProcessed: !!row.x_islemi_muhasebe,
        timestamp: row.yuklenme_tarihi
      }
    };
    
    // İçerik özetini log'la
    const contentSummary = Object.entries(allModalsContent).map(([key, modal]) => ({
      id: key,
      hasContent: !!modal.content,
      contentLength: modal.content?.length || 0,
      hasTableData: !!modal.tableData
    }));
    
    console.log('📊 Modal içerik özeti:', contentSummary.filter(m => m.hasContent || m.hasTableData));
    console.log(`✅ Chat modals gönderiliyor: ${Object.keys(allModalsContent).length} modal`);
    
    res.json({
      success: true,
      allModalsContent
    });
    
  } catch (error) {
    console.error('❌ Chat modals getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Son kayıt getir
app.get('/api/analiz-faz1/latest', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(
      'SELECT TOP 1 * FROM analiz_faz1 ORDER BY yuklenme_tarihi DESC'
    );
    
    await pool.close();
    
    res.json({ 
      success: true,
      data: result.recordset[0] || null 
    });
    
  } catch (error) {
    console.error('Son kayıt getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Word Export endpoint'leri
let wordExportService;
if (WordExportService) {
  try {
    wordExportService = new WordExportService();
    console.log('✅ WordExportService instance oluşturuldu');
  } catch (error) {
    console.error('❌ WordExportService instance hatası:', error.message);
  }
}

// Word olarak export et
app.post('/api/word-export/:dokuman', async (req, res) => {
  try {
    // WordExportService kontrolü
    if (!wordExportService) {
      console.error('❌ WordExportService mevcut değil!');
      return res.status(503).json({
        success: false,
        error: 'Word export servisi başlatılamadı. Lütfen sunucu loglarını kontrol edin.'
      });
    }
    
    let dokuman = decodeURIComponent(req.params.dokuman);
    const { userId = 'default', templateFileName = 'Analiz Güncel verisyon v3.docx' } = req.body;
    
    // 🔧 TIMESTAMP TEMİZLE: Eğer dosya adı timestamp içeriyorsa, orijinal adı al
    // Format: OriginalName.docx_2025-11-05T12-37-27-692Z.docx
    const timestampPattern = /_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.docx$/;
    if (timestampPattern.test(dokuman)) {
      const originalName = dokuman.replace(timestampPattern, '');
      console.log(`🔧 Timestamp temizlendi: ${dokuman} → ${originalName}`);
      dokuman = originalName;
    }
    
    console.log(`🔄 Word export başlatılıyor: ${dokuman}`);
    
    const result = await wordExportService.exportDocument(dokuman, userId, templateFileName);
    
    if (result.success) {
      // Dosya yolunu frontend'e göre ayarla
      const fileName = path.basename(result.outputPath);
      
      res.json({
        success: true,
        message: 'Word dokümanı başarıyla oluşturuldu',
        fileName: fileName,
        downloadPath: `/api/word-export/download/${fileName}`,
        dataCount: result.dataCount
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Word export hatası:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      success: false,
      error: error.message || 'Bilinmeyen hata'
    });
  }
});

// Word dosyasını indir
app.get('/api/word-export/download/:fileName', async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'wordexport/output', fileName);
    
    console.log('📥 Download isteği:', fileName);
    console.log('📂 Dosya yolu:', filePath);
    
    // Dosya var mı kontrol et
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.error('❌ Dosya bulunamadı:', filePath);
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    console.log('✅ Dosya bulundu, indiriliyor...');
    
    // Dosyayı indir
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('❌ Dosya indirme hatası:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Dosya indirilemedi' });
        }
      } else {
        console.log('✅ Dosya başarıyla indirildi:', fileName);
      }
    });
    
  } catch (error) {
    console.error('❌ Download hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Template'leri listele
app.get('/api/word-export/templates', async (req, res) => {
  try {
    const templates = await wordExportService.listTemplates();
    res.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    console.error('❌ Template listesi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Output dosyalarını listele
app.get('/api/word-export/outputs', async (req, res) => {
  try {
    const outputs = await wordExportService.listOutputs();
    res.json({
      success: true,
      outputs: outputs
    });
  } catch (error) {
    console.error('❌ Output listesi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// ANALIZ FAZ2 (LLM Gereksinim Analizi) API ENDPOINTS
// =============================================================================

// Faz2 - LLM Gereksinim Analizi kaydet (yeni kayıt)
app.post('/api/analiz-faz2', async (req, res) => {
  try {
    const {
      gereksinim_amac_kapsam,
      gereksinim_talep_bilgileri,
      gereksinim_dokuman_tarihcesi,
      gereksinim_talep_degerlendirmesi,
      gereksinim_mevcut_isleyis,
      gereksinim_planlanan_isleyis,
      gereksinim_fonksiyonel_gereksinimler,
      gereksinim_ekran_gereksinimleri,
      gereksinim_x_ekrani,
      gereksinim_ekran_tasarimlari,
      gereksinim_tasklar_batchlar,
      gereksinim_task_is_akisi,
      gereksinim_entegrasyonlar,
      gereksinim_mesajlar,
      gereksinim_parametreler,
      gereksinim_conversation_migration,
      gereksinim_diagram_akislar,
      gereksinim_muhasebe,
      gereksinim_x_islemi_muhasebesi,
      gereksinim_x_islemi_muhasebe_deseni,
      gereksinim_case1,
      gereksinim_x_islemi_kayit_kurallari,
      gereksinim_x_islemi_vergi_komisyon,
      gereksinim_x_islemi_muhasebe_senaryolari,
      gereksinim_x_islemi_ornek_kayitlar,
      gereksinim_fonksiyonel_olmayan_gereksinimler,
      gereksinim_kimlik_dogrulama_log,
      gereksinim_yetkilendirme_onay,
      gereksinim_veri_kritikligi,
      gereksinim_paydaslar_kullanicilar,
      gereksinim_kapsam_disinda,
      gereksinim_kabul_kriterleri,
      gereksinim_onaylar,
      gereksinim_ekler,
      yuklenen_dokuman,
      llm_model,
      generation_status,
      total_tokens_used,
      generation_time_seconds,
      confidence_score,
      user_id,
      ek_bilgiler
    } = req.body;

    if (!yuklenen_dokuman) {
      return res.status(400).json({ error: 'yuklenen_dokuman gerekli' });
    }

    const pool = await sql.connect(config); const request = pool.request();

    const result = await request.query(
      `INSERT INTO analiz_faz2 (
        gereksinim_amac_kapsam, gereksinim_talep_bilgileri, gereksinim_dokuman_tarihcesi,
        gereksinim_talep_degerlendirmesi, gereksinim_mevcut_isleyis, gereksinim_planlanan_isleyis,
        gereksinim_fonksiyonel_gereksinimler, gereksinim_ekran_gereksinimleri, gereksinim_x_ekrani,
        gereksinim_ekran_tasarimlari, gereksinim_tasklar_batchlar, gereksinim_task_is_akisi,
        gereksinim_entegrasyonlar, gereksinim_mesajlar, gereksinim_parametreler,
        gereksinim_conversation_migration, gereksinim_diagram_akislar, gereksinim_muhasebe,
        gereksinim_x_islemi_muhasebesi, gereksinim_x_islemi_muhasebe_deseni, gereksinim_case1,
        gereksinim_x_islemi_kayit_kurallari, gereksinim_x_islemi_vergi_komisyon,
        gereksinim_x_islemi_muhasebe_senaryolari, gereksinim_x_islemi_ornek_kayitlar,
        gereksinim_fonksiyonel_olmayan_gereksinimler, gereksinim_kimlik_dogrulama_log,
        gereksinim_yetkilendirme_onay, gereksinim_veri_kritikligi, gereksinim_paydaslar_kullanicilar,
        gereksinim_kapsam_disinda, gereksinim_kabul_kriterleri, gereksinim_onaylar, gereksinim_ekler,
        yuklenen_dokuman, llm_model, generation_status, total_tokens_used, generation_time_seconds, confidence_score, user_id, ek_bilgiler
      ) VALUES (@param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param, @param)`,
      [
        gereksinim_amac_kapsam || '', gereksinim_talep_bilgileri || '', gereksinim_dokuman_tarihcesi || '',
        gereksinim_talep_degerlendirmesi || '', gereksinim_mevcut_isleyis || '', gereksinim_planlanan_isleyis || '',
        gereksinim_fonksiyonel_gereksinimler || '', gereksinim_ekran_gereksinimleri || '', gereksinim_x_ekrani || '',
        gereksinim_ekran_tasarimlari || '', gereksinim_tasklar_batchlar || '', gereksinim_task_is_akisi || '',
        gereksinim_entegrasyonlar || '', gereksinim_mesajlar || '', gereksinim_parametreler || '',
        gereksinim_conversation_migration || '', gereksinim_diagram_akislar || '', gereksinim_muhasebe || '',
        gereksinim_x_islemi_muhasebesi || '', gereksinim_x_islemi_muhasebe_deseni || '', gereksinim_case1 || '',
        gereksinim_x_islemi_kayit_kurallari || '', gereksinim_x_islemi_vergi_komisyon || '',
        gereksinim_x_islemi_muhasebe_senaryolari || '', gereksinim_x_islemi_ornek_kayitlar || '',
        gereksinim_fonksiyonel_olmayan_gereksinimler || '', gereksinim_kimlik_dogrulama_log || '',
        gereksinim_yetkilendirme_onay || '', gereksinim_veri_kritikligi || '', gereksinim_paydaslar_kullanicilar || '',
        gereksinim_kapsam_disinda || '', gereksinim_kabul_kriterleri || '', gereksinim_onaylar || '', gereksinim_ekler || '',
        yuklenen_dokuman, llm_model || 'openai-gpt-4', generation_status || 'completed',
        total_tokens_used || 0, generation_time_seconds || 0.00, confidence_score || 0.85, user_id || null, ek_bilgiler || null
      ]
    );
    
    await pool.close();
    
    res.json({ 
      success: true,
      id: result.recordset[0].insertId,
      message: 'Faz2 analiz kaydedildi'
    });
    
  } catch (error) {
    console.error('Faz2 kayıt hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faz2 - Tüm kayıtları getir
app.get('/api/analiz-faz2', async (req, res) => {
  try {
    const pool = await sql.connect(config); const request = pool.request();
    
    const result = await request.query(
      'SELECT * FROM analiz_faz2 ORDER BY yuklenme_tarihi DESC'
    );
    
    await pool.close();
    
    res.json({ 
      success: true,
      data: result.recordset 
    });
    
  } catch (error) {
    console.error('Faz2 getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faz2 - En yüksek ID'li GERÇEK VERİ içeren kaydı getir (fallback veriler hariç)
app.get('/api/analiz-faz2/latest', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    console.log('🔍 /api/analiz-faz2/latest çağrıldı');
    console.log('📥 Gelen user_id:', user_id);
    console.log('📥 Query parametreleri:', req.query);
    
    const pool = await sql.connect(config); 
    const request = pool.request();
    
    let query = `SELECT TOP 1 * FROM analiz_faz2`;
    
    // Eğer user_id verilmişse, sadece o kullanıcının kayıtlarını getir
    if (user_id) {
      request.input('user_id', sql.Int, parseInt(user_id));
      query += ` WHERE user_id = @user_id`;
      console.log('✅ User ID filtresi eklendi:', user_id);
    } else {
      console.warn('⚠️ User ID yok, TÜM kayıtlar çekilecek!');
    }
    
    query += ` ORDER BY id DESC`;
    console.log('🔍 Çalıştırılacak query:', query);
    
    const result = await request.query(query);
    
    await pool.close();
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ 
        error: 'Faz2 kaydı bulunamadı',
        message: user_id 
          ? 'Bu kullanıcıya ait Faz2 kaydı yok. Lütfen önce analiz yapın.'
          : 'Henüz hiç Faz2 kaydı yok. Lütfen yeni bir analiz yapın.'
      });
    }
    
    console.log(`✅ Faz2 kaydı bulundu - ID: ${result.recordset[0].id}, User ID: ${result.recordset[0].user_id}`);
    
    res.json({ 
      success: true,
      data: result.recordset[0] 
    });
    
  } catch (error) {
    console.error('Faz2 veri getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faz2 - Belirli kaydı getir
app.get('/api/analiz-faz2/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config); const request = pool.request();
    
    const result = await request.query(
      'SELECT * FROM analiz_faz2 WHERE id = @param',
      [id]
    );
    
    await pool.close();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Faz2 kaydı bulunamadı' });
    }
    
    res.json({ 
      success: true,
      data: result.recordset[0] 
    });
    
  } catch (error) {
    console.error('Faz2 tek kayıt getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faz2 - Tek modal güncelle (örnek: sadece amaç_kapsam)
app.put('/api/analiz-faz2/:id/modal/:modalName', async (req, res) => {
  try {
    const { id, modalName } = req.params;
    const { content, confidence_score, tokens_used } = req.body;
    
    // Güvenlik için sadece gereksinim_ ile başlayan sütunlara izin ver
    if (!modalName.startsWith('gereksinim_')) {
      return res.status(400).json({ error: 'Geçersiz modal adı' });
    }
    
    const pool = await sql.connect(config); const request = pool.request();
    
    // Dinamik olarak sütun adını oluştur
    const columnName = modalName;
    const updateQuery = `UPDATE analiz_faz2 SET ${columnName} = @param, confidence_score = @param, total_tokens_used = total_tokens_used + @param WHERE id = @param`;
    
    const result = await request.query(updateQuery, [
      content || '',
      confidence_score || 0.85,
      tokens_used || 0,
      id
    ]);
    
    await pool.close();
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Faz2 kaydı bulunamadı' });
    }
    
    res.json({ 
      success: true,
      message: `${modalName} güncellendi`
    });
    
  } catch (error) {
    console.error('Faz2 modal güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faz2 - Transfer durumu güncelle
app.put('/api/analiz-faz2/:id/transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { transferred } = req.body;
    
    const pool = await sql.connect(config); const request = pool.request();
    
    const result = await request.query(
      'UPDATE analiz_faz2 SET transferred_to_faz1 = @transferred, transfer_date = @transfer_date WHERE id = @id',
      [transferred, transferred ? new Date() : null, id]
    );
    
    await pool.close();
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Faz2 kaydı bulunamadı' });
    }
    
    res.json({ 
      success: true,
      message: transferred ? 'Transfer durumu işaretlendi' : 'Transfer durumu kaldırıldı'
    });
    
  } catch (error) {
    console.error('Faz2 transfer güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faz2 - Fallback kayıtları temizle
app.delete('/api/analiz-faz2/cleanup-fallback', async (req, res) => {
  try {
    const pool = await sql.connect(config); const request = pool.request();
    
    // Fallback verileri sil
    const result = await request.query(`
      DELETE FROM analiz_faz2 
      WHERE gereksinim_amac_kapsam = 'Analiz tamamlandı ancak içerik alınamadı.'
         OR gereksinim_amac_kapsam = ''
         OR gereksinim_amac_kapsam IS NULL
         OR confidence_score <= 0.5
         OR generation_status != 'completed'
    `);
    
    await pool.close();
    
    console.log(`🧹 ${result.rowsAffected[0]} adet fallback kayıt temizlendi`);
    
    res.json({ 
      success: true,
      message: `${result.rowsAffected[0]} adet fallback kayıt temizlendi`,
      deletedCount: result.rowsAffected[0]
    });
    
  } catch (error) {
    console.error('Fallback temizleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Yetki kontrolü middleware'i
const checkPermission = (requiredLevel) => {
  return async (req, res, next) => {
    try {
      const pool = await sql.connect(config);
      
      const result = await pool.request()
        .input('userId', sql.Int, req.user.id)
        .query('SELECT yetkiSeviyesi FROM users WHERE id = @userId AND is_active = 1');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }
      
      const userYetkiSeviyesi = result.recordset[0].yetkiSeviyesi;
      
      // NULL veya 1 seviyesi: Faz4/Faz5 erişim yok
      if (userYetkiSeviyesi === null || userYetkiSeviyesi === 1) {
        return res.status(403).json({ 
          error: 'Bu sayfaya erişim yetkiniz bulunmamaktadır',
          requiredLevel: requiredLevel,
          userLevel: userYetkiSeviyesi
        });
      }
      
      // 2 seviyesi: Sadece Faz5 erişim
      if (userYetkiSeviyesi === 2) {
        if (requiredLevel === 'faz4') {
          return res.status(403).json({ 
            error: 'Faz4 sayfasına erişim yetkiniz bulunmamaktadır',
            requiredLevel: requiredLevel,
            userLevel: userYetkiSeviyesi
          });
        }
        // Faz5 için erişim ver
        next();
        return;
      }
      
      // 3 seviyesi: Her iki sayfaya da erişim
      next();
      
    } catch (error) {
      console.error('❌ Yetki kontrolü hatası:', error);
      res.status(500).json({ error: 'Yetki kontrolü sırasında hata oluştu' });
    }
  };
};

// Admin yetki kontrolü middleware'i (Yetki seviyesi 4 gerekli)
const checkAdminPermission = async (req, res, next) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query('SELECT yetkiSeviyesi FROM users WHERE id = @userId AND is_active = 1');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    const userYetkiSeviyesi = result.recordset[0].yetkiSeviyesi;
    
    // Sadece yetki seviyesi 4 olan kullanıcılar admin paneline erişebilir
    if (userYetkiSeviyesi !== 4) {
      return res.status(403).json({ 
        error: 'Admin paneline erişim yetkiniz bulunmamaktadır',
        requiredLevel: 4,
        userLevel: userYetkiSeviyesi
      });
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Admin yetki kontrolü hatası:', error);
    res.status(500).json({ error: 'Yetki kontrolü sırasında hata oluştu' });
  }
};

// Kullanıcı Kaydı (Register)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı, email ve şifre gerekli' });
    }

    const pool = await sql.connect(config);

    // Kullanıcı adı veya email zaten var mı kontrol et
    const checkUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE username = @username OR email = @email');

    if (checkUser.recordset.length > 0) {
      return res.status(409).json({ error: 'Kullanıcı adı veya email zaten kullanılıyor' });
    }

    // Şifreyi hash'le
    const password_hash = await bcrypt.hash(password, 10);

    // Kullanıcıyı kaydet
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, password_hash)
      .input('full_name', sql.NVarChar, full_name || null)
      .query(`
        INSERT INTO users (username, email, password_hash, full_name, is_active)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.full_name, INSERTED.created_at
        VALUES (@username, @email, @password_hash, @full_name, 1)
      `);

    const user = result.recordset[0];

    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Yeni kullanıcı kaydedildi: ${username} (ID: ${user.id})`);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Register hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı Girişi (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const pool = await sql.connect(config);

    // Kullanıcıyı bul
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM users WHERE username = @username AND is_active = 1');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    const user = result.recordset[0];

    // Şifreyi kontrol et
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    // Son giriş tarihini güncelle
    await pool.request()
      .input('userId', sql.Int, user.id)
      .query('UPDATE users SET last_login = GETDATE() WHERE id = @userId');

    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Kullanıcı giriş yaptı: ${username} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        last_login: user.last_login,
        yetkiSeviyesi: user.yetkiSeviyesi
      }
    });

  } catch (error) {
    console.error('❌ Login hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Token Doğrulama (Verify)
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query('SELECT id, username, email, full_name, last_login, yetkiSeviyesi FROM users WHERE id = @userId AND is_active = 1');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      user: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Verify hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Çıkış (Logout - client tarafında token silinecek)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  console.log(`✅ Kullanıcı çıkış yaptı: ${req.user.username} (ID: ${req.user.id})`);
  res.json({ success: true, message: 'Çıkış başarılı' });
});

// ============================================
// PERSONEL API ENDPOINTS
// ============================================

// Personel kayıt endpoint'i
app.post('/api/personel', authenticateToken, async (req, res) => {
  try {
    const { ad, soyad, grup, pozisyon, iseBaslamaTarihi, aktif } = req.body;
    
    // Validasyon
    if (!ad || !soyad || !grup || !pozisyon || !iseBaslamaTarihi) {
      return res.status(400).json({ 
        success: false,
        message: 'Eksik alan: Ad, soyad, grup, pozisyon ve işe başlama tarihi gereklidir.' 
      });
    }
    
    const pool = await sql.connect(config);
    const request = pool.request();
    
    const insertQuery = `
      INSERT INTO Personel (
        ad, soyad, grup, pozisyon, iseBaslamaTarihi, aktif, olusturmaTarihi, guncellemeTarihi
      ) VALUES (
        @ad, @soyad, @grup, @pozisyon, @iseBaslamaTarihi, @aktif, GETDATE(), GETDATE()
      );
      SELECT SCOPE_IDENTITY() as insertId;
    `;
    
    request.input('ad', sql.NVarChar(50), ad);
    request.input('soyad', sql.NVarChar(50), soyad);
    request.input('grup', sql.NVarChar(100), grup);
    request.input('pozisyon', sql.NVarChar(100), pozisyon);
    request.input('iseBaslamaTarihi', sql.Date, iseBaslamaTarihi);
    request.input('aktif', sql.Bit, aktif !== undefined ? aktif : true);
    
    const result = await request.query(insertQuery);
    
    console.log(`✅ Yeni personel eklendi: ${ad} ${soyad} (ID: ${result.recordset[0].insertId})`);
    
    res.json({ 
      success: true,
      id: result.recordset[0].insertId,
      message: 'Personel başarıyla eklendi'
    });
    
  } catch (error) {
    console.error('❌ Personel ekleme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Personel eklenirken hata oluştu',
      error: error.message 
    });
  }
});

// Personel listesini getir (yöneticinin gruplarına göre filtrelenmiş)
app.get('/api/personel', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const yoneticiId = req.user.id;
    
    // Yöneticinin atanmış gruplarına göre personelleri filtrele
    const query = `
      SELECT DISTINCT p.* 
      FROM Personel p
      INNER JOIN YoneticiGruplari yg ON p.grup = yg.grupKodu
      WHERE p.aktif = 1 
        AND yg.yoneticiId = @yoneticiId 
        AND yg.aktif = 1
      ORDER BY p.ad, p.soyad
    `;
    
    const request = pool.request();
    request.input('yoneticiId', sql.Int, yoneticiId);
    const result = await request.query(query);
    
    // Sistem kurulum tarihi - Bu tarihten önce olması gereken raporlar "tamamlandı" sayılır
    // NOT: Bu tarih sistemin gerçekten kullanıma açıldığı tarih olmalı
    // Bu tarihten ÖNCE işe başlayanların eski raporları otomatik "tamamlandı" sayılır
    const SISTEM_KURULUM_TARIHI = new Date('2025-11-01'); // Sistemin aktif kullanıma geçtiği tarih
    
    // Her personel için rapor durumlarını kontrol et
    const personellerWithReports = await Promise.all(
      result.recordset.map(async (personel) => {
        const iseBaslamaTarihi = new Date(personel.iseBaslamaTarihi);
        const bugun = new Date();
        const calismaGunu = Math.floor((bugun.getTime() - iseBaslamaTarihi.getTime()) / (1000 * 60 * 60 * 24));
        
        // Gelecek tarihli personel kontrolü
        if (calismaGunu < 0) {
          return {
            ...personel,
            ilkAyRaporDurumu: 'henuz_baslamadi',
            ikinciAyRaporDurumu: 'henuz_baslamadi',
            calismaGunu,
            raporTipi: 'henuz_baslamadi'
          };
        }
        
        // İlk ay raporu kontrolü (25-28 gün arası açık, 29+ gün gecikmiş)
        let ilkAyRaporDurumu = 'bekleniyor';
        if (calismaGunu >= 25) {
          // İlk ay raporunun olması gereken tarih (işe başlama + 25 gün)
          const ilkAyRaporTarihi = new Date(iseBaslamaTarihi);
          ilkAyRaporTarihi.setDate(ilkAyRaporTarihi.getDate() + 25);
          
          // Rapor tarihi sistem kurulumundan ÖNCE mi?
          if (ilkAyRaporTarihi < SISTEM_KURULUM_TARIHI) {
            // Sistem yokken olması gereken rapor - "tamamlandı" say
            ilkAyRaporDurumu = 'tamamlandi';
            console.log(`📋 ${personel.ad} ${personel.soyad} - İlk ay raporu sistem kurulumundan önce (${ilkAyRaporTarihi.toISOString().split('T')[0]}) - Tamamlandı sayıldı`);
          } else {
            // Sistem varken olması gereken rapor - GERÇEK KONTROL
            const ilkAyQuery = `
              SELECT TOP 1 id, rapor_durumu 
              FROM IlkAyRapor 
              WHERE personelId = @personelId 
              ORDER BY raporTarihi DESC
            `;
            const ilkAyRequest = pool.request();
            ilkAyRequest.input('personelId', sql.Int, personel.id);
            const ilkAyResult = await ilkAyRequest.query(ilkAyQuery);
            
            // Rapor durumu kontrolü - 25-28 gün arası açık, 29+ gün gecikmiş
            if (ilkAyResult.recordset.length > 0) {
              ilkAyRaporDurumu = 'tamamlandi';
            } else if (calismaGunu >= 25 && calismaGunu <= 28) {
              // 25-28 gün arası: Rapor açık
              ilkAyRaporDurumu = 'acik';
            } else if (calismaGunu > 28) {
              // 29+ gün: Süre geçmiş, gecikti
              ilkAyRaporDurumu = 'gecikti';
            }
          }
        }
        
        // İkinci ay raporu kontrolü (55-58 gün arası açık, 59+ gün gecikmiş)
        let ikinciAyRaporDurumu = 'bekleniyor';
        if (calismaGunu >= 55) {
          // İkinci ay raporunun olması gereken tarih (işe başlama + 55 gün)
          const ikinciAyRaporTarihi = new Date(iseBaslamaTarihi);
          ikinciAyRaporTarihi.setDate(ikinciAyRaporTarihi.getDate() + 55);
          
          // Rapor tarihi sistem kurulumundan ÖNCE mi?
          if (ikinciAyRaporTarihi < SISTEM_KURULUM_TARIHI) {
            // Sistem yokken olması gereken rapor - "tamamlandı" say
            ikinciAyRaporDurumu = 'tamamlandi';
            console.log(`📋 ${personel.ad} ${personel.soyad} - İkinci ay raporu sistem kurulumundan önce (${ikinciAyRaporTarihi.toISOString().split('T')[0]}) - Tamamlandı sayıldı`);
          } else {
            // ÖNEMLİ: 2. ay raporu ancak 1. ay raporu doldurulmuşsa açılır
            if (ilkAyRaporDurumu !== 'tamamlandi') {
              ikinciAyRaporDurumu = 'birinci_ay_bekleniyor'; // Yeni durum: 1. ay raporu önce doldurulmalı
              console.log(`⚠️ ${personel.ad} ${personel.soyad} - 2. ay raporu için önce 1. ay raporu doldurulmalı`);
            } else {
              // 1. ay raporu doldurulmuş, 2. ay raporunu kontrol et
              const ikinciAyQuery = `
                SELECT TOP 1 id, rapor_durumu 
                FROM IkinciAyRapor 
                WHERE personelId = @personelId 
                ORDER BY raporTarihi DESC
              `;
              const ikinciAyRequest = pool.request();
              ikinciAyRequest.input('personelId', sql.Int, personel.id);
              const ikinciAyResult = await ikinciAyRequest.query(ikinciAyQuery);
              
              // Rapor durumu kontrolü - 55-58 gün arası açık, 59+ gün gecikmiş
              if (ikinciAyResult.recordset.length > 0) {
                ikinciAyRaporDurumu = 'tamamlandi';
              } else if (calismaGunu >= 55 && calismaGunu <= 58) {
                // 55-58 gün arası: Rapor açık
                ikinciAyRaporDurumu = 'acik';
              } else if (calismaGunu > 58) {
                // 59+ gün: Süre geçmiş, gecikti
                ikinciAyRaporDurumu = 'gecikti';
              }
            }
          }
        }
        
        // 5. Ay raporu kontrolü (140-145 gün arası açık, 146+ gün gecikmiş)
        let besinciAyRaporDurumu = 'bekleniyor';
        if (calismaGunu >= 140) {
          // 5. ay raporunun olması gereken tarih (işe başlama + 140 gün)
          const besinciAyRaporTarihi = new Date(iseBaslamaTarihi);
          besinciAyRaporTarihi.setDate(besinciAyRaporTarihi.getDate() + 140);
          
          // Rapor tarihi sistem kurulumundan ÖNCE mi?
          if (besinciAyRaporTarihi < SISTEM_KURULUM_TARIHI) {
            // Sistem yokken olması gereken rapor - "tamamlandı" say
            besinciAyRaporDurumu = 'tamamlandi';
            console.log(`📋 ${personel.ad} ${personel.soyad} - 5. ay raporu sistem kurulumundan önce (${besinciAyRaporTarihi.toISOString().split('T')[0]}) - Tamamlandı sayıldı`);
          } else {
            // ÖNEMLİ: 5. ay raporu ancak 1. ve 2. ay raporları doldurulmuşsa açılır
            if (ilkAyRaporDurumu !== 'tamamlandi' || ikinciAyRaporDurumu !== 'tamamlandi') {
              besinciAyRaporDurumu = 'onceki_raporlar_bekleniyor';
              console.log(`⚠️ ${personel.ad} ${personel.soyad} - 5. ay raporu için önce 1. ve 2. ay raporları doldurulmalı`);
            } else {
              // Önceki raporlar doldurulmuş, 5. ay raporunu kontrol et
              const besinciAyQuery = `
                SELECT TOP 1 id, rapor_durumu 
                FROM BesinciAyRapor 
                WHERE personelId = @personelId 
                ORDER BY raporTarihi DESC
              `;
              const besinciAyRequest = pool.request();
              besinciAyRequest.input('personelId', sql.Int, personel.id);
              const besinciAyResult = await besinciAyRequest.query(besinciAyQuery);
              
              // Rapor durumu kontrolü - 140-145 gün arası açık, 146+ gün gecikmiş
              if (besinciAyResult.recordset.length > 0) {
                besinciAyRaporDurumu = 'tamamlandi';
              } else if (calismaGunu >= 140 && calismaGunu <= 145) {
                // 140-145 gün arası: Rapor açık (5. ayın dolmasına 10-5 gün kala)
                besinciAyRaporDurumu = 'acik';
              } else if (calismaGunu > 145) {
                // 146+ gün: Süre geçmiş, gecikti
                besinciAyRaporDurumu = 'gecikti';
              }
            }
          }
        }
        
        // RaporTipi belirleme - RAPOR DURUMUNU KONTROL ET!
        let raporTipi = 'yeni'; // 0-24 gün: yeni
        if (calismaGunu >= 25 && calismaGunu < 55) {
          // 1. ay raporu doldurulmamışsa
          if (ilkAyRaporDurumu === 'acik' || ilkAyRaporDurumu === 'gecikti') {
            raporTipi = 'ilk_ay'; // 25-54 gün: 1. ay raporu açık veya gecikmiş
          } else {
            raporTipi = 'bekleniyor'; // 1. ay dolduruldu, 2. ay bekleniyor
          }
        } else if (calismaGunu >= 55 && calismaGunu < 140) {
          // 55-139 gün: 2. ay raporu kontrolü
          if (ilkAyRaporDurumu === 'acik' || ilkAyRaporDurumu === 'gecikti') {
            raporTipi = 'ilk_ay'; // 1. ay hala doldurulmamış (açık veya gecikmiş)
          } else if (ikinciAyRaporDurumu === 'acik' || ikinciAyRaporDurumu === 'gecikti' || ikinciAyRaporDurumu === 'birinci_ay_bekleniyor') {
            raporTipi = 'ikinci_ay'; // 2. ay raporu açık, gecikmiş veya bekleniyor
          } else {
            raporTipi = 'bekleniyor'; // Ara dönem (2. ay dolu, 5. ay bekleniyor)
          }
        } else if (calismaGunu >= 140) {
          // 140+ gün: 5. ay ve standart rapor kontrolü
          if (ilkAyRaporDurumu === 'acik' || ilkAyRaporDurumu === 'gecikti') {
            raporTipi = 'ilk_ay'; // 1. ay hala doldurulmamış
          } else if (ikinciAyRaporDurumu === 'acik' || ikinciAyRaporDurumu === 'gecikti') {
            raporTipi = 'ikinci_ay'; // 2. ay hala doldurulmamış
          } else if (besinciAyRaporDurumu === 'acik' || besinciAyRaporDurumu === 'gecikti' || besinciAyRaporDurumu === 'onceki_raporlar_bekleniyor') {
            raporTipi = 'besinci_ay'; // 5. ay raporu açık, gecikmiş veya önceki raporlar bekleniyor
          } else if (besinciAyRaporDurumu === 'tamamlandi' && calismaGunu >= 180) {
            raporTipi = 'standart'; // Tüm raporlar dolu, standart rapor (6 aylık)
          } else {
            raporTipi = 'bekleniyor'; // Ara dönem
          }
        }
        
        // Son 6 aylık (standart) rapor kontrolü - Her 6 ayda bir tekrarlanır
        let sonStandartRaporTarihi = null;
        if (calismaGunu >= 180) {
          const standartRaporQuery = `
            SELECT TOP 1 raporTarihi 
            FROM StandartRapor 
            WHERE personelId = @personelId 
            ORDER BY raporTarihi DESC
          `;
          const standartRaporRequest = pool.request();
          standartRaporRequest.input('personelId', sql.Int, personel.id);
          const standartRaporResult = await standartRaporRequest.query(standartRaporQuery);
          
          if (standartRaporResult.recordset.length > 0) {
            sonStandartRaporTarihi = standartRaporResult.recordset[0].raporTarihi;
          }
        }
        
        return {
          ...personel,
          ilkAyRaporDurumu,
          ikinciAyRaporDurumu,
          besinciAyRaporDurumu,
          sonStandartRaporTarihi,
          calismaGunu,
          raporTipi
        };
      })
    );
    
    console.log(`👥 Yönetici ${yoneticiId} için ${personellerWithReports.length} personel getirildi (rapor durumları ile)`);
    res.json(personellerWithReports);
    
  } catch (error) {
    console.error('Personel listesi getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// TÜM PERSONELLER - Admin/Yönetici için (Personel Yönetimi sayfası)
app.get('/api/personel/all', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    // Tüm personelleri getir (basit liste, rapor durumu hesaplamaları yok)
    const result = await pool.request().query(`
      SELECT 
        id,
        ad,
        soyad,
        grup,
        pozisyon,
        iseBaslamaTarihi,
        aktif,
        olusturmaTarihi,
        guncellemeTarihi
      FROM Personel
      ORDER BY id DESC
    `);
    
    console.log(`📋 ${result.recordset.length} personel listelendi`);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('❌ Tüm personel listesi getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// PERSONEL GÜNCELLE
app.put('/api/personel/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const { id } = req.params;
    const { ad, soyad, grup, pozisyon, iseBaslamaTarihi, aktif } = req.body;
    
    // Validasyon
    if (!ad || !soyad) {
      return res.status(400).json({ error: 'Ad ve Soyad alanları zorunludur' });
    }
    
    if (!iseBaslamaTarihi) {
      return res.status(400).json({ error: 'İşe Başlama Tarihi zorunludur' });
    }
    
    // Güncelleme
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('ad', sql.NVarChar, ad)
      .input('soyad', sql.NVarChar, soyad)
      .input('grup', sql.NVarChar, grup || null)
      .input('pozisyon', sql.NVarChar, pozisyon || null)
      .input('iseBaslamaTarihi', sql.Date, iseBaslamaTarihi)
      .input('aktif', sql.Bit, aktif !== undefined ? aktif : true)
      .query(`
        UPDATE Personel
        SET 
          ad = @ad,
          soyad = @soyad,
          grup = @grup,
          pozisyon = @pozisyon,
          iseBaslamaTarihi = @iseBaslamaTarihi,
          aktif = @aktif,
          guncellemeTarihi = GETDATE()
        WHERE id = @id
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }
    
    console.log(`✅ Personel güncellendi: ${ad} ${soyad} (ID: ${id})`);
    res.json({ success: true, message: 'Personel başarıyla güncellendi' });
    
  } catch (error) {
    console.error('❌ Personel güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// PERSONEL SİL
app.delete('/api/personel/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const { id } = req.params;
    
    // Önce personel bilgilerini al (log için)
    const personelResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT ad, soyad FROM Personel WHERE id = @id');
    
    if (personelResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Personel bulunamadı' });
    }
    
    const personel = personelResult.recordset[0];
    
    // İlişkili raporları sil
    await pool.request()
      .input('personelId', sql.Int, id)
      .query('DELETE FROM IlkAyRapor WHERE personelId = @personelId');
    
    await pool.request()
      .input('personelId', sql.Int, id)
      .query('DELETE FROM IkinciAyRapor WHERE personelId = @personelId');
    
    await pool.request()
      .input('personelId', sql.Int, id)
      .query('DELETE FROM BesinciAyRapor WHERE personelId = @personelId');
    
    await pool.request()
      .input('personelId', sql.Int, id)
      .query('DELETE FROM StandartRapor WHERE personelId = @personelId');
    
    // Personeli sil
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Personel WHERE id = @id');
    
    console.log(`🗑️ Personel silindi: ${personel.ad} ${personel.soyad} (ID: ${id})`);
    res.json({ success: true, message: 'Personel ve ilişkili raporlar başarıyla silindi' });
    
  } catch (error) {
    console.error('❌ Personel silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Personel raporları API endpoint'leri (PersonelRaporlari tablosu)
// Rapor hatırlatmaları için personel listesi (işe başlama tarihine göre rapor tipi hesaplanır)
app.get('/api/rapor-hatirlatmalari', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const yoneticiId = req.user.id;
    
    // Yöneticinin atanmış gruplarına göre personelleri getir
    const query = `
      SELECT DISTINCT p.*, yg.grupKodu
      FROM Personel p
      INNER JOIN YoneticiGruplari yg ON p.grup = yg.grupKodu
      LEFT JOIN Users u ON u.email = (
        SELECT TOP 1 u2.email 
        FROM Users u2 
        INNER JOIN YoneticiGruplari yg2 ON u2.id = yg2.yoneticiId 
        WHERE yg2.grupKodu = p.grup AND yg2.aktif = 1
      )
      WHERE p.aktif = 1 
        AND yg.yoneticiId = @yoneticiId 
        AND yg.aktif = 1
      ORDER BY p.ad, p.soyad
    `;
    
    const request = pool.request();
    request.input('yoneticiId', sql.Int, yoneticiId);
    const result = await request.query(query);
    
    // Her personel için rapor tipini hesapla
    const personellerWithReportType = await Promise.all(
      result.recordset.map(async (personel) => {
        const iseBaslamaTarihi = new Date(personel.iseBaslamaTarihi);
        const bugun = new Date();
        const calismaGunu = Math.floor((bugun.getTime() - iseBaslamaTarihi.getTime()) / (1000 * 60 * 60 * 24));
        
        let raporTipi = 'standart';
        
        // Gelecek tarihli personel veya yeni personel
        if (calismaGunu < 0) {
          raporTipi = 'henuz_baslamadi';
        } else if (calismaGunu < 25) {
          raporTipi = 'yeni'; // Henüz 25 gün dolmamış
        } else {
          // Rapor durumlarını kontrol et
          const ilkAyQuery = `SELECT TOP 1 id FROM IlkAyRapor WHERE personelId = @personelId`;
          const ilkAyReq = pool.request();
          ilkAyReq.input('personelId', sql.Int, personel.id);
          const ilkAyResult = await ilkAyReq.query(ilkAyQuery);
          const ilkAyDolduruldu = ilkAyResult.recordset.length > 0;
          
          const ikinciAyQuery = `SELECT TOP 1 id FROM IkinciAyRapor WHERE personelId = @personelId`;
          const ikinciAyReq = pool.request();
          ikinciAyReq.input('personelId', sql.Int, personel.id);
          const ikinciAyResult = await ikinciAyReq.query(ikinciAyQuery);
          const ikinciAyDolduruldu = ikinciAyResult.recordset.length > 0;
          
          const besinciAyQuery = `SELECT TOP 1 id FROM BesinciAyRapor WHERE personelId = @personelId`;
          const besinciAyReq = pool.request();
          besinciAyReq.input('personelId', sql.Int, personel.id);
          const besinciAyResult = await besinciAyReq.query(besinciAyQuery);
          const besinciAyDolduruldu = besinciAyResult.recordset.length > 0;
          
          // Rapor tipini belirle
          if (calismaGunu >= 25 && !ilkAyDolduruldu) {
            raporTipi = 'ilk_ay'; // 1. ay raporu açık
          } else if (calismaGunu >= 55 && ilkAyDolduruldu && !ikinciAyDolduruldu) {
            raporTipi = 'ikinci_ay'; // 2. ay raporu açık (1. ay doldurulmuş)
          } else if (calismaGunu >= 140 && ilkAyDolduruldu && ikinciAyDolduruldu && !besinciAyDolduruldu) {
            raporTipi = 'besinci_ay'; // 5. ay raporu açık (1. ve 2. ay doldurulmuş)
          } else if (calismaGunu >= 180 && ilkAyDolduruldu && ikinciAyDolduruldu && besinciAyDolduruldu) {
            raporTipi = 'standart'; // 6 aylık performans raporu (tüm raporlar doldurulmuş)
          } else {
            raporTipi = 'bekleniyor'; // Ara dönem
          }
        }
        
        return {
          ...personel,
          raporTipi,
          calismaGunu,
          yoneticiler: [] // Yönetici bilgisi eklenebilir
        };
      })
    );
    
    // Sadece rapor zamanı gelenler (açık ve gecikmiş raporlar)
    const raporZamaniGelenler = personellerWithReportType.filter(p => {
      return p.raporTipi === 'ilk_ay' || p.raporTipi === 'ikinci_ay' || p.raporTipi === 'besinci_ay';
    });
    
    // Gecikmiş ve açık raporları ayır
    const acikRaporlar = raporZamaniGelenler.filter(p => {
      return (p.calismaGunu >= 25 && p.calismaGunu <= 28) || 
             (p.calismaGunu >= 55 && p.calismaGunu <= 58) ||
             (p.calismaGunu >= 140 && p.calismaGunu <= 145);
    });
    const gecikmisRaporlar = raporZamaniGelenler.filter(p => {
      return p.calismaGunu > 28 || p.calismaGunu > 58 || p.calismaGunu > 145;
    });
    
    console.log(`📊 Rapor hatırlatması: ${raporZamaniGelenler.length} personel (${acikRaporlar.length} açık, ${gecikmisRaporlar.length} gecikmiş)`);
    
    res.json({
      success: true,
      personeller: raporZamaniGelenler,
      toplam: raporZamaniGelenler.length,
      acikRaporSayisi: acikRaporlar.length,
      gecikmisRaporSayisi: gecikmisRaporlar.length
    });
    
  } catch (error) {
    console.error('❌ Rapor hatırlatmaları getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Rapor hatırlatma maili gönderme (n8n webhook)
app.post('/api/rapor-hatirlatmalari/gonder', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const { personeller } = req.body;
    
    if (!personeller || personeller.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Personel listesi boş'
      });
    }
    
    console.log(`📧 ${personeller.length} personel için mail gönderimi başlatılıyor...`);
    
    // Burada n8n webhook'a istek atılabilir veya mail servisi kullanılabilir
    // Şimdilik başarılı response dönüyoruz
    
    res.json({
      success: true,
      message: `${personeller.length} personel için mail gönderildi`,
      gonderilen: personeller.length
    });
    
  } catch (error) {
    console.error('❌ Mail gönderimi hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/personel-raporlari', async (req, res) => {
  try {
    const {
      personelId,
      yoneticiId,
      raporTarihi,
      performans,
      isKalitesi,
      takimCalismasi,
      liderlik,
      ogrenme,
      gucluYonler,
      gelistirilmesiGerekenler,
      hedefler,
      genelYorum,
      raporDurumu
    } = req.body;

    const pool = await sql.connect(config);
    const request = pool.request();

    const insertQuery = `
      INSERT INTO PersonelRaporlari (
        personelId, yoneticiId, raporTarihi, performans, isKalitesi, 
        takimCalismasi, liderlik, ogrenme, gucluYonler, 
        gelistirilmesiGerekenler, hedefler, genelYorum, raporDurumu
      ) VALUES (
        @personelId, @yoneticiId, @raporTarihi, @performans, @isKalitesi,
        @takimCalismasi, @liderlik, @ogrenme, @gucluYonler,
        @gelistirilmesiGerekenler, @hedefler, @genelYorum, @raporDurumu
      );
      SELECT SCOPE_IDENTITY() as insertId;
    `;

    request.input('personelId', sql.Int, personelId);
    request.input('yoneticiId', sql.VarChar(50), yoneticiId);
    request.input('raporTarihi', sql.Date, raporTarihi);
    request.input('performans', sql.Decimal(3,1), performans);
    request.input('isKalitesi', sql.Decimal(3,1), isKalitesi);
    request.input('takimCalismasi', sql.Decimal(3,1), takimCalismasi);
    request.input('liderlik', sql.Decimal(3,1), liderlik);
    request.input('ogrenme', sql.Decimal(3,1), ogrenme);
    request.input('gucluYonler', sql.NVarChar(sql.MAX), gucluYonler);
    request.input('gelistirilmesiGerekenler', sql.NVarChar(sql.MAX), gelistirilmesiGerekenler);
    request.input('hedefler', sql.NVarChar(sql.MAX), hedefler);
    request.input('genelYorum', sql.NVarChar(sql.MAX), genelYorum);
    request.input('raporDurumu', sql.VarChar(20), raporDurumu);

    const result = await request.query(insertQuery);
    
    res.json({ 
      success: true,
      id: result.recordset[0].insertId,
      message: 'Personel raporu kaydedildi'
    });
    
  } catch (error) {
    console.error('Personel raporu kaydetme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// PersonelRaporlari tablosundan raporları getir
app.get('/api/personel-raporlari', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    
    const query = `
      SELECT pr.*, p.ad, p.soyad, p.grup, p.pozisyon 
      FROM PersonelRaporlari pr
      LEFT JOIN Personel p ON pr.personelId = p.id
      ORDER BY pr.raporTarihi DESC
    `;
    
    const result = await request.query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Personel raporları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Yöneticinin atanmış gruplarını getir
app.get('/api/yonetici-gruplari', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    const yoneticiId = req.user.id;
    
    const query = `
      SELECT yg.grupKodu, yg.atamaTarihi
      FROM YoneticiGruplari yg
      WHERE yg.yoneticiId = @yoneticiId 
        AND yg.aktif = 1
      ORDER BY yg.grupKodu
    `;
    
    request.input('yoneticiId', sql.Int, yoneticiId);
    const result = await request.query(query);
    
    console.log(`🏢 Yönetici ${yoneticiId} için ${result.recordset.length} grup getirildi`);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Yönetici grupları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RAPOR ENDPOINT'LERİ
// ============================================

// İlk ay raporu kaydet
app.post('/api/ilk-ay-raporu', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const {
      personelId,
      raporTarihi,
      denemeSuresiDegerlendirmesi,
      olumluIlenimler,
      olumsuzIlenimler,
      devamEtmeKarari,
      durum
    } = req.body;

    const pool = await sql.connect(config);
    const request = pool.request();

    const insertQuery = `
      INSERT INTO IlkAyRapor (
        personelId, raporTarihi,
        soru1_deneme_suresi_degerlendirmesi,
        soru2_olumlu_izlenimler,
        soru3_olumsuz_izlenimler,
        soru4_devam_etme_karari, soru4_puan,
        rapor_durumu
      ) VALUES (
        @personelId, @raporTarihi,
        @soru1_deneme_suresi_degerlendirmesi,
        @soru2_olumlu_izlenimler,
        @soru3_olumsuz_izlenimler,
        @soru4_devam_etme_karari, @soru4_puan,
        @rapor_durumu
      );
      SELECT SCOPE_IDENTITY() as insertId;
    `;

    request.input('personelId', sql.Int, personelId);
    request.input('raporTarihi', sql.Date, raporTarihi);
    request.input('soru1_deneme_suresi_degerlendirmesi', sql.NVarChar(sql.MAX), denemeSuresiDegerlendirmesi);
    request.input('soru2_olumlu_izlenimler', sql.NVarChar(sql.MAX), olumluIlenimler);
    request.input('soru3_olumsuz_izlenimler', sql.NVarChar(sql.MAX), olumsuzIlenimler);
    request.input('soru4_devam_etme_karari', sql.VarChar(10), devamEtmeKarari);
    request.input('soru4_puan', sql.Int, req.body.soru4_puan || null);
    request.input('rapor_durumu', sql.VarChar(20), durum || 'taslak');

    const result = await request.query(insertQuery);
    
    res.json({ 
      success: true,
      id: result.recordset[0].insertId,
      message: 'İlk ay raporu kaydedildi'
    });
    
  } catch (error) {
    console.error('İlk ay raporu kaydetme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İlk ay raporlarını getir
app.get('/api/ilk-ay-raporu', authenticateToken, checkPermission('faz5'), async (req, res) => {
  try {
    console.log('📊 İlk Ay Raporları istendi - Kullanıcı:', req.user.username);
    const pool = await sql.connect(config);
    const request = pool.request();
    
    const query = `
      SELECT 
        iar.id,
        iar.personelId,
        iar.raporTarihi,
        iar.soru1_deneme_suresi_degerlendirmesi,
        iar.soru2_olumlu_izlenimler,
        iar.soru3_olumsuz_izlenimler,
        iar.soru4_devam_etme_karari,
        iar.soru4_puan,
        iar.rapor_durumu,
        iar.olusturma_tarihi,
        p.ad,
        p.soyad,
        p.grup,
        p.pozisyon
      FROM IlkAyRapor iar
      LEFT JOIN Personel p ON iar.personelId = p.id
      ORDER BY iar.raporTarihi DESC
    `;
    
    const result = await request.query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('İlk ay raporları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İlk ay raporunu sil
app.delete('/api/ilk-ay-raporu/:id', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM IlkAyRapor WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }
    
    res.json({ success: true, message: 'İlk ay raporu silindi' });
  } catch (error) {
    console.error('İlk ay raporu silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İkinci ay raporu kaydet
app.post('/api/ikinci-ay-raporu', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const {
      personelId,
      raporTarihi,
      denemeSuresiDegerlendirmesi,
      olumluIlenimler,
      olumsuzIlenimler,
      devamEtmeKarari,
      durum
    } = req.body;

    const pool = await sql.connect(config);
    const request = pool.request();

    const insertQuery = `
      INSERT INTO IkinciAyRapor (
        personelId, raporTarihi,
        soru1_deneme_suresi_degerlendirmesi,
        soru2_olumlu_izlenimler,
        soru3_olumsuz_izlenimler,
        soru4_devam_etme_karari, soru4_puan,
        rapor_durumu
      ) VALUES (
        @personelId, @raporTarihi,
        @soru1_deneme_suresi_degerlendirmesi,
        @soru2_olumlu_izlenimler,
        @soru3_olumsuz_izlenimler,
        @soru4_devam_etme_karari, @soru4_puan,
        @rapor_durumu
      );
      SELECT SCOPE_IDENTITY() as insertId;
    `;

    request.input('personelId', sql.Int, personelId);
    request.input('raporTarihi', sql.Date, raporTarihi);
    request.input('soru1_deneme_suresi_degerlendirmesi', sql.NVarChar(sql.MAX), denemeSuresiDegerlendirmesi);
    request.input('soru2_olumlu_izlenimler', sql.NVarChar(sql.MAX), olumluIlenimler);
    request.input('soru3_olumsuz_izlenimler', sql.NVarChar(sql.MAX), olumsuzIlenimler);
    request.input('soru4_devam_etme_karari', sql.VarChar(10), devamEtmeKarari);
    request.input('soru4_puan', sql.Int, req.body.soru4_puan || null);
    request.input('rapor_durumu', sql.VarChar(20), durum || 'taslak');

    const result = await request.query(insertQuery);
    
    res.json({ 
      success: true,
      id: result.recordset[0].insertId,
      message: 'İkinci ay raporu kaydedildi'
    });
    
  } catch (error) {
    console.error('İkinci ay raporu kaydetme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İkinci ay raporlarını getir
app.get('/api/ikinci-ay-raporu', authenticateToken, checkPermission('faz5'), async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    
    const query = `
      SELECT 
        iar.id,
        iar.personelId,
        iar.raporTarihi,
        iar.soru1_deneme_suresi_degerlendirmesi,
        iar.soru2_olumlu_izlenimler,
        iar.soru3_olumsuz_izlenimler,
        iar.soru4_devam_etme_karari,
        iar.soru4_puan,
        iar.rapor_durumu,
        iar.olusturma_tarihi,
        p.ad,
        p.soyad,
        p.grup,
        p.pozisyon
      FROM IkinciAyRapor iar
      LEFT JOIN Personel p ON iar.personelId = p.id
      ORDER BY iar.raporTarihi DESC
    `;
    
    const result = await request.query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('İkinci ay raporları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İkinci ay raporunu sil
app.delete('/api/ikinci-ay-raporu/:id', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM IkinciAyRapor WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }
    
    res.json({ success: true, message: 'İkinci ay raporu silindi' });
  } catch (error) {
    console.error('İkinci ay raporu silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Standart rapor kaydet
app.post('/api/standart-rapor', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const {
      personelId,
      raporTarihi,
      raporDonemi,
      raporYili,
      soru1_deger_ureten_katkilar,
      soru2_ekip_iletisim_isbirligi,
      soru3_platform_veri_girisi,
      soru4_geri_bildirim_tutumu,
      soru5_problem_cozme_proaktivite,
      soru6_yenilikci_yaklasim,
      soru7_zamaninda_tamamlamada_basarı,
      soru8_gonullu_rol_alma_sorumluluk,
      soru9_farkli_ekiplerle_iletisim,
      genel_degerlendirme,
      genel_puan,
      durum
    } = req.body;

    const pool = await sql.connect(config);
    const request = pool.request();

    const insertQuery = `
      INSERT INTO StandartRapor (
        personelId, raporTarihi, raporDonemi, raporYili,
        soru1_deger_ureten_katkilar, soru1_puan,
        soru2_ekip_iletisim_isbirligi, soru2_puan,
        soru3_platform_veri_girisi, soru3_puan,
        soru4_geri_bildirim_tutumu, soru4_puan,
        soru5_problem_cozme_proaktivite, soru5_puan,
        soru6_yenilikci_yaklasim, soru6_puan,
        soru7_zamaninda_tamamlamada_basarı, soru7_puan,
        soru8_gonullu_rol_alma_sorumluluk, soru8_puan,
        soru9_farkli_ekiplerle_iletisim, soru9_puan,
        genel_degerlendirme,
        genel_puan,
        rapor_durumu
      ) VALUES (
        @personelId, @raporTarihi, @raporDonemi, @raporYili,
        @soru1_deger_ureten_katkilar, @soru1_puan,
        @soru2_ekip_iletisim_isbirligi, @soru2_puan,
        @soru3_platform_veri_girisi, @soru3_puan,
        @soru4_geri_bildirim_tutumu, @soru4_puan,
        @soru5_problem_cozme_proaktivite, @soru5_puan,
        @soru6_yenilikci_yaklasim, @soru6_puan,
        @soru7_zamaninda_tamamlamada_basarı, @soru7_puan,
        @soru8_gonullu_rol_alma_sorumluluk, @soru8_puan,
        @soru9_farkli_ekiplerle_iletisim, @soru9_puan,
        @genel_degerlendirme,
        @genel_puan,
        @rapor_durumu
      );
      SELECT SCOPE_IDENTITY() as insertId;
    `;

    request.input('personelId', sql.Int, personelId);
    request.input('raporTarihi', sql.Date, raporTarihi);
    request.input('raporDonemi', sql.NVarChar(20), raporDonemi);
    request.input('raporYili', sql.Int, raporYili);
    request.input('soru1_deger_ureten_katkilar', sql.NVarChar(sql.MAX), soru1_deger_ureten_katkilar);
    request.input('soru1_puan', sql.Int, req.body.soru1_puan || null);
    request.input('soru2_ekip_iletisim_isbirligi', sql.NVarChar(sql.MAX), soru2_ekip_iletisim_isbirligi);
    request.input('soru2_puan', sql.Int, req.body.soru2_puan || null);
    request.input('soru3_platform_veri_girisi', sql.NVarChar(sql.MAX), soru3_platform_veri_girisi);
    request.input('soru3_puan', sql.Int, req.body.soru3_puan || null);
    request.input('soru4_geri_bildirim_tutumu', sql.NVarChar(sql.MAX), soru4_geri_bildirim_tutumu);
    request.input('soru4_puan', sql.Int, req.body.soru4_puan || null);
    request.input('soru5_problem_cozme_proaktivite', sql.NVarChar(sql.MAX), soru5_problem_cozme_proaktivite);
    request.input('soru5_puan', sql.Int, req.body.soru5_puan || null);
    request.input('soru6_yenilikci_yaklasim', sql.NVarChar(sql.MAX), soru6_yenilikci_yaklasim);
    request.input('soru6_puan', sql.Int, req.body.soru6_puan || null);
    request.input('soru7_zamaninda_tamamlamada_basarı', sql.NVarChar(sql.MAX), soru7_zamaninda_tamamlamada_basarı);
    request.input('soru7_puan', sql.Int, req.body.soru7_puan || null);
    request.input('soru8_gonullu_rol_alma_sorumluluk', sql.NVarChar(sql.MAX), soru8_gonullu_rol_alma_sorumluluk);
    request.input('soru8_puan', sql.Int, req.body.soru8_puan || null);
    request.input('soru9_farkli_ekiplerle_iletisim', sql.NVarChar(sql.MAX), soru9_farkli_ekiplerle_iletisim);
    request.input('soru9_puan', sql.Int, req.body.soru9_puan || null);
    request.input('genel_degerlendirme', sql.NVarChar(sql.MAX), genel_degerlendirme);
    request.input('genel_puan', sql.Decimal(3,1), genel_puan);
    request.input('rapor_durumu', sql.VarChar(20), durum || 'taslak');

    const result = await request.query(insertQuery);
    res.json({
      success: true,
      id: result.recordset[0].insertId,
      message: 'Standart rapor kaydedildi'
    });
  } catch (error) {
    console.error('Standart rapor kaydetme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Standart raporları getir
app.get('/api/standart-rapor', authenticateToken, checkPermission('faz5'), async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    
    const query = `
      SELECT 
        sr.id,
        sr.personelId,
        sr.raporTarihi,
        sr.raporDonemi,
        sr.raporYili,
        sr.soru1_deger_ureten_katkilar,
        sr.soru1_puan,
        sr.soru2_ekip_iletisim_isbirligi,
        sr.soru2_puan,
        sr.soru3_platform_veri_girisi,
        sr.soru3_puan,
        sr.soru4_geri_bildirim_tutumu,
        sr.soru4_puan,
        sr.soru5_problem_cozme_proaktivite,
        sr.soru5_puan,
        sr.soru6_yenilikci_yaklasim,
        sr.soru6_puan,
        sr.soru7_zamaninda_tamamlamada_basarı,
        sr.soru7_puan,
        sr.soru8_gonullu_rol_alma_sorumluluk,
        sr.soru8_puan,
        sr.soru9_farkli_ekiplerle_iletisim,
        sr.soru9_puan,
        sr.genel_degerlendirme,
        sr.genel_puan,
        sr.rapor_durumu,
        sr.olusturma_tarihi,
        p.ad,
        p.soyad,
        p.grup,
        p.pozisyon
      FROM StandartRapor sr
      LEFT JOIN Personel p ON sr.personelId = p.id
      ORDER BY sr.raporYili DESC, sr.raporDonemi DESC, sr.raporTarihi DESC
    `;
    
    const result = await request.query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Standart raporları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Standart raporunu sil
app.delete('/api/standart-rapor/:id', authenticateToken, checkPermission('faz4'), async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM StandartRapor WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }
    
    res.json({ success: true, message: 'Standart rapor silindi' });
  } catch (error) {
    console.error('Standart rapor silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN PANEL API ENDPOINTS
// ============================================

// Tüm kullanıcıları listele (Admin Panel)
app.get('/api/admin/users', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.yetkiSeviyesi,
        u.is_active,
        u.created_at,
        CASE 
          WHEN u.yetkiSeviyesi IS NULL THEN 'Yetki Yok'
          WHEN u.yetkiSeviyesi = 1 THEN 'Temel Kullanıcı'
          WHEN u.yetkiSeviyesi = 2 THEN 'Rapor Görüntüleyici (Faz5)'
          WHEN u.yetkiSeviyesi = 3 THEN 'Tam Yetkili (Faz4+Faz5)'
          WHEN u.yetkiSeviyesi = 4 THEN 'Admin'
          ELSE 'Bilinmeyen'
        END as yetkiAciklamasi
      FROM users u
      ORDER BY u.yetkiSeviyesi DESC, u.username
    `);
    
    res.json({
      success: true,
      users: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Kullanıcı listesi hatası:', error);
    res.status(500).json({ 
      success: false,
      error: 'Kullanıcı listesi alınırken hata oluştu' 
    });
  }
});

// Kullanıcının yetki seviyesini güncelle (Admin Panel)
app.put('/api/admin/users/:id/yetki', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { yetkiSeviyesi } = req.body;
    
    // Validasyon
    if (![null, 1, 2, 3, 4].includes(yetkiSeviyesi)) {
      return res.status(400).json({ 
        success: false,
        error: 'Geçersiz yetki seviyesi. (null, 1, 2, 3, 4 olmalı)' 
      });
    }
    
    // Kendi yetkisini değiştirmeyi engelle
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Kendi yetki seviyenizi değiştiremezsiniz' 
      });
    }
    
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('yetkiSeviyesi', sql.Int, yetkiSeviyesi)
      .query(`
        UPDATE users 
        SET yetkiSeviyesi = @yetkiSeviyesi 
        WHERE id = @id
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Kullanıcı bulunamadı' 
      });
    }
    
    res.json({
      success: true,
      message: 'Yetki seviyesi başarıyla güncellendi'
    });
    
  } catch (error) {
    console.error('❌ Yetki güncelleme hatası:', error);
    res.status(500).json({ 
      success: false,
      error: 'Yetki güncellenirken hata oluştu' 
    });
  }
});

// Mevcut grupları listele (Personel tablosundan)
app.get('/api/admin/gruplar', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT DISTINCT 
        grup as grupKodu,
        COUNT(*) as personelSayisi
      FROM Personel
      WHERE aktif = 1
      GROUP BY grup
      ORDER BY grup
    `);
    
    res.json({
      success: true,
      gruplar: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Grup listesi hatası:', error);
    res.status(500).json({ 
      success: false,
      error: 'Grup listesi alınırken hata oluştu' 
    });
  }
});

// Tüm yönetici grup atamalarını listele
app.get('/api/admin/yonetici-gruplari', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT 
        yg.id,
        yg.yoneticiId,
        u.username,
        u.full_name,
        u.yetkiSeviyesi,
        yg.grupKodu,
        yg.atamaTarihi,
        yg.aktif,
        (
          SELECT COUNT(*) 
          FROM Personel p 
          WHERE p.grup = yg.grupKodu AND p.aktif = 1
        ) as grupPersonelSayisi
      FROM YoneticiGruplari yg
      INNER JOIN users u ON yg.yoneticiId = u.id
      ORDER BY u.username, yg.grupKodu
    `);
    
    res.json({
      success: true,
      atamalar: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Yönetici grup atamaları hatası:', error);
    res.status(500).json({ 
      success: false,
      error: 'Yönetici grup atamaları alınırken hata oluştu' 
    });
  }
});

// Yöneticiye grup ata
app.post('/api/admin/yonetici-gruplari', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const { yoneticiId, grupKodu } = req.body;
    
    // Validasyon
    if (!yoneticiId || !grupKodu) {
      return res.status(400).json({ 
        success: false,
        error: 'Yönetici ID ve grup kodu gerekli' 
      });
    }
    
    const pool = await sql.connect(config);
    
    // Yöneticinin varlığını kontrol et
    const userCheck = await pool.request()
      .input('yoneticiId', sql.Int, yoneticiId)
      .query('SELECT id, yetkiSeviyesi FROM users WHERE id = @yoneticiId');
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Kullanıcı bulunamadı' 
      });
    }
    
    // Yetki seviyesi kontrolü (2, 3 veya 4 olmalı)
    const yetkiSeviyesi = userCheck.recordset[0].yetkiSeviyesi;
    if (!yetkiSeviyesi || yetkiSeviyesi < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Bu kullanıcının yetki seviyesi yönetici gruplarına atanmaya uygun değil (En az 2 olmalı)' 
      });
    }
    
    // Grubun varlığını kontrol et
    const grupCheck = await pool.request()
      .input('grupKodu', sql.NVarChar, grupKodu)
      .query('SELECT COUNT(*) as count FROM Personel WHERE grup = @grupKodu AND aktif = 1');
    
    if (grupCheck.recordset[0].count === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Bu grup kodunda aktif personel bulunamadı' 
      });
    }
    
    // Atama yap
    const result = await pool.request()
      .input('yoneticiId', sql.Int, yoneticiId)
      .input('grupKodu', sql.NVarChar, grupKodu)
      .input('atayanId', sql.Int, req.user.id)
      .query(`
        INSERT INTO YoneticiGruplari (yoneticiId, grupKodu, atayanId, aktif)
        OUTPUT INSERTED.id
        VALUES (@yoneticiId, @grupKodu, @atayanId, 1)
      `);
    
    res.json({
      success: true,
      message: 'Grup başarıyla atandı',
      id: result.recordset[0]?.id
    });
    
  } catch (error) {
    // Unique constraint hatası
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({ 
        success: false,
        error: 'Bu yönetici zaten bu gruba atanmış' 
      });
    }
    
    console.error('❌ Grup atama hatası:', error);
    res.status(500).json({ 
      success: false,
      error: 'Grup atanırken hata oluştu' 
    });
  }
});

// Yönetici grup atamasını sil
app.delete('/api/admin/yonetici-gruplari/:id', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await sql.connect(config);
    
    // Atamanın varlığını kontrol et
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM YoneticiGruplari WHERE id = @id');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Atama bulunamadı' 
      });
    }
    
    // Atamayı sil
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM YoneticiGruplari WHERE id = @id');
    
    res.json({
      success: true,
      message: 'Grup ataması başarıyla silindi'
    });
    
  } catch (error) {
    console.error('❌ Grup atama silme hatası:', error);
    res.status(500).json({ 
      success: false,
      error: 'Grup ataması silinirken hata oluştu' 
    });
  }
});

// Admin panel istatistikleri
app.get('/api/admin/stats', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    // Toplam kullanıcı sayısı
    const usersResult = await pool.request().query(`
      SELECT COUNT(*) as toplamKullanici FROM users WHERE is_active = 1
    `);
    
    // Yetki dağılımı
    const yetkiResult = await pool.request().query(`
      SELECT 
        yetkiSeviyesi,
        COUNT(*) as sayi
      FROM users
      WHERE is_active = 1
      GROUP BY yetkiSeviyesi
      ORDER BY yetkiSeviyesi
    `);
    
    // Toplam grup sayısı
    const grupResult = await pool.request().query(`
      SELECT COUNT(DISTINCT grup) as toplamGrup FROM Personel WHERE aktif = 1
    `);
    
    // Toplam personel sayısı
    const personelResult = await pool.request().query(`
      SELECT COUNT(*) as toplamPersonel FROM Personel WHERE aktif = 1
    `);
    
    res.json({
      success: true,
      stats: {
        toplamKullanici: usersResult.recordset[0].toplamKullanici,
        toplamGrup: grupResult.recordset[0].toplamGrup,
        toplamPersonel: personelResult.recordset[0].toplamPersonel,
        yetkiDagilimi: yetkiResult.recordset
      }
    });
    
  } catch (error) {
    console.error('❌ İstatistik hatası:', error);
    res.status(500).json({ 
      success: false,
      error: 'İstatistikler alınırken hata oluştu' 
    });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 Analiz Faz1&Faz2 Database Service çalışıyor: ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CORS origin: ${process.env.DATABASE_SERVICE_CORS_ORIGIN}`);
  console.log(`🎯 Faz1 API: /api/analiz-faz1`);
  console.log(`🤖 Faz2 API: /api/analiz-faz2`);
  console.log(`👥 Personel API: /api/personel`);
  console.log(`📋 Rapor API: /api/ilk-ay-raporu, /api/ikinci-ay-raporu, /api/standart-rapor`);
  console.log(`🛡️  Admin Panel API: /api/admin/*`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  await pool.end();
  process.exit(0);
});
