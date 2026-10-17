import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Search, 
  Music, 
  Sparkles, 
  Disc3, 
  Mic, 
  Video,
  Lock,
  ShieldCheck,
  Unlock,
  FileEdit
} from 'lucide-react';

import { translations } from './translations';
import { INITIAL_ALBUMS, calculateTrackScore, calculateAlbumProgress, DEMO_ALBUM_EN, DEMO_ALBUM_UK } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { encryptData, decryptData, exportKeyToBase64, importKeyFromBase64 } from './utils/crypto';
import { playVinylSnap, playDiscRoll } from './utils/soundEffects';

import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { BigBoardModal } from './components/BigBoardModal';
import { AlbumHero } from './components/AlbumHero';
import { TrackCard } from './components/TrackCard';
import { AlbumModal } from './components/AlbumModal';
import { ConceptModal } from './components/ConceptModal';
import { StudioSheetModal } from './components/StudioSheetModal';
import { ExportImportModal } from './components/ExportImportModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { AuthModal } from './components/AuthModal';
import { AlbumKeyModal } from './components/AlbumKeyModal';
import { ShareAlbumModal } from './components/ShareAlbumModal';
import { EasterEggsOverlay } from './components/EasterEggs';

export default function App() {
  // Appearance & Language state
  const [lang, setLang] = useLocalStorage('tracker_lang', 'uk');
  const [theme, setTheme] = useLocalStorage('tracker_theme', 'dark');
  const [accent, setAccent] = useLocalStorage('tracker_accent', 'indigo');

  // Auth & Encryption state
  const [currentUser, setCurrentUser] = useState(null);

  // Restore session including re-importing AES-GCM CryptoKey from rawKeyBase64
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = localStorage.getItem('tracker_user_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.rawKeyBase64) {
            const encryptionKey = await importKeyFromBase64(parsed.rawKeyBase64);
            setCurrentUser({
              ...parsed,
              encryptionKey
            });
            return;
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      }
    };
    restoreSession();
  }, []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Albums state
  const [albums, setAlbums] = useState(INITIAL_ALBUMS);
  const [currentAlbumId, setCurrentAlbumId] = useState(INITIAL_ALBUMS[0].id);
  const [lastSaved, setLastSaved] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentView, setCurrentView] = useState('studio'); // 'home' | 'studio'
  const [showVinylToast, setShowVinylToast] = useState(false);
  const [isBigBoardOpen, setIsBigBoardOpen] = useState(false);

  // Interactive vinyl rolling physics state
  const [isVinylEjected, setIsVinylEjected] = useState(false);
  const [isVinylRolling, setIsVinylRolling] = useState(false);

  // Easter eggs pure animation state
  const [activeEgg, setActiveEgg] = useState(null);

  // Media & Modals
  const [playingTrack, setPlayingTrack] = useState(null);
  const [isNewAlbumModalOpen, setIsNewAlbumModalOpen] = useState(false);
  const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [isStudioSheetModalOpen, setIsStudioSheetModalOpen] = useState(false);
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
  const [isAlbumKeyModalOpen, setIsAlbumKeyModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedAlbumToImport, setSharedAlbumToImport] = useState(null);

  // One-time account wipe requested by user
  useEffect(() => {
    if (!localStorage.getItem("tracker_wipe_accounts_v5")) {
      localStorage.removeItem("tracker_users_registry");
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("tracker_vault_")) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem("tracker_user_session");
      localStorage.setItem("tracker_wipe_accounts_v5", "true");
    }
  }, []);

  const t = translations[lang] || translations.uk;

  // Apply theme and accent to HTML root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent || 'indigo');
  }, [accent]);

  // Load albums
  useEffect(() => {
    const loadData = async () => {
      if (currentUser && currentUser.encryptionKey) {
        const vaultKey = `tracker_vault_${currentUser.username}`;
        const encryptedData = localStorage.getItem(vaultKey);
        if (encryptedData) {
          try {
            const decryptedAlbums = await decryptData(encryptedData, currentUser.encryptionKey);
            if (Array.isArray(decryptedAlbums) && decryptedAlbums.length > 0) {
              // Ensure demo album is excluded from user's encrypted vault
              const userAlbums = decryptedAlbums.filter(a => a.id !== 'album-neon-noir');
              if (userAlbums.length > 0) {
                setAlbums(userAlbums);
                setCurrentAlbumId(userAlbums[0].id);
                return;
              }
            }
          } catch (e) {
            console.error('Decryption failed:', e);
          }
        }
        // New user has an empty initial albums list (demo album is not in their profile)
        setAlbums([]);
        setCurrentAlbumId(null);
      } else {
        const savedGuest = localStorage.getItem('tracker_guest_albums');
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAlbums(parsed);
              setCurrentAlbumId(parsed[0].id);
              return;
            }
          } catch (e) {}
        }
        setAlbums(INITIAL_ALBUMS);
        setCurrentAlbumId(INITIAL_ALBUMS[0].id);
      }
    };

    loadData();
  }, [currentUser]);

  // Persist albums
  const persistAlbums = async (newAlbums) => {
    setAlbums(newAlbums);
    setLastSaved(new Date());

    if (currentUser && currentUser.encryptionKey) {
      try {
        const encryptedPayload = await encryptData(newAlbums, currentUser.encryptionKey);
        localStorage.setItem(`tracker_vault_${currentUser.username}`, encryptedPayload);
      } catch (err) {
        console.error('Error encrypting vault:', err);
      }
    } else {
      localStorage.setItem('tracker_guest_albums', JSON.stringify(newAlbums));
    }
  };



  // Automatically check recipient inbox for shared albums sent to this user (Local + Global Cloud Relay)
  useEffect(() => {
    if (!currentUser || !currentUser.username) return;

    const checkInbox = async () => {
      try {
        const usernameLower = currentUser.username.toLowerCase();
        const inboxKey = "tracker_shared_inbox_" + usernameLower;

        // 1. Check local inbox
        const raw = localStorage.getItem(inboxKey);
        let inboxItems = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) inboxItems.push(...parsed);
          } catch (e) {}
        }

        // 2. Poll Global Cloud Relay via ntfy.sh public CORS endpoint
        // This delivers albums sent between different computers, phones, or incognito sessions!
        const topic = `trackER_inbox_${usernameLower}`;
        try {
          const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1`, { cache: "no-store" });
          if (res.ok) {
            const lines = (await res.text()).trim().split("\n");
            for (const line of lines) {
              if (!line) continue;
              try {
                const msgObj = JSON.parse(line);
                if (msgObj && msgObj.message) {
                  const albumPayload = JSON.parse(msgObj.message);
                  if (albumPayload && albumPayload.title && Array.isArray(albumPayload.tracks)) {
                    inboxItems.push(albumPayload);
                  }
                }
              } catch (parseErr) {}
            }
          }
        } catch (cloudErr) {
          console.warn("Cloud relay inbox check note:", cloudErr);
        }

        if (inboxItems.length > 0) {
          setAlbums(prevAlbums => {
            let updated = [...prevAlbums];
            let addedCount = 0;

            inboxItems.forEach(sharedItem => {
              const alreadyExists = updated.some(a => 
                a.id === sharedItem.id || (a.title === sharedItem.title && a.sharedByUsername === sharedItem.sharedByUsername)
              );
              if (!alreadyExists) {
                updated.unshift({
                  ...sharedItem,
                  concept: sharedItem.concept || "",
                  tracks: sharedItem.tracks || []
                });
                addedCount++;
              }
            });

            if (addedCount > 0) {
              persistAlbums(updated);
              setCurrentAlbumId(inboxItems[0].id);
              setCurrentView("studio");
              triggerConfetti();
            }

            return updated;
          });

          // Clear local inbox after incorporating
          localStorage.removeItem(inboxKey);
        }
      } catch (err) {
        console.error("Error processing shared inbox:", err);
      }
    };

    checkInbox();
    window.addEventListener("storage", checkInbox);
    // Poll cloud inbox every 8 seconds while logged in
    const pollInterval = setInterval(checkInbox, 8000);

    return () => {
      window.removeEventListener("storage", checkInbox);
      clearInterval(pollInterval);
    };
  }, [currentUser]);

  // Handle Shared Album from URL hash (#share=...)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#share=")) {
        try {
          const raw = hash.replace("#share=", "");
          const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(raw))));
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.title && Array.isArray(parsed.tracks)) {
            setSharedAlbumToImport(parsed);
          }
        } catch (e) {
          console.error("Failed to parse shared album from URL hash:", e);
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleImportSharedAlbum = () => {
    if (!sharedAlbumToImport) return;
    const newId = "album-" + Date.now();
    const newAlbum = {
      ...sharedAlbumToImport,
      id: newId
    };
    const updated = [newAlbum, ...albums];
    persistAlbums(updated);
    setCurrentAlbumId(newId);
    setCurrentView("studio");
    setSharedAlbumToImport(null);
    window.location.hash = "";
    triggerConfetti();
  };


  // Synchronize default demo album concept & notes with selected language
  useEffect(() => {
    setAlbums(prevAlbums => {
      const demoData = lang === "en" ? DEMO_ALBUM_EN : DEMO_ALBUM_UK;
      return prevAlbums.map(alb => {
        if (alb.id === "album-neon-noir") {
          return {
            ...alb,
            concept: demoData.concept,
            tracks: alb.tracks.map(tr => ({
              ...tr,
              notes: demoData.trackNotes[tr.id] || tr.notes
            }))
          };
        }
        return alb;
      });
    });
  }, [lang]);

  const handleLoginSuccess = async (userSession, rememberMe = true) => {
    setCurrentUser(userSession);
    if (rememberMe) {
      try {
        let rawKeyBase64 = null;
        if (userSession.encryptionKey) {
          rawKeyBase64 = await exportKeyToBase64(userSession.encryptionKey);
        }
        const sessionToStore = {
          username: userSession.username,
          artistName: userSession.artistName,
          salt: userSession.salt,
          isAdmin: userSession.isAdmin,
          rawKeyBase64
        };
        localStorage.setItem('tracker_user_session', JSON.stringify(sessionToStore));
      } catch (e) {
        console.error('Failed to save session:', e);
      }
    } else {
      localStorage.removeItem('tracker_user_session');
    }
    triggerConfetti();
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('tracker_user_session');
  };

  const currentAlbum = albums.find(a => a.id === currentAlbumId) || albums[0] || (!currentUser ? INITIAL_ALBUMS[0] : null);
  const tracks = currentAlbum ? (currentAlbum.tracks || []) : [];

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Grand Continuous Fireworks display when an album hits 100% completion!
  const triggerAlbumCompleteFireworks = () => {
    try {
      const duration = 4.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      // Initial center explosion
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#0071E3', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#FFD60A']
      });

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 60 * (timeLeft / duration);
        // Multi-point fireworks launching from random locations on both sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
          colors: ['#0071E3', '#34C759', '#FFD60A', '#FF2D55', '#00F0FF']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
          colors: ['#FF9500', '#AF52DE', '#34C759', '#FF375F', '#5E5CE6']
        });
      }, 250);
    } catch (e) {
      console.error('Fireworks error:', e);
    }
  };

  // Vinyl eject & roll physics trigger after 50 scratches
  const handleVinylEject = () => {
    setIsVinylEjected(true);
    setIsVinylRolling(true);
    playDiscRoll();

    // Show side toast for 3 seconds
    setShowVinylToast(true);
    setTimeout(() => {
      setShowVinylToast(false);
    }, 3000);

    // The drop animation runs for 0.8 seconds down off screen
    setTimeout(() => {
      setIsVinylRolling(false);
    }, 800);
  };

  const handlePickUpVinyl = () => {
    playVinylSnap();
    setIsVinylEjected(false);
    setIsVinylRolling(false);
  };

  const handleSaveAlbum = (updatedAlbum) => {
    const existingIndex = albums.findIndex(a => a.id === updatedAlbum.id);
    let newAlbums;
    if (existingIndex >= 0) {
      newAlbums = [...albums];
      newAlbums[existingIndex] = updatedAlbum;
    } else {
      newAlbums = [updatedAlbum, ...albums];
      setCurrentAlbumId(updatedAlbum.id);
    }
    persistAlbums(newAlbums);
  };

  const handleDeleteAlbum = () => {
    if (window.confirm(t.deleteAlbumConfirm)) {
      const remaining = albums.filter(a => a.id !== currentAlbum.id);
      if (remaining.length === 0) {
        persistAlbums(INITIAL_ALBUMS);
        setCurrentAlbumId(INITIAL_ALBUMS[0].id);
      } else {
        persistAlbums(remaining);
        setCurrentAlbumId(remaining[0].id);
      }
    }
  };

  const handleSaveConcept = (newConcept) => {
    const updated = { ...currentAlbum, concept: newConcept };
    handleSaveAlbum(updated);
  };

  const handleAddTrack = () => {
    const newTrack = {
      id: `tr-${Date.now()}`,
      title: `${lang === 'uk' ? 'Новий трек' : 'New Track'} #${tracks.length + 1}`,
      bpm: 128,
      key: 'C Minor',
      demoUrl: '',
      notes: '',
      steps: {
        step_beat_demo: false,
        step_beat_arr: false,
        step_beat_mix: false,
        step_beat_master: false,
        step_voc_lyrics: false,
        step_voc_demo: false,
        step_voc_rec: false,
        step_voc_mix: false,
        step_vis_concept: false,
        step_vis_final: false
      }
    };
    handleSaveAlbum({ ...currentAlbum, tracks: [...tracks, newTrack] });
  };

  const handleUpdateTrack = (updatedTrack) => {
    const prevProgress = calculateAlbumProgress(tracks);
    const updatedTracks = tracks.map(tr => tr.id === updatedTrack.id ? updatedTrack : tr);
    const newProgress = calculateAlbumProgress(updatedTracks);

    if (newProgress === 100 && prevProgress < 100) {
      triggerAlbumCompleteFireworks();
    }
    handleSaveAlbum({ ...currentAlbum, tracks: updatedTracks });
  };

  const handleDeleteTrack = (trackId) => {
    if (window.confirm(t.deleteTrackConfirm)) {
      if (playingTrack && playingTrack.id === trackId) setPlayingTrack(null);
      const updatedTracks = tracks.filter(tr => tr.id !== trackId);
      handleSaveAlbum({ ...currentAlbum, tracks: updatedTracks });
    }
  };

  const handleDuplicateTrack = (trackToDup) => {
    const duplicated = {
      ...trackToDup,
      id: `tr-${Date.now()}`,
      title: `${trackToDup.title} (${lang === 'uk' ? 'Копія' : 'Copy'})`,
      steps: { ...trackToDup.steps }
    };
    handleSaveAlbum({ ...currentAlbum, tracks: [...tracks, duplicated] });
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const newTracks = [...tracks];
    const temp = newTracks[index - 1];
    newTracks[index - 1] = newTracks[index];
    newTracks[index] = temp;
    handleSaveAlbum({ ...currentAlbum, tracks: newTracks });
  };

  const handleMoveDown = (index) => {
    if (index >= tracks.length - 1) return;
    const newTracks = [...tracks];
    const temp = newTracks[index + 1];
    newTracks[index + 1] = newTracks[index];
    newTracks[index] = temp;
    handleSaveAlbum({ ...currentAlbum, tracks: newTracks });
  };

  const handlePlayDemo = (track) => {
    if (playingTrack && playingTrack.id === track.id) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(track);
    }
  };

  // Filter tracks
  const filteredTracks = tracks.filter(tr => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = tr.title.toLowerCase().includes(q);
      const matchCodeName = tr.codeName && tr.codeName.toLowerCase().includes(q);
      const matchFeat = tr.feat && tr.feat.toLowerCase().includes(q);
      const matchKey = tr.key && tr.key.toLowerCase().includes(q);
      const matchBpm = tr.bpm && String(tr.bpm).includes(q);
      const matchNotes = tr.notes && tr.notes.toLowerCase().includes(q);
      const matchTags = Array.isArray(tr.tags) && tr.tags.some(tg => tg.toLowerCase().includes(q));
      if (!matchTitle && !matchCodeName && !matchFeat && !matchKey && !matchBpm && !matchNotes && !matchTags) return false;
    }

    const s = tr.steps || {};
    const score = calculateTrackScore(tr);

    if (activeFilter === 'finished') return score === 10;
    if (activeFilter === 'in_progress') return score < 10;
    if (activeFilter === 'beat_needed') return !s.step_beat_demo || !s.step_beat_arr || !s.step_beat_mix || !s.step_beat_master;
    if (activeFilter === 'vocals_needed') return !s.step_voc_lyrics || !s.step_voc_demo || !s.step_voc_rec || !s.step_voc_mix;
    if (activeFilter === 'visuals_needed') return !s.step_vis_concept || !s.step_vis_final;

    return true;
  });

  const completedCount = tracks.filter(tr => calculateTrackScore(tr) === 10).length;
  const inProgressCount = tracks.length - completedCount;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Header
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
        accent={accent}
        setAccent={setAccent}
        albums={albums}
        currentAlbumId={currentAlbumId}
        setCurrentAlbumId={setCurrentAlbumId}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenNewAlbumModal={() => setIsNewAlbumModalOpen(true)}
        onOpenStudioSheet={() => setIsStudioSheetModalOpen(true)}
        onOpenExportImport={() => setIsExportImportModalOpen(true)}
        onOpenAlbumKey={() => setIsAlbumKeyModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        isVinylEjected={isVinylEjected}
        onVinylEject={handleVinylEject}
        currentView={currentView}
        setCurrentView={setCurrentView}
        lastSaved={lastSaved}
      />

      {/* Main Body */}
      <main style={{
        maxWidth: 1360,
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px 100px',
        flex: 1
      }}>
        {currentView === 'home' ? (
          <HomeView
            albums={albums}
            onSelectAlbum={(albId) => {
              setCurrentAlbumId(albId);
              setCurrentView('studio');
            }}
            onOpenNewAlbumModal={() => setIsNewAlbumModalOpen(true)}
            currentUser={currentUser}
            t={t}
          />
        ) : (
          <>
            {/* Guest Mode Encryption Prompt */}
        {!currentUser && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={16} color="var(--accent)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t.guestNotice}
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <ShieldCheck size={14} />
              <span>{t.createEncryptedAccount}</span>
            </button>
          </div>
        )}

        {!currentAlbum ? (
          <div style={{
            textAlign: "center",
            padding: "80px 24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-sm)",
            margin: "20px 0"
          }}>
            <Disc3 size={52} color="var(--accent)" style={{ margin: "0 auto 16px", opacity: 0.8 }} />
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              {t.noAlbumsInProfile || "У вашому профілі ще немає створених альбомів"}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
              {t.noAlbumsPrompt || "Створіть свій перший реліз або відкрийте домашню сторінку студії для перегляду проєктів."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={() => setIsNewAlbumModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: "10px 22px" }}
              >
                <Plus size={16} />
                <span>{t.newAlbum}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
        {/* Album Overview Hero */}
        <AlbumHero
          album={currentAlbum}
          t={t}
          onEditAlbum={() => setIsEditAlbumModalOpen(true)}
          onDeleteAlbum={handleDeleteAlbum}
          onOpenStudioSheet={() => setIsStudioSheetModalOpen(true)}
          onOpenExportImport={() => setIsExportImportModalOpen(true)}
          onOpenAlbumKey={() => setIsAlbumKeyModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onTriggerEgg={(egg) => setActiveEgg(egg)}
        />

        {/* Notes & Concept Field directly underneath Album */}
        {currentAlbum && !currentAlbum.isLocked && (
        <div style={{
          marginTop: -8,
          marginBottom: 24,
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-xl)",
          padding: "18px 22px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileEdit size={16} color="var(--accent)" />
              <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)" }}>
                {t.albumNotesTitle || "Концепція та нотатки альбому"}
              </strong>
            </div>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {t.changesSaved || "Зберігається автоматично"}
            </span>
          </div>

          <textarea
            value={currentAlbum.concept || ""}
            onChange={(e) => handleSaveAlbum({ ...currentAlbum, concept: e.target.value })}
            placeholder={t.addNotesPlaceholder || "Записуйте сюди концепцію альбому, ідеї, текст, референси чи технічні деталі зведення..."}
            className="textarea"
            style={{
              width: "100%",
              minHeight: 88,
              fontSize: "0.86rem",
              lineHeight: 1.5,
              background: "var(--bg-card-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              resize: "vertical",
              color: "var(--text-primary)",
              fontFamily: "inherit"
            }}
          />
        </div>
        )}

        {/* If album is locked by Master Key */}
        {currentAlbum.isLocked ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px dashed var(--accent)',
            boxShadow: 'var(--shadow-modal)',
            margin: '20px 0'
          }}>
            <Lock size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {t.albumLockedWithKey || "Альбом заблоковано ключем"}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
              {t.albumLockedNotice || "Треки та конфіденційні матеріали приховані. Введіть згенерований одноразовий пароль для перегляду."}
            </p>
            <button
              onClick={() => setIsAlbumKeyModalOpen(true)}
              className="btn btn-primary"
              style={{ padding: '10px 24px' }}
            >
              <Unlock size={15} />
              <span>{t.enterKeyToDecryptBtn || "Ввести пароль розшифрування"}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar: Tracklist header, Add Track, Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 16,
              flexWrap: 'wrap'
            }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t.trackOrder}
                </h2>
                <span className="pill" style={{ fontSize: '0.78rem' }}>
                  {tracks.length}
                </span>

                <button
                  onClick={handleAddTrack}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} />
                  <span>{t.addTrack}</span>
                </button>
              </div>

              {/* Minimal Search Input */}
              <div style={{ position: 'relative', minWidth: 240, flex: '0 1 300px' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchTracks}
                  className="input"
                  style={{ paddingLeft: 32, fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
                />
              </div>

            </div>

            {/* Segmented Filter Pills */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 18,
              overflowX: 'auto',
              paddingBottom: 4
            }}>
              <button
                onClick={() => setActiveFilter('all')}
                className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t.filterAll} ({tracks.length})
              </button>

              <button
                onClick={() => setActiveFilter('finished')}
                className={`btn btn-sm ${activeFilter === 'finished' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Sparkles size={12} />
                {t.filterFinished} ({completedCount})
              </button>

              <button
                onClick={() => setActiveFilter('in_progress')}
                className={`btn btn-sm ${activeFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t.filterInProgress} ({inProgressCount})
              </button>

              <button
                onClick={() => setActiveFilter('beat_needed')}
                className={`btn btn-sm ${activeFilter === 'beat_needed' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Disc3 size={12} color="var(--stage-beat)" />
                {t.filterBeatNeeded}
              </button>

              <button
                onClick={() => setActiveFilter('vocals_needed')}
                className={`btn btn-sm ${activeFilter === 'vocals_needed' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Mic size={12} color="var(--stage-vocal)" />
                {t.filterVocalsNeeded}
              </button>

              <button
                onClick={() => setActiveFilter('visuals_needed')}
                className={`btn btn-sm ${activeFilter === 'visuals_needed' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Video size={12} color="var(--stage-visual)" />
                {t.filterVisualsNeeded}
              </button>
            </div>

            {/* Tracklist List */}
            {filteredTracks.length > 0 ? (
              <div>
                {filteredTracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    index={index}
                    totalTracks={filteredTracks.length}
                    t={t}
                    onUpdateTrack={handleUpdateTrack}
                    onDeleteTrack={handleDeleteTrack}
                    onDuplicateTrack={handleDuplicateTrack}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onPlayDemo={handlePlayDemo}
                    isCurrentlyPlaying={playingTrack && playingTrack.id === track.id}
                    onTriggerConfetti={triggerConfetti}
                    onTriggerEgg={(egg) => setActiveEgg(egg)}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-medium)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Music size={36} color="var(--accent)" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                  {tracks.length === 0 ? t.noTracksTitle : t.noFilteredTracks}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                  {tracks.length === 0 ? t.noTracksSubtitle : ''}
                </p>
                {tracks.length === 0 && (
                  <button onClick={handleAddTrack} className="btn btn-primary">
                    <Plus size={14} />
                    {t.addFirstTrack}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        


          </>
        )}
          </>
        )}

        {/* Footer with credit, compact restored disc button, and hidden big board button */}
        <footer className="page-bottom-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>trackER STUDIO</span>
            <span>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {t.footerCredit || "зробив dionisii з любов'ю та gemini"}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Compact button with disc appearing in footer after falling */}
            {isVinylEjected && (
              <button
                onClick={handlePickUpVinyl}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.78rem',
                  border: '1.5px solid var(--accent)',
                  padding: '5px 12px'
                }}
                title={t.returnDisc || 'Поставити диск назад'}
              >
                <Disc3 size={15} color="var(--accent)" />
                <span style={{ fontWeight: 600 }}>{t.returnDisc || 'Диск на вертушку'}</span>
              </button>
            )}

            {/* Hidden Big Board button at bottom */}
            <button
              onClick={() => setIsBigBoardOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', padding: '5px 12px' }}
              title={t.bigBoardDesc || 'Велика вільна дошка'}
            >
              <span style={{ fontSize: '0.95rem' }}>✎</span>
              <span>{t.bigBoardTitle || 'Велика дошка'}</span>
            </button>
          </div>
        </footer>

      </main>

      {/* 1. Actively Rolling Vinyl Disc (Animated rolling along the floor) */}
      {isVinylRolling && (
        <div className="vinyl-rolling-actor">
          <Disc3 size={56} color="var(--accent)" className="vinyl-spinning" />
        </div>
      )}



      {/* Audio Player Bar */}
      <AudioPlayerBar
        track={playingTrack}
        onClose={() => setPlayingTrack(null)}
      />

      {/* Pure Animation Easter Eggs Overlay (No popups) */}
      <EasterEggsOverlay
        activeEgg={activeEgg}
        onClose={() => setActiveEgg(null)}
      />

      {/* Album Master Key Modal */}
      <AlbumKeyModal
        isOpen={isAlbumKeyModalOpen}
        onClose={() => setIsAlbumKeyModalOpen(false)}
        album={currentAlbum}
        currentUser={currentUser}
        onSaveAlbum={handleSaveAlbum}
        t={t}
      />

      {/* Side Toast Notification when disc ejects (3 seconds) */}
      {showVinylToast && (
        <div className="vinyl-toast-alert">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-on-accent)'
          }}>
            <Disc3 size={18} />
          </div>
          <div>
            <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
              {t.discFellAlertTitle || 'Диск випав! 💥'}
            </strong>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {t.discFellAlertDesc || 'Він покотився на самий низ сторінки'}
            </span>
          </div>
        </div>
      )}

      {/* Big Studio Board Modal (Black text) */}
      <BigBoardModal
        isOpen={isBigBoardOpen}
        onClose={() => setIsBigBoardOpen(false)}
        currentUser={currentUser}
        t={t}
      />


      {/* Share Album Modal */}
      <ShareAlbumModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        album={currentAlbum}
        currentUser={currentUser}
        t={t}
      />

      {/* Shared Album Notification Card */}
      {sharedAlbumToImport && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 250,
          background: "var(--bg-card)",
          border: "2px solid var(--accent)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-modal)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          maxWidth: 580,
          width: "92%"
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--accent-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
            flexShrink: 0
          }}>
            <Sparkles size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)", display: "block" }}>
              {t.sharedAlbumDetected || "Виявлено спільний альбом!"}
            </strong>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              «{sharedAlbumToImport.title}» ({sharedAlbumToImport.artist || "N/A"}) • {sharedAlbumToImport.tracks?.length || 0} треків
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setSharedAlbumToImport(null); window.location.hash = ""; }}
              className="btn btn-ghost btn-sm"
            >
              {t.cancel || "Скасувати"}
            </button>
            <button
              onClick={handleImportSharedAlbum}
              className="btn btn-primary btn-sm"
            >
              {t.importShared || "Імпортувати"}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        t={t}
      />

      <AlbumModal
        isOpen={isNewAlbumModalOpen}
        onClose={() => setIsNewAlbumModalOpen(false)}
        onSave={handleSaveAlbum}
        album={null}
        t={t}
      />

      <AlbumModal
        isOpen={isEditAlbumModalOpen}
        onClose={() => setIsEditAlbumModalOpen(false)}
        onSave={handleSaveAlbum}
        album={currentAlbum}
        t={t}
      />

      <ConceptModal
        isOpen={isConceptModalOpen}
        onClose={() => setIsConceptModalOpen(false)}
        album={currentAlbum}
        onSaveConcept={handleSaveConcept}
        t={t}
      />

      <StudioSheetModal
        isOpen={isStudioSheetModalOpen}
        onClose={() => setIsStudioSheetModalOpen(false)}
        album={currentAlbum}
        t={t}
      />

      <ExportImportModal
        isOpen={isExportImportModalOpen}
        onClose={() => setIsExportImportModalOpen(false)}
        albums={albums}
        onImportAlbums={(imported) => {
          persistAlbums(imported);
          if (imported.length > 0) setCurrentAlbumId(imported[0].id);
        }}
        t={t}
      />

    </div>
  );
}