import React, { useState } from "react";
import { X, Share2, Copy, Check, MessageSquare, Link, Sparkles, Send, Download } from "lucide-react";
import { calculateAlbumProgress, calculateTrackScore, getTrackMaxScore, isTrackFinished } from "../constants";

export function ShareAlbumModal({
  isOpen,
  onClose,
  album,
  t
}) {
  if (!isOpen || !album) return null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const tracks = album.tracks || [];
  const progressPercent = calculateAlbumProgress(tracks);
  const finishedCount = tracks.filter(tr => isTrackFinished(tr)).length;

  // Generate self-contained URL share link using base64 encoded album payload
  const generateShareUrl = () => {
    try {
      const sanitizedAlbum = {
        title: album.title,
        artist: album.artist,
        genre: album.genre,
        targetDate: album.targetDate,
        concept: album.concept,
        coverUrl: album.coverUrl,
        tracks: album.tracks
      };
      const json = JSON.stringify(sanitizedAlbum);
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}#share=${encoded}`;
    } catch (e) {
      console.error(e);
      return window.location.href;
    }
  };

  const shareUrl = generateShareUrl();

  // Generate clean text summary with emoji progress bar
  const generateTextSummary = () => {
    const barLength = 10;
    const filledBlocks = Math.round((progressPercent / 100) * barLength);
    const emptyBlocks = barLength - filledBlocks;
    const bar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

    let text = `📀 ${album.title.toUpperCase()} — ${album.artist || "trackER"}\\n`;
    text += `📊 Прогрес: ${progressPercent}% [${bar}] (${finishedCount}/${tracks.length} треків готово)\\n`;
    if (album.genre) text += `🎸 Жанр: ${album.genre}\\n`;
    if (album.targetDate) text += `🎯 Реліз: ${album.targetDate}\\n`;
    text += `\\n🎚️ ТРЕКЛІСТ:\\n`;

    tracks.forEach((tr, idx) => {
      const score = calculateTrackScore(tr);
      const max = getTrackMaxScore(tr);
      const isFin = score >= max;
      const statusIcon = isFin ? "✅" : "⏳";
      text += `${idx + 1}. ${tr.title} — [${score}/${max}] ${statusIcon}\\n`;
    });

    text += `\\n⚡ Створено в trackER: ${window.location.origin + window.location.pathname}`;
    return text;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateTextSummary());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${album.title} — trackER Album`,
          text: `Прогрес альбому ${album.title}: ${progressPercent}%`,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--accent-subtle)",
              border: "1px solid rgba(var(--accent-rgb), 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Share2 size={18} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {t.shareAlbumTitle || "Поділитися альбомом"}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {album.title} • {progressPercent}%
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={17} />
          </button>
        </div>

        {/* Option 1: Direct Link */}
        <div style={{
          background: "var(--bg-pill)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
            <Link size={14} color="var(--accent)" />
            <span>{t.shareLink || "Пряме посилання для відкриття"}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="input"
              style={{ fontSize: "0.75rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}
            />
            <button
              onClick={handleCopyLink}
              className="btn btn-primary"
              style={{ flexShrink: 0, padding: "8px 14px", fontSize: "0.78rem" }}
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? (t.linkCopied || "Скопійовано!") : (t.copyShareLink || "Копіювати")}</span>
            </button>
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>
            {t.shareLinkDesc || "Посилання містить увесь альбом і треки. Отримувач зможе відкрити та імпортувати його без реєстрації."}
          </div>
        </div>

        {/* Option 2: Messenger Progress Report */}
        <div style={{
          background: "var(--bg-card-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
              <MessageSquare size={14} color="#38bdf8" />
              <span>{t.shareMessenger || "Текстовий звіт для Telegram / Discord"}</span>
            </div>

            <button
              onClick={handleCopySummary}
              className="btn btn-secondary btn-sm"
              style={{ padding: "4px 10px", fontSize: "0.74rem" }}
            >
              {copiedSummary ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
              <span>{copiedSummary ? (t.summaryCopied || "Скопійовано!") : (t.copyMessengerSummary || "Скопіювати текст")}</span>
            </button>
          </div>

          {/* Preview box */}
          <pre style={{
            margin: 0,
            padding: "10px",
            background: "var(--bg-main)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.72rem",
            color: "var(--text-secondary)",
            maxHeight: 120,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            lineHeight: 1.45
          }}>
            {generateTextSummary()}
          </pre>
        </div>

        {/* Option 3: System Share Dialog if available */}
        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={handleNativeShare}
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "9px" }}
          >
            <Send size={14} />
            <span>{t.nativeShare || "Надіслати через систему (AirDrop, Telegram...)"}</span>
          </button>
        )}

      </div>
    </div>
  );
}
