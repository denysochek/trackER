import React, { useState } from 'react';
import { User, Lock, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

export function UserMenu({
  currentUser,
  onOpenAuth,
  onSignOut,
  t
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) {
    return (
      <button
        onClick={onOpenAuth}
        className="btn btn-primary btn-sm"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Lock size={13} />
        <span>{t.signIn}</span>
      </button>
    );
  }

  const initial = currentUser.artistName ? currentUser.artistName.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)'
        }}
      >
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {initial}
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.8rem', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentUser.artistName || currentUser.username}
        </span>
        <ChevronDown size={12} color="var(--text-muted)" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 230,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          padding: '12px',
          zIndex: 70
        }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent-subtle)',
              border: '1px solid rgba(var(--accent-rgb), 0.3)',
              color: 'var(--accent)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {currentUser.artistName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                @{currentUser.username}
              </div>
            </div>
          </div>

          {/* Encryption status */}
          <div style={{
            background: 'var(--bg-pill)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 10px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.72rem',
            color: 'var(--color-success)'
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
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)' }}
          >
            <LogOut size={13} />
            <span>{t.signOut}</span>
          </button>
        </div>
      )}
    </div>
  );
}