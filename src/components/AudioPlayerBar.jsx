import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, X, Volume2, VolumeX, Disc } from "lucide-react";

export function AudioPlayerBar({
  track,
  onClose
}) {
  if (!track) return null;

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const synthIntervalRef = useRef(null);

  const playSynthPulse = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const bpm = track.bpm || 128;
      const freq = 130.81;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch (e) {}
  };

  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
        const bpm = track.bpm || 128;
        const intervalMs = (60 / bpm) * 1000;
        playSynthPulse();
        synthIntervalRef.current = setInterval(playSynthPulse, intervalMs);
      });
    }

    return () => {
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };
  }, [track]);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          const bpm = track.bpm || 128;
          const intervalMs = (60 / bpm) * 1000;
          playSynthPulse();
          synthIntervalRef.current = setInterval(playSynthPulse, intervalMs);
        });
      }
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleSeek = (e) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 40px)",
      maxWidth: 780,
      background: "var(--bg-card)",
      backdropFilter: "saturate(180%) blur(20px)",
      WebkitBackdropFilter: "saturate(180%) blur(20px)",
      border: "1px solid var(--border-medium)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-modal)",
      padding: "10px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      zIndex: 90,
      animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      color: "var(--text-primary)"
    }}>
      <audio
        ref={audioRef}
        src={track.demoUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180, flex: 1 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--accent-subtle)",
          border: "1px solid rgba(var(--accent-rgb), 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Disc size={18} color="var(--accent)" />
        </div>

        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
            {track.title}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: 6 }}>
            {track.bpm && <span>{track.bpm} BPM</span>}
            {track.key && <span>• {track.key}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 2, minWidth: 200 }}>
        <button
          onClick={togglePlay}
          className="btn btn-primary btn-icon"
          style={{ width: 34, height: 34, borderRadius: "50%" }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            style={{
              width: "100%",
              accentColor: "var(--accent)",
              cursor: "pointer"
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            if (audioRef.current) audioRef.current.muted = nextMuted;
          }}
          className="btn-ghost btn-icon btn-sm"
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          onClick={() => {
            if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
            if (audioRef.current) audioRef.current.pause();
            onClose();
          }}
          className="btn-ghost btn-icon btn-sm"
        >
          <X size={16} />
        </button>
      </div>

    </div>
  );
}