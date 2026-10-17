import React, { useState } from "react";
import { X, Download, Upload, CheckCircle2, AlertCircle, Lock, ShieldCheck, Key } from "lucide-react";
import { generateSalt, deriveEncryptionKey, encryptData, decryptData } from "../utils/crypto";

export function ExportImportModal({
  isOpen,
  onClose,
  albums,
  onImportAlbums,
  t
}) {
  if (!isOpen) return null;

  // Export State
  const [shouldEncrypt, setShouldEncrypt] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportConfirmPassword, setExportConfirmPassword] = useState("");
  const [exportError, setExportError] = useState("");

  // Import State
  const [importStatus, setImportStatus] = useState(null);
  const [pendingEncryptedData, setPendingEncryptedData] = useState(null);
  const [decryptInputPassword, setDecryptInputPassword] = useState("");
  const [decryptError, setDecryptError] = useState("");

  const handleDownload = async () => {
    setExportError("");

    if (shouldEncrypt) {
      if (!exportPassword || exportPassword.length < 4) {
        setExportError("Пароль має містити щонайменше 4 символи");
        return;
      }
      if (exportPassword !== exportConfirmPassword) {
        setExportError("Паролі не збігаються");
        return;
      }

      try {
        const salt = generateSalt();
        const cryptoKey = await deriveEncryptionKey(exportPassword, salt);
        const encryptedPayload = await encryptData(albums, cryptoKey);

        const fileBundle = {
          version: 1,
          app: "trackER",
          isEncrypted: true,
          salt: salt,
          payload: encryptedPayload,
          exportedAt: new Date().toISOString()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fileBundle, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `trackER-encrypted-${new Date().toISOString().slice(0, 10)}.tracker`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        setImportStatus({ type: "success", msg: "Зашифрований файл успішно завантажено!" });
        setTimeout(() => onClose(), 1500);
      } catch (err) {
        console.error(err);
        setExportError("Помилка при шифруванні файлу");
      }
      return;
    }

    // Unencrypted export
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(albums, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `trackER-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImportStatus(null);
    setPendingEncryptedData(null);
    setDecryptError("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        // Check if file is encrypted with password
        if (parsed && parsed.isEncrypted && parsed.payload && parsed.salt) {
          setPendingEncryptedData(parsed);
          return;
        }

        // Direct unencrypted album array
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          onImportAlbums(parsed);
          setImportStatus({ type: "success", msg: t.importSuccess });
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setImportStatus({ type: "error", msg: t.importError });
        }
      } catch (err) {
        setImportStatus({ type: "error", msg: t.importError });
      }
    };
    reader.readAsText(file);
  };

  const handleDecryptImport = async (e) => {
    e.preventDefault();
    setDecryptError("");
    if (!decryptInputPassword) {
      setDecryptError("Введіть пароль");
      return;
    }

    try {
      const cryptoKey = await deriveEncryptionKey(decryptInputPassword, pendingEncryptedData.salt);
      const decryptedAlbums = await decryptData(pendingEncryptedData.payload, cryptoKey);

      if (Array.isArray(decryptedAlbums) && decryptedAlbums.length > 0) {
        onImportAlbums(decryptedAlbums);
        setPendingEncryptedData(null);
        setImportStatus({ type: "success", msg: "Файл успішно розшифровано та імпортовано!" });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setDecryptError("Невірний пароль або пошкоджений файл");
      }
    } catch (err) {
      console.error(err);
      setDecryptError("Невірний пароль розшифрування");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {t.exportImport}
          </h2>
          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {importStatus && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            marginBottom: 16,
            background: importStatus.type === "success" ? "rgba(52, 199, 89, 0.15)" : "rgba(255, 59, 48, 0.15)",
            color: importStatus.type === "success" ? "var(--color-success)" : "var(--color-danger)",
            fontSize: "0.85rem"
          }}>
            {importStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{importStatus.msg}</span>
          </div>
        )}

        {/* ========================================================
            IF ENCRYPTED FILE WAS UPLOADED: PROMPT FOR PASSWORD
            ======================================================== */}
        {pendingEncryptedData ? (
          <div style={{
            background: "var(--bg-card-secondary)",
            border: "1.5px solid var(--accent)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            marginBottom: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Lock size={20} color="var(--accent)" />
              <strong style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
                Файл захищено шифруванням AES-256
              </strong>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 14px" }}>
              Цей файл експортовано із захисним паролем. Введіть пароль для відкриття на цьому комп'ютері:
            </p>

            <form onSubmit={handleDecryptImport} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="password"
                value={decryptInputPassword}
                onChange={(e) => setDecryptInputPassword(e.target.value)}
                placeholder="Введіть пароль розшифрування..."
                className="input"
                autoFocus
                style={{ padding: "10px 14px" }}
              />

              {decryptError && (
                <span style={{ fontSize: "0.8rem", color: "var(--color-danger)" }}>
                  {decryptError}
                </span>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <ShieldCheck size={14} />
                  <span>Розшифрувати та імпортувати</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingEncryptedData(null)}
                  className="btn btn-secondary"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* 1. EXPORT SECTION */}
            <div style={{
              background: "var(--bg-card-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "18px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Download size={18} color="var(--accent)" />
                <strong style={{ fontSize: "0.98rem", color: "var(--text-primary)" }}>
                  {t.exportData}
                </strong>
              </div>
              
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 14px" }}>
                Збережіть файл проєкту на комп'ютер, щоб відкрити його на іншому пристрої або створити резервну копію.
              </p>

              {/* Checkbox: Encrypt with Password */}
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                cursor: "pointer",
                marginBottom: shouldEncrypt ? 12 : 14
              }}>
                <input
                  type="checkbox"
                  checked={shouldEncrypt}
                  onChange={(e) => setShouldEncrypt(e.target.checked)}
                  style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                />
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Lock size={13} color="var(--accent)" />
                  {t.exportEncrypted || "Зашифрувати файл паролем (AES-256)"}
                </span>
              </label>

              {/* Password inputs if encryption checked */}
              {shouldEncrypt && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  <input
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="Пароль для захисту файлу..."
                    className="input"
                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  />
                  <input
                    type="password"
                    value={exportConfirmPassword}
                    onChange={(e) => setExportConfirmPassword(e.target.value)}
                    placeholder="Підтвердіть пароль..."
                    className="input"
                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  />
                  {exportError && (
                    <span style={{ fontSize: "0.78rem", color: "var(--color-danger)" }}>
                      {exportError}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Download size={14} />
                <span>{shouldEncrypt ? "Завантажити зашифрований файл" : t.downloadBackup}</span>
              </button>
            </div>

            {/* 2. IMPORT SECTION */}
            <div style={{
              background: "var(--bg-card-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "18px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Upload size={18} color="var(--accent)" />
                <strong style={{ fontSize: "0.98rem", color: "var(--text-primary)" }}>
                  {t.importData}
                </strong>
              </div>

              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 14px" }}>
                Завантажте збережений файл (.json або .tracker) з цього чи іншого комп'ютера.
              </p>

              <label className="btn btn-secondary" style={{
                width: "100%",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative"
              }}>
                <Upload size={14} />
                <span>{t.selectFile} (.json / .tracker)</span>
                <input
                  type="file"
                  accept=".json,.tracker"
                  onChange={handleFileChange}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%"
                  }}
                />
              </label>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
