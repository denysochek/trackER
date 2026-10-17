export const STAGES = [
  {
    id: "beat",
    maxPoints: 4,
    color: "var(--stage-beat)",
    badgeColor: "var(--stage-beat-bg)",
    textColor: "var(--stage-beat-text)",
    steps: [
      { id: "step_beat_demo", pts: 1 },
      { id: "step_beat_arr", pts: 1 },
      { id: "step_beat_mix", pts: 1 },
      { id: "step_beat_master", pts: 1 }
    ]
  },
  {
    id: "vocal",
    maxPoints: 4,
    color: "var(--stage-vocal)",
    badgeColor: "var(--stage-vocal-bg)",
    textColor: "var(--stage-vocal-text)",
    steps: [
      { id: "step_voc_lyrics", pts: 1 },
      { id: "step_voc_demo", pts: 1 },
      { id: "step_voc_rec", pts: 1 },
      { id: "step_voc_mix", pts: 1 }
    ]
  },
  {
    id: "visual",
    maxPoints: 2,
    color: "var(--stage-visual)",
    badgeColor: "var(--stage-visual-bg)",
    textColor: "var(--stage-visual-text)",
    steps: [
      { id: "step_vis_concept", pts: 1 },
      { id: "step_vis_final", pts: 1 }
    ]
  }
];

