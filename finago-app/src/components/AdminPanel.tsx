/**
 * Admin Panel - Kullanıcı ve Yetki Yönetimi
 * Yetki seviyesi 4 olan kullanıcılar bu sayfaya erişebilir
 */

import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/AdminPanel.css';

const API_BASE_URL = process.env.REACT_APP_DATABASE_API_URL || 'http://localhost:3001';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  yetkiSeviyesi: number | null;
  is_active: boolean;
  created_at: string;
  yetkiAciklamasi: string;
  atananGrupSayisi: number;
}

interface Grup {
  grupKodu: string;
  personelSayisi: number;
}

interface YoneticiGrupAtama {
  id: number;
  yoneticiId: number;
  username: string;
  full_name: string;
  yetkiSeviyesi: number;
  grupKodu: string;
  atamaTarihi: string;
  aktif: boolean;
  grupPersonelSayisi: number;
}

interface Stats {
  toplamKullanici: number;
  toplamGrup: number;
  toplamPersonel: number;
  toplamAtama: number;
  yetkiDagilimi: Array<{ yetkiSeviyesi: number | null; sayi: number }>;
}

const AdminPanel: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'stats'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [gruplar, setGruplar] = useState<Grup[]>([]);
  const [atamalar, setAtamalar] = useState<YoneticiGrupAtama[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dark mode class'ını body'ye ekle/çıkar
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Cleanup
    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [isDark]);

  // Grup tanımları (Faz4Page ile aynı)
  const grupTanımları: Record<string, string> = {
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

  // Grup kodunu açıklamalı ada çevir
  const getGrupAciklama = (grupKodu: string): string => {
    return grupTanımları[grupKodu] || grupKodu;
  };

  // Yetki değiştirme modalı
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newYetkiSeviyesi, setNewYetkiSeviyesi] = useState<number | null>(null);

  // Grup atama modalı
  const [showGrupAtamaModal, setShowGrupAtamaModal] = useState(false);
  const [selectedYonetici, setSelectedYonetici] = useState<number | null>(null);
  const [selectedGrup, setSelectedGrup] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      };

      if (activeTab === 'users') {
        // Kullanıcıları ve atamaları yükle
        const [usersResponse, atamalarResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/users`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/yonetici-gruplari`, { headers }),
        ]);
        
        if (!usersResponse.ok) throw new Error('Kullanıcılar yüklenemedi');
        if (!atamalarResponse.ok) throw new Error('Atamalar yüklenemedi');
        
        const usersData = await usersResponse.json();
        const atamalarData = await atamalarResponse.json();
        
        setUsers(usersData.users);
        setAtamalar(atamalarData.atamalar);
      } else if (activeTab === 'permissions') {
        // Grupları ve atamaları yükle
        const [gruplanResponse, atamalarResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/gruplar`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/yonetici-gruplari`, { headers }),
        ]);

        if (!gruplanResponse.ok) throw new Error('Gruplar yüklenemedi');
        if (!atamalarResponse.ok) throw new Error('Atamalar yüklenemedi');

        const gruplarData = await gruplanResponse.json();
        const atamalarData = await atamalarResponse.json();

        setGruplar(gruplarData.gruplar);
        setAtamalar(atamalarData.atamalar);
      } else if (activeTab === 'stats') {
        // İstatistikleri yükle
        const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers,
        });
        if (!statsResponse.ok) throw new Error('İstatistikler yüklenemedi');
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleYetkiDegistir = async () => {
    if (!selectedUser || newYetkiSeviyesi === null) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${selectedUser.id}/yetki`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getAuthHeader(),
          },
          body: JSON.stringify({ yetkiSeviyesi: newYetkiSeviyesi }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Yetki güncellenemedi');
      }

      setSuccess(`${selectedUser.username} kullanıcısının yetkisi başarıyla güncellendi!`);
      setSelectedUser(null);
      setNewYetkiSeviyesi(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrupAta = async () => {
    if (!selectedYonetici || !selectedGrup) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/yonetici-gruplari`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify({
          yoneticiId: selectedYonetici,
          grupKodu: selectedGrup,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Grup atanamadı');
      }

      setSuccess('Grup başarıyla atandı!');
      setShowGrupAtamaModal(false);
      setSelectedYonetici(null);
      setSelectedGrup('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrupSil = async (atamaId: number) => {
    if (!window.confirm('Bu grup atamasını silmek istediğinizden emin misiniz?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/yonetici-gruplari/${atamaId}`,
        {
          method: 'DELETE',
          headers: {
            ...authService.getAuthHeader(),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Grup ataması silinemedi');
      }

      setSuccess('Grup ataması başarıyla silindi!');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getYetkiBadgeClass = (yetki: number | null): string => {
    if (yetki === null || yetki === 1) return 'badge-no-permission';
    if (yetki === 2) return 'badge-viewer';
    if (yetki === 3) return 'badge-full';
    if (yetki === 4) return 'badge-admin';
    return 'badge-unknown';
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p className="admin-subtitle">Kullanıcı ve yetki yönetimi</p>
      </div>

      {/* Mesajlar */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
          <button className="alert-close" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Kullanıcılar
        </button>
        <button
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          🔐 Grup Yetkileri
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 İstatistikler
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : (
          <>
            {/* Kullanıcılar Tab */}
            {activeTab === 'users' && (
              <div className="users-section">
                <h2>Kullanıcı Listesi</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Kullanıcı Adı</th>
                      <th>Ad Soyad</th>
                      <th>Email</th>
                      <th>Yetki Seviyesi</th>
                      <th>Atanan Grup</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.full_name || '-'}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${getYetkiBadgeClass(user.yetkiSeviyesi)}`}>
                            {user.yetkiSeviyesi === null ? 'Yok' : user.yetkiSeviyesi}
                          </span>
                          <br />
                          <small>{user.yetkiAciklamasi}</small>
                        </td>
                        <td>
                          {(() => {
                            const userGruplar = atamalar.filter(
                              (atama) => atama.yoneticiId === user.id
                            );
                            
                            if (userGruplar.length === 0) {
                              return <span className="text-muted">-</span>;
                            }
                            
                            return (
                              <div className="grup-badges">
                                {userGruplar.map((atama) => (
                                  <div key={atama.id} className="grup-badge-item">
                                    <span className="badge badge-info" title={atama.grupKodu}>
                                      {getGrupAciklama(atama.grupKodu)}
                                    </span>
                                    <button
                                      className="grup-remove-btn"
                                      onClick={() => handleGrupSil(atama.id)}
                                      title="Grup yetkisini geri al"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          {user.is_active ? (
                            <span className="badge badge-success">Aktif</span>
                          ) : (
                            <span className="badge badge-danger">Pasif</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-small btn-primary"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewYetkiSeviyesi(user.yetkiSeviyesi);
                              }}
                            >
                              Yetki Düzenle
                            </button>
                            {user.yetkiSeviyesi && user.yetkiSeviyesi >= 2 && (
                              <button
                                className="btn-small btn-secondary"
                                onClick={() => {
                                  setSelectedYonetici(user.id);
                                  setSelectedGrup('');
                                  setShowGrupAtamaModal(true);
                                }}
                                title="Bu kullanıcıya grup ata"
                              >
                                + Grup Ekle
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grup Yetkileri Tab */}
            {activeTab === 'permissions' && (
              <div className="permissions-section">
                <div className="section-header">
                  <h2>Grup Yetkilendirmeleri</h2>
                  <button
                    className="btn-primary"
                    onClick={() => setShowGrupAtamaModal(true)}
                  >
                    + Yeni Grup Ata
                  </button>
                </div>

                <div className="gruplar-grid">
                  {/* Mevcut Gruplar */}
                  <div className="card">
                    <h3>📁 Mevcut Gruplar</h3>
                    <div className="grup-list">
                      {gruplar.map((grup) => (
                        <div key={grup.grupKodu} className="grup-item">
                          <div>
                            <span className="grup-kod">{getGrupAciklama(grup.grupKodu)}</span>
                            <br />
                            <small style={{ color: '#999', fontSize: '0.8rem' }}>({grup.grupKodu})</small>
                          </div>
                          <span className="grup-count">{grup.personelSayisi} personel</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Atamalar */}
                  <div className="card card-wide">
                    <h3>🔗 Yönetici-Grup Atamaları</h3>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Yönetici</th>
                          <th>Grup Kodu</th>
                          <th>Yetki Seviyesi</th>
                          <th>Grup Personel Sayısı</th>
                          <th>Atama Tarihi</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atamalar.map((atama) => (
                          <tr key={atama.id}>
                            <td>
                              <strong>{atama.username}</strong>
                              <br />
                              <small>{atama.full_name}</small>
                            </td>
                            <td>
                              <div>
                                <span className="badge badge-info">{getGrupAciklama(atama.grupKodu)}</span>
                                <br />
                                <small style={{ color: '#999', fontSize: '0.8rem' }}>({atama.grupKodu})</small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${getYetkiBadgeClass(atama.yetkiSeviyesi)}`}>
                                {atama.yetkiSeviyesi}
                              </span>
                            </td>
                            <td>{atama.grupPersonelSayisi} personel</td>
                            <td>{new Date(atama.atamaTarihi).toLocaleDateString('tr-TR')}</td>
                            <td>
                              <button
                                className="btn-small btn-danger"
                                onClick={() => handleGrupSil(atama.id)}
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* İstatistikler Tab */}
            {activeTab === 'stats' && stats && (
              <div className="stats-section">
                <h2>Sistem İstatistikleri</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{stats.toplamKullanici}</div>
                    <div className="stat-label">Toplam Kullanıcı</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📁</div>
                    <div className="stat-value">{stats.toplamGrup}</div>
                    <div className="stat-label">Toplam Grup</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👨‍💼</div>
                    <div className="stat-value">{stats.toplamPersonel}</div>
                    <div className="stat-label">Toplam Personel</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔗</div>
                    <div className="stat-value">{stats.toplamAtama}</div>
                    <div className="stat-label">Toplam Atama</div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: '2rem' }}>
                  <h3>Yetki Dağılımı</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Yetki Seviyesi</th>
                        <th>Açıklama</th>
                        <th>Kullanıcı Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.yetkiDagilimi.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <span className={`badge ${getYetkiBadgeClass(item.yetkiSeviyesi)}`}>
                              {item.yetkiSeviyesi === null ? 'Yok' : item.yetkiSeviyesi}
                            </span>
                          </td>
                          <td>
                            {item.yetkiSeviyesi === null && 'Yetki Yok'}
                            {item.yetkiSeviyesi === 1 && 'Temel Kullanıcı'}
                            {item.yetkiSeviyesi === 2 && 'Rapor Görüntüleyici (Faz5)'}
                            {item.yetkiSeviyesi === 3 && 'Tam Yetkili (Faz4+Faz5)'}
                            {item.yetkiSeviyesi === 4 && 'Admin'}
                          </td>
                          <td>{item.sayi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Yetki Düzenleme Modalı */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yetki Düzenle</h3>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Kullanıcı:</strong> {selectedUser.username} ({selectedUser.full_name})
              </p>
              <p>
                <strong>Mevcut Yetki:</strong> {selectedUser.yetkiAciklamasi}
              </p>

              <div className="form-group">
                <label>Yeni Yetki Seviyesi:</label>
                <select
                  value={newYetkiSeviyesi === null ? '' : newYetkiSeviyesi}
                  onChange={(e) =>
                    setNewYetkiSeviyesi(e.target.value === '' ? null : parseInt(e.target.value))
                  }
                  className="form-control"
                >
                  <option value="">Yetki Yok</option>
                  <option value="1">1 - Temel Kullanıcı</option>
                  <option value="2">2 - Rapor Görüntüleyici (Faz5)</option>
                  <option value="3">3 - Tam Yetkili (Faz4+Faz5)</option>
                  <option value="4">4 - Admin</option>
                </select>
              </div>

              <div className="yetki-aciklama">
                <h4>Yetki Seviyeleri:</h4>
                <ul>
                  <li><strong>Yok/1:</strong> Sadece giriş yapabilir, Faz4/Faz5 erişimi yok</li>
                  <li><strong>2:</strong> Sadece Faz5 (Rapor görüntüleme)</li>
                  <li><strong>3:</strong> Faz4 + Faz5 (Rapor oluşturma ve görüntüleme)</li>
                  <li><strong>4:</strong> Admin (Tüm yetkilere + Admin Paneline erişim)</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedUser(null)}>
                İptal
              </button>
              <button
                className="btn-primary"
                onClick={handleYetkiDegistir}
                disabled={loading}
              >
                {loading ? 'Güncelleniyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grup Atama Modalı */}
      {showGrupAtamaModal && (
        <div className="modal-overlay" onClick={() => setShowGrupAtamaModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yöneticiye Grup Ata</h3>
              <button className="modal-close" onClick={() => setShowGrupAtamaModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Yönetici Seçin:</label>
                <select
                  value={selectedYonetici || ''}
                  onChange={(e) => {
                    setSelectedYonetici(parseInt(e.target.value));
                    setSelectedGrup(''); // Yönetici değişince grup seçimini sıfırla
                  }}
                  className="form-control"
                >
                  <option value="">Seçiniz...</option>
                  {users
                    .filter((u) => u.yetkiSeviyesi && u.yetkiSeviyesi >= 2)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.full_name}) - Yetki: {user.yetkiSeviyesi}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Grup Seçin:</label>
                <select
                  value={selectedGrup}
                  onChange={(e) => setSelectedGrup(e.target.value)}
                  className="form-control"
                >
                  <option value="">Seçiniz...</option>
                  {gruplar
                    .filter((grup) => {
                      // Eğer yönetici seçilmemişse tüm grupları göster
                      if (!selectedYonetici) return true;
                      
                      // Seçilen yöneticiye zaten atanmış olan grupları filtrele
                      const yoneticiAtamalari = atamalar.filter(
                        (atama) => atama.yoneticiId === selectedYonetici
                      );
                      const atanmisGruplar = yoneticiAtamalari.map((a) => a.grupKodu);
                      
                      // Bu grup zaten atanmamışsa göster
                      return !atanmisGruplar.includes(grup.grupKodu);
                    })
                    .map((grup) => (
                      <option key={grup.grupKodu} value={grup.grupKodu}>
                        {getGrupAciklama(grup.grupKodu)} - {grup.grupKodu} ({grup.personelSayisi} personel)
                      </option>
                    ))}
                </select>
                {selectedYonetici && gruplar.filter((grup) => {
                  const yoneticiAtamalari = atamalar.filter(
                    (atama) => atama.yoneticiId === selectedYonetici
                  );
                  const atanmisGruplar = yoneticiAtamalari.map((a) => a.grupKodu);
                  return !atanmisGruplar.includes(grup.grupKodu);
                }).length === 0 && (
                  <small style={{ color: '#f44336', marginTop: '0.5rem', display: 'block' }}>
                    Bu yöneticiye tüm gruplar zaten atanmış.
                  </small>
                )}
              </div>

              <div className="info-box">
                <p>
                  ℹ️ <strong>Bir yöneticiye birden fazla grup atanabilir.</strong><br />
                  Yönetici, kendisine atanan tüm gruplardaki personelleri
                  görebilecek ve raporlarını oluşturabilecektir.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowGrupAtamaModal(false)}
              >
                İptal
              </button>
              <button
                className="btn-primary"
                onClick={handleGrupAta}
                disabled={!selectedYonetici || !selectedGrup || loading}
              >
                {loading ? 'Atanıyor...' : 'Grup Ata'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

