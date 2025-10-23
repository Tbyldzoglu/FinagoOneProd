const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function testQuery() {
  let pool;
  
  try {
    console.log('🔗 Database bağlantısı...');
    
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
    console.log('✅ Bağlantı başarılı');
    
    // Tüm kayıtları getir
    const result = await pool.request().query(
      'SELECT * FROM analiz_faz1 ORDER BY yuklenme_tarihi DESC'
    );
    const rows = result.recordset;
    
    console.log('\n📋 analiz_faz1 Tablosu Kayıtları:');
    console.log('===================================');
    
    if (rows.length === 0) {
      console.log('Henüz kayıt yok.');
    } else {
      rows.forEach((row, index) => {
        console.log(`\n🔹 Kayıt ${index + 1}:`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Tarih: ${row.yuklenme_tarihi}`);
        console.log(`   Doküman: ${row.yuklenen_dokuman}`);
        
        // Amaç-Kapsam JSON parse ve göster
        if (row.amac_kapsam) {
          try {
            const amacKapsamData = JSON.parse(row.amac_kapsam);
            console.log(`   📋 Amaç-Kapsam: "${amacKapsamData.title}" - ${amacKapsamData.content ? amacKapsamData.content.substring(0, 50) + '...' : 'Boş'}`);
            console.log(`      ✅ İşlenme: ${amacKapsamData.isProcessed ? 'Evet' : 'Hayır'}`);
          } catch (e) {
            console.log(`   📋 Amaç-Kapsam: ${row.amac_kapsam.substring(0, 50)}...`);
          }
        } else {
          console.log(`   📋 Amaç-Kapsam: Boş`);
        }
        
        // Talep Bilgileri JSON parse ve göster
        if (row.talep_bilgileri) {
          try {
            const talepData = JSON.parse(row.talep_bilgileri);
            console.log(`   📝 Talep Bilgileri: "${talepData.title}"`);
            console.log(`      ✅ İşlenme: ${talepData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (talepData.fields) {
              const fieldCount = Object.keys(talepData.fields).length;
              const filledFields = Object.values(talepData.fields).filter(v => v && String(v).trim()).length;
              console.log(`      📊 Alanlar: ${filledFields}/${fieldCount} dolu`);
            }
          } catch (e) {
            console.log(`   📝 Talep Bilgileri: ${row.talep_bilgileri.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   📝 Talep Bilgileri: Boş`);
        }
        
        // Doküman Tarihçesi JSON parse ve göster
        if (row.dokuman_tarihcesi) {
          try {
            const tarihceData = JSON.parse(row.dokuman_tarihcesi);
            console.log(`   📅 Doküman Tarihçesi: "${tarihceData.title}"`);
            console.log(`      ✅ İşlenme: ${tarihceData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (tarihceData.rows) {
              const filledRows = tarihceData.rows.filter(r => 
                r.data && (r.data.tarih || r.data.versiyon || r.data.degisiklikYapan || r.data.aciklama)
              ).length;
              console.log(`      📊 Satırlar: ${filledRows}/${tarihceData.rows.length} dolu`);
            }
          } catch (e) {
            console.log(`   📅 Doküman Tarihçesi: ${row.dokuman_tarihcesi.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   📅 Doküman Tarihçesi: Boş`);
        }
        
        // Talep Değerlendirmesi JSON parse ve göster
        if (row.talep_degerlendirmesi) {
          try {
            const degerlendirmeData = JSON.parse(row.talep_degerlendirmesi);
            console.log(`   📊 Talep Değerlendirmesi: "${degerlendirmeData.title}"`);
            console.log(`      ✅ İşlenme: ${degerlendirmeData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (degerlendirmeData.formData) {
              // Form data'nın kaç alanının dolu olduğunu say
              const allFields = Object.values(degerlendirmeData.formData).flat();
              const filledFields = allFields.filter(field => 
                field && typeof field === 'object' && 
                Object.values(field).some(value => value && String(value).trim())
              ).length;
              console.log(`      📋 Form Alanları: ${filledFields}/${allFields.length} dolu`);
            }
          } catch (e) {
            console.log(`   📊 Talep Değerlendirmesi: ${row.talep_degerlendirmesi.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   📊 Talep Değerlendirmesi: Boş`);
        }
        
        // Mevcut İşleyiş JSON parse ve göster
        if (row.mevcut_isleyis) {
          try {
            const mevcutIsleyisData = JSON.parse(row.mevcut_isleyis);
            console.log(`   📝 Mevcut İşleyiş: "${mevcutIsleyisData.title}"`);
            console.log(`      ✅ İşlenme: ${mevcutIsleyisData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (mevcutIsleyisData.content) {
              const contentLength = mevcutIsleyisData.content.length;
              const preview = contentLength > 50 ? mevcutIsleyisData.content.substring(0, 50) + '...' : mevcutIsleyisData.content;
              console.log(`      📄 İçerik: "${preview}" (${contentLength} karakter)`);
            }
          } catch (e) {
            console.log(`   📝 Mevcut İşleyiş: ${row.mevcut_isleyis.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   📝 Mevcut İşleyiş: Boş`);
        }
        
        // Planlanan İşleyiş JSON parse ve göster
        if (row.planlanan_isleyis) {
          try {
            const planlananIsleyisData = JSON.parse(row.planlanan_isleyis);
            console.log(`   🔮 Planlanan İşleyiş: "${planlananIsleyisData.title}"`);
            console.log(`      ✅ İşlenme: ${planlananIsleyisData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (planlananIsleyisData.content) {
              const contentLength = planlananIsleyisData.content.length;
              const preview = contentLength > 50 ? planlananIsleyisData.content.substring(0, 50) + '...' : planlananIsleyisData.content;
              console.log(`      📄 İçerik: "${preview}" (${contentLength} karakter)`);
            }
          } catch (e) {
            console.log(`   🔮 Planlanan İşleyiş: ${row.planlanan_isleyis.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   🔮 Planlanan İşleyiş: Boş`);
        }
        
        // Fonksiyonel Gereksinimler JSON parse ve göster
        if (row.fonksiyonel_gereksinimler) {
          try {
            const fonksiyonelData = JSON.parse(row.fonksiyonel_gereksinimler);
            console.log(`   ⚙️ Fonksiyonel Gereksinimler: "${fonksiyonelData.title}"`);
            console.log(`      ✅ İşlenme: ${fonksiyonelData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (fonksiyonelData.content) {
              const contentLength = fonksiyonelData.content.length;
              const preview = contentLength > 50 ? fonksiyonelData.content.substring(0, 50) + '...' : fonksiyonelData.content;
              console.log(`      📄 İçerik: "${preview}" (${contentLength} karakter)`);
            }
          } catch (e) {
            console.log(`   ⚙️ Fonksiyonel Gereksinimler: ${row.fonksiyonel_gereksinimler.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   ⚙️ Fonksiyonel Gereksinimler: Boş`);
        }
        
        // Ekran Gereksinimleri JSON parse ve göster
        if (row.ekran_gereksinimleri) {
          try {
            const ekranData = JSON.parse(row.ekran_gereksinimleri);
            console.log(`   🖥️ Ekran Gereksinimleri: "${ekranData.title}"`);
            console.log(`      ✅ İşlenme: ${ekranData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (ekranData.content) {
              const contentLength = ekranData.content.length;
              const preview = contentLength > 50 ? ekranData.content.substring(0, 50) + '...' : ekranData.content;
              console.log(`      📄 İçerik: "${preview}" (${contentLength} karakter)`);
            }
          } catch (e) {
            console.log(`   🖥️ Ekran Gereksinimleri: ${row.ekran_gereksinimleri.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   🖥️ Ekran Gereksinimleri: Boş`);
        }
        
        // X Ekranı JSON parse ve göster
        if (row.x_ekrani) {
          try {
            const xEkraniData = JSON.parse(row.x_ekrani);
            console.log(`   📱 X Ekranı: "${xEkraniData.title}"`);
            console.log(`      ✅ İşlenme: ${xEkraniData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (xEkraniData.content) {
              const contentLength = xEkraniData.content.length;
              const preview = contentLength > 50 ? xEkraniData.content.substring(0, 50) + '...' : xEkraniData.content;
              console.log(`      📄 İçerik: "${preview}" (${contentLength} karakter)`);
            }
          } catch (e) {
            console.log(`   📱 X Ekranı: ${row.x_ekrani.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   📱 X Ekranı: Boş`);
        }
        
        // Ekran Tasarımları JSON parse ve göster
        if (row.ekran_tasarimlari) {
          try {
            const ekranTasarimlariData = JSON.parse(row.ekran_tasarimlari);
            console.log(`   🎨 Ekran Tasarımları: "${ekranTasarimlariData.title}"`);
            console.log(`      ✅ İşlenme: ${ekranTasarimlariData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (ekranTasarimlariData.formData) {
              const formData = ekranTasarimlariData.formData;
              console.log(`      📋 Ekran Bilgileri: ${formData.ekranBilgileri ? formData.ekranBilgileri.length : 0} alan`);
              console.log(`      📋 Alan Detayları: ${formData.alanDetaylari ? formData.alanDetaylari.length : 0} alan`);
              console.log(`      📋 Hesaplama Kuralları: ${formData.hesaplamaKurallari ? formData.hesaplamaKurallari.length : 0} kural`);
              console.log(`      📋 Buton Tasarımları: ${formData.butonTasarimlari ? formData.butonTasarimlari.length : 0} buton`);
              if (formData.aciklamaMetni) {
                const textLength = formData.aciklamaMetni.length;
                const preview = textLength > 50 ? formData.aciklamaMetni.substring(0, 50) + '...' : formData.aciklamaMetni;
                console.log(`      📄 Form Açıklama: "${preview}" (${textLength} karakter)`);
              }
            }
            // Ayrı text hook'undan gelen içerik
            if (ekranTasarimlariData.textContent) {
              const textLength = ekranTasarimlariData.textContent.length;
              const preview = textLength > 50 ? ekranTasarimlariData.textContent.substring(0, 50) + '...' : ekranTasarimlariData.textContent;
              console.log(`      📝 Ekran Tasarım Metni: "${preview}" (${textLength} karakter)`);
            } else {
              console.log(`      📝 Ekran Tasarım Metni: Boş`);
            }
          } catch (e) {
            console.log(`   🎨 Ekran Tasarımları: ${row.ekran_tasarimlari.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   🎨 Ekran Tasarımları: Boş`);
        }
        
        // Tasklar/Batchlar JSON parse ve göster
        if (row.tasklar_batchlar) {
          try {
            const tasklarBatchlarData = JSON.parse(row.tasklar_batchlar);
            console.log(`   📋 Tasklar/Batchlar: "${tasklarBatchlarData.title}"`);
            console.log(`      ✅ Tablo İşlenme: ${tasklarBatchlarData.tableProcessed ? 'Evet' : 'Hayır'}`);
            console.log(`      ✅ Text İşlenme: ${tasklarBatchlarData.textProcessed ? 'Evet' : 'Hayır'}`);
            if (tasklarBatchlarData.formData && tasklarBatchlarData.formData.rows) {
              console.log(`      📊 Tablo satır sayısı: ${tasklarBatchlarData.formData.rows.length}`);
            }
            if (tasklarBatchlarData.textContent) {
              const textLength = tasklarBatchlarData.textContent.length;
              const preview = textLength > 50 ? tasklarBatchlarData.textContent.substring(0, 50) + '...' : tasklarBatchlarData.textContent;
              console.log(`      📝 Task İş Akışı Metni: "${preview}" (${textLength} karakter)`);
            } else {
              console.log(`      📝 Task İş Akışı Metni: Boş`);
            }
          } catch (e) {
            console.log(`   📋 Tasklar/Batchlar: ${row.tasklar_batchlar.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   📋 Tasklar/Batchlar: Boş`);
        }
        
        // Task İş Akışı JSON parse ve göster
        if (row.task_is_akisi) {
          try {
            const taskIsAkisiData = JSON.parse(row.task_is_akisi);
            console.log(`   🔄 Task İş Akışı: "${taskIsAkisiData.title}"`);
            console.log(`      ✅ İşlenme: ${taskIsAkisiData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (taskIsAkisiData.content) {
              const contentLength = taskIsAkisiData.content.length;
              const preview = contentLength > 50 ? taskIsAkisiData.content.substring(0, 50) + '...' : taskIsAkisiData.content;
              console.log(`      📄 İçerik: "${preview}" (${contentLength} karakter)`);
            }
          } catch (e) {
            console.log(`   🔄 Task İş Akışı: ${row.task_is_akisi.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   🔄 Task İş Akışı: Boş`);
        }
        
        // Entegrasyonlar JSON parse ve göster
        if (row.entegrasyonlar) {
          try {
            const entegrasyonlarData = JSON.parse(row.entegrasyonlar);
            console.log(`   🔗 Entegrasyonlar: "${entegrasyonlarData.title}"`);
            console.log(`      ✅ İşlenme: ${entegrasyonlarData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (entegrasyonlarData.entegrasyonlar && entegrasyonlarData.entegrasyonlar.length > 0) {
              console.log(`      📊 Tablo satır sayısı: ${entegrasyonlarData.entegrasyonlar.length}`);
              entegrasyonlarData.entegrasyonlar.slice(0, 3).forEach((row, idx) => {
                console.log(`      ${idx + 1}. "${row.entegrasyonAdi || 'N/A'}" - "${row.amac || 'N/A'}" (${row.sorumluSistemler || 'N/A'})`);
              });
              if (entegrasyonlarData.entegrasyonlar.length > 3) {
                console.log(`      ... ve ${entegrasyonlarData.entegrasyonlar.length - 3} entegrasyon daha`);
              }
            } else {
              console.log(`      📊 Tablo: Boş`);
            }
          } catch (e) {
            console.log(`   🔗 Entegrasyonlar: ${row.entegrasyonlar.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   🔗 Entegrasyonlar: Boş`);
        }
        
        // Mesajlar JSON parse ve göster
        if (row.mesajlar) {
          try {
            const mesajlarData = JSON.parse(row.mesajlar);
            console.log(`   💬 Mesajlar: "${mesajlarData.title}"`);
            console.log(`      ✅ İşlenme: ${mesajlarData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (mesajlarData.mesajlar && mesajlarData.mesajlar.length > 0) {
              console.log(`      📊 Mesaj sayısı: ${mesajlarData.mesajlar.length}`);
              mesajlarData.mesajlar.slice(0, 3).forEach((mesaj, idx) => {
                console.log(`      ${idx + 1}. [${mesaj.mesajTipi || 'N/A'}] "${mesaj.mesajMetin || 'N/A'}" (${mesaj.mesajDili || 'N/A'})`);
              });
              if (mesajlarData.mesajlar.length > 3) {
                console.log(`      ... ve ${mesajlarData.mesajlar.length - 3} mesaj daha`);
              }
            } else {
              console.log(`      📊 Mesajlar: Boş`);
            }
          } catch (e) {
            console.log(`   💬 Mesajlar: ${row.mesajlar.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   💬 Mesajlar: Boş`);
        }
        
        // Parametreler JSON parse ve göster
        if (row.parametreler) {
          try {
            const parametrelerData = JSON.parse(row.parametreler);
            console.log(`   ⚙️ Parametreler: "${parametrelerData.title}"`);
            console.log(`      ✅ İşlenme: ${parametrelerData.isProcessed ? 'Evet' : 'Hayır'}`);
            if (parametrelerData.parametreler && parametrelerData.parametreler.length > 0) {
              console.log(`      📊 Parametre sayısı: ${parametrelerData.parametreler.length}`);
              parametrelerData.parametreler.slice(0, 3).forEach((parametre, idx) => {
                const data = parametre.data || {};
                console.log(`      ${idx + 1}. "${data.parametreAdi || 'N/A'}" - "${data.aciklama || 'N/A'}" (${data.varsayilanDeger || 'N/A'})`);
              });
              if (parametrelerData.parametreler.length > 3) {
                console.log(`      ... ve ${parametrelerData.parametreler.length - 3} parametre daha`);
              }
            } else {
              console.log(`      📊 Parametreler: Boş`);
            }
          } catch (e) {
            console.log(`   ⚙️ Parametreler: ${row.parametreler.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   ⚙️ Parametreler: Boş`);
        }
        
        // Conversion Migration JSON parse ve göster
        if (row.conversation_migration) {
          try {
            const conversionMigrationData = JSON.parse(row.conversation_migration);
            console.log(`   🔄 Conversion Migration: "${conversionMigrationData.title}"`);
            console.log(`      ✅ İşlenme: ${conversionMigrationData.isProcessed ? 'Evet' : 'Hayır'}`);
            console.log(`      📝 İçerik uzunluğu: ${conversionMigrationData.content ? conversionMigrationData.content.length : 0} karakter`);
            if (conversionMigrationData.content && conversionMigrationData.content.length > 0) {
              const preview = conversionMigrationData.content.substring(0, 100).replace(/\n/g, ' ');
              console.log(`      📄 İçerik önizleme: "${preview}${conversionMigrationData.content.length > 100 ? '...' : ''}"`);
            } else {
              console.log(`      📄 İçerik: Boş`);
            }
          } catch (e) {
            console.log(`   🔄 Conversion Migration: ${row.conversation_migration.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   🔄 Conversion Migration: Boş`);
        }
        
        // Diagram Akışlar JSON parse ve göster
        if (row.diagram_akislar) {
          try {
            const diagramAkislarData = JSON.parse(row.diagram_akislar);
            console.log(`   📊 Diagram Akışlar: "${diagramAkislarData.title}"`);
            console.log(`      ✅ İşlenme: ${diagramAkislarData.isProcessed ? 'Evet' : 'Hayır'}`);
            console.log(`      📝 İçerik uzunluğu: ${diagramAkislarData.content ? diagramAkislarData.content.length : 0} karakter`);
            if (diagramAkislarData.content && diagramAkislarData.content.length > 0) {
              const preview = diagramAkislarData.content.substring(0, 100).replace(/\n/g, ' ');
              console.log(`      📄 İçerik önizleme: "${preview}${diagramAkislarData.content.length > 100 ? '...' : ''}"`);
            } else {
              console.log(`      📄 İçerik: Boş`);
            }
          } catch (e) {
            console.log(`   📊 Diagram Akışlar: ${row.diagram_akislar.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   📊 Diagram Akışlar: Boş`);
        }
        
        // Muhasebe JSON parse ve göster
        if (row.muhasebe) {
          try {
            const muhasebeData = JSON.parse(row.muhasebe);
            console.log(`   💰 Muhasebe: "${muhasebeData.title}"`);
            console.log(`      ✅ İşlenme: ${muhasebeData.isProcessed ? 'Evet' : 'Hayır'}`);
            console.log(`      📝 İçerik uzunluğu: ${muhasebeData.content ? muhasebeData.content.length : 0} karakter`);
            if (muhasebeData.content && muhasebeData.content.length > 0) {
              const preview = muhasebeData.content.substring(0, 100).replace(/\n/g, ' ');
              console.log(`      📄 İçerik önizleme: "${preview}${muhasebeData.content.length > 100 ? '...' : ''}"`);
            } else {
              console.log(`      📄 İçerik: Boş`);
            }
          } catch (e) {
            console.log(`   💰 Muhasebe: ${row.muhasebe.length} karakter (JSON parse hatası)`);
          }
        } else {
          console.log(`   💰 Muhasebe: Boş`);
        }
        
            // X İşlemi Muhasebesi JSON parse ve göster (sadece form verileri)
            if (row.x_islemi_muhasebesi) {
              try {
                const xIslemiMuhasebeData = JSON.parse(row.x_islemi_muhasebesi);
                console.log(`   🔢 X İşlemi Muhasebesi: "${xIslemiMuhasebeData.title}"`);

                // Form verileri (useXIslemiMuhasebeModal hook - formData property)
                if (xIslemiMuhasebeData.formData && Object.keys(xIslemiMuhasebeData.formData).length > 0) {
                  const formFields = Object.keys(xIslemiMuhasebeData.formData);
                  console.log(`      📝 Form alanları: ${formFields.length} alan`);
                  // Tüm alanları göster
                  formFields.forEach((field, idx) => {
                    const value = xIslemiMuhasebeData.formData[field];
                    console.log(`      ${idx + 1}. ${field}: "${value ? value.substring(0, 50) : 'Boş'}${value && value.length > 50 ? '...' : ''}"`);
                  });

                  // Validation özeti
                  if (xIslemiMuhasebeData.validation) {
                    const validation = xIslemiMuhasebeData.validation;
                    console.log(`      🔍 Validation: ${validation.found ? 'Bulundu' : 'Bulunamadı'} (${validation.mode || 'N/A'} modu)`);
                    if (validation.matchedLabels && validation.matchedLabels.length > 0) {
                      console.log(`      🎯 Eşleşen alanlar: ${validation.matchedLabels.length} adet`);
                    }
                  }
                  console.log(`      ✅ İşlenme: ${xIslemiMuhasebeData.isProcessed ? 'Evet' : 'Hayır'}`);
                } else {
                  console.log(`      📝 Form: Boş`);
                }
              } catch (e) {
                console.log(`   🔢 X İşlemi Muhasebesi: ${row.x_islemi_muhasebesi.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   🔢 X İşlemi Muhasebesi: Boş`);
            }

            // X İşlemi Muhasebe Deseni JSON parse ve göster
            if (row.x_islemi_muhasebe_deseni) {
              try {
                const xIslemiMuhasebeDeseniData = JSON.parse(row.x_islemi_muhasebe_deseni);
                console.log(`   🎨 X İşlemi Muhasebe Deseni: "${xIslemiMuhasebeDeseniData.title}"`);
                console.log(`      ✅ İşlenme: ${xIslemiMuhasebeDeseniData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${xIslemiMuhasebeDeseniData.content ? xIslemiMuhasebeDeseniData.content.length : 0} karakter`);
                if (xIslemiMuhasebeDeseniData.content) {
                  console.log(`      📄 İçerik önizleme: "${xIslemiMuhasebeDeseniData.content.substring(0, 50)}${xIslemiMuhasebeDeseniData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   🎨 X İşlemi Muhasebe Deseni: ${row.x_islemi_muhasebe_deseni.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   🎨 X İşlemi Muhasebe Deseni: Boş`);
            }

            // Case1 JSON parse ve göster
            if (row.case1) {
              try {
                const case1Data = JSON.parse(row.case1);
                console.log(`   📊 Case1: "${case1Data.title}"`);
                console.log(`      ✅ İşlenme: ${case1Data.isProcessed ? 'Evet' : 'Hayır'}`);
                
                if (case1Data.tableRows && case1Data.tableRows.length > 0) {
                  console.log(`      📊 Tablo satır sayısı: ${case1Data.tableRows.length}`);
                  // İlk birkaç satırı göster
                  case1Data.tableRows.slice(0, 2).forEach((row, idx) => {
                    const data = row.data || {};
                    const firstKey = Object.keys(data)[0];
                    const firstValue = data[firstKey] || '';
                    console.log(`      ${idx + 1}. ID: ${row.id || 'N/A'} - ${firstKey}: "${firstValue.substring(0, 20)}${firstValue.length > 20 ? '...' : ''}" (${Object.keys(data).length} alan)`);
                  });
                  if (case1Data.tableRows.length > 2) {
                    console.log(`      ... ve ${case1Data.tableRows.length - 2} satır daha`);
                  }
                } else {
                  console.log(`      📊 Tablo: Boş`);
                }

                if (case1Data.validation) {
                  const validation = case1Data.validation;
                  console.log(`      🔍 Validation: ${validation.found ? 'Bulundu' : 'Bulunamadı'} (${validation.mode || 'N/A'} modu)`);
                  if (validation.warnings && validation.warnings.length > 0) {
                    console.log(`      ⚠️ Uyarılar: ${validation.warnings.length} adet`);
                  }
                }
              } catch (e) {
                console.log(`   📊 Case1: ${row.case1.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   📊 Case1: Boş`);
            }

            // X İşlemi Kayıt Kuralları JSON parse ve göster
            if (row.x_islemi_kayit_kurallari) {
              try {
                const xIslemiKayitKurallariData = JSON.parse(row.x_islemi_kayit_kurallari);
                console.log(`   📋 X İşlemi Kayıt Kuralları: "${xIslemiKayitKurallariData.title}"`);
                console.log(`      ✅ İşlenme: ${xIslemiKayitKurallariData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${xIslemiKayitKurallariData.content ? xIslemiKayitKurallariData.content.length : 0} karakter`);
                if (xIslemiKayitKurallariData.content) {
                  console.log(`      📄 İçerik önizleme: "${xIslemiKayitKurallariData.content.substring(0, 50)}${xIslemiKayitKurallariData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   📋 X İşlemi Kayıt Kuralları: ${row.x_islemi_kayit_kurallari.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   📋 X İşlemi Kayıt Kuralları: Boş`);
            }

            // X İşlemi Vergi Komisyon JSON parse ve göster
            if (row.x_islemi_vergi_komisyon) {
              try {
                const xIslemiVergiKomisyonData = JSON.parse(row.x_islemi_vergi_komisyon);
                console.log(`   💸 X İşlemi Vergi Komisyon: "${xIslemiVergiKomisyonData.title}"`);
                console.log(`      ✅ İşlenme: ${xIslemiVergiKomisyonData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${xIslemiVergiKomisyonData.content ? xIslemiVergiKomisyonData.content.length : 0} karakter`);
                if (xIslemiVergiKomisyonData.content) {
                  console.log(`      📄 İçerik önizleme: "${xIslemiVergiKomisyonData.content.substring(0, 50)}${xIslemiVergiKomisyonData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   💸 X İşlemi Vergi Komisyon: ${row.x_islemi_vergi_komisyon.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   💸 X İşlemi Vergi Komisyon: Boş`);
            }

            // X İşlemi Muhasebe Senaryoları JSON parse ve göster
            if (row.x_islemi_muhasebe_senaryolari) {
              try {
                const xIslemiMuhasebeSenaryolariData = JSON.parse(row.x_islemi_muhasebe_senaryolari);
                console.log(`   🎭 X İşlemi Muhasebe Senaryoları: "${xIslemiMuhasebeSenaryolariData.title}"`);
                console.log(`      ✅ İşlenme: ${xIslemiMuhasebeSenaryolariData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${xIslemiMuhasebeSenaryolariData.content ? xIslemiMuhasebeSenaryolariData.content.length : 0} karakter`);
                if (xIslemiMuhasebeSenaryolariData.content) {
                  console.log(`      📄 İçerik önizleme: "${xIslemiMuhasebeSenaryolariData.content.substring(0, 50)}${xIslemiMuhasebeSenaryolariData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   🎭 X İşlemi Muhasebe Senaryoları: ${row.x_islemi_muhasebe_senaryolari.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   🎭 X İşlemi Muhasebe Senaryoları: Boş`);
            }

            // X İşlemi Örnek Kayıtlar JSON parse ve göster
            if (row.x_islemi_ornek_kayitlar) {
              try {
                const xIslemiOrnekKayitlarData = JSON.parse(row.x_islemi_ornek_kayitlar);
                console.log(`   📝 X İşlemi Örnek Kayıtlar: "${xIslemiOrnekKayitlarData.title}"`);
                console.log(`      ✅ İşlenme: ${xIslemiOrnekKayitlarData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${xIslemiOrnekKayitlarData.content ? xIslemiOrnekKayitlarData.content.length : 0} karakter`);
                if (xIslemiOrnekKayitlarData.content) {
                  console.log(`      📄 İçerik önizleme: "${xIslemiOrnekKayitlarData.content.substring(0, 50)}${xIslemiOrnekKayitlarData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   📝 X İşlemi Örnek Kayıtlar: ${row.x_islemi_ornek_kayitlar.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   📝 X İşlemi Örnek Kayıtlar: Boş`);
            }

            // Fonksiyonel Olmayan Gereksinimler JSON parse ve göster
            if (row.fonksiyonel_olmayan_gereksinimler) {
              try {
                const fonksiyonelOlmayanGereksinimlerData = JSON.parse(row.fonksiyonel_olmayan_gereksinimler);
                console.log(`   🔧 Fonksiyonel Olmayan Gereksinimler: "${fonksiyonelOlmayanGereksinimlerData.title}"`);
                console.log(`      ✅ İşlenme: ${fonksiyonelOlmayanGereksinimlerData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${fonksiyonelOlmayanGereksinimlerData.content ? fonksiyonelOlmayanGereksinimlerData.content.length : 0} karakter`);
                if (fonksiyonelOlmayanGereksinimlerData.content) {
                  console.log(`      📄 İçerik önizleme: "${fonksiyonelOlmayanGereksinimlerData.content.substring(0, 50)}${fonksiyonelOlmayanGereksinimlerData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   🔧 Fonksiyonel Olmayan Gereksinimler: ${row.fonksiyonel_olmayan_gereksinimler.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   🔧 Fonksiyonel Olmayan Gereksinimler: Boş`);
            }

            // Kimlik Doğrulama ve Log Yönetimi JSON parse ve göster
            if (row.kimlik_dogrulama_log) {
              try {
                const kimlikDogrulamaLogData = JSON.parse(row.kimlik_dogrulama_log);
                console.log(`   🔐 Kimlik Doğrulama ve Log Yönetimi: "${kimlikDogrulamaLogData.title}"`);
                console.log(`      ✅ İşlenme: ${kimlikDogrulamaLogData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${kimlikDogrulamaLogData.content ? kimlikDogrulamaLogData.content.length : 0} karakter`);
                if (kimlikDogrulamaLogData.content) {
                  console.log(`      📄 İçerik önizleme: "${kimlikDogrulamaLogData.content.substring(0, 50)}${kimlikDogrulamaLogData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   🔐 Kimlik Doğrulama ve Log Yönetimi: ${row.kimlik_dogrulama_log.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   🔐 Kimlik Doğrulama ve Log Yönetimi: Boş`);
            }

            // Yetkilendirme ve Onay Mekanizmaları JSON parse ve göster
            if (row.yetkilendirme_onay) {
              try {
                const yetkilendirmeOnayData = JSON.parse(row.yetkilendirme_onay);
                console.log(`   🔐 Yetkilendirme ve Onay Mekanizmaları: "${yetkilendirmeOnayData.title}"`);
                
                // Yetkilendirme modal
                const yetkilendirme = yetkilendirmeOnayData.modals?.yetkilendirme;
                if (yetkilendirme) {
                  console.log(`      🔑 Yetkilendirme: İşlenme ${yetkilendirme.isProcessed ? 'Evet' : 'Hayır'}, Satır: ${yetkilendirme.tableData?.tableRows?.length || 0}`);
                  if (yetkilendirme.tableData?.tableRows?.length > 0) {
                    const firstRow = yetkilendirme.tableData.tableRows[0];
                    console.log(`         📋 İlk satır: ${firstRow.data?.rolKullanici || 'N/A'} - ${firstRow.data?.ekranIslem || 'N/A'}`);
                  }
                }
                
                // Onay Süreci modal
                const onaySureci = yetkilendirmeOnayData.modals?.onaySureci;
                if (onaySureci) {
                  console.log(`      🔄 Onay Süreci: İşlenme ${onaySureci.isProcessed ? 'Evet' : 'Hayır'}, Satır: ${onaySureci.tableData?.tableRows?.length || 0}`);
                  if (onaySureci.tableData?.tableRows?.length > 0) {
                    const firstRow = onaySureci.tableData.tableRows[0];
                    console.log(`         📋 İlk satır: ${firstRow.data?.islemTipi || 'N/A'} - ${firstRow.data?.onaySeviyesi || 'N/A'}`);
                  }
                }
              } catch (e) {
                console.log(`   🔐 Yetkilendirme ve Onay Mekanizmaları: ${row.yetkilendirme_onay.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   🔐 Yetkilendirme ve Onay Mekanizmaları: Boş`);
            }

            // Veri Kritikliği JSON parse ve göster
            if (row.veri_kritikligi) {
              try {
                const veriKritikligiData = JSON.parse(row.veri_kritikligi);
                console.log(`   📊 Veri Kritikliği: "${veriKritikligiData.title}"`);
                console.log(`      ✅ İşlenme: ${veriKritikligiData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📊 Tablo satır sayısı: ${veriKritikligiData.tableData?.tableRows?.length || 0}`);
                if (veriKritikligiData.tableData?.tableRows?.length > 0) {
                  const firstRow = veriKritikligiData.tableData.tableRows[0];
                  console.log(`      📋 İlk satır: ${firstRow.data?.veriAdi || 'N/A'} - ${firstRow.data?.gizlilik || 'N/A'}`);
                }
              } catch (e) {
                console.log(`   📊 Veri Kritikliği: ${row.veri_kritikligi.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   📊 Veri Kritikliği: Boş`);
            }

            // Paydaşlar ve Kullanıcılar JSON parse ve göster
            if (row.paydaslar_kullanicilar) {
              try {
                const paydaslarKullanicilarData = JSON.parse(row.paydaslar_kullanicilar);
                console.log(`   👥 Paydaşlar ve Kullanıcılar: "${paydaslarKullanicilarData.title}"`);
                console.log(`      ✅ İşlenme: ${paydaslarKullanicilarData.isProcessed ? 'Evet' : 'Hayır'}`);
                if (paydaslarKullanicilarData.formData?.data) {
                  const formData = paydaslarKullanicilarData.formData.data;
                  console.log(`      📋 Form verileri: ${Object.keys(formData).length} alan`);
                  if (formData.paydasEkipKullaniciBilgileri) {
                    console.log(`      👤 Paydaş Bilgileri: "${formData.paydasEkipKullaniciBilgileri.substring(0, 30)}${formData.paydasEkipKullaniciBilgileri.length > 30 ? '...' : ''}"`);
                  }
                }
              } catch (e) {
                console.log(`   👥 Paydaşlar ve Kullanıcılar: ${row.paydaslar_kullanicilar.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   👥 Paydaşlar ve Kullanıcılar: Boş`);
            }

            // Kapsam Dışında JSON parse ve göster
            if (row.kapsam_disinda) {
              try {
                const kapsamDisindaData = JSON.parse(row.kapsam_disinda);
                console.log(`   📋 Kapsam Dışında: "${kapsamDisindaData.title}"`);
                console.log(`      ✅ İşlenme: ${kapsamDisindaData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${kapsamDisindaData.content?.length || 0} karakter`);
                if (kapsamDisindaData.content && kapsamDisindaData.content.length > 0) {
                  console.log(`      📄 İçerik önizleme: "${kapsamDisindaData.content.substring(0, 50)}${kapsamDisindaData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   📋 Kapsam Dışında: ${row.kapsam_disinda.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   📋 Kapsam Dışında: Boş`);
            }

            // Kabul Kriterleri JSON parse ve göster
            if (row.kabul_kriterleri) {
              try {
                const kabulKriterleriData = JSON.parse(row.kabul_kriterleri);
                console.log(`   ✅ Kabul Kriterleri: "${kabulKriterleriData.title}"`);
                console.log(`      ✅ İşlenme: ${kabulKriterleriData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📊 Tablo satır sayısı: ${kabulKriterleriData.tableData?.tableRows?.length || 0}`);
                if (kabulKriterleriData.tableData?.tableRows?.length > 0) {
                  const firstRow = kabulKriterleriData.tableData.tableRows[0];
                  console.log(`      📋 İlk satır: ${firstRow.kriterIs || 'N/A'} - ${firstRow.aciklama || 'N/A'}`);
                }
              } catch (e) {
                console.log(`   ✅ Kabul Kriterleri: ${row.kabul_kriterleri.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   ✅ Kabul Kriterleri: Boş`);
            }

            // Onaylar JSON parse ve göster
            if (row.onaylar) {
              try {
                const onaylarData = JSON.parse(row.onaylar);
                console.log(`   👥 Onaylar: "${onaylarData.title}"`);
                console.log(`      ✅ İşlenme: ${onaylarData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📊 Tablo satır sayısı: ${onaylarData.tableData?.tableRows?.length || 0}`);
                if (onaylarData.tableData?.tableRows?.length > 0) {
                  const firstRow = onaylarData.tableData.tableRows[0];
                  console.log(`      📋 İlk satır: ${firstRow.isim || 'N/A'} - ${firstRow.unvan || 'N/A'} - ${firstRow.tarih || 'N/A'}`);
                }
              } catch (e) {
                console.log(`   👥 Onaylar: ${row.onaylar.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   👥 Onaylar: Boş`);
            }

            // Ekler JSON parse ve göster
            if (row.ekler) {
              try {
                const eklerData = JSON.parse(row.ekler);
                console.log(`   📎 Ekler: "${eklerData.title}"`);
                console.log(`      ✅ İşlenme: ${eklerData.isProcessed ? 'Evet' : 'Hayır'}`);
                console.log(`      📝 İçerik uzunluğu: ${eklerData.content?.length || 0} karakter`);
                if (eklerData.content && eklerData.content.length > 0) {
                  console.log(`      📄 İçerik önizleme: "${eklerData.content.substring(0, 50)}${eklerData.content.length > 50 ? '...' : ''}"`);
                }
              } catch (e) {
                console.log(`   📎 Ekler: ${row.ekler.length} karakter (JSON parse hatası)`);
              }
            } else {
              console.log(`   📎 Ekler: Boş`);
            }
      });
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

testQuery();
