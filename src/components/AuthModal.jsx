import React, { useState, useEffect } from "react";
import { 
  X, 
  Lock, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Sparkles, 
  ArrowRight, 
  Trash2, 
  CheckCircle2, 
  Crown,
  AlertTriangle,
  Globe,
  UploadCloud,
  FileQuestion
} from "lucide-react";
import { hashPasswordForAuth, deriveEncryptionKey, generateSalt } from "../utils/crypto";
import { CloudStorageService } from "../utils/cloudStorage";

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenCloudSettings,
  t
}) {
  if (!isOpen) return null;

  // Check if any accounts exist to smartly default to signup or login
  const hasExistingAccounts = () => {
    try {
      const reg = JSON.parse(localStorage.getItem("tracker_users_registry") || "{}");
      return Object.keys(reg).length > 0;
    } catch (e) {
      return false;
    }
  };

  const [tab, setTab] = useState(() => (hasExistingAccounts() ? "login" : "signup")); // "login" or "signup"
  const [username, setUsername] = useState("");
  const [artistName, setArtistName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otherBrowserWarning, setOtherBrowserWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      setOtherBrowserWarning(false);
      if (!hasExistingAccounts()) {
        setTab("signup");
      }
    }
  }, [isOpen]);

  const resetForm = () => {
    setUsername("");
    setArtistName("");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setOtherBrowserWarning(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setOtherBrowserWarning(false);

    if (!username.trim() || !password) {
      setErrorMessage(t.fillAllFields || "Будь ласка, заповніть усі поля.");
      return;
    }

    setIsLoading(true);
    try {
      const usersRegistry = JSON.parse(localStorage.getItem("tracker_users_registry") || "{}");
      const normalizedUser = username.trim().toLowerCase();
      const userRecord = usersRegistry[normalizedUser];

      if (!userRecord) {
        // Warning: Account might be in Arc, Safari, Chrome or another browser
        setOtherBrowserWarning(true);
        setErrorMessage(
          t.userNotFoundInThisBrowser || 
          `Акаунт «@${username.trim()}» не знайдено в цьому браузері! Ймовірно, він був зареєстрований в іншому браузері (наприклад Arc / Chrome / Safari).`
        );
        setIsLoading(false);
        return;
      }

      // Hash password with stored salt
      const computedAuthHash = await hashPasswordForAuth(password, userRecord.salt);
      if (computedAuthHash !== userRecord.authHash) {
        setErrorMessage(t.invalidCredentials || "Користувача не знайдено або пароль невірний.");
        setIsLoading(false);
        return;
      }

      // Derive AES encryption key
      const encryptionKey = await deriveEncryptionKey(password, userRecord.salt);
      const isAdmin = userRecord.isAdmin || normalizedUser === "dionisii";

      onLoginSuccess({
        username: userRecord.username,
        artistName: userRecord.artistName || userRecord.username,
        salt: userRecord.salt,
        encryptionKey,
        isAdmin
      }, rememberMe);

      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage("Помилка авторизації.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!username.trim() || !password || !confirmPassword) {
      setErrorMessage(t.fillAllFields || "Будь ласка, заповніть усі поля.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.passwordsMismatch || "Паролі не співпадають!");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Пароль має містити щонайменше 4 символи");
      return;
    }

    setIsLoading(true);
    try {
      const usersRegistry = JSON.parse(localStorage.getItem("tracker_users_registry") || "{}");
      const normalizedUser = username.trim().toLowerCase();

      // STRICTLY BLOCK GUEST ACCOUNT REGISTRATION
      if (normalizedUser === "guest") {
        setErrorMessage(t.guestUsernameReserved || "Нікнейм \"guest\" зарезервований для гостей. Оберіть інше ім’я.");
        setIsLoading(false);
        return;
      }

      if (usersRegistry[normalizedUser]) {
        setErrorMessage(t.userAlreadyExists || "Користувач із таким нікнеймом уже існує.");
        setIsLoading(false);
        return;
      }

      // Generate cryptographic salt (16 random bytes)
      const salt = generateSalt();

      // Compute PBKDF2 auth hash
      const authHash = await hashPasswordForAuth(password, salt);

      // Derive AES-256 encryption key
      const encryptionKey = await deriveEncryptionKey(password, salt);

      // User dionisii is automatically granted Admin rights!
      const isAdmin = normalizedUser === "dionisii";

      // Store in users registry
      usersRegistry[normalizedUser] = {
        username: username.trim(),
        artistName: artistName.trim() || username.trim(),
        salt,
        authHash,
        isAdmin,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem("tracker_users_registry", JSON.stringify(usersRegistry));

      setSuccessMessage(t.accountCreatedSuccess || "Акаунт успішно створено!");

      setTimeout(() => {
        onLoginSuccess({
          username: username.trim(),
          artistName: artistName.trim() || username.trim(),
          salt,
          encryptionKey,
          isAdmin
        }, rememberMe);

        resetForm();
        onClose();
      }, 700);

    } catch (err) {
      console.error(err);
      setErrorMessage("Помилка створення акаунта.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440, width: "90%" }}
      >
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldCheck size={20} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {tab === "login" ? t.signIn : t.signUp}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {t.encryptedVault}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="segmented-control" style={{ width: "100%", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => { setTab("login"); setErrorMessage(""); setSuccessMessage(""); setOtherBrowserWarning(false); }}
            className={`segmented-control-btn ${tab === "login" ? "active" : ""}`}
            style={{ flex: 1, justifyContent: "center", padding: "6px" }}
          >
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setErrorMessage(""); setSuccessMessage(""); setOtherBrowserWarning(false); }}
            className={`segmented-control-btn ${tab === "signup" ? "active" : ""}`}
            style={{ flex: 1, justifyContent: "center", padding: "6px" }}
          >
            {t.signUp}
          </button>
        </div>

        {/* SIGNUP WARNING: Local Browser Storage Notice */}
        {tab === "signup" && (
          <div style={{
            background: "rgba(234, 179, 8, 0.1)",
            border: "1.5px solid rgba(234, 179, 8, 0.35)",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
            marginBottom: 14,
            display: "flex",
            gap: 10,
            alignItems: "flex-start"
          }}>
            <AlertTriangle size={16} color="#eab308" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              <strong style={{ color: "#eab308" }}>{t.signupWarningTitle || "Важливо при реєстрації:"}</strong> {t.signupBrowserWarning || "Акаунт створюється локально у цьому браузері. Щоб відкрити його в іншому браузері (наприклад, Zen або Arc), перенесіть його через ZIP-архів або підключіть Хмарне Збереження."}
            </div>
          </div>
        )}

        {/* Notice on Client-Side Encryption */}
        <div style={{
          background: "var(--bg-pill)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "8px 12px",
          marginBottom: 14,
          display: "flex",
          gap: 10,
          alignItems: "center"
        }}>
          <Lock size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: "0.73rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
            {t.encryptionNotice}
          </p>
        </div>

        {/* OTHER BROWSER WARNING ALERT BANNER */}
        {otherBrowserWarning && (
          <div style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1.5px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "var(--radius-md)",
            padding: "12px",
            marginBottom: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--color-danger)", fontWeight: 700, fontSize: "0.82rem" }}>
              <Globe size={16} />
              <span>{t.browserMismatchTitle || "Акаунт у іншому браузері?"}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.45, margin: 0 }}>
              {t.browserMismatchDesc || "Якщо ви раніше працювали в іншому браузері (Arc / Chrome / Safari), сховища браузерів повністю розділені. Щоб увійти тут:"}
            </p>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", paddingLeft: 8 }}>
              1. Відкрийте попередній браузер і виберіть <strong>«Експортувати акаунт (ZIP)»</strong>.<br/>
              2. Або відновіть акаунт через <strong>«Хмарне збереження»</strong>.
            </div>
            {onOpenCloudSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCloudSettings();
                }}
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: "flex-start", marginTop: 4, fontSize: "0.75rem" }}
              >
                <UploadCloud size={13} color="var(--accent)" />
                <span>{t.openCloudRestore || "Відкрити Хмарне збереження"}</span>
              </button>
            )}
          </div>
        )}

        {/* Success message banner */}
        {successMessage && (
          <div style={{
            background: "rgba(34, 197, 94, 0.1)",
            color: "var(--color-success)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: "0.8rem",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={tab === "login" ? handleLogin : handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "signup" && (
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
                {t.artist}
              </label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="напр. Metro Boomin або O.Torvald"
                className="input"
              />
            </div>
          )}

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {t.username} *
              </label>
              {username.trim().toLowerCase() === "dionisii" && (
                <span style={{ fontSize: "0.68rem", color: "#eab308", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Crown size={11} /> {t.adminRole || "Адміністратор"}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setOtherBrowserWarning(false);
                setErrorMessage("");
              }}
              placeholder="dionisii"
              className="input"
            />
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
              {t.password} *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </div>

          {tab === "signup" && (
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
                {t.confirmPassword} *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>
          )}

          {/* Remember Me Checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="rememberMeCheck"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: "var(--accent)",
                cursor: "pointer"
              }}
            />
            <label
              htmlFor="rememberMeCheck"
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              {t.rememberMe || "Запам'ятати мене"}
            </label>
          </div>

          {errorMessage && !otherBrowserWarning && (
            <div style={{
              background: "var(--color-danger-bg)",
              color: "var(--color-danger)",
              border: "1px solid rgba(255, 59, 48, 0.2)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              fontSize: "0.8rem"
            }}>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 6, padding: "10px" }}
          >
            {isLoading ? "Шифрування..." : tab === "login" ? t.signIn : t.signUp}
            <ArrowRight size={14} />
          </button>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: "0.75rem" }}
            >
              {t.guestMode}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
