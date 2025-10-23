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

interface XIslemiOrnekKayitlarTextParseResult {
  found: boolean;
  mode: 'strict' | 'scan';
  content: string;
  contentLength: number;
  matchedLabels: string[];
  errors: string[];
  warnings: string[];
}

// X İŞLEMİ ÖRNEK KAYITLAR metin başlığını bul
function findXIslemiOrnekKayitlarTextHeader(doc: Document): Element | null {
  console.log('🔍 X İŞLEMİ ÖRNEK KAYITLAR METNİ: Başlık aranıyor...');
  
  const searchTerms = [
    // Ana terimler - X İşlemi Örnek Kayıtlar
    'x islemi ornek kayitlar',
    'x işlemi örnek kayıtlar',
    'x islemi ornek kayitlari',
    'x işlemi örnek kayıtları',
    'x islemi ornekler',
    'x işlemi örnekler',
    'x islemi kayit ornekleri',
    'x işlemi kayıt örnekleri',
    'x islemi kayit ornegi',
    'x işlemi kayıt örneği',
    'x ornek kayitlar',
    'x örnek kayıtlar',
    'x ornek kayitlari',
    'x örnek kayıtları',
    'x ornekler',
    'x örnekler',
    'x kayit ornekleri',
    'x kayıt örnekleri',
    'x kayit ornegi',
    'x kayıt örneği',
    'x sample records',
    'x sample entries',
    'x record samples',
    'x entry samples',
    'x examples',
    'ornek kayitlar x',
    'örnek kayıtlar x',
    'ornek kayitlari x',
    'örnek kayıtları x',
    'ornekler x',
    'örnekler x',
    'kayit ornekleri x',
    'kayıt örnekleri x',
    'sample records x',
    'sample entries x',
    'examples x',
    // X İşlemi + Kayıt + Örnek
    'x islemi kayit ornek',
    'x işlemi kayıt örnek',
    'x islemi ornek kayit',
    'x işlemi örnek kayıt',
    'x kayit ornek',
    'x kayıt örnek',
    'x ornek kayit',
    'x örnek kayıt',
    'x record example',
    'x example record',
    'x entry example',
    'x example entry',
    // Spesifik kayıt örnekleri
    'x islemi muhasebe kayitlari',
    'x işlemi muhasebe kayıtları',
    'x islemi muhasebe ornekleri',
    'x işlemi muhasebe örnekleri',
    'x islemi yevmiye kayitlari',
    'x işlemi yevmiye kayıtları',
    'x islemi yevmiye ornekleri',
    'x işlemi yevmiye örnekleri',
    'x islemi defter kayitlari',
    'x işlemi defter kayıtları',
    'x islemi defter ornekleri',
    'x işlemi defter örnekleri',
    'x muhasebe kayitlari',
    'x muhasebe kayıtları',
    'x muhasebe ornekleri',
    'x muhasebe örnekleri',
    'x yevmiye kayitlari',
    'x yevmiye kayıtları',
    'x yevmiye ornekleri',
    'x yevmiye örnekleri',
    'x defter kayitlari',
    'x defter kayıtları',
    'x defter ornekleri',
    'x defter örnekleri',
    'x accounting records',
    'x accounting entries',
    'x journal entries',
    'x ledger entries',
    'x bookkeeping records',
    'x bookkeeping entries',
    // Kayıt türleri
    'x islemi borç alacak',
    'x işlemi borç alacak',
    'x islemi borc alacak',
    'x işlemi borç alacak',
    'x islemi debit credit',
    'x işlemi debit credit',
    'x borç alacak',
    'x borç alacak',
    'x borc alacak',
    'x debit credit',
    'x debit credit',
    'x islemi hesap kayitlari',
    'x işlemi hesap kayıtları',
    'x islemi hesap ornekleri',
    'x işlemi hesap örnekleri',
    'x hesap kayitlari',
    'x hesap kayıtları',
    'x hesap ornekleri',
    'x hesap örnekleri',
    'x account records',
    'x account entries',
    'x account examples',
    // Genel kayıt terimleri
    'ornek kayitlar',
    'örnek kayıtlar',
    'ornek kayitlari',
    'örnek kayıtları',
    'ornekler',
    'örnekler',
    'kayit ornekleri',
    'kayıt örnekleri',
    'kayit ornegi',
    'kayıt örneği',
    'sample records',
    'sample entries',
    'record samples',
    'entry samples',
    'examples',
    'muhasebe kayitlari',
    'muhasebe kayıtları',
    'muhasebe ornekleri',
    'muhasebe örnekleri',
    'yevmiye kayitlari',
    'yevmiye kayıtları',
    'yevmiye ornekleri',
    'yevmiye örnekleri',
    'defter kayitlari',
    'defter kayıtları',
    'defter ornekleri',
    'defter örnekleri',
    'accounting records',
    'accounting entries',
    'journal entries',
    'ledger entries',
    'bookkeeping records',
    'bookkeeping entries',
    // Numaralı başlıklar
    '4.1.13',
    '13. x islemi',
    '13.1 x islemi',
    '14. x islemi',
    '14.1 x islemi',
    '15. x islemi',
    '15.1 x islemi',
    '13. ornek',
    '13.1 ornek',
    '14. ornek',
    '14.1 ornek',
    '13. kayit',
    '13.1 kayit',
    '14. kayit',
    '14.1 kayit',
    '16. x islemi',
    '16.1 x islemi',
    '17. x islemi',
    '17.1 x islemi',
    // İlişkili terimler
    'x islemi kayit sablonu',
    'x işlemi kayıt şablonu',
    'x islemi ornegi',
    'x işlemi örneği',
    'x islemi template',
    'x işlemi template',
    'x kayit sablonu',
    'x kayıt şablonu',
    'x ornegi',
    'x örneği',
    'x template',
    'x record template',
    'x entry template',
    'kayit sablonu',
    'kayıt şablonu',
    'record template',
    'entry template',
    'template'
  ];
  
  console.log('🔍 X İŞLEMİ ÖRNEK KAYITLAR METNİ: Başlık aranıyor...', searchTerms.length, 'terim');
  
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
        console.log(`🎯 X İŞLEMİ ÖRNEK KAYITLAR METNİ BAŞLIK BULUNDU: "${text}" (term: ${term})`);
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
      
      // Eğer x işlemi örnek kayıtlar terimleri içeriyorsa özel işaretle
      if ((normalized.includes('x') && normalized.includes('ornek') && normalized.includes('kayit')) ||
          (normalized.includes('x') && normalized.includes('sample') && normalized.includes('record'))) {
        console.log(`🔎 İLGİNÇ: Element ${i + 1} potansiyel terim içeriyor: "${text}"`);
      }
    }
    
    for (const term of searchTerms) {
      if (normalized.includes(term) && text.length < 150) { // Kısa başlık benzeri metinler
        console.log(`🎯 X İŞLEMİ ÖRNEK KAYITLAR METNİ ELEMENT BULUNDU: "${text}" (term: ${term})`);
        return element;
      }
    }
  }
  
  console.log('❌ X İŞLEMİ ÖRNEK KAYITLAR METNİ başlığı bulunamadı');
  return null;
}

