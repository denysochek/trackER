import React, { useState, useEffect } from "react";
import { 
  X, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  UploadCloud, 
  DownloadCloud, 
  ShieldCheck, 
  Server, 
  Key, 
  Check, 
  AlertCircle, 
  RefreshCw,
  ExternalLink
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
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSave = (e) => {
    e?.preventDefault();
    CloudStorageService.saveSettings(config);
    setStatusMsg({ type: "success", text: t.cloudSaved || "Налаштування хмари збережено!" });
    setTimeout(() => setStatusMsg(null), 3000);
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
      setStatusMsg({ type: "success", text: t.cloudBackupSuccess || "Акаунт успішно збережено у вашій хмарі!" });
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
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, width: "92%" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(14, 165, 233, 0.15)",
              color: "#0ea5e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Cloud size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {t.cloudSyncTitle || "Хмарне збереження (Custom Cloud)"}
              </h2>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {t.cloudSyncSubtitle || "Підключіть власну хмару або захищений E2E релей"}
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Explain Box */}
        <div style={{
          background: "var(--bg-pill)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-md)",
          padding: "10px 12px",
          marginBottom: 16,
          fontSize: "0.76rem",
          color: "var(--text-secondary)",
          lineHeight: 1.45
        }}>
          💡 <strong>Zero-Knowledge шифрування:</strong> Навіть у хмарі ваші альбоми та проєкти передаються виключно у зашифрованому вигляді через ваш локальний AES-256 ключ. Сервер не має доступу до ваших треків.
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          {/* Custom Server Endpoint */}
          <div>
            <label style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
              <Server size={12} color="var(--accent)" />
              <span>{t.cloudEndpoint || "Адреса вашого сервера / Webhook URL"}:</span>
            </label>
            <input
              type="text"
              value={config.customEndpoint || ""}
              onChange={(e) => setConfig({ ...config, customEndpoint: e.target.value })}
              placeholder="https://ntfy.sh або https://your-domain.com/api/vault"
              className="input"
              style={{ fontSize: "0.82rem" }}
            />
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2, display: "block" }}>
              Залиште порожнім для використання безкоштовного зашифрованого E2E-релею ntfy.sh
            </span>
          </div>

          {/* Optional Auth / Bearer Token */}
          <div>
            <label style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
              <Key size={12} color="var(--accent)" />
              <span>{t.cloudApiKey || "API Token / Bearer Key (опціонально)"}:</span>
            </label>
            <input
              type="password"
              value={config.apiKey || ""}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Bearer secret_token_abc..."
              className="input"
              style={{ fontSize: "0.82rem" }}
            />
          </div>

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

          {/* Cloud Actions Buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              disabled={isSyncing || !currentUser}
              onClick={handlePushNow}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, padding: "8px" }}
              title="Завантажити поточний стан акаунта в хмару"
            >
              <UploadCloud size={14} color="#0ea5e9" />
              <span>{isSyncing ? "..." : (t.pushToCloud || "Вивантажити в хмару")}</span>
            </button>

            <button
              type="button"
              disabled={isSyncing || !currentUser}
              onClick={handlePullNow}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, padding: "8px" }}
              title="Завантажити та відновити акаунт з хмари"
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
              {t.saveSettings || "Зберегти налаштування"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

