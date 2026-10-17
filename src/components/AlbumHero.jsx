import React, { useState } from "react";
import { 
  Edit3, 
  Trash2, 
  Calendar, 
  Music, 
  Sparkles, 
  FileEdit,
  Disc,
  Share2
} from "lucide-react";
import { calculateAlbumProgress, calculateStageBreakdown, calculateTrackScore } from "../constants";
import { EasterNumberTrigger } from "./EasterEggs";

export function AlbumHero({
  album,
  t,
  onEditAlbum,
  onDeleteAlbum,
  onOpenConceptModal,
  onOpenAlbumKey,
  onOpenShareModal,
  onTriggerEgg
}) {
  if (!album) return null;

  const tracks = album.tracks || [];
  const progressPercent = calculateAlbumProgress(tracks);
  const stageBreakdown = calculateStageBreakdown(tracks);
  const completedCount = tracks.filter(tr => calculateTrackScore(tr) === 10).length;
  
  const totalScore = tracks.reduce((acc, tr) => acc + calculateTrackScore(tr), 0);
  const avgScore = tracks.length > 0 ? (totalScore / tracks.length).toFixed(1) : "0.0";

  return (
    <div className="glass-panel" style={{ padding: "24px 28px", marginBottom: 24 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 32,
        alignItems: "center"
      }}>
        
        {/* Left column: Cover Art + Album Identity */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Album Cover Sleeve with clean subtle shadow */}
          <div className="album-sleeve-container" style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
            <div className="album-vinyl-disc" />
            <div
              style={{
                position: "relative",
                zIndex: 2,
                width: 150,
                height: 150,
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-card-secondary)"
              }}
            >
              <img
                src={album.coverUrl || `${import.meta.env.BASE_URL}covers/demo_cyan.jpg`}
                alt={album.title}
                onError={(e) => {
                  e.currentTarget.src = `${import.meta.env.BASE_URL}covers/demo_cyan.jpg`;
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            </div>
          </div>

          {/* Album Info */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              {album.genre && (
                <span className="pill pill-accent">
                  <Music size={11} />
                  {album.genre}
                </span>
              )}
              {album.targetDate && (
                <span className="pill">
                  <Calendar size={11} />
                  {album.targetDate}
                </span>
              )}
            </div>

            <h1 style={{
              fontSize: "1.85rem",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "var(--text-primary)",
              marginBottom: 4,
              letterSpacing: "-0.03em"
            }}>
              {album.title}
            </h1>

            <div style={{
              fontSize: "0.95rem",
              color: "var(--accent)",
              fontWeight: 600,
              marginBottom: 14
            }}>
              {album.artist || t.artist}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={onEditAlbum}
                className="btn btn-secondary btn-sm"
              >
                <Edit3 size={13} />
                <span>{t.editAlbum}</span>
              </button>
              
              <button
                onClick={onOpenShareModal}
                className="btn btn-secondary btn-sm"
                title={t.shareAlbum || "Поділитися альбомом"}
              >
                <Share2 size={13} color="var(--accent)" />
                <span>{t.shareAlbum || "Поділитися"}</span>
              </button>

              

              <button
                onClick={onOpenAlbumKey}
                className="btn btn-secondary btn-sm"
                title={t.albumPassword || "Пароль альбому"}
              >
                {album.isLocked ? (t.keyLocked || "🔒 Заблоковано") : album.masterKeyHash ? (t.keyActive || "🔑 Ключ активний") : (t.keyCreate || "🔑 Створити ключ")}
              </button>

              <button
                onClick={onDeleteAlbum}
                className="btn btn-danger-ghost btn-sm"
                title={t.deleteAlbum}
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Album Notes / Concept displayed right beside the album */}
            


          </div>
        </div>

        {/* Right column: Overall Progress & Metrics */}
        <div style={{
          background: "var(--bg-card-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          
          {/* Big Progress Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {t.overallProgress}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="font-display" style={{
                  fontSize: "2.4rem",
                  fontWeight: 700,
                  color: progressPercent === 100 ? "var(--color-success)" : "var(--text-primary)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em"
                }}>
                  <EasterNumberTrigger value={progressPercent} onTriggerEgg={onTriggerEgg}>{progressPercent}%</EasterNumberTrigger>
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {totalScore} / {tracks.length * 10} {t.pointsOutOf}
                </span>
              </div>
            </div>

            {progressPercent === 100 && (
              <span className="pill pill-success" style={{ padding: "5px 10px", fontSize: "0.78rem" }}>
                <Sparkles size={13} />
                Ready
              </span>
            )}
          </div>

          {/* Master Progress Bar */}
          <div className="progress-track" style={{ height: 8 }}>
            <div
              className="progress-fill shimmer"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? "var(--color-success)" : "var(--accent)"
              }}
            />
          </div>

          {/* Stage breakdown bars */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, paddingTop: 2 }}>
            {/* Beat */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: 4 }}>
                <span style={{ color: "var(--stage-beat-text)", fontWeight: 600 }}>{t.stageBeatShort}</span>
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}><EasterNumberTrigger value={stageBreakdown.beat} onTriggerEgg={onTriggerEgg}>{stageBreakdown.beat}%</EasterNumberTrigger></span>
              </div>
              <div className="progress-track" style={{ height: 4 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${stageBreakdown.beat}%`, background: "var(--stage-beat)" }}
                />
              </div>
            </div>

            {/* Vocal */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: 4 }}>
                <span style={{ color: "var(--stage-vocal-text)", fontWeight: 600 }}>{t.stageVocalShort}</span>
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}><EasterNumberTrigger value={stageBreakdown.vocal} onTriggerEgg={onTriggerEgg}>{stageBreakdown.vocal}%</EasterNumberTrigger></span>
              </div>
              <div className="progress-track" style={{ height: 4 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${stageBreakdown.vocal}%`, background: "var(--stage-vocal)" }}
                />
              </div>
            </div>

            {/* Visual */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: 4 }}>
                <span style={{ color: "var(--stage-visual-text)", fontWeight: 600 }}>{t.stageVisualShort}</span>
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}><EasterNumberTrigger value={stageBreakdown.visual} onTriggerEgg={onTriggerEgg}>{stageBreakdown.visual}%</EasterNumberTrigger></span>
              </div>
              <div className="progress-track" style={{ height: 4 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${stageBreakdown.visual}%`, background: "var(--stage-visual)" }}
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "0.78rem",
            color: "var(--text-secondary)"
          }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>{t.totalTracks}: </span>
              <strong style={{ color: "var(--text-primary)" }}>{tracks.length}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>{t.completedTracks}: </span>
              <strong style={{ color: "var(--color-success)" }}>{completedCount}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>{t.averageScore}: </span>
              <strong style={{ color: "var(--accent)" }}><EasterNumberTrigger value={avgScore} onTriggerEgg={onTriggerEgg}>{avgScore}</EasterNumberTrigger>/10</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}