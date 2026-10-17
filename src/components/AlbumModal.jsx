import React, { useState } from "react";
import { X, Upload } from "lucide-react";
import { PRESET_COVERS } from "../constants";

export function AlbumModal({
  isOpen,
  onClose,
  onSave,
  album,
  t
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(album ? album.title : "");
  const [artist, setArtist] = useState(album ? album.artist : "");
  const [genre, setGenre] = useState(album ? album.genre : "");
  const [targetDate, setTargetDate] = useState(album ? album.targetDate : "");
  const [coverUrl, setCoverUrl] = useState(album ? album.coverUrl : PRESET_COVERS[0].url);
  const [concept, setConcept] = useState(album ? album.concept : "");

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setCoverUrl(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedAlbum = {
      id: album ? album.id : `album-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      genre: genre.trim(),
      targetDate: targetDate,
      coverUrl: coverUrl || PRESET_COVERS[0].url,
      concept: concept,
      tracks: album ? album.tracks : []
    };

    onSave(updatedAlbum);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>
            {album ? t.albumModalTitleEdit : t.albumModalTitleNew}
          </h2>
          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
                {t.albumName} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.albumNamePlaceholder}
                className="input"
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
                {t.artist}
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder={t.artistPlaceholder}
                className="input"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
                {t.genre}
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder={t.genrePlaceholder}
                className="input"
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
                {t.releaseDate}
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
              {t.albumArtSource}
            </label>

            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--border-medium)",
                background: "var(--bg-card-secondary)",
                flexShrink: 0
              }}>
                <img
                  src={coverUrl}
                  alt="Cover Preview"
                  onError={(e) => { e.currentTarget.src = "/covers/demo_cyan.jpg"; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder={t.coverUrlPlaceholder}
                  className="input"
                  style={{ fontSize: "0.82rem" }}
                />

                <label className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start", cursor: "pointer" }}>
                  <Upload size={12} />
                  <span>{t.uploadCover}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 6 }}>
              {t.usePresetCover}:
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {PRESET_COVERS.map(pr => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => setCoverUrl(pr.url)}
                  style={{
                    border: coverUrl === pr.url ? "2px solid var(--accent)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    width: 44,
                    height: 44,
                    padding: 0,
                    background: "none",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                  title={pr.title}
                >
                  <img src={pr.url} alt={pr.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>
              {t.albumConcept}
            </label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Опишіть концепцію альбому..."
              className="textarea"
              style={{ minHeight: 90 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              {album ? t.save : t.create}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}