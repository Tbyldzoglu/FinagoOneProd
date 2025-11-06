/**
 * İK (İnsan Kaynakları) - Faz4 Sayfası
 * Personel Rapor Sistemi
 * 
 * Bu sayfa yöneticilerin personellere rapor tutmasını sağlar.
 * Her personel için detaylı değerlendirme formu bulunur.
 */

import React, { useState, useEffect } from 'react';
import '../styles/Faz4Page.css';
import authService from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_DATABASE_API_URL || 'http://localhost:3001';

interface Personel {
  id: number;
  ad: string;
  soyad: string;
  grup: string;
  pozisyon: string;
  iseBaslamaTarihi: string;
  aktif: boolean;
  olusturmaTarihi?: string;
  guncellemeTarihi?: string;
  ilkAyRaporDurumu?: string; // Backend'den gelen: 'bekleniyor' | 'tamamlandi' | 'gecikti'
  ikinciAyRaporDurumu?: string; // Backend'den gelen: 'bekleniyor' | 'tamamlandi' | 'gecikti'
  besinciAyRaporDurumu?: string; // Backend'den gelen: 'bekleniyor' | 'tamamlandi' | 'gecikti' | 'acik'
  sonStandartRaporTarihi?: string; // Son 6 aylık rapor tarihi (her 6 ayda bir kontrol için)
  sonrakiRaporTarihi?: string;
  sonrakiRaporTipi?: string;
  raporDurumu?: string; // Frontend'de hesaplanan durum: 'yeni' | 'guncel' | 'yaklasan' | 'gecikmis'
  calismaGunu?: number; // Backend'den gelen
}

interface Grup {
  adi: string;
  aciklama: string;
  personeller: Personel[];
  toplamRapor: number;
  gecikmisRapor: number;
  yaklasanRapor: number;
  guncelRapor: number;
  yeniPersonel: number;
  henuzBaslamadi: number;
}

interface Rapor {
  id: string;
  personelId: number; // string'den number'a değiştirildi
  yoneticiId: string;
  tarih: string;
  degerlendirme: {
    performans: number;
    isKalitesi: number;
    takimCalismasi: number;
    liderlik: number;
    ogrenme: number;
  };
  yorumlar: {
    gucluYonler: string;
    gelistirilmesiGerekenler: string;
    hedefler: string;
    genelYorum: string;
  };
  durum: 'taslak' | 'tamamlandi' | 'onaylandi';
}

interface IlkAyRaporu {
  id: string;
  personelId: number;
  tarih: string;
  denemeSuresiDegerlendirmesi: string;
  olumluIlenimler: string;
  olumsuzIlenimler: string;
  devamEtmeKarari: 'Evet' | 'Hayır';
  soru4_puan?: number;
  durum: 'taslak' | 'tamamlandi' | 'onaylandi';
}

interface IkinciAyRaporu {
  id: string;
  personelId: number;
  tarih: string;
  denemeSuresiDegerlendirmesi: string;
  olumluIlenimler: string;
  olumsuzIlenimler: string;
  devamEtmeKarari: 'Evet' | 'Hayır';
  soru4_puan?: number;
  durum: 'taslak' | 'tamamlandi' | 'onaylandi';
}

interface BesinciAyRaporu {
  id: string;
  personelId: number;
  tarih: string;
  performansDegerlendirmesi: string;
  gucluYonler: string;
  geliştirilmesiGerekenAlanlar: string;
  hedefler: string;
  genelPuan?: number;
  durum: 'taslak' | 'tamamlandi' | 'onaylandi';
}

interface StandartRaporu {
  id: string;
  personelId: number;
  tarih: string;
  raporDonemi: 'Ocak' | 'Ağustos';
  raporYili: number;
  soru1_deger_ureten_katkilar: string;
  soru1_puan?: number;
  soru2_ekip_iletisim_isbirligi: string;
  soru2_puan?: number;
  soru3_platform_veri_girisi: string;
  soru3_puan?: number;
  soru4_geri_bildirim_tutumu: string;
  soru4_puan?: number;
  soru5_problem_cozme_proaktivite: string;
  soru5_puan?: number;
  soru6_yenilikci_yaklasim: string;
  soru6_puan?: number;
  soru7_zamaninda_tamamlamada_basarı: string;
  soru7_puan?: number;
  soru8_gonullu_rol_alma_sorumluluk: string;
  soru8_puan?: number;
  soru9_farkli_ekiplerle_iletisim: string;
  soru9_puan?: number;
  genel_degerlendirme: string;
  genel_puan: number;
  durum: 'taslak' | 'tamamlandi' | 'onaylandi';
}

interface Faz4PageProps {
  onNavigate?: (page: string) => void;
}

