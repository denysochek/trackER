const fs = require("fs");

const shareModalContent = `import React, { useState } from "react";
import { X, Send, AlertCircle, CheckCircle2, User, Link, Copy, Check, MessageSquare } from "lucide-react";
import { calculateAlbumProgress, calculateTrackScore, getTrackMaxScore, isTrackFinished } from "../constants";

export function ShareAlbumModal({
  isOpen,
  onClose,
  album,
  currentUser,
  t
}) {
  if (!isOpen || !album) return null;

  const [targetUsername, setTargetUsername] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const tracks = album.tracks || [];
  const progressPercent = calculateAlbumProgress(tracks);
  const finishedCount = tracks.filter(tr => isTrackFinished(tr)).length;

  const handleSendToUser = (e) => {
    e.preventDefault();
    setSendSuccess("");
    setSendError("");

    const target = targetUsername.trim().toLowerCase();
    if (!target) {
      setSendError(t.fillUsernameToShare || "Введіть нікнейм користувача");
      return;
    }

    if (currentUser && currentUser.username && currentUser.username.toLowerCase() === target) {
      setSendError(t.cannotShareWithSelf || "Ви не можете надіслати альбом самому собі");
      return;
    }

    setIsSending(true);

    try {
      const usersRegistry = JSON.parse(localStorage.getItem("tracker_users_registry") || "{}");
      const userExists = usersRegistry[target];

      if (!userExists && target !== "guest") {
        setSendError(t.userNotFoundShare ? t.userNotFoundShare.replace("{user}", targetUsername) : ("Користувача @" + targetUsername + " не знайдено"));
        setIsSending(false);
        return;
      }

      const albumPayload = {
        id: "shared-" + Date.now(),
        title: album.title,
        artist: album.artist,
        genre: album.genre,
        targetDate: album.targetDate,
        concept: album.concept,
        coverUrl: album.coverUrl,
        tracks: album.tracks,
        sharedBy: currentUser ? currentUser.username : "guest",
        sharedAt: new Date().toISOString()
      };

      const inboxKey = "tracker_inbox_" + target;
      const currentInbox = JSON.parse(localStorage.getItem(inboxKey) || "[]");
      
      const alreadyHas = currentInbox.some(a => a.title === album.title && a.sharedBy === albumPayload.sharedBy);
      if (!alreadyHas) {
        currentInbox.unshift(albumPayload);
        localStorage.setItem(inboxKey, JSON.stringify(currentInbox));
      }

      setSendSuccess(t.albumSharedSuccess ? t.albumSharedSuccess.replace("{user}", targetUsername) : ("Альбом надіслано користувачу @" + targetUsername + "!"));
      setTargetUsername("");
    } catch (err) {
      console.error(err);
      setSendError("Помилка надсилання альбому.");
    } finally {
      setIsSending(false);
    }
  };

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
      return baseUrl + "#share=" + encoded;
    } catch (e) {
      return window.location.href;
    }
  };

  const shareUrl = generateShareUrl();

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

    let text = "📀 " + album.title.toUpperCase() + " — " + (album.artist || "trackER") + "\\n";
    text += "📊 " + progLabel + ": " + progressPercent + "% [" + bar + "] (" + finishedCount + "/" + tracks.length + " " + readyLabel + ")\\n";
    if (album.genre) text += "🎸 " + genreLabel + ": " + album.genre + "\\n";
    if (album.targetDate) text += "🎯 " + releaseLabel + ": " + album.targetDate + "\\n";
    text += "\\n🎚️ " + tracklistLabel + ":\\n";

    tracks.forEach((tr, idx) => {
      const score = calculateTrackScore(tr);
      const max = getTrackMaxScore(tr);
      const isFin = score >= max;
      const statusIcon = isFin ? "✅" : "⏳";
      text += (idx + 1) + ". " + tr.title + " — [" + score + "/" + max + "] " + statusIcon + "\\n";
    });

    text += "\\n⚡ " + createdLabel + ": " + window.location.origin + window.location.pathname;
    return text;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        
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
              <Send size={18} color="var(--accent)" />
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

        {/* PRIMARY MODE: Share directly to username */}
        <div style={{
          background: "var(--bg-pill)",
          border: "1.5px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          padding: "16px",
          marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
            <User size={15} color="var(--accent)" />
            <span>{t.shareDirectToUserTitle || "Надіслати в акаунт користувача"}</span>
          </div>
          <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.4 }}>
            {t.shareDirectToUserDesc || "Введіть нікнейм іншого користувача. Альбом миттєво з'явиться в його акаунті."}
          </p>

          <form onSubmit={handleSendToUser} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem" }}>@</span>
                <input
                  type="text"
                  required
                  value={targetUsername}
                  onChange={(e) => { setTargetUsername(e.target.value); setSendError(""); setSendSuccess(""); }}
                  placeholder="dionisii"
                  className="input"
                  style={{ paddingLeft: 24, fontSize: "0.85rem" }}
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="btn btn-primary"
                style={{ flexShrink: 0, padding: "8px 16px" }}
              >
                <Send size={14} />
                <span>{isSending ? "..." : (t.sendToUserBtn || "Надіслати")}</span>
              </button>
            </div>

            {sendSuccess && (
              <div style={{
                background: "rgba(34, 197, 94, 0.1)",
                color: "var(--color-success)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 10px",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: 7
              }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{sendSuccess}</span>
              </div>
            )}

            {sendError && (
              <div style={{
                background: "var(--color-danger-bg)",
                color: "var(--color-danger)",
                border: "1px solid rgba(255, 59, 48, 0.25)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 10px",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: 7
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{sendError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Fallback Option: Copy Direct Link or Messenger Summary */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: "center" }}
          >
            {copiedLink ? <Check size={13} color="var(--color-success)" /> : <Link size={13} />}
            <span>{copiedLink ? (t.linkCopied || "Скопійовано!") : (t.copyShareLink || "Скопіювати лінк")}</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(generateTextSummary());
              setCopiedSummary(true);
              setTimeout(() => setCopiedSummary(false), 2000);
            }}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: "center" }}
          >
            {copiedSummary ? <Check size={13} color="var(--color-success)" /> : <MessageSquare size={13} />}
            <span>{copiedSummary ? (t.summaryCopied || "Скопійовано!") : (t.copyMessengerSummary || "Звіт месенджера")}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync("src/components/ShareAlbumModal.jsx", shareModalContent);
console.log("Written successfully!");
