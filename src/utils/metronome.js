// High precision Web Audio Metronome with authentic DAW sound modeling:
// - Live: Default Ableton pure sine blip / beep (2000Hz accent, 1000Hz regular, ultra-short clean)
// - Fruity: Default FL Studio woodblock click / клацаюче дерево (resonant bandpassed dual click)
// - Knock: Logic Pro Klopfgeist style punchy low wood knock
// - Cymbal: 909-style sizzle / closed hat
// - 808 Bell: Authentic Roland TR-808 cowbell, tuned dual square waves with natural decay

let audioCtx = null;

function getMetronomeAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single metronome click at an exact scheduled time (or right now)
 * @param {boolean} isAccent - Whether this is the downbeat (first beat of the bar)
 * @param {'live'|'fruity'|'knock'|'logic'|'cymbal'|'cowbell'} preset - Sound design preset
 * @param {number} [time] - Web Audio precise time (defaults to currentTime)
 * @param {number} [volume] - Volume multiplier (0.0 to 1.5, default 1.0)
 */
export function playMetronomeClick(isAccent = false, preset = 'live', time = null, volume = 1.0) {
  const ctx = getMetronomeAudioContext();
  if (!ctx) return;

  const t = time !== null ? Math.max(time, ctx.currentTime) : ctx.currentTime;
  const vol = Math.max(0, Math.min(1.5, Number(volume) || 1.0));

  // Master gain for this click according to volume setting (up to 150%)
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(vol, t);
  masterGain.connect(ctx.destination);

  if (preset === 'fruity') {
    // FRUITY (FL STUDIO DEFAULT CLICK):
    // Автентичне клацаюче сухе дерево (Woodblock):
    // 1. Різкий дерев'яний транзієнт (клацання)
    // 2. Резонансний дерев'яний корпус із швидким затуханням (~15-22ms)
    const baseFreq = isAccent ? 2400 : 1600;

    // Body oscillator (Wood tap)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(baseFreq, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, t + 0.016);

    bodyGain.gain.setValueAtTime(isAccent ? 0.95 : 0.75, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

    // Click snap transient (Різкий "клац")
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(isAccent ? 4800 : 3400, t);
    snapOsc.frequency.exponentialRampToValueAtTime(800, t + 0.006);

    snapGain.gain.setValueAtTime(isAccent ? 0.9 : 0.7, t);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.007);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterGain);

    snapOsc.connect(snapGain);
    snapGain.connect(masterGain);

    bodyOsc.start(t);
    snapOsc.start(t);
    bodyOsc.stop(t + 0.022);
    snapOsc.stop(t + 0.01);

  } else if (preset === 'knock' || preset === 'logic') {
    // KNOCK (LOGIC PRO KLOPFGEIST):
    // Низькочастотний щільний глухий стук без високого пікання
    // Акцент: ~460Hz -> 110Hz, щільний бас-стук
    // Звичайний біт: ~310Hz -> 90Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = isAccent ? 520 : 340;
    const endFreq = isAccent ? 140 : 95;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.035);

    gain.gain.setValueAtTime(isAccent ? 1.0 : 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.05);

  } else if (preset === 'cowbell') {
    // 808 BELL:
    // Класичний TR-808 Cowbell — дві налаштовані квадратні хвилі
    // (540Hz + 800Hz), пропущені через вузький bandpass фільтр.
    // Трохи довший ніж супер-сухий клік (приблизно ~90-110ms),
    // але короткий і чіткий (decay ~0.09s).
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();

    osc1.type = 'square';
    osc2.type = 'square';

    // 808 Cowbell fundamental frequencies: 540Hz and 800Hz
    const f1 = isAccent ? 620 : 540;
    const f2 = isAccent ? 920 : 800;
    osc1.frequency.setValueAtTime(f1, t);
    osc2.frequency.setValueAtTime(f2, t);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(isAccent ? 1080 : 920, t);
    bandpass.Q.setValueAtTime(3.2, t);

    const decayDuration = isAccent ? 0.11 : 0.09; // Зроблено на каплю довшим (відчувається як ковбел)
    gain.gain.setValueAtTime(isAccent ? 0.85 : 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decayDuration);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + decayDuration + 0.01);
    osc2.stop(t + decayDuration + 0.01);

  } else if (preset === 'cymbal') {
    // CYMBAL / HI-HAT:
    // Швидкий хет / тарілка з високою фільтрацією
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isAccent ? 7000 : 8500, t);

    const gain = ctx.createGain();
    const duration = isAccent ? 0.065 : 0.038;
    gain.gain.setValueAtTime(isAccent ? 0.85 : 0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.start(t);
    noiseSource.stop(t + duration + 0.01);

  } else {
    // LIVE (ABLETON DEFAULT BEEP / CLICK):
    // Дефолтний Ableton метроном — чистий пікаючий сінус високої частоти:
    // Downbeat (accent): ~2000Hz чистий пік
    // Regular beats: ~1000Hz чистий пік
    // Дуже короткий огинач (~20ms), чистий цифровий BEEP
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isAccent ? 2040 : 1020; // Точні частоти Ableton Live click
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(isAccent ? 0.95 : 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (isAccent ? 0.024 : 0.018));

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.03);
  }
}

/**
 * Metronome Engine class using requestAnimationFrame + Web Audio lookahead scheduling
 * to guarantee rock-solid timing without drift.
 */
export class MetronomeEngine {
  constructor(onBeatTick) {
    this.bpm = 120;
    this.preset = 'live'; // 'live' | 'fruity' | 'knock' | 'cymbal' | 'cowbell'
    this.volume = 1.0; // 0.0 to 1.5 (150%)
    this.isPlaying = false;
    this.currentBeat = 0; // 0, 1, 2, 3
    this.beatsPerBar = 4;
    this.onBeatTick = onBeatTick; // Callback for UI animation

    this.nextBeatTime = 0.0;
    this.timerWorker = null;
    this.lookaheadMs = 25.0; // Check interval
    this.scheduleAheadTime = 0.1; // Schedule audio 100ms in advance
    this.intervalId = null;
  }

  setBpm(newBpm) {
    this.bpm = Math.max(30, Math.min(300, Number(newBpm) || 120));
  }

  setPreset(newPreset) {
    const valid = ['live', 'fruity', 'knock', 'logic', 'cymbal', 'cowbell'];
    this.preset = valid.includes(newPreset) ? (newPreset === 'logic' ? 'knock' : newPreset) : 'live';
  }

  setVolume(newVolume) {
    this.volume = Math.max(0, Math.min(1.5, Number(newVolume) || 1.0));
  }

  start() {
    if (this.isPlaying) return;
    const ctx = getMetronomeAudioContext();
    if (!ctx) return;

    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextBeatTime = ctx.currentTime + 0.05;

    this.intervalId = setInterval(() => this.scheduler(), this.lookaheadMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  scheduler() {
    const ctx = getMetronomeAudioContext();
    if (!ctx || !this.isPlaying) return;

    while (this.nextBeatTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleBeat(this.currentBeat, this.nextBeatTime);
      this.advanceBeat();
    }
  }

  scheduleBeat(beatNumber, time) {
    const isAccent = beatNumber === 0;
    playMetronomeClick(isAccent, this.preset, time, this.volume);

    if (this.onBeatTick) {
      const delayMs = Math.max(0, (time - (audioCtx ? audioCtx.currentTime : 0)) * 1000);
      setTimeout(() => {
        if (this.isPlaying && this.onBeatTick) {
          this.onBeatTick(beatNumber, isAccent);
        }
      }, delayMs);
    }
  }

  advanceBeat() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextBeatTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
  }
}
