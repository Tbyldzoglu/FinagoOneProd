import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LLMChat from './LLMChat';
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
import { updateAnalizFaz1 } from '../services/analizService';
import { markModalAsSaved } from '../services/modalChangeTracker';
import '../styles/SectionChatModal.css';

interface SectionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  selectedFile?: File | null;
  getAllModalContents?: () => any; // Tüm modal içeriklerini getiren fonksiyon
}

const SectionChatModal: React.FC<SectionChatModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionId,
  selectedFile,
  getAllModalContents
}) => {
  // DOCX parsing hook'ları
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
  
  // Aktif section içeriği için state
  const [sectionContent, setSectionContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Current section'ın content'i - İlgili hook'tan al
  const getCurrentSectionContent = () => {
    console.log('🔍 DEBUG - SectionChatModal getCurrentSectionContent:');
    console.log('  - sectionId:', sectionId);
    console.log('  - localStorage keys:', Object.keys(localStorage).filter(key => key.includes('content')));
    
    if (sectionId === 'amac-kapsam') {
      // Eğer hook'ta veri yoksa localStorage'dan kontrol et
      if (!amacKapsamHook.content || amacKapsamHook.content.trim() === '') {
        const transferData = localStorage.getItem('amac_kapsam_content');
        if (transferData) {
          return transferData;
        }
      }
      return amacKapsamHook.content;
    }
    if (sectionId === 'mevcut-isleyis') {
      // Eğer hook'ta veri yoksa localStorage'dan kontrol et
      if (!mevcutIsleyisHook.content || mevcutIsleyisHook.content.trim() === '') {
        const transferData = localStorage.getItem('mevcut_isleyis_content');
        if (transferData) {
          return transferData;
        }
      }
      return mevcutIsleyisHook.content;
    }
    if (sectionId === 'planlanan-isleyis') {
      // Eğer hook'ta veri yoksa localStorage'dan kontrol et
      if (!planlananIsleyisHook.content || planlananIsleyisHook.content.trim() === '') {
        const transferData = localStorage.getItem('planlanan_isleyis_content');
        if (transferData) {
          return transferData;
        }
      }
      return planlananIsleyisHook.content;
    }
    if (sectionId === 'fonksiyonel-gereksinimler') {
      // Eğer hook'ta veri yoksa localStorage'dan kontrol et
      if (!fonksiyonelGereksinimlerHook.content || fonksiyonelGereksinimlerHook.content.trim() === '') {
        const transferData = localStorage.getItem('fonksiyonel_gereksinimler_content');
        if (transferData) {
          return transferData;
        }
      }
      return fonksiyonelGereksinimlerHook.content;
    }
    if (sectionId === 'ekran-gereksinimleri') {
      // Eğer hook'ta veri yoksa localStorage'dan kontrol et
      if (!ekranGereksinimlerHook.content || ekranGereksinimlerHook.content.trim() === '') {
        const transferData = localStorage.getItem('ekran_gereksinimleri_content');
        if (transferData) {
          return transferData;
        }
      }
      return ekranGereksinimlerHook.content;
    }
    if (sectionId === 'x-ekrani') {
      // Eğer hook'ta veri yoksa localStorage'dan kontrol et
      if (!xEkraniHook.content || xEkraniHook.content.trim() === '') {
        const transferData = localStorage.getItem('x_ekrani_content');
        if (transferData) {
          return transferData;
        }
      }
      return xEkraniHook.content;
    }
    if (sectionId === 'task-is-akisi') {
      // Eğer hook'ta veri yoksa localStorage'dan kontrol et
      if (!taskIsAkisiHook.content || taskIsAkisiHook.content.trim() === '') {
        const transferData = localStorage.getItem('task_is_akisi_content');
        if (transferData) {
          return transferData;
        }
      }
      return taskIsAkisiHook.content;
    }
    if (sectionId === 'conversation-migration') {
      if (!conversionMigrationHook.content || conversionMigrationHook.content.trim() === '') {
        const transferData = localStorage.getItem('conversation_migration_content');
        if (transferData) {
          return transferData;
        }
      }
      return conversionMigrationHook.content;
    }
    if (sectionId === 'diagram-akislar') {
      if (!diagramAkislarHook.content || diagramAkislarHook.content.trim() === '') {
        const transferData = localStorage.getItem('diagram_akislar_content');
        if (transferData) {
          return transferData;
        }
      }
      return diagramAkislarHook.content;
    }
    if (sectionId === 'muhasebe') {
      if (!muhasebeHook.content || muhasebeHook.content.trim() === '') {
        const transferData = localStorage.getItem('muhasebe_content');
        if (transferData) {
          return transferData;
        }
      }
      return muhasebeHook.content;
    }
    if (sectionId === 'x-islemi-muhasebe-deseni') {
      if (!xIslemiMuhasebeDeseniHook.content || xIslemiMuhasebeDeseniHook.content.trim() === '') {
        const transferData = localStorage.getItem('x_islemi_muhasebe_deseni_content');
        if (transferData) {
          return transferData;
        }
      }
      return xIslemiMuhasebeDeseniHook.content;
    }
    if (sectionId === 'x-islemi-kayit-kurallari') {
      if (!xIslemiKayitKurallariHook.content || xIslemiKayitKurallariHook.content.trim() === '') {
        const transferData = localStorage.getItem('x_islemi_kayit_kurallari_content');
        if (transferData) {
          return transferData;
        }
      }
      return xIslemiKayitKurallariHook.content;
    }
    if (sectionId === 'x-islemi-vergi-komisyon') {
      if (!xIslemiVergiKomisyonHook.content || xIslemiVergiKomisyonHook.content.trim() === '') {
        const transferData = localStorage.getItem('x_islemi_vergi_komisyon_content');
        if (transferData) {
          return transferData;
        }
      }
      return xIslemiVergiKomisyonHook.content;
    }
    if (sectionId === 'x-islemi-muhasebe-senaryolari') {
      if (!xIslemiMuhasebeSenaryolariHook.content || xIslemiMuhasebeSenaryolariHook.content.trim() === '') {
        const transferData = localStorage.getItem('x_islemi_muhasebe_senaryolari_content');
        if (transferData) {
          return transferData;
        }
      }
      return xIslemiMuhasebeSenaryolariHook.content;
    }
    if (sectionId === 'x-islemi-ornek-kayitlar') {
      if (!xIslemiOrnekKayitlarHook.content || xIslemiOrnekKayitlarHook.content.trim() === '') {
        const transferData = localStorage.getItem('x_islemi_ornek_kayitlar_content');
        if (transferData) {
          return transferData;
        }
      }
      return xIslemiOrnekKayitlarHook.content;
    }
    if (sectionId === 'fonksiyonel-olmayan-gereksinimler') {
      if (!fonksiyonelOlmayanGereksinimlerHook.content || fonksiyonelOlmayanGereksinimlerHook.content.trim() === '') {
        const transferData = localStorage.getItem('fonksiyonel_olmayan_gereksinimler_content');
        if (transferData) {
          return transferData;
        }
      }
      return fonksiyonelOlmayanGereksinimlerHook.content;
    }
    if (sectionId === 'kimlik-dogrulama-log') {
      if (!kimlikDogrulamaLogHook.content || kimlikDogrulamaLogHook.content.trim() === '') {
        const transferData = localStorage.getItem('kimlik_dogrulama_log_content');
        if (transferData) {
          return transferData;
        }
      }
      return kimlikDogrulamaLogHook.content;
    }
    if (sectionId === 'kapsam-disinda') {
      if (!kapsamDisindaHook.content || kapsamDisindaHook.content.trim() === '') {
        const transferData = localStorage.getItem('kapsam_disinda_content');
        if (transferData) {
          return transferData;
        }
      }
      return kapsamDisindaHook.content;
    }
    if (sectionId === 'ekler') {
      if (!eklerHook.content || eklerHook.content.trim() === '') {
        const transferData = localStorage.getItem('ekler_content');
        if (transferData) {
          return transferData;
        }
      }
      return eklerHook.content;
    }
    return '';
  };
  
  // Kaydet fonksiyonu - seçilen section'a göre database'i güncelle
  const handleSave = async () => {
    if (!selectedFile) {
      console.error('❌ Doküman seçilmemiş');
      return;
    }

    setIsSaving(true);
    
    try {
      // Güncel içeriği al
      const currentContent = getCurrentSectionContent();
      
      // Section ID'ye göre JSON formatında kaydet
      let updateData: any = {};
      
      if (sectionId === 'amac-kapsam') {
        const amacKapsamData = {
          title: 'Amaç ve Kapsam',
          content: currentContent,
          validation: {
            found: amacKapsamHook.validation?.found || false,
            mode: amacKapsamHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: amacKapsamHook.validation?.errors || [],
            warnings: amacKapsamHook.validation?.warnings || [],
            matchedLabels: amacKapsamHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.amac_kapsam = JSON.stringify(amacKapsamData, null, 2);
      }
      
      if (sectionId === 'mevcut-isleyis') {
        const mevcutIsleyisData = {
          title: 'Mevcut İşleyiş',
          content: currentContent,
          validation: {
            found: mevcutIsleyisHook.validation?.found || false,
            mode: mevcutIsleyisHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: mevcutIsleyisHook.validation?.errors || [],
            warnings: mevcutIsleyisHook.validation?.warnings || [],
            matchedLabels: mevcutIsleyisHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.mevcut_isleyis = JSON.stringify(mevcutIsleyisData, null, 2);
      }
      
      if (sectionId === 'planlanan-isleyis') {
        const planlananIsleyisData = {
          title: 'Planlanan İşleyiş',
          content: currentContent,
          validation: {
            found: planlananIsleyisHook.validation?.found || false,
            mode: planlananIsleyisHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: planlananIsleyisHook.validation?.errors || [],
            warnings: planlananIsleyisHook.validation?.warnings || [],
            matchedLabels: planlananIsleyisHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.planlanan_isleyis = JSON.stringify(planlananIsleyisData, null, 2);
      }
      
      if (sectionId === 'fonksiyonel-gereksinimler') {
        const fonksiyonelGereksinimlerData = {
          title: 'Fonksiyonel Gereksinimler',
          content: currentContent,
          validation: {
            found: fonksiyonelGereksinimlerHook.validation?.found || false,
            mode: fonksiyonelGereksinimlerHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: fonksiyonelGereksinimlerHook.validation?.errors || [],
            warnings: fonksiyonelGereksinimlerHook.validation?.warnings || [],
            matchedLabels: fonksiyonelGereksinimlerHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.fonksiyonel_gereksinimler = JSON.stringify(fonksiyonelGereksinimlerData, null, 2);
      }
      
      if (sectionId === 'ekran-gereksinimleri') {
        const ekranGereksinimleriData = {
          title: 'Ekran Gereksinimleri',
          content: currentContent,
          validation: {
            found: ekranGereksinimlerHook.validation?.found || false,
            mode: ekranGereksinimlerHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: ekranGereksinimlerHook.validation?.errors || [],
            warnings: ekranGereksinimlerHook.validation?.warnings || [],
            matchedLabels: ekranGereksinimlerHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.ekran_gereksinimleri = JSON.stringify(ekranGereksinimleriData, null, 2);
      }
      
      if (sectionId === 'x-ekrani') {
        const xEkraniData = {
          title: 'X Ekranı',
          content: currentContent,
          validation: {
            found: xEkraniHook.validation?.found || false,
            mode: xEkraniHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: xEkraniHook.validation?.errors || [],
            warnings: xEkraniHook.validation?.warnings || [],
            matchedLabels: xEkraniHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.x_ekrani = JSON.stringify(xEkraniData, null, 2);
      }
      
      if (sectionId === 'task-is-akisi') {
        const taskIsAkisiData = {
          title: 'Task İş Akışı',
          content: currentContent,
          validation: {
            found: taskIsAkisiHook.validation?.found || false,
            mode: taskIsAkisiHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: taskIsAkisiHook.validation?.errors || [],
            warnings: taskIsAkisiHook.validation?.warnings || [],
            matchedLabels: taskIsAkisiHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.task_is_akisi = JSON.stringify(taskIsAkisiData, null, 2);
      }
      
      // Conversation Migration
      if (sectionId === 'conversation-migration') {
        const conversationMigrationData = {
          title: 'Conversation Migration',
          content: currentContent,
          validation: {
            found: conversionMigrationHook.validation?.found || false,
            mode: conversionMigrationHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: conversionMigrationHook.validation?.errors || [],
            warnings: conversionMigrationHook.validation?.warnings || [],
            matchedLabels: conversionMigrationHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.conversation_migration = JSON.stringify(conversationMigrationData, null, 2);
      }
      
      // Diagram Akışlar
      if (sectionId === 'diagram-akislar') {
        const diagramAkislarData = {
          title: 'Diagram Akışlar',
          content: currentContent,
          validation: {
            found: diagramAkislarHook.validation?.found || false,
            mode: diagramAkislarHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: diagramAkislarHook.validation?.errors || [],
            warnings: diagramAkislarHook.validation?.warnings || [],
            matchedLabels: diagramAkislarHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.diagram_akislar = JSON.stringify(diagramAkislarData, null, 2);
      }
      
      // Muhasebe
      if (sectionId === 'muhasebe') {
        const muhasebeData = {
          title: 'Muhasebe',
          content: currentContent,
          validation: {
            found: muhasebeHook.validation?.found || false,
            mode: muhasebeHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: muhasebeHook.validation?.errors || [],
            warnings: muhasebeHook.validation?.warnings || [],
            matchedLabels: muhasebeHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.muhasebe = JSON.stringify(muhasebeData, null, 2);
      }
      
      // X İşlemi Muhasebe Deseni
      if (sectionId === 'x-islemi-muhasebe-deseni') {
        const xIslemiMuhasebeDeseniData = {
          title: 'X İşlemi Muhasebe Deseni',
          content: currentContent,
          validation: {
            found: xIslemiMuhasebeDeseniHook.validation?.found || false,
            mode: xIslemiMuhasebeDeseniHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: xIslemiMuhasebeDeseniHook.validation?.errors || [],
            warnings: xIslemiMuhasebeDeseniHook.validation?.warnings || [],
            matchedLabels: xIslemiMuhasebeDeseniHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.x_islemi_muhasebe_deseni = JSON.stringify(xIslemiMuhasebeDeseniData, null, 2);
      }
      
      // X İşlemi Kayıt Kuralları
      if (sectionId === 'x-islemi-kayit-kurallari') {
        const xIslemiKayitKurallariData = {
          title: 'X İşlemi Kayıt Kuralları',
          content: currentContent,
          validation: {
            found: xIslemiKayitKurallariHook.validation?.found || false,
            mode: xIslemiKayitKurallariHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: xIslemiKayitKurallariHook.validation?.errors || [],
            warnings: xIslemiKayitKurallariHook.validation?.warnings || [],
            matchedLabels: xIslemiKayitKurallariHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.x_islemi_kayit_kurallari = JSON.stringify(xIslemiKayitKurallariData, null, 2);
      }
      
      // X İşlemi Vergi Komisyon
      if (sectionId === 'x-islemi-vergi-komisyon') {
        const xIslemiVergiKomisyonData = {
          title: 'X İşlemi Vergi Komisyon',
          content: currentContent,
          validation: {
            found: xIslemiVergiKomisyonHook.validation?.found || false,
            mode: xIslemiVergiKomisyonHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: xIslemiVergiKomisyonHook.validation?.errors || [],
            warnings: xIslemiVergiKomisyonHook.validation?.warnings || [],
            matchedLabels: xIslemiVergiKomisyonHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.x_islemi_vergi_komisyon = JSON.stringify(xIslemiVergiKomisyonData, null, 2);
      }
      
      // X İşlemi Muhasebe Senaryoları
      if (sectionId === 'x-islemi-muhasebe-senaryolari') {
        const xIslemiMuhasebeSenaryolariData = {
          title: 'X İşlemi Muhasebe Senaryoları',
          content: currentContent,
          validation: {
            found: xIslemiMuhasebeSenaryolariHook.validation?.found || false,
            mode: xIslemiMuhasebeSenaryolariHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: xIslemiMuhasebeSenaryolariHook.validation?.errors || [],
            warnings: xIslemiMuhasebeSenaryolariHook.validation?.warnings || [],
            matchedLabels: xIslemiMuhasebeSenaryolariHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.x_islemi_muhasebe_senaryolari = JSON.stringify(xIslemiMuhasebeSenaryolariData, null, 2);
      }
      
      // X İşlemi Örnek Kayıtlar
      if (sectionId === 'x-islemi-ornek-kayitlar') {
        const xIslemiOrnekKayitlarData = {
          title: 'X İşlemi Örnek Kayıtlar',
          content: currentContent,
          validation: {
            found: xIslemiOrnekKayitlarHook.validation?.found || false,
            mode: xIslemiOrnekKayitlarHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: xIslemiOrnekKayitlarHook.validation?.errors || [],
            warnings: xIslemiOrnekKayitlarHook.validation?.warnings || [],
            matchedLabels: xIslemiOrnekKayitlarHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.x_islemi_ornek_kayitlar = JSON.stringify(xIslemiOrnekKayitlarData, null, 2);
      }
      
      // Fonksiyonel Olmayan Gereksinimler
      if (sectionId === 'fonksiyonel-olmayan-gereksinimler') {
        const fonksiyonelOlmayanGereksinimlerData = {
          title: 'Fonksiyonel Olmayan Gereksinimler',
          content: currentContent,
          validation: {
            found: fonksiyonelOlmayanGereksinimlerHook.validation?.found || false,
            mode: fonksiyonelOlmayanGereksinimlerHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: fonksiyonelOlmayanGereksinimlerHook.validation?.errors || [],
            warnings: fonksiyonelOlmayanGereksinimlerHook.validation?.warnings || [],
            matchedLabels: fonksiyonelOlmayanGereksinimlerHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.fonksiyonel_olmayan_gereksinimler = JSON.stringify(fonksiyonelOlmayanGereksinimlerData, null, 2);
      }
      
      // Kimlik Doğrulama Log
      if (sectionId === 'kimlik-dogrulama-log') {
        const kimlikDogrulamaLogData = {
          title: 'Kimlik Doğrulama Log',
          content: currentContent,
          validation: {
            found: kimlikDogrulamaLogHook.validation?.found || false,
            mode: kimlikDogrulamaLogHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: kimlikDogrulamaLogHook.validation?.errors || [],
            warnings: kimlikDogrulamaLogHook.validation?.warnings || [],
            matchedLabels: kimlikDogrulamaLogHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.kimlik_dogrulama_log = JSON.stringify(kimlikDogrulamaLogData, null, 2);
      }
      
      // Kapsam Dışında
      if (sectionId === 'kapsam-disinda') {
        const kapsamDisindaData = {
          title: 'Kapsam Dışında',
          content: currentContent,
          validation: {
            found: kapsamDisindaHook.validation?.found || false,
            mode: kapsamDisindaHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: kapsamDisindaHook.validation?.errors || [],
            warnings: kapsamDisindaHook.validation?.warnings || [],
            matchedLabels: kapsamDisindaHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.kapsam_disinda = JSON.stringify(kapsamDisindaData, null, 2);
      }
      
      // Ekler
      if (sectionId === 'ekler') {
        const eklerData = {
          title: 'Ekler',
          content: currentContent,
          validation: {
            found: eklerHook.validation?.found || false,
            mode: eklerHook.validation?.mode || 'strict',
            contentLength: currentContent?.length || 0,
            errors: eklerHook.validation?.errors || [],
            warnings: eklerHook.validation?.warnings || [],
            matchedLabels: eklerHook.validation?.matchedLabels || []
          },
          isProcessed: true,
          isLoading: false,
          timestamp: new Date().toISOString()
        };
        updateData.ekler = JSON.stringify(eklerData, null, 2);
      }
      
      console.log('💾 Kaydediliyor:', { sectionId, content: currentContent?.substring(0, 100) });
      
      const result = await updateAnalizFaz1(selectedFile.name, updateData);
      
      if (result.success) {
        console.log('✅ Başarıyla kaydedildi:', result);
        markModalAsSaved(sectionId); // Modal kaydedildi olarak işaretle
        // TODO: Success message göster
      } else {
        console.error('❌ Kaydetme hatası:', result.error);
        // TODO: Error message göster
      }
      
    } catch (error) {
      console.error('❌ Kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Current section content'ini güncelle (hook'lara ve localStorage'a kaydet)
  const handleContentChange = (content: string) => {
    // State'i güncelle
    setSectionContent(content);
    
    // localStorage'a da kaydet (global kaydet için)
    const storageKey = `${sectionId.replace('-', '_')}_content`;
    localStorage.setItem(storageKey, content);
    
    // İlgili hook'u da güncelle
    if (sectionId === 'amac-kapsam') {
      amacKapsamHook.updateContent(content);
    } else if (sectionId === 'mevcut-isleyis') {
      mevcutIsleyisHook.updateContent(content);
    } else if (sectionId === 'planlanan-isleyis') {
      planlananIsleyisHook.updateContent(content);
    } else if (sectionId === 'fonksiyonel-gereksinimler') {
      fonksiyonelGereksinimlerHook.updateContent(content);
    } else if (sectionId === 'ekran-gereksinimleri') {
      ekranGereksinimlerHook.updateContent(content);
    } else if (sectionId === 'x-ekrani') {
      xEkraniHook.updateContent(content);
    } else if (sectionId === 'task-is-akisi') {
      taskIsAkisiHook.updateContent(content);
    } else if (sectionId === 'conversation-migration') {
      conversionMigrationHook.updateContent(content);
    } else if (sectionId === 'diagram-akislar') {
      diagramAkislarHook.updateContent(content);
    } else if (sectionId === 'muhasebe') {
      muhasebeHook.updateContent(content);
    } else if (sectionId === 'x-islemi-muhasebe-deseni') {
      xIslemiMuhasebeDeseniHook.updateContent(content);
    } else if (sectionId === 'x-islemi-kayit-kurallari') {
      xIslemiKayitKurallariHook.updateContent(content);
    } else if (sectionId === 'x-islemi-vergi-komisyon') {
      xIslemiVergiKomisyonHook.updateContent(content);
    } else if (sectionId === 'x-islemi-muhasebe-senaryolari') {
      xIslemiMuhasebeSenaryolariHook.updateContent(content);
    } else if (sectionId === 'x-islemi-ornek-kayitlar') {
      xIslemiOrnekKayitlarHook.updateContent(content);
    } else if (sectionId === 'fonksiyonel-olmayan-gereksinimler') {
      fonksiyonelOlmayanGereksinimlerHook.updateContent(content);
    } else if (sectionId === 'kimlik-dogrulama-log') {
      kimlikDogrulamaLogHook.updateContent(content);
    } else if (sectionId === 'kapsam-disinda') {
      kapsamDisindaHook.updateContent(content);
    } else if (sectionId === 'ekler') {
      eklerHook.updateContent(content);
    }
  };

  // Modal açıldığında ve hook içerikleri değiştiğinde state'i güncelle
  useLayoutEffect(() => {
    if (isOpen && sectionId) {
      console.log('🔄 Modal içerik güncelleniyor:', sectionId);
      const currentContent = getCurrentSectionContent();
      console.log('📝 Güncel içerik uzunluğu:', currentContent?.length || 0);
      setSectionContent(currentContent || '');
    }
  }, [
    isOpen, 
    sectionId,
    // Hook içeriklerini dinle - DOCX parse sonrası güncellensin
    amacKapsamHook.content,
    mevcutIsleyisHook.content,
    planlananIsleyisHook.content,
    fonksiyonelGereksinimlerHook.content,
    ekranGereksinimlerHook.content,
    xEkraniHook.content,
    taskIsAkisiHook.content,
    conversionMigrationHook.content,
    diagramAkislarHook.content,
    muhasebeHook.content,
    xIslemiMuhasebeDeseniHook.content,
    xIslemiKayitKurallariHook.content,
    xIslemiVergiKomisyonHook.content,
    xIslemiMuhasebeSenaryolariHook.content,
    xIslemiOrnekKayitlarHook.content,
    fonksiyonelOlmayanGereksinimlerHook.content,
    kimlikDogrulamaLogHook.content,
    kapsamDisindaHook.content,
    eklerHook.content
  ]);

  // Dosya değiştiğinde hook'ları reset et
  useEffect(() => {
    if (selectedFile) {
      console.log('🔄 Yeni dosya seçildi, hooklar reset ediliyor:', selectedFile.name);
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
    }
  }, [selectedFile?.name, amacKapsamHook.resetContent, mevcutIsleyisHook.resetContent, planlananIsleyisHook.resetContent, fonksiyonelGereksinimlerHook.resetContent, ekranGereksinimlerHook.resetContent, xEkraniHook.resetContent, taskIsAkisiHook.resetContent, conversionMigrationHook.resetContent, diagramAkislarHook.resetContent, muhasebeHook.resetContent, xIslemiMuhasebeDeseniHook.resetContent, xIslemiKayitKurallariHook.resetContent, xIslemiVergiKomisyonHook.resetContent, xIslemiMuhasebeSenaryolariHook.resetContent, xIslemiOrnekKayitlarHook.resetContent, fonksiyonelOlmayanGereksinimlerHook.resetContent, kimlikDogrulamaLogHook.resetContent, kapsamDisindaHook.resetContent, eklerHook.resetContent]);

  // DOCX dosyası seçildiğinde işle (Text area modalları için)
  useEffect(() => {
    console.log('📄 SectionChatModal useEffect:', { 
      isOpen, 
      sectionId, 
      selectedFile: selectedFile?.name, 
      amacKapsamProcessed: amacKapsamHook.isProcessed,
      mevcutIsleyisProcessed: mevcutIsleyisHook.isProcessed,
      planlananIsleyisProcessed: planlananIsleyisHook.isProcessed,
      fonksiyonelGereksinimlerProcessed: fonksiyonelGereksinimlerHook.isProcessed,
      ekranGereksinimlerProcessed: ekranGereksinimlerHook.isProcessed,
      xEkraniProcessed: xEkraniHook.isProcessed,
      taskIsAkisiProcessed: taskIsAkisiHook.isProcessed
    });
    
    // Amaç ve Kapsam processing
    if (isOpen && 
        sectionId === 'amac-kapsam' && 
        selectedFile && 
        !amacKapsamHook.isProcessed && 
        !amacKapsamHook.isLoading) {
      console.log('📄 Amaç ve Kapsam: DOCX dosyası işleniyor:', selectedFile.name);
      amacKapsamHook.processFile(selectedFile);
    }
    
    // Mevcut İşleyiş processing
    if (isOpen && 
        sectionId === 'mevcut-isleyis' && 
        selectedFile && 
        !mevcutIsleyisHook.isProcessed && 
        !mevcutIsleyisHook.isLoading) {
      console.log('📄 Mevcut İşleyiş: DOCX dosyası işleniyor:', selectedFile.name);
      mevcutIsleyisHook.processFile(selectedFile);
    }
    
    // Planlanan İşleyiş processing
    if (isOpen && 
        sectionId === 'planlanan-isleyis' && 
        selectedFile && 
        !planlananIsleyisHook.isProcessed && 
        !planlananIsleyisHook.isLoading) {
      console.log('📄 Planlanan İşleyiş: DOCX dosyası işleniyor:', selectedFile.name);
      planlananIsleyisHook.processFile(selectedFile);
    }
    
    // Fonksiyonel Gereksinimler processing
    if (isOpen && 
        sectionId === 'fonksiyonel-gereksinimler' && 
        selectedFile && 
        !fonksiyonelGereksinimlerHook.isProcessed && 
        !fonksiyonelGereksinimlerHook.isLoading) {
      console.log('📄 Fonksiyonel Gereksinimler: DOCX dosyası işleniyor:', selectedFile.name);
      fonksiyonelGereksinimlerHook.processFile(selectedFile);
    }
    
    // Ekran Gereksinimleri processing
    if (isOpen && 
        sectionId === 'ekran-gereksinimleri' && 
        selectedFile && 
        !ekranGereksinimlerHook.isProcessed && 
        !ekranGereksinimlerHook.isLoading) {
      console.log('📄 Ekran Gereksinimleri: DOCX dosyası işleniyor:', selectedFile.name);
      ekranGereksinimlerHook.processFile(selectedFile);
    }
    
    // X Ekranı processing
    if (isOpen && 
        sectionId === 'x-ekrani' && 
        selectedFile && 
        !xEkraniHook.isProcessed && 
        !xEkraniHook.isLoading) {
      console.log('📄 X Ekranı: DOCX dosyası işleniyor:', selectedFile.name);
      xEkraniHook.processFile(selectedFile);
    }
    
    // Task İş Akışı processing
    if (isOpen && 
        sectionId === 'task-is-akisi' && 
        selectedFile && 
        !taskIsAkisiHook.isProcessed && 
        !taskIsAkisiHook.isLoading) {
      console.log('📄 Task İş Akışı: DOCX dosyası işleniyor:', selectedFile.name);
      taskIsAkisiHook.processFile(selectedFile);
    }
    
    // Conversation Migration processing
    if (isOpen && 
        sectionId === 'conversation-migration' && 
        selectedFile && 
        !conversionMigrationHook.isProcessed && 
        !conversionMigrationHook.isLoading) {
      console.log('📄 Conversation Migration: DOCX dosyası işleniyor:', selectedFile.name);
      conversionMigrationHook.processFile(selectedFile);
    }
    
    // Diagram Akışlar processing
    if (isOpen && 
        sectionId === 'diagram-akislar' && 
        selectedFile && 
        !diagramAkislarHook.isProcessed && 
        !diagramAkislarHook.isLoading) {
      console.log('📄 Diagram Akışlar: DOCX dosyası işleniyor:', selectedFile.name);
      diagramAkislarHook.processFile(selectedFile);
    }
    
    // Muhasebe processing
    if (isOpen && 
        sectionId === 'muhasebe' && 
        selectedFile && 
        !muhasebeHook.isProcessed && 
        !muhasebeHook.isLoading) {
      console.log('📄 Muhasebe: DOCX dosyası işleniyor:', selectedFile.name);
      muhasebeHook.processFile(selectedFile);
    }
    
    // X İşlemi Muhasebe Deseni processing
    if (isOpen && 
        sectionId === 'x-islemi-muhasebe-deseni' && 
        selectedFile && 
        !xIslemiMuhasebeDeseniHook.isProcessed && 
        !xIslemiMuhasebeDeseniHook.isLoading) {
      console.log('📄 X İşlemi Muhasebe Deseni: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiMuhasebeDeseniHook.processFile(selectedFile);
    }
    
    // X İşlemi Kayıt Kuralları processing
    if (isOpen && 
        sectionId === 'x-islemi-kayit-kurallari' && 
        selectedFile && 
        !xIslemiKayitKurallariHook.isProcessed && 
        !xIslemiKayitKurallariHook.isLoading) {
      console.log('📄 X İşlemi Kayıt Kuralları: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiKayitKurallariHook.processFile(selectedFile);
    }
    
    // X İşlemi Vergi Komisyon processing
    if (isOpen && 
        sectionId === 'x-islemi-vergi-komisyon' && 
        selectedFile && 
        !xIslemiVergiKomisyonHook.isProcessed && 
        !xIslemiVergiKomisyonHook.isLoading) {
      console.log('📄 X İşlemi Vergi Komisyon: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiVergiKomisyonHook.processFile(selectedFile);
    }
    
    // X İşlemi Muhasebe Senaryoları processing
    if (isOpen && 
        sectionId === 'x-islemi-muhasebe-senaryolari' && 
        selectedFile && 
        !xIslemiMuhasebeSenaryolariHook.isProcessed && 
        !xIslemiMuhasebeSenaryolariHook.isLoading) {
      console.log('📄 X İşlemi Muhasebe Senaryoları: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiMuhasebeSenaryolariHook.processFile(selectedFile);
    }
    
    // X İşlemi Örnek Kayıtlar processing
    if (isOpen && 
        sectionId === 'x-islemi-ornek-kayitlar' && 
        selectedFile && 
        !xIslemiOrnekKayitlarHook.isProcessed && 
        !xIslemiOrnekKayitlarHook.isLoading) {
      console.log('📄 X İşlemi Örnek Kayıtlar: DOCX dosyası işleniyor:', selectedFile.name);
      xIslemiOrnekKayitlarHook.processFile(selectedFile);
    }
    
    // Fonksiyonel Olmayan Gereksinimler processing
    if (isOpen && 
        sectionId === 'fonksiyonel-olmayan-gereksinimler' && 
        selectedFile && 
        !fonksiyonelOlmayanGereksinimlerHook.isProcessed && 
        !fonksiyonelOlmayanGereksinimlerHook.isLoading) {
      console.log('📄 Fonksiyonel Olmayan Gereksinimler: DOCX dosyası işleniyor:', selectedFile.name);
      fonksiyonelOlmayanGereksinimlerHook.processFile(selectedFile);
    }
    
    // Kimlik Doğrulama Log processing
    if (isOpen && 
        sectionId === 'kimlik-dogrulama-log' && 
        selectedFile && 
        !kimlikDogrulamaLogHook.isProcessed && 
        !kimlikDogrulamaLogHook.isLoading) {
      console.log('📄 Kimlik Doğrulama Log: DOCX dosyası işleniyor:', selectedFile.name);
      kimlikDogrulamaLogHook.processFile(selectedFile);
    }
    
    // Kapsam Dışında processing
    if (isOpen && 
        sectionId === 'kapsam-disinda' && 
        selectedFile && 
        !kapsamDisindaHook.isProcessed && 
        !kapsamDisindaHook.isLoading) {
      console.log('📄 Kapsam Dışında: DOCX dosyası işleniyor:', selectedFile.name);
      kapsamDisindaHook.processFile(selectedFile);
    }
    
    // Ekler processing
    if (isOpen && 
        sectionId === 'ekler' && 
        selectedFile && 
        !eklerHook.isProcessed && 
        !eklerHook.isLoading) {
      console.log('📄 Ekler: DOCX dosyası işleniyor:', selectedFile.name);
      eklerHook.processFile(selectedFile);
    }
  }, [isOpen, sectionId, selectedFile, 
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
      xIslemiMuhasebeDeseniHook.isProcessed, xIslemiMuhasebeDeseniHook.isLoading, xIslemiMuhasebeDeseniHook.processFile,
      xIslemiKayitKurallariHook.isProcessed, xIslemiKayitKurallariHook.isLoading, xIslemiKayitKurallariHook.processFile,
      xIslemiVergiKomisyonHook.isProcessed, xIslemiVergiKomisyonHook.isLoading, xIslemiVergiKomisyonHook.processFile,
      xIslemiMuhasebeSenaryolariHook.isProcessed, xIslemiMuhasebeSenaryolariHook.isLoading, xIslemiMuhasebeSenaryolariHook.processFile,
      xIslemiOrnekKayitlarHook.isProcessed, xIslemiOrnekKayitlarHook.isLoading, xIslemiOrnekKayitlarHook.processFile,
      fonksiyonelOlmayanGereksinimlerHook.isProcessed, fonksiyonelOlmayanGereksinimlerHook.isLoading, fonksiyonelOlmayanGereksinimlerHook.processFile,
      kimlikDogrulamaLogHook.isProcessed, kimlikDogrulamaLogHook.isLoading, kimlikDogrulamaLogHook.processFile,
      kapsamDisindaHook.isProcessed, kapsamDisindaHook.isLoading, kapsamDisindaHook.processFile,
      eklerHook.isProcessed, eklerHook.isLoading, eklerHook.processFile]);

  // ESC tuşu ile kapatma ve focus yönetimi
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      // Modal açıldığında HTML ve body'yi tamamen override et
      const html = document.documentElement;
      const body = document.body;
      
      // Overflow'u kaldır
      html.style.overflow = 'hidden';
      html.style.overflowX = 'visible';
      html.style.overflowY = 'hidden';
      body.style.overflow = 'hidden';
      body.style.overflowX = 'visible';
      body.style.overflowY = 'hidden';
      
      // Boyutları zorla ayarla
      html.style.width = '100vw';
      html.style.height = '100vh';
      body.style.width = '100vw';
      body.style.height = '100vh';
      body.style.margin = '0';
      body.style.padding = '0';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      
      // HTML ve body'yi orijinal haline döndür
      const html = document.documentElement;
      const body = document.body;
      
      // Overflow'u reset et
      html.style.overflow = '';
      html.style.overflowX = '';
      html.style.overflowY = '';
      body.style.overflow = '';
      body.style.overflowX = '';
      body.style.overflowY = '';
      
      // Boyutları reset et
      html.style.width = '';
      html.style.height = '';
      body.style.width = '';
      body.style.height = '';
      body.style.margin = '';
      body.style.padding = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSectionUpdate = (content: string) => {
    setSectionContent(content);
  };

  const modalContent = (
    <div className="section-chat-overlay">
      <div className="section-chat-container">
        {/* Modal Header */}
        <div className="section-chat-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{sectionTitle}</h2>
            <span className="modal-subtitle">Düzenleme ve AI Desteği</span>
          </div>
          <button className="modal-close-btn" onClick={() => {
            // Modal kapanırken güncel içeriği hook'a kaydet
            const currentContent = getCurrentSectionContent();
            setSectionContent(currentContent);
            onClose();
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content - Split Layout */}
        <div className="section-chat-content">
          {/* Sol Taraf - Text Editor */}
          <div className="text-editor-panel">
            <div className="panel-header">
              <div className="panel-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>İçerik Düzenleme</span>
              </div>
              <div className="panel-info">
                <span className="word-count">{sectionContent.split(' ').filter(word => word.length > 0).length} kelime</span>
              </div>
            </div>
            <div className="text-editor-container">
              <textarea
                value={sectionContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={`${sectionTitle} bölümünün içeriğini buraya yazın...\n\nAI asistanından yardım alarak bu bölümü geliştirebilirsiniz.`}
                className="section-textarea"
              />
            </div>
            <div className="text-editor-footer">
              <div className="formatting-help">
                <span>Markdown formatı desteklenir</span>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - LLM Chat */}
          <div className="chat-panel">
            {(() => {
              const finalContent = sectionContent || getCurrentSectionContent();
              console.log('🚀 DEBUG - SectionChatModal LLMChat prop:', {
                sectionId,
                sectionContentLength: sectionContent.length,
                currentContentLength: getCurrentSectionContent().length,
                finalContentLength: finalContent.length,
                finalContentPreview: finalContent.substring(0, 100)
              });
              return (
                <LLMChat
                  sectionId={sectionId}
                  sectionTitle={sectionTitle}
                  sectionContent={finalContent}
                  onSectionUpdate={handleSectionUpdate}
                  className="section-chat"
                  getAllModalContents={getAllModalContents}
                  selectedFile={selectedFile}
                />
              );
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="section-chat-footer">
          <div className="footer-info">
            <span className="last-saved">Son kaydedilme: Henüz kaydedilmedi</span>
          </div>
          <div className="footer-actions">
            <button className="modal-btn secondary" onClick={onClose}>
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              İptal
            </button>
            <button 
              className="modal-btn primary" 
              onClick={handleSave}
              disabled={isSaving || !selectedFile}
            >
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal kullanarak modal'ı body'e direkt render et
  return createPortal(modalContent, document.body);
};

export default SectionChatModal;
