import React from "react";
import { useState } from "react";
import { Plus, Disc3, Music2, CheckCircle2, TrendingUp, Layers, ArrowRight, User, Share2, FolderHeart, Sparkles } from "lucide-react";
import { calculateAlbumProgress, isTrackFinished } from "../constants";

export function HomeView({
  albums,
  onSelectAlbum,
  onOpenNewAlbumModal,
  currentUser,
  t
}) {
  const [albumSourceFilter, setAlbumSourceFilter] = useState("all"); // 'all' | 'my' | 'shared'

  const myAlbums = albums.filter(a => !a.sharedBy && !a.sharedByUsername);
  const sharedAlbums = albums.filter(a => !!a.sharedBy || !!a.sharedByUsername);

  const displayedAlbums = albumSourceFilter === "my"
    ? myAlbums
    : albumSourceFilter === "shared"
    ? sharedAlbums
    : albums;
  const totalTracks = albums.reduce((acc, alb) => acc + (alb.tracks ? alb.tracks.length : 0), 0);
  
  const totalCompletedTracks = albums.reduce((acc, alb) => {
    const tracks = alb.tracks || [];
    return acc + tracks.filter(tr => isTrackFinished(tr)).length;
  }, 0);

  const averageProgress = albums.length > 0
    ? Math.round(albums.reduce((acc, alb) => acc + calculateAlbumProgress(alb.tracks || []), 0) / albums.length)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* Studio Welcome & Overview Banner */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-xl)",
        padding: "32px 28px",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
        position: "relative",
        overflow: "hidden"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span className="pill" style={{ textTransform: "uppercase", fontSize: "0.72rem" }}>
              {currentUser ? `${t.homeProfile || "ПРОФІЛЬ"}: ${currentUser.username}` : (t.homeGuestMode || "ГОСЬТОВИЙ РЕЖИМ")}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              trackER Central Studio
            </span>
          </div>

          <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
            {currentUser 
              ? `${t.homeGreeting || "Привіт"}, ${currentUser.artistName || currentUser.username}! 🎧` 
              : (t.homeMainStudio || "Головна студія продакшну 🎛️")}
          </h1>
          
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.98rem", maxWidth: 600, lineHeight: 1.5 }}>
            {t.homeSubtitle || "Керуйте вашими музичними альбомами, відслідковуйте готовність аранжувань, запису вокалу та зведення на кожному етапі."}
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewAlbumModal}
          className="btn btn-primary"
          style={{ padding: "12px 22px", fontSize: "0.95rem" }}
        >
          <Plus size={18} />
          <span>{t.newAlbum}</span>
        </button>
      </div>

      {/* Global Studio Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16
      }}>
        
        {/* Total Albums */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              {t.activeAlbums || "Альбоми в роботі"}
            </span>
            <Layers size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {albums.length}
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            {t.discographyProjects || "Усі проєкти дискографії"}
          </span>
        </div>

        {/* Total Tracks */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              {t.totalTracksCount || "Всього треків"}
            </span>
            <Music2 size={18} color="var(--stage-vocal)" />
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {totalTracks}
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            {t.tracksInDev || "Композицій у розробці"}
          </span>
        </div>

        {/* Completed Tracks */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              {t.readyForRelease || "Готові до релізу!"}
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {totalCompletedTracks}
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            {t.tracksCompletedStatus || "Треків зі статусом завершено"}
          </span>
        </div>

        {/* Overall Completion Rate */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              {t.averageProgress || "Середній прогрес"}
            </span>
            <TrendingUp size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent)" }}>
            {averageProgress}%
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            {t.overallMusicReadiness || "Загальна готовність музики"}
          </span>
        </div>

      </div>

      {/* Albums Grid Section */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          gap: 16,
          flexWrap: "wrap"
        }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
              {t.albums} ({displayedAlbums.length})
            </h2>
            <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
              {t.selectAlbumPrompt || "Оберіть альбом для роботи в студії"}
            </span>
          </div>

          {/* Home View Source Filter: All / My Works / Shared With Me */}
          <div style={{
            display: "inline-flex",
            background: "var(--bg-card-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-full)",
            padding: 4,
            gap: 4
          }}>
            <button
              onClick={() => setAlbumSourceFilter("all")}
              className={`segmented-control-btn ${albumSourceFilter === "all" ? "active" : ""}`}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              <Layers size={13} />
              <span>{t.allProjects || "Усі проєкти"} ({albums.length})</span>
            </button>

            <button
              onClick={() => setAlbumSourceFilter("my")}
              className={`segmented-control-btn ${albumSourceFilter === "my" ? "active" : ""}`}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              <User size={13} />
              <span>{t.myWorks || "Мої роботи"} ({myAlbums.length})</span>
            </button>

            <button
              onClick={() => setAlbumSourceFilter("shared")}
              className={`segmented-control-btn ${albumSourceFilter === "shared" ? "active" : ""}`}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              <Share2 size={13} color="var(--accent)" />
              <span>{t.sharedWithMe || "Поширені зі мною"} ({sharedAlbums.length})</span>
            </button>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20
        }}>
          {displayedAlbums.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 20px",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px dashed var(--border-medium)",
              color: "var(--text-secondary)"
            }}>
              <p style={{ margin: 0, fontSize: "0.92rem" }}>
                {albumSourceFilter === "shared" 
                  ? (t.noSharedAlbums || "Вам ще ніхто не надсилав поширених альбомів.")
                  : (t.noMyAlbums || "У вас ще немає створених альбомів.")}
              </p>
            </div>
          ) : (
            displayedAlbums.map((album) => {
            const tracks = album.tracks || [];
            const completed = tracks.filter(tr => isTrackFinished(tr)).length;
            const progress = calculateAlbumProgress(tracks);

            return (
              <div
                key={album.id}
                onClick={() => onSelectAlbum(album.id)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-xl)",
                  padding: "20px",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16
                }}
                className="album-card-hover"
              >
                
                {/* Album Header: Cover & Details */}
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    background: "var(--bg-pill)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    {album.coverUrl ? (
                      <img 
                        src={album.coverUrl} 
                        alt={album.title} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    ) : (
                      <Disc3 size={32} color="var(--accent)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {album.sharedBy && (
                      <span className="pill pill-accent" style={{ fontSize: "0.65rem", padding: "1px 7px", marginBottom: 4 }}>
                        <Share2 size={9} />
                        {album.sharedBy}
                      </span>
                    )}
                    <h3 style={{
                      margin: "0 0 4px",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {album.title}
                    </h3>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {album.artist || (t.unknownArtist || "Невідомий виконавець")} • {album.releaseYear || "2026"}
                    </div>
                    {album.genre && (
                      <span className="pill" style={{ marginTop: 6, display: "inline-block", fontSize: "0.7rem", padding: "1px 6px" }}>
                        {album.genre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 6 }}>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {t.trackReadiness || "Готовність треків"}: <strong>{completed} {t.outOf || "з"} {tracks.length}</strong>
                    </span>
                    <strong style={{ color: "var(--accent)" }}>
                      {progress}%
                    </strong>
                  </div>

                  <div style={{
                    height: 6,
                    background: "var(--bg-pill)",
                    borderRadius: "999px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: "var(--accent)",
                      borderRadius: "999px",
                      transition: "width 0.4s ease"
                    }} />
                  </div>
                </div>

                {/* Action Footer */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-subtle)"
                }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {tracks.length} {t.tracksPlural || "композицій"}
                  </span>

                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    color: "var(--accent)"
                  }}>
                    {t.openInStudio || "Відкрити в студії"} <ArrowRight size={14} />
                  </span>
                </div>

              </div>
            );
          })
          )}
        </div>
      </div>

    </div>
  );
}
