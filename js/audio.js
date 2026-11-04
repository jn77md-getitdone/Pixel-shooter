// =====================================================================
//  LYD – små retro-bip lavet direkte i browseren (ingen lydfiler)
// =====================================================================

const Sound = {
  ctx: null,
  muted: false,

  // iPad/Safari kræver, at lyd startes efter et tryk. Kaldes når man trykker START.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  // Én tone, der glider fra 'freq' til 'endFreq'
  tone(freq, endFreq, duration, type, volume, delay) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + duration);
    gain.gain.setValueAtTime(volume || 0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  },

  shoot()   { this.tone(900, 420, 0.07, 'square', 0.035); },
  hit()     { this.tone(320, 160, 0.06, 'square', 0.05); },
  pop()     { this.tone(500, 1100, 0.12, 'triangle', 0.08); },
  hurt()    { this.tone(260, 70, 0.3, 'sawtooth', 0.08); },
  pickup()  {
    this.tone(660, 660, 0.08, 'triangle', 0.08);
    this.tone(990, 990, 0.12, 'triangle', 0.08, 0.08);
  },
  enemyShot() { this.tone(200, 300, 0.1, 'triangle', 0.05); },
  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.1, 'square', 0.05, i * 0.09));
  },
  gameOver() {
    [440, 370, 311, 220].forEach((f, i) => this.tone(f, f * 0.97, 0.22, 'square', 0.06, i * 0.2));
  },
};
