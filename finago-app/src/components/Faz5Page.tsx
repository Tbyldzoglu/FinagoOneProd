/**
 * İK (İnsan Kaynakları) - Faz5 Sayfası
 * Rapor Görüntüleme Sistemi
 * 
 * Bu sayfa daha önce oluşturulmuş raporları görüntüler.
 * 1. Ay, 2. Ay ve Standart raporları listeler.
 */

import React, { useState, useEffect } from 'react';
import '../styles/Faz5Page.css';
import authService from '../services/authService';

interface Personel {
  id: number;
  ad: string;
  soyad: string;
  grup: string;
  pozisyon: string;
  iseBaslamaTarihi: string;
}

interface IlkAyRaporu {
  id: number;
  personelId: number;
  raporTarihi: string;
  soru1_deneme_suresi_degerlendirmesi: string;
  soru1_puan?: number;
  soru2_olumlu_izlenimler: string;
  soru2_puan?: number;
  soru3_olumsuz_izlenimler: string;
  soru3_puan?: number;
  soru4_devam_etme_karari: string;
  soru4_puan?: number;
  rapor_durumu: string;
  olusturma_tarihi: string;
  ad: string;
  soyad: string;
  grup: string;
  pozisyon: string;
}

interface IkinciAyRaporu {
  id: number;
  personelId: number;
  raporTarihi: string;
  soru1_deneme_suresi_degerlendirmesi: string;
  soru2_olumlu_izlenimler: string;
  soru3_olumsuz_izlenimler: string;
  soru4_devam_etme_karari: string;
  soru4_puan?: number;
  rapor_durumu: string;
  olusturma_tarihi: string;
  ad: string;
  soyad: string;
  grup: string;
  pozisyon: string;
}

interface StandartRaporu {
  id: number;
  personelId: number;
  raporTarihi: string;
  raporDonemi: string;
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
  rapor_durumu: string;
  olusturma_tarihi: string;
  ad: string;
  soyad: string;
  grup: string;
  pozisyon: string;
}

interface Faz5PageProps {
  onNavigate?: (page: string) => void;
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
}

