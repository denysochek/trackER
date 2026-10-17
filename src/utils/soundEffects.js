// Authentic Studio DJ Vinyl Sound Engine for trackER
// Professional Web Audio Synthesizer: Organic DJ Scratches, Vinyl Rumble, Formants & Analog Saturation

let audioCtx = null;
let scratchSampleBuffer = null;
let scratchVariationIndex = 0;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate an authentic vinyl record sample buffer with vocal formant ("Ahhhh / Fresh") + groove friction
function generateVinylSampleBuffer(ctx) {
  const sampleRate = ctx.sampleRate;
  const duration = 1.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Formant frequencies of classic hip-hop scratch vocal ("Ahhh / Check")
  // Fundamental + 10 harmonics with vocal formant resonance peaks at 780Hz, 1280Hz, 2600Hz
  const f0 = 175; // Classic low throat A2/F3 tone

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Rich harmonic spectrum
    let wave = 0;
    for (let h = 1; h <= 12; h++) {
      const freq = f0 * h;
      // Formant gain boosting around speech resonances
      const formant1 = Math.exp(-Math.pow((freq - 780) / 220, 2)) * 1.6;
      const formant2 = Math.exp(-Math.pow((freq - 1280) / 260, 2)) * 1.2;
      const formant3 = Math.exp(-Math.pow((freq - 2600) / 380, 2)) * 0.9;
      const formantBoost = 1.0 + formant1 + formant2 + formant3;

      const amp = (1.0 / Math.pow(h, 0.75)) * formantBoost;
      wave += amp * Math.sin(2 * Math.PI * freq * t + (h * 0.4));
    }

    // 45Hz Turntable direct-drive motor rumble
    const motorRumble = 0.15 * Math.sin(2 * Math.PI * 45 * t);

    // Physical vinyl groove friction (textured noise)
    const grooveNoise = (Math.random() * 2 - 1) * 0.09;

    // Occasional subtle dust pop
    const dustPop = Math.random() < 0.0015 ? (Math.random() * 0.5 - 0.25) : 0;

    let rawSample = wave * 0.18 + motorRumble + grooveNoise + dustPop;

    // Analog warm saturation / soft clipping (tanh curve) to prevent harsh digital beeps
    data[i] = Math.tanh(rawSample * 1.8);
  }

  return buffer;
}

// 1. Authentic DJ Scratch Player (Cycles through 4 genuine scratch gestures)
export function playAuthenticDJScratch(direction = 1, speedMultiplier = 1.0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!scratchSampleBuffer) {
    scratchSampleBuffer = generateVinylSampleBuffer(ctx);
  }

  scratchVariationIndex = (scratchVariationIndex + 1) % 4;
  const now = ctx.currentTime;

  const source = ctx.createBufferSource();
  source.buffer = scratchSampleBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';

  const gain = ctx.createGain();

  // Subtle natural pitch jitter
  const jitter = 0.92 + Math.random() * 0.16;
  const speed = Math.max(0.6, Math.min(2.2, speedMultiplier * jitter));

  // 4 Alternating Authentic Scratch Styles:
  switch (scratchVariationIndex) {
    case 0:
      // 1. Classic "Aawh-wick" Forward-Back Baby Scratch
      source.playbackRate.setValueAtTime(0.55 * speed, now);
      source.playbackRate.exponentialRampToValueAtTime(1.9 * speed, now + 0.05);
      source.playbackRate.exponentialRampToValueAtTime(0.4 * speed, now + 0.11);
      source.playbackRate.exponentialRampToValueAtTime(1.3 * speed, now + 0.16);

      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(2600, now + 0.07);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.16);
      filter.Q.setValueAtTime(2.8, now);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      break;

    case 1:
      // 2. Sharp "Chirp-Zipp" Cut Scratch (Crossfader tap)
      source.playbackRate.setValueAtTime(2.3 * speed, now);
      source.playbackRate.exponentialRampToValueAtTime(0.45 * speed, now + 0.09);

      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(850, now + 0.11);
      filter.Q.setValueAtTime(3.6, now);

      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      break;

    case 2:
      // 3. Deep "Chug-a-Drag" Vinyl Body Backspin
      source.playbackRate.setValueAtTime(0.38 * speed, now);
      source.playbackRate.exponentialRampToValueAtTime(1.05 * speed, now + 0.08);
      source.playbackRate.exponentialRampToValueAtTime(0.25 * speed, now + 0.18);

      filter.frequency.setValueAtTime(750, now);
      filter.frequency.exponentialRampToValueAtTime(1550, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(550, now + 0.18);
      filter.Q.setValueAtTime(2.2, now);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      break;

    case 3:
    default:
      // 4. Double "Wiki-Wiki-Wick" Flare Scrub
      source.playbackRate.setValueAtTime(1.1 * speed, now);
      source.playbackRate.exponentialRampToValueAtTime(2.1 * speed, now + 0.04);
      source.playbackRate.exponentialRampToValueAtTime(0.7 * speed, now + 0.08);
      source.playbackRate.exponentialRampToValueAtTime(1.85 * speed, now + 0.13);

      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(3400, now + 0.06);
      filter.frequency.exponentialRampToValueAtTime(1100, now + 0.14);
      filter.Q.setValueAtTime(3.2, now);

      gain.gain.setValueAtTime(0.72, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      break;
  }

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  // Offset slightly in sample for unique scratch texture every time
  const startOffset = (Math.random() * 0.5);
  source.start(now, startOffset);
  source.stop(now + 0.26);
}

// Aliases for compatibility
export const playVinylScratch = playAuthenticDJScratch;

// 2. Vinyl disc fly-off screech
export function playVinylFlyOff() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  // Screeching spin-out needle drag
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1100, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.48);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, now);
  filter.frequency.exponentialRampToValueAtTime(350, now + 0.48);

  gain.gain.setValueAtTime(0.65, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.52);
}

// 3. Rolling wheel friction sound on floor
export function playRollingSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 1.0;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * Math.sin(i / 130);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, now);
  filter.frequency.exponentialRampToValueAtTime(120, now + 0.95);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 1.02);
}

export const playDiscRoll = playRollingSound;

// 4. Snap disc back onto turntable
export function playVinylSnap() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(750, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);

  gain.gain.setValueAtTime(0.55, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.11);
}

// 5. Lviv Hip-Hop 808 Sub-Bass Boom
export function playLvivBoom() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(145, now);
  osc.frequency.exponentialRampToValueAtTime(36, now + 1.25);

  gain.gain.setValueAtTime(0.75, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.5);
}

// 6. Six-Seven 808 Pop & Balance Swing
export function playSixSevenPop() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(85, now + 0.38);

  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.45);
}

// 7. Tactile studio click for checkboxes
export function playStudioClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1500, now);
  osc.frequency.exponentialRampToValueAtTime(450, now + 0.03);

  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}
