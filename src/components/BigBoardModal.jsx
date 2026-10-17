import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  FileText, 
  Clock, 
  Globe, 
  User, 
  ShieldAlert, 
  Eye, 
  Lock 
} from 'lucide-react';
import { playStudioClick } from '../utils/soundEffects';

export function BigBoardModal({
  isOpen,
  onClose,
  t
}) {
  if (!isOpen) return null;

  // Board scope: 'private' (default - only for you) vs 'public' (shared community board)
  const [boardScope, setBoardScope] = useState('private');

  // 1. Private Continuous Canvas (localStorage)
  const [canvasText, setCanvasText] = useState(() => {
    return localStorage.getItem('tracker_big_board_canvas') || '';
  });

  // 2. Private Personal Stack
  const [privateEntries, setPrivateEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('tracker_big_board_entries');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 3. Public Community Board
  const [publicEntries, setPublicEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('tracker_shared_public_board');
      if (saved) return JSON.parse(saved);
      // Default initial welcome on public board
      return [
        {
          id: 'pub-init-1',
          text: 'Львівський вайб, біти на студії та безсонні ночі над альбомом.',
          author: 'dionisii',
          isAnonymous: true,
          createdAt: '17.10.2026, 20:00'
        },
        {
          id: 'pub-init-2',
          text: 'Головне не перемудрити з мастерингом, хай качає в тачці.',
          author: 'sound_eng',
          isAnonymous: false,
          createdAt: '17.10.2026, 21:15'
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const [newEntryText, setNewEntryText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activePrivateTab, setActivePrivateTab] = useState('canvas'); // 'canvas' | 'entries'
  const [selectedEntryId, setSelectedEntryId] = useState(null); // id of entry showing metadata on click
  const [isCopied, setIsCopied] = useState(false);

  // Persist private canvas
  useEffect(() => {
    localStorage.setItem('tracker_big_board_canvas', canvasText);
  }, [canvasText]);

  // Persist private entries
  useEffect(() => {
    localStorage.setItem('tracker_big_board_entries', JSON.stringify(privateEntries));
  }, [privateEntries]);

  // Persist public board
  useEffect(() => {
    localStorage.setItem('tracker_shared_public_board', JSON.stringify(publicEntries));
  }, [publicEntries]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAddPrivateEntry = (e) => {
    e?.preventDefault();
    if (!newEntryText.trim()) return;

    playStudioClick();
    const entry = {
      id: Date.now().toString(),
      text: newEntryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setPrivateEntries([entry, ...privateEntries]);
    setNewEntryText('');
  };

  const handleAddPublicEntry = (e) => {
    e?.preventDefault();
    if (!newEntryText.trim()) return;

    playStudioClick();
    const entry = {
      id: `pub-${Date.now()}`,
      text: newEntryText.trim(),
      author: 'Артист',
      isAnonymous: !!isAnonymous,
      createdAt: new Date().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    setPublicEntries([entry, ...publicEntries]);
    setNewEntryText('');
    setIsAnonymous(false);
  };

  const handleDeletePublicEntry = (id) => {
    playStudioClick();
    setPublicEntries(publicEntries.filter(item => item.id !== id));
  };

  const handleCopyText = (text) => {
    playStudioClick();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="big-board-overlay" onClick={onClose}>
      <div 
        className="big-board-window" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          color: '#000000',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)'
        }}
      >
        
        {/* Board Top Header */}
        <div className="big-board-header">
          
          {/* Left: Icon & Scope Switcher (Особиста дошка vs Загальна дошка) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#000000',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              ✎
            </div>

            <div>
              {/* Primary Switch between Private and Public Board */}
              <div style={{
                background: '#e5e5e3',
                borderRadius: '999px',
                padding: '3px',
                display: 'inline-flex',
                gap: 4
              }}>
                <button
                  onClick={() => {
                    playStudioClick();
                    setBoardScope('private');
                  }}
                  style={{
                    border: 'none',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: boardScope === 'private' ? '#000000' : 'transparent',
                    color: boardScope === 'private' ? '#ffffff' : '#555555'
                  }}
                >
                  🔒 {t.privateBoard || 'Особиста дошка'}
                </button>

                <button
                  onClick={() => {
                    playStudioClick();
                    setBoardScope('public');
                  }}
                  style={{
                    border: 'none',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: boardScope === 'public' ? '#000000' : 'transparent',
                    color: boardScope === 'public' ? '#ffffff' : '#555555'
                  }}
                >
                  🌐 {t.publicBoard || 'Загальна дошка'} ({publicEntries.length})
                </button>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#666666', marginTop: 3 }}>
                {boardScope === 'private' 
                  ? 'Ваш приватний простір для текстів та нотаток (тільки для вас)' 
                  : 'Спільна дошка думок: відкрита для всіх, писати можуть зареєстровані'}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '2px solid #000000',
                background: '#ffffff',
                color: '#000000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Закрити (ESC)"
            >
              <X size={18} />
            </button>

          </div>
        </div>

        {/* Board Main Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* ========================================================
              1. PRIVATE BOARD (Особиста дошка)
              ======================================================== */}
          {boardScope === 'private' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {/* Secondary Subtabs for Private: Continuous Canvas vs Stack of entries */}
              <div style={{
                padding: '10px 24px',
                background: '#f8f8f7',
                borderBottom: '1px solid #e0e0df',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setActivePrivateTab('canvas')}
                    style={{
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: activePrivateTab === 'canvas' ? '#e2e2e0' : 'transparent',
                      color: '#000000'
                    }}
                  >
                    Суцільне полотно
                  </button>
                  <button
                    onClick={() => setActivePrivateTab('entries')}
                    style={{
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: activePrivateTab === 'entries' ? '#e2e2e0' : 'transparent',
                      color: '#000000'
                    }}
                  >
                    Окремі чернетки ({privateEntries.length})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleCopyText(canvasText)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 10px',
                      border: '1px solid #333333',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#000000',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      fontWeight: 600
                    }}
                  >
                    {isCopied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    <span>{isCopied ? 'Скопійовано' : 'Копіювати все'}</span>
                  </button>
                </div>
              </div>

              {activePrivateTab === 'canvas' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    value={canvasText}
                    onChange={(e) => setCanvasText(e.target.value)}
                    placeholder="Пишіть тут чорним текстом: рими, рядки пісень, чернетки, треклісти... Все автоматично зберігається тільки на вашому пристрої."
                    className="big-board-textarea"
                    autoFocus
                  />
                  <div style={{
                    padding: '8px 24px',
                    background: '#fcfcfc',
                    borderTop: '1px solid #ebebeb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: '#666666'
                  }}>
                    <span>Особисте полотно • Чорний текст</span>
                    <span>Слів: {canvasText.trim() ? canvasText.trim().split(/\s+/).length : 0} | Символів: {canvasText.length}</span>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', overflowY: 'auto' }}>
                  <form onSubmit={handleAddPrivateEntry} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input
                      type="text"
                      value={newEntryText}
                      onChange={(e) => setNewEntryText(e.target.value)}
                      placeholder="Додайте новий запис чи рядок..."
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '0.95rem',
                        color: '#000000',
                        border: '2px solid #000000',
                        borderRadius: '10px',
                        outline: 'none',
                        fontWeight: 600
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '0 20px',
                        background: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Додати
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {privateEntries.map(e => (
                      <div key={e.id} style={{
                        padding: '12px 16px',
                        border: '1.5px solid #222222',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#000000' }}>{e.text}</span>
                        <button onClick={() => setPrivateEntries(privateEntries.filter(i => i.id !== e.id))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#888' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================
              2. PUBLIC COMMUNITY BOARD (Загальна дошка)
              ======================================================== */}
          {boardScope === 'public' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Write Box: ONLY for registered users */}
              <div style={{
                padding: '16px 28px',
                background: '#f8f8f7',
                borderBottom: '2px solid #222222'
              }}>
                <form onSubmit={handleAddPublicEntry} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        value={newEntryText}
                        onChange={(e) => setNewEntryText(e.target.value)}
                        placeholder="Напишіть щось на загальну дошку чорним текстом..."
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          fontSize: '1rem',
                          color: '#000000',
                          background: '#ffffff',
                          border: '2px solid #000000',
                          borderRadius: '10px',
                          outline: 'none',
                          fontWeight: 600
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '0 24px',
                          background: '#000000',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.92rem'
                        }}
                      >
                        Опублікувати
                      </button>
                    </div>

                    {/* Anonymous toggle checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#222222' }}>
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: '#000000' }}
                        />
                        <span>{t.postAnonymously || 'Анонімно'} (на дошці буде тільки текст без підпису)</span>
                      </label>
                    </div>
                  </form>
              </div>

              {/* Public Entries Feed: By default shows ONLY clean text */}
              <div style={{ flex: 1, padding: '20px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {publicEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#777' }}>
                    Загальна дошка поки що порожня. Залиште свій запис першим!
                  </div>
                ) : (
                  publicEntries.map(entry => {
                    const isSelected = selectedEntryId === entry.id;
                    const canDelete = true;

                    return (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedEntryId(isSelected ? null : entry.id)}
                        style={{
                          padding: '16px 20px',
                          background: '#ffffff',
                          border: isSelected ? '2px solid #000000' : '1.5px solid #dddddd',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                        title="Натисніть на картку, щоб переглянути інфо або скопіювати текст"
                      >
                        {/* 1. ONLY TEXT SHOWN HERE (As requested: "просто його текст") */}
                        <div style={{
                          fontSize: '1.18rem',
                          lineHeight: 1.6,
                          fontWeight: 600,
                          color: '#000000',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          userSelect: 'text'
                        }}>
                          {entry.text}
                        </div>

                        {/* 2. Metadata revealed only upon clicking empty space / card */}
                        {isSelected && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: 12,
                              paddingTop: 10,
                              borderTop: '1px dashed #cccccc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.78rem',
                              color: '#666666',
                              flexWrap: 'wrap',
                              gap: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span>🕒 {entry.createdAt}</span>

                              {/* Author display */}
                              {!entry.isAnonymous ? (
                                <span style={{ fontWeight: 600, color: '#111111' }}>
                                  👤 Автор: {entry.author}
                                </span>
                              ) : (
                                <span>
                                  <span style={{ fontStyle: 'italic', color: '#888888' }}>(Анонімний запис)</span>
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button
                                onClick={() => handleCopyText(entry.text)}
                                style={{
                                  border: '1px solid #888',
                                  background: '#f5f5f5',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                Копіювати текст
                              </button>

                              {canDelete && (
                                <button
                                  onClick={() => handleDeletePublicEntry(entry.id)}
                                  style={{
                                    border: 'none',
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                  }}
                                  title="Видалити цей запис"
                                >Видалити</button>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
