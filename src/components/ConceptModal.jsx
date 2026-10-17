import React, { useState } from "react";
import { X, Save, Edit3, Eye, Sparkles } from "lucide-react";

export function ConceptModal({
  isOpen,
  onClose,
  album,
  onSaveConcept,
  t
}) {
  if (!isOpen || !album) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [conceptText, setConceptText] = useState(album.concept || "");

  const handleSave = () => {
    onSaveConcept(conceptText);
    setIsEditing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {t.albumConcept}
            </h2>
            <span className="pill pill-accent" style={{ fontSize: "0.72rem" }}>
              {album.title}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary btn-sm"
            >
              {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
              <span>{isEditing ? "Перегляд" : "Редагувати"}</span>
            </button>
            <button onClick={onClose} className="btn-ghost btn-icon">
              <X size={17} />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={conceptText}
              onChange={(e) => setConceptText(e.target.value)}
              placeholder="Додайте історію альбому, мудборд, саунд-дизайн нотатки..."
              className="textarea"
              style={{ minHeight: 280, fontFamily: "var(--font-mono)", fontSize: "0.85rem", lineHeight: 1.6 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                {t.cancel}
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                <Save size={13} />
                {t.save}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {conceptText ? (
              <div style={{
                background: "var(--bg-card-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "18px",
                whiteSpace: "pre-wrap",
                lineHeight: 1.65,
                fontSize: "0.92rem",
                color: "var(--text-primary)",
                maxHeight: 400,
                overflowY: "auto"
              }}>
                {conceptText}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "36px 20px",
                background: "var(--bg-card-secondary)",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--border-subtle)"
              }}>
                <Sparkles size={26} color="var(--accent)" style={{ margin: "0 auto 10px" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: 14 }}>
                  {t.noConceptSet}
                </p>
                <button onClick={() => setIsEditing(true)} className="btn btn-primary btn-sm">
                  <Edit3 size={13} />
                  Редагувати
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}