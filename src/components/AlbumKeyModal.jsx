import React, { useState } from 'react';
import { X, Key, ShieldAlert, Check, Copy, Trash2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { hashPasswordForAuth } from '../utils/crypto';

export function AlbumKeyModal({
  isOpen,
  onClose,
  album,
  currentUser,
  onSaveAlbum,
  t
}) {
  if (!isOpen || !album) return null;

  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Generate deterministic passkey from: Album Title + Username + Current Hour
  const handleGenerateKey = async () => {
    const currentHour = new Date().getHours();
    const username = currentUser ? currentUser.username : 'studio_producer';
    const rawSeed = `${album.title}::${username}::${currentHour}H`;
    
    // Hash seed to derive an 8-character uppercase memorable studio passkey
    const hash = await hashPasswordForAuth(rawSeed, 'album_key_salt_lviv');
    const token = `${album.title.replace(/\s+/g, '_').slice(0, 6).toUpperCase()}-${currentHour}H-${hash.slice(0, 6).toUpperCase()}`;

    // Hash the token itself to store for verification (so key is never stored in plaintext)
    const verificationHash = await hashPasswordForAuth(token, 'album_verify_salt');

    const updated = {
      ...album,
      masterKeyHash: verificationHash,
      isLocked: false
    };

    onSaveAlbum(updated);
    setGeneratedKey(token);
  };

  const handleDeleteKey = () => {
    if (window.confirm('Видалити захисний ключ цього альбому?')) {
      const updated = {
        ...album,
        masterKeyHash: null,
        isLocked: false
      };
      onSaveAlbum(updated);
      setGeneratedKey(null);
      onClose();
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');

    const computedHash = await hashPasswordForAuth(inputKey.trim(), 'album_verify_salt');
    if (computedHash === album.masterKeyHash) {
      const updated = { ...album, isLocked: false };
      onSaveAlbum(updated);
      setInputKey('');
      onClose();
    } else {
      setUnlockError('Невірний ключ розшифрування альбому!');
    }
  };

  const handleLockAlbum = () => {
    const updated = { ...album, isLocked: true };
    onSaveAlbum(updated);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Ключ доступу до альбому
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={17} />
          </button>
        </div>

        {/* Case 1: Freshly generated key shown 1 time */}
        {generatedKey ? (
          <div>
            <div style={{
              background: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: 16,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>
                  УВАГА: ЦЕЙ КЛЮЧ ПОКАЗУЄТЬСЯ ЛИШЕ 1 РАЗ!
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Він згенерований з назви альбому, вашого профілю та поточної години ({new Date().getHours()}:00). Скопіюйте його зараз — він більше ніде не відображатиметься!
                </p>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card-secondary)',
              border: '1.5px dashed var(--accent)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              textAlign: 'center',
              marginBottom: 16
            }}>
              <span className="font-mono" style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--accent)'
              }}>
                {generatedKey}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={handleCopy} className="btn btn-primary" style={{ flex: 1 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Скопійовано!' : 'Скопіювати ключ'}</span>
              </button>
              <button onClick={onClose} className="btn btn-secondary">
                Готово
              </button>
            </div>
          </div>
        ) : album.isLocked ? (
          /* Case 2: Album is currently locked */
          <form onSubmit={handleUnlock}>
            <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
              <Lock size={36} color="var(--accent)" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Альбом заблоковано
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Введіть ваш одноразовий пароль для розшифрування
              </p>
            </div>

            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                required
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="TRK-XXXX-XX-XXXX"
                className="input font-mono"
                style={{ textAlign: 'center', fontSize: '1rem', letterSpacing: '0.05em' }}
              />
            </div>

            {unlockError && (
              <div style={{
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: '0.8rem',
                marginBottom: 14
              }}>
                {unlockError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Unlock size={14} />
                <span>Розблокувати</span>
              </button>
              <button type="button" onClick={handleDeleteKey} className="btn btn-danger-ghost">
                <Trash2 size={14} />
              </button>
            </div>
          </form>
        ) : (
          /* Case 3: Album is unlocked, can generate key or lock */
          <div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
              Ви можете згенерувати унікальний пароль для альбому. Він формується на основі назви <strong>{album.title}</strong>, акаунта <strong>{currentUser ? currentUser.username : 'studio_producer'}</strong> та поточної години.
            </p>

            {album.masterKeyHash ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Check size={15} />
                  <span>Ключ створено та активовано.</span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button onClick={handleLockAlbum} className="btn btn-primary" style={{ flex: 1 }}>
                    <Lock size={14} />
                    <span>Заблокувати альбом</span>
                  </button>
                  <button onClick={handleDeleteKey} className="btn btn-secondary" style={{ color: 'var(--color-danger)' }}>
                    <Trash2 size={14} />
                    <span>Видалити ключ</span>
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleGenerateKey} className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                <Key size={15} />
                <span>Згенерувати ключ розшифрування (1 показ)</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}