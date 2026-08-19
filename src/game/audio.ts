let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  getCtx();
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (master && ctx) {
    master.gain.setTargetAtTime(on ? 0.22 : 0, ctx.currentTime, 0.03);
  }
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.18, slide = 0) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac || !master) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ac.currentTime + dur);
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(g);
  g.connect(master);
  osc.start();
  osc.stop(ac.currentTime + dur + 0.02);
}

export const sfx = {
  tap: () => beep(620 + Math.random() * 40, 0.07, "triangle", 0.12),
  slide: () => beep(480, 0.16, "sine", 0.14, 320),
  blocked: () => beep(180, 0.18, "square", 0.1, -60),
  hint: () => beep(880, 0.12, "sine", 0.1),
  win: () => {
    beep(523, 0.16, "sine", 0.14);
    setTimeout(() => beep(659, 0.16, "sine", 0.14), 90);
    setTimeout(() => beep(784, 0.28, "sine", 0.16), 180);
  },
  lose: () => beep(140, 0.4, "sawtooth", 0.1, -80),
};
