import React, { useState } from "react";
import { 
  X, 
  Cloud, 
  UploadCloud, 
  DownloadCloud, 
  ShieldCheck, 
  Server, 
  Key, 
  Check, 
  AlertCircle, 
  HardDrive,
  FolderSync,
  Lock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { CloudStorageService } from "../utils/cloudStorage";
import { playStudioClick } from "../utils/soundEffects";

export function CloudSettingsModal({
  isOpen,
  onClose,
  currentUser,
  t
}) {
  if (!isOpen) return null;

  const [config, setConfig] = useState(() => CloudStorageService.getSettings());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthorizingGoogle, setIsAuthorizingGoogle] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const providers = [
    { id: "google_drive", label: "Google Drive", icon: "📁", badge: "Drive API" },
    { id: "dropbox", label: "Dropbox", icon: "📦", badge: "API v2" },
    { id: "onedrive", label: "OneDrive", icon: "☁️", badge: "MS Graph" },
    { id: "webdav_smb", label: "Self-Hosted / WebDAV / SMB", icon: "🖥️", badge: "Private NAS" },
    { id: "relay", label: "Encrypted Cloud Relay", icon: "⚡", badge: "Zero-Config" }
  ];

  const handleSelectProvider = (provId) => {
    playStudioClick();
    const updated = { ...config, provider: provId };
    setConfig(updated);
    CloudStorageService.saveSettings(updated);
  };

  const handleSave = (e) => {
    e?.preventDefault();
    CloudStorageService.saveSettings(config);
    setStatusMsg({ type: "success", text: t.cloudSaved || "Налаштування хмари збережено!" });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Google Drive Connect
  const handleConnectGoogle = async () => {
    if (!config.googleClientId || !config.googleClientId.trim()) {
      setStatusMsg({ 
        type: "error", 
        text: "Вкажіть ваш Google OAuth Client ID (створюється безкоштовно у Google Cloud Console)" 
      });
      return;
    }

    setIsAuthorizingGoogle(true);
    setStatusMsg(null);
    try {
      const token = await CloudStorageService.requestGoogleAuth(config.googleClientId.trim());
      const updated = { ...config, googleAccessToken: token, lastSyncTime: new Date().toISOString() };
      setConfig(updated);
      CloudStorageService.saveSettings(updated);
      setStatusMsg({ type: "success", text: "Успішно підключено до Google Drive!" });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: `Google Auth помилка: ${err.message}` });
    } finally {
      setIsAuthorizingGoogle(false);
    }
  };

  const handlePushNow = async () => {
    if (!currentUser) {
      setStatusMsg({ type: "error", text: t.loginRequiredCloud || "Увійдіть в акаунт для синхронізації з хмарою" });
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const vaultData = localStorage.getItem(`tracker_vault_${currentUser.username}`);
      await CloudStorageService.pushAccountToCloud(currentUser, vaultData);
      setConfig(CloudStorageService.getSettings());
      setStatusMsg({ type: "success", text: t.cloudBackupSuccess || "Акаунт успішно зашифровано та збережено у вибраній хмарі!" });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: err.message || "Помилка збереження в хмарі" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullNow = async () => {
    if (!currentUser) {
      setStatusMsg({ type: "error", text: t.loginRequiredCloud || "Увійдіть в акаунт для отримання даних" });
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const backup = await CloudStorageService.pullAccountFromCloud(currentUser.username);
      if (!backup) {
        setStatusMsg({ type: "error", text: t.cloudNoDataFound || "У хмарі ще немає збережень для цього акаунта" });
        setIsSyncing(false);
        return;
      }

      // Restore vault and boards
      if (backup.vault) {
        localStorage.setItem(`tracker_vault_${currentUser.username}`, backup.vault);
      }
      if (backup.customBoards) localStorage.setItem("tracker_custom_boards", backup.customBoards);
      if (backup.canvas) localStorage.setItem("tracker_big_board_canvas", backup.canvas);
      if (backup.entries) localStorage.setItem("tracker_big_board_entries", backup.entries);

      setStatusMsg({ type: "success", text: t.cloudRestoredSuccess || "Дані успішно відновлено з хмари! Сторінка зараз оновиться..." });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: err.message || "Помилка завантаження з хмари" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 130 }}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 580, width: "94%", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(14, 165, 233, 0.15)",
              color: "#0ea5e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Cloud size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {t.cloudSyncTitle || "Хмарне збереження (Multi-Cloud)"}
              </h2>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Google Drive, Dropbox, OneDrive, WebDAV/SMB або Private Relay
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Zero-Knowledge Privacy Alert Banner */}
        <div style={{
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "var(--radius-md)",
          padding: "10px 12px",
          marginBottom: 16,
          display: "flex",
          gap: 10,
          alignItems: "flex-start"
        }}>
          <ShieldCheck size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
            <strong style={{ color: "#22c55e" }}>100% Конфіденційність (Zero-Knowledge):</strong> Всі файли шифруються локально ключем <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>AES-256-GCM</span> перед вивантаженням. Ні Google, ні Dropbox, ні сторонній сервер не можуть прочитати ваші треки чи тексти.
          </div>
        </div>

        {/* Provider Selector Tabs */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
            Оберіть хмарне сховище:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 6 }}>
            {providers.map(p => {
              const isSelected = (config.provider || "relay") === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-md)",
                    border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border-medium)",
                    background: isSelected ? "var(--accent-subtle)" : "var(--bg-pill)",
                    color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 3,
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{p.icon}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{p.label}</span>
                  <span style={{ fontSize: "0.62rem", opacity: 0.7 }}>{p.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Form based on Active Provider */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          {/* 1. GOOGLE DRIVE SETTINGS */}
          {config.provider === "google_drive" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: "0.85rem", color: "#38bdf8" }}>
                <span>📁 Google Drive Integration</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.4 }}>
                Файли альбомів зберігаються в прихованій або кореневій папці вашого Google Диска у зашифрованому вигляді <code style={{ color: "var(--accent)" }}>trackER-vault-*.encrypted.json</code>.
              </p>

              <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                Google OAuth 2.0 Client ID:
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={config.googleClientId || ""}
                  onChange={(e) => setConfig({ ...config, googleClientId: e.target.value })}
                  placeholder="напр. 123456789-abc.apps.googleusercontent.com"
                  className="input"
                  style={{ fontSize: "0.8rem", flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isAuthorizingGoogle}
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  {isAuthorizingGoogle ? "..." : (config.googleAccessToken ? "Перепідключити" : "Увійти через Google")}
                </button>
              </div>

              {config.googleAccessToken && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--color-success)" }}>
                  <Check size={13} />
                  <span>Google Drive підключено та готовий до синхронізації!</span>
                </div>
              )}
            </div>
          )}

          {/* 2. DROPBOX SETTINGS */}
          {config.provider === "dropbox" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: "0.85rem", color: "#0284c7" }}>
                <span>📦 Dropbox API v2</span>
              </div>
              <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                Dropbox Generated Access Token:
              </label>
              <input
                type="password"
                value={config.dropboxAccessToken || ""}
                onChange={(e) => setConfig({ ...config, dropboxAccessToken: e.target.value })}
                placeholder="sl.u.AF1..."
                className="input"
                style={{ fontSize: "0.8rem" }}
              />
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Згенеруйте токен у розділі <em>Dropbox App Console -&gt; Permissions (files.content.write)</em>
              </span>
            </div>
          )}

          {/* 3. ONEDRIVE SETTINGS */}
          {config.provider === "onedrive" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: "0.85rem", color: "#0ea5e9" }}>
                <span>☁️ Microsoft OneDrive (Graph API)</span>
              </div>
              <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                OneDrive / Microsoft Graph Access Token:
              </label>
              <input
                type="password"
                value={config.onedriveAccessToken || ""}
                onChange={(e) => setConfig({ ...config, onedriveAccessToken: e.target.value })}
                placeholder="EwBoA8l6BAAU..."
                className="input"
                style={{ fontSize: "0.8rem" }}
              />
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Файли зберігаються у папці <code>/trackER/</code> вашого персонального або робочого OneDrive.
              </span>
            </div>
          )}

          {/* 4. SELF-HOSTED (WebDAV / SMB REST Gateway / Nextcloud) */}
          {config.provider === "webdav_smb" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: "0.85rem", color: "#eab308" }}>
                <span>🖥️ Self-Hosted / WebDAV / Nextcloud / SMB Gateway</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 8 }}>
                Підключіть власний домашній NAS, сервер Nextcloud або SMB REST шлюз для максимальної приватності.
              </p>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                  Server Endpoint (URL):
                </label>
                <input
                  type="text"
                  value={config.selfHostedUrl || ""}
                  onChange={(e) => setConfig({ ...config, selfHostedUrl: e.target.value })}
                  placeholder="https://nas.local/remote.php/dav/files/user/trackER.json"
                  className="input"
                  style={{ fontSize: "0.8rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                  Authorization Header (Basic / Bearer):
                </label>
                <input
                  type="password"
                  value={config.selfHostedAuthHeader || ""}
                  onChange={(e) => setConfig({ ...config, selfHostedAuthHeader: e.target.value })}
                  placeholder="Basic YWRtaW46cGFzc3dvcmQ= або Bearer token"
                  className="input"
                  style={{ fontSize: "0.8rem" }}
                />
              </div>
            </div>
          )}

          {/* 5. DEFAULT RELAY SETTINGS */}
          {config.provider === "relay" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: "0.85rem", color: "#a855f7" }}>
                <span>⚡ Private Encrypted Relay (ntfy.sh E2E)</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.45, margin: 0 }}>
                Швидка передача даних між браузерами без потреби в OAuth ключах. Всі пакети шифруються вашим персональним паролем перед надсиланням у хмару.
              </p>
            </div>
          )}

          {/* Last sync info */}
          {config.lastSyncTime && (
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {t.lastCloudSync || "Остання хмарна копія"}: {new Date(config.lastSyncTime).toLocaleString()}
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div style={{
              background: statusMsg.type === "success" ? "rgba(34, 197, 94, 0.12)" : "var(--color-danger-bg)",
              color: statusMsg.type === "success" ? "var(--color-success)" : "var(--color-danger)",
              border: `1px solid ${statusMsg.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              fontSize: "0.76rem",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              {statusMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Action Buttons: Push & Pull */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              disabled={isSyncing || !currentUser}
              onClick={handlePushNow}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, padding: "8px", fontWeight: 600 }}
              title="Завантажити зашифрований акаунт у вибрану хмару"
            >
              <UploadCloud size={14} color="#0ea5e9" />
              <span>{isSyncing ? "..." : (t.pushToCloud || "Вивантажити в хмару")}</span>
            </button>

            <button
              type="button"
              disabled={isSyncing || !currentUser}
              onClick={handlePullNow}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, padding: "8px", fontWeight: 600 }}
              title="Завантажити та розшифрувати акаунт з хмари"
            >
              <DownloadCloud size={14} color="#10b981" />
              <span>{isSyncing ? "..." : (t.pullFromCloud || "Відновити з хмари")}</span>
            </button>
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 6, paddingTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              {t.close || "Закрити"}
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {t.saveSettings || "Зберегти вибір"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
