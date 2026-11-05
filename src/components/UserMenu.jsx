import React, { useState, useRef } from "react";
import { 
  User, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  ChevronDown, 
  Crown, 
  DownloadCloud, 
  UploadCloud, 
  Volume2, 
  Sliders, 
  Check, 
  Loader2,
  Cloud
} from "lucide-react";
import { exportAccountAsZip, importAccountFromZip } from "../utils/zipArchive";

export function UserMenu({
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenCloudSettings,
  showMiniPlayer,
  onToggleMiniPlayer,
  onAccountRestored,
  t
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!currentUser) {
    return (
      <button
        onClick={onOpenAuth}
        className="btn btn-primary btn-sm"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, padding: "5px 12px" }}
      >
        <Lock size={13} />
        <span>{t.signIn}</span>
      </button>
    );
  }

  const initial = currentUser.artistName ? currentUser.artistName.charAt(0).toUpperCase() : "U";
  const isAdmin = currentUser.isAdmin || (currentUser.username && currentUser.username.toLowerCase() === "dionisii");

  const handleExportAccount = async () => {
    setIsExporting(true);
    setStatusMsg(t.exportingZip || "Формування ZIP архіву...");
    try {
      const filename = await exportAccountAsZip(currentUser);
      setStatusMsg(t.exportZipSuccess || "Акаунт успішно експортовано!");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err) {
      console.error(err);
      setStatusMsg(t.exportZipError || "Помилка експорту акаунта");
      setTimeout(() => setStatusMsg(""), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMsg(t.importingZip || "Розпакування архіву...");
    try {
      const result = await importAccountFromZip(file);
      setStatusMsg(t.importZipSuccess || "Акаунт успішно відновлено!");
      setTimeout(() => {
        setStatusMsg("");
        setIsOpen(false);
        if (onAccountRestored) {
          onAccountRestored();
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatusMsg(t.importZipError || "Помилка імпорту архіву");
      setTimeout(() => setStatusMsg(""), 3000);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Hidden file input for Account ZIP import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleFileImport}
        style={{ display: "none" }}
      />

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 10px",
          height: 32,
          boxSizing: "border-box",
          borderRadius: "var(--radius-full)"
        }}
      >
        <div style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isAdmin ? "linear-gradient(135deg, #eab308, #f59e0b)" : "var(--accent)",
          color: "#fff",
          fontSize: "0.75rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {isAdmin ? <Crown size={12} color="#fff" /> : initial}
        </div>
        <span style={{ fontWeight: 600, fontSize: "0.8rem", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentUser.artistName || currentUser.username}
        </span>
        {isAdmin && (
          <span style={{
            fontSize: "0.62rem",
            fontWeight: 800,
            background: "rgba(234, 179, 8, 0.2)",
            color: "#eab308",
            padding: "1px 5px",
            borderRadius: 4
          }}>
            ADMIN
          </span>
        )}
        <ChevronDown size={12} color="var(--text-muted)" />
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: 260,
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-modal)",
          padding: "12px",
          zIndex: 90
        }}>
          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: isAdmin ? "rgba(234, 179, 8, 0.15)" : "var(--accent-subtle)",
              border: isAdmin ? "1.5px solid #eab308" : "1px solid rgba(var(--accent-rgb), 0.3)",
              color: isAdmin ? "#eab308" : "var(--accent)",
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {isAdmin ? <Crown size={18} /> : initial}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{currentUser.artistName}</span>
                {isAdmin && (
                  <span style={{ fontSize: "0.65rem", background: "#eab308", color: "#000", fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                @{currentUser.username}
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {t.accountSettings || "Налаштування акаунта"}
            </div>

            {/* Mini Player Toggle in Account Settings */}
            <label style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              background: "var(--bg-pill)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              marginBottom: 8
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                <Volume2 size={13} color="var(--accent)" />
                <span>{t.enableMiniPlayer || "Аудіопрогравач треків"}</span>
              </div>
              <input
                type="checkbox"
                checked={!!showMiniPlayer}
                onChange={(e) => onToggleMiniPlayer && onToggleMiniPlayer(e.target.checked)}
                style={{ accentColor: "var(--accent)", cursor: "pointer" }}
              />
            </label>
          </div>

          {/* 1. Account Export & Import Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {/* Custom Cloud Settings Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenCloudSettings) onOpenCloudSettings();
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.78rem", padding: "6px 10px", borderColor: "rgba(14, 165, 233, 0.4)" }}
              title={t.cloudSyncTitle || "Хмарне збереження (Custom Cloud)"}
            >
              <Cloud size={13} color="#0ea5e9" />
              <span>{t.cloudSyncTitle || "Хмарне збереження"}</span>
            </button>

            {/* Export Account ZIP */}
            <button
              onClick={handleExportAccount}
              disabled={isExporting}
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.78rem", padding: "6px 10px" }}
              title={t.exportAccountDesc || "Вивантажити всі дані акаунта (роботи, дошки, замітки, налаштування) в єдиний ZIP-архів"}
            >
              {isExporting ? <Loader2 size={13} className="spin" /> : <DownloadCloud size={13} color="var(--accent)" />}
              <span>{isExporting ? (t.exportingZip || "Архівування...") : (t.exportAccountBtn || "Експортувати акаунт (ZIP)")}</span>
            </button>

            {/* Import Account ZIP */}
            <button
              onClick={handleTriggerImport}
              disabled={isImporting}
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.78rem", padding: "6px 10px" }}
              title={t.importAccountDesc || "Завантажити архів акаунта для повного відновлення або перенесення на інший пристрій"}
            >
              {isImporting ? <Loader2 size={13} className="spin" /> : <UploadCloud size={13} color="var(--accent)" />}
              <span>{isImporting ? (t.importingZip || "Розпакування...") : (t.importAccountBtn || "Імпортувати акаунт (ZIP)")}</span>
            </button>
          </div>

          {/* Status Message Alert */}
          {statusMsg && (
            <div style={{
              background: "rgba(var(--accent-rgb), 0.1)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 8px",
              fontSize: "0.72rem",
              color: "var(--accent)",
              marginBottom: 10,
              textAlign: "center"
            }}>
              {statusMsg}
            </div>
          )}

          {/* Encryption status */}
          <div style={{
            background: "var(--bg-pill)",
            borderRadius: "var(--radius-md)",
            padding: "6px 10px",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.72rem",
            color: "var(--color-success)"
          }}>
            <ShieldCheck size={14} />
            <span>{t.encryptionActive}</span>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "flex-start", color: "var(--color-danger)" }}
          >
            <LogOut size={13} />
            <span>{t.signOut}</span>
          </button>
        </div>
      )}
    </div>
  );
}