const Faz4Page: React.FC<Faz4PageProps> = ({ onNavigate }) => {
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [gruplar, setGruplar] = useState<Grup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [selectedPersonel, setSelectedPersonel] = useState<Personel | null>(null);
  const [raporModalOpen, setRaporModalOpen] = useState(false);
  const [ilkAyRaporModalOpen, setIlkAyRaporModalOpen] = useState(false);
  const [ikinciAyRaporModalOpen, setIkinciAyRaporModalOpen] = useState(false);
  const [besinciAyRaporModalOpen, setBesinciAyRaporModalOpen] = useState(false);
  const [standartRaporModalOpen, setStandartRaporModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Rapor Hatırlatma Sistemi State'leri
  const [hatirlatmaPersoneller, setHatirlatmaPersoneller] = useState<any[]>([]);
  const [hatirlatmaLoading, setHatirlatmaLoading] = useState(false);
  const [mailGonderiyor, setMailGonderiyor] = useState(false);
  const [raporForm, setRaporForm] = useState<Rapor>({
    id: '',
    personelId: 0,
    yoneticiId: 'current-user',
    tarih: new Date().toISOString().split('T')[0],
    degerlendirme: {
      performans: 0,
      isKalitesi: 0,
      takimCalismasi: 0,
      liderlik: 0,
      ogrenme: 0
    },
    yorumlar: {
      gucluYonler: '',
      gelistirilmesiGerekenler: '',
      hedefler: '',
      genelYorum: ''
    },
    durum: 'taslak'
  });

  const [ilkAyRaporForm, setIlkAyRaporForm] = useState<IlkAyRaporu>({
    id: '',
    personelId: 0,
    tarih: new Date().toISOString().split('T')[0],
    denemeSuresiDegerlendirmesi: '',
    olumluIlenimler: '',
    olumsuzIlenimler: '',
    devamEtmeKarari: 'Evet',
    soru4_puan: undefined,
    durum: 'taslak'
  });
  const [ikinciAyRaporForm, setIkinciAyRaporForm] = useState<IkinciAyRaporu>({
    id: '',
    personelId: 0,
    tarih: new Date().toISOString().split('T')[0],
    denemeSuresiDegerlendirmesi: '',
    olumluIlenimler: '',
    olumsuzIlenimler: '',
    devamEtmeKarari: 'Evet',
    soru4_puan: undefined,
    durum: 'taslak'
  });

  const [besinciAyRaporForm, setBesinciAyRaporForm] = useState<BesinciAyRaporu>({
    id: '',
    personelId: 0,
    tarih: new Date().toISOString().split('T')[0],
    performansDegerlendirmesi: '',
    gucluYonler: '',
    geliştirilmesiGerekenAlanlar: '',
    hedefler: '',
    genelPuan: undefined,
    durum: 'taslak'
  });

  const [standartRaporForm, setStandartRaporForm] = useState<StandartRaporu>({
    id: '',
    personelId: 0,
    tarih: new Date().toISOString().split('T')[0],
    raporDonemi: 'Ocak',
    raporYili: new Date().getFullYear(),
    soru1_deger_ureten_katkilar: '',
    soru1_puan: undefined,
    soru2_ekip_iletisim_isbirligi: '',
    soru2_puan: undefined,
    soru3_platform_veri_girisi: '',
    soru3_puan: undefined,
    soru4_geri_bildirim_tutumu: '',
    soru4_puan: undefined,
    soru5_problem_cozme_proaktivite: '',
    soru5_puan: undefined,
    soru6_yenilikci_yaklasim: '',
    soru6_puan: undefined,
    soru7_zamaninda_tamamlamada_basarı: '',
    soru7_puan: undefined,
    soru8_gonullu_rol_alma_sorumluluk: '',
    soru8_puan: undefined,
    soru9_farkli_ekiplerle_iletisim: '',
    soru9_puan: undefined,
    genel_degerlendirme: '',
    genel_puan: 0,
    durum: 'taslak'
  });

  // Grup tanımları
  const grupTanımları = {
    'TBK': 'Temel Bankacılık',
    'KD': 'Krediler',
    'HDT': 'Hazine & Dış Ticaret',
    'DPC': 'Debit / Prepaid Card',
    'SPP': 'Sanal Post / PF',
    'AN': 'Analist',
    'AD': 'Android Developer',
    'ID': 'IOS Developer',
    'BBD': 'BOA Backend Developer'
  };

  // Pozisyon tanımları
  const pozisyonTanımları = {
    'D': 'Developer',
    'TM': 'Teknik Mimar',
    'A': 'Analist',
    'PM': 'Product Manager',
    'QA': 'Quality Assurance',
    'UX': 'UX Designer',
    'UI': 'UI Designer'
  };

  // Personelleri gruplara ayır
  const groupPersonnelByGrup = (personeller: Personel[]): Grup[] => {
    const grupMap = new Map<string, Personel[]>();
    
    personeller.forEach(personel => {
      const grupKey = personel.grup.toUpperCase();
      if (!grupMap.has(grupKey)) {
        grupMap.set(grupKey, []);
      }
      grupMap.get(grupKey)!.push(personel);
    });

    return Array.from(grupMap.entries()).map(([grupAdi, personeller]) => {
      const gecikmisRapor = personeller.filter(p => p.raporDurumu === 'gecikmis').length;
      const yaklasanRapor = personeller.filter(p => p.raporDurumu === 'yaklasan').length;
      const guncelRapor = personeller.filter(p => p.raporDurumu === 'guncel').length;
      const yeniPersonel = personeller.filter(p => p.raporDurumu === 'yeni').length;
      const henuzBaslamadi = personeller.filter(p => p.raporDurumu === 'henuz_baslamadi').length;
      
      return {
        adi: grupAdi,
        aciklama: grupTanımları[grupAdi as keyof typeof grupTanımları] || grupAdi,
        personeller,
        toplamRapor: personeller.length,
        gecikmisRapor,
        yaklasanRapor,
        guncelRapor,
        yeniPersonel,
        henuzBaslamadi
      };
    });
  };

  // ============================================
  // RAPOR HATIRLATMA SİSTEMİ FONKSİYONLARI
  // ============================================

  /**
   * Rapor zamanı gelen personelleri API'den yükler
   * İlk ay (30 gün) ve ikinci ay (60 gün) rapor zamanı gelen personeller
   */
  const fetchRaporHatirlatmalari = async () => {
    try {
      setHatirlatmaLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ Token bulunamadı, hatırlatmalar yüklenemedi');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/rapor-hatirlatmalari`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Rapor hatırlatmaları yüklenemedi');
      }

      const data = await response.json();
      
      if (data.success) {
        setHatirlatmaPersoneller(data.personeller || []);
        console.log('✅ Rapor hatırlatmaları yüklendi:', data.toplam, 'personel');
      }
    } catch (error) {
      console.error('❌ Rapor hatırlatmaları yükleme hatası:', error);
    } finally {
      setHatirlatmaLoading(false);
    }
  };

  /**
   * Seçili personeller için yöneticilere mail gönderir (n8n webhook)
   */
  const handleMailGonder = async (personeller: any[]) => {
    if (!personeller || personeller.length === 0) {
      alert('Mail gönderilecek personel bulunamadı!');
      return;
    }

    // Onay iste
    const confirm = window.confirm(
      `${personeller.length} personel için yöneticilerine mail gönderilecek. Devam etmek istiyor musunuz?`
    );

    if (!confirm) return;

    try {
      setMailGonderiyor(true);
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      // Her personel için yönetici maillerini hazırla
      const mailData = personeller.map(p => ({
        ad: p.ad,
        soyad: p.soyad,
        yoneticiMail: p.yoneticiler && p.yoneticiler.length > 0 
          ? p.yoneticiler[0].email 
          : 'yonetici-bulunamadi@firma.com',
        raporTipi: p.raporTipi,
        calismaGunu: p.calismaGunu,
        grupKodu: p.grupKodu,
        pozisyon: p.pozisyon,
        email: p.email || ''
      }));

      const response = await fetch(`${API_BASE_URL}/api/rapor-hatirlatmalari/gonder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ personeller: mailData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mail gönderimi başarısız');
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${personeller.length} personel için mail gönderimi başarıyla tamamlandı!`);
        // Listeyi yenile
        await fetchRaporHatirlatmalari();
      }
    } catch (error) {
      console.error('❌ Mail gönderimi hatası:', error);
      alert('Mail gönderimi sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setMailGonderiyor(false);
    }
  };

  // ============================================
  // PERSONEL VERİLERİNİ YÜKLEME
  // ============================================

  // API'den personel verilerini çek
  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/personel`, {
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Rapor durumlarını hesapla (backend'den gelen rapor durumlarını kullan)
        const personelWithStatus = data.map((person: Personel) => {
          const nextReportDate = calculateNextReportDate(person.iseBaslamaTarihi);
          const reportStatus = getReportStatus(
            nextReportDate, 
            person.iseBaslamaTarihi,
            person.ilkAyRaporDurumu,
            person.ikinciAyRaporDurumu,
            person.besinciAyRaporDurumu
          );
          
          console.log(`
            📊 ${person.ad} ${person.soyad}:
            Çalışma Günü: ${person.calismaGunu} gün
            İlk Ay Raporu: ${person.ilkAyRaporDurumu || 'bekleniyor'}
            İkinci Ay Raporu: ${person.ikinciAyRaporDurumu || 'bekleniyor'}
            5. Ay Raporu: ${person.besinciAyRaporDurumu || 'bekleniyor'}
            Rapor Durumu: ${reportStatus}
          `);
          
          return {
            ...person,
            sonrakiRaporTarihi: nextReportDate,
            raporDurumu: reportStatus
          };
        });
        
        setPersoneller(personelWithStatus);
        
        // Gruplara ayır
        const gruplar = groupPersonnelByGrup(personelWithStatus);
        setGruplar(gruplar);
      } else {
        throw new Error('Personel verileri çekilemedi');
      }
    } catch (err) {
      setError('API bağlantı hatası');
      console.error('Personel veri çekme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rapor süresi hesaplama fonksiyonları
  const calculateNextReportDate = (iseBaslamaTarihi: string): string => {
    const baslamaTarihi = new Date(iseBaslamaTarihi);
    const bugun = new Date();

    // İşe başlama tarihinden bugüne kadar geçen süre (gün cinsinden)
    const gunFarki = Math.floor((bugun.getTime() - baslamaTarihi.getTime()) / (1000 * 60 * 60 * 24));

    let nextReportDate;

    if (gunFarki < 30) {
      // 30 gün geçmemiş: İlk ay raporu (30. gün)
      nextReportDate = new Date(baslamaTarihi);
      nextReportDate.setDate(nextReportDate.getDate() + 30);
    } else if (gunFarki < 60) {
      // 30-60 gün arası: 2. ay raporu (60. gün)
      nextReportDate = new Date(baslamaTarihi);
      nextReportDate.setDate(nextReportDate.getDate() + 60);
    } else {
      // 60+ gün deneyim: 6 Aylık Performans Raporları (sadece Ocak ve Ağustos)
      const currentYear = bugun.getFullYear();
      const currentMonth = bugun.getMonth(); // 0-11 arası
      
      // Bu yılın Ocak (0) ve Ağustos (7) tarihleri
      const january = new Date(currentYear, 0, 1);
      const august = new Date(currentYear, 7, 1);
      
      // Gelecek yılın Ocak tarihi
      const nextJanuary = new Date(currentYear + 1, 0, 1);
      
      if (bugun < january) {
        nextReportDate = january;
      } else if (bugun < august) {
        nextReportDate = august;
      } else {
        nextReportDate = nextJanuary;
      }
    }

    return nextReportDate.toISOString().split('T')[0];
  };

  const getReportStatus = (
    sonrakiRaporTarihi: string, 
    iseBaslamaTarihi: string, 
    ilkAyRaporDurumu?: string,
    ikinciAyRaporDurumu?: string,
    besinciAyRaporDurumu?: string
  ): 'guncel' | 'yaklasan' | 'gecikmis' | 'yeni' | 'henuz_baslamadi' | 'acik' | 'birinci_ay_bekleniyor' => {
    const bugun = new Date();
    const raporTarihi = new Date(sonrakiRaporTarihi);
    const baslamaTarihi = new Date(iseBaslamaTarihi);
    const gunFarki = Math.ceil((raporTarihi.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
    
    // İşe başlama tarihinden bugüne kadar geçen süre (gün cinsinden)
    const deneyimGunu = Math.floor((bugun.getTime() - baslamaTarihi.getTime()) / (1000 * 60 * 60 * 24));
    
    // ÖNCELİK 0: Henüz işe başlamamış personeller (gelecek tarihli)
    if (ilkAyRaporDurumu === 'henuz_baslamadi' || ikinciAyRaporDurumu === 'henuz_baslamadi' || deneyimGunu < 0) {
      return 'henuz_baslamadi';
    }
    
    // ÖNCELİK 1: GECİKMİŞ RAPOR (Backend'den 'gecikti' geliyorsa)
    if (ilkAyRaporDurumu === 'gecikti' || ikinciAyRaporDurumu === 'gecikti' || besinciAyRaporDurumu === 'gecikti') {
      return 'gecikmis';
    }
    
    // ÖNCELİK 2: Rapor açık (doldurulabilir)
    if (ilkAyRaporDurumu === 'acik' || ikinciAyRaporDurumu === 'acik' || besinciAyRaporDurumu === 'acik') {
      return 'acik';
    }
    
    // ÖNCELİK 3: 2. ay raporu için 1. ay bekleniyor veya 5. ay için önceki raporlar bekleniyor
    if (ikinciAyRaporDurumu === 'birinci_ay_bekleniyor' || besinciAyRaporDurumu === 'onceki_raporlar_bekleniyor') {
      return 'birinci_ay_bekleniyor';
    }
    
    // ÖNCELİK 4: Yeni personeller (25 günden az çalışanlar)
    if (deneyimGunu < 25) {
      return 'yeni';
    }
    
    // ÖNCELİK 5: Sonraki rapor tarihine göre durum
    if (gunFarki < 0) return 'gecikmis';
    if (gunFarki <= 7) return 'yaklasan';
    if (gunFarki <= 30) return 'guncel';
    
    return 'guncel';
  };

  const getNextReportType = (iseBaslamaTarihi: string): string => {
    const baslamaTarihi = new Date(iseBaslamaTarihi);
    const bugun = new Date();

    // İşe başlama tarihinden bugüne kadar geçen süre (gün cinsinden)
    const deneyimGunu = Math.floor((bugun.getTime() - baslamaTarihi.getTime()) / (1000 * 60 * 60 * 24));

    if (deneyimGunu < 25) return 'yeni';
    if (deneyimGunu >= 25 && deneyimGunu <= 28) return 'ilkAy';
    if (deneyimGunu > 28 && deneyimGunu < 55) return 'bekleniyor';
    if (deneyimGunu >= 55 && deneyimGunu <= 58) return 'ikinciAy';
    return 'standart';
  };

  const getStatusColor = (durum: string): string => {
    switch (durum) {
      case 'acik':
        return '#10b981'; // Yeşil - Rapor açık, doldurulabilir
      case 'birinci_ay_bekleniyor':
        return '#f59e0b'; // Turuncu - 1. ay raporu önce doldurulmalı
      case 'gecikmis': return '#ef4444';
      case 'yaklasan': return '#f59e0b';
      case 'guncel': return '#10b981';
      case 'yeni': return '#3b82f6';
      case 'henuz_baslamadi': return '#8b5cf6';
      case 'bekliyor': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (durum: string): string => {
    switch (durum) {
      case 'acik': return 'Rapor Açık';
      case 'birinci_ay_bekleniyor': return '1. Ay Raporu Bekleniyor';
      case 'gecikmis': return 'Gecikmiş';
      case 'yaklasan': return 'Yaklaşan';
      case 'guncel': return 'Güncel';
      case 'yeni': return 'Yeni';
      case 'henuz_baslamadi': return 'Henüz Başlamadı';
      case 'bekliyor': return 'Bekliyor';
      default: return 'Bilinmiyor';
    }
  };

  // Grup açma/kapama fonksiyonu
  const toggleGroup = (grupAdi: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(grupAdi)) {
        newSet.delete(grupAdi);
      } else {
        newSet.add(grupAdi);
      }
      return newSet;
    });
  };

  // Tüm grupları aç/kapat
  const toggleAllGroups = () => {
    if (expandedGroups.size === gruplar.length) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(gruplar.map(g => g.adi)));
    }
  };

  // Component mount olduğunda verileri çek
  useEffect(() => {
    // Yetki kontrolü yap
    const permission = authService.canAccessFaz4();
    setHasPermission(permission);
    
    if (permission) {
      fetchPersonnel();
      fetchRaporHatirlatmalari(); // Rapor hatırlatmalarını da yükle
    } else {
      setError('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
      setLoading(false);
    }
  }, []);

  const handlePersonelClick = (personel: Personel) => {
    setSelectedPersonel(personel);
    
    // Rapor tipini belirle - İşe başlama tarihinden bugüne kadar geçen gün sayısı
    const iseBaslamaTarihi = new Date(personel.iseBaslamaTarihi);
    const bugun = new Date();
    const deneyimGunu = Math.floor((bugun.getTime() - iseBaslamaTarihi.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`
      🔍 Rapor Tipi Belirleme:
      Personel: ${personel.ad} ${personel.soyad}
      İşe Başlama: ${personel.iseBaslamaTarihi}
      Bugün: ${bugun.toISOString().split('T')[0]}
      Çalışma Günü: ${deneyimGunu} gün
      1. Ay Rapor Durumu: ${personel.ilkAyRaporDurumu}
      2. Ay Rapor Durumu: ${personel.ikinciAyRaporDurumu}
      5. Ay Rapor Durumu: ${personel.besinciAyRaporDurumu}
    `);
    
    // Henüz rapor zamanı gelmedi
    if (deneyimGunu < 25) {
      alert(`ℹ️ ${personel.ad} ${personel.soyad} henüz yeni personel. 1. ay raporu için ${25 - deneyimGunu} gün kaldı.`);
      return;
    }
    
    // 1. AY RAPORU: 25. günden itibaren açık (25-28 gün açık, 29+ gün gecikmiş ama hala doldurulabilir)
    if (deneyimGunu >= 25 && personel.ilkAyRaporDurumu !== 'tamamlandi') {
      const durum = deneyimGunu <= 28 ? 'açık' : 'gecikmiş';
      const kalanGun = 28 - deneyimGunu;
      
      console.log(`✅ 1. AY RAPORU açılıyor (${deneyimGunu}. gün - ${durum})`);
      setIlkAyRaporForm(prev => ({
        ...prev,
        personelId: personel.id,
        tarih: new Date().toISOString().split('T')[0]
      }));
      setIlkAyRaporModalOpen(true);
      
      // Uyarı mesajları - Backend'den gelen rapor durumuna göre
      // Backend 'acik' veya 'gecikti' durumunda uyarı göster
      if (personel.ilkAyRaporDurumu === 'gecikti' && deneyimGunu > 28) {
        alert(`⚠️ 1. Ay Raporu GECİKMİŞ!\n\nRapor doldurma süresi ${deneyimGunu - 28} gün önce dolmuştur.\nLütfen hemen doldurunuz!`);
      } else if (personel.ilkAyRaporDurumu === 'acik' && kalanGun <= 1) {
        alert(`🔴 1. Ay Raporu: SON GÜN! Bugün bu raporu doldurmanız gerekmektedir!`);
      } else if (personel.ilkAyRaporDurumu === 'acik' && kalanGun <= 2) {
        alert(`⚠️ 1. Ay Raporu: ${kalanGun} gün kaldı! Lütfen en kısa sürede doldurunuz.`);
      }
      return;
    }
    
    // 2. AY RAPORU: 55. günden itibaren açık AMA 1. ay raporu doldurulmuşsa (55-58 gün açık, 59+ gün gecikmiş)
    if (deneyimGunu >= 55 && personel.ikinciAyRaporDurumu !== 'tamamlandi') {
      // Önce 1. ay raporu kontrolü
      if (personel.ilkAyRaporDurumu !== 'tamamlandi') {
        alert(`❌ 2. Ay raporu için önce 1. Ay raporunu doldurmanız gerekmektedir!\n\n1. Ay raporunu doldurmak için personele tıklayın.`);
        return;
      }
      
      // 1. ay doldurulmuş, 2. ay açık
      const durum = deneyimGunu <= 58 ? 'açık' : 'gecikmiş';
      const kalanGun = 58 - deneyimGunu;
      
      console.log(`✅ 2. AY RAPORU açılıyor (${deneyimGunu}. gün - ${durum})`);
      setIkinciAyRaporForm(prev => ({
        ...prev,
        personelId: personel.id,
        tarih: new Date().toISOString().split('T')[0]
      }));
      setIkinciAyRaporModalOpen(true);
      
      // Uyarı mesajları - Backend'den gelen rapor durumuna göre
      if (personel.ikinciAyRaporDurumu === 'gecikti' && deneyimGunu > 58) {
        alert(`⚠️ 2. Ay Raporu GECİKMİŞ!\n\nRapor doldurma süresi ${deneyimGunu - 58} gün önce dolmuştur.\nLütfen hemen doldurunuz!`);
      } else if (personel.ikinciAyRaporDurumu === 'acik' && kalanGun <= 1) {
        alert(`🔴 2. Ay Raporu: SON GÜN! Bugün bu raporu doldurmanız gerekmektedir!`);
      } else if (personel.ikinciAyRaporDurumu === 'acik' && kalanGun <= 2) {
        alert(`⚠️ 2. Ay Raporu: ${kalanGun} gün kaldı! Lütfen en kısa sürede doldurunuz.`);
      }
      return;
    }
    
    // 5. AY RAPORU: 140. günden itibaren açık AMA 1. ve 2. ay raporları doldurulmuşsa (140-145 gün açık, 146+ gün gecikmiş)
    if (deneyimGunu >= 140 && personel.besinciAyRaporDurumu !== 'tamamlandi') {
      // Önce 1. ve 2. ay raporu kontrolü
      if (personel.ilkAyRaporDurumu !== 'tamamlandi' || personel.ikinciAyRaporDurumu !== 'tamamlandi') {
        alert(`❌ 5. Ay raporu için önce 1. ve 2. Ay raporlarını doldurmanız gerekmektedir!\n\nLütfen önce önceki raporları tamamlayın.`);
        return;
      }
      
      // Önceki raporlar doldurulmuş, 5. ay açık
      const durum = deneyimGunu <= 145 ? 'açık' : 'gecikmiş';
      const kalanGun = 145 - deneyimGunu;
      
      console.log(`✅ 5. AY RAPORU açılıyor (${deneyimGunu}. gün - ${durum})`);
      setBesinciAyRaporForm(prev => ({
        ...prev,
        personelId: personel.id,
        tarih: new Date().toISOString().split('T')[0]
      }));
      setBesinciAyRaporModalOpen(true);
      
      // Uyarı mesajları - Backend'den gelen rapor durumuna göre
      if (personel.besinciAyRaporDurumu === 'gecikti' && deneyimGunu > 145) {
        alert(`⚠️ 5. Ay Raporu GECİKMİŞ!\n\nRapor doldurma süresi ${deneyimGunu - 145} gün önce dolmuştur.\nLütfen hemen doldurunuz!`);
      } else if (personel.besinciAyRaporDurumu === 'acik' && kalanGun <= 1) {
        alert(`🔴 5. Ay Raporu: SON GÜN! Bugün bu raporu doldurmanız gerekmektedir!`);
      } else if (personel.besinciAyRaporDurumu === 'acik' && kalanGun <= 3) {
        alert(`⚠️ 5. Ay Raporu: ${kalanGun} gün kaldı! Lütfen en kısa sürede doldurunuz.`);
      }
      return;
    }
    
    // 1. ve 2. ay arası bekleme süresi
    if (deneyimGunu >= 29 && deneyimGunu < 55 && personel.ilkAyRaporDurumu === 'tamamlandi') {
      alert(`ℹ️ 1. Ay raporu tamamlandı. 2. Ay raporu için ${55 - deneyimGunu} gün kaldı.\n\n📅 2. ay raporu 55. günde açılacak (5. ayın dolmasına 10 gün kala)`);
      return;
    }
    
    // 2. ve 5. ay arası bekleme süresi
    if (deneyimGunu >= 59 && deneyimGunu < 140 && personel.ikinciAyRaporDurumu === 'tamamlandi') {
      alert(`ℹ️ 2. Ay raporu tamamlandı. 5. Ay raporu için ${140 - deneyimGunu} gün kaldı.\n\n📅 5. ay raporu 140. günde açılacak (5. ayın dolmasına 10 gün kala)`);
      return;
    }
    
    // 5. ay ve 6 aylık arası bekleme süresi
    if (deneyimGunu >= 146 && deneyimGunu < 180 && personel.besinciAyRaporDurumu === 'tamamlandi') {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentDay = currentDate.getDate();
      
      let siradakiDonem: string;
      if (currentMonth === 0 && currentDay < 21) {
        siradakiDonem = 'Ocak (21 Ocak\'tan itibaren)';
      } else if (currentMonth < 7) {
        siradakiDonem = 'Ağustos (21 Ağustos\'tan itibaren)';
      } else if (currentMonth === 7 && currentDay < 21) {
        siradakiDonem = 'Ağustos (21 Ağustos\'tan itibaren)';
      } else {
        siradakiDonem = 'Ocak (21 Ocak\'tan itibaren)';
      }
      
      alert(`ℹ️ 5. Ay raporu tamamlandı. 6 Aylık Performans Raporu için ${180 - deneyimGunu} gün kaldı.\n\n📅 6 aylık rapor her ayın son 10 gününde açılır.\nSıradaki dönem: ${siradakiDonem}`);
      return;
    }
    
    // 6 Aylık Performans Raporu (180+ gün ve önceki raporlar tamamlandıysa)
    // Her 6 ayda bir tekrar eder (Ocak ve Ağustos'un son 10 günü)
    if (deneyimGunu >= 180) {
      // İlk rapor için: Önceki raporların kontrolü
      if (personel.ilkAyRaporDurumu !== 'tamamlandi') {
        alert(`❌ 6 Aylık Performans Raporu için önce 1. Ay raporunu doldurmanız gerekmektedir!`);
        return;
      }
      if (personel.ikinciAyRaporDurumu !== 'tamamlandi') {
        alert(`❌ 6 Aylık Performans Raporu için önce 2. Ay raporunu doldurmanız gerekmektedir!`);
        return;
      }
      if (personel.besinciAyRaporDurumu !== 'tamamlandi') {
        alert(`❌ 6 Aylık Performans Raporu için önce 1., 2. ve 5. Ay raporlarını doldurmanız gerekmektedir!`);
        return;
      }
      
      // Şu anki ay ve gün kontrolü - Her ayın 21'inden itibaren o ayın raporu açılır (10 gün önceden)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-11 arası
      const currentDay = currentDate.getDate(); // 1-31 arası
      const currentYear = currentDate.getFullYear();
      
      let isRaporAcik = false;
      let raporDonemi: 'Ocak' | 'Ağustos' = 'Ocak'; // Default değer
      
      // Ocak raporu: Ocak 21-31 (son 10 gün)
      if (currentMonth === 0 && currentDay >= 21) {
        raporDonemi = 'Ocak';
        isRaporAcik = true;
      }
      // Ağustos raporu: Ağustos 21-31 (son 10 gün)
      else if (currentMonth === 7 && currentDay >= 21) {
        raporDonemi = 'Ağustos';
        isRaporAcik = true;
      }
      // Şu anki dönemi belirle (rapor açık olmasa bile)
      else {
        // Şu an hangi döneme daha yakınız?
        if (currentMonth < 7) {
          raporDonemi = 'Ağustos'; // Sonraki dönem Ağustos
        } else {
          raporDonemi = 'Ocak'; // Sonraki dönem Ocak
        }
      }
      
      if (!isRaporAcik) {
        // Sıradaki rapor dönemini hesapla
        let siradakiDonem: string;
        if (currentMonth === 0 && currentDay < 21) {
          siradakiDonem = 'Ocak (21 Ocak\'tan itibaren)';
        } else if (currentMonth < 7) {
          siradakiDonem = 'Ağustos (21 Ağustos\'tan itibaren)';
        } else if (currentMonth === 7 && currentDay < 21) {
          siradakiDonem = 'Ağustos (21 Ağustos\'tan itibaren)';
        } else {
          siradakiDonem = 'Ocak (21 Ocak\'tan itibaren)';
        }
        alert(`ℹ️ 6 Aylık Performans Raporu sadece her ayın son 10 günü doldurulabilir.\n\nSıradaki rapor dönemi: ${siradakiDonem}`);
        return;
      }
      
      // Son 6 aylık rapor tarihinden 6 ay geçti mi kontrol et
      if (personel.sonStandartRaporTarihi) {
        const sonRaporTarihi = new Date(personel.sonStandartRaporTarihi);
        const ayFarki = (currentDate.getTime() - sonRaporTarihi.getTime()) / (1000 * 60 * 60 * 24 * 30); // Yaklaşık ay cinsinden
        
        if (ayFarki < 6) {
          const kalanAy = Math.ceil(6 - ayFarki);
          const siradakiDonem = raporDonemi === 'Ocak' ? 'Ağustos' : 'Ocak';
          alert(`ℹ️ Son 6 Aylık Performans Raporu ${new Date(personel.sonStandartRaporTarihi).toLocaleDateString('tr-TR')} tarihinde dolduruldu.\n\nYeni rapor için ${kalanAy} ay daha beklemeniz gerekmektedir.\nSıradaki dönem: ${siradakiDonem}`);
          return;
        }
      }
      
      console.log('✅ 6 AYLIK PERFORMANS RAPORU açılıyor');
      
      setStandartRaporForm(prev => ({
        ...prev,
        personelId: personel.id,
        tarih: new Date().toISOString().split('T')[0],
        raporDonemi: raporDonemi as 'Ocak' | 'Ağustos',
        raporYili: currentYear
      }));
      setStandartRaporModalOpen(true);
      return;
    }
    
    // Hiçbir rapor zamanı gelmemişse
    alert(`ℹ️ ${personel.ad} ${personel.soyad} için şu anda doldurulabilir bir rapor yok.\n\nRapor zamanı geldiğinde bildirim alacaksınız.`);
  };

  const handleRaporKaydet = async () => {
    try {
      console.log('Rapor kaydediliyor:', raporForm);
      
      // PersonelRaporlari tablosuna kaydet
      const raporData = {
        personelId: raporForm.personelId,
        yoneticiId: raporForm.yoneticiId,
        raporTarihi: raporForm.tarih,
        performans: raporForm.degerlendirme.performans,
        isKalitesi: raporForm.degerlendirme.isKalitesi,
        takimCalismasi: raporForm.degerlendirme.takimCalismasi,
        liderlik: raporForm.degerlendirme.liderlik,
        ogrenme: raporForm.degerlendirme.ogrenme,
        gucluYonler: raporForm.yorumlar.gucluYonler,
        gelistirilmesiGerekenler: raporForm.yorumlar.gelistirilmesiGerekenler,
        hedefler: raporForm.yorumlar.hedefler,
        genelYorum: raporForm.yorumlar.genelYorum,
        raporDurumu: raporForm.durum
      };

      const response = await fetch(`${API_BASE_URL}/api/personel-raporlari`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(raporData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Rapor başarıyla kaydedildi:', result);
        
        setRaporModalOpen(false);
        setSelectedPersonel(null);
        
        // Personel listesini yenile
        fetchPersonnel();
        
        alert('Rapor başarıyla kaydedildi!');
      } else {
        throw new Error('Rapor kaydedilemedi');
      }
    } catch (error) {
      console.error('Rapor kaydetme hatası:', error);
      alert('Rapor kaydedilirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleIlkAyRaporKaydet = async () => {
    try {
      // Validasyon kontrolleri
      if (!ilkAyRaporForm.denemeSuresiDegerlendirmesi || ilkAyRaporForm.denemeSuresiDegerlendirmesi.trim() === '') {
        alert('Lütfen "Deneme süresi değerlendirmesi" alanını doldurunuz!');
        return;
      }
      if (!ilkAyRaporForm.olumluIlenimler || ilkAyRaporForm.olumluIlenimler.trim() === '') {
        alert('Lütfen "Olumlu izlenimler" alanını doldurunuz!');
        return;
      }
      if (!ilkAyRaporForm.olumsuzIlenimler || ilkAyRaporForm.olumsuzIlenimler.trim() === '') {
        alert('Lütfen "Olumsuz izlenimler" alanını doldurunuz!');
        return;
      }
      if (!ilkAyRaporForm.devamEtmeKarari || ilkAyRaporForm.devamEtmeKarari.trim() === '') {
        alert('Lütfen "Devam etme kararı" alanını doldurunuz!');
        return;
      }
      if (!ilkAyRaporForm.soru4_puan || ilkAyRaporForm.soru4_puan < 1 || ilkAyRaporForm.soru4_puan > 5) {
        alert('Lütfen "Devam etme kararı puanı" seçiniz (1-5 arası)!');
        return;
      }
      
      console.log('İlk ay raporu kaydediliyor:', ilkAyRaporForm);
      
      const response = await fetch(`${API_BASE_URL}/api/ilk-ay-raporu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          personelId: ilkAyRaporForm.personelId,
          raporTarihi: ilkAyRaporForm.tarih,
          denemeSuresiDegerlendirmesi: ilkAyRaporForm.denemeSuresiDegerlendirmesi,
          olumluIlenimler: ilkAyRaporForm.olumluIlenimler,
          olumsuzIlenimler: ilkAyRaporForm.olumsuzIlenimler,
          devamEtmeKarari: ilkAyRaporForm.devamEtmeKarari,
          soru4_puan: ilkAyRaporForm.soru4_puan,
          durum: ilkAyRaporForm.durum
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('İlk ay raporu başarıyla kaydedildi:', result);
        
        setIlkAyRaporModalOpen(false);
        setSelectedPersonel(null);
        
        // Personel listesini yenile
        fetchPersonnel();
        
        alert('İlk ay raporu başarıyla kaydedildi!');
      } else {
        throw new Error('İlk ay raporu kaydedilemedi');
      }
    } catch (error) {
      console.error('İlk ay raporu kaydetme hatası:', error);
      alert('İlk ay raporu kaydedilirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleDegerlendirmeChange = (alan: string, deger: number) => {
    setRaporForm(prev => ({
      ...prev,
      degerlendirme: {
        ...prev.degerlendirme,
        [alan]: deger
      }
    }));
  };

  const handleYorumChange = (alan: string, deger: string) => {
    setRaporForm(prev => ({
      ...prev,
      yorumlar: {
        ...prev.yorumlar,
        [alan]: deger
      }
    }));
  };

  const handleIlkAyRaporChange = (alan: keyof IlkAyRaporu, deger: string | number | undefined) => {
    setIlkAyRaporForm(prev => ({
      ...prev,
      [alan]: deger
    }));
  };

  const handleIkinciAyRaporKaydet = async () => {
    try {
      // Validasyon kontrolleri
      if (!ikinciAyRaporForm.denemeSuresiDegerlendirmesi || ikinciAyRaporForm.denemeSuresiDegerlendirmesi.trim() === '') {
        alert('Lütfen "Deneme süresi değerlendirmesi" alanını doldurunuz!');
        return;
      }
      if (!ikinciAyRaporForm.olumluIlenimler || ikinciAyRaporForm.olumluIlenimler.trim() === '') {
        alert('Lütfen "Olumlu izlenimler" alanını doldurunuz!');
        return;
      }
      if (!ikinciAyRaporForm.olumsuzIlenimler || ikinciAyRaporForm.olumsuzIlenimler.trim() === '') {
        alert('Lütfen "Olumsuz izlenimler" alanını doldurunuz!');
        return;
      }
      if (!ikinciAyRaporForm.devamEtmeKarari || ikinciAyRaporForm.devamEtmeKarari.trim() === '') {
        alert('Lütfen "Devam etme kararı" alanını doldurunuz!');
        return;
      }
      if (!ikinciAyRaporForm.soru4_puan || ikinciAyRaporForm.soru4_puan < 1 || ikinciAyRaporForm.soru4_puan > 5) {
        alert('Lütfen "Devam etme kararı puanı" seçiniz (1-5 arası)!');
        return;
      }
      
      console.log('İkinci ay raporu kaydediliyor:', ikinciAyRaporForm);
      
      const response = await fetch(`${API_BASE_URL}/api/ikinci-ay-raporu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          personelId: ikinciAyRaporForm.personelId,
          raporTarihi: ikinciAyRaporForm.tarih,
          denemeSuresiDegerlendirmesi: ikinciAyRaporForm.denemeSuresiDegerlendirmesi,
          olumluIlenimler: ikinciAyRaporForm.olumluIlenimler,
          olumsuzIlenimler: ikinciAyRaporForm.olumsuzIlenimler,
          devamEtmeKarari: ikinciAyRaporForm.devamEtmeKarari,
          soru4_puan: ikinciAyRaporForm.soru4_puan,
          durum: ikinciAyRaporForm.durum
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('İkinci ay raporu başarıyla kaydedildi:', result);
        
        setIkinciAyRaporModalOpen(false);
        setSelectedPersonel(null);
        
        // Personel listesini yenile
        fetchPersonnel();
        
        alert('İkinci ay raporu başarıyla kaydedildi!');
      } else {
        throw new Error('Rapor kaydedilemedi');
      }
    } catch (error) {
      console.error('İkinci ay raporu kaydetme hatası:', error);
      alert('İkinci ay raporu kaydedilirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleIkinciAyRaporChange = (alan: keyof IkinciAyRaporu, deger: string | number | undefined) => {
    setIkinciAyRaporForm(prev => ({
      ...prev,
      [alan]: deger
    }));
  };

  const handleStandartRaporKaydet = async () => {
    try {
      // Validasyon kontrolleri
      const validationErrors: string[] = [];
      
      if (!standartRaporForm.soru1_deger_ureten_katkilar || standartRaporForm.soru1_deger_ureten_katkilar.trim() === '') {
        validationErrors.push('1. Değer Üreten Katkılar');
      }
      if (!standartRaporForm.soru1_puan || standartRaporForm.soru1_puan < 1 || standartRaporForm.soru1_puan > 5) {
        validationErrors.push('1. Soru Puanı');
      }
      
      if (!standartRaporForm.soru2_ekip_iletisim_isbirligi || standartRaporForm.soru2_ekip_iletisim_isbirligi.trim() === '') {
        validationErrors.push('2. Ekip İletişimi ve İş Birliği');
      }
      if (!standartRaporForm.soru2_puan || standartRaporForm.soru2_puan < 1 || standartRaporForm.soru2_puan > 5) {
        validationErrors.push('2. Soru Puanı');
      }
      
      if (!standartRaporForm.soru3_platform_veri_girisi || standartRaporForm.soru3_platform_veri_girisi.trim() === '') {
        validationErrors.push('3. Platform Veri Girişi');
      }
      if (!standartRaporForm.soru3_puan || standartRaporForm.soru3_puan < 1 || standartRaporForm.soru3_puan > 5) {
        validationErrors.push('3. Soru Puanı');
      }
      
      if (!standartRaporForm.soru4_geri_bildirim_tutumu || standartRaporForm.soru4_geri_bildirim_tutumu.trim() === '') {
        validationErrors.push('4. Geri Bildirim Tutumu');
      }
      if (!standartRaporForm.soru4_puan || standartRaporForm.soru4_puan < 1 || standartRaporForm.soru4_puan > 5) {
        validationErrors.push('4. Soru Puanı');
      }
      
      if (!standartRaporForm.soru5_problem_cozme_proaktivite || standartRaporForm.soru5_problem_cozme_proaktivite.trim() === '') {
        validationErrors.push('5. Problem Çözme Proaktivitesi');
      }
      if (!standartRaporForm.soru5_puan || standartRaporForm.soru5_puan < 1 || standartRaporForm.soru5_puan > 5) {
        validationErrors.push('5. Soru Puanı');
      }
      
      if (!standartRaporForm.soru6_yenilikci_yaklasim || standartRaporForm.soru6_yenilikci_yaklasim.trim() === '') {
        validationErrors.push('6. Yenilikçi Yaklaşım');
      }
      if (!standartRaporForm.soru6_puan || standartRaporForm.soru6_puan < 1 || standartRaporForm.soru6_puan > 5) {
        validationErrors.push('6. Soru Puanı');
      }
      
      if (!standartRaporForm.soru7_zamaninda_tamamlamada_basarı || standartRaporForm.soru7_zamaninda_tamamlamada_basarı.trim() === '') {
        validationErrors.push('7. Zamanında Tamamlamada Başarı');
      }
      if (!standartRaporForm.soru7_puan || standartRaporForm.soru7_puan < 1 || standartRaporForm.soru7_puan > 5) {
        validationErrors.push('7. Soru Puanı');
      }
      
      if (!standartRaporForm.soru8_gonullu_rol_alma_sorumluluk || standartRaporForm.soru8_gonullu_rol_alma_sorumluluk.trim() === '') {
        validationErrors.push('8. Gönüllü Rol Alma Sorumluluk');
      }
      if (!standartRaporForm.soru8_puan || standartRaporForm.soru8_puan < 1 || standartRaporForm.soru8_puan > 5) {
        validationErrors.push('8. Soru Puanı');
      }
      
      if (!standartRaporForm.soru9_farkli_ekiplerle_iletisim || standartRaporForm.soru9_farkli_ekiplerle_iletisim.trim() === '') {
        validationErrors.push('9. Farklı Ekiplerle İletişim');
      }
      if (!standartRaporForm.soru9_puan || standartRaporForm.soru9_puan < 1 || standartRaporForm.soru9_puan > 5) {
        validationErrors.push('9. Soru Puanı');
      }
      
      if (!standartRaporForm.genel_degerlendirme || standartRaporForm.genel_degerlendirme.trim() === '') {
        validationErrors.push('Genel Değerlendirme');
      }
      
      if (validationErrors.length > 0) {
        alert('Lütfen aşağıdaki alanları doldurunuz:\n\n' + validationErrors.map((err, idx) => `${idx + 1}. ${err}`).join('\n'));
        return;
      }
      
      console.log('6 Aylık Performans Raporu kaydediliyor:', standartRaporForm);
      
      const response = await fetch(`${API_BASE_URL}/api/standart-rapor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          personelId: standartRaporForm.personelId,
          raporTarihi: standartRaporForm.tarih,
          raporDonemi: standartRaporForm.raporDonemi,
          raporYili: standartRaporForm.raporYili,
          soru1_deger_ureten_katkilar: standartRaporForm.soru1_deger_ureten_katkilar,
          soru1_puan: standartRaporForm.soru1_puan,
          soru2_ekip_iletisim_isbirligi: standartRaporForm.soru2_ekip_iletisim_isbirligi,
          soru2_puan: standartRaporForm.soru2_puan,
          soru3_platform_veri_girisi: standartRaporForm.soru3_platform_veri_girisi,
          soru3_puan: standartRaporForm.soru3_puan,
          soru4_geri_bildirim_tutumu: standartRaporForm.soru4_geri_bildirim_tutumu,
          soru4_puan: standartRaporForm.soru4_puan,
          soru5_problem_cozme_proaktivite: standartRaporForm.soru5_problem_cozme_proaktivite,
          soru5_puan: standartRaporForm.soru5_puan,
          soru6_yenilikci_yaklasim: standartRaporForm.soru6_yenilikci_yaklasim,
          soru6_puan: standartRaporForm.soru6_puan,
          soru7_zamaninda_tamamlamada_basarı: standartRaporForm.soru7_zamaninda_tamamlamada_basarı,
          soru7_puan: standartRaporForm.soru7_puan,
          soru8_gonullu_rol_alma_sorumluluk: standartRaporForm.soru8_gonullu_rol_alma_sorumluluk,
          soru8_puan: standartRaporForm.soru8_puan,
          soru9_farkli_ekiplerle_iletisim: standartRaporForm.soru9_farkli_ekiplerle_iletisim,
          soru9_puan: standartRaporForm.soru9_puan,
          genel_degerlendirme: standartRaporForm.genel_degerlendirme,
          genel_puan: standartRaporForm.genel_puan,
          durum: standartRaporForm.durum
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('6 Aylık Performans Raporu başarıyla kaydedildi:', result);
        
        setStandartRaporModalOpen(false);
        setSelectedPersonel(null);
        
        // Personel listesini yenile
        fetchPersonnel();
        
        alert('6 Aylık Performans Raporu başarıyla kaydedildi!');
      } else {
        throw new Error('Rapor kaydedilemedi');
      }
    } catch (error) {
      console.error('6 Aylık Performans Raporu kaydetme hatası:', error);
      alert('6 Aylık Performans Raporu kaydedilirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleStandartRaporChange = (alan: keyof StandartRaporu, deger: string | number | undefined) => {
    setStandartRaporForm(prev => ({
      ...prev,
      [alan]: deger
    }));
  };

  const getDegerlendirmeLabel = (deger: number) => {
    if (deger >= 4.5) return 'Mükemmel';
    if (deger >= 3.5) return 'İyi';
    if (deger >= 2.5) return 'Orta';
    if (deger >= 1.5) return 'Zayıf';
    return 'Çok Zayıf';
  };

  const getDegerlendirmeColor = (deger: number) => {
    if (deger >= 4.5) return '#10b981';
    if (deger >= 3.5) return '#3b82f6';
    if (deger >= 2.5) return '#f59e0b';
    if (deger >= 1.5) return '#ef4444';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div className="faz4-page">
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">📋</div>
            <div className="header-text">
              <h1>Personel Rapor Sistemi</h1>
              <p>Yöneticilerin personellere rapor tutması için gelişmiş değerlendirme sistemi</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Personel verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faz4-page">
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">📋</div>
            <div className="header-text">
              <h1>Personel Rapor Sistemi</h1>
              <p>Yöneticilerin personellere rapor tutması için gelişmiş değerlendirme sistemi</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p>Hata: {error}</p>
          <button 
            onClick={fetchPersonnel}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }


  // Yetki kontrolü
  if (!hasPermission) {
    return (
      <div className="faz4-page">
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">🚫</div>
            <div className="header-text">
              <h1>Erişim Reddedildi</h1>
              <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
            </div>
          </div>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h2>Yetki Gerekli</h2>
            <p>Faz4 sayfasına erişim için yetki seviyesi 3 olmalıdır.</p>
            <p>Lütfen sistem yöneticinizle iletişime geçin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="faz4-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">📋</div>
          <div className="header-text">
            <h1>Personel Rapor Sistemi</h1>
            <p>Yöneticilerin personellere rapor tutması için gelişmiş değerlendirme sistemi</p>
          </div>
        </div>
      </div>


      {/* Uyarı Bölümü */}
      <div className="alert-section">
        <div className="alert-header">
          <h2>🚨 Rapor Uyarıları</h2>
          <p>Rapor süresi gelen personeller için bildirimler</p>
        </div>
        <div className="alert-grid">
          <div className="alert-card urgent">
            <div className="alert-icon">🔴</div>
            <div className="alert-content">
              <h3>{personeller.filter(p => p.raporDurumu === 'gecikmis').length}</h3>
              <p>Gecikmiş Raporlar</p>
              <span className="alert-description">Acil müdahale gerekli</span>
            </div>
          </div>
          <div className="alert-card open">
            <div className="alert-icon">📝</div>
            <div className="alert-content">
              <h3>{personeller.filter(p => p.raporDurumu === 'acik').length}</h3>
              <p>Açık Raporlar</p>
              <span className="alert-description">3 gün içinde doldurulmalı</span>
            </div>
          </div>
          <div className="alert-card warning">
            <div className="alert-icon">🟡</div>
            <div className="alert-content">
              <h3>{personeller.filter(p => p.raporDurumu === 'yaklasan').length}</h3>
              <p>Yaklaşan Raporlar</p>
              <span className="alert-description">7 gün içinde rapor gerekli</span>
            </div>
          </div>
          <div className="alert-card info">
            <div className="alert-icon">🟢</div>
            <div className="alert-content">
              <h3>{personeller.filter(p => p.raporDurumu === 'guncel').length}</h3>
              <p>Güncel Raporlar</p>
              <span className="alert-description">30 gün içinde rapor gerekli</span>
            </div>
          </div>
          <div className="alert-card new">
            <div className="alert-icon">🔵</div>
            <div className="alert-content">
              <h3>{personeller.filter(p => p.raporDurumu === 'yeni').length}</h3>
              <p>Yeni Personeller</p>
              <span className="alert-description">İlk raporları bekleniyor</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          RAPOR HATIRLATMALARI BÖLÜMÜ (n8n Entegrasyonu)
          ============================================ */}
      <div className="hatirlatma-section">
        <div className="hatirlatma-header">
          <div className="hatirlatma-title">
            <h2>📧 Rapor Hatırlatmaları</h2>
            <p>İlk ay ve ikinci ay rapor zamanı gelen personeller</p>
          </div>
          <div className="hatirlatma-actions">
            <button 
              className="btn-refresh"
              onClick={fetchRaporHatirlatmalari}
              disabled={hatirlatmaLoading}
              title="Listeyi yenile"
            >
              🔄 Yenile
            </button>
            {hatirlatmaPersoneller.length > 0 && (
              <button 
                className="btn-send-mail"
                onClick={() => handleMailGonder(hatirlatmaPersoneller)}
                disabled={mailGonderiyor}
              >
                {mailGonderiyor ? '📨 Gönderiliyor...' : `📧 Toplu Mail Gönder (${hatirlatmaPersoneller.length})`}
              </button>
            )}
          </div>
        </div>

        {hatirlatmaLoading ? (
          <div className="hatirlatma-loading">
            <div className="loading-spinner">⏳</div>
            <p>Hatırlatmalar yükleniyor...</p>
          </div>
        ) : hatirlatmaPersoneller.length === 0 ? (
          <div className="hatirlatma-empty">
            <div className="empty-icon">✅</div>
            <h3>Rapor zamanı gelen personel yok</h3>
            <p>Tüm raporlar güncel durumda</p>
          </div>
        ) : (
          <>
            {/* AÇIK RAPORLAR (25-28 gün veya 55-58 gün) */}
            {(() => {
              const acikRaporlar = hatirlatmaPersoneller.filter(p => 
                (p.calismaGunu >= 25 && p.calismaGunu <= 28) || 
                (p.calismaGunu >= 55 && p.calismaGunu <= 58)
              );
              
              return acikRaporlar.length > 0 && (
                <div className="hatirlatma-subsection">
                  <div className="subsection-header">
                    <h3>📝 Açık Raporlar ({acikRaporlar.length})</h3>
                    <p>3 gün içinde doldurulması gereken raporlar</p>
                  </div>
                  <div className="hatirlatma-grid">
                    {acikRaporlar.map((personel, index) => (
                      <div key={index} className="hatirlatma-card acik">
                        <div className="hatirlatma-card-header">
                          <div className="personel-info">
                            <h3>{personel.ad} {personel.soyad}</h3>
                            <span className="grup-badge">{personel.grupKodu}</span>
                          </div>
                          <div className={`rapor-type-badge ${
                            personel.raporTipi === 'ilk_ay' ? 'ilk-ay' : 
                            personel.raporTipi === 'ikinci_ay' ? 'ikinci-ay' : 
                            personel.raporTipi === 'besinci_ay' ? 'besinci-ay' : 'standart'
                          }`}>
                            {personel.raporTipi === 'ilk_ay' ? '1️⃣ 1. Ay' : 
                             personel.raporTipi === 'ikinci_ay' ? '2️⃣ 2. Ay' : 
                             personel.raporTipi === 'besinci_ay' ? '5️⃣ 5. Ay' : '📋 6 Aylık'}
                          </div>
                        </div>

                        <div className="hatirlatma-card-body">
                          <div className="info-row">
                            <span className="info-label">📊 Pozisyon:</span>
                            <span className="info-value">{personel.pozisyon}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">⏱️ Çalışma Süresi:</span>
                            <span className="info-value acik-gun">{personel.calismaGunu} gün</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">📅 İşe Başlama:</span>
                            <span className="info-value">
                              {new Date(personel.iseBaslamaTarihi).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <div className="info-row kalan-sure">
                            <span className="info-label">⏰ Kalan Süre:</span>
                            <span className="info-value kalan-gun">
                              {personel.raporTipi === 'ilk_ay' 
                                ? `${28 - personel.calismaGunu} gün` 
                                : personel.raporTipi === 'ikinci_ay'
                                ? `${58 - personel.calismaGunu} gün`
                                : `${145 - personel.calismaGunu} gün`}
                            </span>
                          </div>
                        </div>

                        <div className="hatirlatma-card-footer">
                          {personel.yoneticiler && personel.yoneticiler.length > 0 ? (
                            <div className="yonetici-info">
                              <span className="yonetici-label">👤 Yönetici:</span>
                              <div className="yonetici-list">
                                {personel.yoneticiler.map((yonetici: any, idx: number) => (
                                  <div key={idx} className="yonetici-item">
                                    <span className="yonetici-name">{yonetici.full_name}</span>
                                    <span className="yonetici-email">{yonetici.email}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="no-yonetici">
                              <span>⚠️ Bu gruba atanmış yönetici bulunamadı</span>
                            </div>
                          )}
                        </div>

                        <div className="hatirlatma-card-actions">
                          <button
                            className="btn-send-single"
                            onClick={() => handleMailGonder([personel])}
                            disabled={mailGonderiyor || !personel.yoneticiler || personel.yoneticiler.length === 0}
                            title="Bu personel için mail gönder"
                          >
                            📧 Mail Gönder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* GECİKMİŞ RAPORLAR (29+ gün veya 59+ gün) */}
            {(() => {
              const gecikmisRaporlar = hatirlatmaPersoneller.filter(p => 
                p.calismaGunu > 28 || p.calismaGunu > 58 || p.calismaGunu > 145
              );
              
              return gecikmisRaporlar.length > 0 && (
                <div className="hatirlatma-subsection">
                  <div className="subsection-header gecikmis">
                    <h3>🔴 Gecikmiş Raporlar ({gecikmisRaporlar.length})</h3>
                    <p>Süresi geçmiş, acil doldurulması gereken raporlar</p>
                  </div>
                  <div className="hatirlatma-grid">
                    {gecikmisRaporlar.map((personel, index) => (
                      <div key={index} className="hatirlatma-card gecikmis">
                        <div className="hatirlatma-card-header">
                          <div className="personel-info">
                            <h3>{personel.ad} {personel.soyad}</h3>
                            <span className="grup-badge">{personel.grupKodu}</span>
                          </div>
                          <div className={`rapor-type-badge ${
                            personel.raporTipi === 'ilk_ay' ? 'ilk-ay' : 
                            personel.raporTipi === 'ikinci_ay' ? 'ikinci-ay' : 
                            personel.raporTipi === 'besinci_ay' ? 'besinci-ay' : 'standart'
                          }`}>
                            {personel.raporTipi === 'ilk_ay' ? '1️⃣ 1. Ay' : 
                             personel.raporTipi === 'ikinci_ay' ? '2️⃣ 2. Ay' : 
                             personel.raporTipi === 'besinci_ay' ? '5️⃣ 5. Ay' : '📋 6 Aylık'}
                          </div>
                        </div>

                        <div className="hatirlatma-card-body">
                          <div className="info-row">
                            <span className="info-label">📊 Pozisyon:</span>
                            <span className="info-value">{personel.pozisyon}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">⏱️ Çalışma Süresi:</span>
                            <span className="info-value gecikmis-gun">{personel.calismaGunu} gün</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">📅 İşe Başlama:</span>
                            <span className="info-value">
                              {new Date(personel.iseBaslamaTarihi).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <div className="info-row gecikme-suresi">
                            <span className="info-label">⚠️ Gecikme:</span>
                            <span className="info-value gecikme-gun">
                              {personel.raporTipi === 'ilk_ay' 
                                ? `${personel.calismaGunu - 28} gün` 
                                : personel.raporTipi === 'ikinci_ay'
                                ? `${personel.calismaGunu - 58} gün`
                                : `${personel.calismaGunu - 145} gün`}
                            </span>
                          </div>
                        </div>

                        <div className="hatirlatma-card-footer">
                          {personel.yoneticiler && personel.yoneticiler.length > 0 ? (
                            <div className="yonetici-info">
                              <span className="yonetici-label">👤 Yönetici:</span>
                              <div className="yonetici-list">
                                {personel.yoneticiler.map((yonetici: any, idx: number) => (
                                  <div key={idx} className="yonetici-item">
                                    <span className="yonetici-name">{yonetici.full_name}</span>
                                    <span className="yonetici-email">{yonetici.email}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="no-yonetici">
                              <span>⚠️ Bu gruba atanmış yönetici bulunamadı</span>
                            </div>
                          )}
                        </div>

                        <div className="hatirlatma-card-actions">
                          <button
                            className="btn-send-single"
                            onClick={() => handleMailGonder([personel])}
                            disabled={mailGonderiyor || !personel.yoneticiler || personel.yoneticiler.length === 0}
                            title="Bu personel için mail gönder"
                          >
                            📧 Mail Gönder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Grup Bazında Personel Listesi */}
      <div className="personel-section">
        <div className="section-header">
          <h2>👥 Personel Grupları</h2>
          <button 
            className="toggle-all-btn"
            onClick={toggleAllGroups}
          >
            {expandedGroups.size === gruplar.length ? 'Tümünü Kapat' : 'Tümünü Aç'}
          </button>
        </div>
        
        {gruplar.map(grup => {
          const isExpanded = expandedGroups.has(grup.adi);
          return (
            <div key={grup.adi} className="grup-container">
              <div 
                className="grup-header"
                onClick={() => toggleGroup(grup.adi)}
              >
                <div className="grup-title">
                  <h3>{grup.aciklama}</h3>
                  <span className="grup-count">{grup.personeller.length} personel</span>
                </div>
                <div className="grup-controls">
                  <div className="grup-stats">
                    <div className="stat-item urgent">
                      <span className="stat-number">{grup.gecikmisRapor}</span>
                      <span className="stat-label">Gecikmiş</span>
                    </div>
                    <div className="stat-item warning">
                      <span className="stat-number">{grup.yaklasanRapor}</span>
                      <span className="stat-label">Yaklaşan</span>
                    </div>
                    <div className="stat-item info">
                      <span className="stat-number">{grup.guncelRapor}</span>
                      <span className="stat-label">Güncel</span>
                    </div>
                    <div className="stat-item new">
                      <span className="stat-number">{grup.yeniPersonel}</span>
                      <span className="stat-label">Yeni</span>
                    </div>
                  </div>
                  <div className="toggle-icon">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="personel-grid">
                  {grup.personeller
                    .filter(personel => personel.raporDurumu !== 'henuz_baslamadi')
                    .map((personel) => (
                    <div 
                      key={personel.id} 
                      className={`personel-card ${personel.raporDurumu}`}
                      onClick={() => handlePersonelClick(personel)}
                    >
                      <div className="personel-avatar">👤</div>
                      <div className="personel-info">
                        <div className="personel-header">
                          <h4>{personel.ad} {personel.soyad}</h4>
                          <div 
                            className="rapor-durumu"
                            style={{ backgroundColor: getStatusColor(personel.raporDurumu || 'bekliyor') }}
                          >
                            {getStatusText(personel.raporDurumu || 'bekliyor')}
                          </div>
                        </div>
                        <p className="personel-pozisyon">
                          {pozisyonTanımları[personel.pozisyon as keyof typeof pozisyonTanımları] || personel.pozisyon}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rapor Modal */}
      {raporModalOpen && selectedPersonel && (
        <div className="modal-overlay" onClick={() => setRaporModalOpen(false)}>
          <div className="rapor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPersonel.ad} {selectedPersonel.soyad} - Personel Raporu</h2>
              <button 
                className="modal-close"
                onClick={() => setRaporModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* Değerlendirme Bölümü */}
              <div className="evaluation-section">
                <h3>Performans Değerlendirmesi</h3>
                <div className="evaluation-grid">
                  {Object.entries(raporForm.degerlendirme).map(([alan, deger]) => (
                    <div key={alan} className="evaluation-item">
                      <label>{alan.charAt(0).toUpperCase() + alan.slice(1)}</label>
                      <div className="rating-container">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={deger}
                          onChange={(e) => handleDegerlendirmeChange(alan, parseFloat(e.target.value))}
                          className="rating-slider"
                        />
                        <div className="rating-display">
                          <span className="rating-value">{deger}</span>
                          <span 
                            className="rating-label"
                            style={{ color: getDegerlendirmeColor(deger) }}
                          >
                            {getDegerlendirmeLabel(deger)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yorumlar Bölümü */}
              <div className="comments-section">
                <h3>Detaylı Yorumlar</h3>
                <div className="comments-grid">
                  {Object.entries(raporForm.yorumlar).map(([alan, deger]) => (
                    <div key={alan} className="comment-item">
                      <label>{alan.charAt(0).toUpperCase() + alan.slice(1)}</label>
                      <textarea
                        value={deger}
                        onChange={(e) => handleYorumChange(alan, e.target.value)}
                        placeholder={`${alan} hakkında yorumunuzu yazın...`}
                        rows={3}
                        className="comment-textarea"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setRaporModalOpen(false)}
              >
                İptal
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleRaporKaydet}
              >
                Raporu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İlk Ay Raporu Modal */}
      {ilkAyRaporModalOpen && selectedPersonel && (
        <div className="modal-overlay" onClick={() => setIlkAyRaporModalOpen(false)}>
          <div className="rapor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPersonel.ad} {selectedPersonel.soyad} - İlk Ay Raporu</h2>
              <button 
                className="modal-close"
                onClick={() => setIlkAyRaporModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* 1. Ay Rapor Soruları */}
              <div className="ilk-ay-rapor-section">
                <h3>İlk Ay Değerlendirmesi</h3>
                
                <div className="rapor-sorular">
                  <div className="soru-item">
                    <label>1. Çalışanınızın deneme süresi nasıldı? Kısaca anlatabilir misiniz?</label>
                    <textarea
                      value={ilkAyRaporForm.denemeSuresiDegerlendirmesi}
                      onChange={(e) => handleIlkAyRaporChange('denemeSuresiDegerlendirmesi', e.target.value)}
                      placeholder="Deneme süresini değerlendiriniz..."
                      rows={4}
                      className="rapor-textarea"
                    />
                  </div>

                  <div className="soru-item">
                    <label>2. Çalışan hakkında paylaşacağınız olumlu izlenimler nelerdir?</label>
                    <textarea
                      value={ilkAyRaporForm.olumluIlenimler}
                      onChange={(e) => handleIlkAyRaporChange('olumluIlenimler', e.target.value)}
                      placeholder="Olumlu izlenimlerinizi yazınız..."
                      rows={4}
                      className="rapor-textarea"
                    />
                  </div>

                  <div className="soru-item">
                    <label>3. Çalışan hakkında paylaşacağınız olumsuz izlenimler nelerdir?</label>
                    <textarea
                      value={ilkAyRaporForm.olumsuzIlenimler}
                      onChange={(e) => handleIlkAyRaporChange('olumsuzIlenimler', e.target.value)}
                      placeholder="Olumsuz izlenimlerinizi yazınız..."
                      rows={4}
                      className="rapor-textarea"
                    />
                  </div>

                  <div className="soru-item">
                    <label>4. Deneme süresinin sonunda çalışanla devam etmek istiyor musunuz?</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="devamEtmeKarari"
                          value="Evet"
                          checked={ilkAyRaporForm.devamEtmeKarari === 'Evet'}
                          onChange={(e) => handleIlkAyRaporChange('devamEtmeKarari', e.target.value)}
                        />
                        Evet
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="devamEtmeKarari"
                          value="Hayır"
                          checked={ilkAyRaporForm.devamEtmeKarari === 'Hayır'}
                          onChange={(e) => handleIlkAyRaporChange('devamEtmeKarari', e.target.value)}
                        />
                        Hayır
                      </label>
                    </div>
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={ilkAyRaporForm.soru4_puan || ''}
                        onChange={(e) => handleIlkAyRaporChange('soru4_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setIlkAyRaporModalOpen(false)}
              >
                İptal
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleIlkAyRaporKaydet}
              >
                İlk Ay Raporunu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İkinci Ay Raporu Modal */}
      {ikinciAyRaporModalOpen && selectedPersonel && (
        <div className="modal-overlay" onClick={() => setIkinciAyRaporModalOpen(false)}>
          <div className="rapor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPersonel.ad} {selectedPersonel.soyad} - İkinci Ay Raporu</h2>
              <button 
                className="modal-close"
                onClick={() => setIkinciAyRaporModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* 2. Ay Rapor Soruları */}
              <div className="ikinci-ay-rapor-section">
                <h3>İkinci Ay Değerlendirmesi</h3>
                
                <div className="rapor-sorular">
                  <div className="soru-item">
                    <label>1. Çalışanınızın deneme süresi nasıldı? Kısaca anlatabilir misiniz?</label>
                    <textarea
                      value={ikinciAyRaporForm.denemeSuresiDegerlendirmesi}
                      onChange={(e) => handleIkinciAyRaporChange('denemeSuresiDegerlendirmesi', e.target.value)}
                      placeholder="Deneme süresini değerlendiriniz..."
                      rows={4}
                      className="rapor-textarea"
                    />
                  </div>

                  <div className="soru-item">
                    <label>2. Çalışan hakkında paylaşacağınız olumlu izlenimler nelerdir?</label>
                    <textarea
                      value={ikinciAyRaporForm.olumluIlenimler}
                      onChange={(e) => handleIkinciAyRaporChange('olumluIlenimler', e.target.value)}
                      placeholder="Olumlu izlenimlerinizi yazınız..."
                      rows={4}
                      className="rapor-textarea"
                    />
                  </div>

                  <div className="soru-item">
                    <label>3. Çalışan hakkında paylaşacağınız olumsuz izlenimler nelerdir?</label>
                    <textarea
                      value={ikinciAyRaporForm.olumsuzIlenimler}
                      onChange={(e) => handleIkinciAyRaporChange('olumsuzIlenimler', e.target.value)}
                      placeholder="Olumsuz izlenimlerinizi yazınız..."
                      rows={4}
                      className="rapor-textarea"
                    />
                  </div>

                  <div className="soru-item">
                    <label>4. Deneme süresinin sonunda çalışanla devam etmek istiyor musunuz?</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="devamEtmeKarari2"
                          value="Evet"
                          checked={ikinciAyRaporForm.devamEtmeKarari === 'Evet'}
                          onChange={(e) => handleIkinciAyRaporChange('devamEtmeKarari', e.target.value)}
                        />
                        Evet
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="devamEtmeKarari2"
                          value="Hayır"
                          checked={ikinciAyRaporForm.devamEtmeKarari === 'Hayır'}
                          onChange={(e) => handleIkinciAyRaporChange('devamEtmeKarari', e.target.value)}
                        />
                        Hayır
                      </label>
                    </div>
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={ikinciAyRaporForm.soru4_puan || ''}
                        onChange={(e) => handleIkinciAyRaporChange('soru4_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setIkinciAyRaporModalOpen(false)}
              >
                İptal
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleIkinciAyRaporKaydet}
              >
                İkinci Ay Raporunu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Aylık Performans Raporu Modal */}
      {standartRaporModalOpen && selectedPersonel && (
        <div className="modal-overlay" onClick={() => setStandartRaporModalOpen(false)}>
          <div className="rapor-modal standart-rapor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPersonel.ad} {selectedPersonel.soyad} - 6 Aylık Performans Raporu ({standartRaporForm.raporDonemi} {standartRaporForm.raporYili})</h2>
              <button 
                className="modal-close"
                onClick={() => setStandartRaporModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* 6 Aylık Performans Raporu Soruları */}
              <div className="standart-rapor-section">
                <h3>6 Aylık Değerlendirme</h3>
                
                <div className="rapor-sorular">
                  <div className="soru-item">
                    <label>1. Değer Üreten Katkılar</label>
                    <textarea
                      value={standartRaporForm.soru1_deger_ureten_katkilar}
                      onChange={(e) => handleStandartRaporChange('soru1_deger_ureten_katkilar', e.target.value)}
                      placeholder="Görev aldığı süreçlerde değer üreten, sonuç odaklı ve sürdürülebilir katkıları değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru1_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru1_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>2. Ekip İletişimi ve İş Birliği</label>
                    <textarea
                      value={standartRaporForm.soru2_ekip_iletisim_isbirligi}
                      onChange={(e) => handleStandartRaporChange('soru2_ekip_iletisim_isbirligi', e.target.value)}
                      placeholder="Ekip arkadaşlarıyla etkili iletişim kurma ve iş birliği performansını değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru2_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru2_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>3. Platform Veri Girişi</label>
                    <textarea
                      value={standartRaporForm.soru3_platform_veri_girisi}
                      onChange={(e) => handleStandartRaporChange('soru3_platform_veri_girisi', e.target.value)}
                      placeholder="Sorumlu olduğu platformlara düzenli ve doğru veri girişi performansını değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru3_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru3_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>4. Geri Bildirim Tutumu</label>
                    <textarea
                      value={standartRaporForm.soru4_geri_bildirim_tutumu}
                      onChange={(e) => handleStandartRaporChange('soru4_geri_bildirim_tutumu', e.target.value)}
                      placeholder="Yapıcı geri bildirim alma ve verme konusundaki tutumunu değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru4_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru4_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>5. Problem Çözme Proaktivitesi</label>
                    <textarea
                      value={standartRaporForm.soru5_problem_cozme_proaktivite}
                      onChange={(e) => handleStandartRaporChange('soru5_problem_cozme_proaktivite', e.target.value)}
                      placeholder="Teknik veya operasyonel problemleri zamanında ve etkin çözme konusundaki proaktivitesini değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru5_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru5_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>6. Yenilikçi Yaklaşım</label>
                    <textarea
                      value={standartRaporForm.soru6_yenilikci_yaklasim}
                      onChange={(e) => handleStandartRaporChange('soru6_yenilikci_yaklasim', e.target.value)}
                      placeholder="Yeni teknolojilere ilgi gösterme ve süreçlere yenilikçi bakış açısıyla yaklaşma konusundaki istekliliğini değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru6_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru6_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>7. Zamanında Tamamlama</label>
                    <textarea
                      value={standartRaporForm.soru7_zamaninda_tamamlamada_basarı}
                      onChange={(e) => handleStandartRaporChange('soru7_zamaninda_tamamlamada_basarı', e.target.value)}
                      placeholder="Görevlerini zamanında ve önceliklere uygun şekilde tamamlama başarısını değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru7_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru7_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>8. Gönüllü Rol Alma</label>
                    <textarea
                      value={standartRaporForm.soru8_gonullu_rol_alma_sorumluluk}
                      onChange={(e) => handleStandartRaporChange('soru8_gonullu_rol_alma_sorumluluk', e.target.value)}
                      placeholder="Süreçlerde gönüllü olarak rol alma ve sorumluluk üstlenme performansını değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru8_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru8_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>9. Farklı Ekiplerle İletişim</label>
                    <textarea
                      value={standartRaporForm.soru9_farkli_ekiplerle_iletisim}
                      onChange={(e) => handleStandartRaporChange('soru9_farkli_ekiplerle_iletisim', e.target.value)}
                      placeholder="Farklı ekiplerle iletişim kurarken açık, yapıcı ve sonuç odaklı olma performansını değerlendiriniz..."
                      rows={3}
                      className="rapor-textarea"
                    />
                    <div className="puan-input-group">
                      <label className="puan-label">Puan (1-5):</label>
                      <select
                        value={standartRaporForm.soru9_puan || ''}
                        onChange={(e) => handleStandartRaporChange('soru9_puan', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="puan-select"
                      >
                        <option value="">Puan Seçiniz</option>
                        <option value="1">1 ⭐ - Çok Zayıf</option>
                        <option value="2">2 ⭐⭐ - Zayıf</option>
                        <option value="3">3 ⭐⭐⭐ - Orta</option>
                        <option value="4">4 ⭐⭐⭐⭐ - İyi</option>
                        <option value="5">5 ⭐⭐⭐⭐⭐ - Mükemmel</option>
                      </select>
                    </div>
                  </div>

                  <div className="soru-item">
                    <label>Genel Değerlendirme</label>
                    <textarea
                      value={standartRaporForm.genel_degerlendirme}
                      onChange={(e) => handleStandartRaporChange('genel_degerlendirme', e.target.value)}
                      placeholder="Genel değerlendirme ve önerilerinizi yazınız..."
                      rows={4}
                      className="rapor-textarea"
                    />
                  </div>

                  <div className="soru-item">
                    <label>Genel Puan (1.0 - 5.0)</label>
                    <input
                      type="number"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={standartRaporForm.genel_puan}
                      onChange={(e) => handleStandartRaporChange('genel_puan', parseFloat(e.target.value) || 0)}
                      className="rapor-input"
                      placeholder="Genel puanı giriniz..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setStandartRaporModalOpen(false)}
              >
                İptal
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleStandartRaporKaydet}
              >
                6 Aylık Performans Raporunu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faz4Page;