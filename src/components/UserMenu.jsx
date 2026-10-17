import React, { useState } from "react";
import { User, Lock, LogOut, ShieldCheck, ChevronDown, Crown } from "lucide-react";

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
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, padding: "5px 12px" }}
      >
        <Lock size={13} />
        <span>{t.signIn}</span>
      </button>
    );
  }

  const initial = currentUser.artistName ? currentUser.artistName.charAt(0).toUpperCase() : "U";
  const isAdmin = currentUser.isAdmin || (currentUser.username && currentUser.username.toLowerCase() === "dionisii");

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "4px 10px",
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
          width: 240,
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-modal)",
          padding: "12px",
          zIndex: 70
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

          {/* Encryption status */}
          <div style={{
            background: "var(--bg-pill)",
            borderRadius: "var(--radius-md)",
            padding: "8px 10px",
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
