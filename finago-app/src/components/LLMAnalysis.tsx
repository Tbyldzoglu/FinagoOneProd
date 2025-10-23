/**
 * LLM Analiz Sayfası Bileşeni
 * Manuel/LLM tabanlı döküman analizi için modern interface
 * Word dokümanı benzeri hierarşik yapı
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import '../styles/LLMAnalysis.css';
import Footer from './Footer';

// DOCX parsing hooks - Tüm modal içeriklerini toplamak için
import { useAmacKapsam } from '../hooks/useAmacKapsam';
import { useMevcutIsleyis } from '../hooks/useMevcutIsleyis';
import { usePlanlananIsleyis } from '../hooks/usePlanlananIsleyis';
import { useFonksiyonelGereksinimler } from '../hooks/useFonksiyonelGereksinimler';
import { useEkranGereksinimleri } from '../hooks/useEkranGereksinimleri';
import { useXEkrani } from '../hooks/useXEkrani';
import { useTaskIsAkisiText } from '../hooks/useTaskIsAkisiText';
import { useConversionMigrationText } from '../hooks/useConversionMigrationText';
import { useDiagramAkislarText } from '../hooks/useDiagramAkislarText';
import { useMuhasebeText } from '../hooks/useMuhasebeText';
import { useXIslemiMuhasebeDeseniText } from '../hooks/useXIslemiMuhasebeDeseniText';
import { useXIslemiKayitKurallariText } from '../hooks/useXIslemiKayitKurallariText';
import { useXIslemiVergiKomisyonText } from '../hooks/useXIslemiVergiKomisyonText';
import { useXIslemiMuhasebeSenaryolariText } from '../hooks/useXIslemiMuhasebeSenaryolariText';
import { useXIslemiOrnekKayitlarText } from '../hooks/useXIslemiOrnekKayitlarText';
import { useFonksiyonelOlmayanGereksinimlerText } from '../hooks/useFonksiyonelOlmayanGereksinimlerText';
import { useKimlikDogrulamaLogText } from '../hooks/useKimlikDogrulamaLogText';
import { useKapsamDisindaText } from '../hooks/useKapsamDisindaText';
import { useEklerText } from '../hooks/useEklerText';

// Tablo parsing hooks - Modal tablolarını toplamak için
import { useEkranTasarimlari } from '../hooks/useEkranTasarimlari';
import { useTasklarBatchlar } from '../hooks/useTasklarBatchlar';
import { useTasklarBatchlarText } from '../hooks/useTasklarBatchlarText';
import { useEntegrasyonlar } from '../hooks/useEntegrasyonlar';
import { useMesajlar } from '../hooks/useMesajlar';
import { useParametreler } from '../hooks/useParametreler';
import { useTalepBilgileri } from '../hooks/useTalepBilgileri';
import { useDocumentHistory } from '../hooks/useDocumentHistory';
import { useTalepDegerlendirmesi } from '../hooks/useTalepDegerlendirmesi';
import { useKabulKriterleri } from '../hooks/useKabulKriterleri';
import { useOnaylar } from '../hooks/useOnaylar';
import { useOnaySureci } from '../hooks/useOnaySureci';
import { usePaydaslarKullanicilar } from '../hooks/usePaydaslarKullanicilar';
import { useVeriKritikligi } from '../hooks/useVeriKritikligi';
import { useYetkilendirme } from '../hooks/useYetkilendirme';
import { useXIslemiMuhasebe } from '../hooks/useXIslemiMuhasebe';
import { useXIslemiMuhasebeModal } from '../hooks/useXIslemiMuhasebeModal';
import { useEkranTasarimText } from '../hooks/useEkranTasarimText';
import { saveAnalizFaz1, updateAnalizFaz1 } from '../services/analizService';
import { exportAndDownload } from '../services/wordExportService';
import { loadLatestAnalysisData, loadDataToHooks } from '../services/dataLoaderService';
import { saveAllModalContents, GlobalSaveResult, ModalSaveFunction } from '../services/globalSaveService';
import { getContentFromStorage } from '../services/contentLoaderService';
import { hasUnsavedChanges, debugModalStates } from '../services/modalChangeTracker';
import EditSectionModal from './EditSectionModal';
import DocumentHistoryModal from './DocumentHistoryModal';
import SectionChatModal from './SectionChatModal';
import TalepDegerlendirmesiModal from './TalepDegerlendirmesiModal';
import EkranTasarimlariModal from './EkranTasarimlariModal';
import TasklarBatchlarModal from './TasklarBatchlarModal';
import EntegrasyonlarModal from './EntegrasyonlarModal';
import MesajlarModal from './MesajlarModal';
import ParametrelerModal from './ParametrelerModal';
import ConversionMigrationModal from './ConversionMigrationModal';
import DiagramAkislarModal from './DiagramAkislarModal';
import XIslemiMuhasebeModal from './XIslemiMuhasebeModal';
import XIslemiMuhasebeDeseniModal from './XIslemiMuhasebeDeseniModal';
import MuhasebeModal from './MuhasebeModal';
import Case1Modal from './Case1Modal';
import XIslemiKayitKurallariModal from './XIslemiKayitKurallariModal';
import XIslemiVergiKomisyonModal from './XIslemiVergiKomisyonModal';
import XIslemiMuhasebeSenaryolariModal from './XIslemiMuhasebeSenaryolariModal';
import XIslemiOrnekKayitlarModal from './XIslemiOrnekKayitlarModal';
import FonksiyonelOlmayanGereksinimlerModal from './FonksiyonelOlmayanGereksinimlerModal';
import KimlikDogrulamaLogModal from './KimlikDogrulamaLogModal';
import YetkilendirmeOnayModal from './YetkilendirmeOnayModal';
import VeriKritikligiModal from './VeriKritikligiModal';
import PaydaslarKullanicilarModal from './PaydaslarKullanicilarModal';
import KapsamDisindaModal from './KapsamDisindaModal';
import KabulKriterleriModal from './KabulKriterleriModal';
import OnaylarModal from './OnaylarModal';
import EklerModal from './EklerModal';

interface AnalysisStats {
  totalSections: number;
  completedPercentage: number;
  remainingTime: string;
}

const LLMAnalysis: React.FC = React.memo(() => {
  // DOCX parsing hooks - Tüm modal içeriklerini toplamak için
  const amacKapsamHook = useAmacKapsam();
  const mevcutIsleyisHook = useMevcutIsleyis();
  const planlananIsleyisHook = usePlanlananIsleyis();
  const fonksiyonelGereksinimlerHook = useFonksiyonelGereksinimler();
  const ekranGereksinimlerHook = useEkranGereksinimleri();
  const xEkraniHook = useXEkrani();
  const taskIsAkisiHook = useTaskIsAkisiText();
  const conversionMigrationHook = useConversionMigrationText();
  const diagramAkislarHook = useDiagramAkislarText();
  const muhasebeHook = useMuhasebeText();
  const xIslemiMuhasebeDeseniHook = useXIslemiMuhasebeDeseniText();
  const xIslemiKayitKurallariHook = useXIslemiKayitKurallariText();
  const xIslemiVergiKomisyonHook = useXIslemiVergiKomisyonText();
  const xIslemiMuhasebeSenaryolariHook = useXIslemiMuhasebeSenaryolariText();
  const xIslemiOrnekKayitlarHook = useXIslemiOrnekKayitlarText();
  const fonksiyonelOlmayanGereksinimlerHook = useFonksiyonelOlmayanGereksinimlerText();
  const kimlikDogrulamaLogHook = useKimlikDogrulamaLogText();
  const kapsamDisindaHook = useKapsamDisindaText();
  const eklerHook = useEklerText();

  // Tablo parsing hooks - Tablolu modaller için
  const ekranTasarimlariTableHook = useEkranTasarimlari();
  const tasklarBatchlarTableHook = useTasklarBatchlar();
  const tasklarBatchlarTextHook = useTasklarBatchlarText();
  const entegrasyonlarHook = useEntegrasyonlar();
  const mesajlarHook = useMesajlar();
  const parametrelerHook = useParametreler();
  
  // Eksik olan hook'lar - Talep modalleri için
  const talepBilgileriHook = useTalepBilgileri();
  const documentHistoryHook = useDocumentHistory();
  const talepDegerlendirmesiHook = useTalepDegerlendirmesi();
  
  // Diğer eksik hook'lar
  const kabulKriterleriHook = useKabulKriterleri();
  const onaylarHook = useOnaylar();
  const onaySureciHook = useOnaySureci();
  const paydaslarKullanicilarHook = usePaydaslarKullanicilar();
  const veriKritikligiHook = useVeriKritikligi();
  const yetkilendirmeHook = useYetkilendirme();
  const xIslemiMuhasebeHook = useXIslemiMuhasebe();
  const xIslemiMuhasebeModalHook = useXIslemiMuhasebeModal();
  const ekranTasarimTextHook = useEkranTasarimText();

  // State yönetimi
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentVersion, setDocumentVersion] = useState<string>('1.0');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  
  // Word Export state'leri
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Analiz istatistikleri - useMemo ile optimize
  const analysisStats: AnalysisStats = useMemo(() => ({
    totalSections: 37,
    completedPercentage: 60,
    remainingTime: '21:41'
  }), []);

  // Döküman seçenekleri - useMemo ile optimize
  const documentOptions = useMemo(() => [
    'Döküman seçin...',
    'Mali Tablo Analizi 2024',
    'Risk Değerlendirme Raporu',
    'Uygunluk Denetim Dosyası',
    'Müşteri KYC Dokümantasyonu'
  ], []);

  // Optimized handlers
  const handleDocumentTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTitle(e.target.value);
  }, []);

  const handleDocumentVersionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentVersion(e.target.value);
  }, []);

  const handleSelectedDocumentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocument(e.target.value);
  }, []);

  // Tüm modal içeriklerini toplayan fonksiyon
  const getAllModalContents = useCallback(() => {
    // Debug: Hook durumlarını kontrol et
    console.log('🔍 Hook Debug - Amaç Kapsam:', {
      content: amacKapsamHook.content?.substring(0, 100),
      isProcessed: amacKapsamHook.isProcessed,
      isLoading: amacKapsamHook.isLoading,
      validation: amacKapsamHook.validation
    });
    
    return {
      // Text-based modals
      'amac-kapsam': {
        title: 'Amaç ve Kapsam',
        content: amacKapsamHook.content,
        validation: amacKapsamHook.validation,
        isLoading: amacKapsamHook.isLoading,
        isProcessed: amacKapsamHook.isProcessed
      },
      'mevcut-isleyis': {
        title: 'Mevcut İşleyiş',
        content: mevcutIsleyisHook.content,
        validation: mevcutIsleyisHook.validation,
        isLoading: mevcutIsleyisHook.isLoading,
        isProcessed: mevcutIsleyisHook.isProcessed
      },
      'planlanan-isleyis': {
        title: 'Planlanan İşleyiş',
        content: planlananIsleyisHook.content,
        validation: planlananIsleyisHook.validation,
        isLoading: planlananIsleyisHook.isLoading,
        isProcessed: planlananIsleyisHook.isProcessed
      },
      'fonksiyonel-gereksinimler': {
        title: 'Fonksiyonel Gereksinimler',
        content: fonksiyonelGereksinimlerHook.content,
        validation: fonksiyonelGereksinimlerHook.validation,
        isLoading: fonksiyonelGereksinimlerHook.isLoading,
        isProcessed: fonksiyonelGereksinimlerHook.isProcessed
      },
      'ekran-gereksinimleri': {
        title: 'Ekran Gereksinimleri',
        content: ekranGereksinimlerHook.content,
        validation: ekranGereksinimlerHook.validation,
        isLoading: ekranGereksinimlerHook.isLoading,
        isProcessed: ekranGereksinimlerHook.isProcessed
      },
      'x-ekrani': {
        title: 'X Ekranı',
        content: xEkraniHook.content,
        validation: xEkraniHook.validation,
        isLoading: xEkraniHook.isLoading,
        isProcessed: xEkraniHook.isProcessed
      },
      'task-is-akisi': {
        title: 'Task İş Akışı',
        content: taskIsAkisiHook.content,
        validation: taskIsAkisiHook.validation,
        isLoading: taskIsAkisiHook.isLoading,
        isProcessed: taskIsAkisiHook.isProcessed
      },
      'conversion-migration': {
        title: 'Conversion ve Migration',
        content: conversionMigrationHook.content,
        validation: conversionMigrationHook.validation,
        isLoading: conversionMigrationHook.isLoading,
        isProcessed: conversionMigrationHook.isProcessed
      },
      'diagram-akislar': {
        title: 'Diagram ve Akışlar',
        content: diagramAkislarHook.content,
        validation: diagramAkislarHook.validation,
        isLoading: diagramAkislarHook.isLoading,
        isProcessed: diagramAkislarHook.isProcessed
      },
      'muhasebe': {
        title: 'Muhasebe',
        content: muhasebeHook.content,
        validation: muhasebeHook.validation,
        isLoading: muhasebeHook.isLoading,
        isProcessed: muhasebeHook.isProcessed
      },
      'x-islemi-muhasebe-deseni': {
        title: 'X İşlemi Muhasebe Deseni',
        content: xIslemiMuhasebeDeseniHook.content,
        validation: xIslemiMuhasebeDeseniHook.validation,
        isLoading: xIslemiMuhasebeDeseniHook.isLoading,
        isProcessed: xIslemiMuhasebeDeseniHook.isProcessed
      },
      'x-islemi-kayit-kurallari': {
        title: 'X İşlemi Kayıt Kuralları',
        content: xIslemiKayitKurallariHook.content,
        validation: xIslemiKayitKurallariHook.validation,
        isLoading: xIslemiKayitKurallariHook.isLoading,
        isProcessed: xIslemiKayitKurallariHook.isProcessed
      },
      'x-islemi-vergi-komisyon': {
        title: 'X İşlemi Vergi / Komisyon',
        content: xIslemiVergiKomisyonHook.content,
        validation: xIslemiVergiKomisyonHook.validation,
        isLoading: xIslemiVergiKomisyonHook.isLoading,
        isProcessed: xIslemiVergiKomisyonHook.isProcessed
      },
      'x-islemi-muhasebe-senaryolari': {
        title: 'X İşlemi Muhasebe Senaryoları',
        content: xIslemiMuhasebeSenaryolariHook.content,
        validation: xIslemiMuhasebeSenaryolariHook.validation,
        isLoading: xIslemiMuhasebeSenaryolariHook.isLoading,
        isProcessed: xIslemiMuhasebeSenaryolariHook.isProcessed
      },
      'x-islemi-ornek-kayitlar': {
        title: 'X İşlemi Örnek Kayıtlar',
        content: xIslemiOrnekKayitlarHook.content,
        validation: xIslemiOrnekKayitlarHook.validation,
        isLoading: xIslemiOrnekKayitlarHook.isLoading,
        isProcessed: xIslemiOrnekKayitlarHook.isProcessed
      },
      'fonksiyonel-olmayan-gereksinimler': {
        title: 'Fonksiyonel Olmayan Gereksinimler',
        content: fonksiyonelOlmayanGereksinimlerHook.content,
        validation: fonksiyonelOlmayanGereksinimlerHook.validation,
        isLoading: fonksiyonelOlmayanGereksinimlerHook.isLoading,
        isProcessed: fonksiyonelOlmayanGereksinimlerHook.isProcessed
      },
      'kimlik-dogrulama-log': {
        title: 'Kimlik Doğrulama ve Log Yönetimi',
        content: kimlikDogrulamaLogHook.content,
        validation: kimlikDogrulamaLogHook.validation,
        isLoading: kimlikDogrulamaLogHook.isLoading,
        isProcessed: kimlikDogrulamaLogHook.isProcessed
      },
      'kapsam-disinda': {
        title: 'Kapsam Dışında Kalan Konular / Maddeler',
        content: kapsamDisindaHook.content,
        validation: kapsamDisindaHook.validation,
        isLoading: kapsamDisindaHook.isLoading,
        isProcessed: kapsamDisindaHook.isProcessed
      },
      'ekler': {
        title: 'Ekler',
        content: eklerHook.content,
        validation: eklerHook.validation,
        isLoading: eklerHook.isLoading,
        isProcessed: eklerHook.isProcessed
      },
      // Table-based modals
      'ekran-tasarimlari': {
        title: 'Ekran Tasarımları',
        tableData: ekranTasarimlariTableHook.formData,
        validation: ekranTasarimlariTableHook.validation,
        isProcessed: ekranTasarimlariTableHook.isProcessed,
        isLoading: ekranTasarimlariTableHook.isLoading
      },
      'tasklar-batchlar': {
        title: 'Tasklar/Batchlar',
        tableData: tasklarBatchlarTableHook.formData,
        textContent: tasklarBatchlarTextHook.content,
        tableValidation: tasklarBatchlarTableHook.validation,
        textValidation: tasklarBatchlarTextHook.validation,
        isTableProcessed: tasklarBatchlarTableHook.isProcessed,
        isTextProcessed: tasklarBatchlarTextHook.isProcessed,
        isTableLoading: tasklarBatchlarTableHook.isLoading,
        isTextLoading: tasklarBatchlarTextHook.isLoading
      },
      'entegrasyonlar': {
        title: 'Entegrasyonlar',
        tableData: entegrasyonlarHook.entegrasyonlar,
        validation: entegrasyonlarHook.validation,
        isProcessed: entegrasyonlarHook.isProcessed,
        isLoading: entegrasyonlarHook.isLoading
      },
      'mesajlar': {
        title: 'Mesajlar',
        tableData: mesajlarHook.mesajlar,
        validation: mesajlarHook.validation,
        isProcessed: mesajlarHook.isProcessed,
        isLoading: mesajlarHook.isLoading
      },
      'parametreler': {
        title: 'Parametreler',
        tableData: parametrelerHook.parametreler,
        validation: parametrelerHook.validation,
        isProcessed: parametrelerHook.isProcessed,
        isLoading: parametrelerHook.isLoading
      },
      
      // Eksik olan tablolar - Talep modalleri
      'talep-bilgileri': {
        title: 'Talep Bilgileri',
        tableData: talepBilgileriHook.fields,
        validation: talepBilgileriHook.validation,
        isLoading: talepBilgileriHook.isLoading,
        isProcessed: talepBilgileriHook.isProcessed
      },
      'document-history': {
        title: 'Doküman Tarihçesi',
        tableData: documentHistoryHook.rows,
        validation: documentHistoryHook.validation,
        isLoading: documentHistoryHook.isLoading,
        isProcessed: documentHistoryHook.isProcessed
      },
      'talep-degerlendirmesi': {
        title: 'Talep Değerlendirmesi',
        tableData: talepDegerlendirmesiHook.formData,
        validation: talepDegerlendirmesiHook.validation,
        isLoading: talepDegerlendirmesiHook.isLoading,
        isProcessed: talepDegerlendirmesiHook.isProcessed
      },
      
      // Diğer eksik olan modaller
      'kabul-kriterleri': {
        title: 'Kabul Kriterleri',
        tableData: kabulKriterleriHook.tableRows,
        validation: kabulKriterleriHook.parseResult,
        isLoading: kabulKriterleriHook.isLoading,
        isProcessed: kabulKriterleriHook.isProcessed
      },
      'onaylar': {
        title: 'Onaylar',
        tableData: onaylarHook.tableRows,
        validation: onaylarHook.parseResult,
        isLoading: onaylarHook.isLoading,
        isProcessed: onaylarHook.isProcessed
      },
      'onay-sureci': {
        title: 'Onay Süreci',
        tableData: onaySureciHook.onaySureciRows,
        validation: onaySureciHook.validation,
        isLoading: onaySureciHook.isLoading,
        isProcessed: onaySureciHook.isProcessed
      },
      'paydaslar-kullanicilar': {
        title: 'Paydaşlar ve Kullanıcılar',
        tableData: paydaslarKullanicilarHook.formData,
        validation: paydaslarKullanicilarHook.validation,
        isLoading: paydaslarKullanicilarHook.isLoading,
        isProcessed: paydaslarKullanicilarHook.isProcessed
      },
      'veri-kritikligi': {
        title: 'Veri Kritikliği',
        tableData: veriKritikligiHook.tableRows,
        validation: veriKritikligiHook.validation,
        isLoading: veriKritikligiHook.isLoading,
        isProcessed: veriKritikligiHook.isProcessed
      },
      'yetkilendirme': {
        title: 'Yetkilendirme',
        tableData: yetkilendirmeHook.yetkilendirmeRows,
        validation: yetkilendirmeHook.validation,
        isLoading: yetkilendirmeHook.isLoading,
        isProcessed: yetkilendirmeHook.isProcessed
      },
      'x-islemi-muhasebe-modal': {
        title: 'X İşlemi Muhasebe Modal',
        tableData: xIslemiMuhasebeModalHook.formData,
        validation: xIslemiMuhasebeModalHook.validation,
        isLoading: xIslemiMuhasebeModalHook.isLoading,
        isProcessed: xIslemiMuhasebeModalHook.isProcessed
      },
      'ekran-tasarim-text': {
        title: 'Ekran Tasarım Text',
        content: ekranTasarimTextHook.content,
        validation: ekranTasarimTextHook.validation,
        isLoading: ekranTasarimTextHook.isLoading,
        isProcessed: ekranTasarimTextHook.isProcessed
      }
    };
  }, [
    amacKapsamHook.content, amacKapsamHook.validation, amacKapsamHook.isLoading, amacKapsamHook.isProcessed,
    mevcutIsleyisHook.content, mevcutIsleyisHook.validation, mevcutIsleyisHook.isLoading, mevcutIsleyisHook.isProcessed,
    planlananIsleyisHook.content, planlananIsleyisHook.validation, planlananIsleyisHook.isLoading, planlananIsleyisHook.isProcessed,
    fonksiyonelGereksinimlerHook.content, fonksiyonelGereksinimlerHook.validation, fonksiyonelGereksinimlerHook.isLoading, fonksiyonelGereksinimlerHook.isProcessed,
    ekranGereksinimlerHook.content, ekranGereksinimlerHook.validation, ekranGereksinimlerHook.isLoading, ekranGereksinimlerHook.isProcessed,
    xEkraniHook.content, xEkraniHook.validation, xEkraniHook.isLoading, xEkraniHook.isProcessed,
    taskIsAkisiHook.content, taskIsAkisiHook.validation, taskIsAkisiHook.isLoading, taskIsAkisiHook.isProcessed,
    conversionMigrationHook.content, conversionMigrationHook.validation, conversionMigrationHook.isLoading, conversionMigrationHook.isProcessed,
    diagramAkislarHook.content, diagramAkislarHook.validation, diagramAkislarHook.isLoading, diagramAkislarHook.isProcessed,
    muhasebeHook.content, muhasebeHook.validation, muhasebeHook.isLoading, muhasebeHook.isProcessed,
    xIslemiMuhasebeDeseniHook.content, xIslemiMuhasebeDeseniHook.validation, xIslemiMuhasebeDeseniHook.isLoading, xIslemiMuhasebeDeseniHook.isProcessed,
    xIslemiKayitKurallariHook.content, xIslemiKayitKurallariHook.validation, xIslemiKayitKurallariHook.isLoading, xIslemiKayitKurallariHook.isProcessed,
    xIslemiVergiKomisyonHook.content, xIslemiVergiKomisyonHook.validation, xIslemiVergiKomisyonHook.isLoading, xIslemiVergiKomisyonHook.isProcessed,
    xIslemiMuhasebeSenaryolariHook.content, xIslemiMuhasebeSenaryolariHook.validation, xIslemiMuhasebeSenaryolariHook.isLoading, xIslemiMuhasebeSenaryolariHook.isProcessed,
    xIslemiOrnekKayitlarHook.content, xIslemiOrnekKayitlarHook.validation, xIslemiOrnekKayitlarHook.isLoading, xIslemiOrnekKayitlarHook.isProcessed,
    fonksiyonelOlmayanGereksinimlerHook.content, fonksiyonelOlmayanGereksinimlerHook.validation, fonksiyonelOlmayanGereksinimlerHook.isLoading, fonksiyonelOlmayanGereksinimlerHook.isProcessed,
    kimlikDogrulamaLogHook.content, kimlikDogrulamaLogHook.validation, kimlikDogrulamaLogHook.isLoading, kimlikDogrulamaLogHook.isProcessed,
    yetkilendirmeHook.yetkilendirmeRows, yetkilendirmeHook.validation, yetkilendirmeHook.isLoading, yetkilendirmeHook.isProcessed,
    onaySureciHook.onaySureciRows, onaySureciHook.validation, onaySureciHook.isLoading, onaySureciHook.isProcessed,
    veriKritikligiHook.tableRows, veriKritikligiHook.validation, veriKritikligiHook.isLoading, veriKritikligiHook.isProcessed,
    paydaslarKullanicilarHook.formData, paydaslarKullanicilarHook.validation, paydaslarKullanicilarHook.isLoading, paydaslarKullanicilarHook.isProcessed,
    kapsamDisindaHook.content, kapsamDisindaHook.validation, kapsamDisindaHook.isLoading, kapsamDisindaHook.isProcessed,
    eklerHook.content, eklerHook.validation, eklerHook.isLoading, eklerHook.isProcessed,
    // Tablo hook dependencies
    ekranTasarimlariTableHook.formData, ekranTasarimlariTableHook.validation, ekranTasarimlariTableHook.isLoading, ekranTasarimlariTableHook.isProcessed,
    tasklarBatchlarTableHook.formData, tasklarBatchlarTableHook.validation, tasklarBatchlarTableHook.isLoading, tasklarBatchlarTableHook.isProcessed,
    tasklarBatchlarTextHook.content, tasklarBatchlarTextHook.validation, tasklarBatchlarTextHook.isLoading, tasklarBatchlarTextHook.isProcessed,
    entegrasyonlarHook.entegrasyonlar, entegrasyonlarHook.validation, entegrasyonlarHook.isLoading, entegrasyonlarHook.isProcessed,
    mesajlarHook.mesajlar, mesajlarHook.validation, mesajlarHook.isLoading, mesajlarHook.isProcessed,
    parametrelerHook.parametreler, parametrelerHook.validation, parametrelerHook.isLoading, parametrelerHook.isProcessed,
    // Eksik olan hook'ların dependencies
    talepBilgileriHook.fields, talepBilgileriHook.validation, talepBilgileriHook.isLoading, talepBilgileriHook.isProcessed,
    documentHistoryHook.rows, documentHistoryHook.validation, documentHistoryHook.isLoading, documentHistoryHook.isProcessed,
    talepDegerlendirmesiHook.formData, talepDegerlendirmesiHook.validation, talepDegerlendirmesiHook.isLoading, talepDegerlendirmesiHook.isProcessed,
    // Diğer eksik hook'ların dependencies
    kabulKriterleriHook.tableRows, kabulKriterleriHook.parseResult, kabulKriterleriHook.isLoading, kabulKriterleriHook.isProcessed,
    onaylarHook.tableRows, onaylarHook.parseResult, onaylarHook.isLoading, onaylarHook.isProcessed,
    onaySureciHook.onaySureciRows, onaySureciHook.validation, onaySureciHook.isLoading, onaySureciHook.isProcessed,
    paydaslarKullanicilarHook.formData, paydaslarKullanicilarHook.validation, paydaslarKullanicilarHook.isLoading, paydaslarKullanicilarHook.isProcessed,
    veriKritikligiHook.tableRows, veriKritikligiHook.validation, veriKritikligiHook.isLoading, veriKritikligiHook.isProcessed,
    yetkilendirmeHook.yetkilendirmeRows, yetkilendirmeHook.validation, yetkilendirmeHook.isLoading, yetkilendirmeHook.isProcessed,
    xIslemiMuhasebeModalHook.formData, xIslemiMuhasebeModalHook.validation, xIslemiMuhasebeModalHook.isLoading, xIslemiMuhasebeModalHook.isProcessed,
    ekranTasarimTextHook.content, ekranTasarimTextHook.validation, ekranTasarimTextHook.isLoading, ekranTasarimTextHook.isProcessed
  ]);


  // Progress ring calculation - useMemo ile optimize
  const progressRingProps = useMemo(() => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - analysisStats.completedPercentage / 100);
    return { circumference, offset };
  }, [analysisStats.completedPercentage]);

  // Debounced scroll handler for better performance (passive)
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{id: string, title: string} | null>(null);
  const [buttonPosition, setButtonPosition] = useState<{x: number, y: number} | undefined>(undefined);
  
  // Doküman tarihçesi modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistorySection, setSelectedHistorySection] = useState<{id: string, title: string} | null>(null);
  
  // Section chat modal state
  const [isSectionChatOpen, setIsSectionChatOpen] = useState(false);
  const [selectedChatSection, setSelectedChatSection] = useState<{id: string, title: string} | null>(null);
  
  // Talep değerlendirmesi modal state
  const [isTalepModalOpen, setIsTalepModalOpen] = useState(false);
  const [selectedTalepSection, setSelectedTalepSection] = useState<{id: string, title: string} | null>(null);
  
  // Talep Bilgileri DOCX modal state
  const [isTalepBilgileriModalOpen, setIsTalepBilgileriModalOpen] = useState(false);
  const [selectedDocxFile, setSelectedDocxFile] = useState<File | null>(null);
  const [isTransferMode, setIsTransferMode] = useState(false);

  // Global Save state'leri
  const [isGlobalSaving, setIsGlobalSaving] = useState<boolean>(false);
  const [globalSaveResult, setGlobalSaveResult] = useState<GlobalSaveResult | null>(null);

  // Global Save handler - Tüm modalları kaydet
  const handleGlobalSave = useCallback(async () => {
    if (!selectedDocxFile) {
      alert('⚠️ Önce bir doküman seçin');
      return;
    }

    setIsGlobalSaving(true);
    setGlobalSaveResult(null);

    try {
      // Tüm modal kaydet fonksiyonlarını topla
      const modalSaveFunctions: ModalSaveFunction[] = [];

      // Text-based modallar - localStorage'dan al
      const textModals = [
        { id: 'amac-kapsam', title: 'Amaç ve Kapsam', dbField: 'amac_kapsam' },
        { id: 'mevcut-isleyis', title: 'Mevcut İşleyiş', dbField: 'mevcut_isleyis' },
        { id: 'planlanan-isleyis', title: 'Planlanan İşleyiş', dbField: 'planlanan_isleyis' },
        { id: 'fonksiyonel-gereksinimler', title: 'Fonksiyonel Gereksinimler', dbField: 'fonksiyonel_gereksinimler' },
        { id: 'ekran-gereksinimleri', title: 'Ekran Gereksinimleri', dbField: 'ekran_gereksinimleri' },
        { id: 'x-ekrani', title: 'X Ekranı', dbField: 'x_ekrani' },
        { id: 'task-is-akisi', title: 'Task İş Akışı', dbField: 'task_is_akisi' },
        { id: 'conversation-migration', title: 'Conversion ve Migration', dbField: 'conversation_migration' },
        { id: 'diagram-akislar', title: 'Diagram ve Akışlar', dbField: 'diagram_akislar' },
        { id: 'muhasebe', title: 'Muhasebe', dbField: 'muhasebe' },
        { id: 'x-islemi-muhasebe-deseni', title: 'X İşlemi Muhasebe Deseni', dbField: 'x_islemi_muhasebe_deseni' },
        { id: 'x-islemi-kayit-kurallari', title: 'X İşlemi Kayıt Kuralları', dbField: 'x_islemi_kayit_kurallari' },
        { id: 'x-islemi-vergi-komisyon', title: 'X İşlemi Vergi Komisyon', dbField: 'x_islemi_vergi_komisyon' },
        { id: 'x-islemi-muhasebe-senaryolari', title: 'X İşlemi Muhasebe Senaryoları', dbField: 'x_islemi_muhasebe_senaryolari' },
        { id: 'x-islemi-ornek-kayitlar', title: 'X İşlemi Örnek Kayıtlar', dbField: 'x_islemi_ornek_kayitlar' },
        { id: 'fonksiyonel-olmayan-gereksinimler', title: 'Fonksiyonel Olmayan Gereksinimler', dbField: 'fonksiyonel_olmayan_gereksinimler' },
        { id: 'kimlik-dogrulama-log', title: 'Kimlik Doğrulama ve Log Yönetimi', dbField: 'kimlik_dogrulama_log' },
        { id: 'kapsam-disinda', title: 'Kapsam Dışında Kalan Konular/Maddeler', dbField: 'kapsam_disinda' },
        { id: 'ekler', title: 'Ekler', dbField: 'ekler' }
      ];

      textModals.forEach(modal => {
        modalSaveFunctions.push({
          modalName: modal.title,
          saveFunction: async () => {
            const content = getContentFromStorage(modal.id);
            if (content?.trim()) {
              const modalData = {
                title: modal.title,
                content: content,
                validation: {
                  found: true,
                  mode: 'strict',
                  contentLength: content?.length || 0,
                  errors: [],
                  warnings: [],
                  matchedLabels: []
                },
                isProcessed: true,
                isLoading: false,
                timestamp: new Date().toISOString()
              };
              const updateData: { [key: string]: string } = {};
              updateData[modal.dbField] = JSON.stringify(modalData, null, 2);
              const result = await updateAnalizFaz1(selectedDocxFile.name, updateData);
              if (!result.success) throw new Error(result.error);
            }
          },
          hasContent: () => Boolean(getContentFromStorage(modal.id)?.trim())
        });
      });


      modalSaveFunctions.push({
        modalName: 'Fonksiyonel Gereksinimler',
        saveFunction: async () => {
          if (fonksiyonelGereksinimlerHook.content?.trim()) {
            const fonksiyonelGereksinimlerData = {
              title: 'Fonksiyonel Gereksinimler',
              content: fonksiyonelGereksinimlerHook.content,
              validation: fonksiyonelGereksinimlerHook.validation,
              isProcessed: fonksiyonelGereksinimlerHook.isProcessed,
              isLoading: fonksiyonelGereksinimlerHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              fonksiyonel_gereksinimler: JSON.stringify(fonksiyonelGereksinimlerData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(fonksiyonelGereksinimlerHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Ekran Gereksinimleri',
        saveFunction: async () => {
          if (ekranGereksinimlerHook.content?.trim()) {
            const ekranGereksinimlerData = {
              title: 'Ekran Gereksinimleri',
              content: ekranGereksinimlerHook.content,
              validation: ekranGereksinimlerHook.validation,
              isProcessed: ekranGereksinimlerHook.isProcessed,
              isLoading: ekranGereksinimlerHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              ekran_gereksinimleri: JSON.stringify(ekranGereksinimlerData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(ekranGereksinimlerHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'X Ekranı',
        saveFunction: async () => {
          if (xEkraniHook.content?.trim()) {
            const xEkraniData = {
              title: 'X Ekranı',
              content: xEkraniHook.content,
              validation: xEkraniHook.validation,
              isProcessed: xEkraniHook.isProcessed,
              isLoading: xEkraniHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              x_ekrani: JSON.stringify(xEkraniData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(xEkraniHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Task İş Akışı',
        saveFunction: async () => {
          if (taskIsAkisiHook.content?.trim()) {
            const taskIsAkisiData = {
              title: 'Task İş Akışı',
              content: taskIsAkisiHook.content,
              validation: taskIsAkisiHook.validation,
              isProcessed: taskIsAkisiHook.isProcessed,
              isLoading: taskIsAkisiHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              task_is_akisi: JSON.stringify(taskIsAkisiData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(taskIsAkisiHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Conversion ve Migration',
        saveFunction: async () => {
          if (conversionMigrationHook.content?.trim()) {
            const conversionMigrationData = {
              title: 'Conversion ve Migration',
              content: conversionMigrationHook.content,
              validation: conversionMigrationHook.validation,
              isProcessed: conversionMigrationHook.isProcessed,
              isLoading: conversionMigrationHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              conversation_migration: JSON.stringify(conversionMigrationData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(conversionMigrationHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Diagram ve Akışlar',
        saveFunction: async () => {
          if (diagramAkislarHook.content?.trim()) {
            const diagramAkislarData = {
              title: 'Diagram ve Akışlar',
              content: diagramAkislarHook.content,
              validation: diagramAkislarHook.validation,
              isProcessed: diagramAkislarHook.isProcessed,
              isLoading: diagramAkislarHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              diagram_akislar: JSON.stringify(diagramAkislarData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(diagramAkislarHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Muhasebe',
        saveFunction: async () => {
          if (muhasebeHook.content?.trim()) {
            const muhasebeData = {
              title: 'Muhasebe',
              content: muhasebeHook.content,
              validation: muhasebeHook.validation,
              isProcessed: muhasebeHook.isProcessed,
              isLoading: muhasebeHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              muhasebe: JSON.stringify(muhasebeData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(muhasebeHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'X İşlemi Muhasebe Deseni',
        saveFunction: async () => {
          if (xIslemiMuhasebeDeseniHook.content?.trim()) {
            const xIslemiMuhasebeDeseniData = {
              title: 'X İşlemi Muhasebe Deseni',
              content: xIslemiMuhasebeDeseniHook.content,
              validation: xIslemiMuhasebeDeseniHook.validation,
              isProcessed: xIslemiMuhasebeDeseniHook.isProcessed,
              isLoading: xIslemiMuhasebeDeseniHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              x_islemi_muhasebe_deseni: JSON.stringify(xIslemiMuhasebeDeseniData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(xIslemiMuhasebeDeseniHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'X İşlemi Kayıt Kuralları',
        saveFunction: async () => {
          if (xIslemiKayitKurallariHook.content?.trim()) {
            const xIslemiKayitKurallariData = {
              title: 'X İşlemi Kayıt Kuralları',
              content: xIslemiKayitKurallariHook.content,
              validation: xIslemiKayitKurallariHook.validation,
              isProcessed: xIslemiKayitKurallariHook.isProcessed,
              isLoading: xIslemiKayitKurallariHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              x_islemi_kayit_kurallari: JSON.stringify(xIslemiKayitKurallariData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(xIslemiKayitKurallariHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'X İşlemi Vergi Komisyon',
        saveFunction: async () => {
          if (xIslemiVergiKomisyonHook.content?.trim()) {
            const xIslemiVergiKomisyonData = {
              title: 'X İşlemi Vergi Komisyon',
              content: xIslemiVergiKomisyonHook.content,
              validation: xIslemiVergiKomisyonHook.validation,
              isProcessed: xIslemiVergiKomisyonHook.isProcessed,
              isLoading: xIslemiVergiKomisyonHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              x_islemi_vergi_komisyon: JSON.stringify(xIslemiVergiKomisyonData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(xIslemiVergiKomisyonHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'X İşlemi Muhasebe Senaryoları',
        saveFunction: async () => {
          if (xIslemiMuhasebeSenaryolariHook.content?.trim()) {
            const xIslemiMuhasebeSenaryolariData = {
              title: 'X İşlemi Muhasebe Senaryoları',
              content: xIslemiMuhasebeSenaryolariHook.content,
              validation: xIslemiMuhasebeSenaryolariHook.validation,
              isProcessed: xIslemiMuhasebeSenaryolariHook.isProcessed,
              isLoading: xIslemiMuhasebeSenaryolariHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              x_islemi_muhasebe_senaryolari: JSON.stringify(xIslemiMuhasebeSenaryolariData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(xIslemiMuhasebeSenaryolariHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'X İşlemi Örnek Kayıtlar',
        saveFunction: async () => {
          if (xIslemiOrnekKayitlarHook.content?.trim()) {
            const xIslemiOrnekKayitlarData = {
              title: 'X İşlemi Örnek Kayıtlar',
              content: xIslemiOrnekKayitlarHook.content,
              validation: xIslemiOrnekKayitlarHook.validation,
              isProcessed: xIslemiOrnekKayitlarHook.isProcessed,
              isLoading: xIslemiOrnekKayitlarHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              x_islemi_ornek_kayitlar: JSON.stringify(xIslemiOrnekKayitlarData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(xIslemiOrnekKayitlarHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Fonksiyonel Olmayan Gereksinimler',
        saveFunction: async () => {
          if (fonksiyonelOlmayanGereksinimlerHook.content?.trim()) {
            const fonksiyonelOlmayanGereksinimlerData = {
              title: 'Fonksiyonel Olmayan Gereksinimler',
              content: fonksiyonelOlmayanGereksinimlerHook.content,
              validation: fonksiyonelOlmayanGereksinimlerHook.validation,
              isProcessed: fonksiyonelOlmayanGereksinimlerHook.isProcessed,
              isLoading: fonksiyonelOlmayanGereksinimlerHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              fonksiyonel_olmayan_gereksinimler: JSON.stringify(fonksiyonelOlmayanGereksinimlerData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(fonksiyonelOlmayanGereksinimlerHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Kimlik Doğrulama ve Log Yönetimi',
        saveFunction: async () => {
          if (kimlikDogrulamaLogHook.content?.trim()) {
            const kimlikDogrulamaLogData = {
              title: 'Kimlik Doğrulama ve Log Yönetimi',
              content: kimlikDogrulamaLogHook.content,
              validation: kimlikDogrulamaLogHook.validation,
              isProcessed: kimlikDogrulamaLogHook.isProcessed,
              isLoading: kimlikDogrulamaLogHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              kimlik_dogrulama_log: JSON.stringify(kimlikDogrulamaLogData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(kimlikDogrulamaLogHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Kapsam Dışında Kalan Konular/Maddeler',
        saveFunction: async () => {
          if (kapsamDisindaHook.content?.trim()) {
            const kapsamDisindaData = {
              title: 'Kapsam Dışında Kalan Konular/Maddeler',
              content: kapsamDisindaHook.content,
              validation: kapsamDisindaHook.validation,
              isProcessed: kapsamDisindaHook.isProcessed,
              isLoading: kapsamDisindaHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              kapsam_disinda: JSON.stringify(kapsamDisindaData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(kapsamDisindaHook.content?.trim())
      });

      modalSaveFunctions.push({
        modalName: 'Ekler',
        saveFunction: async () => {
          if (eklerHook.content?.trim()) {
            const eklerData = {
              title: 'Ekler',
              content: eklerHook.content,
              validation: eklerHook.validation,
              isProcessed: eklerHook.isProcessed,
              isLoading: eklerHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              ekler: JSON.stringify(eklerData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => Boolean(eklerHook.content?.trim())
      });

      // Talep Bilgileri - Modal içerisindeki kaydet ile aynı mantık
      modalSaveFunctions.push({
        modalName: 'Talep Bilgileri',
        saveFunction: async () => {
          const talepBilgileriData = {
            title: 'Talep Bilgileri',
            fields: talepBilgileriHook.fields,
            validation: {
              found: talepBilgileriHook.validation?.found || false,
              mode: talepBilgileriHook.validation?.mode || 'strict',
              errors: talepBilgileriHook.validation?.errors || [],
              warnings: talepBilgileriHook.validation?.warnings || [],
              matchedLabels: talepBilgileriHook.validation?.matchedLabels || []
            },
            isProcessed: true,
            isLoading: false,
            timestamp: new Date().toISOString()
          };
          
          console.log('💾 Talep Bilgileri kaydediliyor:', { 
            selectedFile: selectedDocxFile.name,
            fieldsCount: Object.keys(talepBilgileriHook.fields).length
          });
          
          const result = await updateAnalizFaz1(selectedDocxFile.name, {
            talep_bilgileri: JSON.stringify(talepBilgileriData, null, 2)
          });
          
          if (result.success) {
            console.log('✅ Talep Bilgileri başarıyla kaydedildi:', result);
          } else {
            console.error('❌ Talep Bilgileri kaydetme hatası:', result.error);
            throw new Error(result.error);
          }
        },
        hasContent: () => {
          return Object.values(talepBilgileriHook.fields).some(value => value && typeof value === 'string' && value.trim());
        }
      });

      // Doküman Tarihçesi
      modalSaveFunctions.push({
        modalName: 'Doküman Tarihçesi',
        saveFunction: async () => {
          if (documentHistoryHook.rows.length > 0) {
            const documentHistoryData = {
              title: 'Doküman Tarihçesi',
              rows: documentHistoryHook.rows,
              validation: documentHistoryHook.validation,
              isProcessed: documentHistoryHook.isProcessed,
              isLoading: documentHistoryHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              dokuman_tarihcesi: JSON.stringify(documentHistoryData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => documentHistoryHook.rows.length > 0
      });

      // Talep Değerlendirmesi - Modal içerisindeki kaydet ile aynı mantık
      modalSaveFunctions.push({
        modalName: 'Talep Değerlendirmesi',
        saveFunction: async () => {
          const talepDegerlendirmesiData = {
            title: 'Talep Değerlendirmesi',
            formData: talepDegerlendirmesiHook.formData,
            validation: {
              found: talepDegerlendirmesiHook.validation?.found || false,
              mode: talepDegerlendirmesiHook.validation?.mode || 'strict',
              errors: talepDegerlendirmesiHook.validation?.errors || [],
              warnings: talepDegerlendirmesiHook.validation?.warnings || [],
              matchedLabels: talepDegerlendirmesiHook.validation?.matchedLabels || []
            },
            isProcessed: talepDegerlendirmesiHook.isProcessed,
            isLoading: talepDegerlendirmesiHook.isLoading,
            timestamp: new Date().toISOString()
          };
          
          console.log('💾 Talep Değerlendirmesi kaydediliyor:', { 
            selectedFile: selectedDocxFile.name,
            formDataCount: Object.keys(talepDegerlendirmesiHook.formData).length
          });
          
          const result = await updateAnalizFaz1(selectedDocxFile.name, {
            talep_degerlendirmesi: JSON.stringify(talepDegerlendirmesiData, null, 2)
          });
          
          if (result.success) {
            console.log('✅ Talep Değerlendirmesi başarıyla kaydedildi:', result);
          } else {
            console.error('❌ Talep Değerlendirmesi kaydetme hatası:', result.error);
            throw new Error(result.error);
          }
        },
        hasContent: () => {
          return talepDegerlendirmesiHook.formData && Object.values(talepDegerlendirmesiHook.formData).some(value => value && typeof value === 'string' && value.trim());
        }
      });

      // Ekran Tasarımları
      modalSaveFunctions.push({
        modalName: 'Ekran Tasarımları',
        saveFunction: async () => {
          const storedFormData = localStorage.getItem('ekran_tasarimlari_formdata');
          const storedTextContent = localStorage.getItem('ekran_tasarimlari_textcontent');
          const formData = storedFormData ? JSON.parse(storedFormData) : ekranTasarimlariTableHook.formData;
          const textContent = storedTextContent || ekranTasarimTextHook.content;
          
          const hasTableData = formData && Object.keys(formData).length > 0;
          const hasTextData = textContent && textContent.trim();
          if (hasTableData || hasTextData) {
            const ekranTasarimlariData = {
              title: 'Ekran Tasarımları',
              tableData: formData,
              textContent: textContent,
              validation: ekranTasarimlariTableHook.validation,
              textValidation: ekranTasarimTextHook.validation,
              isProcessed: ekranTasarimlariTableHook.isProcessed,
              isLoading: ekranTasarimlariTableHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              ekran_tasarimlari: JSON.stringify(ekranTasarimlariData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          const storedFormData = localStorage.getItem('ekran_tasarimlari_formdata');
          const storedTextContent = localStorage.getItem('ekran_tasarimlari_textcontent');
          const formData = storedFormData ? JSON.parse(storedFormData) : ekranTasarimlariTableHook.formData;
          const textContent = storedTextContent || ekranTasarimTextHook.content;
          const hasTableData = formData && Object.keys(formData).length > 0;
          const hasTextData = textContent && textContent.trim();
          return Boolean(hasTableData || hasTextData);
        }
      });

      // Yeni modallar için localStorage desteği
      
      // Paydaşlar ve Kullanıcılar - localStorage'dan al
      modalSaveFunctions.push({
        modalName: 'Paydaşlar ve Kullanıcılar',
        saveFunction: async () => {
          const storedFormData = localStorage.getItem('paydaslar_kullanicilar_formdata');
          const formData = storedFormData ? JSON.parse(storedFormData) : paydaslarKullanicilarHook.formData;
          
          if (Object.values(formData).some(value => value && typeof value === 'string' && value.trim())) {
            const paydaslarKullanicilarData = {
              title: 'Paydaşlar ve Kullanıcılar',
              formData: formData,
              validation: paydaslarKullanicilarHook.validation,
              isProcessed: paydaslarKullanicilarHook.isProcessed,
              isLoading: paydaslarKullanicilarHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              paydaslar_kullanicilar: JSON.stringify(paydaslarKullanicilarData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          const storedFormData = localStorage.getItem('paydaslar_kullanicilar_formdata');
          const formData = storedFormData ? JSON.parse(storedFormData) : paydaslarKullanicilarHook.formData;
          return Object.values(formData).some(value => value && typeof value === 'string' && value.trim());
        }
      });

      // Onaylar - localStorage'dan al
      modalSaveFunctions.push({
        modalName: 'Onaylar',
        saveFunction: async () => {
          const storedTableRows = localStorage.getItem('onaylar_tablerows');
          const tableRows = storedTableRows ? JSON.parse(storedTableRows) : onaylarHook.tableRows;
          
          if (tableRows.length > 0) {
            const onaylarData = {
              title: 'Onaylar',
              tableData: { tableRows: tableRows },
              validation: onaylarHook.parseResult,
              isProcessed: onaylarHook.isProcessed,
              isLoading: onaylarHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              onaylar: JSON.stringify(onaylarData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          const storedTableRows = localStorage.getItem('onaylar_tablerows');
          const tableRows = storedTableRows ? JSON.parse(storedTableRows) : onaylarHook.tableRows;
          return tableRows.length > 0;
        }
      });

      // Entegrasyonlar - Modal içerisindeki kaydet ile aynı mantık
      modalSaveFunctions.push({
        modalName: 'Entegrasyonlar',
        saveFunction: async () => {
          const entegrasyonlarData = {
            title: 'Entegrasyonlar',
            tableData: entegrasyonlarHook.entegrasyonlar,
            validation: {
              found: entegrasyonlarHook.validation?.found || false,
              mode: entegrasyonlarHook.validation?.mode || 'strict',
              errors: entegrasyonlarHook.validation?.errors || [],
              warnings: entegrasyonlarHook.validation?.warnings || [],
              matchedLabels: entegrasyonlarHook.validation?.matchedLabels || []
            },
            isProcessed: entegrasyonlarHook.isProcessed,
            isLoading: entegrasyonlarHook.isLoading,
            timestamp: new Date().toISOString()
          };
          
          console.log('💾 Entegrasyonlar kaydediliyor:', { 
            selectedFile: selectedDocxFile.name,
            tableRowCount: entegrasyonlarHook.entegrasyonlar?.length || 0
          });
          
          const result = await updateAnalizFaz1(selectedDocxFile.name, {
            entegrasyonlar: JSON.stringify(entegrasyonlarData, null, 2)
          });
          
          if (result.success) {
            console.log('✅ Entegrasyonlar başarıyla kaydedildi:', result);
          } else {
            console.error('❌ Entegrasyonlar kaydetme hatası:', result.error);
            throw new Error(result.error);
          }
        },
        hasContent: () => {
          return entegrasyonlarHook.entegrasyonlar && entegrasyonlarHook.entegrasyonlar.length > 0;
        }
      });

      // Mesajlar - Modal içerisindeki kaydet ile aynı mantık
      modalSaveFunctions.push({
        modalName: 'Mesajlar',
        saveFunction: async () => {
          const mesajlarData = {
            title: 'Mesajlar, Uyarılar ve Bilgilendirmeler',
            tableData: mesajlarHook.mesajlar,
            validation: {
              found: mesajlarHook.validation?.found || false,
              mode: mesajlarHook.validation?.mode || 'strict',
              errors: mesajlarHook.validation?.errors || [],
              warnings: mesajlarHook.validation?.warnings || [],
              matchedLabels: mesajlarHook.validation?.matchedLabels || []
            },
            isProcessed: mesajlarHook.isProcessed,
            isLoading: mesajlarHook.isLoading,
            timestamp: new Date().toISOString()
          };
          
          console.log('💾 Mesajlar kaydediliyor:', { 
            selectedFile: selectedDocxFile.name,
            tableRowCount: mesajlarHook.mesajlar?.length || 0
          });
          
          const result = await updateAnalizFaz1(selectedDocxFile.name, {
            mesajlar: JSON.stringify(mesajlarData, null, 2)
          });
          
          if (result.success) {
            console.log('✅ Mesajlar başarıyla kaydedildi:', result);
          } else {
            console.error('❌ Mesajlar kaydetme hatası:', result.error);
            throw new Error(result.error);
          }
        },
        hasContent: () => {
          return mesajlarHook.mesajlar && mesajlarHook.mesajlar.length > 0;
        }
      });

      // Parametreler - Modal içerisindeki kaydet ile aynı mantık
      modalSaveFunctions.push({
        modalName: 'Parametreler',
        saveFunction: async () => {
          const parametrelerData = {
            title: 'Parametreler ve Tanımlar',
            tableData: parametrelerHook.parametreler,
            validation: {
              found: parametrelerHook.validation?.found || false,
              mode: parametrelerHook.validation?.mode || 'strict',
              errors: parametrelerHook.validation?.errors || [],
              warnings: parametrelerHook.validation?.warnings || [],
              matchedLabels: parametrelerHook.validation?.matchedLabels || []
            },
            isProcessed: parametrelerHook.isProcessed,
            isLoading: parametrelerHook.isLoading,
            timestamp: new Date().toISOString()
          };
          
          console.log('💾 Parametreler kaydediliyor:', { 
            selectedFile: selectedDocxFile.name,
            tableRowCount: parametrelerHook.parametreler?.length || 0
          });
          
          const result = await updateAnalizFaz1(selectedDocxFile.name, {
            parametreler: JSON.stringify(parametrelerData, null, 2)
          });
          
          if (result.success) {
            console.log('✅ Parametreler başarıyla kaydedildi:', result);
          } else {
            console.error('❌ Parametreler kaydetme hatası:', result.error);
            throw new Error(result.error);
          }
        },
        hasContent: () => {
          return parametrelerHook.parametreler && parametrelerHook.parametreler.length > 0;
        }
      });

      // Tasklar/Batchlar - Hook state'inden al
      modalSaveFunctions.push({
        modalName: 'Tasklar/Batchlar',
        saveFunction: async () => {
          if ((tasklarBatchlarTableHook.formData && Object.values(tasklarBatchlarTableHook.formData).length > 0) || 
              (tasklarBatchlarTextHook.content && tasklarBatchlarTextHook.content.trim())) {
            const tasklarBatchlarData = {
              title: 'Tasklar/Batchlar',
              formData: tasklarBatchlarTableHook.formData,
              textContent: tasklarBatchlarTextHook.content,
              validation: tasklarBatchlarTableHook.validation,
              isProcessed: tasklarBatchlarTableHook.isProcessed,
              isLoading: tasklarBatchlarTableHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              tasklar_batchlar: JSON.stringify(tasklarBatchlarData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          const hasFormData = tasklarBatchlarTableHook.formData && Object.values(tasklarBatchlarTableHook.formData).length > 0;
          const hasTextContent = tasklarBatchlarTextHook.content && tasklarBatchlarTextHook.content.trim();
          return Boolean(hasFormData || hasTextContent);
        }
      });

      // Kabul Kriterleri - Hook state'inden al
      modalSaveFunctions.push({
        modalName: 'Kabul Kriterleri',
        saveFunction: async () => {
          if (kabulKriterleriHook.tableRows && kabulKriterleriHook.tableRows.length > 0) {
            const kabulKriterleriData = {
              title: 'Kabul Kriterleri',
              tableData: kabulKriterleriHook.tableRows,
              validation: kabulKriterleriHook.parseResult,
              isProcessed: kabulKriterleriHook.isProcessed,
              isLoading: kabulKriterleriHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              kabul_kriterleri: JSON.stringify(kabulKriterleriData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          return kabulKriterleriHook.tableRows && kabulKriterleriHook.tableRows.length > 0;
        }
      });

      // Veri Kritikliği - Hook state'inden al
      modalSaveFunctions.push({
        modalName: 'Veri Kritikliği',
        saveFunction: async () => {
          if (veriKritikligiHook.tableRows && veriKritikligiHook.tableRows.length > 0) {
            const veriKritikligiData = {
              title: 'Veri Kritikliği',
              tableData: veriKritikligiHook.tableRows,
              validation: veriKritikligiHook.validation,
              isProcessed: veriKritikligiHook.isProcessed,
              isLoading: veriKritikligiHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              veri_kritikligi: JSON.stringify(veriKritikligiData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          return veriKritikligiHook.tableRows && veriKritikligiHook.tableRows.length > 0;
        }
      });

      // Yetkilendirme/Onay - Hook state'inden al
      modalSaveFunctions.push({
        modalName: 'Yetkilendirme/Onay',
        saveFunction: async () => {
          if (yetkilendirmeHook.yetkilendirmeRows && yetkilendirmeHook.yetkilendirmeRows.length > 0) {
            const yetkilendirmeData = {
              title: 'Yetkilendirme/Onay',
              tableData: yetkilendirmeHook.yetkilendirmeRows,
              validation: yetkilendirmeHook.validation,
              isProcessed: yetkilendirmeHook.isProcessed,
              isLoading: yetkilendirmeHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              yetkilendirme_onay: JSON.stringify(yetkilendirmeData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          return yetkilendirmeHook.yetkilendirmeRows && yetkilendirmeHook.yetkilendirmeRows.length > 0;
        }
      });

      // X İşlemi Muhasebesi - Hook state'inden al
      modalSaveFunctions.push({
        modalName: 'X İşlemi Muhasebesi',
        saveFunction: async () => {
          if (xIslemiMuhasebeHook.tableRows && xIslemiMuhasebeHook.tableRows.length > 0) {
            const xIslemiMuhasebeData = {
              title: 'X İşlemi Muhasebesi',
              tableData: xIslemiMuhasebeHook.tableRows,
              validation: xIslemiMuhasebeHook.validation,
              isProcessed: xIslemiMuhasebeHook.isProcessed,
              isLoading: xIslemiMuhasebeHook.isLoading,
              timestamp: new Date().toISOString()
            };
            const result = await updateAnalizFaz1(selectedDocxFile.name, {
              x_islemi_muhasebesi: JSON.stringify(xIslemiMuhasebeData, null, 2)
            });
            if (!result.success) throw new Error(result.error);
          }
        },
        hasContent: () => {
          return xIslemiMuhasebeHook.tableRows && xIslemiMuhasebeHook.tableRows.length > 0;
        }
      });

      console.log('🚀 Global kaydetme başlatılıyor:', selectedDocxFile.name);
      const result = await saveAllModalContents(selectedDocxFile, modalSaveFunctions);
      
      setGlobalSaveResult(result);
      
      if (result.success) {
        const message = `✅ Kaydetme tamamlandı!\n\n📊 Başarılı: ${result.savedModals.length} modal\n❌ Başarısız: ${result.failedModals.length} modal`;
        alert(message);
        console.log('🎉 Global kaydetme başarılı:', result);
      } else {
        const message = `⚠️ Kaydetme kısmen başarılı!\n\n✅ Başarılı: ${result.savedModals.length} modal\n❌ Başarısız: ${result.failedModals.length} modal\n\n❌ Başarısız Modallar: ${result.failedModals.join(', ')}\n\n❌ Hatalar:\n${result.errors.join('\n')}`;
        alert(message);
        console.warn('⚠️ Global kaydetme kısmen başarılı:', result);
        console.error('❌ Başarısız modallar:', result.failedModals);
        console.error('❌ Hata detayları:', result.errors);
      }
      
    } catch (error) {
      console.error('❌ Global kaydetme hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setGlobalSaveResult({
        success: false,
        savedModals: [],
        failedModals: [],
        errors: [errorMessage]
      });
      alert(`❌ Kaydetme hatası: ${errorMessage}`);
    } finally {
      setIsGlobalSaving(false);
    }
  }, [
    selectedDocxFile,
    amacKapsamHook, mevcutIsleyisHook, planlananIsleyisHook, fonksiyonelGereksinimlerHook,
    ekranGereksinimlerHook, xEkraniHook, taskIsAkisiHook, conversionMigrationHook, diagramAkislarHook,
    muhasebeHook, xIslemiMuhasebeDeseniHook, xIslemiKayitKurallariHook, xIslemiVergiKomisyonHook,
    xIslemiMuhasebeSenaryolariHook, xIslemiOrnekKayitlarHook, fonksiyonelOlmayanGereksinimlerHook,
    kimlikDogrulamaLogHook, kapsamDisindaHook, eklerHook, talepBilgileriHook, documentHistoryHook,
    talepDegerlendirmesiHook, ekranTasarimlariTableHook, ekranTasarimTextHook
  ]);

  // Word Export handler
  const handleWordExport = useCallback(async () => {
    if (!selectedDocxFile) {
      setExportError('Önce bir doküman seçin');
      return;
    }

    // 🔍 Kaydedilmemiş değişiklikleri kontrol et
    const unsavedCheck = hasUnsavedChanges();
    
    if (unsavedCheck.count > 0) {
      // Debug: Modal durumlarını göster
      debugModalStates();
      
      // Kullanıcıya uyarı göster
      const modalList = unsavedCheck.modals.slice(0, 5).join('\n• ');
      const moreText = unsavedCheck.count > 5 ? `\n... ve ${unsavedCheck.count - 5} modal daha` : '';
      
      const confirmed = window.confirm(
        `⚠️ UYARI: ${unsavedCheck.count} modalda kaydedilmemiş değişiklik var!\n\n` +
        `Kaydedilmemiş modaller:\n• ${modalList}${moreText}\n\n` +
        `❗ Bu değişiklikler Word dosyasına yansımayacak!\n\n` +
        `Devam etmek istiyor musunuz?\n\n` +
        `💡 Önce "Kaydet" butonuna basarak değişikliklerinizi kaydetmeniz önerilir.`
      );
      
      if (!confirmed) {
        console.log('❌ Kullanıcı indirmeyi iptal etti');
        return;
      }
      
      console.log('⚠️ Kullanıcı kaydedilmemiş değişikliklerle indirmeye devam etti');
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const result = await exportAndDownload(selectedDocxFile.name);
      
      if (result.success) {
        console.log('✅ Word export başarılı');
        // Başarı mesajı göster (isteğe bağlı)
      } else {
        setExportError(result.error || 'Export başarısız');
      }
    } catch (error) {
      console.error('❌ Word export hatası:', error);
      setExportError(error instanceof Error ? error.message : 'Bilinmeyen hata');
    } finally {
      setIsExporting(false);
    }
  }, [selectedDocxFile]);  

  // Transfer trigger fonksiyonu - sadece aktarım yapıldığında çalışır
  const handleTransferTrigger = useCallback(async () => {
    console.log('🚀 Transfer trigger tetiklendi, database\'den son veri yükleniyor...');
    
    // Transfer modu aktif et (useEffect'leri durdur)
    setIsTransferMode(true);
    
    // Kısa bir bekleme (database'in yazma işlemini tamamlaması için)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await loadLatestAnalysisData();
    
    if (result.success && result.data) {
      console.log('📋 Transfer sonrası database\'den veri yüklendi, hook\'lara aktarılıyor...');
      
      // Hook'ları bir objede topla
      const hooks = {
        amacKapsamHook,
        mevcutIsleyisHook,
        planlananIsleyisHook,
        fonksiyonelGereksinimlerHook,
        ekranGereksinimlerHook,
        xEkraniHook,
        taskIsAkisiHook,
        conversionMigrationHook,
        diagramAkislarHook,
        muhasebeHook,
        xIslemiMuhasebeDeseniHook,
        xIslemiKayitKurallariHook,
        xIslemiVergiKomisyonHook,
        xIslemiMuhasebeSenaryolariHook,
        xIslemiOrnekKayitlarHook,
        fonksiyonelOlmayanGereksinimlerHook,
        kimlikDogrulamaLogHook,
        kapsamDisindaHook,
        eklerHook
      };
      
      // Hook'lara veri yükle
      loadDataToHooks(result.data, hooks);
      
      // Export için selectedDocxFile'ı set et
      if (result.data.yuklenen_dokuman) {
        const mockFile = new File([''], result.data.yuklenen_dokuman, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        setSelectedDocxFile(mockFile);
        console.log('📄 Export için doküman dosyası set edildi:', result.data.yuklenen_dokuman);
      }
      
      // Transfer başarılı mesajı göster
      setTimeout(() => {
        alert('✅ Faz2 verisi başarıyla Faz1\'e aktarıldı!\n\n📋 Tüm text modal\'lar (dolu olanlar) aktarıldı.\n📤 Export butonu da aktif oldu.');
        
        // Transfer modu kapat
        setIsTransferMode(false);
      }, 2000);
      
      console.log('🎉 Transfer sonrası hook\'lara veri yükleme ve export hazırlığı tamamlandı!');
    } else {
      console.log('⚠️ Transfer sonrası database\'den veri yüklenemedi');
      setIsTransferMode(false);
    }
  }, [
    amacKapsamHook, mevcutIsleyisHook, planlananIsleyisHook, fonksiyonelGereksinimlerHook,
    ekranGereksinimlerHook, xEkraniHook, taskIsAkisiHook, conversionMigrationHook,
    diagramAkislarHook, muhasebeHook, xIslemiMuhasebeDeseniHook, xIslemiKayitKurallariHook,
    xIslemiVergiKomisyonHook, xIslemiMuhasebeSenaryolariHook, xIslemiOrnekKayitlarHook,
    fonksiyonelOlmayanGereksinimlerHook, kimlikDogrulamaLogHook, kapsamDisindaHook, eklerHook
  ]);

  // Transfer flag kontrolü - sadece localStorage flag'i varsa trigger çalıştır
  useEffect(() => {
    console.log('🔍 DEBUG - LLMAnalysis useEffect çalıştı');
    const transferData = localStorage.getItem('faz1_transfer_data');
    const faz2Suggestions = localStorage.getItem('faz2_suggestions');
    console.log('🔍 DEBUG - transferData:', transferData);
    console.log('🔍 DEBUG - faz2Suggestions:', faz2Suggestions);
    
    const hasTransfer = !!transferData; // Flag değerini sakla
    
    if (hasTransfer) {
      console.log('✅ Transfer flag algılandı, trigger tetikleniyor...');
      console.log('✅ Faz2 önerileri KORUNACAK - silinmeyecek');
      
      // Flag'i hemen temizle (tek sefer çalışması için)
      localStorage.removeItem('faz1_transfer_data');
      
      // Transfer trigger'ı çalıştır
      handleTransferTrigger();
    } else if (faz2Suggestions) {
      // Transfer flag yok AMA faz2_suggestions var - bu durumda önerileri koru
      console.log('✅ Faz2 önerileri mevcut, KORUNACAK');
    } else {
      // SADECE hem transfer flag'i YOK hem de faz2_suggestions YOK ise temizle
      // Eğer faz2_suggestions varsa, kullanıcı daha önce transfer yapmış demektir
      console.log('🧹 Transfer flag ve Faz2 önerileri yok, temizlik yapılıyor...');
      
      console.log('ℹ️ Normal sayfa yükleme - transfer flag yok, hook\'ları temizleniyor...');
      
      // Normal sayfa yüklemesinde tüm hook'ları reset et
      setTimeout(() => {
        console.log('🧹 Hook\'lar temizleniyor...');
        
        // Text-based hook'ları reset et - detaylı log ile
        console.log('🔄 AmacKapsam öncesi:', amacKapsamHook.content?.substring(0, 50) + '...');
        amacKapsamHook.resetContent();
        console.log('🔄 AmacKapsam sonrası:', amacKapsamHook.content?.substring(0, 50) + '...');
        
        console.log('🔄 MevcutIsleyis öncesi:', mevcutIsleyisHook.content?.substring(0, 50) + '...');
        mevcutIsleyisHook.resetContent();
        console.log('🔄 MevcutIsleyis sonrası:', mevcutIsleyisHook.content?.substring(0, 50) + '...');
        
        planlananIsleyisHook.resetContent();
        fonksiyonelGereksinimlerHook.resetContent();
        ekranGereksinimlerHook.resetContent();
        xEkraniHook.resetContent();
        taskIsAkisiHook.resetContent();
        conversionMigrationHook.resetContent();
        diagramAkislarHook.resetContent();
        muhasebeHook.resetContent();
        xIslemiMuhasebeDeseniHook.resetContent();
        xIslemiKayitKurallariHook.resetContent();
        xIslemiVergiKomisyonHook.resetContent();
        xIslemiMuhasebeSenaryolariHook.resetContent();
        xIslemiOrnekKayitlarHook.resetContent();
        fonksiyonelOlmayanGereksinimlerHook.resetContent();
        kimlikDogrulamaLogHook.resetContent();
        kapsamDisindaHook.resetContent();
        eklerHook.resetContent();
        
        // Tablo-based hook'ları da reset et
        if (talepBilgileriHook.resetFields) talepBilgileriHook.resetFields();
        if (talepDegerlendirmesiHook.resetForm) talepDegerlendirmesiHook.resetForm();
        if (ekranTasarimlariTableHook.resetForm) ekranTasarimlariTableHook.resetForm();
        if (tasklarBatchlarTableHook.resetForm) tasklarBatchlarTableHook.resetForm();
        if (tasklarBatchlarTextHook.resetContent) tasklarBatchlarTextHook.resetContent();
        if (entegrasyonlarHook.resetForm) entegrasyonlarHook.resetForm();
        if (mesajlarHook.resetForm) mesajlarHook.resetForm();
        if (parametrelerHook.resetForm) parametrelerHook.resetForm();
        if (xIslemiMuhasebeModalHook.resetForm) xIslemiMuhasebeModalHook.resetForm();
        if (xIslemiMuhasebeHook.resetForm) xIslemiMuhasebeHook.resetForm();
        if (yetkilendirmeHook.resetForm) yetkilendirmeHook.resetForm();
        if (onaySureciHook.resetForm) onaySureciHook.resetForm();
        if (veriKritikligiHook.resetForm) veriKritikligiHook.resetForm();
        if (paydaslarKullanicilarHook.resetForm) paydaslarKullanicilarHook.resetForm();
        // Not: documentHistoryHook, kabulKriterleriHook, onaylarHook'ların reset fonksiyonları yok
        
        // ⚠️ ÖNEMLİ: localStorage'daki content verilerini de temizle
        // Çünkü modal'lar localStorage'dan veri çekiyor
        console.log('🧹 localStorage content verileri temizleniyor...');
        localStorage.removeItem('amac_kapsam_content');
        localStorage.removeItem('mevcut_isleyis_content');
        localStorage.removeItem('planlanan_isleyis_content');
        localStorage.removeItem('fonksiyonel_gereksinimler_content');
        localStorage.removeItem('ekran_gereksinimleri_content');
        localStorage.removeItem('x_ekrani_content');
        localStorage.removeItem('task_is_akisi_content');
        localStorage.removeItem('conversation_migration_content');
        localStorage.removeItem('diagram_akislar_content');
        localStorage.removeItem('muhasebe_content');
        localStorage.removeItem('x_islemi_muhasebe_deseni_content');
        localStorage.removeItem('x_islemi_kayit_kurallari_content');
        localStorage.removeItem('x_islemi_vergi_komisyon_content');
        localStorage.removeItem('x_islemi_muhasebe_senaryolari_content');
        localStorage.removeItem('x_islemi_ornek_kayitlar_content');
        localStorage.removeItem('fonksiyonel_olmayan_gereksinimler_content');
        localStorage.removeItem('kimlik_dogrulama_log_content');
        localStorage.removeItem('kapsam_disinda_content');
        localStorage.removeItem('ekler_content');
        
        console.log('✅ Tüm hook\'lar ve localStorage temizlendi');
      }, 100); // Kısa bir delay ile hook'ların tam olarak mount olmasını bekle
    }
  }, []); // Sadece component mount olduğunda çalış
  
  // DOCX dosyası seçildiğinde tüm hook'ları tetikle
  useEffect(() => {
    if (selectedDocxFile && !isTransferMode) {
      console.log('📄 DOCX dosyası seçildi, tüm hook\'lar işleniyor:', selectedDocxFile.name);
      
      // Tüm text-based hook'ları tetikle
      if (!amacKapsamHook.isProcessed && !amacKapsamHook.isLoading) {
        amacKapsamHook.processFile(selectedDocxFile);
      }
      if (!mevcutIsleyisHook.isProcessed && !mevcutIsleyisHook.isLoading) {
        mevcutIsleyisHook.processFile(selectedDocxFile);
      }
      if (!planlananIsleyisHook.isProcessed && !planlananIsleyisHook.isLoading) {
        planlananIsleyisHook.processFile(selectedDocxFile);
      }
      if (!fonksiyonelGereksinimlerHook.isProcessed && !fonksiyonelGereksinimlerHook.isLoading) {
        fonksiyonelGereksinimlerHook.processFile(selectedDocxFile);
      }
      if (!ekranGereksinimlerHook.isProcessed && !ekranGereksinimlerHook.isLoading) {
        ekranGereksinimlerHook.processFile(selectedDocxFile);
      }
      if (!xEkraniHook.isProcessed && !xEkraniHook.isLoading) {
        xEkraniHook.processFile(selectedDocxFile);
      }
      if (!taskIsAkisiHook.isProcessed && !taskIsAkisiHook.isLoading) {
        taskIsAkisiHook.processFile(selectedDocxFile);
      }
      if (!conversionMigrationHook.isProcessed && !conversionMigrationHook.isLoading) {
        conversionMigrationHook.processFile(selectedDocxFile);
      }
      if (!diagramAkislarHook.isProcessed && !diagramAkislarHook.isLoading) {
        diagramAkislarHook.processFile(selectedDocxFile);
      }
      if (!muhasebeHook.isProcessed && !muhasebeHook.isLoading) {
        muhasebeHook.processFile(selectedDocxFile);
      }
      if (!xIslemiMuhasebeDeseniHook.isProcessed && !xIslemiMuhasebeDeseniHook.isLoading) {
        xIslemiMuhasebeDeseniHook.processFile(selectedDocxFile);
      }
      if (!xIslemiKayitKurallariHook.isProcessed && !xIslemiKayitKurallariHook.isLoading) {
        xIslemiKayitKurallariHook.processFile(selectedDocxFile);
      }
      if (!xIslemiVergiKomisyonHook.isProcessed && !xIslemiVergiKomisyonHook.isLoading) {
        xIslemiVergiKomisyonHook.processFile(selectedDocxFile);
      }
      if (!xIslemiMuhasebeSenaryolariHook.isProcessed && !xIslemiMuhasebeSenaryolariHook.isLoading) {
        xIslemiMuhasebeSenaryolariHook.processFile(selectedDocxFile);
      }
      if (!xIslemiOrnekKayitlarHook.isProcessed && !xIslemiOrnekKayitlarHook.isLoading) {
        xIslemiOrnekKayitlarHook.processFile(selectedDocxFile);
      }
      if (!fonksiyonelOlmayanGereksinimlerHook.isProcessed && !fonksiyonelOlmayanGereksinimlerHook.isLoading) {
        fonksiyonelOlmayanGereksinimlerHook.processFile(selectedDocxFile);
      }
      if (!kimlikDogrulamaLogHook.isProcessed && !kimlikDogrulamaLogHook.isLoading) {
        kimlikDogrulamaLogHook.processFile(selectedDocxFile);
      }
      if (!yetkilendirmeHook.isProcessed && !yetkilendirmeHook.isLoading) {
        yetkilendirmeHook.processFile(selectedDocxFile);
      }
      if (!onaySureciHook.isProcessed && !onaySureciHook.isLoading) {
        onaySureciHook.processFile(selectedDocxFile);
      }
      if (!veriKritikligiHook.isProcessed && !veriKritikligiHook.isLoading) {
        veriKritikligiHook.processFile(selectedDocxFile);
      }
      if (!paydaslarKullanicilarHook.isProcessed && !paydaslarKullanicilarHook.isLoading) {
        paydaslarKullanicilarHook.processFile(selectedDocxFile);
      }
      if (!kapsamDisindaHook.isProcessed && !kapsamDisindaHook.isLoading) {
        kapsamDisindaHook.processFile(selectedDocxFile);
      }
      if (!eklerHook.isProcessed && !eklerHook.isLoading) {
        eklerHook.processFile(selectedDocxFile);
      }
      if (!kabulKriterleriHook.isProcessed && !kabulKriterleriHook.isLoading) {
        kabulKriterleriHook.processFile(selectedDocxFile);
      }
      if (!onaylarHook.isProcessed && !onaylarHook.isLoading) {
        onaylarHook.processFile(selectedDocxFile);
      }
      
      // Tablo-based hook'ları da tetikle
        if (!ekranTasarimlariTableHook.isProcessed && !ekranTasarimlariTableHook.isLoading) {
          ekranTasarimlariTableHook.processFile(selectedDocxFile);
        }
        if (!ekranTasarimTextHook.isProcessed && !ekranTasarimTextHook.isLoading) {
          ekranTasarimTextHook.processFile(selectedDocxFile);
        }
      if (!tasklarBatchlarTableHook.isProcessed && !tasklarBatchlarTableHook.isLoading) {
        tasklarBatchlarTableHook.processFile(selectedDocxFile);
      }
      if (!tasklarBatchlarTextHook.isProcessed && !tasklarBatchlarTextHook.isLoading) {
        tasklarBatchlarTextHook.processFile(selectedDocxFile);
      }
      if (!entegrasyonlarHook.isProcessed && !entegrasyonlarHook.isLoading) {
        entegrasyonlarHook.processFile(selectedDocxFile);
      }
      if (!mesajlarHook.isProcessed && !mesajlarHook.isLoading) {
        mesajlarHook.processFile(selectedDocxFile);
      }
      if (!parametrelerHook.isProcessed && !parametrelerHook.isLoading) {
        parametrelerHook.processFile(selectedDocxFile);
      }
      
      // X İşlemi Muhasebe hook'larını tetikle
      if (!xIslemiMuhasebeHook.isProcessed && !xIslemiMuhasebeHook.isLoading) {
        xIslemiMuhasebeHook.processFile(selectedDocxFile);
      }
      if (!xIslemiMuhasebeModalHook.isProcessed && !xIslemiMuhasebeModalHook.isLoading) {
        xIslemiMuhasebeModalHook.processFile(selectedDocxFile);
      }
      
      // Form-based hook'ları da tetikle
      if (!talepBilgileriHook.isProcessed && !talepBilgileriHook.isLoading) {
        talepBilgileriHook.processFile(selectedDocxFile);
      }
      if (!documentHistoryHook.isProcessed && !documentHistoryHook.isLoading) {
        documentHistoryHook.processFile(selectedDocxFile);
      }
      if (!talepDegerlendirmesiHook.isProcessed && !talepDegerlendirmesiHook.isLoading) {
        talepDegerlendirmesiHook.processFile(selectedDocxFile);
      }
    }
  }, [selectedDocxFile, 
      amacKapsamHook.isProcessed, amacKapsamHook.isLoading, amacKapsamHook.processFile,
      mevcutIsleyisHook.isProcessed, mevcutIsleyisHook.isLoading, mevcutIsleyisHook.processFile,
      planlananIsleyisHook.isProcessed, planlananIsleyisHook.isLoading, planlananIsleyisHook.processFile,
      fonksiyonelGereksinimlerHook.isProcessed, fonksiyonelGereksinimlerHook.isLoading, fonksiyonelGereksinimlerHook.processFile,
      ekranGereksinimlerHook.isProcessed, ekranGereksinimlerHook.isLoading, ekranGereksinimlerHook.processFile,
      xEkraniHook.isProcessed, xEkraniHook.isLoading, xEkraniHook.processFile,
      taskIsAkisiHook.isProcessed, taskIsAkisiHook.isLoading, taskIsAkisiHook.processFile,
      conversionMigrationHook.isProcessed, conversionMigrationHook.isLoading, conversionMigrationHook.processFile,
      diagramAkislarHook.isProcessed, diagramAkislarHook.isLoading, diagramAkislarHook.processFile,
      muhasebeHook.isProcessed, muhasebeHook.isLoading, muhasebeHook.processFile,
      xIslemiMuhasebeHook.isProcessed, xIslemiMuhasebeHook.isLoading, xIslemiMuhasebeHook.processFile,
      xIslemiMuhasebeModalHook.isProcessed, xIslemiMuhasebeModalHook.isLoading, xIslemiMuhasebeModalHook.processFile,
      xIslemiMuhasebeDeseniHook.isProcessed, xIslemiMuhasebeDeseniHook.isLoading, xIslemiMuhasebeDeseniHook.processFile,
      xIslemiKayitKurallariHook.isProcessed, xIslemiKayitKurallariHook.isLoading, xIslemiKayitKurallariHook.processFile,
      xIslemiVergiKomisyonHook.isProcessed, xIslemiVergiKomisyonHook.isLoading, xIslemiVergiKomisyonHook.processFile,
      xIslemiMuhasebeSenaryolariHook.isProcessed, xIslemiMuhasebeSenaryolariHook.isLoading, xIslemiMuhasebeSenaryolariHook.processFile,
      xIslemiOrnekKayitlarHook.isProcessed, xIslemiOrnekKayitlarHook.isLoading, xIslemiOrnekKayitlarHook.processFile,
      fonksiyonelOlmayanGereksinimlerHook.isProcessed, fonksiyonelOlmayanGereksinimlerHook.isLoading, fonksiyonelOlmayanGereksinimlerHook.processFile,
        kimlikDogrulamaLogHook.isProcessed, kimlikDogrulamaLogHook.isLoading, kimlikDogrulamaLogHook.processFile,
        yetkilendirmeHook.isProcessed, yetkilendirmeHook.isLoading, yetkilendirmeHook.processFile,
        onaySureciHook.isProcessed, onaySureciHook.isLoading, onaySureciHook.processFile,
        veriKritikligiHook.isProcessed, veriKritikligiHook.isLoading, veriKritikligiHook.processFile,
        paydaslarKullanicilarHook.isProcessed, paydaslarKullanicilarHook.isLoading, paydaslarKullanicilarHook.processFile,
        kapsamDisindaHook.isProcessed, kapsamDisindaHook.isLoading, kapsamDisindaHook.processFile,
        eklerHook.isProcessed, eklerHook.isLoading, eklerHook.processFile,
        kabulKriterleriHook.isProcessed, kabulKriterleriHook.isLoading, kabulKriterleriHook.processFile,
        onaylarHook.isProcessed, onaylarHook.isLoading, onaylarHook.processFile,
      // Tablo hook dependencies
      ekranTasarimlariTableHook.isProcessed, ekranTasarimlariTableHook.isLoading, ekranTasarimlariTableHook.processFile,
      tasklarBatchlarTableHook.isProcessed, tasklarBatchlarTableHook.isLoading, tasklarBatchlarTableHook.processFile,
      tasklarBatchlarTextHook.isProcessed, tasklarBatchlarTextHook.isLoading, tasklarBatchlarTextHook.processFile,
      entegrasyonlarHook.isProcessed, entegrasyonlarHook.isLoading, entegrasyonlarHook.processFile,
      mesajlarHook.isProcessed, mesajlarHook.isLoading, mesajlarHook.processFile,
      parametrelerHook.isProcessed, parametrelerHook.isLoading, parametrelerHook.processFile,
      talepBilgileriHook.isProcessed, talepBilgileriHook.isLoading, talepBilgileriHook.processFile,
      documentHistoryHook.isProcessed, documentHistoryHook.isLoading, documentHistoryHook.processFile,
      talepDegerlendirmesiHook.isProcessed, talepDegerlendirmesiHook.isLoading, talepDegerlendirmesiHook.processFile,
      isTransferMode
  ]);

  // Dosya değiştiğinde hook'ları reset et
  useEffect(() => {
    if (selectedDocxFile) {
      console.log('🔄 Yeni dosya seçildi, hook\'ları resetliyorum:', selectedDocxFile.name);
      setAmacKapsamSaved(false); // Flag'i de reset et
      
      // Tüm hook'ları reset et
      amacKapsamHook.resetContent();
      mevcutIsleyisHook.resetContent();
      planlananIsleyisHook.resetContent();
      fonksiyonelGereksinimlerHook.resetContent();
      ekranGereksinimlerHook.resetContent();
      xEkraniHook.resetContent();
      taskIsAkisiHook.resetContent();
      conversionMigrationHook.resetContent();
      diagramAkislarHook.resetContent();
      muhasebeHook.resetContent();
      xIslemiMuhasebeDeseniHook.resetContent();
      xIslemiKayitKurallariHook.resetContent();
      xIslemiVergiKomisyonHook.resetContent();
      xIslemiMuhasebeSenaryolariHook.resetContent();
      xIslemiOrnekKayitlarHook.resetContent();
      fonksiyonelOlmayanGereksinimlerHook.resetContent();
      kimlikDogrulamaLogHook.resetContent();
      kapsamDisindaHook.resetContent();
      eklerHook.resetContent();
      kabulKriterleriHook.resetData();
      onaylarHook.resetData();
      
      // Yetkilendirme ve Onay hook'larını reset et
      yetkilendirmeHook.resetForm();
      onaySureciHook.resetForm();
      
      // Veri Kritikliği hook'unu reset et
      veriKritikligiHook.resetForm();
      
      // Paydaşlar ve Kullanıcılar hook'unu reset et
      paydaslarKullanicilarHook.resetForm();
      
      // Tablo hook'larını da reset et
      ekranTasarimlariTableHook.resetForm();
      ekranTasarimTextHook.resetContent();
      tasklarBatchlarTableHook.resetForm();
      tasklarBatchlarTextHook.resetContent();
      entegrasyonlarHook.resetForm();
      mesajlarHook.resetForm();
      parametrelerHook.resetForm();
      
      // X İşlemi Muhasebe hook'larını reset et
      xIslemiMuhasebeHook.resetForm();
      xIslemiMuhasebeModalHook.resetForm();
      
      // Form-based hook'ları da reset et
      talepBilgileriHook.resetFields();
      documentHistoryHook.resetRows();
      talepDegerlendirmesiHook.resetForm();
    }
  }, [selectedDocxFile]); // Sadece dosya değişince reset

  // Amaç-Kapsam başarıyla kaydedildi mi takip et
  const [amacKapsamSaved, setAmacKapsamSaved] = useState<boolean>(false);

  // Amaç-Kapsam hook'u çalıştığında database'e kaydet
  useEffect(() => {
    if (selectedDocxFile && amacKapsamHook.isProcessed && amacKapsamHook.content && !isTransferMode) {
      console.log('📄 Amaç-Kapsam işlendi, database\'e kaydediliyor...');
      
      setAmacKapsamSaved(false); // Reset flag
      
      // Amaç-Kapsam verilerini JSON formatında kaydet
      const amacKapsamData = {
        title: 'Amaç ve Kapsam',
        content: amacKapsamHook.content,
        validation: amacKapsamHook.validation,
        isProcessed: amacKapsamHook.isProcessed,
        timestamp: new Date().toISOString()
      };
      
      saveAnalizFaz1({
        amac_kapsam: JSON.stringify(amacKapsamData, null, 2),
        yuklenen_dokuman: selectedDocxFile.name
      }).then(result => {
        if (result.success) {
          console.log('✅ Analiz Faz1 kaydedildi:', result);
          setAmacKapsamSaved(true); // İŞTE BU FLAG DİĞER HOOK'LARI TETİKLEYECEK!
        } else {
          console.error('❌ Analiz Faz1 kaydetme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, amacKapsamHook.isProcessed, amacKapsamHook.content, isTransferMode]);

  // Talep Bilgileri hook'u çalıştığında database'e kaydet/güncelle
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && talepBilgileriHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Talep Bilgileri işlendi, database\'e kaydediliyor...');
      console.log('🔍 Talep Bilgileri hook durumu:', {
        isProcessed: talepBilgileriHook.isProcessed,
        fields: talepBilgileriHook.fields,
        validation: talepBilgileriHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Talep bilgilerini tam parse sonuçları ile JSON formatında kaydet
      const talepBilgileriData = {
        title: 'Talep Bilgileri',
        fields: talepBilgileriHook.fields || {},
        validation: talepBilgileriHook.validation,
        isProcessed: talepBilgileriHook.isProcessed,
        isLoading: talepBilgileriHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        talep_bilgileri: JSON.stringify(talepBilgileriData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Talep Bilgileri güncellendi:', result);
        } else {
          console.error('❌ Talep Bilgileri güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, talepBilgileriHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Doküman Tarihçesi hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && documentHistoryHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Doküman Tarihçesi işlendi, database\'e kaydediliyor...');
      console.log('🔍 Doküman Tarihçesi hook durumu:', {
        isProcessed: documentHistoryHook.isProcessed,
        rows: documentHistoryHook.rows,
        validation: documentHistoryHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Doküman Tarihçesi verilerini tam parse sonuçları ile JSON formatında kaydet
      const dokumanTarihcesiData = {
        title: 'Doküman Tarihçesi',
        rows: documentHistoryHook.rows || [],
        validation: documentHistoryHook.validation,
        isProcessed: documentHistoryHook.isProcessed,
        isLoading: documentHistoryHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        dokuman_tarihcesi: JSON.stringify(dokumanTarihcesiData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Doküman Tarihçesi güncellendi:', result);
        } else {
          console.error('❌ Doküman Tarihçesi güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, documentHistoryHook.isProcessed, amacKapsamSaved]);

  // Talep Değerlendirmesi hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && talepDegerlendirmesiHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Talep Değerlendirmesi işlendi, database\'e kaydediliyor...');
      console.log('🔍 Talep Değerlendirmesi hook durumu:', {
        isProcessed: talepDegerlendirmesiHook.isProcessed,
        formData: talepDegerlendirmesiHook.formData,
        validation: talepDegerlendirmesiHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Talep Değerlendirmesi verilerini tam parse sonuçları ile JSON formatında kaydet
      const talepDegerlendirmesiData = {
        title: 'Talep Değerlendirmesi',
        formData: talepDegerlendirmesiHook.formData || {},
        validation: talepDegerlendirmesiHook.validation,
        isProcessed: talepDegerlendirmesiHook.isProcessed,
        isLoading: talepDegerlendirmesiHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        talep_degerlendirmesi: JSON.stringify(talepDegerlendirmesiData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Talep Değerlendirmesi güncellendi:', result);
        } else {
          console.error('❌ Talep Değerlendirmesi güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, talepDegerlendirmesiHook.isProcessed, amacKapsamSaved]);

  // Mevcut İşleyiş hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && mevcutIsleyisHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Mevcut İşleyiş işlendi, database\'e kaydediliyor...');
      console.log('🔍 Mevcut İşleyiş hook durumu:', {
        isProcessed: mevcutIsleyisHook.isProcessed,
        content: mevcutIsleyisHook.content,
        validation: mevcutIsleyisHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Mevcut İşleyiş verilerini JSON formatında kaydet
      const mevcutIsleyisData = {
        title: 'Mevcut İşleyiş',
        content: mevcutIsleyisHook.content || '',
        validation: mevcutIsleyisHook.validation,
        isProcessed: mevcutIsleyisHook.isProcessed,
        isLoading: mevcutIsleyisHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        mevcut_isleyis: JSON.stringify(mevcutIsleyisData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Mevcut İşleyiş güncellendi:', result);
        } else {
          console.error('❌ Mevcut İşleyiş güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, mevcutIsleyisHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Planlanan İşleyiş hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && planlananIsleyisHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Planlanan İşleyiş işlendi, database\'e kaydediliyor...');
      console.log('🔍 Planlanan İşleyiş hook durumu:', {
        isProcessed: planlananIsleyisHook.isProcessed,
        content: planlananIsleyisHook.content,
        validation: planlananIsleyisHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Planlanan İşleyiş verilerini JSON formatında kaydet
      const planlananIsleyisData = {
        title: 'Planlanan İşleyiş',
        content: planlananIsleyisHook.content || '',
        validation: planlananIsleyisHook.validation,
        isProcessed: planlananIsleyisHook.isProcessed,
        isLoading: planlananIsleyisHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        planlanan_isleyis: JSON.stringify(planlananIsleyisData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Planlanan İşleyiş güncellendi:', result);
        } else {
          console.error('❌ Planlanan İşleyiş güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, planlananIsleyisHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Fonksiyonel Gereksinimler hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && fonksiyonelGereksinimlerHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Fonksiyonel Gereksinimler işlendi, database\'e kaydediliyor...');
      console.log('🔍 Fonksiyonel Gereksinimler hook durumu:', {
        isProcessed: fonksiyonelGereksinimlerHook.isProcessed,
        content: fonksiyonelGereksinimlerHook.content,
        validation: fonksiyonelGereksinimlerHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Fonksiyonel Gereksinimler verilerini JSON formatında kaydet
      const fonksiyonelGereksinimlerData = {
        title: 'Fonksiyonel Gereksinimler',
        content: fonksiyonelGereksinimlerHook.content || '',
        validation: fonksiyonelGereksinimlerHook.validation,
        isProcessed: fonksiyonelGereksinimlerHook.isProcessed,
        isLoading: fonksiyonelGereksinimlerHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        fonksiyonel_gereksinimler: JSON.stringify(fonksiyonelGereksinimlerData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Fonksiyonel Gereksinimler güncellendi:', result);
        } else {
          console.error('❌ Fonksiyonel Gereksinimler güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, fonksiyonelGereksinimlerHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Ekran Gereksinimleri hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && ekranGereksinimlerHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Ekran Gereksinimleri işlendi, database\'e kaydediliyor...');
      console.log('🔍 Ekran Gereksinimleri hook durumu:', {
        isProcessed: ekranGereksinimlerHook.isProcessed,
        content: ekranGereksinimlerHook.content,
        validation: ekranGereksinimlerHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Ekran Gereksinimleri verilerini JSON formatında kaydet
      const ekranGereksinimlerData = {
        title: 'Ekran Gereksinimleri',
        content: ekranGereksinimlerHook.content || '',
        validation: ekranGereksinimlerHook.validation,
        isProcessed: ekranGereksinimlerHook.isProcessed,
        isLoading: ekranGereksinimlerHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        ekran_gereksinimleri: JSON.stringify(ekranGereksinimlerData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Ekran Gereksinimleri güncellendi:', result);
        } else {
          console.error('❌ Ekran Gereksinimleri güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, ekranGereksinimlerHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // X Ekranı hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && xEkraniHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 X Ekranı işlendi, database\'e kaydediliyor...');
      console.log('🔍 X Ekranı hook durumu:', {
        isProcessed: xEkraniHook.isProcessed,
        content: xEkraniHook.content,
        validation: xEkraniHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // X Ekranı verilerini JSON formatında kaydet
      const xEkraniData = {
        title: 'X Ekranı',
        content: xEkraniHook.content || '',
        validation: xEkraniHook.validation,
        isProcessed: xEkraniHook.isProcessed,
        isLoading: xEkraniHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        x_ekrani: JSON.stringify(xEkraniData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ X Ekranı güncellendi:', result);
        } else {
          console.error('❌ X Ekranı güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xEkraniHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Ekran Tasarımları hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && (ekranTasarimlariTableHook.isProcessed || ekranTasarimTextHook.isProcessed) && amacKapsamSaved) {
      console.log('📄 Ekran Tasarımları işlendi, database\'e kaydediliyor...');
      console.log('🔍 Ekran Tasarımları hook durumu:', {
        tableProcessed: ekranTasarimlariTableHook.isProcessed,
        textProcessed: ekranTasarimTextHook.isProcessed,
        formData: ekranTasarimlariTableHook.formData,
        textContent: ekranTasarimTextHook.content,
        selectedFile: selectedDocxFile.name
      });
      
      // Ekran Tasarımları verilerini JSON formatında kaydet (hem tablolar hem text)
      const ekranTasarimlariData = {
        title: 'Ekran Tasarımları',
        formData: ekranTasarimlariTableHook.formData,
        tableValidation: ekranTasarimlariTableHook.validation,
        tableProcessed: ekranTasarimlariTableHook.isProcessed,
        tableLoading: ekranTasarimlariTableHook.isLoading,
        textContent: ekranTasarimTextHook.content,
        textValidation: ekranTasarimTextHook.validation,
        textProcessed: ekranTasarimTextHook.isProcessed,
        textLoading: ekranTasarimTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        ekran_tasarimlari: JSON.stringify(ekranTasarimlariData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Ekran Tasarımları güncellendi:', result);
        } else {
          console.error('❌ Ekran Tasarımları güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, ekranTasarimlariTableHook.isProcessed, ekranTasarimTextHook.isProcessed, amacKapsamSaved]);

  // Tasklar/Batchlar hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && (tasklarBatchlarTableHook.isProcessed || tasklarBatchlarTextHook.isProcessed) && amacKapsamSaved) {
      console.log('📄 Tasklar/Batchlar işlendi, database\'e kaydediliyor...');
      console.log('🔍 Tasklar/Batchlar hook durumu:', {
        tableProcessed: tasklarBatchlarTableHook.isProcessed,
        textProcessed: tasklarBatchlarTextHook.isProcessed,
        formData: tasklarBatchlarTableHook.formData,
        textContent: tasklarBatchlarTextHook.content,
        selectedFile: selectedDocxFile.name
      });
      
      // Tasklar/Batchlar verilerini JSON formatında kaydet (hem tablolar hem text)
      const tasklarBatchlarData = {
        title: 'Tasklar/Batchlar',
        formData: tasklarBatchlarTableHook.formData,
        tableValidation: tasklarBatchlarTableHook.validation,
        tableProcessed: tasklarBatchlarTableHook.isProcessed,
        tableLoading: tasklarBatchlarTableHook.isLoading,
        textContent: tasklarBatchlarTextHook.content,
        textValidation: tasklarBatchlarTextHook.validation,
        textProcessed: tasklarBatchlarTextHook.isProcessed,
        textLoading: tasklarBatchlarTextHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        tasklar_batchlar: JSON.stringify(tasklarBatchlarData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Tasklar/Batchlar güncellendi:', result);
        } else {
          console.error('❌ Tasklar/Batchlar güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, tasklarBatchlarTableHook.isProcessed, tasklarBatchlarTextHook.isProcessed, amacKapsamSaved]);

  // Task İş Akışı hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && taskIsAkisiHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Task İş Akışı işlendi, database\'e kaydediliyor...');
      console.log('🔍 Task İş Akışı hook durumu:', {
        isProcessed: taskIsAkisiHook.isProcessed,
        content: taskIsAkisiHook.content,
        validation: taskIsAkisiHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Task İş Akışı verilerini JSON formatında kaydet
      const taskIsAkisiData = {
        title: 'Task İş Akışı',
        content: taskIsAkisiHook.content || '',
        validation: taskIsAkisiHook.validation,
        isProcessed: taskIsAkisiHook.isProcessed,
        isLoading: taskIsAkisiHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        task_is_akisi: JSON.stringify(taskIsAkisiData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Task İş Akışı güncellendi:', result);
        } else {
          console.error('❌ Task İş Akışı güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, taskIsAkisiHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Entegrasyonlar hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && entegrasyonlarHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Entegrasyonlar işlendi, database\'e kaydediliyor...');
      console.log('🔍 Entegrasyonlar hook durumu:', {
        isProcessed: entegrasyonlarHook.isProcessed,
        entegrasyonlar: entegrasyonlarHook.entegrasyonlar,
        validation: entegrasyonlarHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Entegrasyonlar verilerini JSON formatında kaydet
      const entegrasyonlarData = {
        title: 'Entegrasyonlar',
        entegrasyonlar: entegrasyonlarHook.entegrasyonlar || [],
        validation: entegrasyonlarHook.validation,
        isProcessed: entegrasyonlarHook.isProcessed,
        isLoading: entegrasyonlarHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        entegrasyonlar: JSON.stringify(entegrasyonlarData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Entegrasyonlar güncellendi:', result);
        } else {
          console.error('❌ Entegrasyonlar güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, entegrasyonlarHook.isProcessed, amacKapsamSaved]);

  // Mesajlar hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && mesajlarHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Mesajlar işlendi, database\'e kaydediliyor...');
      console.log('🔍 Mesajlar hook durumu:', {
        isProcessed: mesajlarHook.isProcessed,
        mesajlar: mesajlarHook.mesajlar,
        validation: mesajlarHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Mesajlar verilerini JSON formatında kaydet
      const mesajlarData = {
        title: 'Mesajlar/Uyarılar/Bilgilendirmeler',
        mesajlar: mesajlarHook.mesajlar || [],
        validation: mesajlarHook.validation,
        isProcessed: mesajlarHook.isProcessed,
        isLoading: mesajlarHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        mesajlar: JSON.stringify(mesajlarData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Mesajlar güncellendi:', result);
        } else {
          console.error('❌ Mesajlar güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, mesajlarHook.isProcessed, amacKapsamSaved]);

  // Parametreler hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && parametrelerHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Parametreler işlendi, database\'e kaydediliyor...');
      console.log('🔍 Parametreler hook durumu:', {
        isProcessed: parametrelerHook.isProcessed,
        parametreler: parametrelerHook.parametreler,
        validation: parametrelerHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Parametreler verilerini JSON formatında kaydet
      const parametrelerData = {
        title: 'Parametreler ve Tanımlar',
        parametreler: parametrelerHook.parametreler || [],
        validation: parametrelerHook.validation,
        isProcessed: parametrelerHook.isProcessed,
        isLoading: parametrelerHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        parametreler: JSON.stringify(parametrelerData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Parametreler güncellendi:', result);
        } else {
          console.error('❌ Parametreler güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, parametrelerHook.isProcessed, amacKapsamSaved]);

  // Conversion Migration hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && conversionMigrationHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Conversion Migration işlendi, database\'e kaydediliyor...');
      console.log('🔍 Conversion Migration hook durumu:', {
        isProcessed: conversionMigrationHook.isProcessed,
        content: conversionMigrationHook.content,
        validation: conversionMigrationHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Conversion Migration verilerini JSON formatında kaydet
      const conversionMigrationData = {
        title: 'Conversion ve Migration',
        content: conversionMigrationHook.content || '',
        validation: conversionMigrationHook.validation,
        isProcessed: conversionMigrationHook.isProcessed,
        isLoading: conversionMigrationHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        conversation_migration: JSON.stringify(conversionMigrationData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Conversion Migration güncellendi:', result);
        } else {
          console.error('❌ Conversion Migration güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, conversionMigrationHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Diagram Akışlar hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && diagramAkislarHook.isProcessed && amacKapsamSaved && !isTransferMode) {
      console.log('📄 Diagram Akışlar işlendi, database\'e kaydediliyor...');
      console.log('🔍 Diagram Akışlar hook durumu:', {
        isProcessed: diagramAkislarHook.isProcessed,
        content: diagramAkislarHook.content,
        validation: diagramAkislarHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Diagram Akışlar verilerini JSON formatında kaydet
      const diagramAkislarData = {
        title: 'Diagram ve Akışlar',
        content: diagramAkislarHook.content || '',
        validation: diagramAkislarHook.validation,
        isProcessed: diagramAkislarHook.isProcessed,
        isLoading: diagramAkislarHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        diagram_akislar: JSON.stringify(diagramAkislarData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Diagram Akışlar güncellendi:', result);
        } else {
          console.error('❌ Diagram Akışlar güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, diagramAkislarHook.isProcessed, amacKapsamSaved, isTransferMode]);

  // Muhasebe hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && muhasebeHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Muhasebe işlendi, database\'e kaydediliyor...');
      console.log('🔍 Muhasebe hook durumu:', {
        isProcessed: muhasebeHook.isProcessed,
        content: muhasebeHook.content,
        validation: muhasebeHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Muhasebe verilerini JSON formatında kaydet
      const muhasebeData = {
        title: 'Muhasebe',
        content: muhasebeHook.content || '',
        validation: muhasebeHook.validation,
        isProcessed: muhasebeHook.isProcessed,
        isLoading: muhasebeHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        muhasebe: JSON.stringify(muhasebeData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Muhasebe güncellendi:', result);
        } else {
          console.error('❌ Muhasebe güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, muhasebeHook.isProcessed, amacKapsamSaved]);

  // X İşlemi Muhasebe Deseni hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && xIslemiMuhasebeDeseniHook.isProcessed && amacKapsamSaved) {
      console.log('📄 X İşlemi Muhasebe Deseni işlendi, database\'e kaydediliyor...');
      console.log('🔍 X İşlemi Muhasebe Deseni hook durumu:', {
        isProcessed: xIslemiMuhasebeDeseniHook.isProcessed,
        content: xIslemiMuhasebeDeseniHook.content,
        validation: xIslemiMuhasebeDeseniHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // X İşlemi Muhasebe Deseni verilerini JSON formatında kaydet
      const xIslemiMuhasebeDeseniData = {
        title: 'X İşlemi Muhasebe Deseni',
        content: xIslemiMuhasebeDeseniHook.content || '',
        validation: xIslemiMuhasebeDeseniHook.validation,
        isProcessed: xIslemiMuhasebeDeseniHook.isProcessed,
        isLoading: xIslemiMuhasebeDeseniHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        x_islemi_muhasebe_deseni: JSON.stringify(xIslemiMuhasebeDeseniData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ X İşlemi Muhasebe Deseni güncellendi:', result);
        } else {
          console.error('❌ X İşlemi Muhasebe Deseni güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xIslemiMuhasebeDeseniHook.isProcessed, amacKapsamSaved]);

  // Case1 (X İşlemi Muhasebe Tablosu) hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && xIslemiMuhasebeHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Case1 (X İşlemi Muhasebe) işlendi, database\'e kaydediliyor...');
      console.log('🔍 Case1 hook durumu:', {
        isProcessed: xIslemiMuhasebeHook.isProcessed,
        tableRows: xIslemiMuhasebeHook.tableRows,
        validation: xIslemiMuhasebeHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Case1 verilerini JSON formatında kaydet
      const case1Data = {
        title: 'Case1 - X İşlemi Muhasebe',
        tableRows: xIslemiMuhasebeHook.tableRows || [],
        validation: xIslemiMuhasebeHook.validation,
        isProcessed: xIslemiMuhasebeHook.isProcessed,
        isLoading: xIslemiMuhasebeHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        case1: JSON.stringify(case1Data, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Case1 güncellendi:', result);
        } else {
          console.error('❌ Case1 güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xIslemiMuhasebeHook.isProcessed, amacKapsamSaved]);

  // X İşlemi Kayıt Kuralları hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && xIslemiKayitKurallariHook.isProcessed && amacKapsamSaved) {
      console.log('📄 X İşlemi Kayıt Kuralları işlendi, database\'e kaydediliyor...');
      console.log('🔍 X İşlemi Kayıt Kuralları hook durumu:', {
        isProcessed: xIslemiKayitKurallariHook.isProcessed,
        content: xIslemiKayitKurallariHook.content,
        validation: xIslemiKayitKurallariHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // X İşlemi Kayıt Kuralları verilerini JSON formatında kaydet
      const xIslemiKayitKurallariData = {
        title: 'X İşlemi Kayıt Kuralları',
        content: xIslemiKayitKurallariHook.content || '',
        validation: xIslemiKayitKurallariHook.validation,
        isProcessed: xIslemiKayitKurallariHook.isProcessed,
        isLoading: xIslemiKayitKurallariHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        x_islemi_kayit_kurallari: JSON.stringify(xIslemiKayitKurallariData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ X İşlemi Kayıt Kuralları güncellendi:', result);
        } else {
          console.error('❌ X İşlemi Kayıt Kuralları güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xIslemiKayitKurallariHook.isProcessed, amacKapsamSaved]);

  // X İşlemi Vergi Komisyon hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && xIslemiVergiKomisyonHook.isProcessed && amacKapsamSaved) {
      console.log('📄 X İşlemi Vergi Komisyon işlendi, database\'e kaydediliyor...');
      console.log('🔍 X İşlemi Vergi Komisyon hook durumu:', {
        isProcessed: xIslemiVergiKomisyonHook.isProcessed,
        content: xIslemiVergiKomisyonHook.content,
        validation: xIslemiVergiKomisyonHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // X İşlemi Vergi Komisyon verilerini JSON formatında kaydet
      const xIslemiVergiKomisyonData = {
        title: 'X İşlemi Vergi Komisyon',
        content: xIslemiVergiKomisyonHook.content || '',
        validation: xIslemiVergiKomisyonHook.validation,
        isProcessed: xIslemiVergiKomisyonHook.isProcessed,
        isLoading: xIslemiVergiKomisyonHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        x_islemi_vergi_komisyon: JSON.stringify(xIslemiVergiKomisyonData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ X İşlemi Vergi Komisyon güncellendi:', result);
        } else {
          console.error('❌ X İşlemi Vergi Komisyon güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xIslemiVergiKomisyonHook.isProcessed, amacKapsamSaved]);

  // X İşlemi Muhasebe Senaryoları hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && xIslemiMuhasebeSenaryolariHook.isProcessed && amacKapsamSaved) {
      console.log('📄 X İşlemi Muhasebe Senaryoları işlendi, database\'e kaydediliyor...');
      console.log('🔍 X İşlemi Muhasebe Senaryoları hook durumu:', {
        isProcessed: xIslemiMuhasebeSenaryolariHook.isProcessed,
        content: xIslemiMuhasebeSenaryolariHook.content,
        validation: xIslemiMuhasebeSenaryolariHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // X İşlemi Muhasebe Senaryoları verilerini JSON formatında kaydet
      const xIslemiMuhasebeSenaryolariData = {
        title: 'X İşlemi Muhasebe Senaryoları',
        content: xIslemiMuhasebeSenaryolariHook.content || '',
        validation: xIslemiMuhasebeSenaryolariHook.validation,
        isProcessed: xIslemiMuhasebeSenaryolariHook.isProcessed,
        isLoading: xIslemiMuhasebeSenaryolariHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        x_islemi_muhasebe_senaryolari: JSON.stringify(xIslemiMuhasebeSenaryolariData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ X İşlemi Muhasebe Senaryoları güncellendi:', result);
        } else {
          console.error('❌ X İşlemi Muhasebe Senaryoları güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xIslemiMuhasebeSenaryolariHook.isProcessed, amacKapsamSaved]);

  // X İşlemi Örnek Kayıtlar hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && xIslemiOrnekKayitlarHook.isProcessed && amacKapsamSaved) {
      console.log('📄 X İşlemi Örnek Kayıtlar işlendi, database\'e kaydediliyor...');
      console.log('🔍 X İşlemi Örnek Kayıtlar hook durumu:', {
        isProcessed: xIslemiOrnekKayitlarHook.isProcessed,
        content: xIslemiOrnekKayitlarHook.content,
        validation: xIslemiOrnekKayitlarHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // X İşlemi Örnek Kayıtlar verilerini JSON formatında kaydet
      const xIslemiOrnekKayitlarData = {
        title: 'X İşlemi Örnek Kayıtlar',
        content: xIslemiOrnekKayitlarHook.content || '',
        validation: xIslemiOrnekKayitlarHook.validation,
        isProcessed: xIslemiOrnekKayitlarHook.isProcessed,
        isLoading: xIslemiOrnekKayitlarHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        x_islemi_ornek_kayitlar: JSON.stringify(xIslemiOrnekKayitlarData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ X İşlemi Örnek Kayıtlar güncellendi:', result);
        } else {
          console.error('❌ X İşlemi Örnek Kayıtlar güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xIslemiOrnekKayitlarHook.isProcessed, amacKapsamSaved]);

  // Fonksiyonel Olmayan Gereksinimler hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && fonksiyonelOlmayanGereksinimlerHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Fonksiyonel Olmayan Gereksinimler işlendi, database\'e kaydediliyor...');
      console.log('🔍 Fonksiyonel Olmayan Gereksinimler hook durumu:', {
        isProcessed: fonksiyonelOlmayanGereksinimlerHook.isProcessed,
        content: fonksiyonelOlmayanGereksinimlerHook.content,
        validation: fonksiyonelOlmayanGereksinimlerHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Fonksiyonel Olmayan Gereksinimler verilerini JSON formatında kaydet
      const fonksiyonelOlmayanGereksinimlerData = {
        title: 'Fonksiyonel Olmayan Gereksinimler',
        content: fonksiyonelOlmayanGereksinimlerHook.content || '',
        validation: fonksiyonelOlmayanGereksinimlerHook.validation,
        isProcessed: fonksiyonelOlmayanGereksinimlerHook.isProcessed,
        isLoading: fonksiyonelOlmayanGereksinimlerHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        fonksiyonel_olmayan_gereksinimler: JSON.stringify(fonksiyonelOlmayanGereksinimlerData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Fonksiyonel Olmayan Gereksinimler güncellendi:', result);
        } else {
          console.error('❌ Fonksiyonel Olmayan Gereksinimler güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, fonksiyonelOlmayanGereksinimlerHook.isProcessed, amacKapsamSaved]);

  // Kimlik Doğrulama ve Log Yönetimi hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && kimlikDogrulamaLogHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Kimlik Doğrulama ve Log Yönetimi işlendi, database\'e kaydediliyor...');
      console.log('🔍 Kimlik Doğrulama ve Log Yönetimi hook durumu:', {
        isProcessed: kimlikDogrulamaLogHook.isProcessed,
        content: kimlikDogrulamaLogHook.content,
        validation: kimlikDogrulamaLogHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Kimlik Doğrulama ve Log Yönetimi verilerini JSON formatında kaydet
      const kimlikDogrulamaLogData = {
        title: 'Kimlik Doğrulama ve Log Yönetimi',
        content: kimlikDogrulamaLogHook.content || '',
        validation: kimlikDogrulamaLogHook.validation,
        isProcessed: kimlikDogrulamaLogHook.isProcessed,
        isLoading: kimlikDogrulamaLogHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        kimlik_dogrulama_log: JSON.stringify(kimlikDogrulamaLogData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Kimlik Doğrulama ve Log Yönetimi güncellendi:', result);
        } else {
          console.error('❌ Kimlik Doğrulama ve Log Yönetimi güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, kimlikDogrulamaLogHook.isProcessed, amacKapsamSaved]);

  // Yetkilendirme ve Onay Mekanizmaları hook'ları çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  // NOT: Sadece 2 hook (yetkilendirme, onay_sureci) tek sütunda birleştirilir
  useEffect(() => {
    if (selectedDocxFile && amacKapsamSaved && 
        (yetkilendirmeHook.isProcessed || onaySureciHook.isProcessed)) {
      
      console.log('📄 Yetkilendirme ve Onay Mekanizmaları işlendi, database\'e kaydediliyor...');
      console.log('🔍 Hook durumları:', {
        yetkilendirme: {isProcessed: yetkilendirmeHook.isProcessed, rowCount: yetkilendirmeHook.yetkilendirmeRows?.length || 0},
        onaySureci: {isProcessed: onaySureciHook.isProcessed, rowCount: onaySureciHook.onaySureciRows?.length || 0},
        selectedFile: selectedDocxFile.name
      });
      
      // Sadece 2 modalın verilerini tek JSON'da birleştir
      const yetkilendirmeOnayData = {
        title: 'Yetkilendirme ve Onay Mekanizmaları',
        modals: {
          yetkilendirme: {
            title: 'Yetkilendirme',
            tableData: {
              tableRows: yetkilendirmeHook.yetkilendirmeRows || []
            },
            validation: {
              found: yetkilendirmeHook.validation?.found || false,
              mode: yetkilendirmeHook.validation?.mode || 'strict',
              errors: yetkilendirmeHook.validation?.errors || [],
              warnings: yetkilendirmeHook.validation?.warnings || [],
              matchedLabels: yetkilendirmeHook.validation?.matchedLabels || []
            },
            isProcessed: yetkilendirmeHook.isProcessed,
            isLoading: yetkilendirmeHook.isLoading
          },
          onaySureci: {
            title: 'Onay Süreci',
            tableData: {
              tableRows: onaySureciHook.onaySureciRows || []
            },
            validation: {
              found: onaySureciHook.validation?.found || false,
              mode: onaySureciHook.validation?.mode || 'strict',
              errors: onaySureciHook.validation?.errors || [],
              warnings: onaySureciHook.validation?.warnings || [],
              matchedLabels: onaySureciHook.validation?.matchedLabels || []
            },
            isProcessed: onaySureciHook.isProcessed,
            isLoading: onaySureciHook.isLoading
          }
        },
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        yetkilendirme_onay: JSON.stringify(yetkilendirmeOnayData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Yetkilendirme ve Onay Mekanizmaları güncellendi:', result);
        } else {
          console.error('❌ Yetkilendirme ve Onay Mekanizmaları güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, yetkilendirmeHook.isProcessed, onaySureciHook.isProcessed, amacKapsamSaved]);

  // Veri Kritikliği hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && veriKritikligiHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Veri Kritikliği işlendi, database\'e kaydediliyor...');
      console.log('🔍 Veri Kritikliği hook durumu:', {
        isProcessed: veriKritikligiHook.isProcessed,
        tableRows: veriKritikligiHook.tableRows,
        validation: veriKritikligiHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Veri Kritikliği verilerini JSON formatında kaydet
      const veriKritikligiData = {
        title: 'Veri Kritikliği',
        tableData: {
          tableRows: veriKritikligiHook.tableRows || []
        },
        validation: {
          found: veriKritikligiHook.validation?.found || false,
          mode: veriKritikligiHook.validation?.mode || 'strict',
          errors: veriKritikligiHook.validation?.errors || [],
          warnings: veriKritikligiHook.validation?.warnings || [],
          matchedLabels: veriKritikligiHook.validation?.matchedLabels || []
        },
        isProcessed: veriKritikligiHook.isProcessed,
        isLoading: veriKritikligiHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        veri_kritikligi: JSON.stringify(veriKritikligiData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Veri Kritikliği güncellendi:', result);
        } else {
          console.error('❌ Veri Kritikliği güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, veriKritikligiHook.isProcessed, amacKapsamSaved]);

  // Paydaşlar ve Kullanıcılar hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && paydaslarKullanicilarHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Paydaşlar ve Kullanıcılar işlendi, database\'e kaydediliyor...');
      console.log('🔍 Paydaşlar ve Kullanıcılar hook durumu:', {
        isProcessed: paydaslarKullanicilarHook.isProcessed,
        formData: paydaslarKullanicilarHook.formData,
        validation: paydaslarKullanicilarHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Paydaşlar ve Kullanıcılar verilerini JSON formatında kaydet
      const paydaslarKullanicilarData = {
        title: 'Paydaşlar ve Kullanıcılar',
        formData: paydaslarKullanicilarHook.formData || {},
        validation: {
          found: paydaslarKullanicilarHook.validation?.found || false,
          mode: paydaslarKullanicilarHook.validation?.mode || 'strict',
          errors: paydaslarKullanicilarHook.validation?.errors || [],
          warnings: paydaslarKullanicilarHook.validation?.warnings || [],
          matchedLabels: paydaslarKullanicilarHook.validation?.matchedLabels || []
        },
        isProcessed: paydaslarKullanicilarHook.isProcessed,
        isLoading: paydaslarKullanicilarHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        paydaslar_kullanicilar: JSON.stringify(paydaslarKullanicilarData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Paydaşlar ve Kullanıcılar güncellendi:', result);
        } else {
          console.error('❌ Paydaşlar ve Kullanıcılar güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, paydaslarKullanicilarHook.isProcessed, amacKapsamSaved]);

  // Kapsam Dışında hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && kapsamDisindaHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Kapsam Dışında işlendi, database\'e kaydediliyor...');
      console.log('🔍 Kapsam Dışında hook durumu:', {
        isProcessed: kapsamDisindaHook.isProcessed,
        content: kapsamDisindaHook.content,
        validation: kapsamDisindaHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Kapsam Dışında verilerini JSON formatında kaydet
      const kapsamDisindaData = {
        title: 'Kapsam Dışında Kalan Konular ve Maddeler',
        content: kapsamDisindaHook.content || '',
        validation: {
          found: kapsamDisindaHook.validation?.found || false,
          mode: kapsamDisindaHook.validation?.mode || 'strict',
          contentLength: kapsamDisindaHook.validation?.contentLength || 0,
          errors: kapsamDisindaHook.validation?.errors || [],
          warnings: kapsamDisindaHook.validation?.warnings || [],
          matchedLabels: kapsamDisindaHook.validation?.matchedLabels || []
        },
        isProcessed: kapsamDisindaHook.isProcessed,
        isLoading: kapsamDisindaHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        kapsam_disinda: JSON.stringify(kapsamDisindaData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Kapsam Dışında güncellendi:', result);
        } else {
          console.error('❌ Kapsam Dışında güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, kapsamDisindaHook.isProcessed, amacKapsamSaved]);

  // Kabul Kriterleri hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && kabulKriterleriHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Kabul Kriterleri işlendi, database\'e kaydediliyor...');
      console.log('🔍 Kabul Kriterleri hook durumu:', {
        isProcessed: kabulKriterleriHook.isProcessed,
        tableRows: kabulKriterleriHook.tableRows,
        parseResult: kabulKriterleriHook.parseResult,
        selectedFile: selectedDocxFile.name
      });
      
      // Kabul Kriterleri verilerini JSON formatında kaydet
      const kabulKriterleriData = {
        title: 'Kabul Kriterleri',
        tableData: {
          tableRows: kabulKriterleriHook.tableRows || []
        },
        validation: {
          found: kabulKriterleriHook.parseResult?.found || false,
          mode: kabulKriterleriHook.parseResult?.mode || 'strict',
          errors: kabulKriterleriHook.parseResult?.errors || [],
          warnings: kabulKriterleriHook.parseResult?.warnings || [],
          matchedLabels: kabulKriterleriHook.parseResult?.matchedLabels || []
        },
        isProcessed: kabulKriterleriHook.isProcessed,
        isLoading: kabulKriterleriHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        kabul_kriterleri: JSON.stringify(kabulKriterleriData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Kabul Kriterleri güncellendi:', result);
        } else {
          console.error('❌ Kabul Kriterleri güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, kabulKriterleriHook.isProcessed, amacKapsamSaved]);

  // Onaylar hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && onaylarHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Onaylar işlendi, database\'e kaydediliyor...');
      console.log('🔍 Onaylar hook durumu:', {
        isProcessed: onaylarHook.isProcessed,
        tableRows: onaylarHook.tableRows,
        parseResult: onaylarHook.parseResult,
        selectedFile: selectedDocxFile.name
      });
      
      // Onaylar verilerini JSON formatında kaydet
      const onaylarData = {
        title: 'Onaylar',
        tableData: {
          tableRows: onaylarHook.tableRows || []
        },
        validation: {
          found: onaylarHook.parseResult?.found || false,
          mode: onaylarHook.parseResult?.mode || 'strict',
          errors: onaylarHook.parseResult?.errors || [],
          warnings: onaylarHook.parseResult?.warnings || [],
          matchedLabels: onaylarHook.parseResult?.matchedLabels || []
        },
        isProcessed: onaylarHook.isProcessed,
        isLoading: onaylarHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        onaylar: JSON.stringify(onaylarData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Onaylar güncellendi:', result);
        } else {
          console.error('❌ Onaylar güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, onaylarHook.isProcessed, amacKapsamSaved]);

  // Ekler hook'u çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  useEffect(() => {
    if (selectedDocxFile && eklerHook.isProcessed && amacKapsamSaved) {
      console.log('📄 Ekler işlendi, database\'e kaydediliyor...');
      console.log('🔍 Ekler hook durumu:', {
        isProcessed: eklerHook.isProcessed,
        content: eklerHook.content,
        validation: eklerHook.validation,
        selectedFile: selectedDocxFile.name
      });
      
      // Ekler verilerini JSON formatında kaydet
      const eklerData = {
        title: 'Ekler',
        content: eklerHook.content || '',
        validation: {
          found: eklerHook.validation?.found || false,
          mode: eklerHook.validation?.mode || 'strict',
          contentLength: eklerHook.validation?.contentLength || 0,
          errors: eklerHook.validation?.errors || [],
          warnings: eklerHook.validation?.warnings || [],
          matchedLabels: eklerHook.validation?.matchedLabels || []
        },
        isProcessed: eklerHook.isProcessed,
        isLoading: eklerHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        ekler: JSON.stringify(eklerData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ Ekler güncellendi:', result);
        } else {
          console.error('❌ Ekler güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, eklerHook.isProcessed, amacKapsamSaved]);

  // X İşlemi Muhasebesi hook'ı çalıştığında database'e kaydet/güncelle  
  // NOT: Amaç-Kapsam başarıyla kaydedildikten SONRA çalışır
  // NOT: Sadece FORM verilerini kaydeder, tablo verilerini değil
  useEffect(() => {
    if (selectedDocxFile && xIslemiMuhasebeModalHook.isProcessed && amacKapsamSaved) {
      console.log('📄 X İşlemi Muhasebesi (Form) işlendi, database\'e kaydediliyor...');
      console.log('🔍 X İşlemi Muhasebesi form durumu:', {
        modalProcessed: xIslemiMuhasebeModalHook.isProcessed,
        formData: xIslemiMuhasebeModalHook.formData,
        selectedFile: selectedDocxFile.name
      });
      
      // X İşlemi Muhasebesi verilerini JSON formatında kaydet (sadece form verileri)
      const xIslemiMuhasebeData = {
        title: 'X İşlemi Muhasebesi',
        formData: xIslemiMuhasebeModalHook.formData || {},
        validation: xIslemiMuhasebeModalHook.validation,
        isProcessed: xIslemiMuhasebeModalHook.isProcessed,
        isLoading: xIslemiMuhasebeModalHook.isLoading,
        timestamp: new Date().toISOString()
      };
      
      updateAnalizFaz1(selectedDocxFile.name, {
        x_islemi_muhasebesi: JSON.stringify(xIslemiMuhasebeData, null, 2)
      }).then(result => {
        if (result.success) {
          console.log('✅ X İşlemi Muhasebesi (Form) güncellendi:', result);
        } else {
          console.error('❌ X İşlemi Muhasebesi (Form) güncelleme hatası:', result.error);
        }
      });
    }
  }, [selectedDocxFile, xIslemiMuhasebeModalHook.isProcessed, amacKapsamSaved]);

  
  // Ekran tasarımları modal state
  const [isEkranTasarimlariModalOpen, setIsEkranTasarimlariModalOpen] = useState(false);
  const [selectedEkranTasarimlariSection, setSelectedEkranTasarimlariSection] = useState<{id: string, title: string} | null>(null);

  // Tasklar/Batchlar Modal State
  const [isTasklarBatchlarModalOpen, setIsTasklarBatchlarModalOpen] = useState(false);
  const [selectedTasklarBatchlarSection, setSelectedTasklarBatchlarSection] = useState<{id: string, title: string} | null>(null);

  // Entegrasyonlar modal states
  const [isEntegrasyonlarModalOpen, setIsEntegrasyonlarModalOpen] = useState(false);
  const [selectedEntegrasyonlarSection, setSelectedEntegrasyonlarSection] = useState<{id: string, title: string} | null>(null);

  // Mesajlar modal states
  const [isMesajlarModalOpen, setIsMesajlarModalOpen] = useState(false);
  const [selectedMesajlarSection, setSelectedMesajlarSection] = useState<{id: string, title: string} | null>(null);

  // Parametreler modal states
  const [isParametrelerModalOpen, setIsParametrelerModalOpen] = useState(false);
  const [selectedParametrelerSection, setSelectedParametrelerSection] = useState<{id: string, title: string} | null>(null);

  // Conversion ve Migration modal states
  const [isConversionMigrationModalOpen, setIsConversionMigrationModalOpen] = useState(false);
  const [selectedConversionMigrationSection, setSelectedConversionMigrationSection] = useState<{id: string, title: string} | null>(null);

  // Diagram ve Akışlar modal states
  const [isDiagramAkislarModalOpen, setIsDiagramAkislarModalOpen] = useState(false);
  const [selectedDiagramAkislarSection, setSelectedDiagramAkislarSection] = useState<{id: string, title: string} | null>(null);

  // X İşlemi Muhasebesi modal states
  const [isXIslemiMuhasebeModalOpen, setIsXIslemiMuhasebeModalOpen] = useState(false);
  const [selectedXIslemiMuhasebeSection, setSelectedXIslemiMuhasebeSection] = useState<{id: string, title: string} | null>(null);

  // Muhasebe modal states
  const [isMuhasebeModalOpen, setIsMuhasebeModalOpen] = useState(false);
  const [selectedMuhasebeSection, setSelectedMuhasebeSection] = useState<{id: string, title: string} | null>(null);

  // X İşlemi Muhasebe Deseni modal states
  const [isXIslemiMuhasebeDeseniModalOpen, setIsXIslemiMuhasebeDeseniModalOpen] = useState(false);
  const [selectedXIslemiMuhasebeDeseniSection, setSelectedXIslemiMuhasebeDeseniSection] = useState<{id: string, title: string} | null>(null);

  // Case1 modal states
  const [isCase1ModalOpen, setIsCase1ModalOpen] = useState(false);
  const [selectedCase1Section, setSelectedCase1Section] = useState<{id: string, title: string} | null>(null);

  // X İşlemi Kayıt Kuralları modal states
  const [isXIslemiKayitKurallariModalOpen, setIsXIslemiKayitKurallariModalOpen] = useState(false);
  const [selectedXIslemiKayitKurallariSection, setSelectedXIslemiKayitKurallariSection] = useState<{id: string, title: string} | null>(null);

  // X İşlemi Vergi / Komisyon modal states
  const [isXIslemiVergiKomisyonModalOpen, setIsXIslemiVergiKomisyonModalOpen] = useState(false);
  const [selectedXIslemiVergiKomisyonSection, setSelectedXIslemiVergiKomisyonSection] = useState<{id: string, title: string} | null>(null);

  // X İşlemi Muhasebe Senaryoları modal states
  const [isXIslemiMuhasebeSenaryolariModalOpen, setIsXIslemiMuhasebeSenaryolariModalOpen] = useState(false);
  const [selectedXIslemiMuhasebeSenaryolariSection, setSelectedXIslemiMuhasebeSenaryolariSection] = useState<{id: string, title: string} | null>(null);

  // X İşlemi Örnek Kayıtlar modal states
  const [isXIslemiOrnekKayitlarModalOpen, setIsXIslemiOrnekKayitlarModalOpen] = useState(false);
  const [selectedXIslemiOrnekKayitlarSection, setSelectedXIslemiOrnekKayitlarSection] = useState<{id: string, title: string} | null>(null);

  // Fonksiyonel Olmayan Gereksinimler modal states
  const [isFonksiyonelOlmayanGereksinimlerModalOpen, setIsFonksiyonelOlmayanGereksinimlerModalOpen] = useState(false);
  const [selectedFonksiyonelOlmayanGereksinimlerSection, setSelectedFonksiyonelOlmayanGereksinimlerSection] = useState<{id: string, title: string} | null>(null);

  // Kimlik Doğrulama ve Log Yönetimi modal states
  const [isKimlikDogrulamaLogModalOpen, setIsKimlikDogrulamaLogModalOpen] = useState(false);
  const [selectedKimlikDogrulamaLogSection, setSelectedKimlikDogrulamaLogSection] = useState<{id: string, title: string} | null>(null);

  // Yetkilendirme ve Onay Mekanizmaları modal states
  const [isYetkilendirmeOnayModalOpen, setIsYetkilendirmeOnayModalOpen] = useState(false);
  const [selectedYetkilendirmeOnaySection, setSelectedYetkilendirmeOnaySection] = useState<{id: string, title: string} | null>(null);

  // Veri Kritikliği modal states
  const [isVeriKritikligiModalOpen, setIsVeriKritikligiModalOpen] = useState(false);
  const [selectedVeriKritikligiSection, setSelectedVeriKritikligiSection] = useState<{id: string, title: string} | null>(null);

  // Paydaşlar ve Kullanıcılar modal states
  const [isPaydaslarKullanicilarModalOpen, setIsPaydaslarKullanicilarModalOpen] = useState(false);
  const [selectedPaydaslarKullanicilarSection, setSelectedPaydaslarKullanicilarSection] = useState<{id: string, title: string} | null>(null);

  // Kapsam Dışında Kalan Konular modal states
  const [isKapsamDisindaModalOpen, setIsKapsamDisindaModalOpen] = useState(false);
  const [selectedKapsamDisindaSection, setSelectedKapsamDisindaSection] = useState<{id: string, title: string} | null>(null);

  // Kabul Kriterleri modal states
  const [isKabulKriterleriModalOpen, setIsKabulKriterleriModalOpen] = useState(false);
  const [selectedKabulKriterleriSection, setSelectedKabulKriterleriSection] = useState<{id: string, title: string} | null>(null);

  // Onaylar modal states
  const [isOnaylarModalOpen, setIsOnaylarModalOpen] = useState(false);
  const [selectedOnaylarSection, setSelectedOnaylarSection] = useState<{id: string, title: string} | null>(null);

  // Ekler modal states
  const [isEklerModalOpen, setIsEklerModalOpen] = useState(false);
  const [selectedEklerSection, setSelectedEklerSection] = useState<{id: string, title: string} | null>(null);
  
  const handleScroll = useCallback(() => {
    if (!isScrolling) {
      setIsScrolling(true);
      // Reset scrolling state after scroll ends
      setTimeout(() => setIsScrolling(false), 150);
    }
  }, [isScrolling]);

  // Modal handlers
  const handleEditSection = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedSection({ id: sectionId, title: sectionTitle });
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSection(null);
  }, []);

  // Conversion ve Migration handler
  const handleConversionMigrationEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedConversionMigrationSection({ id: sectionId, title: sectionTitle });
    setIsConversionMigrationModalOpen(true);
  }, []);

  // Diagram ve Akışlar handler
  const handleDiagramAkislarEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedDiagramAkislarSection({ id: sectionId, title: sectionTitle });
    setIsDiagramAkislarModalOpen(true);
  }, []);

  // X İşlemi Muhasebesi handler
  const handleXIslemiMuhasebeEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedXIslemiMuhasebeSection({ id: sectionId, title: sectionTitle });
    setIsXIslemiMuhasebeModalOpen(true);
  }, []);

  // Muhasebe handler
  const handleMuhasebeEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedMuhasebeSection({ id: sectionId, title: sectionTitle });
    setIsMuhasebeModalOpen(true);
  }, []);

  // X İşlemi Muhasebe Deseni handler
  const handleXIslemiMuhasebeDeseniEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedXIslemiMuhasebeDeseniSection({ id: sectionId, title: sectionTitle });
    setIsXIslemiMuhasebeDeseniModalOpen(true);
  }, []);

  // Case1 handler
  const handleCase1Edit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedCase1Section({ id: sectionId, title: sectionTitle });
    setIsCase1ModalOpen(true);
  }, []);

  // X İşlemi Kayıt Kuralları handler
  const handleXIslemiKayitKurallariEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedXIslemiKayitKurallariSection({ id: sectionId, title: sectionTitle });
    setIsXIslemiKayitKurallariModalOpen(true);
  }, []);

  // X İşlemi Vergi / Komisyon handler
  const handleXIslemiVergiKomisyonEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedXIslemiVergiKomisyonSection({ id: sectionId, title: sectionTitle });
    setIsXIslemiVergiKomisyonModalOpen(true);
  }, []);

  // X İşlemi Muhasebe Senaryoları handler
  const handleXIslemiMuhasebeSenaryolariEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedXIslemiMuhasebeSenaryolariSection({ id: sectionId, title: sectionTitle });
    setIsXIslemiMuhasebeSenaryolariModalOpen(true);
  }, []);

  // X İşlemi Örnek Kayıtlar handler
  const handleXIslemiOrnekKayitlarEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedXIslemiOrnekKayitlarSection({ id: sectionId, title: sectionTitle });
    setIsXIslemiOrnekKayitlarModalOpen(true);
  }, []);

  // Fonksiyonel Olmayan Gereksinimler handler
  const handleFonksiyonelOlmayanGereksinimlerEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedFonksiyonelOlmayanGereksinimlerSection({ id: sectionId, title: sectionTitle });
    setIsFonksiyonelOlmayanGereksinimlerModalOpen(true);
  }, []);

  // Kimlik Doğrulama ve Log Yönetimi handler
  const handleKimlikDogrulamaLogEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedKimlikDogrulamaLogSection({ id: sectionId, title: sectionTitle });
    setIsKimlikDogrulamaLogModalOpen(true);
  }, []);

  // Yetkilendirme ve Onay Mekanizmaları handler
  const handleYetkilendirmeOnayEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedYetkilendirmeOnaySection({ id: sectionId, title: sectionTitle });
    setIsYetkilendirmeOnayModalOpen(true);
  }, []);

  // Veri Kritikliği handler
  const handleVeriKritikligiEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedVeriKritikligiSection({ id: sectionId, title: sectionTitle });
    setIsVeriKritikligiModalOpen(true);
  }, []);

  // Paydaşlar ve Kullanıcılar handler
  const handlePaydaslarKullanicilarEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedPaydaslarKullanicilarSection({ id: sectionId, title: sectionTitle });
    setIsPaydaslarKullanicilarModalOpen(true);
  }, []);

  // Kapsam Dışında Kalan Konular handler
  const handleKapsamDisindaEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedKapsamDisindaSection({ id: sectionId, title: sectionTitle });
    setIsKapsamDisindaModalOpen(true);
  }, []);

  // Kabul Kriterleri handler
  const handleKabulKriterleriEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedKabulKriterleriSection({ id: sectionId, title: sectionTitle });
    setIsKabulKriterleriModalOpen(true);
  }, []);

  // Onaylar handler
  const handleOnaylarEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedOnaylarSection({ id: sectionId, title: sectionTitle });
    setIsOnaylarModalOpen(true);
  }, []);

  // Ekler handler
  const handleEklerEdit = useCallback((sectionId: string, sectionTitle: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setButtonPosition({ x, y });
    setSelectedEklerSection({ id: sectionId, title: sectionTitle });
    setIsEklerModalOpen(true);
  }, []);

  // Doküman tarihçesi modal handlers
  const handleOpenHistoryModal = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedHistorySection({ id: sectionId, title: sectionTitle });
    setIsHistoryModalOpen(true);
  }, []);

  const handleCloseHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(false);
    setSelectedHistorySection(null);
  }, []);

  // Section chat modal handlers
  const handleOpenSectionChat = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedChatSection({ id: sectionId, title: sectionTitle });
    setIsSectionChatOpen(true);
  }, []);

  const handleCloseSectionChat = useCallback(() => {
    setIsSectionChatOpen(false);
    setSelectedChatSection(null);
  }, []);

  // Talep değerlendirmesi modal handlers
  const handleOpenTalepModal = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedTalepSection({ id: sectionId, title: sectionTitle });
    setIsTalepModalOpen(true);
  }, []);

  const handleCloseTalepModal = useCallback(() => {
    setIsTalepModalOpen(false);
    setSelectedTalepSection(null);
  }, []);

  // Ekran tasarımları modal handlers
  const handleOpenEkranTasarimlariModal = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedEkranTasarimlariSection({ id: sectionId, title: sectionTitle });
    setIsEkranTasarimlariModalOpen(true);
  }, []);

  const handleCloseEkranTasarimlariModal = useCallback(() => {
    setIsEkranTasarimlariModalOpen(false);
    setSelectedEkranTasarimlariSection(null);
  }, []);

  // Tasklar/Batchlar Modal Handlers
  const handleOpenTasklarBatchlarModal = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedTasklarBatchlarSection({ id: sectionId, title: sectionTitle });
    setIsTasklarBatchlarModalOpen(true);
  }, []);

  const handleCloseTasklarBatchlarModal = useCallback(() => {
    setIsTasklarBatchlarModalOpen(false);
    setSelectedTasklarBatchlarSection(null);
  }, []);

  // Entegrasyonlar modal handlers
  const handleOpenEntegrasyonlarModal = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedEntegrasyonlarSection({ id: sectionId, title: sectionTitle });
    setIsEntegrasyonlarModalOpen(true);
  }, []);

  const handleCloseEntegrasyonlarModal = useCallback(() => {
    setIsEntegrasyonlarModalOpen(false);
    setSelectedEntegrasyonlarSection(null);
  }, []);

  // Mesajlar modal handlers
  const handleOpenMesajlarModal = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedMesajlarSection({ id: sectionId, title: sectionTitle });
    setIsMesajlarModalOpen(true);
  }, []);

  const handleCloseMesajlarModal = useCallback(() => {
    setIsMesajlarModalOpen(false);
    setSelectedMesajlarSection(null);
  }, []);

  // Parametreler modal handlers
  const handleOpenParametrelerModal = useCallback((sectionId: string, sectionTitle: string) => {
    setSelectedParametrelerSection({ id: sectionId, title: sectionTitle });
    setIsParametrelerModalOpen(true);
  }, []);

  const handleCloseParametrelerModal = useCallback(() => {
    setIsParametrelerModalOpen(false);
    setSelectedParametrelerSection(null);
  }, []);

  // DOCX modal handlers
  const handleDocxFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setSelectedDocxFile(file);
      
      // DOCX dosyası yüklendi, tüm modallarda kullanılabilir oldu
      alert('DOCX dosyası yüklendi! Artık herhangi bir modalı açtığınızda otomatik doldurulacak.');
    } else {
      alert('Lütfen geçerli bir DOCX dosyası seçin.');
    }
    // Input'u temizle
    event.target.value = '';
  }, []);

  const handleCloseTalepBilgileriModal = useCallback(() => {
    setIsTalepBilgileriModalOpen(false);
    setSelectedDocxFile(null);
  }, []);

  return (
    <div className="llm-analysis-page">
      {/* Üst Banner Alanı */}
      <div className="analysis-header">
        <div className="header-content">
          <div className="header-main">
            <h1 className="page-title">
              <span className="title-text">Manuel/LLM Analiz</span>
            </h1>
            <p className="page-description">
              Elle içerik yazın veya AI ile otomatik analizler oluşturun. 
              Profesyonel döküman üretimi için kapsamlı araçlar.
            </p>
          </div>
          
          {/* İstatistik Alanı */}
          <div className="stats-panel">
            <div className="completion-circle">
              <div className="circle-progress">
                <svg className="progress-ring" width="80" height="80">
                  <circle
                    className="progress-ring-background"
                    cx="40"
                    cy="40"
                    r="32"
                  />
                  <circle
                    className="progress-ring-fill"
                    cx="40"
                    cy="40"
                    r="32"
                    style={{
                      strokeDasharray: progressRingProps.circumference,
                      strokeDashoffset: progressRingProps.offset
                    }}
                  />
                </svg>
                <div className="progress-text">
                  <span className="percentage">{analysisStats.completedPercentage}%</span>
                  <span className="label">Tamamlandı</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alt İstatistikler */}
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{analysisStats.totalSections}</span>
              <span className="stat-label">Bölüm</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">%{analysisStats.completedPercentage}</span>
              <span className="stat-label">Tamamlandı</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{analysisStats.remainingTime}</span>
              <span className="stat-label">Kalan Süre</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ana Kartlar Alanı */}
      <div className="analysis-cards">
        {/* Yeni Döküman Kartı */}
        <div className="analysis-card new-document-card">
          <div className="card-header">
            <div className="card-icon new-doc-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="card-title">Yeni Döküman</h3>
          </div>

          <div className="card-content">
            <div className="input-group">
              <label className="input-label">Döküman Başlığı</label>
              <input
                type="text"
                className="form-input"
                placeholder="Analiz dökümanı başlığını girin..."
                value={documentTitle}
                onChange={handleDocumentTitleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Versiyon</label>
              <input
                type="text"
                className="form-input"
                value={documentVersion}
                onChange={handleDocumentVersionChange}
              />
            </div>

            <div className="card-actions">
              <button className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Yeni Döküman
              </button>
              <button className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Yeni Versiyon
              </button>
            </div>
          </div>
        </div>

        {/* Mevcut Döküman Kartı */}
        <div className="analysis-card existing-document-card">
          <div className="card-header">
            <div className="card-icon existing-doc-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="card-title">Mevcut Döküman</h3>
          </div>

          <div className="card-content">
            <div className="input-group">
              <label className="input-label">Döküman Seçimi</label>
              <select
                className="form-select"
                value={selectedDocument}
                onChange={handleSelectedDocumentChange}
              >
                {documentOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="card-actions">
              <button className="btn btn-success full-width">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Seçili Dökümanı Yükle
              </button>
            </div>
          </div>
        </div>

        {/* Döküman Yükle Kartı */}
        <div className="analysis-card upload-document-card">
          <div className="card-header">
            <div className="card-icon upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="card-title">Döküman Yükle</h3>
          </div>

          <div className="card-content">
            <div className="upload-area">
              <div className="upload-zone">
                <div className="upload-icon-large">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="upload-text">
                  Şablonla birebir aynı .docx analiz dökümanı yükleyin, 
                  alanlar otomatik dolsun.
                </p>
                <div className="upload-actions">
                  <label htmlFor="docx-upload-input" className="btn btn-outline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Dosya Seç veya Sürükle
                  </label>
                  <input
                    id="docx-upload-input"
                    type="file"
                    accept=".docx"
                    onChange={handleDocxFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
                <p className="upload-hint">Sadece .docx dosyaları</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Kartı gizlendi */}
        {/* intentionally removed */}

        {/* Word Export Kartı */}
        {/* Word Olarak İndir kartı kaldırıldı */}
      </div>

      {/* Doküman Bölümleri - Hierarchical Structure */}
      <div className="document-sections">
        <div className="sections-header">
          <div className="sections-title">
            <div className="sections-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Doküman Bölümleri</h3>
          </div>
          <div className="sections-subtitle">
            Her bölümü detaylı modal pencerede düzenleyin ve AI yardımı alın
          </div>
          <div className="sections-controls">
            <select className="ekip-select">
              <option value="temel-bankacilik">Temel Bankacılık</option>
              <option value="kurumsal-bankacilik">Kurumsal Bankacılık</option>
              <option value="yatirim-bankacilik">Yatırım Bankacılığı</option>
            </select>
          </div>
        </div>

        {/* Hierarchical Document Structure */}
        <div className="sections-list hierarchical">
          
          {/* Level 0 - Temel Bilgiler */}
          <div className="section-group level-0-group">
            <div className="section-item level-0">
              <div className="section-header">
                <div className="section-info">
                  <div className="section-number">
                    <span className="number-circle">1</span>
                    <span className="completion-dot completed"></span>
                  </div>
                  <div className="section-content">
                    <h4 className="section-title">Talep Bilgileri</h4>
                    <p className="section-description">Tablo formu</p>
                  </div>
                </div>
                <div className="section-actions">
                  <span className="level-badge level-0-badge">Level 0</span>
                  <button className="edit-button" onClick={(e) => handleEditSection('1', '1. Proje Tanımı', e)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Düzenle
                  </button>
                </div>
              </div>
            </div>

            <div className="section-item level-0">
              <div className="section-header">
                <div className="section-info">
                  <div className="section-number">
                    <span className="number-circle">2</span>
                    <span className="completion-dot completed"></span>
                  </div>
                  <div className="section-content">
                    <h4 className="section-title">Doküman Tarihçesi</h4>
                    <p className="section-description">Tablo formu</p>
                  </div>
                </div>
                <div className="section-actions">
                  <span className="level-badge level-0-badge">Level 0</span>
                  <button 
                    className="edit-button"
                    onClick={() => handleOpenHistoryModal('document-history', 'Doküman Tarihçesi')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Düzenle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Level 1 - Ana Konular */}
          <div className="section-group level-1-group">
            
            {/* 1. Amaç ve Kapsam */}
            <div className="section-item level-1">
              <div className="section-header">
                <div className="section-info">
                  <div className="section-number">
                    <span className="number-circle">1</span>
                    <span className="completion-dot warning"></span>
                  </div>
                  <div className="section-content">
                    <h4 className="section-title">Amaç ve Kapsam</h4>
                    <p className="section-description">Metin alanı</p>
                  </div>
                </div>
                <div className="section-actions">
                  <span className="level-badge level-1-badge">Level 1</span>
                  <button 
                    className="edit-button"
                    onClick={() => handleOpenSectionChat('amac-kapsam', 'Amaç ve Kapsam')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Düzenle
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Talep Değerlendirmesi */}
            <div className="section-item level-1">
              <div className="section-header">
                <div className="section-info">
                  <div className="section-number">
                    <span className="number-circle">2</span>
                    <span className="completion-dot warning"></span>
                  </div>
                  <div className="section-content">
                    <h4 className="section-title">Talep Değerlendirmesi</h4>
                    <p className="section-description">Tablo formu</p>
                  </div>
                </div>
                <div className="section-actions">
                  <span className="level-badge level-1-badge">Level 1</span>
                  <button 
                    className="edit-button"
                    onClick={() => handleOpenTalepModal('talep-degerlendirmesi', 'Talep Değerlendirmesi')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Düzenle
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Mevcut İşleyiş */}
            <div className="section-item level-1">
              <div className="section-header">
                <div className="section-info">
                  <div className="section-number">
                    <span className="number-circle">3</span>
                    <span className="completion-dot warning"></span>
                  </div>
                  <div className="section-content">
                    <h4 className="section-title">Mevcut İşleyiş</h4>
                    <p className="section-description">Metin alanı</p>
                  </div>
                </div>
                <div className="section-actions">
                  <span className="level-badge level-1-badge">Level 1</span>
                  <button 
                    className="edit-button"
                    onClick={() => handleOpenSectionChat('mevcut-isleyis', 'Mevcut İşleyiş')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Düzenle
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Planlanan İşleyiş ve Alt Bölümler */}
            <div className="section-item level-1">
              <div className="section-header">
                <div className="section-info">
                  <div className="section-number">
                    <span className="number-circle">4</span>
                    <span className="completion-dot warning"></span>
                  </div>
                  <div className="section-content">
                    <h4 className="section-title">Planlanan İşleyiş</h4>
                    <p className="section-description">Metin alanı</p>
                  </div>
                </div>
                <div className="section-actions">
                  <span className="level-badge level-1-badge">Level 1</span>
                  <button 
                    className="edit-button"
                    onClick={() => handleOpenSectionChat('planlanan-isleyis', 'Planlanan İşleyiş')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Düzenle
                  </button>
                </div>
              </div>

              {/* Level 2 - Planlanan İşleyiş altındaki bölümler */}
              <div className="sub-sections level-2-subsections">
                
                {/* Fonksiyonel Gereksinimler */}
                <div className="section-item level-2">
                  <div className="section-header">
                    <div className="section-info">
                      <div className="section-number">
                        <span className="number-circle">1</span>
                        <span className="completion-dot warning"></span>
                      </div>
                      <div className="section-content">
                        <h4 className="section-title">Fonksiyonel Gereksinimler</h4>
                        <p className="section-description">Metin alanı</p>
                      </div>
                    </div>
                    <div className="section-actions">
                      <span className="level-badge level-2-badge">Level 2</span>
                      <button 
                        className="edit-button"
                        onClick={() => handleOpenSectionChat('fonksiyonel-gereksinimler', 'Fonksiyonel Gereksinimler')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Düzenle
                      </button>
                    </div>
                  </div>

                  {/* Level 3 - Fonksiyonel Gereksinimler altındaki bölümler */}
                  <div className="sub-sections level-3-subsections">
                    
                    {/* Ekran Gereksinimleri */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">1</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Ekran Gereksinimleri</h4>
                            <p className="section-description">Metin alanı</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button 
                            className="edit-button"
                            onClick={() => handleOpenSectionChat('ekran-gereksinimleri', 'Ekran Gereksinimleri')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>

                      {/* Level 4 - Ekranlar */}
                      <div className="sub-sections level-4-subsections">
                        
                        {/* X Ekranı */}
                        <div className="section-item level-4">
                          <div className="section-header">
                            <div className="section-info">
                              <div className="section-number">
                                <span className="number-circle">1</span>
                                <span className="completion-dot warning"></span>
                              </div>
                              <div className="section-content">
                                <h4 className="section-title">X Ekranı</h4>
                                <p className="section-description">Metin alanı</p>
                              </div>
                            </div>
                            <div className="section-actions">
                              <span className="level-badge level-4-badge">Level 4</span>
                              <button 
                                className="edit-button"
                                onClick={() => handleOpenSectionChat('x-ekrani', 'X Ekranı')}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Düzenle
                              </button>
                            </div>
                          </div>

                          {/* Level 5 - Ekran Tasarımları */}
                          <div className="sub-sections level-5-subsections">
                            <div className="section-item level-5">
                              <div className="section-header">
                                <div className="section-info">
                                  <div className="section-number">
                                    <span className="number-circle">1</span>
                                    <span className="completion-dot warning"></span>
                                  </div>
                                  <div className="section-content">
                                    <h4 className="section-title">Ekran Tasarımları</h4>
                                    <p className="section-description">Tablo formu</p>
                                  </div>
                                </div>
                                <div className="section-actions">
                                  <span className="level-badge level-5-badge">Level 5</span>
                                  <button 
                                    className="edit-button"
                                    onClick={() => handleOpenEkranTasarimlariModal('ekran-tasarimlari', 'Ekran Tasarımları')}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Düzenle
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Y Ekranı */}
                        <div className="section-item level-4">
                          <div className="section-header">
                            <div className="section-info">
                              <div className="section-number">
                                <span className="number-circle">2</span>
                                <span className="completion-dot warning"></span>
                              </div>
                              <div className="section-content">
                                <h4 className="section-title">Y Ekranı</h4>
                                <p className="section-description">Tablo formu</p>
                              </div>
                            </div>
                            <div className="section-actions">
                              <span className="level-badge level-4-badge">Level 4</span>
                              <button className="edit-button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Düzenle
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Z Ekranı */}
                        <div className="section-item level-4">
                          <div className="section-header">
                            <div className="section-info">
                              <div className="section-number">
                                <span className="number-circle">3</span>
                                <span className="completion-dot warning"></span>
                              </div>
                              <div className="section-content">
                                <h4 className="section-title">Z Ekranı</h4>
                                <p className="section-description">Tablo formu</p>
                              </div>
                            </div>
                            <div className="section-actions">
                              <span className="level-badge level-4-badge">Level 4</span>
                              <button className="edit-button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Düzenle
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tasklar/Batchlar */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">2</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Tasklar/Batchlar</h4>
                            <p className="section-description">Tablo formu</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button 
                            className="edit-button"
                            onClick={() => handleOpenTasklarBatchlarModal('tasklar-batchlar', 'Tasklar/Batchlar')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>

                      {/* Level 4 - Task İş Akışı */}
                      <div className="sub-sections level-4-subsections">
                        <div className="section-item level-4">
                          <div className="section-header">
                            <div className="section-info">
                              <div className="section-number">
                                <span className="number-circle">1</span>
                                <span className="completion-dot warning"></span>
                              </div>
                              <div className="section-content">
                                <h4 className="section-title">Task İş Akışı</h4>
                                <p className="section-description">Metin alanı</p>
                              </div>
                            </div>
                            <div className="section-actions">
                              <span className="level-badge level-4-badge">Level 4</span>
                              <button 
                                className="edit-button"
                                onClick={() => handleOpenSectionChat('task-is-akisi', 'Task İş Akışı')}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Düzenle
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4.1.3 Entegrasyonlar - Level 3 */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">3</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Entegrasyonlar</h4>
                            <p className="section-description">Metin alanı</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button 
                            className="edit-button"
                            onClick={() => handleOpenEntegrasyonlarModal('entegrasyonlar', 'Entegrasyonlar')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4.1.4 Mesajlar / Uyarılar / Bilgilendirmeler - Level 3 */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">4</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Mesajlar / Uyarılar / Bilgilendirmeler</h4>
                            <p className="section-description">Metin alanı</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button 
                            className="edit-button"
                            onClick={() => handleOpenMesajlarModal('mesajlar-uyarilar', 'Mesajlar / Uyarılar / Bilgilendirmeler')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4.1.5 Parametreler/Tanımlar - Level 3 */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">5</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Parametreler/Tanımlar</h4>
                            <p className="section-description">Metin alanı</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button 
                            className="edit-button"
                            onClick={() => handleOpenParametrelerModal('parametreler-tanimlar', 'Parametreler/Tanımlar')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4.1.6 Conversion ve Migration - Level 3 */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">6</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Conversion ve Migration</h4>
                            <p className="section-description">Metin alanı</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button className="edit-button" onClick={() => handleOpenSectionChat('conversation-migration', 'Conversion ve Migration')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4.1.7 Diagram ve Akışlar - Level 3 */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">7</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Diagram ve Akışlar</h4>
                            <p className="section-description">Metin alanı</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button className="edit-button" onClick={() => handleOpenSectionChat('diagram-akislar', 'Diagram ve Akışlar')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4.1.8 Muhasebe - Level 3 */}
                    <div className="section-item level-3">
                      <div className="section-header">
                        <div className="section-info">
                          <div className="section-number">
                            <span className="number-circle">8</span>
                            <span className="completion-dot warning"></span>
                          </div>
                          <div className="section-content">
                            <h4 className="section-title">Muhasebe</h4>
                            <p className="section-description">Metin alanı</p>
                          </div>
                        </div>
                        <div className="section-actions">
                          <span className="level-badge level-3-badge">Level 3</span>
                          <button className="edit-button" onClick={() => handleOpenSectionChat('muhasebe', 'Muhasebe')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Düzenle
                          </button>
                        </div>
                      </div>

                      {/* Level 4 - Muhasebe altındaki bölümler */}
                      <div className="sub-sections level-4-subsections">
                        {/* 4.1.8.1 X İşlemi Muhasebesi */}
                        <div className="section-item level-4">
                          <div className="section-header">
                            <div className="section-info">
                              <div className="section-number">
                                <span className="number-circle">1</span>
                                <span className="completion-dot warning"></span>
                              </div>
                              <div className="section-content">
                                <h4 className="section-title">X İşlemi Muhasebesi</h4>
                                <p className="section-description">Metin alanı</p>
                              </div>
                            </div>
                            <div className="section-actions">
                              <span className="level-badge level-4-badge">Level 4</span>
                              <button className="edit-button" onClick={(e) => handleXIslemiMuhasebeEdit('4.1.8.1', 'X İşlemi Muhasebesi', e)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Düzenle
                              </button>
                            </div>
                          </div>

                          {/* Level 5 - X İşlemi Muhasebesi altındaki bölümler */}
                          <div className="sub-sections level-5-subsections">
                            {/* X İşlemi muhasebe deseni */}
                            <div className="section-item level-5">
                              <div className="section-header">
                                <div className="section-info">
                                  <div className="section-number">
                                    <span className="number-circle">1</span>
                                    <span className="completion-dot warning"></span>
                                  </div>
                                  <div className="section-content">
                                    <h4 className="section-title">X İşlemi muhasebe deseni</h4>
                                    <p className="section-description">Metin alanı</p>
                                  </div>
                                </div>
                                <div className="section-actions">
                                  <span className="level-badge level-5-badge">Level 5</span>
                                  <button className="edit-button" onClick={() => handleOpenSectionChat('x-islemi-muhasebe-deseni', 'X İşlemi Muhasebe Deseni')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Düzenle
                                  </button>
                                </div>
                              </div>

                              {/* Level 6 - X İşlemi muhasebe deseni altındaki bölümler */}
                              <div className="sub-sections level-6-subsections">
                                {/* Case1 */}
                                <div className="section-item level-6">
                                  <div className="section-header">
                                    <div className="section-info">
                                      <div className="section-number">
                                        <span className="number-circle">1</span>
                                        <span className="completion-dot warning"></span>
                                      </div>
                                      <div className="section-content">
                                        <h4 className="section-title">Case1</h4>
                                        <p className="section-description">Metin alanı</p>
                                      </div>
                                    </div>
                                    <div className="section-actions">
                                      <span className="level-badge level-6-badge">Level 6</span>
                                      <button className="edit-button" onClick={(e) => handleCase1Edit('4.1.8.1.1.1', 'Case1', e)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Düzenle
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* X İşlemi Kayıt Kuralları */}
                            <div className="section-item level-5">
                              <div className="section-header">
                                <div className="section-info">
                                  <div className="section-number">
                                    <span className="number-circle">2</span>
                                    <span className="completion-dot warning"></span>
                                  </div>
                                  <div className="section-content">
                                    <h4 className="section-title">X İşlemi Kayıt Kuralları</h4>
                                    <p className="section-description">Metin alanı</p>
                                  </div>
                                </div>
                                <div className="section-actions">
                                  <span className="level-badge level-5-badge">Level 5</span>
                                  <button className="edit-button" onClick={() => handleOpenSectionChat('x-islemi-kayit-kurallari', 'X İşlemi Kayıt Kuralları')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Düzenle
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* X İşlemi Vergi / Komisyon */}
                            <div className="section-item level-5">
                              <div className="section-header">
                                <div className="section-info">
                                  <div className="section-number">
                                    <span className="number-circle">3</span>
                                    <span className="completion-dot warning"></span>
                                  </div>
                                  <div className="section-content">
                                    <h4 className="section-title">X İşlemi Vergi / Komisyon</h4>
                                    <p className="section-description">Metin alanı</p>
                                  </div>
                                </div>
                                <div className="section-actions">
                                  <span className="level-badge level-5-badge">Level 5</span>
                                  <button className="edit-button" onClick={() => handleOpenSectionChat('x-islemi-vergi-komisyon', 'X İşlemi Vergi / Komisyon')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Düzenle
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* X İşlemi Muhasebe Senaryoları */}
                            <div className="section-item level-5">
                              <div className="section-header">
                                <div className="section-info">
                                  <div className="section-number">
                                    <span className="number-circle">4</span>
                                    <span className="completion-dot warning"></span>
                                  </div>
                                  <div className="section-content">
                                    <h4 className="section-title">X İşlemi Muhasebe Senaryoları</h4>
                                    <p className="section-description">Metin alanı</p>
                                  </div>
                                </div>
                                <div className="section-actions">
                                  <span className="level-badge level-5-badge">Level 5</span>
                                  <button className="edit-button" onClick={() => handleOpenSectionChat('x-islemi-muhasebe-senaryolari', 'X İşlemi Muhasebe Senaryoları')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Düzenle
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* X İşlemi Örnek Kayıtlar */}
                            <div className="section-item level-5">
                              <div className="section-header">
                                <div className="section-info">
                                  <div className="section-number">
                                    <span className="number-circle">5</span>
                                    <span className="completion-dot warning"></span>
                                  </div>
                                  <div className="section-content">
                                    <h4 className="section-title">X İşlemi Örnek Kayıtlar</h4>
                                    <p className="section-description">Metin alanı</p>
                                  </div>
                                </div>
                                <div className="section-actions">
                                  <span className="level-badge level-5-badge">Level 5</span>
                                  <button className="edit-button" onClick={() => handleOpenSectionChat('x-islemi-ornek-kayitlar', 'X İşlemi Örnek Kayıtlar')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Düzenle
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4.2 Fonksiyonel Olmayan Gereksinimler - Level 2 */}
                  <div className="section-item level-2">
                    <div className="section-header">
                      <div className="section-info">
                        <div className="section-number">
                          <span className="number-circle">2</span>
                          <span className="completion-dot warning"></span>
                        </div>
                        <div className="section-content">
                          <h4 className="section-title">Fonksiyonel Olmayan Gereksinimler</h4>
                          <p className="section-description">Metin alanı</p>
                        </div>
                      </div>
                      <div className="section-actions">
                        <span className="level-badge level-2-badge">Level 2</span>
                        <button className="edit-button" onClick={() => handleOpenSectionChat('fonksiyonel-olmayan-gereksinimler', 'Fonksiyonel Olmayan Gereksinimler')}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Düzenle
                        </button>
                      </div>
                    </div>

                    {/* Level 3 - Fonksiyonel Olmayan Gereksinimler altındaki bölümler */}
                    <div className="sub-sections level-3-subsections">
                      {/* 4.2.1 Kimlik Doğrulama ve Log Yönetimi */}
                      <div className="section-item level-3">
                        <div className="section-header">
                          <div className="section-info">
                            <div className="section-number">
                              <span className="number-circle">1</span>
                              <span className="completion-dot warning"></span>
                            </div>
                            <div className="section-content">
                              <h4 className="section-title">Kimlik Doğrulama ve Log Yönetimi</h4>
                              <p className="section-description">Metin alanı</p>
                            </div>
                          </div>
                          <div className="section-actions">
                            <span className="level-badge level-3-badge">Level 3</span>
                            <button className="edit-button" onClick={() => handleOpenSectionChat('kimlik-dogrulama-log', 'Kimlik Doğrulama ve Log Yönetimi')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Düzenle
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4.2.2 Yetkilendirme ve Onay Mekanizmaları */}
                      <div className="section-item level-3">
                        <div className="section-header">
                          <div className="section-info">
                            <div className="section-number">
                              <span className="number-circle">2</span>
                              <span className="completion-dot warning"></span>
                            </div>
                            <div className="section-content">
                              <h4 className="section-title">Yetkilendirme ve Onay Mekanizmaları</h4>
                              <p className="section-description">Tablolar</p>
                            </div>
                          </div>
                          <div className="section-actions">
                            <span className="level-badge level-3-badge">Level 3</span>
                            <button className="edit-button" onClick={(e) => handleYetkilendirmeOnayEdit('4.2.2', 'Yetkilendirme ve Onay Mekanizmaları', e)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Düzenle
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4.2.3 Veri Kritikliği */}
                      <div className="section-item level-3">
                        <div className="section-header">
                          <div className="section-info">
                            <div className="section-number">
                              <span className="number-circle">3</span>
                              <span className="completion-dot warning"></span>
                            </div>
                            <div className="section-content">
                              <h4 className="section-title">Veri Kritikliği</h4>
                              <p className="section-description">Tablolar</p>
                            </div>
                          </div>
                          <div className="section-actions">
                            <span className="level-badge level-3-badge">Level 3</span>
                            <button className="edit-button" onClick={(e) => handleVeriKritikligiEdit('4.2.3', 'Veri Kritikliği', e)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Düzenle
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              {/* Level 1 devam - diğer ana bölümler */}
              {/* 5. Paylaşlar ve Kullanıcılar */}
              <div className="section-item level-1">
                <div className="section-header">
                  <div className="section-info">
                    <div className="section-number">
                      <span className="number-circle">5</span>
                      <span className="completion-dot warning"></span>
                    </div>
                    <div className="section-content">
                      <h4 className="section-title">Paylaşlar ve Kullanıcılar</h4>
                      <p className="section-description">Tablolar</p>
                    </div>
                  </div>
                  <div className="section-actions">
                    <span className="level-badge level-1-badge">Level 1</span>
                    <button className="edit-button" onClick={(e) => handlePaydaslarKullanicilarEdit('5', 'Paylaşlar ve Kullanıcılar', e)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Kapsam Dışında Kalan Konular / Maddeler */}
              <div className="section-item level-1">
                <div className="section-header">
                  <div className="section-info">
                    <div className="section-number">
                      <span className="number-circle">6</span>
                      <span className="completion-dot warning"></span>
                    </div>
                    <div className="section-content">
                      <h4 className="section-title">Kapsam Dışında Kalan Konular / Maddeler</h4>
                      <p className="section-description">Metin alanı</p>
                    </div>
                  </div>
                  <div className="section-actions">
                    <span className="level-badge level-1-badge">Level 1</span>
                    <button className="edit-button" onClick={() => handleOpenSectionChat('kapsam-disinda', 'Kapsam Dışında Kalan Konular / Maddeler')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. Kabul Kriterleri */}
              <div className="section-item level-1">
                <div className="section-header">
                  <div className="section-info">
                    <div className="section-number">
                      <span className="number-circle">7</span>
                      <span className="completion-dot warning"></span>
                    </div>
                    <div className="section-content">
                      <h4 className="section-title">Kabul Kriterleri</h4>
                      <p className="section-description">Tablolar</p>
                    </div>
                  </div>
                  <div className="section-actions">
                    <span className="level-badge level-1-badge">Level 1</span>
                    <button className="edit-button" onClick={(e) => handleKabulKriterleriEdit('7', 'Kabul Kriterleri', e)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>

              {/* 8. Onaylar */}
              <div className="section-item level-1">
                <div className="section-header">
                  <div className="section-info">
                    <div className="section-number">
                      <span className="number-circle">8</span>
                      <span className="completion-dot warning"></span>
                    </div>
                    <div className="section-content">
                      <h4 className="section-title">Onaylar</h4>
                      <p className="section-description">Tablolar</p>
                    </div>
                  </div>
                  <div className="section-actions">
                    <span className="level-badge level-1-badge">Level 1</span>
                    <button className="edit-button" onClick={(e) => handleOnaylarEdit('8', 'Onaylar', e)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>

              {/* 9. Ekler */}
              <div className="section-item level-1">
                <div className="section-header">
                  <div className="section-info">
                    <div className="section-number">
                      <span className="number-circle">9</span>
                      <span className="completion-dot warning"></span>
                    </div>
                    <div className="section-content">
                      <h4 className="section-title">Ekler</h4>
                      <p className="section-description">Metin alanı</p>
                    </div>
                  </div>
                  <div className="section-actions">
                    <span className="level-badge level-1-badge">Level 1</span>
                    <button className="edit-button" onClick={() => handleOpenSectionChat('ekler', 'Ekler')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 713 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beyaz Alan - Buton Bölümü */}
      <div className="action-section">
        <div className="action-content">
          <div className="status-info">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">0 / 37 Tamamlandı</span>
            </div>
            <div className="last-update">
              <svg className="clock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>Son güncelleme: 21:41:51</span>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="action-btn secondary">
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Tümünü Temizle
            </button>
            
            <button className="action-btn primary">
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              Dokümanı Tamamla
            </button>
            
            <button className="action-btn download" onClick={handleWordExport} disabled={isExporting}>
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              {isExporting ? 'İndiriliyor...' : 'Word Olarak İndir'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Component */}
      <Footer className="full-width" />

      {/* Edit Section Modal */}
      <EditSectionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sectionTitle={selectedSection?.title || ''}
        sectionId={selectedSection?.id || ''}
        buttonPosition={buttonPosition}
        selectedFile={selectedDocxFile}
      />

      {/* Document History Modal */}
      <DocumentHistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        sectionTitle={selectedHistorySection?.title || ''}
        sectionId={selectedHistorySection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      {/* Section Chat Modal */}
      <SectionChatModal 
        isOpen={isSectionChatOpen}
        onClose={handleCloseSectionChat}
        sectionTitle={selectedChatSection?.title || ''}
        sectionId={selectedChatSection?.id || ''}
        selectedFile={selectedDocxFile}
        getAllModalContents={getAllModalContents}
      />

      {/* Talep Değerlendirmesi Modal */}
      <TalepDegerlendirmesiModal 
        isOpen={isTalepModalOpen}
        onClose={handleCloseTalepModal}
        sectionTitle={selectedTalepSection?.title || ''}
        sectionId={selectedTalepSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      {/* Ekran Tasarımları Modal */}
      <EkranTasarimlariModal 
        isOpen={isEkranTasarimlariModalOpen}
        onClose={handleCloseEkranTasarimlariModal}
        sectionTitle={selectedEkranTasarimlariSection?.title || ''}
        sectionId={selectedEkranTasarimlariSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      {/* Tasklar/Batchlar Modal */}
      <TasklarBatchlarModal 
        isOpen={isTasklarBatchlarModalOpen}
        onClose={handleCloseTasklarBatchlarModal}
        sectionTitle={selectedTasklarBatchlarSection?.title || ''}
        sectionId={selectedTasklarBatchlarSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      {/* Entegrasyonlar Modal */}
      <EntegrasyonlarModal 
        isOpen={isEntegrasyonlarModalOpen}
        onClose={handleCloseEntegrasyonlarModal}
        sectionTitle={selectedEntegrasyonlarSection?.title || ''}
        sectionId={selectedEntegrasyonlarSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      {/* Mesajlar Modal */}
      <MesajlarModal 
        isOpen={isMesajlarModalOpen}
        onClose={handleCloseMesajlarModal}
        sectionTitle={selectedMesajlarSection?.title || ''}
        sectionId={selectedMesajlarSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      {/* Parametreler Modal */}
      <ParametrelerModal 
        isOpen={isParametrelerModalOpen}
        onClose={handleCloseParametrelerModal}
        sectionTitle={selectedParametrelerSection?.title || ''}
        sectionId={selectedParametrelerSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <ConversionMigrationModal 
        isOpen={isConversionMigrationModalOpen}
        onClose={() => setIsConversionMigrationModalOpen(false)}
        sectionTitle={selectedConversionMigrationSection?.title || ''}
        sectionId={selectedConversionMigrationSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <DiagramAkislarModal 
        isOpen={isDiagramAkislarModalOpen}
        onClose={() => setIsDiagramAkislarModalOpen(false)}
        sectionTitle={selectedDiagramAkislarSection?.title || ''}
        sectionId={selectedDiagramAkislarSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <XIslemiMuhasebeModal 
        isOpen={isXIslemiMuhasebeModalOpen}
        onClose={() => setIsXIslemiMuhasebeModalOpen(false)}
        sectionTitle={selectedXIslemiMuhasebeSection?.title || ''}
        sectionId={selectedXIslemiMuhasebeSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <MuhasebeModal 
        isOpen={isMuhasebeModalOpen}
        onClose={() => setIsMuhasebeModalOpen(false)}
        sectionTitle={selectedMuhasebeSection?.title || ''}
        sectionId={selectedMuhasebeSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <XIslemiMuhasebeDeseniModal 
        isOpen={isXIslemiMuhasebeDeseniModalOpen}
        onClose={() => setIsXIslemiMuhasebeDeseniModalOpen(false)}
        sectionTitle={selectedXIslemiMuhasebeDeseniSection?.title || ''}
        sectionId={selectedXIslemiMuhasebeDeseniSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <Case1Modal 
        isOpen={isCase1ModalOpen}
        onClose={() => setIsCase1ModalOpen(false)}
        sectionTitle={selectedCase1Section?.title || ''}
        sectionId={selectedCase1Section?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <XIslemiKayitKurallariModal 
        isOpen={isXIslemiKayitKurallariModalOpen}
        onClose={() => setIsXIslemiKayitKurallariModalOpen(false)}
        sectionTitle={selectedXIslemiKayitKurallariSection?.title || ''}
        sectionId={selectedXIslemiKayitKurallariSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <XIslemiVergiKomisyonModal 
        isOpen={isXIslemiVergiKomisyonModalOpen}
        onClose={() => setIsXIslemiVergiKomisyonModalOpen(false)}
        sectionTitle={selectedXIslemiVergiKomisyonSection?.title || ''}
        sectionId={selectedXIslemiVergiKomisyonSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <XIslemiMuhasebeSenaryolariModal 
        isOpen={isXIslemiMuhasebeSenaryolariModalOpen}
        onClose={() => setIsXIslemiMuhasebeSenaryolariModalOpen(false)}
        sectionTitle={selectedXIslemiMuhasebeSenaryolariSection?.title || ''}
        sectionId={selectedXIslemiMuhasebeSenaryolariSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <XIslemiOrnekKayitlarModal 
        isOpen={isXIslemiOrnekKayitlarModalOpen}
        onClose={() => setIsXIslemiOrnekKayitlarModalOpen(false)}
        sectionTitle={selectedXIslemiOrnekKayitlarSection?.title || ''}
        sectionId={selectedXIslemiOrnekKayitlarSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <FonksiyonelOlmayanGereksinimlerModal 
        isOpen={isFonksiyonelOlmayanGereksinimlerModalOpen}
        onClose={() => setIsFonksiyonelOlmayanGereksinimlerModalOpen(false)}
        sectionTitle={selectedFonksiyonelOlmayanGereksinimlerSection?.title || ''}
        sectionId={selectedFonksiyonelOlmayanGereksinimlerSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <KimlikDogrulamaLogModal 
        isOpen={isKimlikDogrulamaLogModalOpen}
        onClose={() => setIsKimlikDogrulamaLogModalOpen(false)}
        sectionTitle={selectedKimlikDogrulamaLogSection?.title || ''}
        sectionId={selectedKimlikDogrulamaLogSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <YetkilendirmeOnayModal 
        isOpen={isYetkilendirmeOnayModalOpen}
        onClose={() => setIsYetkilendirmeOnayModalOpen(false)}
        sectionTitle={selectedYetkilendirmeOnaySection?.title || ''}
        sectionId={selectedYetkilendirmeOnaySection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <VeriKritikligiModal 
        isOpen={isVeriKritikligiModalOpen}
        onClose={() => setIsVeriKritikligiModalOpen(false)}
        sectionTitle={selectedVeriKritikligiSection?.title || ''}
        sectionId={selectedVeriKritikligiSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <PaydaslarKullanicilarModal 
        isOpen={isPaydaslarKullanicilarModalOpen}
        onClose={() => setIsPaydaslarKullanicilarModalOpen(false)}
        sectionTitle={selectedPaydaslarKullanicilarSection?.title || ''}
        sectionId={selectedPaydaslarKullanicilarSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <KapsamDisindaModal 
        isOpen={isKapsamDisindaModalOpen}
        onClose={() => setIsKapsamDisindaModalOpen(false)}
        sectionTitle={selectedKapsamDisindaSection?.title || ''}
        sectionId={selectedKapsamDisindaSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <KabulKriterleriModal 
        isOpen={isKabulKriterleriModalOpen}
        onClose={() => setIsKabulKriterleriModalOpen(false)}
        sectionTitle={selectedKabulKriterleriSection?.title || ''}
        sectionId={selectedKabulKriterleriSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <OnaylarModal 
        isOpen={isOnaylarModalOpen}
        onClose={() => setIsOnaylarModalOpen(false)}
        sectionTitle={selectedOnaylarSection?.title || ''}
        sectionId={selectedOnaylarSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

      <EklerModal 
        isOpen={isEklerModalOpen}
        onClose={() => setIsEklerModalOpen(false)}
        sectionTitle={selectedEklerSection?.title || ''}
        sectionId={selectedEklerSection?.id || ''}
        selectedFile={selectedDocxFile}
      />

    </div>
  );
});

LLMAnalysis.displayName = 'LLMAnalysis';

export default LLMAnalysis;