export const PRESET_COVERS = [
  { id: "cyan_poly", title: "Neon Poly", url: `${import.meta.env.BASE_URL}covers/demo_cyan.jpg` },
  { id: "green_sphere", title: "Acid Frequency", url: `${import.meta.env.BASE_URL}covers/demo_green.jpg` },
  { id: "dark_astral", title: "Deep Astral", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" },
  { id: "retro_grid", title: "Cyber Horizon", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80" },
  { id: "analog_tape", title: "Studio Noir", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80" }
];

export function getTrackMaxScore(track) {
  if (track && (track.type === 'instrumental' || track.type === 'skit')) {
    return 5;
  }
  return 10;
}

export function isTrackFinished(track) {
  if (!track) return false;
  return calculateTrackScore(track) >= getTrackMaxScore(track);
}

export function calculateTrackScore(track) {
  if (!track || !track.steps) return 0;
  const s = track.steps;
  const isInstrumentalOrSkit = track.type === 'instrumental' || track.type === 'skit';

  if (isInstrumentalOrSkit) {
    // 5 points total: 3 for Beat + 2 for Visual
    let beatScore = 0;
    if (s.step_beat_demo) beatScore += 1;
    if (s.step_beat_arr) beatScore += 1;
    if (s.step_beat_mix || s.step_beat_master) beatScore += 1;

    let visScore = 0;
    if (s.step_vis_concept) visScore += 1;
    if (s.step_vis_final) visScore += 1;

    return Math.min(5, Math.max(0, beatScore + visScore));
  }

  // Regular song: 10 points total (4 beat + 4 vocal + 2 visual)
  let score = 0;
  STAGES.forEach(stage => {
    stage.steps.forEach(step => {
      if (track.steps[step.id]) {
        score += step.pts;
      }
    });
  });
  return Math.min(10, Math.max(0, score));
}

export function calculateAlbumProgress(tracks) {
  if (!tracks || tracks.length === 0) return 0;
  const progressSum = tracks.reduce((acc, t) => {
    const max = getTrackMaxScore(t);
    const score = calculateTrackScore(t);
    return acc + (score / max);
  }, 0);
  return Math.round((progressSum / tracks.length) * 100);
}

export function calculateStageBreakdown(tracks) {
  if (!tracks || tracks.length === 0) {
    return { beat: 0, vocal: 0, visual: 0 };
  }

  let beatPts = 0, beatMax = tracks.length * 4;
  let vocPts = 0, vocMax = tracks.length * 4;
  let visPts = 0, visMax = tracks.length * 2;

  tracks.forEach(track => {
    const s = track.steps || {};
    if (s.step_beat_demo) beatPts++;
    if (s.step_beat_arr) beatPts++;
    if (s.step_beat_mix) beatPts++;
    if (s.step_beat_master) beatPts++;

    if (s.step_voc_lyrics) vocPts++;
    if (s.step_voc_demo) vocPts++;
    if (s.step_voc_rec) vocPts++;
    if (s.step_voc_mix) vocPts++;

    if (s.step_vis_concept) visPts++;
    if (s.step_vis_final) visPts++;
  });

  return {
    beat: Math.round((beatPts / beatMax) * 100),
    vocal: Math.round((vocPts / vocMax) * 100),
    visual: Math.round((visPts / visMax) * 100)
  };
}



export const INITIAL_ALBUMS = [
  {
    id: "album-neon-noir",
    title: "NEON HORIZON",
    artist: "CYBERWAVE & METAPROD",
    genre: "Electronic / Cyber-Trap",
    targetDate: "2026-12-25",
    coverUrl: `${import.meta.env.BASE_URL}covers/demo_cyan.jpg`,
    concept: "## Концепція альбому\n\nФутуристична нічна подорож крізь неонове кібер-місто. Поєднання аналогових синтезаторів Moog, агресивних 808-х басів та кінематографічного вокалу з автотюном.\n\n- **Ключовий настрій**: Глибокий, енергійний, нічний драйв\n- **Референси звучання**: Travis Scott, Gesaffelstein, The Weeknd (After Hours)\n- **Студійний сетап**: 48kHz / 24-bit, аналоговий майстеринг на фіналі.",
    tracks: [
      {
        id: "tr-1",
        title: "Midnight Drift",
        bpm: 138,
        key: "F# Minor",
        demoUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        notes: "Головний сингл альбому. Вокал записано на Neumann U87. Фінальний мікс готовий, арт узгоджено для Spotify Canvas.",
        steps: {
          step_beat_demo: true,
          step_beat_arr: true,
          step_beat_mix: true,
          step_beat_master: true,
          step_voc_lyrics: true,
          step_voc_demo: true,
          step_voc_rec: true,
          step_voc_mix: true,
          step_vis_concept: true,
          step_vis_final: true
        }
      },
      {
        id: "tr-2",
        title: "Synthetic Pulse",
        bpm: 126,
        key: "A Minor",
        demoUrl: "",
        notes: "Потрібно завершити 3D-відеоряд для YouTube Visualizer та додати ділей на бек-вокали в аутро.",
        steps: {
          step_beat_demo: true,
          step_beat_arr: true,
          step_beat_mix: true,
          step_beat_master: true,
          step_voc_lyrics: true,
          step_voc_demo: true,
          step_voc_rec: true,
          step_voc_mix: true,
          step_vis_concept: true,
          step_vis_final: false
        }
      },
      {
        id: "tr-3",
        title: "Obsidian Nights (feat. LUNA)",
        bpm: 140,
        key: "C# Minor",
        demoUrl: "",
        notes: "Колаборація. Біт повністю готовий та зведений. Потрібно переписати другий куплет вокалу в студії наступного вівторка.",
        steps: {
          step_beat_demo: true,
          step_beat_arr: true,
          step_beat_mix: true,
          step_beat_master: true,
          step_voc_lyrics: true,
          step_voc_demo: true,
          step_voc_rec: false,
          step_voc_mix: false,
          step_vis_concept: true,
          step_vis_final: false
        }
      },
      {
        id: "tr-4",
        title: "Chrome Skyline",
        bpm: 130,
        key: "D Minor",
        demoUrl: "",
        notes: "Атмосферний інструментальний трек. Зведення баса потребує сайдчейн-корекції.",
        steps: {
          step_beat_demo: true,
          step_beat_arr: true,
          step_beat_mix: false,
          step_beat_master: false,
          step_voc_lyrics: true,
          step_voc_demo: false,
          step_voc_rec: false,
          step_voc_mix: false,
          step_vis_concept: false,
          step_vis_final: false
        }
      },
      {
        id: "tr-5",
        title: "Low Frequency Love",
        bpm: 95,
        key: "E Minor",
        demoUrl: "",
        notes: "R&B / Trap баладу. Демо-біт записаний, чернетка тексту є.",
        steps: {
          step_beat_demo: true,
          step_beat_arr: false,
          step_beat_mix: false,
          step_beat_master: false,
          step_voc_lyrics: true,
          step_voc_demo: false,
          step_voc_rec: false,
          step_voc_mix: false,
          step_vis_concept: false,
          step_vis_final: false
        }
      },
      {
        id: "tr-6",
        title: "Dawn Protocol (Outro)",
        bpm: 120,
        key: "F# Minor",
        demoUrl: "",
        notes: "Фінал альбому. Епічні струнні та фортепіано. Повністю готовий мастер трек.",
        steps: {
          step_beat_demo: true,
          step_beat_arr: true,
          step_beat_mix: true,
          step_beat_master: true,
          step_voc_lyrics: true,
          step_voc_demo: true,
          step_voc_rec: true,
          step_voc_mix: true,
          step_vis_concept: true,
          step_vis_final: true
        }
      }
    ]
  }
];
