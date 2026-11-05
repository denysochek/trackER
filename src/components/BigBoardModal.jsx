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
  Lock,
  Edit2,
  FolderPlus,
  Layout,
  Pin
} from 'lucide-react';
import { playStudioClick } from '../utils/soundEffects';

export function BigBoardModal({
  isOpen,
  onClose,
  currentUser,
  collabEngine,
  t
}) {
  if (!isOpen) return null;

  // Board scope: 'private' (personal workspaces) vs 'public' (shared community board)
  const [boardScope, setBoardScope] = useState('private');

  // 7. MULTI-BOARD WORKSPACES MANAGEMENT
  // Custom boards list: [{ id: 'b-1', name: 'Чернетки приспівів', content: '...', createdAt: '...' }]
  const [customBoards, setCustomBoards] = useState(() => {
    try {
      const saved = localStorage.getItem('tracker_custom_boards');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Active board ID: 'main' is the permanently pinned main continuous canvas (cannot be deleted)
  const [activeBoardId, setActiveBoardId] = useState('main');

  // 1. Pinned Main Continuous Canvas
  const [mainCanvasText, setMainCanvasText] = useState(() => {
    return localStorage.getItem('tracker_big_board_canvas') || '';
  });

  // 2. Private Personal Stack (Quick Sticky Notes)
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
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Board Renaming Modal/Prompt State
  const [isEditingBoardName, setIsEditingBoardName] = useState(false);
  const [editingBoardTitle, setEditingBoardTitle] = useState('');

  // Check if current user is admin
  const isAdmin = currentUser && (
    currentUser.username === 'dionisii' ||
    currentUser.username.toLowerCase() === 'admin' ||
    currentUser.isAdmin === true
  );

  // Persist main canvas
  useEffect(() => {
    localStorage.setItem('tracker_big_board_canvas', mainCanvasText);
  }, [mainCanvasText]);

  // Persist custom boards
  useEffect(() => {
    localStorage.setItem('tracker_custom_boards', JSON.stringify(customBoards));
  }, [customBoards]);

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

  // Active Board Content Helper
  const getCurrentBoardContent = () => {
    if (activeBoardId === 'main') {
      return mainCanvasText;
    }
    const found = customBoards.find(b => b.id === activeBoardId);
    return found ? found.content : '';
  };

  const handleCurrentBoardTextChange = (newVal) => {
    if (activeBoardId === 'main') {
      setMainCanvasText(newVal);
      if (collabEngine) {
        collabEngine.broadcastAction('SYNC_BOARD_CANVAS', { text: newVal });
      }
    } else {
      setCustomBoards(customBoards.map(b => {
        if (b.id === activeBoardId) {
          return { ...b, content: newVal, updatedAt: new Date().toISOString() };
        }
        return b;
      }));
    }
  };

  // 7. CREATE NEW BOARD
  const handleCreateBoard = () => {
    playStudioClick();
    const defaultName = `${t.newBoardPrefix || 'Дошка'} ${customBoards.length + 2}`;
    const newBoard = {
      id: `board-${Date.now()}`,
      name: defaultName,
      content: '',
      createdAt: new Date().toISOString()
    };
    setCustomBoards([...customBoards, newBoard]);
    setActiveBoardId(newBoard.id);
  };

  // 7. RENAME CURRENT BOARD
  const handleStartRename = () => {
    if (activeBoardId === 'main') return;
    const current = customBoards.find(b => b.id === activeBoardId);
    if (!current) return;
    setEditingBoardTitle(current.name);
    setIsEditingBoardName(true);
  };

  const handleSaveRename = (e) => {
    e?.preventDefault();
    if (!editingBoardTitle.trim()) {
      setIsEditingBoardName(false);
      return;
    }
    setCustomBoards(customBoards.map(b => {
      if (b.id === activeBoardId) {
        return { ...b, name: editingBoardTitle.trim() };
      }
      return b;
    }));
    setIsEditingBoardName(false);
  };

  // 7. DELETE BOARD (Main is protected and cannot be deleted)
  const handleDeleteBoard = (boardId, e) => {
    e?.stopPropagation();
    if (boardId === 'main') {
      alert(t.mainBoardCannotBeDeleted || 'Головне суцільне полотно прикріплене за замовчуванням і не може бути видалене!');
      return;
    }
    if (window.confirm(t.deleteBoardConfirm || 'Видалити цю дошку?')) {
      playStudioClick();
      const filtered = customBoards.filter(b => b.id !== boardId);
      setCustomBoards(filtered);
      if (activeBoardId === boardId) {
        setActiveBoardId('main');
      }
    }
  };

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
    if (!currentUser) return;
    if (!newEntryText.trim()) return;

    playStudioClick();
    const entry = {
      id: `pub-${Date.now()}`,
      text: newEntryText.trim(),
      author: currentUser.username,
      isAnonymous: !!isAnonymous,
      createdAt: new Date().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    setPublicEntries([entry, ...publicEntries]);
    setNewEntryText('');
    setIsAnonymous(false);

    if (collabEngine) {
      collabEngine.broadcastAction('NEW_PUBLIC_ENTRY', entry);
    }
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
          color: '#1a1a1a',
          maxWidth: '92vw',
          width: 1200,
          height: '88vh',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1.5px solid #000000'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '2px solid #000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          {/* Left: Brand & Scope switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                BIG<span style={{ background: '#000000', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', marginLeft: 2 }}>BOARD</span>
              </span>
            </div>

            <div style={{ width: 1, height: 24, background: '#cccccc' }} />

            {/* Scope Switcher: Private Spaces vs Community Public Board */}
            <div>
              <div style={{
                background: '#eeeeee',
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
                  🔒 {t.privateBoard || 'Особисті дошки'}
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
                {boardScope === 'private' ? (t.privateBoardDesc || 'Ваші персональні простори, дошки для концептів і текстів') : (t.publicBoardDesc || 'Спільна дошка думок: відкрита для всіх')}
              </div>
            </div>
          </div>

          {/* Right: Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              title={t.closeEsc || "Закрити (ESC)"}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Board Main Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* ========================================================
              1. {t.privateBoardTitle || "Особисті дошки"}
              ======================================================== */}
          {boardScope === 'private' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {/* 7. Board Workspaces Bar: Permanently Pinned Main Canvas + Custom Boards + Create Board Button */}
              <div style={{
                padding: '8px 24px',
                background: '#f4f4f3',
                borderBottom: '1px solid #dcdcdb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#666666', textTransform: 'uppercase', marginRight: 4 }}>
                    {t.boards || 'Дошки'}:
                  </span>

                  {/* 1. MAIN PINNED BOARD (Cannot be deleted) */}
                  <button
                    onClick={() => {
                      playStudioClick();
                      setActiveBoardId('main');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      border: activeBoardId === 'main' ? '2px solid #000000' : '1px solid #cccccc',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: activeBoardId === 'main' ? 800 : 500,
                      cursor: 'pointer',
                      background: activeBoardId === 'main' ? '#000000' : '#ffffff',
                      color: activeBoardId === 'main' ? '#ffffff' : '#222222'
                    }}
                    title={t.mainPinnedDesc || "Головне суцільне полотно (закріплено)"}
                  >
                    <Pin size={11} color={activeBoardId === 'main' ? '#eab308' : '#888888'} />
                    <span>{t.mainCanvas || 'Головне полотно'}</span>
                  </button>

                  {/* CUSTOM USER BOARDS (Renameable & Deleteable) */}
                  {customBoards.map(board => {
                    const isActive = activeBoardId === board.id;
                    return (
                      <div
                        key={board.id}
                        onClick={() => {
                          playStudioClick();
                          setActiveBoardId(board.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: isActive ? '2px solid #000000' : '1px solid #cccccc',
                          padding: '4px 8px 4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          background: isActive ? '#000000' : '#ffffff',
                          color: isActive ? '#ffffff' : '#222222'
                        }}
                      >
                        <Layout size={12} color={isActive ? '#38bdf8' : '#888888'} />
                        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {board.name}
                        </span>

                        {/* Delete Custom Board Icon */}
                        <button
                          onClick={(e) => handleDeleteBoard(board.id, e)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: isActive ? '#f87171' : '#999999',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          title={t.deleteBoard || "Видалити дошку"}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}

                  {/* 7. Create New Custom Board Button */}
                  <button
                    onClick={handleCreateBoard}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      border: '1.5px dashed #555555',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'transparent',
                      color: '#333333'
                    }}
                    title={t.createNewBoard || "Створити власну нову дошку"}
                  >
                    <FolderPlus size={12} />
                    <span>{t.newBoard || '+ Дошка'}</span>
                  </button>
                </div>

                {/* Right: Board controls (Rename, Copy, Tabs) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {activeBoardId !== 'main' && (
                    <button
                      onClick={handleStartRename}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        border: '1px solid #999999',
                        borderRadius: '6px',
                        background: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title={t.renameBoard || "Перейменувати цю дошку"}
                    >
                      <Edit2 size={11} />
                      <span>{t.rename || 'Перейменувати'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyText(getCurrentBoardContent())}
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
                    <span>{isCopied ? (t.summaryCopied || 'Скопійовано!') : (t.copyAll || 'Копіювати')}</span>
                  </button>
                </div>
              </div>

              {/* Inline Board Rename Form Popup */}
              {isEditingBoardName && (
                <form
                  onSubmit={handleSaveRename}
                  style={{
                    background: '#ffffff',
                    borderBottom: '1px solid #dddddd',
                    padding: '8px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t.boardTitleLabel || "Назва дошки"}:</span>
                  <input
                    type="text"
                    value={editingBoardTitle}
                    onChange={(e) => setEditingBoardTitle(e.target.value)}
                    autoFocus
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1.5px solid #000000',
                      fontSize: '0.8rem',
                      width: 220
                    }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '3px 10px' }}>
                    {t.save || 'Зберегти'}
                  </button>
                  <button type="button" onClick={() => setIsEditingBoardName(false)} className="btn btn-ghost btn-sm">
                    {t.cancel || 'Скасувати'}
                  </button>
                </form>
              )}

              {/* Board Canvas Workspace Textarea */}
              <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={getCurrentBoardContent()}
                  onChange={(e) => handleCurrentBoardTextChange(e.target.value)}
                  placeholder={
                    activeBoardId === 'main'
                      ? (t.mainCanvasPlaceholder || "Головне суцільне полотно альбому...\nПишіть тексти пісень, концепт, структуру та ідеї треків.")
                      : (t.customBoardPlaceholder || "Текстовий простір цієї дошки...")
                  }
                  style={{
                    flex: 1,
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '1.05rem',
                    lineHeight: '1.7',
                    background: 'transparent',
                    color: '#111111'
                  }}
                />
              </div>

            </div>
          )}

          {/* ========================================================
              2. {t.publicBoardTitle || "Загальна дошка спільноти"}
              ======================================================== */}
          {boardScope === 'public' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
              
              {/* Add Entry Input for Community Board */}
              <div style={{ padding: '16px 24px', background: '#ffffff', borderBottom: '1px solid #e0e0df' }}>
                <form onSubmit={handleAddPublicEntry} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea
                    value={newEntryText}
                    onChange={(e) => setNewEntryText(e.target.value)}
                    placeholder={currentUser ? (t.publicEntryPlaceholder || "Напишіть коментар, ідею чи враження для спільноти...") : (t.loginToPostPublic || "Увійдіть в акаунт, щоб залишати записи на спільній дошці")}
                    disabled={!currentUser}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #cccccc',
                      outline: 'none',
                      fontSize: '0.88rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                      background: currentUser ? '#ffffff' : '#f0f0f0'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer', color: '#555555' }}>
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        disabled={!currentUser}
                      />
                      <span>{t.postAnonymously || "Анонімно (сховати мій нікнейм)"}</span>
                    </label>

                    <button
                      type="submit"
                      disabled={!currentUser || !newEntryText.trim()}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 16px', fontWeight: 700 }}
                    >
                      <Plus size={13} />
                      <span>{t.publishEntry || "Опублікувати"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed of Public Entries */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {publicEntries.map(entry => (
                  <div
                    key={entry.id}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e5e5e5',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700 }}>
                        <User size={13} color="#000000" />
                        <span>{entry.isAnonymous ? (t.anonymousProducer || "Анонімний продюсер") : `@${entry.author}`}</span>
                        {entry.author === 'dionisii' && (
                          <span style={{ fontSize: '0.62rem', background: '#eab308', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', color: '#888888' }}>{entry.createdAt}</span>
                        {(isAdmin || (currentUser && currentUser.username === entry.author)) && (
                          <button
                            onClick={() => handleDeletePublicEntry(entry.id)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                            title={t.deleteEntry || "Видалити"}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: '#222222' }}>
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
