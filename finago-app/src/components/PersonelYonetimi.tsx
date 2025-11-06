import React, { useState, useEffect } from 'react';
import '../styles/PersonelYonetimi.css';
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
}

const PersonelYonetimi: React.FC = () => {
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [filteredPersoneller, setFilteredPersoneller] = useState<Personel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonel, setSelectedPersonel] = useState<Personel | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Personel | null>(null);

  // Grup tanımları (PersonelKayit ile aynı)
  const gruplar = [
    { kod: 'TBK', ad: 'Temel Bankacılık' },
    { kod: 'KD', ad: 'Krediler' },
    { kod: 'HDT', ad: 'Hazine & Dış Ticaret' },
    { kod: 'DPC', ad: 'Debit / Prepaid Card' },
    { kod: 'SPP', ad: 'Sanal Post / PF' },
    { kod: 'AN', ad: 'Analist' },
    { kod: 'AD', ad: 'Android Developer' },
    { kod: 'ID', ad: 'IOS Developer' },
    { kod: 'BBD', ad: 'BOA Backend Developer' }
  ];

  // Pozisyon tanımları (PersonelKayit ile aynı)
  const pozisyonlar = [
    { kod: 'D', ad: 'Developer' },
    { kod: 'TM', ad: 'Teknik Mimar' },
    { kod: 'A', ad: 'Analist' },
    { kod: 'PM', ad: 'Product Manager' },
    { kod: 'QA', ad: 'Quality Assurance' },
    { kod: 'UX', ad: 'UX Designer' },
    { kod: 'UI', ad: 'UI Designer' }
  ];

  useEffect(() => {
    fetchPersoneller();
  }, []);

  useEffect(() => {
    filterPersoneller();
  }, [searchTerm, personeller]);

  const fetchPersoneller = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/personel/all`, {
        headers: {
          ...authService.getAuthHeader()
        }
      });

      if (response.status === 401) {
        alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        window.location.reload();
        return;
      }

      if (!response.ok) {
        throw new Error('Personeller yüklenemedi');
      }

      const data = await response.json();
      setPersoneller(data);
      setFilteredPersoneller(data);
    } catch (error) {
      console.error('Personel yükleme hatası:', error);
      alert('Personeller yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const filterPersoneller = () => {
    if (!searchTerm.trim()) {
      setFilteredPersoneller(personeller);
      return;
    }

    const filtered = personeller.filter(p => 
      p.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pozisyon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.grup.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPersoneller(filtered);
  };

  const handleEdit = (personel: Personel) => {
    setSelectedPersonel(personel);
    setEditForm({ ...personel });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (field: keyof Personel, value: any) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    try {
      // Validasyon
      if (!editForm.ad || !editForm.soyad) {
        alert('Ad ve Soyad alanları zorunludur!');
        return;
      }

      if (!editForm.iseBaslamaTarihi) {
        alert('İşe Başlama Tarihi zorunludur!');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/personel/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          ad: editForm.ad,
          soyad: editForm.soyad,
          grup: editForm.grup,
          pozisyon: editForm.pozisyon,
          iseBaslamaTarihi: editForm.iseBaslamaTarihi,
          aktif: editForm.aktif
        })
      });

      if (!response.ok) {
        throw new Error('Personel güncellenemedi');
      }

      alert('✅ Personel bilgileri başarıyla güncellendi!');
      setEditModalOpen(false);
      setSelectedPersonel(null);
      setEditForm(null);
      fetchPersoneller(); // Listeyi yenile
    } catch (error) {
      console.error('Personel güncelleme hatası:', error);
      alert('Personel güncellenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleDeletePersonel = async (personel: Personel) => {
    if (!window.confirm(`${personel.ad} ${personel.soyad} isimli personeli silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve personele ait tüm raporlar da silinecektir!`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/personel/${personel.id}`, {
        method: 'DELETE',
        headers: {
          ...authService.getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error('Personel silinemedi');
      }

      alert('✅ Personel başarıyla silindi!');
      fetchPersoneller(); // Listeyi yenile
    } catch (error) {
      console.error('Personel silme hatası:', error);
      alert('Personel silinirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  return (
    <div className="personel-yonetimi-container">
      <div className="personel-yonetimi-header">
        <div className="header-content">
          <h1>👥 Personel Yönetimi</h1>
          <p>Tüm personelleri görüntüleyin ve bilgilerini düzenleyin</p>
        </div>
        
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Personel ara (ad, soyad, pozisyon...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="stats">
            <span className="stat-badge">
              📊 Toplam: {personeller.length}
            </span>
            <span className="stat-badge active">
              ✅ Aktif: {personeller.filter(p => p.aktif).length}
            </span>
            <span className="stat-badge inactive">
              ❌ Pasif: {personeller.filter(p => !p.aktif).length}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Personeller yükleniyor...</p>
        </div>
      ) : (
        <div className="personel-table-container">
          <table className="personel-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ad Soyad</th>
                <th>Grup</th>
                <th>Pozisyon</th>
                <th>İşe Başlama</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersoneller.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-message">
                    {searchTerm ? '🔍 Arama kriterine uygun personel bulunamadı' : '📋 Henüz personel kaydı yok'}
                  </td>
                </tr>
              ) : (
                filteredPersoneller.map((personel) => (
                  <tr key={personel.id} className={!personel.aktif ? 'inactive-row' : ''}>
                    <td>{personel.id}</td>
                    <td className="name-cell">
                      <strong>{personel.ad} {personel.soyad}</strong>
                    </td>
                    <td>
                      <span className="grup-badge">{personel.grup}</span>
                    </td>
                    <td>{personel.pozisyon}</td>
                    <td>{new Date(personel.iseBaslamaTarihi).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <span className={`status-badge ${personel.aktif ? 'active' : 'inactive'}`}>
                        {personel.aktif ? '✅ Aktif' : '❌ Pasif'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(personel)}
                        title="Düzenle"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeletePersonel(personel)}
                        title="Sil"
                      >
                        🗑️ Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editForm && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Personel Bilgilerini Düzenle</h2>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Ad *</label>
                  <input
                    type="text"
                    value={editForm.ad}
                    onChange={(e) => handleEditFormChange('ad', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Soyad *</label>
                  <input
                    type="text"
                    value={editForm.soyad}
                    onChange={(e) => handleEditFormChange('soyad', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Grup</label>
                  <select
                    className="form-select"
                    value={editForm.grup}
                    onChange={(e) => handleEditFormChange('grup', e.target.value)}
                  >
                    <option value="">Grup Seçiniz</option>
                    {gruplar.map((grup) => (
                      <option key={grup.kod} value={grup.kod}>
                        {grup.kod} - {grup.ad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Pozisyon</label>
                  <select
                    className="form-select"
                    value={editForm.pozisyon}
                    onChange={(e) => handleEditFormChange('pozisyon', e.target.value)}
                  >
                    <option value="">Pozisyon Seçiniz</option>
                    {pozisyonlar.map((pozisyon) => (
                      <option key={pozisyon.kod} value={pozisyon.kod}>
                        {pozisyon.kod} - {pozisyon.ad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>İşe Başlama Tarihi *</label>
                  <input
                    type="date"
                    value={editForm.iseBaslamaTarihi}
                    onChange={(e) => handleEditFormChange('iseBaslamaTarihi', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editForm.aktif}
                      onChange={(e) => handleEditFormChange('aktif', e.target.checked)}
                    />
                    <span>Aktif Personel</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
                İptal
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                💾 Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonelYonetimi;

