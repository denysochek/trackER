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
  Home
} from 'lucide-react';
import { UserMenu } from './UserMenu';
import { playVinylScratch, playVinylFlyOff, playRollingSound } from '../utils/soundEffects';

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
  isVinylEjected,
  onVinylEject,
  currentView,
  setCurrentView,
  lastSaved
}) {
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);
  const [showAccentMenu, setShowAccentMenu] = useState(false);
  const [isScratching, setIsScratching] = useState(false);

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
    accumulatedAngleRef.current = 0;
  };

  // Touch Start for mobile/trackpad
  const handleTouchStart = (e) => {
    if (isVinylEjected) return;
    if (e.touches.length !== 1) return;

    isDraggingRef.current = true;
    setIsScratching(true);
    const touch = e.touches[0];
    lastAngleRef.current = getPointerAngle(touch.clientX, touch.clientY);
    accumulatedAngleRef.current = 0;
  };

  // Window-level move handler to allow natural dragging even if cursor moves slightly outside the circle
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!isDraggingRef.current || isVinylEjected) return;

      // Verify left mouse button is still held down (e.buttons === 1)
      if (e.buttons !== 1) {
        isDraggingRef.current = false;
        setIsScratching(false);
        return;
      }

      const currentAngle = getPointerAngle(e.clientX, e.clientY);
      let delta = currentAngle - lastAngleRef.current;

      // Handle wraparound between -180 and 180 degrees
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      lastAngleRef.current = currentAngle;
      rotationAngleRef.current += delta;
      accumulatedAngleRef.current += Math.abs(delta);

      // Rotate vinyl directly with the mouse!
      if (discElementRef.current) {
        discElementRef.current.style.transform = `rotate(${rotationAngleRef.current}deg)`;
      }

      // Trigger high-quality scratch sound every ~26 degrees of movement
      if (accumulatedAngleRef.current >= 26) {
        accumulatedAngleRef.current = 0;
        scratchStrokeCountRef.current += 1;

        const direction = delta >= 0 ? 1 : -1;
        const speedMultiplier = Math.min(2.0, Math.max(0.7, Math.abs(delta) / 12));
        playVinylScratch(direction, speedMultiplier);

        // After 10 scratches, vinyl flies off and rolls along bottom!
        if (scratchStrokeCountRef.current >= 50) {
          isDraggingRef.current = false;
          setIsScratching(false);
          scratchStrokeCountRef.current = 0;
          playVinylFlyOff();
          if (onVinylEject) {
            onVinylEject();
          }
        }
      }
    };

    const handleWindowTouchMove = (e) => {
      if (!isDraggingRef.current || isVinylEjected) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const currentAngle = getPointerAngle(touch.clientX, touch.clientY);
      let delta = currentAngle - lastAngleRef.current;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      lastAngleRef.current = currentAngle;
      rotationAngleRef.current += delta;
      accumulatedAngleRef.current += Math.abs(delta);

      if (discElementRef.current) {
        discElementRef.current.style.transform = `rotate(${rotationAngleRef.current}deg)`;
      }

      if (accumulatedAngleRef.current >= 26) {
        accumulatedAngleRef.current = 0;
        scratchStrokeCountRef.current += 1;

        const direction = delta >= 0 ? 1 : -1;
        playVinylScratch(direction, 1.0);

        if (scratchStrokeCountRef.current >= 50) {
          isDraggingRef.current = false;
          setIsScratching(false);
          scratchStrokeCountRef.current = 0;
          playVinylFlyOff();
          if (onVinylEject) {
            onVinylEject();
          }
        }
      }
    };

    const handleWindowPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsScratching(false);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowPointerUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowPointerUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowPointerUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowPointerUp);
    };
  }, [isVinylEjected, onVinylEject, getPointerAngle]);

  return (
    <header className="glass-header">
      <div style={{
        maxWidth: 1360,
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        
        {/* Brand & Spinning Interactive Vinyl */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Turntable spindle container */}
            <div
              ref={turntableRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{
                width: 38,
                height: 38,
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
                touchAction: 'none'
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
                    size={26}
                    color="var(--text-on-accent)"
                  />
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.18rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  track<span style={{ color: 'var(--accent)' }}>ER</span>
                </span>
                <span className="pill" style={{ fontSize: '0.65rem', padding: '1px 7px', textTransform: 'lowercase', fontWeight: 600 }}>
                  {currentUser ? (currentUser.username || currentUser.artistName) : 'guest'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

          {/* Home / Studio View Switcher */}
          <div className="segmented-control">
            <button
              onClick={() => setCurrentView && setCurrentView('home')}
              className={`segmented-control-btn ${currentView === 'home' ? 'active' : ''}`}
              title={t.navHome || 'Головна'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '3px 10px' }}
            >
              <Home size={13} />
              <span>{t.navHome || 'Головна'}</span>
            </button>
            <button
              onClick={() => setCurrentView && setCurrentView('studio')}
              className={`segmented-control-btn ${currentView === 'studio' ? 'active' : ''}`}
              title={t.navStudio || 'Студія'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '3px 10px' }}
            >
              <Disc3 size={13} />
              <span>{t.navStudio || 'Студія'}</span>
            </button>
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

          {/* Album Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAlbumMenu(!showAlbumMenu)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Layers size={14} color="var(--accent)" />
              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {currentAlbum ? currentAlbum.title : t.selectAlbum}
              </span>
              <ChevronDown size={13} color="var(--text-muted)" />
            </button>

            {showAlbumMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: 240,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-modal)',
                  padding: '6px',
                  zIndex: 60
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

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6 }}>
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
                </div>
              </div>
            )}
          </div>



        </div>

        {/* Right Tools: Accent picker, Light/Dark, Language, Studio Sheet, Export, User Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          
          {/* M3 Accent Color Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAccentMenu(!showAccentMenu)}
              className="btn btn-secondary btn-icon btn-sm"
              style={{ width: 34, height: 34 }}
              title={t.accentColor}
            >
              <div style={{
                width: 16,
                height: 16,
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
          <div className="segmented-control">
            <button
              onClick={() => setTheme('light')}
              className={`segmented-control-btn ${theme === 'light' ? 'active' : ''}`}
              title={t.themeLight}
            >
              <Sun size={13} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`segmented-control-btn ${theme === 'dark' ? 'active' : ''}`}
              title={t.themeDark}
            >
              <Moon size={13} />
            </button>
          </div>

          {/* Language Switcher Pill */}
          <div className="segmented-control">
            <button
              onClick={() => setLang('uk')}
              className={`segmented-control-btn ${lang === 'uk' ? 'active' : ''}`}
            >
              UA
            </button>
            <button
              onClick={() => setLang('en')}
              className={`segmented-control-btn ${lang === 'en' ? 'active' : ''}`}
            >
              EN
            </button>
          </div>





          {/* Encrypted User Account Menu */}
          <UserMenu
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onSignOut={onSignOut}
            t={t}
          />

        </div>

      </div>
    </header>
  );
}
