import React, { useState } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  Activity, 
  Key, 
  Sparkles, 
  Check
} from "lucide-react";
import { STAGES, calculateTrackScore, getTrackMaxScore, isTrackFinished } from "../constants";
import { playStudioClick } from "../utils/soundEffects";
import { EasterNumberTrigger } from "./EasterEggs";

export function TrackCard({
  track,
  index,
  totalTracks,
  t,
  onUpdateTrack,
  onDeleteTrack,
  onDuplicateTrack,
  onMoveUp,
  onMoveDown,
  onPlayDemo,
  isCurrentlyPlaying,
  onTriggerConfetti,
  onTriggerEgg
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(track.title);

  const score = calculateTrackScore(track);
  const maxScore = getTrackMaxScore(track);
  const finished = isTrackFinished(track);

  const handleToggleStep = (stepId) => {
    playStudioClick();
    const prevSteps = track.steps || {};
    const newSteps = {
      ...prevSteps,
      [stepId]: !prevSteps[stepId]
    };
    const updated = { ...track, steps: newSteps };
    const newScore = calculateTrackScore(updated);
    
    const newMax = getTrackMaxScore(updated);
    if (newScore >= newMax && score < maxScore && onTriggerConfetti) {
      onTriggerConfetti();
    }
    
    onUpdateTrack(updated);
  };

  const getScoreColor = (pts) => {
    if (pts === 10) return "var(--color-success)";
    if (pts >= 7) return "var(--stage-vocal)";
    if (pts >= 4) return "var(--stage-beat)";
    if (pts >= 1) return "var(--color-warning)";
    return "var(--text-muted)";
  };

  const scoreColor = getScoreColor(score);

  return (
    <div
      className="glass-panel"
      style={{
        marginBottom: 12,
        padding: "16px 20px",
        borderColor: finished ? "rgba(52, 199, 89, 0.3)" : undefined
      }}
    >
      {/* Header Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap"
      }}>
        
        {/* Left: Reorder buttons, Number & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 260 }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="btn-ghost"
              style={{
                padding: 1,
                cursor: index === 0 ? "not-allowed" : "pointer",
                opacity: index === 0 ? 0.2 : 0.7,
                border: "none",
                display: "flex"
              }}
              title={t.moveUp}
            >
              <ChevronUp size={13} />
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === totalTracks - 1}
              className="btn-ghost"
              style={{
                padding: 1,
                cursor: index === totalTracks - 1 ? "not-allowed" : "pointer",
                opacity: index === totalTracks - 1 ? 0.2 : 0.7,
                border: "none",
                display: "flex"
              }}
              title={t.moveDown}
            >
              <ChevronDown size={13} />
            </button>
          </div>

          <span className="font-mono" style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            width: 26
          }}>
            #{String(index + 1).padStart(2, "0")}
          </span>

          <div style={{ flex: 1 }}>
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                autoFocus
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={() => {
                  onUpdateTrack({ ...track, title: titleInput.trim() || track.title });
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdateTrack({ ...track, title: titleInput.trim() || track.title });
                    setIsEditingTitle(false);
                  }
                }}
                className="input"
                style={{ padding: "4px 8px", fontSize: "0.95rem" }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    cursor: "pointer"
                  }}
                  title="Click to rename"
                >
                  {track.title}
                </span>

                {finished && (
                  <span className="pill pill-success" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                    <Sparkles size={10} />
                    {t.trackFinished || 'Завершено!'}
                  </span>
                )}

                {/* Track Type Pill */}
                {(track.type === 'instrumental' || track.type === 'skit') && (
                  <span className="pill" style={{ fontSize: "0.65rem", padding: "1px 6px", fontWeight: 600 }}>
                    {track.type === 'instrumental' ? '🎹 INST' : '🎤 SKIT'}
                  </span>
                )}
              </div>
            )}

            {/* Quick Metadata */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              {track.bpm && (
                <span className="pill" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                  <Activity size={10} color="var(--accent)" />
                  {track.bpm} BPM
                </span>
              )}
              {track.key && (
                <span className="pill" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                  <Key size={10} color="var(--stage-vocal)" />
                  {track.key}
                </span>
              )}
              {track.demoUrl && (
                <button
                  onClick={() => onPlayDemo(track)}
                  style={{
                    background: isCurrentlyPlaying ? "var(--accent)" : "var(--bg-pill)",
                    color: isCurrentlyPlaying ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-full)",
                    padding: "2px 8px",
                    fontSize: "0.68rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer"
                  }}
                >
                  {isCurrentlyPlaying ? <Pause size={9} /> : <Play size={9} />}
                  <span>DEMO</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Center / Right: Score & Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 170 }}>
          
          <div style={{ flex: 1, minWidth: 90 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                {t.trackScore}
              </span>
              <span className="font-mono" style={{ fontSize: "0.9rem", fontWeight: 700, color: scoreColor }}>
                <EasterNumberTrigger value={score} onTriggerEgg={onTriggerEgg}>{score}</EasterNumberTrigger> / {maxScore}
              </span>
            </div>

            <div className="progress-track" style={{ height: 5 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${(score / maxScore) * 100}%`,
                  background: scoreColor
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button
              onClick={() => onDuplicateTrack(track)}
              className="btn btn-ghost btn-icon btn-sm"
              title={t.duplicateTrack}
            >
              <Copy size={13} />
            </button>

            <button
              onClick={() => onDeleteTrack(track.id)}
              className="btn btn-danger-ghost btn-icon btn-sm"
              title={t.deleteTrack}
            >
              <Trash2 size={13} />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn btn-secondary btn-sm"
              style={{ padding: "5px 8px" }}
            >
              <span style={{ fontSize: "0.72rem" }}>{isExpanded ? "▲" : "▼"}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Track Type Selector */}
      <div style={{
        marginTop: 10,
        paddingTop: 10,
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap"
      }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
          {t.trackType || "Тип"}:
        </span>
        {['song', 'instrumental', 'skit'].map(typeId => (
          <button
            key={typeId}
            onClick={() => onUpdateTrack({ ...track, type: typeId })}
            className={`btn btn-sm ${(track.type || 'song') === typeId ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: "0.75rem", padding: "3px 10px" }}
          >
            {typeId === 'song' ? (t.trackTypeSong || 'Пісня (10)') 
              : typeId === 'instrumental' ? (t.trackTypeInstrumental || 'Інструментал (5)') 
              : (t.trackTypeSkit || 'Скіт (5)')}
          </button>
        ))}
      </div>

      {/* 10-Point Steps Grid */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--border-subtle)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 10
      }}>
        {STAGES.map(stage => {
          const isInstOrSkit = track.type === 'instrumental' || track.type === 'skit';
          
          // Skip vocal stage for instrumental/skit tracks
          if (isInstOrSkit && stage.id === 'vocal') {
            return (
              <div key={stage.id} style={{
                background: "var(--bg-card-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "8px 10px",
                opacity: 0.4
              }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.stageVocal} — <em>{t.vocalNotApplicable || "Не потрібен"}</em>
                </div>
              </div>
            );
          }

          const stageName = stage.id === "beat" 
            ? t.stageBeat 
            : stage.id === "vocal" 
            ? t.stageVocal 
            : t.stageVisual;
          
          // For inst/skit, beat is only 3 pts (demo + arr + mix/master combined)
          const displayMaxPts = isInstOrSkit && stage.id === 'beat' ? 3 : stage.maxPoints;
          
          return (
            <div
              key={stage.id}
              style={{
                background: "var(--bg-card-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "8px 10px"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: "0.74rem",
                fontWeight: 600,
                color: stage.textColor
              }}>
                <span>{stageName}</span>
                <span className="font-mono" style={{ fontSize: "0.68rem", opacity: 0.8 }}>
                  Max {displayMaxPts || stage.maxPoints} pts
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {stage.steps
                  .filter(step => !(isInstOrSkit && stage.id === 'beat' && step.id === 'step_beat_master'))
                  .map(step => {
                    const isChecked = !!(track.steps && track.steps[step.id]);
                    const label = (isInstOrSkit && step.id === 'step_beat_mix')
                      ? 'Зведення та Мастеринг'
                      : (t[step.id] || step.id);
                  const desc = t[`${step.id}_desc`] || "";

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleToggleStep(step.id)}
                      className={`step-button ${isChecked ? `completed ${stage.id}` : ''}`}
                      title={desc}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "5px 8px",
                        fontSize: "0.78rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{
                          width: 15,
                          height: 15,
                          borderRadius: 4,
                          border: isChecked ? `1px solid ${stage.color}` : "1px solid var(--border-medium)",
                          background: isChecked ? stage.color : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          flexShrink: 0
                        }}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span style={{ color: "var(--text-primary)" }}>
                          {label}
                        </span>
                      </div>
                      <span className="font-mono" style={{ fontSize: "0.68rem", color: isChecked ? stage.textColor : "var(--text-muted)" }}>
                        +1
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Track Details */}
      {isExpanded && (
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px dashed var(--border-subtle)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                  {t.bpm}
                </label>
                <input
                  type="number"
                  value={track.bpm || ""}
                  placeholder="128"
                  onChange={(e) => onUpdateTrack({ ...track, bpm: Number(e.target.value) || "" })}
                  className="input"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                  {t.key}
                </label>
                <input
                  type="text"
                  value={track.key || ""}
                  placeholder="F# Minor, C Maj..."
                  onChange={(e) => onUpdateTrack({ ...track, key: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                {t.demoUrl}
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={track.demoUrl || ""}
                  placeholder="https://... (mp3/audio)"
                  onChange={(e) => onUpdateTrack({ ...track, demoUrl: e.target.value })}
                  className="input"
                />
                {track.demoUrl && (
                  <button
                    onClick={() => onPlayDemo(track)}
                    className="btn btn-secondary"
                    style={{ padding: "0 10px" }}
                  >
                    {isCurrentlyPlaying ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
              {t.notes}
            </label>
            <textarea
              value={track.notes || ""}
              placeholder={t.addNotesPlaceholder}
              onChange={(e) => onUpdateTrack({ ...track, notes: e.target.value })}
              className="textarea"
              style={{ minHeight: 90 }}
            />
          </div>

        </div>
      )}

    </div>
  );
}