const Faz5Page: React.FC<Faz5PageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gruplar, setGruplar] = useState<Grup[]>([]);
  const [selectedPersonel, setSelectedPersonel] = useState<Personel | null>(null);
  const [personelRaporlar, setPersonelRaporlar] = useState<any[]>([]);
  const [raporModalOpen, setRaporModalOpen] = useState(false);
  const [selectedRapor, setSelectedRapor] = useState<any>(null);
  const [raporDetayModalOpen, setRaporDetayModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // Grup ve pozisyon tanımları
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

  const pozisyonTanımları = {
    'D': 'Developer',
    'A': 'Analist',
    'TM': 'Teknik Mimar',
    'PM': 'Product Manager',
    'QA': 'Quality Assurance',
    'UX': 'UX Designer',
    'UI': 'UI Designer'
  };

  // Personel listesini yükle
  useEffect(() => {
    // Yetki kontrolü yap
    const permission = authService.canAccessFaz5();
    setHasPermission(permission);
    
    if (permission) {
      fetchPersonnel();
    } else {
      setError('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
      setLoading(false);
    }
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/personel', {
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const gruplar = organizePersonnelByGroup(data);
        setGruplar(gruplar);
      } else {
        throw new Error('Personel listesi alınamadı');
      }
    } catch (error) {
      console.error('Personel listesi yükleme hatası:', error);
      setError('Personel listesi yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const organizePersonnelByGroup = (personeller: Personel[]): Grup[] => {
    const grupMap = new Map<string, Personel[]>();
    
    personeller.forEach(personel => {
      if (!grupMap.has(personel.grup)) {
        grupMap.set(personel.grup, []);
      }
      grupMap.get(personel.grup)!.push(personel);
    });


    return Array.from(grupMap.entries()).map(([grupKodu, personeller]) => ({
      adi: grupKodu,
      aciklama: grupTanımları[grupKodu as keyof typeof grupTanımları] || grupKodu,
      personeller: personeller.sort((a, b) => a.ad.localeCompare(b.ad)),
      toplamRapor: 0,
      gecikmisRapor: 0,
      yaklasanRapor: 0,
      guncelRapor: 0,
      yeniPersonel: 0
    }));
  };

  const fetchPersonelRaporlar = async (personelId: number) => {
    try {
      setLoading(true);
      
      // Paralel olarak tüm rapor türlerini çek
      const [ilkAyResponse, ikinciAyResponse, standartResponse] = await Promise.all([
        fetch('http://localhost:3001/api/ilk-ay-raporu', {
          headers: authService.getAuthHeader()
        }),
        fetch('http://localhost:3001/api/ikinci-ay-raporu', {
          headers: authService.getAuthHeader()
        }),
        fetch('http://localhost:3001/api/standart-rapor', {
          headers: authService.getAuthHeader()
        })
      ]);

      let allRaporlar: any[] = [];

      if (ilkAyResponse.ok) {
        const ilkAyData = await ilkAyResponse.json();
        const personelIlkAyRaporlar = ilkAyData.filter((rapor: any) => rapor.personelId === personelId);
        allRaporlar = [...allRaporlar, ...personelIlkAyRaporlar.map((rapor: any) => ({ ...rapor, raporTipi: 'İlk Ay Raporu' }))];
      }

      if (ikinciAyResponse.ok) {
        const ikinciAyData = await ikinciAyResponse.json();
        const personelIkinciAyRaporlar = ikinciAyData.filter((rapor: any) => rapor.personelId === personelId);
        allRaporlar = [...allRaporlar, ...personelIkinciAyRaporlar.map((rapor: any) => ({ ...rapor, raporTipi: 'İkinci Ay Raporu' }))];
      }

      if (standartResponse.ok) {
        const standartData = await standartResponse.json();
        const personelStandartRaporlar = standartData.filter((rapor: any) => rapor.personelId === personelId);
        allRaporlar = [...allRaporlar, ...personelStandartRaporlar.map((rapor: any) => ({ ...rapor, raporTipi: 'Standart Rapor' }))];
      }

      // Tarihe göre sırala (en yeni önce)
      allRaporlar.sort((a, b) => new Date(b.raporTarihi).getTime() - new Date(a.raporTarihi).getTime());
      
      setPersonelRaporlar(allRaporlar);
      setRaporModalOpen(true);

    } catch (error) {
      console.error('Personel raporları yükleme hatası:', error);
      setError('Personel raporları yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handlePersonelClick = (personel: Personel) => {
    setSelectedPersonel(personel);
    fetchPersonelRaporlar(personel.id);
  };

  const handleRaporClick = (rapor: any) => {
    setSelectedRapor(rapor);
    setRaporDetayModalOpen(true);
  };

  const toggleGroup = (grupAdi: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(grupAdi)) {
      newExpandedGroups.delete(grupAdi);
    } else {
      newExpandedGroups.add(grupAdi);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const getDurumBadge = (durum: string, raporTipi?: string) => {
    const durumMap = {
      'taslak': { text: '', class: 'badge-draft' },
      'tamamlandi': { text: 'Tamamlandı', class: 'badge-completed' },
      'onaylandi': { text: 'Onaylandı', class: 'badge-approved' }
    };
    
    const durumInfo = durumMap[durum as keyof typeof durumMap] || { text: durum, class: 'badge-default' };
    
    // Taslak durumunda sadece rapor türü, diğerlerinde rapor türü + durum
    if (durum === 'taslak' && raporTipi) {
      return (
        <span className={`badge ${durumInfo.class}`}>
          {raporTipi}
        </span>
      );
    }
    
    // Tamamlandı ve Onaylandı durumları için rapor türü + durum
    const raporTuruAciklama = raporTipi ? `${raporTipi} - ` : '';
    
    return (
      <span className={`badge ${durumInfo.class}`}>
        {raporTuruAciklama}{durumInfo.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderPuanYildiz = (puan: number) => {
    const yildizlar = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= puan) {
        yildizlar.push(<span key={i} className="yildiz dolu">⭐</span>);
      } else {
        yildizlar.push(<span key={i} className="yildiz bos">☆</span>);
      }
    }
    return <>{yildizlar}</>;
  };


  const renderRaporDetay = () => {
    if (!selectedRapor) return null;

    const isStandartRapor = 'raporDonemi' in selectedRapor;

    return (
      <div className="rapor-detay">
        <div className="rapor-detay-header">
          <h2>{selectedRapor.ad} {selectedRapor.soyad} - {isStandartRapor ? 'Standart Rapor' : selectedRapor.raporTipi || 'Rapor'}</h2>
          <div className="rapor-meta">
            <p><strong>Grup:</strong> {grupTanımları[selectedRapor.grup as keyof typeof grupTanımları] || selectedRapor.grup}</p>
            <p><strong>Pozisyon:</strong> {pozisyonTanımları[selectedRapor.pozisyon as keyof typeof pozisyonTanımları] || selectedRapor.pozisyon}</p>
            <p><strong>Rapor Tarihi:</strong> {formatDate(selectedRapor.raporTarihi)}</p>
            {isStandartRapor && (
              <>
                <p><strong>Dönem:</strong> {selectedRapor.raporDonemi} {selectedRapor.raporYili}</p>
                <p><strong>Genel Puan:</strong> {selectedRapor.genel_puan}/5.0</p>
              </>
            )}
            {getDurumBadge(selectedRapor.rapor_durumu, selectedRapor.raporTipi)}
          </div>
        </div>

        <div className="rapor-detay-content">
          {isStandartRapor ? (
            <div className="standart-rapor-detay">
              <div className="soru-detay">
                <h4>1. Değer Üreten Katkılar</h4>
                <p>{selectedRapor.soru1_deger_ureten_katkilar}</p>
                {selectedRapor.soru1_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru1_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru1_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>2. Ekip İletişimi ve İş Birliği</h4>
                <p>{selectedRapor.soru2_ekip_iletisim_isbirligi}</p>
                {selectedRapor.soru2_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru2_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru2_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>3. Platform Veri Girişi</h4>
                <p>{selectedRapor.soru3_platform_veri_girisi}</p>
                {selectedRapor.soru3_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru3_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru3_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>4. Geri Bildirim Tutumu</h4>
                <p>{selectedRapor.soru4_geri_bildirim_tutumu}</p>
                {selectedRapor.soru4_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru4_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru4_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>5. Problem Çözme Proaktivitesi</h4>
                <p>{selectedRapor.soru5_problem_cozme_proaktivite}</p>
                {selectedRapor.soru5_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru5_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru5_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>6. Yenilikçi Yaklaşım</h4>
                <p>{selectedRapor.soru6_yenilikci_yaklasim}</p>
                {selectedRapor.soru6_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru6_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru6_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>7. Zamanında Tamamlama</h4>
                <p>{selectedRapor.soru7_zamaninda_tamamlamada_basarı}</p>
                {selectedRapor.soru7_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru7_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru7_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>8. Gönüllü Rol Alma</h4>
                <p>{selectedRapor.soru8_gonullu_rol_alma_sorumluluk}</p>
                {selectedRapor.soru8_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru8_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru8_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>9. Farklı Ekiplerle İletişim</h4>
                <p>{selectedRapor.soru9_farkli_ekiplerle_iletisim}</p>
                {selectedRapor.soru9_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru9_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru9_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay genel">
                <h4>Genel Değerlendirme</h4>
                <p>{selectedRapor.genel_degerlendirme}</p>
              </div>
            </div>
          ) : (
            <div className="ay-rapor-detay">
              <div className="soru-detay">
                <h4>1. Deneme Süresi Değerlendirmesi</h4>
                <p>{selectedRapor.soru1_deneme_suresi_degerlendirmesi}</p>
                {selectedRapor.soru1_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru1_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru1_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>2. Olumlu İzlenimler</h4>
                <p>{selectedRapor.soru2_olumlu_izlenimler}</p>
                {selectedRapor.soru2_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru2_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru2_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>3. Olumsuz İzlenimler</h4>
                <p>{selectedRapor.soru3_olumsuz_izlenimler}</p>
                {selectedRapor.soru3_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru3_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru3_puan}/5)</span>
                  </div>
                )}
              </div>
              <div className="soru-detay">
                <h4>4. Devam Etme Kararı</h4>
                <p><strong>{selectedRapor.soru4_devam_etme_karari}</strong></p>
                {selectedRapor.soru4_puan && (
                  <div className="puan-display">
                    <span className="puan-label">Puan:</span>
                    <span className="puan-yildiz">{renderPuanYildiz(selectedRapor.soru4_puan)}</span>
                    <span className="puan-sayi">({selectedRapor.soru4_puan}/5)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="faz5-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Raporlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faz5-page">
        <div className="error-container">
          <h2>Hata</h2>
          <p>{error}</p>
          <button onClick={fetchPersonnel} className="btn btn-primary">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }


  // Yetki kontrolü
  if (!hasPermission) {
    return (
      <div className="faz5-page">
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
            <p>Faz5 sayfasına erişim için yetki seviyesi 2 veya 3 olmalıdır.</p>
            <p>Lütfen sistem yöneticinizle iletişime geçin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="faz5-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">📊</div>
          <div className="header-text">
            <h1>Rapor Görüntüleme</h1>
            <p>Personel kartlarına tıklayarak raporlarını görüntüleyin</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => {
              const newGruplar = gruplar.map(grup => ({ ...grup, acik: true }));
              setGruplar(newGruplar);
            }}
          >
            Tümünü Aç
          </button>
        </div>
      </div>

      {/* Grup Listesi */}
      <div className="gruplar-container">
        {gruplar.map((grup) => (
          <div key={grup.adi} className="grup-section">
            <div 
              className="grup-header"
              onClick={() => toggleGroup(grup.adi)}
            >
              <div className="grup-info">
                <h3>{grup.adi}</h3>
                <p>{grup.aciklama}</p>
                <span className="personel-sayisi">{grup.personeller.length} personel</span>
              </div>
              <div className="grup-arrow">
                {expandedGroups.has(grup.adi) ? '▼' : '▶'}
              </div>
            </div>
            
            {expandedGroups.has(grup.adi) && (
              <div className="personel-grid">
                {grup.personeller.map((personel) => (
                  <div 
                    key={personel.id} 
                    className="personel-card"
                    onClick={() => handlePersonelClick(personel)}
                  >
                    <div className="personel-avatar">👤</div>
                    <div className="personel-info">
                      <div className="personel-header">
                        <h4>{personel.ad} {personel.soyad}</h4>
                      </div>
                      <p className="personel-pozisyon">
                        {pozisyonTanımları[personel.pozisyon as keyof typeof pozisyonTanımları] || personel.pozisyon}
                      </p>
                      <p className="personel-grup">
                        {grup.aciklama}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Personel Raporları Modal */}
      {raporModalOpen && selectedPersonel && (
        <div className="modal-overlay" onClick={() => setRaporModalOpen(false)}>
          <div className="rapor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPersonel.ad} {selectedPersonel.soyad} - Raporları</h2>
              <button 
                className="modal-close"
                onClick={() => setRaporModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {personelRaporlar.length > 0 ? (
                <div className="rapor-grid">
                  {personelRaporlar.map((rapor, index) => (
                    <div key={index} className="rapor-card" onClick={() => handleRaporClick(rapor)}>
                      <div className="rapor-header">
                        <div className="rapor-title-section">
                          <div className="rapor-icon">
                            {rapor.raporTipi === 'İlk Ay Raporu' ? '📊' : 
                             rapor.raporTipi === 'İkinci Ay Raporu' ? '📈' : '📋'}
                          </div>
                          <h3>{rapor.raporTipi}</h3>
                        </div>
                        {getDurumBadge(rapor.rapor_durumu, rapor.raporTipi)}
                      </div>
                      <div className="rapor-info">
                        <p><strong>Rapor Tarihi:</strong> {formatDate(rapor.raporTarihi)}</p>
                        <p><strong>Oluşturma:</strong> {formatDate(rapor.olusturma_tarihi)}</p>
                        {rapor.raporDonemi && (
                          <p><strong>Dönem:</strong> {rapor.raporDonemi} {rapor.raporYili}</p>
                        )}
                        {rapor.genel_puan && (
                          <p><strong>Genel Puan:</strong> {rapor.genel_puan}/5.0</p>
                        )}
                        {/* İlk Ay ve İkinci Ay Raporları için soru4_puan (devam etme kararı puanı) */}
                        {(rapor.raporTipi === 'İlk Ay Raporu' || rapor.raporTipi === 'İkinci Ay Raporu') && rapor.soru4_puan && (
                          <p><strong>Devam Etme Kararı Puanı:</strong> {rapor.soru4_puan}/5.0 ⭐</p>
                        )}
                      </div>
                      <div className="rapor-preview">
                        {rapor.soru1_deneme_suresi_degerlendirmesi && (
                          <p><strong>Deneme Süresi:</strong> {rapor.soru1_deneme_suresi_degerlendirmesi.substring(0, 100)}...</p>
                        )}
                        {rapor.soru1_deger_ureten_katkilar && (
                          <p><strong>Değer Üreten Katkılar:</strong> {rapor.soru1_deger_ureten_katkilar.substring(0, 100)}...</p>
                        )}
                        {rapor.genel_degerlendirme && (
                          <p><strong>Genel Değerlendirme:</strong> {rapor.genel_degerlendirme.substring(0, 100)}...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-reports">
                  <p>Bu personel için henüz rapor bulunmuyor.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setRaporModalOpen(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rapor Detay Modal */}
      {raporDetayModalOpen && selectedRapor && (
        <div className="modal-overlay" onClick={() => setRaporDetayModalOpen(false)}>
          <div className="rapor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rapor Detayı</h2>
              <button 
                className="modal-close"
                onClick={() => setRaporDetayModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {renderRaporDetay()}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setRaporDetayModalOpen(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faz5Page;