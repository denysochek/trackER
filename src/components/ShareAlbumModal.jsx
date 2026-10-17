import React, { useState } from "react";
import { X, Share2, Copy, Check, MessageSquare, Link, Sparkles, Send, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { calculateAlbumProgress, calculateTrackScore, getTrackMaxScore, isTrackFinished } from "../constants";

export function ShareAlbumModal({
  isOpen,
  onClose,
  album,
  currentUser,
  t
}) {
  if (!isOpen || !album) return null;

  const [activeTab, setActiveTab] = useState("directUser"); // "directUser" | "link" | "summary"
  const [targetUsername, setTargetUsername] = useState("");
  const [shareStatus, setShareStatus] = useState(null); // { type: "success" | "error", message: string }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const tracks = album.tracks || [];
  const progressPercent = calculateAlbumProgress(tracks);
  const finishedCount = tracks.filter(tr => isTrackFinished(tr)).length;

  // Direct User-to-User Sharing (Instant Cloud Relay + Local Inbox delivery)
  const handleShareToUser = async (e) => {
    e.preventDefault();
    setShareStatus(null);
    const trimmedTarget = targetUsername.trim().toLowerCase();

    if (!trimmedTarget) {
      setShareStatus({ type: "error", message: t.fillAllFields || "Введіть нікнейм користувача." });
      return;
    }

    if (currentUser && currentUser.username && currentUser.username.toLowerCase() === trimmedTarget) {
      setShareStatus({ type: "error", message: t.cannotShareToSelf || "Ви не можете поділитися альбомом із самим собою." });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare shared album payload
      const sharedItem = {
        id: `shared-${album.id}-${Date.now()}`,
        originalAlbumId: album.id,
        title: album.title,
        artist: album.artist,
        genre: album.genre,
        targetDate: album.targetDate,
        concept: album.concept,
        coverUrl: album.coverUrl,
        tracks: album.tracks,
        sharedBy: currentUser ? (currentUser.artistName || currentUser.username) : "Anonymous Producer",
        sharedByUsername: currentUser ? currentUser.username : "guest",
        sharedAt: new Date().toISOString()
      };

      // 2. Put into local inbox (if on same device or same browser)
      const inboxKey = `tracker_shared_inbox_${trimmedTarget}`;
      const currentInbox = JSON.parse(localStorage.getItem(inboxKey) || "[]");
      const alreadyExists = currentInbox.some(
        item => item.originalAlbumId === album.id && item.sharedByUsername === sharedItem.sharedByUsername
      );

      if (!alreadyExists) {
        currentInbox.unshift(sharedItem);
        localStorage.setItem(inboxKey, JSON.stringify(currentInbox));
        window.dispatchEvent(new Event("storage"));
      }

      // 3. Put into Global Cloud Relay via ntfy.sh (works across different devices, phones, PCs!)
      const topic = `trackER_inbox_${trimmedTarget}`;
      try {
        await fetch(`https://ntfy.sh/${topic}`, {
          method: "POST",
          headers: {
            "Title": `trackER: New Album from @${sharedItem.sharedByUsername}`,
            "Tags": "cd,package"
          },
          body: JSON.stringify(sharedItem)
        });
      } catch (cloudErr) {
        console.warn("Cloud relay fetch note:", cloudErr);
      }

      setShareStatus({
        type: "success",
        message: `${t.shareSuccessMsg || "Альбом успішно надіслано!"} @${targetUsername.trim()}`
      });
      setTargetUsername("");
    } catch (err) {
      console.error(err);
      setShareStatus({ type: "error", message: "Помилка передачі альбому." });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    const isEn = t.language === "Language";
    const barLength = 10;
    const filledBlocks = Math.round((progressPercent / 100) * barLength);
    const emptyBlocks = barLength - filledBlocks;
    const bar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

    const progLabel = isEn ? "Progress" : "Прогрес";
    const readyLabel = isEn ? "tracks ready" : "треків готово";
    const genreLabel = isEn ? "Genre" : "Жанр";
    const releaseLabel = isEn ? "Release" : "Реліз";
    const tracklistLabel = isEn ? "TRACKLIST" : "ТРЕКЛІСТ";
    const createdLabel = isEn ? "Created with trackER" : "Створено в trackER";

    let text = `📀 ${album.title.toUpperCase()} — ${album.artist || "trackER"}\\n`;
    text += `📊 ${progLabel}: ${progressPercent}% [${bar}] (${finishedCount}/${tracks.length} ${readyLabel})\\n`;
    if (album.genre) text += `🎸 ${genreLabel}: ${album.genre}\\n`;
    if (album.targetDate) text += `🎯 ${releaseLabel}: ${album.targetDate}\\n`;
    text += `\\n🎚️ ${tracklistLabel}:\\n`;

    tracks.forEach((tr, idx) => {
      const score = calculateTrackScore(tr);
      const max = getTrackMaxScore(tr);
      const isFin = score >= max;
      const statusIcon = isFin ? "✅" : "⏳";
      text += `${idx + 1}. ${tr.title} — [${score}/${max}] ${statusIcon}\\n`;
    });

    text += `\\n⚡ ${createdLabel}: ${window.location.origin + window.location.pathname}`;
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--accent-subtle)",
              border: "1px solid rgba(var(--accent-rgb), 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Share2 size={20} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.18rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {t.shareAlbumTitle || "Поділитися альбомом"}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                {album.title} • {progressPercent}% {t.completedTracks || "Готово"}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={17} />
          </button>
        </div>

        {/* Tab Controls: Direct User Send vs Link vs Summary */}
        <div className="segmented-control" style={{ width: "100%", marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => { setActiveTab("directUser"); setShareStatus(null); }}
            className={`segmented-control-btn ${activeTab === "directUser" ? "active" : ""}`}
            style={{ flex: 1, justifyContent: "center", padding: "7px 10px", fontSize: "0.82rem", fontWeight: 600 }}
          >
            <UserCheck size={14} />
            <span>{t.shareWithUser || "В акаунт за ніком"}</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("link"); setShareStatus(null); }}
            className={`segmented-control-btn ${activeTab === "link" ? "active" : ""}`}
            style={{ flex: 1, justifyContent: "center", padding: "7px 10px", fontSize: "0.82rem", fontWeight: 600 }}
          >
            <Link size={14} />
            <span>{t.shareLink || "Посилання"}</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("summary"); setShareStatus(null); }}
            className={`segmented-control-btn ${activeTab === "summary" ? "active" : ""}`}
            style={{ flex: 1, justifyContent: "center", padding: "7px 10px", fontSize: "0.82rem", fontWeight: 600 }}
          >
            <MessageSquare size={14} />
            <span>{t.shareMessenger || "Звіт"}</span>
          </button>
        </div>

        {/* TAB 1: USER-TO-USER SHARING (THE EXACT REQUESTED FEATURE) */}
        {activeTab === "directUser" && (
          <div>
            <div style={{
              background: "var(--bg-card-secondary)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              marginBottom: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Send size={15} color="var(--accent)" />
                <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                  {t.shareWithUser || "Надіслати прямо в акаунт"}
                </strong>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.45, margin: "0 0 14px" }}>
                {t.shareWithUserDesc || "Введіть нікнейм користувача (наприклад dionisii), і цей альбом автоматично з’явиться у його особистій студії."}
              </p>

              <form onSubmit={handleShareToUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    {t.targetUsername || "Нікнейм отримувача"} *
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.9rem" }}>
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      placeholder={t.targetUsernamePlaceholder || "напр. dionisii"}
                      className="input"
                      style={{ paddingLeft: 28, fontSize: "0.88rem", fontWeight: 600 }}
                    />
                  </div>
                </div>

                {shareStatus && (
                  <div style={{
                    background: shareStatus.type === "success" ? "rgba(34, 197, 94, 0.12)" : "var(--color-danger-bg)",
                    color: shareStatus.type === "success" ? "var(--color-success)" : "var(--color-danger)",
                    border: `1px solid ${shareStatus.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 59, 48, 0.25)"}`,
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    {shareStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{shareStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: 4, fontWeight: 700 }}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? (t.sendingAlbum || "Відправка...") : (t.sendToUserBtn || "Надіслати в акаунт")}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: LINK SHARING */}
        {activeTab === "link" && (
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
        )}

        {/* TAB 3: MESSENGER REPORT */}
        {activeTab === "summary" && (
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

            <pre style={{
              margin: 0,
              padding: "10px",
              background: "var(--bg-main)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.72rem",
              color: "var(--text-secondary)",
              maxHeight: 140,
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              lineHeight: 1.45
            }}>
              {generateTextSummary()}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
