// High precision Web Audio Metronome with Live, Fruity, Logic-style Click, Hi-Hat / Cymbal & Cowbell Presets

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
 * @param {'live'|'fruity'|'logic'|'cymbal'|'cowbell'} preset - Sound design preset
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
    // FRUITY (FL-style)
    // Woodblock / synth percussion blip with pitch drop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const startFreq = isAccent ? 2200 : 1350;
    const endFreq = isAccent ? 900 : 550;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.035);

    gain.gain.setValueAtTime(isAccent ? 0.85 : 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.05);

  } else if (preset === 'logic') {
    // LOGIC-STYLE LOW WOOD CLICK / LOW-FREQ KNOCK (Низькочастотний стук / Logic Klopfgeist)
    // Downbeat: punchy low wood click around 800Hz dropping to 180Hz with sine body
    // Regular beat: warm low knock around 480Hz dropping to 140Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = isAccent ? 920 : 520;
    const endFreq = isAccent ? 220 : 130;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.04);

    gain.gain.setValueAtTime(isAccent ? 0.95 : 0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.065);

  } else if (preset === 'cymbal') {
    // CYMBAL / HI-HAT (Тарілка / Відкритий або закритий хет)
    // Filtered white noise with rapid decay
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Highpass filter for crisp cymbal sizzle
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isAccent ? 6500 : 8000, t);

    const gain = ctx.createGain();
    const duration = isAccent ? 0.075 : 0.04;
    gain.gain.setValueAtTime(isAccent ? 0.85 : 0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.start(t);
    noiseSource.stop(t + duration + 0.01);

  } else if (preset === 'cowbell') {
    // 808 COWBELL STYLE (Металевий ковбелл)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(isAccent ? 840 : 540, t);
    osc2.frequency.setValueAtTime(isAccent ? 1260 : 800, t);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(isAccent ? 1000 : 700, t);
    bandpass.Q.setValueAtTime(2.5, t);

    gain.gain.setValueAtTime(isAccent ? 0.8 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.07);
    osc2.stop(t + 0.07);

  } else {
    // LIVE (Ableton-style default)
    // Classic pure Sine blip with very sharp click transient
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isAccent ? 1600 : 800;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(isAccent ? 0.9 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (isAccent ? 0.03 : 0.025));

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }
}

/**
 * Metronome Engine class using requestAnimationFrame + Web Audio lookahead scheduling
 * to guarantee rock-solid timing without drift.
 */
export class MetronomeEngine {
  constructor(onBeatTick) {
    this.bpm = 120;
    this.preset = 'live'; // 'live' | 'fruity' | 'logic' | 'cymbal' | 'cowbell'
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
    const valid = ['live', 'fruity', 'logic', 'cymbal', 'cowbell'];
    this.preset = valid.includes(newPreset) ? newPreset : 'live';
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