// Başlık sonrası içeriği topla
function extractContentAfterHeader(doc: Document, headerElement: Element): string {
  console.log('📝 X İŞLEMİ ÖRNEK KAYITLAR METNİ: Başlık altındaki içerik toplaniyor...');
  
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
      console.log(`🚫 Tablo atlandı (X İşlemi Örnek Kayıtlar tablolarını geç)`);
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
  console.log(`✅ X İŞLEMİ ÖRNEK KAYITLAR METNİ SONUÇ: ${content.length} paragraf, ${result.length} karakter`);
  return result;
}

// SCAN mode: Dokümanı tara ve skorla
function scanForXIslemiOrnekKayitlarTextContent(doc: Document): string {
  console.log('🔍 SCAN Mode: X İşlemi Örnek Kayıtlar Metni aranıyor...');
  
  const keywords = [
    // ÇOK YÜKSEK öncelik - X İşlemi Örnek Kayıtlar spesifik
    'x islemi ornek kayitlar', 'x işlemi örnek kayıtlar', 'x islemi ornek kayitlari', 'x işlemi örnek kayıtları',
    'x islemi ornekler', 'x işlemi örnekler', 'x islemi kayit ornekleri', 'x işlemi kayıt örnekleri',
    'x islemi kayit ornegi', 'x işlemi kayıt örneği', 'x ornek kayitlar', 'x örnek kayıtlar',
    'x ornek kayitlari', 'x örnek kayıtları', 'x ornekler', 'x örnekler',
    'x kayit ornekleri', 'x kayıt örnekleri', 'x kayit ornegi', 'x kayıt örneği',
    'x sample records', 'x sample entries', 'x record samples', 'x entry samples', 'x examples',
    // YÜKSEK öncelik - X İşlemi + Kayıt + Örnek
    'x islemi kayit ornek', 'x işlemi kayıt örnek', 'x islemi ornek kayit', 'x işlemi örnek kayıt',
    'x kayit ornek', 'x kayıt örnek', 'x ornek kayit', 'x örnek kayıt',
    'x record example', 'x example record', 'x entry example', 'x example entry',
    // YÜKSEK öncelik - X İşlemi Muhasebe Kayıtları/Örnekleri
    'x islemi muhasebe kayitlari', 'x işlemi muhasebe kayıtları', 'x islemi muhasebe ornekleri',
    'x işlemi muhasebe örnekleri', 'x islemi yevmiye kayitlari', 'x işlemi yevmiye kayıtları',
    'x islemi yevmiye ornekleri', 'x işlemi yevmiye örnekleri', 'x islemi defter kayitlari',
    'x işlemi defter kayıtları', 'x islemi defter ornekleri', 'x işlemi defter örnekleri',
    'x muhasebe kayitlari', 'x muhasebe kayıtları', 'x muhasebe ornekleri', 'x muhasebe örnekleri',
    'x yevmiye kayitlari', 'x yevmiye kayıtları', 'x yevmiye ornekleri', 'x yevmiye örnekleri',
    'x defter kayitlari', 'x defter kayıtları', 'x defter ornekleri', 'x defter örnekleri',
    'x accounting records', 'x accounting entries', 'x journal entries', 'x ledger entries',
    'x bookkeeping records', 'x bookkeeping entries',
    // ORTA-YÜKSEK öncelik - X İşlemi Borç/Alacak
    'x islemi borç alacak', 'x işlemi borç alacak', 'x islemi borc alacak', 'x işlemi borç alacak',
    'x islemi debit credit', 'x işlemi debit credit', 'x borç alacak', 'x borç alacak',
    'x borc alacak', 'x debit credit', 'x debit credit',
    // ORTA-YÜKSEK öncelik - X İşlemi Hesap Kayıtları
    'x islemi hesap kayitlari', 'x işlemi hesap kayıtları', 'x islemi hesap ornekleri',
    'x işlemi hesap örnekleri', 'x hesap kayitlari', 'x hesap kayıtları',
    'x hesap ornekleri', 'x hesap örnekleri', 'x account records', 'x account entries', 'x account examples',
    // ORTA öncelik - X İşlemi şablon/template
    'x islemi kayit sablonu', 'x işlemi kayıt şablonu', 'x islemi ornegi', 'x işlemi örneği',
    'x islemi template', 'x işlemi template', 'x kayit sablonu', 'x kayıt şablonu',
    'x ornegi', 'x örneği', 'x template', 'x record template', 'x entry template',
    // ORTA öncelik - Genel kayıt örnekleri
    'ornek kayitlar', 'örnek kayıtlar', 'ornek kayitlari', 'örnek kayıtları',
    'ornekler', 'örnekler', 'kayit ornekleri', 'kayıt örnekleri', 'kayit ornegi', 'kayıt örneği',
    'sample records', 'sample entries', 'record samples', 'entry samples', 'examples',
    'muhasebe kayitlari', 'muhasebe kayıtları', 'muhasebe ornekleri', 'muhasebe örnekleri',
    'yevmiye kayitlari', 'yevmiye kayıtları', 'yevmiye ornekleri', 'yevmiye örnekleri',
    'defter kayitlari', 'defter kayıtları', 'defter ornekleri', 'defter örnekleri',
    'accounting records', 'accounting entries', 'journal entries', 'ledger entries',
    'bookkeeping records', 'bookkeeping entries',
    // DÜŞÜK öncelik - X işlemi terimleri
    'x islemi', 'x işlemi', 'x transaction', 'x islemi muhasebe', 'x işlemi muhasebe',
    'x muhasebe', 'x accounting', 'kayit sablonu', 'kayıt şablonu', 'record template',
    'entry template', 'template',
    // DÜŞÜK öncelik - Genel terimler
    'ornek', 'örnek', 'example', 'ornekler', 'örnekler', 'examples', 'kayit', 'kayıt',
    'record', 'entry', 'kayitlar', 'kayıtlar', 'records', 'entries', 'muhasebe', 'accounting',
    'yevmiye', 'journal', 'defter', 'ledger', 'hesap', 'account', 'sablon', 'şablon', 'template'
  ];
  
  const blacklistKeywords = [
    'içindekiler', 'contents', 'table', 'tablo', 'page', 'sayfa',
    'başlık', 'title', 'index', 'menu', 'bölüm', 'section',
    'fonksiyonel gereksinimler', 'fonksiyonel', 'functional requirements',
    'ekran gereksinimleri', 'screen requirements', 'ui requirements',
    'amaç ve kapsam', 'mevcut işleyiş', 'planlanan işleyiş',
    'gereksinimler', 'requirements', 'talep', 'değerlendirme',
    'doküman', 'document', 'tarihçe', 'history', 'x ekrani', 'x ekranı',
    'ekran tasarimlari', 'ekran tasarımları', 'ekran tasarim',
    'tasklar batchlar', 'tasklar batchler', 'task is akisi', 'task iş akışı',
    'conversion ve migration', 'conversion migration', 'donusum ve migrasyon',
    'diagram ve akislar', 'diagram ve akışlar', 'diagram akislar', 'diagram akışlar',
    // Diğer X İşlemi modal'larını ayır (ama örnek kayıtlar hariç)
    'x islemi vergi komisyon', 'x işlemi vergi komisyon', 'x islemi vergi ve komisyon',
    'x işlemi vergi ve komisyon', 'x vergi komisyon', 'x vergi ve komisyon',
    'x islemi kayit kurallari', 'x işlemi kayıt kuralları',
    'x islemi muhasebe deseni', 'x işlemi muhasebe deseni', /* ama örnek kayıtlar hariç */
    'x islemi muhasebe senaryolari', 'x işlemi muhasebe senaryoları', /* ama örnek kayıtlar hariç */
    // Spesifik olmayan X İşlemi Muhasebe terimlerini filtrele (sadece ana muhasebe)
    'genel muhasebe x', 'general accounting x', 'temel muhasebe x', 'basic accounting x',
    // Diğer modalların içerikleri
    'entegrasyonlar', 'mesajlar', 'parametreler', 'yetkilendirme',
    'veri kritikligi', 'veri kritikliği', 'paydaşlar', 'kabul kriterleri', 'onaylar',
    'case1', 'case 1', /* test vs. hariç ama örnek kayıtlar tamam */
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
    
    // Skorlama - X İşlemi Örnek Kayıtlar spesifik
    let score = 0;
    
    // Keyword puanları (X İşlemi Örnek Kayıtlar odaklı puanlama)
    for (const keyword of keywords) {
      const count = (normalized.match(new RegExp(keyword, 'g')) || []).length;
      
      // ÇOK YÜKSEK öncelik - X + Örnek + Kayıtlar kombinasyonu
      if (keyword.includes('x') && keyword.includes('ornek') && keyword.includes('kayit')) {
        score += count * 85; // En önemli - X İşlemi Örnek Kayıtlar
      } else if (keyword.includes('x') && keyword.includes('sample') && keyword.includes('record')) {
        score += count * 80; // X Sample Records
      }
      // YÜKSEK öncelik - X + Kayıt + Örnek
      else if (keyword.includes('x') && keyword.includes('kayit') && keyword.includes('ornek')) {
        score += count * 75; // X İşlemi Kayıt Örnek
      } else if (keyword.includes('x') && keyword.includes('record') && keyword.includes('example')) {
        score += count * 70; // X Record Example
      }
      // YÜKSEK öncelik - X + Muhasebe + Kayıtlar/Örnekler
      else if (keyword.includes('x') && keyword.includes('muhasebe') && (keyword.includes('kayit') || keyword.includes('ornek'))) {
        score += count * 70; // X İşlemi Muhasebe Kayıtları/Örnekleri
      } else if (keyword.includes('x') && keyword.includes('accounting') && (keyword.includes('record') || keyword.includes('entry'))) {
        score += count * 65; // X Accounting Records/Entries
      }
      // ORTA-YÜKSEK öncelik - X + Yevmiye/Defter + Kayıtlar/Örnekler
      else if (keyword.includes('x') && (keyword.includes('yevmiye') || keyword.includes('defter')) && (keyword.includes('kayit') || keyword.includes('ornek'))) {
        score += count * 65; // X İşlemi Yevmiye/Defter Kayıtları/Örnekleri
      } else if (keyword.includes('x') && (keyword.includes('journal') || keyword.includes('ledger')) && (keyword.includes('record') || keyword.includes('entry'))) {
        score += count * 60; // X Journal/Ledger Records/Entries
      }
      // ORTA öncelik - X + Hesap Kayıtları
      else if (keyword.includes('x') && keyword.includes('hesap') && keyword.includes('kayit')) {
        score += count * 60; // X İşlemi Hesap Kayıtları
      } else if (keyword.includes('x') && keyword.includes('account') && keyword.includes('record')) {
        score += count * 55; // X Account Records
      }
      // ORTA öncelik - X + Şablon/Template
      else if (keyword.includes('x') && (keyword.includes('sablon') || keyword.includes('template'))) {
        score += count * 55; // X İşlemi Şablon/Template
      }
      // ORTA öncelik - X + Muhasebe
      else if (keyword.includes('x') && keyword.includes('muhasebe')) {
        score += count * 50; // X İşlemi Muhasebe
      } else if (keyword.includes('x') && keyword.includes('accounting')) {
        score += count * 45; // X Accounting
      }
      // ORTA öncelik - Genel Örnek Kayıtlar
      else if (keyword.includes('ornek') && keyword.includes('kayit')) {
        score += count * 45; // Örnek Kayıtlar
      } else if (keyword.includes('sample') && keyword.includes('record')) {
        score += count * 40; // Sample Records
      }
      // DÜŞÜK öncelik - X İşlemi
      else if (keyword === 'x islemi' || keyword === 'x işlemi') {
        score += count * 35; // X İşlemi ana terim
      }
      // DÜŞÜK öncelik - Genel terimler
      else {
        score += count * 25; // Genel terimler
      }
    }
    
    // Uzunluk puanı
    score += Math.min(text.length / 20, 20);
    
    // Çok yüksek eşik - X İşlemi Örnek Kayıtlar için çok seçici
    if (score > 45) {
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
export async function parseXIslemiOrnekKayitlarTextFromDocx(file: File): Promise<XIslemiOrnekKayitlarTextParseResult> {
  console.log('🔍 DOCX X İşlemi Örnek Kayıtlar Metni Parse Başlıyor:', file.name);
  
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
    const headerElement = findXIslemiOrnekKayitlarTextHeader(doc);
    
    if (headerElement) {
      const content = extractContentAfterHeader(doc, headerElement);
      
      if (content && content.trim().length > 0) {
        console.log('📊 X İşlemi Örnek Kayıtlar Metni Parse Sonucu:', {
          found: true,
          mode: 'strict',
          contentLength: content.length,
          matchedLabels: ['X İşlemi Örnek Kayıtlar Metni'],
          errors: [],
          warnings: []
        });
        
        return {
          found: true,
          mode: 'strict',
          content: content.trim(),
          contentLength: content.length,
          matchedLabels: ['X İşlemi Örnek Kayıtlar Metni'],
          errors: [],
          warnings: []
        };
      }
    }
    
    // SCAN Mode: Dokümanı tara
    console.log('🔍 SCAN Mode: Alternatif arama başlıyor...');
    const scanContent = scanForXIslemiOrnekKayitlarTextContent(doc);
    
    if (scanContent && scanContent.trim().length > 0) {
      console.log('📊 X İşlemi Örnek Kayıtlar Metni Parse Sonucu (SCAN):', {
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
      errors: ['X İşlemi Örnek Kayıtlar Metni içeriği bulunamadı'],
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
