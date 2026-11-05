import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sun, 
  Moon, 
  Layers, 
  ChevronDown, 
  Plus, 
  Check, 
  FileText, 
  Download,
  Disc3,
  Key,
  Home,
  Upload,
  Users
} from 'lucide-react';
import { UserMenu } from './UserMenu';
import { MetronomeWidget } from './MetronomeWidget';
import { playVinylScratch, playVinylFlyOff, playRollingSound } from '../utils/soundEffects';
import { importAlbumFromFile } from '../utils/zipArchive';

export function Header({
  lang,
  setLang,
  theme,
  setTheme,
  t,
  accent,
  setAccent,
  albums,
  currentAlbumId,
  setCurrentAlbumId,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenNewAlbumModal,
  onOpenStudioSheet,
  onOpenExportImport,
  onOpenAlbumKey,
  onImportSingleAlbum,
  onOpenCloudSettings,
  showMiniPlayer,
  onToggleMiniPlayer,
  onAccountRestored,
  activePeers = [],
  isVinylEjected,
  onVinylEject,
  currentView,
  setCurrentView,
  lastSaved
}) {
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);
  const [showAccentMenu, setShowAccentMenu] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const albumFileInputRef = useRef(null);
  const albumDropdownRef = useRef(null);
  const accentDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (albumDropdownRef.current && !albumDropdownRef.current.contains(e.target)) {
        setShowAlbumMenu(false);
      }
      if (accentDropdownRef.current && !accentDropdownRef.current.contains(e.target)) {
        setShowAccentMenu(false);
      }
    };
    if (showAlbumMenu || showAccentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAlbumMenu, showAccentMenu]);

  // Scratch tracker refs for accurate physical rotation and drag tracking
  const turntableRef = useRef(null);
  const discElementRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastAngleRef = useRef(0);
  const rotationAngleRef = useRef(0);
  const accumulatedAngleRef = useRef(0);
  const scratchStrokeCountRef = useRef(0);

  const currentAlbum = albums.find(a => a.id === currentAlbumId) || albums[0];

  const m3Accents = [
    { id: 'mono', label: t.accentMono, color: theme === 'dark' ? '#f0f0f0' : '#1e1e1e', isMono: true },
    { id: 'olive', label: t.accentOlive, color: theme === 'dark' ? '#bcd085' : '#556526' },
    { id: 'sage', label: t.accentSage, color: theme === 'dark' ? '#9fcbc7' : '#386663' },
    { id: 'indigo', label: t.accentIndigo, color: theme === 'dark' ? '#90cdf4' : '#2c5282' },
    { id: 'terracotta', label: t.accentTerracotta, color: theme === 'dark' ? '#ffb5a0' : '#8f4c38' },
    { id: 'ochre', label: t.accentOchre, color: theme === 'dark' ? '#f0c242' : '#765b00' }
  ];

  // Calculate pointer angle from turntable center in degrees
  const getPointerAngle = useCallback((clientX, clientY) => {
    if (!turntableRef.current) return 0;
    const rect = turntableRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - cy, clientX - cx);
    return rad * (180 / Math.PI);
  }, []);

  // Mouse Down - requires LEFT click (e.button === 0)
  const handleMouseDown = (e) => {
    if (isVinylEjected) return;
    if (e.button !== 0) return; // Must be left mouse button!
    e.preventDefault();
    isDraggingRef.current = true;
    setIsScratching(true);
    lastAngleRef.current = getPointerAngle(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (isVinylEjected) return;
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      setIsScratching(true);
      lastAngleRef.current = getPointerAngle(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Eject Vinyl Easter Egg
  const triggerVinylEject = useCallback(() => {
    if (isVinylEjected) return;
    isDraggingRef.current = false;
    setIsScratching(false);
    accumulatedAngleRef.current = 0;
    scratchStrokeCountRef.current = 0;

    playVinylFlyOff();
    setTimeout(() => {
      playRollingSound();
    }, 400);

    if (onVinylEject) onVinylEject();
  }, [isVinylEjected, onVinylEject]);

  const handlePointerMove = useCallback((clientX, clientY) => {
    if (!isDraggingRef.current || isVinylEjected) return;

    const currentAngle = getPointerAngle(clientX, clientY);
    let delta = currentAngle - lastAngleRef.current;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    rotationAngleRef.current += delta;
    accumulatedAngleRef.current += Math.abs(delta);

    if (discElementRef.current) {
      discElementRef.current.style.transform = `rotate(${rotationAngleRef.current}deg)`;
    }

    // Play scratch sound every ~25 degrees of rotation
    if (Math.abs(delta) > 4) {
      scratchStrokeCountRef.current += 1;
      if (scratchStrokeCountRef.current % 4 === 0) {
        const direction = delta > 0 ? 1 : -1;
        const speedMultiplier = Math.min(2.5, Math.max(0.6, Math.abs(delta) / 8));
        playVinylScratch(direction, speedMultiplier);
      }
    }

    // Easter Egg: if rotated more than 2800 degrees (around 8 full spins fast), vinyl flies off
    if (accumulatedAngleRef.current > 2800) {
      triggerVinylEject();
    }

    lastAngleRef.current = currentAngle;
  }, [getPointerAngle, isVinylEjected, triggerVinylEject]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRef.current) {
        handlePointerMove(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsScratching(false);
      }
    };

    const handleTouchMove = (e) => {
      if (isDraggingRef.current && e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsScratching(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlePointerMove]);

  // Handle single album import from Header
  const handleAlbumFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const importedAlbum = await importAlbumFromFile(file);
      if (importedAlbum && importedAlbum.id && importedAlbum.title) {
        if (onImportSingleAlbum) {
          onImportSingleAlbum(importedAlbum);
        }
      } else {
        alert(t.importAlbumError || "Не вдалося розпізнати альбом у файлі");
      }
    } catch (err) {
      console.error(err);
      alert(t.importAlbumError || "Помилка імпорту альбому");
    } finally {
      if (albumFileInputRef.current) {
        albumFileInputRef.current.value = "";
      }
    }
  };

  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      width: '100%'
    }}>
      {/* Hidden file input for single album import */}
      <input
        ref={albumFileInputRef}
        type="file"
        accept=".zip,.json,application/zip,application/json"
        onChange={handleAlbumFileSelected}
        style={{ display: 'none' }}
      />

      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'nowrap'
      }}>
        
        {/* Brand & Spinning Interactive Vinyl */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Turntable spindle container */}
            <div
              ref={turntableRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: isVinylEjected ? 'var(--bg-pill)' : 'var(--accent)',
                border: isVinylEjected ? '2px dashed var(--border-medium)' : '2px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isVinylEjected ? 'default' : (isScratching ? 'grabbing' : 'grab'),
                position: 'relative',
                boxShadow: isVinylEjected ? 'none' : 'var(--shadow-sm)',
                transition: 'border 0.25s ease, background 0.25s ease',
                userSelect: 'none',
                touchAction: 'none',
                flexShrink: 0
              }}
              title={
                isVinylEjected
                  ? (t.discEjectedTooltip || 'Диск злетів і покотився вниз!')
                  : (t.discScratchTooltip || 'Затисніть ЛІВУ кнопку миші і крутіть диск!')
              }
            >
              {isVinylEjected ? (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
              ) : (
                <div
                  ref={discElementRef}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    willChange: 'transform'
                  }}
                  className={!isScratching ? 'vinyl-spinning' : ''}
                >
                  <Disc3
                    size={22}
                    color="var(--text-on-accent)"
                  />
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  track<span style={{ color: 'var(--accent)' }}>ER</span>
                </span>
                <span className="pill" style={{ fontSize: '0.62rem', padding: '1px 6px', textTransform: 'lowercase', fontWeight: 600 }}>
                  {currentUser ? (currentUser.username || currentUser.artistName) : 'guest'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

          {/* Home / Studio View Switcher */}
          <div className="segmented-control" style={{ flexShrink: 0, height: 32, boxSizing: 'border-box' }}>
            <button
              onClick={() => setCurrentView && setCurrentView('home')}
              className={`segmented-control-btn ${currentView === 'home' ? 'active' : ''}`}
              title={t.navHome || 'Головна'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '0 10px', height: '100%' }}
            >
              <Home size={13} />
              <span>{t.navHome || 'Головна'}</span>
            </button>
            <button
              onClick={() => setCurrentView && setCurrentView('studio')}
              className={`segmented-control-btn ${currentView === 'studio' ? 'active' : ''}`}
              title={t.navStudio || 'Студія'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '0 10px', height: '100%' }}
            >
              <Disc3 size={13} />
              <span>{t.navStudio || 'Студія'}</span>
            </button>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

          {/* Album Selector Dropdown (with New Album & Import Album inside) */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div ref={albumDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAlbumMenu(!showAlbumMenu)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  height: 32,
                  boxSizing: 'border-box',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <Layers size={13} color="var(--accent)" />
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {currentAlbum ? currentAlbum.title : t.selectAlbum}
                </span>
                <ChevronDown size={12} color="var(--text-muted)" />
              </button>

              {showAlbumMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: 250,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-modal)',
                    padding: '6px',
                    zIndex: 110
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t.albums} ({albums.length})
                  </div>

                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {albums.map(alb => (
                      <button
                        key={alb.id}
                        onClick={() => {
                          setCurrentAlbumId(alb.id);
                          setShowAlbumMenu(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          background: alb.id === currentAlbumId ? 'var(--accent-subtle)' : 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: alb.id === currentAlbumId ? 'var(--accent)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {alb.title}
                        </span>
                        {alb.id === currentAlbumId && <Check size={14} />}
                      </button>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      onClick={() => {
                        setShowAlbumMenu(false);
                        onOpenNewAlbumModal();
                      }}
                      className="btn btn-sm btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Plus size={13} />
                      {t.newAlbum}
                    </button>
                    
                    {/* Import Album option beside New Album in dropdown */}
                    <button
                      onClick={() => {
                        setShowAlbumMenu(false);
                        if (albumFileInputRef.current) albumFileInputRef.current.click();
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Upload size={13} />
                      {t.importAlbum || "Імпортувати альбом"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Tools: Metronome, Collab indicator, Accent picker, Light/Dark, Language, User Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', flexShrink: 0 }}>
          
          {/* 5. Metronome in Top Bar (Ableton & FL Studio) */}
          <MetronomeWidget t={t} />

          {/* 6. Active Collaboration Presence Indicator */}
          {activePeers && activePeers.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                fontSize: '0.72rem',
                color: '#22c55e',
                fontWeight: 600
              }}
              title={`${t.activeCollaborators || "Активні учасники"}: ${activePeers.map(p => p.artistName || p.username).join(', ')}`}
            >
              <Users size={12} />
              <span>{activePeers.length} {t.online || "онлайн"}</span>
            </div>
          )}

          {/* M3 Accent Color Selector */}
          <div ref={accentDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAccentMenu(!showAccentMenu)}
              className="btn btn-secondary btn-icon btn-sm"
              style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', padding: 0 }}
              title={t.accentColor}
            >
              <div style={{
                width: 15,
                height: 15,
                borderRadius: '50%',
                background: 'var(--accent)',
                border: '1.5px solid var(--bg-card)',
                boxShadow: '0 0 0 1px var(--border-medium)'
              }} />
            </button>

            {showAccentMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-modal)',
                padding: '10px',
                zIndex: 70
              }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, padding: '4px 6px 8px' }}>
                  {t.accentColor} (Material 3)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {m3Accents.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAccent(item.id);
                        setShowAccentMenu(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: accent === item.id ? 'var(--accent-subtle)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: item.color,
                          border: item.isMono ? '1px solid var(--border-medium)' : 'none'
                        }} />
                        <span style={{ fontWeight: accent === item.id ? 600 : 400 }}>
                          {item.label}
                        </span>
                      </div>
                      {accent === item.id && <Check size={13} color="var(--accent)" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle */}
          <div className="segmented-control" style={{ height: 32, boxSizing: 'border-box' }}>
            <button
              onClick={() => setTheme('light')}
              className={`segmented-control-btn ${theme === 'light' ? 'active' : ''}`}
              title={t.themeLight}
              style={{ height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Sun size={13} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`segmented-control-btn ${theme === 'dark' ? 'active' : ''}`}
              title={t.themeDark}
              style={{ height: '100%', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Moon size={13} />
            </button>
          </div>

          {/* Language Switcher Pill */}
          <div className="segmented-control" style={{ height: 32, boxSizing: 'border-box' }}>
            <button
              onClick={() => setLang('uk')}
              className={`segmented-control-btn ${lang === 'uk' ? 'active' : ''}`}
              style={{ height: '100%', padding: '0 10px', fontSize: '0.76rem', fontWeight: 600 }}
            >
              UA
            </button>
            <button
              onClick={() => setLang('en')}
              className={`segmented-control-btn ${lang === 'en' ? 'active' : ''}`}
              style={{ height: '100%', padding: '0 10px', fontSize: '0.76rem', fontWeight: 600 }}
            >
              EN
            </button>
          </div>

          {/* 1. Encrypted User Account Menu with Export/Import Account */}
          <UserMenu
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onSignOut={onSignOut}
            onOpenCloudSettings={onOpenCloudSettings}
            showMiniPlayer={showMiniPlayer}
            onToggleMiniPlayer={onToggleMiniPlayer}
            onAccountRestored={onAccountRestored}
            t={t}
          />

        </div>

      </div>
    </header>
  );
}
