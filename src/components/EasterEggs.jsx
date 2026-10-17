import React, { useEffect } from 'react';
import { playLvivBoom, playSixSevenPop } from '../utils/soundEffects';

const LVIV_RAPPERS = [
  // User Requested Full Lviv Hip-Hop All-Stars
  { name: 'Clonnex', sub: 'Cyber-Trap / 032', border: '#ec4899', text: '#fdf2f8' },
  { name: '032nimble', sub: '032 Sound', border: '#06b6d4', text: '#cffafe' },
  { name: 'G Grizzie', sub: 'Львівський Вайб', border: '#f59e0b', text: '#fef3c7' },
  { name: 'OTOY', sub: 'Околофронт', border: '#ef4444', text: '#fee2e2' },
  { name: 'Паліндром', sub: 'Стіни Мають Вуха', border: '#10b981', text: '#d1fae5' },
  { name: 'Гоня', sub: 'Глава 94', border: '#6366f1', text: '#e0e7ff' },
  { name: 'Рома Майк', sub: 'Майк', border: '#10b981', text: '#d1fae5' },
  { name: 'Довгий Пес', sub: 'Kickit Records / 032', border: '#f59e0b', text: '#fef3c7' },
  { name: 'Джонні Дивний', sub: 'Ціна Ритму', border: '#c026d3', text: '#fdf4ff' },
  { name: 'Стук', sub: 'Underground Lemberg', border: '#8b5cf6', text: '#ede9fe' },
  { name: 'Білий Бо', sub: '032 Flow', border: '#3b82f6', text: '#dbeafe' },
  { name: 'Шершень', sub: 'Шершень / 032', border: '#eab308', text: '#fef9c3' },
  { name: 'Levyy MC', sub: 'Місто Лева', border: '#f97316', text: '#ffedd5' },
  { name: 'ХАС', sub: 'ХАС / R&B Trap', border: '#ef4444', text: '#fee2e2' },
  { name: 'VovaZIL\'Vova', sub: 'Вова зі Львова / Легенда', border: '#14b8a6', text: '#ccfbf1' },
  { name: 'Zombo', sub: 'Zombo Records', border: '#6366f1', text: '#e0e7ff' },
  { name: 'Апатія (Apatia)', sub: 'Sad Wave', border: '#a855f7', text: '#f3e8ff' },
  { name: 'Сонніум (Sonnium)', sub: 'Sonnium Beat', border: '#0ea5e9', text: '#e0f2fe' },
  { name: 'Xarakter', sub: 'Характер', border: '#84cc16', text: '#f7fee7' },
  { name: 'Глава 94', sub: 'Культ / Гоня & Степан', border: '#f43f5e', text: '#ffe4e6' },
  { name: 'Ціна Ритму', sub: 'Західний Кач', border: '#a855f7', text: '#fae8ff' },
  { name: 'Аппекс', sub: 'Сонний Львів / Kickit', border: '#eab308', text: '#fef9c3' },
  { name: 'Zbaraski', sub: 'Божественний Вайб', border: '#3b82f6', text: '#dbeafe' },
  { name: 'Polamav', sub: 'Качає Тіло', border: '#f43f5e', text: '#ffe4e6' },
  { name: 'Ванпанчмен', sub: 'Удар в Біт', border: '#f97316', text: '#ffedd5' },
  { name: 'PVNCH', sub: 'Північ / Захід', border: '#94a3b8', text: '#f8fafc' },
  { name: 'Joint Люстра', sub: 'Львівський Фанк', border: '#eab308', text: '#fef08a' },
  { name: 'Кашляючий Ед', sub: 'Перекладний Кашель', border: '#818cf8', text: '#e0e7ff' },
  { name: 'Свій Формат', sub: 'Oldschool Lemberg', border: '#14b8a6', text: '#ccfbf1' },
  { name: 'Kickit Records', sub: 'Lviv Hip-Hop Hub', border: '#c084fc', text: '#f5f3ff' },
  { name: '032 UA', sub: 'Місто Лева на Бітах', border: '#06b6d4', text: '#cffafe' }
];

