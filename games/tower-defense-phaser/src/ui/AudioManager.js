/**
 * Procedural Sound Effects — Web Audio API
 * All sounds are generated algorithmically (no audio files needed).
 * Ported from original audio.js
 */
export default class AudioManager {
  constructor() {
    this._actx = null;
    this._masterGain = null;
    this._sfxEnabled = true;
    this._noiseBuffer = null;
  }

  _getCtx() {
    if (!this._actx) {
      this._actx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._actx.createGain();
      this._masterGain.gain.value = 0.35;
      this._masterGain.connect(this._actx.destination);
    }
    if (this._actx.state === 'suspended') this._actx.resume();
    return this._actx;
  }

  _getNoiseBuffer() {
    const ctx = this._getCtx();
    if (this._noiseBuffer && this._noiseBuffer.sampleRate === ctx.sampleRate) return this._noiseBuffer;
    const len = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuffer = buf;
    return buf;
  }

  _applyEnvelope(gain, attackTime, peakValue, decayTime) {
    const ctx = this._getCtx();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakValue, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime);
  }

  _playTone(freq, type, attackTime, decayTime, peakGain = 0.4) {
    if (!this._sfxEnabled) return;
    const ctx = this._getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this._masterGain);
    this._applyEnvelope(gain, attackTime, peakGain, decayTime);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + attackTime + decayTime + 0.05);
  }

  _playNoiseBurst(filterFreq, filterType, attackTime, decayTime, peakGain = 0.3) {
    if (!this._sfxEnabled) return;
    const ctx = this._getCtx();
    const src = ctx.createBufferSource();
    src.buffer = this._getNoiseBuffer();
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this._masterGain);

    this._applyEnvelope(gain, attackTime, peakGain, decayTime);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + attackTime + decayTime + 0.05);
  }

  _playFreqSweep(startFreq, endFreq, type, duration, peakGain = 0.3) {
    if (!this._sfxEnabled) return;
    const ctx = this._getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(peakGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  // ── Tower Fire Sounds ──

  playTowerFire(towerType) {
    switch (towerType) {
      case 'arrow':     return this._playArrowFire();
      case 'cannon':    return this._playCannonFire();
      case 'ice':       return this._playIceFire();
      case 'lightning': return this._playLightningFire();
      default:          return this._playArrowFire();
    }
  }

  _playArrowFire() {
    this._playNoiseBurst(3000, 'highpass', 0.005, 0.08, 0.25);
  }

  _playCannonFire() {
    this._playFreqSweep(200, 60, 'sine', 0.18, 0.45);
    this._playNoiseBurst(400, 'lowpass', 0.01, 0.15, 0.35);
  }

  _playIceFire() {
    this._playTone(1400, 'sine', 0.005, 0.25, 0.3);
    this._playTone(2100, 'sine', 0.005, 0.15, 0.12);
  }

  _playLightningFire() {
    if (!this._sfxEnabled) return;
    const ctx = this._getCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.value = 220;
    osc2.frequency.value = 223;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this._masterGain);
    this._applyEnvelope(gain, 0.005, 0.22, 0.09);
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    const stop = ctx.currentTime + 0.12;
    osc1.stop(stop);
    osc2.stop(stop);
    this._playNoiseBurst(2000, 'bandpass', 0.003, 0.07, 0.18);
  }

  // ── Hit / Death Sounds ──

  playEnemyHit() {
    this._playNoiseBurst(800, 'bandpass', 0.003, 0.06, 0.2);
  }

  playLifeLost() {
    this._playFreqSweep(400, 120, 'sawtooth', 0.3, 0.35);
    this._playTone(180, 'square', 0.01, 0.25, 0.2);
  }

  playEnemyDeath() {
    this._playFreqSweep(600, 150, 'sawtooth', 0.2, 0.28);
    this._playNoiseBurst(600, 'bandpass', 0.005, 0.12, 0.15);
  }

  playBossDeath() {
    if (!this._sfxEnabled) return;
    const ctx = this._getCtx();
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
      gain.connect(this._masterGain);
      osc.start(ctx.currentTime + i * 0.03);
      osc.stop(ctx.currentTime + 1.0);
    });
    this._playNoiseBurst(300, 'lowpass', 0.01, 0.4, 0.4);
  }

  // ── Economy Sounds ──

  playGoldGain() {
    if (!this._sfxEnabled) return;
    const ctx = this._getCtx();
    [[880, 0], [1320, 0.06]].forEach(([f, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.12);
      osc.connect(gain);
      gain.connect(this._masterGain);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  }

  // ── Wave Sounds ──

  playWaveStart() {
    if (!this._sfxEnabled) return;
    const ctx = this._getCtx();
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
      gain.connect(this._masterGain);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playBossAppear() {
    this._playFreqSweep(55, 110, 'sawtooth', 0.6, 0.5);
    this._playFreqSweep(82, 165, 'square', 0.6, 0.3);
    this._playNoiseBurst(200, 'lowpass', 0.05, 0.5, 0.25);
  }

  // ── UI Sounds ──

  playUIClick() {
    this._playTone(1100, 'sine', 0.003, 0.06, 0.18);
  }

  playTowerPlace() {
    this._playTone(280, 'triangle', 0.005, 0.12, 0.3);
    this._playNoiseBurst(600, 'bandpass', 0.005, 0.08, 0.15);
  }

  playUpgrade() {
    if (!this._sfxEnabled) return;
    this._playTone(660, 'sine', 0.01, 0.15, 0.25);
    setTimeout(() => this._playTone(880, 'sine', 0.01, 0.2, 0.25), 100);
  }

  // ── Volume / Mute ──

  get sfxEnabled() { return this._sfxEnabled; }
  set sfxEnabled(v) { this._sfxEnabled = v; }

  setMasterVolume(v) {
    this._getCtx();
    if (this._masterGain) this._masterGain.gain.value = Math.max(0, Math.min(1, v)) * 0.35;
  }
}
