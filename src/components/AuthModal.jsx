import React, { useState, useEffect } from "react";
import { X, Lock, ShieldCheck, User, KeyRound, Sparkles, ArrowRight, Trash2, CheckCircle2, Crown } from "lucide-react";
import { hashPasswordForAuth, deriveEncryptionKey, generateSalt } from "../utils/crypto";

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
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

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
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
        setErrorMessage(t.invalidCredentials || "Користувача не знайдено або пароль невірний.");
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

      onLoginSuccess({
        username: username.trim(),
        artistName: artistName.trim() || username.trim(),
        salt,
        encryptionKey,
        isAdmin
      }, rememberMe);

      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage("Помилка генерації крипто-ключа при реєстрації.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--accent-subtle)",
              border: "1px solid rgba(var(--accent-rgb), 0.2)",
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
        <div className="segmented-control" style={{ width: "100%", marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => { setTab("login"); setErrorMessage(""); setSuccessMessage(""); }}
            className={`segmented-control-btn ${tab === "login" ? "active" : ""}`}
            style={{ flex: 1, justifyContent: "center", padding: "6px" }}
          >
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setErrorMessage(""); setSuccessMessage(""); }}
            className={`segmented-control-btn ${tab === "signup" ? "active" : ""}`}
            style={{ flex: 1, justifyContent: "center", padding: "6px" }}
          >
            {t.signUp}
          </button>
        </div>

        {/* Notice on Client-Side Encryption */}
        <div style={{
          background: "var(--bg-pill)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "10px 12px",
          marginBottom: 16,
          display: "flex",
          gap: 10,
          alignItems: "flex-start"
        }}>
          <Lock size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
            {t.encryptionNotice}
          </p>
        </div>

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
              onChange={(e) => setUsername(e.target.value)}
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

          {errorMessage && (
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
