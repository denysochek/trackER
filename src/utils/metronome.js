// High precision Web Audio Metronome with Ableton Live and FL Studio Sound Presets

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
 * @param {'ableton'|'fl'} preset - Sound design preset
 * @param {number} [time] - Web Audio precise time (defaults to currentTime)
 */
export function playMetronomeClick(isAccent = false, preset = 'ableton', time = null) {
  const ctx = getMetronomeAudioContext();
  if (!ctx) return;

  const t = time !== null ? Math.max(time, ctx.currentTime) : ctx.currentTime;

  if (preset === 'fl') {
    // FL STUDIO METRONOME PRESET
    // Distinct woodblock / synth percussion blip
    // Accent: ~2000Hz -> 1000Hz fast pitch drop + subtle pop
    // Non-accent: ~1200Hz -> 600Hz
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
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);

  } else {
    // ABLETON LIVE METRONOME PRESET
    // Classic Sine blip with very sharp click transient
    // Accent: High pure sine ~1500Hz, rapid envelope (approx 15-20ms)
    // Non-accent: Lower tone ~750Hz, slightly softer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isAccent ? 1600 : 800;
    osc.frequency.setValueAtTime(freq, t);

    // Initial click spike
    gain.gain.setValueAtTime(isAccent ? 0.9 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (isAccent ? 0.03 : 0.025));

    osc.connect(gain);
    gain.connect(ctx.destination);

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
    this.preset = 'ableton'; // 'ableton' | 'fl'
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
    this.preset = newPreset === 'fl' ? 'fl' : 'ableton';
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
    playMetronomeClick(isAccent, this.preset, time);

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

