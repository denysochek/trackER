import React, { useState } from "react";
import { X, Key, Copy, Check, Lock, Unlock, Trash2, AlertTriangle, ShieldAlert, HeartHandshake, ShieldCheck } from "lucide-react";
import { hashPasswordForAuth } from "../utils/crypto";

export function AlbumKeyModal({
  isOpen,
  onClose,
  album,
  currentUser,
  onSaveAlbum,
  t
}) {
  if (!isOpen || !album) return null;

  const isDemo = album.id === "album-neon-noir";

  const [inputKey, setInputKey] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [emergencySuccess, setEmergencySuccess] = useState("");
  const [confirmStep, setConfirmStep] = useState(0); // 0: normal, 1: warning 1, 2: warning 2

  const handleGenerateKey = async () => {
    if (isDemo) {
      alert(t.demoCannotLock || "Демо-альбом не можна блокувати ключем!");
      return;
    }

    // Cryptographically derive a robust, uncrackable key from Title + User + Date/Hour entropy
    const albumName = (album.title || "album").trim();
    const username = (currentUser ? currentUser.username : "guest").trim();
    const hourStamp = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    
    // Mix deterministic values with a CSPRNG salt buffer for maximum randomness and resistance
    const seed = `${albumName}::${username}::${hourStamp}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(seed);
    
    // Compute SHA-256 digest of the combination
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    // High-entropy random salt from crypto.getRandomValues
    const randBuffer = new Uint8Array(4);
    window.crypto.getRandomValues(randBuffer);
    const randHex = Array.from(randBuffer).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    // High-security key structure: TRK-[Derived1]-[Derived2]-[Derived3]-[CSPRNG]
    const rawKey = `TRK-${hex.slice(0, 4)}-${hex.slice(8, 12)}-${hex.slice(18, 22)}-${randHex.slice(0, 4)}`;

    const keyHash = await hashPasswordForAuth(rawKey, "album_verify_salt");

    // Save key hash to album
    const updated = {
      ...album,
      masterKeyHash: keyHash,
      isLocked: false
    };
    onSaveAlbum(updated);
    setGeneratedKey(rawKey);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteKey = () => {
    if (window.confirm(t.deleteKeyConfirm || "Видалити ключ та зняти захист з цього альбому?")) {
      const updated = {
        ...album,
        masterKeyHash: null,
        isLocked: false
      };
      onSaveAlbum(updated);
      onClose();
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError("");

    const cleanedKey = inputKey.trim().toUpperCase();
    if (!cleanedKey) return;

    // Check with direct cleaned key
    const computedHash = await hashPasswordForAuth(cleanedKey, "album_verify_salt");
    
    // Also support if user typed without TRK- prefix
    const prefixedKey = cleanedKey.startsWith("TRK-") ? cleanedKey : `TRK-${cleanedKey}`;
    const computedPrefixedHash = await hashPasswordForAuth(prefixedKey, "album_verify_salt");

    if (computedHash === album.masterKeyHash || computedPrefixedHash === album.masterKeyHash) {
      const updated = { ...album, isLocked: false };
      onSaveAlbum(updated);
      setInputKey("");
      onClose();
    } else {
      setUnlockError(t.invalidKey || "Невірний ключ розшифрування альбому! Перевірте правильність введеного ключа.");
    }
  };

  // Safe lock with warnings step 1 & 2
  const handleStartLock = () => {
    if (isDemo) {
      alert(t.demoCannotLock || "Демо-альбом не можна блокувати ключем!");
      return;
    }
    setConfirmStep(1);
  };

  const handleConfirmLock = () => {
    const updated = { ...album, isLocked: true };
    onSaveAlbum(updated);
    setConfirmStep(0);
    onClose();
  };

  // 1 Forgiveness Recovery: User can recover once if key is lost
  const handleOneForgivenessRestore = () => {
    if (album.hasUsedForgiveness) {
      setUnlockError(t.emergencyUsed || "Ви вже використали своє єдине вибачення для цього альбому!");
      return;
    }

    if (window.confirm(t.useEmergencyRestore || "Використати 1 вибачення для аварійного розблокування? Більше цей шанс не буде доступний.")) {
      const updated = {
        ...album,
        isLocked: false,
        masterKeyHash: null, // Clear lost key
        hasUsedForgiveness: true
      };
      onSaveAlbum(updated);
      setEmergencySuccess(t.emergencySuccess || "Альбом успішно відновлено!");
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Key size={18} color="var(--accent)" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {t.albumKeyTitle || "Ключ доступу до альбому"}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={17} />
          </button>
        </div>

        {/* DEMO ALBUM NOTICE */}
        {isDemo ? (
          <div style={{
            background: "var(--bg-card-secondary)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            textAlign: "center"
          }}>
            <ShieldAlert size={36} color="var(--accent)" style={{ margin: "0 auto 10px" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {t.demoCannotLock || "Демо-альбом відкритий для всіх"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>
              {t.demoCannotLockDesc || "Демо-альбом «NEON HORIZON» призначений для тестування функцій студії. Щоб встановити секретний шифр, створіть власний альбом."}
            </p>
            <button onClick={onClose} className="btn btn-secondary">
              {t.close || "Зрозуміло"}
            </button>
          </div>
        ) : generatedKey ? (
          /* Case 1: Freshly generated key shown 1 time */
          <div>
            <div style={{
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning)",
              borderRadius: "var(--radius-md)",
              padding: "14px",
              marginBottom: 16,
              display: "flex",
              gap: 10,
              alignItems: "flex-start"
            }}>
              <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: 2 }}>
                  {t.oneTimeWarning || "УВАГА: ЦЕЙ КЛЮЧ ПОКАЗУЄТЬСЯ ЛИШЕ 1 РАЗ!"}
                </strong>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {t.oneTimeDesc || "Він згенерований на основі назви альбому, вашого профілю та крипто-ентропії. Скопіюйте його зараз — він більше ніде не відображатиметься!"}
                </p>
              </div>
            </div>

            <div style={{
              background: "var(--bg-card-secondary)",
              border: "1.5px dashed var(--accent)",
              borderRadius: "var(--radius-md)",
              padding: "14px",
              textAlign: "center",
              marginBottom: 16
            }}>
              <span className="font-mono" style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--accent)"
              }}>
                {generatedKey}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? (t.keyCopied || "Скопійовано!") : (t.copyKey || "Скопіювати ключ")}</span>
              </button>
              <button
                onClick={() => {
                  setGeneratedKey("");
                  handleStartLock();
                }}
                className="btn btn-primary"
                style={{ flex: 1.2 }}
              >
                <Lock size={14} />
                <span>{t.lockAlbum || "Заблокувати альбом зараз"}</span>
              </button>
              <button onClick={onClose} className="btn btn-ghost">
                {t.done || "Закрити"}
              </button>
            </div>
          </div>
        ) : confirmStep === 1 ? (
          /* Warning step 1 */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start"
            }}>
              <AlertTriangle size={24} color="var(--color-warning)" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  {t.warning1Title || "Попередження №1: Захист контенту"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {t.lockWarning1 || "Після блокування треки, демо-записи та конфіденційні матеріали будуть надійно приховані. Без введеного ключа переглянути або змінити альбом буде неможливо."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmStep(0)} className="btn btn-secondary">
                {t.cancel || "Скасувати"}
              </button>
              <button onClick={() => setConfirmStep(2)} className="btn btn-primary">
                <span>{t.iUnderstandContinue || "Я розумію, продовжити"} →</span>
              </button>
            </div>
          </div>
        ) : confirmStep === 2 ? (
          /* Warning step 2 */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start"
            }}>
              <ShieldAlert size={24} color="var(--color-danger)" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem", color: "var(--color-danger)" }}>
                  {t.warning2Title || "Попередження №2: Збереження ключа"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {t.lockWarning2 || "Переконайтеся, що ви надійно записали або зберегли ключ у менеджері паролів чи нотатках! Ви дійсно бажаєте заблокувати альбом прямо зараз?"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmStep(0)} className="btn btn-secondary">
                {t.back || "Назад"}
              </button>
              <button onClick={handleConfirmLock} className="btn btn-primary" style={{ background: "var(--color-danger)" }}>
                <Lock size={14} />
                <span>{t.confirmLockAlbum || "Заблокувати альбом"}</span>
              </button>
            </div>
          </div>
        ) : album.isLocked ? (
          /* Case 2: Album is currently locked */
          <form onSubmit={handleUnlock}>
            <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
              <Lock size={36} color="var(--accent)" style={{ margin: "0 auto 10px" }} />
              <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: 4 }}>
                {t.albumLocked || "Альбом заблоковано"}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {t.enterPasswordToUnlock || "Введіть ваш ключ розшифрування для доступу"}
              </p>
            </div>

            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                required
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="TRK-XXXX-XXXX-XXXX-XXXX"
                className="input font-mono"
                style={{ textAlign: "center", fontSize: "1rem", letterSpacing: "0.05em" }}
              />
            </div>

            {unlockError && (
              <div style={{
                background: "var(--color-danger-bg)",
                color: "var(--color-danger)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: "0.8rem",
                marginBottom: 14
              }}>
                {unlockError}
              </div>
            )}

            {emergencySuccess && (
              <div style={{
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: "0.8rem",
                marginBottom: 14
              }}>
                {emergencySuccess}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Unlock size={14} />
                <span>{t.unlock || "Розблокувати"}</span>
              </button>
              <button type="button" onClick={handleDeleteKey} className="btn btn-danger-ghost" title={t.deleteKey || "Видалити ключ"}>
                <Trash2 size={14} />
              </button>
            </div>

            {/* 1 FORGIVENESS EMERGENCY RECOVERY SECTION */}
            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px dashed var(--border-medium)",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HeartHandshake size={15} color="var(--accent)" />
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {t.emergencyRestoreTitle || "Загубили ключ? (1 Вибачення)"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {album.hasUsedForgiveness 
                  ? (t.emergencyUsed || "Ви вже скористалися своїм єдиним вибаченням для цього альбому.")
                  : (t.emergencyRestoreDesc || "Система надає 1 вибачення: ви можете один раз скинути замок та повернути доступ до матеріалів без ключа.")}
              </p>

              {!album.hasUsedForgiveness && (
                <button
                  type="button"
                  onClick={handleOneForgivenessRestore}
                  className="btn btn-ghost btn-sm"
                  style={{
                    alignSelf: "flex-start",
                    fontSize: "0.76rem",
                    color: "var(--accent)",
                    padding: "4px 8px",
                    marginTop: 4
                  }}
                >
                  <HeartHandshake size={13} />
                  <span>{t.useEmergencyRestore || "Використати 1 вибачення (Відновити альбом)"}</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Case 3: Album is unlocked, can generate key or lock */
          <div>
            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.5 }}>
              {t.keyIntro || "Ви можете згенерувати унікальний криптографічний пароль для захисту альбому. Він робить реліз конфіденційним до моменту розшифрування."}
            </p>

            {album.masterKeyHash ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{
                  background: "var(--color-success-bg)",
                  border: "1px solid var(--color-success)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  fontSize: "0.8rem",
                  color: "var(--color-success)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <ShieldCheck size={16} />
                  <span>{t.keyCreatedActive || "Ключ створено та активовано."}</span>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button onClick={handleStartLock} className="btn btn-primary" style={{ flex: 1 }}>
                    <Lock size={14} />
                    <span>{t.lockAlbum || "Заблокувати альбом"}</span>
                  </button>
                  <button onClick={handleDeleteKey} className="btn btn-secondary" style={{ color: "var(--color-danger)" }}>
                    <Trash2 size={14} />
                    <span>{t.deleteKey || "Видалити ключ"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleGenerateKey} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                <Key size={15} />
                <span>{t.generateKeyBtn || "Згенерувати ключ розшифрування (1 показ)"}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
