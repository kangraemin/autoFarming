// Procedural Sound Effects — Web Audio API
// All sounds are generated algorithmically (no audio files needed).

let _actx = null;
let _masterGain = null;
let _sfxEnabled = true;

function getACtx() {
  if (!_actx) {
    _actx = new (window.AudioContext || window.webkitAudioContext)();
    _masterGain = _actx.createGain();
    _masterGain.gain.value = 0.35;
    _masterGain.connect(_actx.destination);
  }
  // Resume if suspended (browser autoplay policy)
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function sfxEnabled() { return _sfxEnabled; }
function setSfxEnabled(v) { _sfxEnabled = v; }

// ── Utilities ──────────────────────────────────────────────────────────────

// Create a white noise buffer (reused across calls)
let _noiseBuffer = null;
function getNoiseBuffer(ctx) {
  if (_noiseBuffer && _noiseBuffer.sampleRate === ctx.sampleRate) return _noiseBuffer;
  const len = ctx.sampleRate * 0.5;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  _noiseBuffer = buf;
  return buf;
}

// Simple envelope: attack ramp, then exponential decay
function applyEnvelope(gain, ctx, attackTime, peakValue, decayTime) {
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakValue, now + attackTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime);
}

// Play a single oscillator tone
function playTone(freq, type, attackTime, decayTime, peakGain = 0.4) {
  if (!_sfxEnabled) return;
  const ctx = getACtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(_masterGain);
  applyEnvelope(gain, ctx, attackTime, peakGain, decayTime);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + attackTime + decayTime + 0.05);
}

// Play noise burst (filtered)
function playNoiseBurst(filterFreq, filterType, attackTime, decayTime, peakGain = 0.3) {
  if (!_sfxEnabled) return;
  const ctx = getACtx();
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(_masterGain);

  applyEnvelope(gain, ctx, attackTime, peakGain, decayTime);
  src.start(ctx.currentTime);
  src.stop(ctx.currentTime + attackTime + decayTime + 0.05);
}

// Frequency sweep on an oscillator
function playFreqSweep(startFreq, endFreq, type, duration, peakGain = 0.3) {
  if (!_sfxEnabled) return;
  const ctx = getACtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
  gain.gain.setValueAtTime(peakGain, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.05);
}

// ── Tower Fire Sounds ──────────────────────────────────────────────────────

function playArrowFire() {
  if (!_sfxEnabled) return;
  // Short whoosh: high-pass filtered noise
  playNoiseBurst(3000, 'highpass', 0.005, 0.08, 0.25);
}

function playCannonFire() {
  if (!_sfxEnabled) return;
  const ctx = getACtx();
  // Deep thud: low freq sine + noise
  playFreqSweep(200, 60, 'sine', 0.18, 0.45);
  playNoiseBurst(400, 'lowpass', 0.01, 0.15, 0.35);
}

function playIceFire() {
  if (!_sfxEnabled) return;
  // Crystalline ping: high sine + harmonics
  playTone(1400, 'sine', 0.005, 0.25, 0.3);
  playTone(2100, 'sine', 0.005, 0.15, 0.12);
}

function playLightningFire() {
  if (!_sfxEnabled) return;
  // Electric crackle: square wave burst + noise
  const ctx = getACtx();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = 'square';
  osc2.type = 'square';
  osc1.frequency.value = 220;
  osc2.frequency.value = 223; // slight detune for buzz
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(_masterGain);
  applyEnvelope(gain, ctx, 0.005, 0.22, 0.09);
  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  const stop = ctx.currentTime + 0.12;
  osc1.stop(stop);
  osc2.stop(stop);
  playNoiseBurst(2000, 'bandpass', 0.003, 0.07, 0.18);
}

function playTowerFire(towerType) {
  switch (towerType) {
    case 'arrow':     return playArrowFire();
    case 'cannon':    return playCannonFire();
    case 'ice':       return playIceFire();
    case 'lightning': return playLightningFire();
    default:          return playArrowFire();
  }
}

// ── Hit / Death Sounds ─────────────────────────────────────────────────────

function playEnemyHit() {
  if (!_sfxEnabled) return;
  // Short thud
  playNoiseBurst(800, 'bandpass', 0.003, 0.06, 0.2);
}

function playEnemyDeath() {
  if (!_sfxEnabled) return;
  // Descending tone
  playFreqSweep(600, 150, 'sawtooth', 0.2, 0.28);
  playNoiseBurst(600, 'bandpass', 0.005, 0.12, 0.15);
}

