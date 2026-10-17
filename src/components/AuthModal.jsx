import React, { useState } from 'react';
import { X, Lock, ShieldCheck, User, KeyRound, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { hashPasswordForAuth, deriveEncryptionKey, generateSalt } from '../utils/crypto';

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  t
}) {
  if (!isOpen) return null;

  const [tab, setTab] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState('');
  const [artistName, setArtistName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUsername('');
    setArtistName('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage(t.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      const usersRegistry = JSON.parse(localStorage.getItem('tracker_users_registry') || '{}');
      const userRecord = usersRegistry[username.trim().toLowerCase()];

      if (!userRecord) {
        setErrorMessage(t.invalidCredentials);
        setIsLoading(false);
        return;
      }

      // Hash password with user's stored salt
      const computedAuthHash = await hashPasswordForAuth(password, userRecord.salt);
      if (computedAuthHash !== userRecord.authHash) {
        setErrorMessage(t.invalidCredentials);
        setIsLoading(false);
        return;
      }

      // Derive AES encryption key
      const encryptionKey = await deriveEncryptionKey(password, userRecord.salt);

      onLoginSuccess({
        username: userRecord.username,
        artistName: userRecord.artistName || userRecord.username,
        salt: userRecord.salt,
        encryptionKey
      });

      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Crypto error during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage(t.fillAllFields);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.passwordsMismatch);
      return;
    }

    if (password.length < 4) {
      setErrorMessage('Пароль має містити щонайменше 4 символи');
      return;
    }

    setIsLoading(true);
    try {
      const usersRegistry = JSON.parse(localStorage.getItem('tracker_users_registry') || '{}');
      const normalizedUser = username.trim().toLowerCase();

      if (normalizedUser === 'guest') {
        setErrorMessage(t.guestUsernameReserved || "Ім'я 'guest' зарезервоване для гостей. Будь ласка, оберіть інший нікнейм.");
        setIsLoading(false);
        return;
      }

      if (usersRegistry[normalizedUser]) {
        setErrorMessage(t.userAlreadyExists);
        setIsLoading(false);
        return;
      }

      // Generate cryptographic salt (16 random bytes)
      const salt = generateSalt();

      // Compute PBKDF2 auth hash
      const authHash = await hashPasswordForAuth(password, salt);

      // Derive AES-256 encryption key
      const encryptionKey = await deriveEncryptionKey(password, salt);

      // Store in users registry (Never storing the plain password!)
      usersRegistry[normalizedUser] = {
        username: username.trim(),
        artistName: artistName.trim() || username.trim(),
        salt,
        authHash,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('tracker_users_registry', JSON.stringify(usersRegistry));

      onLoginSuccess({
        username: username.trim(),
        artistName: artistName.trim() || username.trim(),
        salt,
        encryptionKey
      });

      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Crypto error during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accent-subtle)',
              border: '1px solid rgba(var(--accent-rgb), 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {tab === 'login' ? t.signIn : t.signUp}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t.encryptedVault}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="segmented-control" style={{ width: '100%', marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(''); }}
            className={`segmented-control-btn ${tab === 'login' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          >
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMessage(''); }}
            className={`segmented-control-btn ${tab === 'signup' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          >
            {t.signUp}
          </button>
        </div>

        {/* Notice on Client-Side Encryption */}
        <div style={{
          background: 'var(--bg-pill)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          marginBottom: 18,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start'
        }}>
          <Lock size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {t.encryptionNotice}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={tab === 'login' ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>
                {t.artist}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="напр. Metro Boomin або O.Torvald"
                  className="input"
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>
              {t.username} *
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="studio_pro"
              className="input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>
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

          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>
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

          {errorMessage && (
            <div style={{
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(255, 59, 48, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: '0.8rem'
            }}>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 6, padding: '10px' }}
          >
            {isLoading ? 'Шифрування...' : tab === 'login' ? t.signIn : t.signUp}
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 2 }}
          >
            {t.guestMode}
          </button>
        </form>

      </div>
    </div>
  );
}