// Open Palm SVG Icon (Fingers spread, palm facing forward)
function OpenPalmIcon({ size = 120, color = 'var(--accent)' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="currentColor" 
      style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.65))', color }}
    >
      {/* Palm body */}
      <path d="M 28 46 C 28 35, 32 32, 36 32 C 40 32, 42 36, 42 46 L 42 55 L 42 26 C 42 18, 46 16, 50 16 C 54 16, 57 18, 57 26 L 57 55 L 57 22 C 57 15, 61 14, 65 14 C 69 14, 72 15, 72 22 L 72 55 L 72 30 C 72 24, 76 22, 80 22 C 84 22, 86 25, 86 31 L 86 64 C 86 78, 76 90, 60 90 L 44 90 C 28 90, 20 80, 20 68 L 20 58 C 20 52, 23 48, 28 46 Z" />
      {/* Thumb sticking out */}
      <path d="M 26 56 C 24 54, 18 52, 14 56 C 10 60, 10 66, 16 72 L 28 78 Z" />
    </svg>
  );
}

export function EasterEggsOverlay({
  activeEgg, // null | '67' | '32'
  onClose
}) {
  useEffect(() => {
    if (activeEgg === '32') {
      playLvivBoom();
      // Keep open long enough for all 31 rappers to float past top of screen smoothly
      const timer = setTimeout(() => {
        onClose();
      }, 14500);
      return () => clearTimeout(timer);
    }

    if (activeEgg === '67') {
      playSixSevenPop();
      // 3 complete rocking cycles take 2.4s
      const timer = setTimeout(() => {
        onClose();
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [activeEgg, onClose]);

  if (!activeEgg) return null;

  return (
    <>
      {/* 1. SIX SEVEN (6 7): Two open palms rocking up and down 3 times */}
      {activeEgg === '67' && (
        <div className="six-seven-overlay">
          <div className="six-seven-hand-rock-left">
            <OpenPalmIcon size={130} />
          </div>

          <div className="six-seven-badge">
            6 7
          </div>

          <div className="six-seven-hand-rock-right">
            <div style={{ transform: 'scaleX(-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <OpenPalmIcon size={130} />
            </div>
          </div>
        </div>
      )}

      {/* 2. LVIV RAPPERS (032): Centered, slow, crystal-clear stream */}
      {activeEgg === '32' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 250, overflow: 'hidden' }}>
          {LVIV_RAPPERS.map((r, i) => {
            // Center-concentrated X offsets (between -140px and +140px from screen center)
            const offsets = [
              -120, 110, -60, 130, -130, 50, -90, 120, -40, 90, 
              -110, 60, -80, 140, -50, 70, -100, 100, -70, 120,
              -40, 80, -130, 60, -90, 110, -50, 90, -110, 70, -60
            ];
            const xOffset = offsets[i % offsets.length];
            const delay = (i * 0.22).toFixed(2);
            const duration = (6.4 + (i % 3) * 0.4).toFixed(2);
            const rotStart = `${((i % 4) - 1.5) * 6}deg`;
            const rotEnd = `${((i % 5) - 2) * 8}deg`;

            return (
              <div
                key={r.name}
                className="lviv-rapper-card"
                style={{
                  left: `calc(50% + ${xOffset}px)`,
                  bottom: '-90px',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 15, 18, 0.94)',
                  color: r.text,
                  border: `2px solid ${r.border}`,
                  boxShadow: `0 14px 36px rgba(0, 0, 0, 0.8), 0 0 16px ${r.border}33`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  '--rot-start': rotStart,
                  '--rot-end': rotEnd
                }}
              >
                <span style={{ fontSize: '1.35rem' }}>🦁</span>
                <span style={{ fontSize: '1.18rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {r.name}
                </span>
                <span style={{ 
                  fontSize: '0.78rem', 
                  fontWeight: 600, 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '2px 8px', 
                  borderRadius: '999px',
                  color: 'var(--text-primary)'
                }}>
                  {r.sub}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// Wrapper for Progress Numbers (checks if output contains 67 or 32)
export function EasterNumberTrigger({
  value,
  children,
  onTriggerEgg
}) {
  const str = String(value || '');
  const is67 = str.includes('67') || str.includes('6.7') || str.includes('0.67');
  const is32 = str.includes('32') || str.includes('3.2') || str.includes('0.32');

  if (is67) {
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          onTriggerEgg('67');
        }}
        className="easter-number-prog"
        title="✋ 6 7 (ШІСТЬ СЄВЄНЬ) — Натисніть для анімації"
      >
        {children || value}
      </span>
    );
  }

  if (is32) {
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          onTriggerEgg('32');
        }}
        className="easter-number-prog"
        title="🦁 032 Львівський Реп — Натисніть для анімації"
      >
        {children || value}
      </span>
    );
  }

  return children || value;
}
