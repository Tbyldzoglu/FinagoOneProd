import mammoth from 'mammoth';

// Türkçe karakter normalizasyonu
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/i c/g, 'ic')
    .replace(/t e f t i s/g, 'teftis');
}

interface KimlikDogrulamaLogTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// KİMLİK DOĞRULAMA VE LOG YÖNETİMİ metin başlığını bul
function findKimlikDogrulamaLogTextHeader(doc: Document): Element | null {
  console.log('🔍 KİMLİK DOĞRULAMA VE LOG YÖNETİMİ METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler - Kimlik Doğrulama ve Log Yönetimi
    'kimlik dogrulama ve log yonetimi',
    'kimlik doğrulama ve log yönetimi',
    'kimlik dogrulama log yonetimi',
    'kimlik doğrulama log yönetimi',
    'kimlik dogrulama ve log',
    'kimlik doğrulama ve log',
    'authentication and log management',
    'authentication and logging',
    'authentication log management',
    'authentication logging',
    'auth and log management',
    'auth and logging',
    'identity verification and logging',
    'identity verification and log management',
    // Kimlik Doğrulama terimleri
    'kimlik dogrulama',
    'kimlik doğrulama',
    'kimlik dogrulaması',
    'kimlik doğrulaması',
    'kimlik verification',
    'kimlik teyidi',
    'kimlik kontrolu',
    'kimlik kontrolü',
    'authentication',
    'auth',
    'login',
    'oturum acma',
    'oturum açma',
    'kullanici dogrulama',
    'kullanıcı doğrulama',
    'user authentication',
    'user verification',
    'kullanici kimlik',
    'kullanıcı kimlik',
    'user identity',
    'sifre dogrulama',
    'şifre doğrulama',
    'password verification',
    'password authentication',
    'biometric dogrulama',
    'biometric doğrulama',
    'biometric authentication',
    'multi factor authentication',
    'mfa',
    '2fa',
    'two factor authentication',
    'cift faktor dogrulama',
    'çift faktör doğrulama',
    'token dogrulama',
    'token doğrulama',
    'token authentication',
    'sso',
    'single sign on',
    'tek oturum acma',
    'tek oturum açma',
    // Log Yönetimi terimleri
    'log yonetimi',
    'log yönetimi',
    'log management',
    'logging',
    'loglama',
    'kayit yonetimi',
    'kayıt yönetimi',
    'record management',
    'audit log',
    'audit kayit',
    'audit kayıt',
    'denetim kaydi',
    'denetim kaydı',
    'denetim log',
    'sistem loglari',
    'sistem logları',
    'system logs',
    'uygulama loglari',
    'uygulama logları',
    'application logs',
    'guvenlik loglari',
    'güvenlik logları',
    'security logs',
    'erisim loglari',
    'erişim logları',
    'access logs',
    'olay kayitlari',
    'olay kayıtları',
    'event logs',
    'hata loglari',
    'hata logları',
    'error logs',
    'performans loglari',
    'performans logları',
    'performance logs',
    'transaction logs',
    'islem loglari',
    'işlem logları',
    'log dosyalari',
    'log dosyaları',
    'log files',
    'log analizi',
    'log analysis',
    'log izleme',
    'log monitoring',
    'log saklama',
    'log retention',
    'log arsivleme',
    'log arşivleme',
    'log archiving',
    // Güvenlik terimleri
    'guvenlik',
    'güvenlik',
    'security',
    'guvenlik politikasi',
    'güvenlik politikası',
    'security policy',
    'yetkilendirme',
    'authorization',
    'erisim kontrolu',
    'erişim kontrolü',
    'access control',
    'rol yonetimi',
    'role management',
    'kullanici yonetimi',
    'kullanıcı yönetimi',
    'user management',
    'session yonetimi',
    'session management',
    'oturum yonetimi',
    // İzleme ve Denetim
    'izleme',
    'monitoring',
    'denetim',
    'audit',
    'kontrol',
    'control',
    'takip',
    'tracking',
    'gozlem',
    'gözlem',
    'observation',
    'raporlama',
    'reporting',
    'analiz',
    'analysis',
    // Numaralı başlıklar
    '5.',
    '5.1',
    '5.2',
    '6.',
    '6.1',
    '6.2',
    '7.',
    '7.1',
    '7.2',
    '5. kimlik',
    '5.1 kimlik',
    '6. kimlik',
    '6.1 kimlik',
    '5. authentication',
    '5.1 authentication',
    '6. authentication',
    '6.1 authentication',
    '5. log',
    '5.1 log',
    '6. log',
    '6.1 log',
    '5. guvenlik',
    '5.1 güvenlik',
    '6. guvenlik',
    '6.1 güvenlik',
    // İlişkili terimler
    'kimlik yonetimi',
    'kimlik yönetimi',
    'identity management',
    'idm',
    'active directory',
    'ldap',
    'oauth',
    'openid',
    'saml',
    'kerberos',
    'radius',
    'tacacs',
    'pki',
    'certificate',
    'sertifika',
    'digital signature',
    'dijital imza',
    'encryption',
    'sifrelemee',
    'şifreleme',
    'hash',
    'checksum',
    'integrity',
    'butunluk',
    'bütünlük'
  ];
  
  console.log('🔍 KİMLİK DOĞRULAMA VE LOG YÖNETİMİ METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
  // Önce h1-h6 başlıkları ara
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log(`📋 ${headings.length} başlık elementi bulundu`);
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const text = heading.textContent?.trim() || '';
    const normalized = normalizeText(text);
    console.log(`🔍 Başlık ${i + 1}: "${text}" → "${normalized}"`);
    
    for (const term of searchTerms) {
      if (normalized.includes(term)) {
        console.log(`🎯 KİMLİK DOĞRULAMA VE LOG YÖNETİMİ METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
        return heading;
      }
    }
  }
  
  // Başlık bulunamadı, tüm elementlerde ara
  console.log('🔍 Başlıklarda bulunamadı, tüm elementlerde aranıyor...');
  const allElements = doc.querySelectorAll('p, div, span, td, th');
  console.log(`📋 Toplam ${allElements.length} element taranacak`);
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent?.trim() || '';
    const normalized = normalizeText(text);
    
    // Debug: İlk 100 elementi logla
    if (i < 100) {
      console.log(`🔍 Element ${i + 1}: "${text.substring(0, 80)}..." → "${normalized.substring(0, 80)}..."`);
      
      // Eğer kimlik doğrulama log terimleri içeriyorsa özel işaretle
      if ((normalized.includes('kimlik') && normalized.includes('dogrulama') && normalized.includes('log')) ||
          (normalized.includes('authentication') && normalized.includes('log'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 KİMLİK DOĞRULAMA VE LOG YÖNETİMİ METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ KİMLİK DOĞRULAMA VE LOG YÖNETİMİ METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 KİMLİK DOĞRULAMA VE LOG YÖNETİMİ METNİ: Başlık altındaki içerik toplaniyor...');
  
  const content: string[] = [];
  let currentElement = headerElement.nextElementSibling;
  let elementCount = 0;
  const maxElements = 20;
  
  console.log(`🎯 Başlangıç elementi: "${headerElement.textContent?.substring(0, 30)}..."`);
  
  while (currentElement && elementCount < maxElements) {
    const tagName = currentElement.tagName.toLowerCase();
    const text = currentElement.textContent?.trim() || '';
    
    console.log(`🔍 Element ${elementCount + 1}: [${tagName}] "${text.substring(0, 50)}..."`);
    
    // Yeni başlık bulundu, dur (daha katı kontrol)
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) && text.length > 3) {
      console.log(`🛑 Yeni başlık bulundu, durduruluyor: "${text}"`);
      break;
    }
    
    // Başlık benzeri metinler de kontrol et (büyük harfli, kısa metinler)
    if (text.length < 50 && text.length > 5 && text === text.toUpperCase() && !text.includes('.')) {
      console.log(`🛑 Başlık benzeri metin bulundu, durduruluyor: "${text}"`);
      break;
    }
    
    // Boş içerik atla (çok esnek uzunluk)
    if (!text || text.length < 3) {
      console.log(`⏭️ Çok kısa, atlandı: "${text}"`);
      elementCount++;
      currentElement = currentElement.nextElementSibling;
      continue;
    }
    
    // Tablo içeriği atla
    if (tagName === 'table' || currentElement.querySelector('table')) {
      console.log(`🚫 Tablo atlandı (Kimlik Doğrulama ve Log Yönetimi tablolarını geç)`);
      elementCount++;
      currentElement = currentElement.nextElementSibling;
      continue;
    }
    
    // İyi görünen içerik (çok esnek)
    if (text.length >= 3) {
      content.push(text);
      console.log(`✅ İçerik eklendi (${text.length} kar): "${text.substring(0, 100)}..."`);
      
      // İlk 3 paragrafı bulduktan sonra dur
      if (content.length >= 3) {
        console.log('🎯 3 paragraf bulundu, yeterli');
        break;
      }
    } else {
      console.log(`🤔 Çok kısa ama kayıt altında: "${text}"`);
    }
    
    elementCount++;
    currentElement = currentElement.nextElementSibling;
  }
  
  const result = content.join('\n\n');
  console.log(`✅ KİMLİK DOĞRULAMA VE LOG YÖNETİMİ METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForKimlikDogrulamaLogTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: Kimlik Doğrulama ve Log Yönetimi Metni aranıyor...');
  
  const keywords = [
    // ÇOK YÜKSEK öncelik - Kimlik Doğrulama ve Log Yönetimi birlikte
    'kimlik dogrulama ve log yonetimi', 'kimlik doğrulama ve log yönetimi', 'kimlik dogrulama log yonetimi',
    'kimlik doğrulama log yönetimi', 'kimlik dogrulama ve log', 'kimlik doğrulama ve log',
    'authentication and log management', 'authentication and logging', 'authentication log management',
    'authentication logging', 'auth and log management', 'auth and logging',
    // YÜKSEK öncelik - Kimlik Doğrulama ana terimleri
    'kimlik dogrulama', 'kimlik doğrulama', 'kimlik dogrulaması', 'kimlik doğrulaması',
    'authentication', 'auth', 'login', 'oturum acma', 'oturum açma',
    'kullanici dogrulama', 'kullanıcı doğrulama', 'user authentication', 'user verification',
    // YÜKSEK öncelik - Log Yönetimi ana terimleri
    'log yonetimi', 'log yönetimi', 'log management', 'logging', 'loglama',
    'kayit yonetimi', 'kayıt yönetimi', 'record management', 'audit log', 'audit kayit', 'audit kayıt',
    'denetim kaydi', 'denetim kaydı', 'denetim log',
    // ORTA-YÜKSEK öncelik - Gelişmiş kimlik doğrulama
    'multi factor authentication', 'mfa', '2fa', 'two factor authentication',
    'cift faktor dogrulama', 'çift faktör doğrulama', 'token dogrulama', 'token doğrulama',
    'token authentication', 'sso', 'single sign on', 'tek oturum acma', 'tek oturum açma',
    'biometric dogrulama', 'biometric doğrulama', 'biometric authentication',
    // ORTA-YÜKSEK öncelik - Log türleri
    'sistem loglari', 'sistem logları', 'system logs', 'uygulama loglari', 'uygulama logları',
    'application logs', 'guvenlik loglari', 'güvenlik logları', 'security logs',
    'erisim loglari', 'erişim logları', 'access logs', 'olay kayitlari', 'olay kayıtları', 'event logs',
    // ORTA öncelik - Güvenlik terimleri
    'guvenlik', 'güvenlik', 'security', 'yetkilendirme', 'authorization',
    'erisim kontrolu', 'erişim kontrolü', 'access control', 'rol yonetimi', 'role management',
    'kullanici yonetimi', 'kullanıcı yönetimi', 'user management', 'session yonetimi', 'session management',
    // ORTA öncelik - İzleme ve Denetim
    'izleme', 'monitoring', 'denetim', 'audit', 'kontrol', 'control',
    'takip', 'tracking', 'gozlem', 'gözlem', 'observation', 'raporlama', 'reporting',
    // ORTA öncelik - Teknik terimler
    'kimlik yonetimi', 'kimlik yönetimi', 'identity management', 'idm',
    'active directory', 'ldap', 'oauth', 'openid', 'saml', 'kerberos',
    'log analizi', 'log analysis', 'log izleme', 'log monitoring',
    // DÜŞÜK öncelik - Genel terimler
    'kimlik', 'identity', 'dogrulama', 'doğrulama', 'verification', 'log', 'logging',
    'yonetim', 'yönetim', 'management', 'kayit', 'kayıt', 'record', 'oturum', 'session',
    'kullanici', 'kullanıcı', 'user', 'sifre', 'şifre', 'password', 'token', 'certificate'
  ];
  
  const blacklistKeywords = [
    'içindekiler', 'contents', 'table', 'tablo', 'page', 'sayfa',
    'başlık', 'title', 'index', 'menu', 'bölüm', 'section',
    'fonksiyonel gereksinimler', 'fonksiyonel', 'functional requirements',
    'fonksiyonel olmayan gereksinimler', 'non functional requirements',
    'ekran gereksinimleri', 'screen requirements', 'ui requirements',
    'amaç ve kapsam', 'mevcut işleyiş', 'planlanan işleyiş',
    'gereksinimler', 'requirements', 'talep', 'değerlendirme',
    'doküman', 'document', 'tarihçe', 'history', 'x ekrani', 'x ekranı',
    'ekran tasarimlari', 'ekran tasarımları', 'ekran tasarim',
    'tasklar batchlar', 'tasklar batchler', 'task is akisi', 'task iş akışı',
    'conversion ve migration', 'conversion migration', 'donusum ve migrasyon',
    'diagram ve akislar', 'diagram ve akışlar', 'diagram akislar', 'diagram akışlar',
    // X İşlemi modal'larından kaçın
    'x islemi vergi komisyon', 'x işlemi vergi komisyon', 'x islemi vergi ve komisyon',
    'x işlemi vergi ve komisyon', 'x vergi komisyon', 'x vergi ve komisyon',
    'x islemi kayit kurallari', 'x işlemi kayıt kuralları',
    'x islemi muhasebe deseni', 'x işlemi muhasebe deseni',
    'x islemi muhasebe senaryolari', 'x işlemi muhasebe senaryoları',
    'x islemi ornek kayitlar', 'x işlemi örnek kayıtlar',
    'x islemi muhasebe', 'x işlemi muhasebe', 'x muhasebe', 'x accounting',
    // Diğer modalların içerikleri
    'entegrasyonlar', 'mesajlar', 'parametreler', /* yetkilendirme hariç */
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar',
    'case1', 'case 1', 'test senaryolari', 'test senaryoları',
    // Tablo parser'larından kaçın
    'talep bilgileri', 'sistem bilgileri', 'proje bilgileri',
    'uygulamalar tablosu', 'veritabanlari tablosu', 'veritabanları tablosu',
    'donanim tablosu', 'donanım tablosu', 'network tablosu', 'ağ tablosu'
  ];
  
  const allElements = doc.querySelectorAll('p, div, span');
  const candidates: { element: Element; score: number; content: string }[] = [];
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent?.trim() || '';
    const normalized = normalizeText(text);
    
    // Çok kısa veya blacklist kontrolü
    if (text.length < 20) continue;
    
    let isBlacklisted = false;
    for (const blackword of blacklistKeywords) {
      if (normalized.includes(blackword)) {
        isBlacklisted = true;
        break;
      }
    }
    if (isBlacklisted) continue;
    
    // Sadece sayı/noktalama işareti olanlar atla
    if (/^[\d.\s)-]+$/.test(text)) continue;
    
    // Tablo içeriği atla
    if (element.closest('table')) continue;
    
    // Skorlama - Kimlik Doğrulama ve Log Yönetimi spesifik
    let score = 0;
    
    // Keyword puanları (Kimlik Doğrulama ve Log Yönetimi odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - Kimlik Doğrulama + Log Yönetimi birlikte
      if (keyword.includes('kimlik') && keyword.includes('dogrulama') && keyword.includes('log') && keyword.includes('yonetim')) {
        score += count * 100; // En önemli - tam kombinasyon
      } else if (keyword.includes('authentication') && keyword.includes('log') && keyword.includes('management')) {
        score += count * 95; // İngilizce tam kombinasyon
      }
      // YÜKSEK öncelik - Kimlik Doğrulama + Log kısa kombinasyon
      else if (keyword.includes('kimlik') && keyword.includes('dogrulama') && keyword.includes('log')) {
        score += count * 90; // Kimlik doğrulama ve log
      } else if (keyword.includes('authentication') && keyword.includes('log')) {
        score += count * 85; // Authentication ve log
      }
      // YÜKSEK öncelik - Ana terimler
      else if (keyword === 'kimlik dogrulama' || keyword === 'kimlik doğrulama') {
        score += count * 80; // Kimlik doğrulama
      } else if (keyword === 'authentication') {
        score += count * 75; // Authentication
      } else if (keyword === 'log yonetimi' || keyword === 'log yönetimi') {
        score += count * 80; // Log yönetimi
      } else if (keyword === 'log management') {
        score += count * 75; // Log management
      }
      // ORTA-YÜKSEK öncelik - Gelişmiş auth ve log türleri
      else if (keyword.includes('multi factor') || keyword === 'mfa' || keyword === '2fa') {
        score += count * 70; // Multi-factor authentication
      } else if (keyword.includes('audit log') || keyword.includes('audit kayit')) {
        score += count * 70; // Audit log
      } else if (keyword.includes('security log') || keyword.includes('guvenlik log')) {
        score += count * 65; // Security logs
      }
      // ORTA öncelik - Güvenlik ve yönetim
      else if (keyword.includes('access control') || keyword.includes('erisim kontrol')) {
        score += count * 60; // Access control
      } else if (keyword.includes('user management') || keyword.includes('kullanici yonetim')) {
        score += count * 55; // User management
      } else if (keyword === 'monitoring' || keyword === 'izleme') {
        score += count * 50; // Monitoring
      }
      // DÜŞÜK öncelik - Genel terimler
      else if (keyword === 'kimlik' || keyword === 'identity') {
        score += count * 30; // Kimlik
      } else if (keyword === 'log' || keyword === 'logging') {
        score += count * 30; // Log
      } else {
        score += count * 25; // Diğer terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Orta eşik - Kimlik Doğrulama ve Log Yönetimi için seçici ama toleranslı
    if (score > 40) {
      candidates.push({ element, score, content: text });
      console.log(`📊 Aday bulundu: Skor ${score}, "${text.substring(0, 80)}..."`);
    }
  }
  
  // En yüksek skorlu adayları al
  candidates.sort((a, b) => b.score - a.score);
  
  console.log(`📊 ${candidates.length} aday bulundu`);
  
  // İlk 10 adayı göster
  for (let i = 0; i < Math.min(10, candidates.length); i++) {
    const candidate = candidates[i];
    console.log(`🏆 Aday ${i + 1}: Skor ${candidate.score}, "${candidate.content.substring(0, 120)}..."`);
  }
  
  if (candidates.length > 0) {
    // İlk 5 adayı al
    const topCandidates = candidates.slice(0, 5);
    const result = topCandidates.map(c => c.content).join('\n\n');
    console.log(`✅ SCAN mode sonuç: ${result.length} karakter`);
    return result;
  }
  
  console.log('❌ SCAN mode\'da uygun içerik bulunamadı');
  return '';
}

// Ana parse fonksiyonu
export async function parseKimlikDogrulamaLogTextFromDocx(file: File): Promise<KimlikDogrulamaLogTextParseResult> {
  console.log('🔍 DOCX Kimlik Doğrulama ve Log Yönetimi Metni Parse Başlıyor:', file.name);
  
  try {
    console.log(`📄 Dosya okunuyor: ${file.name} (${file.size} bytes)`);
    
    // Dosyayı klonla
    const arrayBuffer = await file.arrayBuffer();
    const clonedBuffer = arrayBuffer.slice(0);
    const result = await mammoth.convertToHtml({ arrayBuffer: clonedBuffer });
    
    console.log(`📄 HTML Dönüştürme Tamamlandı, uzunluk: ${result.value.length}`);
    
    if (result.messages && result.messages.length > 0) {
      console.log('⚠️ Mammoth uyarıları:', result.messages);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, 'text/html');
    
    console.log('🎯 STRICT Mode: Başlık arıyor...');
    
    // STRICT Mode: Başlık bul
    const headerElement = findKimlikDogrulamaLogTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 Kimlik Doğrulama ve Log Yönetimi Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['Kimlik Doğrulama ve Log Yönetimi Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['Kimlik Doğrulama ve Log Yönetimi Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForKimlikDogrulamaLogTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 Kimlik Doğrulama ve Log Yönetimi Metni Parse Sonucu (SCAN):', {
        found: true,
        mode: 'scan',
        contentLength: scanContent.length,
        matchedLabels: ['Content Found via Scan'],
        errors: [],
        warnings: ['İçerik alternatif yöntemle bulundu']
      });
      
      return {
        found: true,
        mode: 'scan',
        content: scanContent.trim(),
        contentLength: scanContent.length,
        matchedLabels: ['Content Found via Scan'],
        errors: [],
        warnings: ['İçerik alternatif yöntemle bulundu']
      };
    }
    
    // Hiçbir şey bulunamadı
    return {
      found: false,
      mode: 'strict',
      content: '',
      contentLength: 0,
      matchedLabels: [],
      errors: ['Kimlik Doğrulama ve Log Yönetimi Metni içeriği bulunamadı'],
      warnings: []
    };
    
  } catch (error) {
    console.error('❌ Parse hatası:', error);
    return {
      found: false,
      mode: 'strict',
      content: '',
      contentLength: 0,
      matchedLabels: [],
      errors: [`Parse hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
      warnings: []
    };
  }
}
