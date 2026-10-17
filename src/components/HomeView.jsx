import React from 'react';
import { 
  Disc3, 
  Plus, 
  Sparkles, 
  Music, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ShieldCheck
} from 'lucide-react';
import { calculateAlbumProgress } from '../constants';

export function HomeView({
  albums,
  onSelectAlbum,
  onOpenNewAlbumModal,
  currentUser,
  t
}) {
  // Aggregate stats across all albums
  const totalAlbums = albums.length;
  let totalTracks = 0;
  let totalCompletedTracks = 0;
  let progressSum = 0;

  albums.forEach(alb => {
    const tracks = alb.tracks || [];
    totalTracks += tracks.length;
    const completed = tracks.filter(t => (t.score || 0) === 10).length;
    totalCompletedTracks += completed;
    progressSum += calculateAlbumProgress(tracks);
  });

  const averageProgress = totalAlbums > 0 ? Math.round(progressSum / totalAlbums) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Studio Welcome & Overview Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="pill" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
              {currentUser ? `ПРОФІЛЬ: ${currentUser.username}` : 'ГОСЬТОВИЙ РЕЖИМ'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              trackER Central Studio
            </span>
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
            {currentUser 
              ? `Привіт, ${currentUser.artistName || currentUser.username}! 🎧` 
              : 'Головна студія продакшну 🎛️'}
          </h1>
          
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: 600, lineHeight: 1.5 }}>
            Керуйте вашими музичними альбомами, відслідковуйте готовність аранжувань, запису вокалу та зведення на кожному етапі.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewAlbumModal}
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '0.95rem', gap: 8 }}
        >
          <Plus size={16} />
          <span>{t.newAlbum}</span>
        </button>
      </div>

      {/* Studio KPI Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        
        {/* Total Albums */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Альбоми в роботі
            </span>
            <Layers size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalAlbums}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Усі проєкти дискографії
          </span>
        </div>

        {/* Total Tracks */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Всього треків
            </span>
            <Music size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalTracks}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Композицій у розробці
          </span>
        </div>

        {/* Completed Tracks */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Готові до релізу!
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalCompletedTracks}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Треків зі статусом 10/10
          </span>
        </div>

        {/* Overall Completion Rate */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Середній прогрес
            </span>
            <TrendingUp size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent)' }}>
            {averageProgress}%
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Загальна готовність музики
          </span>
        </div>

      </div>

      {/* Albums Grid Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t.albums} ({albums.length})
          </h2>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Оберіть альбом для роботи в студії
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20
        }}>
          {albums.map((album) => {
            const tracks = album.tracks || [];
            const completed = tracks.filter(t => (t.score || 0) === 10).length;
            const progress = calculateAlbumProgress(tracks);

            return (
              <div
                key={album.id}
                onClick={() => onSelectAlbum(album.id)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}
                className="album-card-hover"
              >
                
                {/* Album Header: Cover & Details */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'var(--bg-pill)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {album.coverUrl ? (
                      <img 
                        src={album.coverUrl} 
                        alt={album.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <Disc3 size={32} color="var(--accent)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {album.title}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {album.artist || 'Невідомий виконавець'} • {album.releaseYear || '2026'}
                    </div>
                    {album.genre && (
                      <span className="pill" style={{ marginTop: 6, display: 'inline-block', fontSize: '0.7rem', padding: '1px 6px' }}>
                        {album.genre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Готовність треків: <strong>{completed} з {tracks.length}</strong>
                    </span>
                    <strong style={{ color: 'var(--accent)' }}>
                      {progress}%
                    </strong>
                  </div>

                  <div style={{
                    height: 6,
                    background: 'var(--bg-pill)',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: 'var(--accent)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Action Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {tracks.length} композицій
                  </span>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--accent)'
                  }}>
                    Відкрити в студії <ArrowRight size={14} />
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
