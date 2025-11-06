# Word Export Service

Veritabanındaki modal verilerini Word dokümanlarına export eden servis.

## Kurulum

```bash
cd wordexport
npm install
```

## Yapılandırma

1. `env.example` dosyasını `.env` olarak kopyalayın
2. Database ayarlarını yapılandırın
3. Template ve output klasörlerini ayarlayın

```bash
cp env.example .env
```

## Kullanım

### Temel Kullanım

```javascript
const WordExportService = require('./index');

const service = new WordExportService();

// Belirli bir doküman için export
const result = await service.exportDocument(
  'doc_123',           // Doküman ID
  'user_456',          // Kullanıcı ID
  'template.docx',     // Template dosyası
  'output.docx'        // Output dosyası (opsiyonel)
);

if (result.success) {
  console.log('Export başarılı:', result.outputPath);
} else {
  console.log('Export hatası:', result.error);
}
```

### Sadece Talep Bilgileri Export

```javascript
// Sadece talep bilgileri modal verisini export et
const result = await service.exportTalepBilgileri(
  'doc_123',
  'user_456', 
  'talep_template.docx'
);
```

### Batch Export

```javascript
// Birden fazla doküman için export
const docIds = ['doc_1', 'doc_2', 'doc_3'];
const results = await service.batchExport('template.docx', docIds);
```

## Template Formatı

Word template'lerinizde placeholder'ları şu formatta kullanın:

```
{{talep_no}}
{{talep_adi}}
{{talep_sahibi_is_birimi}}
{{talep_sahibi_kurum}}
{{talep_yoneticisi}}
{{teknik_ekipler}}
```

## Desteklenen Modal Türleri

### 1. Form Modallar
- Talep Bilgileri
- X İşlemi Muhasebesi
- Muhasebe

### 2. Text Modallar
- Amaç Kapsam
- Mevcut İşleyiş
- Planlanan İşleyiş
- Fonksiyonel Gereksinimler
- Ekran Gereksinimleri
- X Ekranı
- Task İş Akışı
- Entegrasyonlar
- Mesajlar
- Parametreler
- Conversation Migration
- Diagram Akışlar

### 3. Tablo Modallar
- Case1
- Ekran Tasarımları
- Veri Kritikliği
- Tasklar Batchlar

## Test

```bash
npm test
```

Test scripti şunları yapar:
- Doküman listesini getirir
- Template listesini getirir
- Talep bilgileri export testi yapar
- Template placeholder'larını listeler
- Output dosyalarını listeler

## Klasör Yapısı

```
wordexport/
├── index.js              # Ana servis
├── database.js           # Database işlemleri
├── dataParser.js         # Veri parse işlemleri
├── wordExporter.js       # Word export işlemleri
├── test.js              # Test scripti
├── package.json         # NPM yapılandırması
├── env.example          # Environment örneği
├── templates/           # Word template'leri
└── output/             # Export edilen dosyalar
```

## API Referansı

### WordExportService

#### `exportDocument(docId, userId, templateFileName, outputFileName)`
Belirli bir doküman için tam export yapar.

#### `exportTalepBilgileri(docId, userId, templateFileName, outputFileName)`
Sadece talep bilgileri modal verisini export eder.

#### `listDocuments()`
Tüm dokümanları listeler.

#### `listTemplates()`
Mevcut template'leri listeler.

#### `listOutputs()`
Export edilen dosyaları listeler.

#### `listTemplatePlaceholders(templateFileName)`
Template'deki placeholder'ları listeler.

#### `validateTemplate(templateFileName, docId, userId)`
Template ve veri uyumluluğunu kontrol eder.

#### `batchExport(templateFileName, docIds, userId)`
Birden fazla doküman için batch export yapar.

## Örnek Template

Word template'inizde şu placeholder'ları kullanabilirsiniz:

```
TALEP BİLGİLERİ
===============

Talep No: {{talep_no}}
Talep Adı: {{talep_adi}}
Talep Sahibi İş Birimi: {{talep_sahibi_is_birimi}}
Talep Sahibi Kurum: {{talep_sahibi_kurum}}
Talep Yöneticisi: {{talep_yoneticisi}}
Teknik Ekipler: {{teknik_ekipler}}

Export Tarihi: {{export_timestamp}}
İşlenme Durumu: {{is_processed}}
```

## Hata Ayıklama

1. Database bağlantısını kontrol edin
2. Template dosyasının var olduğunu kontrol edin
3. Placeholder isimlerinin doğru olduğunu kontrol edin
4. Veri formatının doğru olduğunu kontrol edin

## Geliştirme

Yeni modal türleri eklemek için `dataParser.js` dosyasına yeni parse fonksiyonları ekleyin.