function playBossDeath() {
  if (!_sfxEnabled) return;
  const ctx = getACtx();
  // Dramatic descending chord + noise
  const freqs = [220, 277, 330, 415];
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f * 0.3, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(ctx.currentTime + i * 0.03);
    osc.stop(ctx.currentTime + 1.0);
  });
  playNoiseBurst(300, 'lowpass', 0.01, 0.4, 0.4);
}

// ── Economy Sounds ─────────────────────────────────────────────────────────

function playGoldGain() {
  if (!_sfxEnabled) return;
  // Cheerful coin: two ascending tones
  const ctx = getACtx();
  [[880, 0], [1320, 0.06]].forEach(([f, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.12);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.15);
  });
}

// ── Wave Sounds ────────────────────────────────────────────────────────────

function playWaveStart() {
  if (!_sfxEnabled) return;
  const ctx = getACtx();
  // Ascending arpeggio: C E G C
  const notes = [261, 329, 392, 523];
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const t = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  });
}

function playBossAppear() {
  if (!_sfxEnabled) return;
  // Low dramatic horn swell
  playFreqSweep(55, 110, 'sawtooth', 0.6, 0.5);
  playFreqSweep(82, 165, 'square', 0.6, 0.3);
  playNoiseBurst(200, 'lowpass', 0.05, 0.5, 0.25);
}

// ── Skill Sounds ───────────────────────────────────────────────────────────

function playAirstrikeSkill() {
  if (!_sfxEnabled) return;
  // Whistle-down + boom
  playFreqSweep(1200, 80, 'sine', 0.4, 0.35);
  const ctx = getACtx();
  setTimeout(() => {
    if (!_sfxEnabled) return;
    playNoiseBurst(250, 'lowpass', 0.01, 0.35, 0.5);
    playFreqSweep(180, 55, 'sine', 0.3, 0.45);
  }, 380);
}

function playFreezeSkill() {
  if (!_sfxEnabled) return;
  // Icy whoosh + crystal shatter
  playNoiseBurst(4000, 'highpass', 0.02, 0.3, 0.3);
  playTone(2200, 'sine', 0.01, 0.4, 0.22);
  playTone(3300, 'sine', 0.01, 0.25, 0.12);
}

function playHealSkill() {
  if (!_sfxEnabled) return;
  // Warm ascending chord
  const ctx = getACtx();
  [[440, 0], [554, 0.08], [659, 0.16], [880, 0.24]].forEach(([f, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(t);
    osc.stop(t + 0.45);
  });
}

function playSkill(skillId) {
  switch (skillId) {
    case 'airstrike': return playAirstrikeSkill();
    case 'freeze':    return playFreezeSkill();
    case 'heal':      return playHealSkill();
  }
}

// ── UI Sounds ─────────────────────────────────────────────────────────────

function playUIClick() {
  if (!_sfxEnabled) return;
  playTone(1100, 'sine', 0.003, 0.06, 0.18);
}

function playTowerPlace() {
  if (!_sfxEnabled) return;
  // Satisfying thunk
  playTone(280, 'triangle', 0.005, 0.12, 0.3);
  playNoiseBurst(600, 'bandpass', 0.005, 0.08, 0.15);
}

function playUpgrade() {
  if (!_sfxEnabled) return;
  // Ascending two-note ping
  playTone(660, 'sine', 0.01, 0.15, 0.25);
  const ctx = getACtx();
  setTimeout(() => playTone(880, 'sine', 0.01, 0.2, 0.25), 100);
}

function playSoulCollect() {
  if (!_sfxEnabled) return;
  // Magical shimmer
  playTone(1760, 'sine', 0.005, 0.18, 0.2);
  playTone(2200, 'sine', 0.005, 0.12, 0.12);
}

function playFusion() {
  if (!_sfxEnabled) return;
  // Dramatic power-up
  const ctx = getACtx();
  playFreqSweep(200, 800, 'sawtooth', 0.3, 0.4);
  setTimeout(() => {
    playTone(1047, 'sine', 0.02, 0.5, 0.35);
    playTone(1319, 'sine', 0.02, 0.4, 0.3);
    playNoiseBurst(2000, 'bandpass', 0.01, 0.2, 0.3);
  }, 280);
}

// ── Volume / Mute ─────────────────────────────────────────────────────────

function setMasterVolume(v) {
  getACtx();
  if (_masterGain) _masterGain.gain.value = Math.max(0, Math.min(1, v)) * 0.35;
}
