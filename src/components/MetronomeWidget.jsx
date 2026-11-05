import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, Music, Settings2 } from 'lucide-react';
import { MetronomeEngine } from '../utils/metronome';

export function MetronomeWidget({ t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [preset, setPreset] = useState('live'); // 'live' | 'fruity' | 'knock' | 'cymbal' | 'cowbell'
  const [volume, setVolume] = useState(1.0); // 0.0 - 1.5 (150%)
  const [currentBeat, setCurrentBeat] = useState(0);

  const engineRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    engineRef.current = new MetronomeEngine((beatNumber, isAccent) => {
      setCurrentBeat(beatNumber);
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!engineRef.current) return;
    const running = engineRef.current.toggle();
    setIsPlaying(running);
    if (!running) {
      setCurrentBeat(0);
    }
  };

  const handleBpmChange = (newVal) => {
    const val = Math.max(30, Math.min(300, Number(newVal) || 120));
    setBpm(val);
    if (engineRef.current) {
      engineRef.current.setBpm(val);
    }
  };

  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    if (engineRef.current) {
      engineRef.current.setPreset(newPreset);
    }
  };

  const handleVolumeChange = (newVol) => {
    const val = Math.max(0, Math.min(1.5, parseFloat(newVol) || 1.0));
    setVolume(val);
    if (engineRef.current) {
      engineRef.current.setVolume(val);
    }
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const soundPresets = [
    { id: 'live', name: 'Live' },
    { id: 'fruity', name: 'Fruity' },
    { id: 'knock', name: 'Knock' },
    { id: 'cymbal', name: 'Cymbal' },
    { id: 'cowbell', name: '808 Bell' },
  ];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Metronome Quick Toggle Button in Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-pill)',
        borderRadius: 'var(--radius-full)',
        padding: '2px 4px',
        border: '1px solid var(--border-medium)',
        whiteSpace: 'nowrap'
      }}>
        <button
          onClick={handleTogglePlay}
          className={`btn btn-sm ${isPlaying ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            padding: '3px 8px',
            fontSize: '0.78rem',
            height: 28,
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title={isPlaying ? (t.metronomeStop || 'Зупинити метроном') : (t.metronomeStart || 'Запустити метроном')}
        >
          {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{bpm}</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>BPM</span>
        </button>

        {/* 4 Beat visual indicators */}
        <div style={{ display: 'flex', gap: 3, padding: '0 5px' }}>
          {[0, 1, 2, 3].map(beatIdx => {
            const isCurrent = isPlaying && currentBeat === beatIdx;
            const isAccent = beatIdx === 0;
            return (
              <div
                key={beatIdx}
                style={{
                  width: 5,
                  height: 12,
                  borderRadius: 2,
                  background: isCurrent 
                    ? (isAccent ? '#ef4444' : 'var(--accent)') 
                    : 'var(--border-medium)',
                  transform: isCurrent ? 'scaleY(1.3)' : 'scaleY(1)',
                  transition: 'transform 0.08s ease, background 0.08s ease'
                }}
              />
            );
          })}
        </div>

        {/* Settings Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-ghost btn-sm btn-icon"
          style={{ width: 26, height: 26, padding: 0 }}
          title={t.metronomeSettings || "Налаштування метронома"}
        >
          <Settings2 size={13} color="var(--text-muted)" />
        </button>
      </div>

      {/* Metronome Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 270,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          padding: 14,
          zIndex: 80
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Music size={14} color="var(--accent)" />
              {t.metronome || 'Метроном'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Web Audio API</span>
          </div>

          {/* BPM Slider & Steppers */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Темп (BPM):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => handleBpmChange(bpm - 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: 22, height: 22, padding: 0, fontSize: '0.8rem' }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={bpm}
                  onChange={(e) => handleBpmChange(e.target.value)}
                  style={{
                    width: 48,
                    textAlign: 'center',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 4,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  onClick={() => handleBpmChange(bpm + 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: 22, height: 22, padding: 0, fontSize: '0.8rem' }}
                >
                  +
                </button>
              </div>
            </div>

            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => handleBpmChange(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>

          {/* Volume Control: 0 to 150% */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Volume2 size={12} />
                {t.volume || 'Гучність'}:
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: volume > 1.0 ? '#f59e0b' : 'var(--text-primary)' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              style={{ width: '100%', accentColor: volume > 1.0 ? '#f59e0b' : 'var(--accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
              <span>0%</span>
              <span>100%</span>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>150% (Boost)</span>
            </div>
          </div>

          {/* Sound Presets */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
              {t.metronomeSound || 'Звук метронома'}:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
              {soundPresets.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => handlePresetChange(sp.id)}
                  style={{
                    padding: '5px 8px',
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: preset === sp.id ? 'var(--accent)' : 'var(--border-subtle)',
                    background: preset === sp.id ? 'var(--accent-subtle)' : 'var(--bg-pill)',
                    color: preset === sp.id ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sp.name}
                </button>
              ))}
            </div>
          </div>

          {/* Big Start/Stop Button */}
          <button
            onClick={handleTogglePlay}
            className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
            style={{ width: '100%', justifyContent: 'center', padding: '7px 0', fontSize: '0.85rem', fontWeight: 700 }}
          >
            {isPlaying ? (
              <>
                <Square size={13} fill="currentColor" />
                <span>{t.stopMetronome || 'Зупинити'}</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>{t.startMetronome || 'Старт (120 BPM)'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
