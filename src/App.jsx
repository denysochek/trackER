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
  Unlock
} from 'lucide-react';

import { translations } from './translations';
import { INITIAL_ALBUMS, calculateTrackScore, calculateAlbumProgress } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { encryptData, decryptData } from './utils/crypto';
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
import { EasterEggsOverlay } from './components/EasterEggs';

export default function App() {
  // Appearance & Language state
  const [lang, setLang] = useLocalStorage('tracker_lang', 'uk');
  const [theme, setTheme] = useLocalStorage('tracker_theme', 'dark');
  const [accent, setAccent] = useLocalStorage('tracker_accent', 'indigo');

  // Auth & Encryption state
  const [currentUser, setCurrentUser] = useState(null);
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
              setAlbums(decryptedAlbums);
              setCurrentAlbumId(decryptedAlbums[0].id);
              return;
            }
          } catch (e) {
            console.error('Decryption failed:', e);
          }
        }
        setAlbums(INITIAL_ALBUMS);
        setCurrentAlbumId(INITIAL_ALBUMS[0].id);
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

  const handleLoginSuccess = (userSession) => {
    setCurrentUser(userSession);
    triggerConfetti();
  };

  const handleSignOut = () => {
    setCurrentUser(null);
  };

  const currentAlbum = albums.find(a => a.id === currentAlbumId) || albums[0] || INITIAL_ALBUMS[0];
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
    const updatedTracks = tracks.map(tr => tr.id === updatedTrack.id ? updatedTrack : tr);
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
      const matchKey = tr.key && tr.key.toLowerCase().includes(q);
      const matchBpm = tr.bpm && String(tr.bpm).includes(q);
      const matchNotes = tr.notes && tr.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchKey && !matchBpm && !matchNotes) return false;
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

        {/* Album Overview Hero */}
        <AlbumHero
          album={currentAlbum}
          t={t}
          onEditAlbum={() => setIsEditAlbumModalOpen(true)}
          onDeleteAlbum={handleDeleteAlbum}
          onOpenConceptModal={() => setIsConceptModalOpen(true)}
          onOpenAlbumKey={() => setIsAlbumKeyModalOpen(true)}
          onTriggerEgg={(egg) => setActiveEgg(egg)}
        />

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
              Альбом заблоковано ключем
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
              Треки та конфіденційні матеріали приховані. Введіть згенерований одноразовий пароль для перегляду.
            </p>
            <button
              onClick={() => setIsAlbumKeyModalOpen(true)}
              className="btn btn-primary"
              style={{ padding: '10px 24px' }}
            >
              <Unlock size={15} />
              <span>Ввести пароль розшифрування</span>
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
                title="Поставити диск назад на вертушку"
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
              title="Велика вільна дошка для нотаток, рим та думок простим чорним текстом"
            >
              <span style={{ fontSize: '0.95rem' }}>✎</span>
              <span>Велика дошка думок</span>
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
              Диск випав! 💥
            </strong>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Він покотився на самий низ сторінки
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