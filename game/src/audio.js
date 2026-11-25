// Tiny synthesized sound effects, made with the Web Audio API only — no
// audio files, no network. A short blip for picking up, a chop, a sizzle,
// a ding when a dish is ready, and a little fanfare for a serve.

let audioCtx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function ctx() {
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    } catch {
      return null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    // Sound is garnish; a silent game still plays.
  }
}

function noise(dur, vol, when = 0) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  try {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.value = vol;
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(ac.currentTime + when);
  } catch {
    // Silent is fine.
  }
}

export const sfx = {
  pickup() { tone(520, 0.09, 'triangle', 0.16); },
  drop() { tone(340, 0.08, 'triangle', 0.14); },
  chop() { noise(0.07, 0.22); tone(180, 0.06, 'square', 0.08); },
  sizzle() { noise(0.35, 0.10); tone(900, 0.3, 'sine', 0.04, 0, 500); },
  ready() { tone(880, 0.12, 'sine', 0.18); tone(1320, 0.18, 'sine', 0.16, 0.1); },
  serve() {
    tone(523, 0.12, 'triangle', 0.18);
    tone(659, 0.12, 'triangle', 0.18, 0.11);
    tone(784, 0.2, 'triangle', 0.2, 0.22);
  },
  error() { tone(160, 0.16, 'sawtooth', 0.12, 0, 110); },
  lose() { tone(330, 0.2, 'sine', 0.16, 0, 165); tone(220, 0.3, 'sine', 0.14, 0.18, 110); },
  click() { tone(700, 0.05, 'square', 0.07); },
  tick() { tone(1000, 0.04, 'square', 0.06); },
};
