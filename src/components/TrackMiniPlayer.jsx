import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bookmark, Flag, Repeat, Volume2 } from 'lucide-react';
import { playStudioClick } from '../utils/soundEffects';

export function TrackMiniPlayer({
  audioUrl,
  trackTitle,
  t
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 3 Markers:
  // Marker 1: Loop Start
  // Marker 2: Play / Focus position
  // Marker 3: Loop End
  const [marker1, setMarker1] = useState(null); // start loop
  const [marker2, setMarker2] = useState(null); // focus / jump
  const [marker3, setMarker3] = useState(null); // end loop
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      const curr = audio.currentTime;
      setCurrentTime(curr);

      // Check loop boundary
      if (isLooping && marker1 !== null && marker3 !== null) {
        if (curr >= marker3) {
          audio.currentTime = marker1;
          audio.play().catch(() => {});
        }
      }
    };

    const onEnded = () => {
      if (isLooping && marker1 !== null && marker3 !== null) {
        audio.currentTime = marker1;
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isLooping, marker1, marker3]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    playStudioClick();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = Number(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Marker 1: Set Loop Start
  const handleSetMarker1 = () => {
    playStudioClick();
    setMarker1(currentTime);
    if (marker3 !== null && marker3 > currentTime) {
      setIsLooping(true);
    }
  };

  // Marker 2: Play / Focus - jump back to Marker 2 (or Marker 1 if 2 not set) and start playing immediately
  const handleMarker2Focus = () => {
    const audio = audioRef.current;
    if (!audio) return;
    playStudioClick();

    if (marker2 === null) {
      // If marker 2 isn't set yet, pin it to current position
      setMarker2(currentTime);
    } else {
      // Jump and play
      audio.currentTime = marker2;
      setCurrentTime(marker2);
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Marker 3: Set Loop End and activate looping
  const handleSetMarker3 = () => {
    playStudioClick();
    setMarker3(currentTime);
    if (marker1 !== null) {
      setIsLooping(true);
    } else {
      // If Marker 1 wasn't set, default loop start to 0.0
      setMarker1(0);
      setIsLooping(true);
    }
  };

  const handleClearMarkers = () => {
    playStudioClick();
    setMarker1(null);
    setMarker2(null);
    setMarker3(null);
    setIsLooping(false);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      marginTop: 10,
      padding: '10px 14px',
      background: 'var(--bg-pill)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Top Player row: Play button, Progress Bar, Timestamps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={togglePlayPause}
          className="btn btn-primary btn-sm btn-icon"
          style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
          title={isPlaying ? "Пауза" : "Відтворити"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
        </button>

        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)', width: 38, textAlign: 'right' }}>
          {formatTime(currentTime)}
        </span>

        {/* Scrubber slider with marker flags overlay */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              accentColor: isLooping ? '#22c55e' : 'var(--accent)',
              cursor: 'pointer'
            }}
          />

          {/* Marker 1 indicator flag */}
          {duration > 0 && marker1 !== null && (
            <div
              title={`Мітка 1 (Start Loop): ${formatTime(marker1)}`}
              style={{
                position: 'absolute',
                left: `${(marker1 / duration) * 100}%`,
                top: -6,
                transform: 'translateX(-50%)',
                width: 2,
                height: 14,
                background: '#3b82f6',
                borderRadius: 1,
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Marker 2 indicator flag */}
          {duration > 0 && marker2 !== null && (
            <div
              title={`Мітка 2 (Focus): ${formatTime(marker2)}`}
              style={{
                position: 'absolute',
                left: `${(marker2 / duration) * 100}%`,
                top: -6,
                transform: 'translateX(-50%)',
                width: 2,
                height: 14,
                background: '#eab308',
                borderRadius: 1,
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Marker 3 indicator flag */}
          {duration > 0 && marker3 !== null && (
            <div
              title={`Мітка 3 (End Loop): ${formatTime(marker3)}`}
              style={{
                position: 'absolute',
                left: `${(marker3 / duration) * 100}%`,
                top: -6,
                transform: 'translateX(-50%)',
                width: 2,
                height: 14,
                background: '#ef4444',
                borderRadius: 1,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>

        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)', width: 38 }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Markers Control Bar: 3 Special Loop & Focus Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', paddingTop: 2, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Marker 1: Set Loop Start */}
          <button
            type="button"
            onClick={handleSetMarker1}
            className={`btn btn-sm ${marker1 !== null ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderColor: marker1 !== null ? '#3b82f6' : undefined
            }}
            title={t.marker1Tooltip || "Встановити початок циклу (Loop Start)"}
          >
            <Bookmark size={11} color="#3b82f6" />
            <span>{t.marker1 || "Мітка 1 (Start)"}: {marker1 !== null ? formatTime(marker1) : "--:--"}</span>
          </button>

          {/* Marker 2: Play / Focus */}
          <button
            type="button"
            onClick={handleMarker2Focus}
            className={`btn btn-sm ${marker2 !== null ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderColor: marker2 !== null ? '#eab308' : undefined
            }}
            title={marker2 === null ? (t.marker2SetTooltip || "Встановити мітку фокусу на поточному часі") : (t.marker2JumpTooltip || "Стрибок і відтворення з мітки фокусу")}
          >
            <Play size={10} color="#eab308" fill="#eab308" />
            <span>{t.marker2 || "Мітка 2 (Focus)"}: {marker2 !== null ? formatTime(marker2) : (t.setFocus || "Встановити")}</span>
          </button>

          {/* Marker 3: Set Loop End and Auto-Loop */}
          <button
            type="button"
            onClick={handleSetMarker3}
            className={`btn btn-sm ${marker3 !== null ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderColor: marker3 !== null ? '#ef4444' : undefined
            }}
            title={t.marker3Tooltip || "Встановити кінець циклу (Loop End) та увімкнути зациклення"}
          >
            <Flag size={11} color="#ef4444" />
            <span>{t.marker3 || "Мітка 3 (End)"}: {marker3 !== null ? formatTime(marker3) : "--:--"}</span>
          </button>
        </div>

        {/* Looping status badge & Reset button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLooping && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e'
            }}>
              <Repeat size={10} />
              LOOP {formatTime(marker1)} - {formatTime(marker3)}
            </span>
          )}

          {(marker1 !== null || marker2 !== null || marker3 !== null) && (
            <button
              type="button"
              onClick={handleClearMarkers}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.7rem', padding: '2px 6px', color: 'var(--text-muted)' }}
              title={t.resetMarkers || "Скинути мітки"}
            >
              <RotateCcw size={10} />
              <span>{t.reset || "Скинути"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

