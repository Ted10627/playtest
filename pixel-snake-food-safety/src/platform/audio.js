// 平台介接層：音效與背景音樂（Web Audio 即時合成 8-bit 音色，無需外部音檔）
// 行動裝置須於使用者首次觸控後才能發聲，因此由 unlockAudio() 於第一次互動時建立音訊環境。
let ctx = null, sfxGain = null, musicGain = null;
const prefs = { music: true, sfx: true };
let bgmWanted = false, bgmTimer = null, nextNoteTime = 0, noteIndex = 0;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.25; sfxGain.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.08; musicGain.connect(master);
  }
  const ready = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
  ready.then(() => { if (bgmWanted) startBgm(); });
}

export function setAudioPrefs({ music, sfx }) {
  prefs.music = music; prefs.sfx = sfx;
  if (!music) stopBgm(); else if (bgmWanted) startBgm();
}

function tone(freq, t, dur, { type = 'square', vol = 1, to = null, out = sfxGain } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.02);
}

const SFX = {
  click:   t => tone(880, t, 0.05),
  eat:     t => tone(660, t, 0.08, { to: 990 }),
  safe:    t => { tone(784, t, 0.07); tone(1175, t + 0.07, 0.12); },
  risk:    t => tone(220, t, 0.18, { type: 'sawtooth', to: 110, vol: 0.8 }),
  alarm:   t => [0, 0.16, 0.32].forEach(d => tone(520, t + d, 0.12, { type: 'square', to: 380 })),
  support: t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.12)),
  skill:   t => tone(440, t, 0.2, { type: 'triangle', to: 880 }),
  charge:  t => tone(988, t, 0.1, { type: 'triangle' }),
  gate:    t => [784, 988, 1175].forEach((f, i) => tone(f, t + i * 0.1, 0.15, { type: 'triangle' })),
  die:     t => [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.13, 0.15, { type: 'square' })),
  pass:    t => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.14, { type: 'square' })),
};

export function sfx(name) {
  if (!ctx || !prefs.sfx || ctx.state !== 'running') return;
  SFX[name]?.(ctx.currentTime + 0.01);
}

// 背景音樂：C 大調輕快旋律，八分音符 132 BPM，循環播放
const MELODY = [
  72, 76, 79, 76, 77, 74, 71, 74,  72, 76, 79, 84, 83, 79, 76, 0,
  74, 77, 81, 77, 79, 76, 72, 76,  74, 71, 67, 71, 72, 0, 72, 0,
];
const BASS = [48, 48, 53, 53, 50, 50, 43, 43];
const EIGHTH = 60 / 132 / 2;
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

function schedule() {
  while (nextNoteTime < ctx.currentTime + 0.2) {
    const m = MELODY[noteIndex % MELODY.length];
    if (m) tone(midi(m), nextNoteTime, EIGHTH * 0.9, { type: 'square', vol: 0.6, out: musicGain });
    if (noteIndex % 4 === 0) tone(midi(BASS[(noteIndex / 4) % BASS.length]), nextNoteTime, EIGHTH * 3.5, { type: 'triangle', vol: 1, out: musicGain });
    nextNoteTime += EIGHTH;
    noteIndex++;
  }
}

export function startBgm() {
  bgmWanted = true;
  if (!ctx || !prefs.music || bgmTimer || ctx.state !== 'running') return;
  nextNoteTime = ctx.currentTime + 0.05;
  bgmTimer = setInterval(schedule, 50);
}

export function stopBgm() {
  clearInterval(bgmTimer);
  bgmTimer = null;
}

export function bgmPlaying() { return !!bgmTimer; }
