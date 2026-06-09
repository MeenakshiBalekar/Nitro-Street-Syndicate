import { IAudioManager, Sfx } from './AudioManager.types';

// Web backend: fully synthesized with the Web Audio API (no asset files).

type Maybe<T> = T | null;

function makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

class WebAudio implements IAudioManager {
  private ctx: Maybe<AudioContext> = null;
  private master: Maybe<GainNode> = null;
  private enabled = true;
  private engine: Maybe<{
    osc: OscillatorNode;
    sub: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
    nitroOsc: OscillatorNode;
    nitroGain: GainNode;
  }> = null;

  init(): void {
    /* context is created lazily on the first unlock() */
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) this.stopEngine();
    if (this.master) this.master.gain.value = v ? 0.5 : 0;
  }

  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  private ensure(): Maybe<AudioContext> {
    if (typeof window === 'undefined' || !this.enabled) return null;
    if (!this.ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  startEngine(): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.engine) return;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    const nitroOsc = ctx.createOscillator();
    nitroOsc.type = 'sawtooth';
    nitroOsc.frequency.value = 600;
    const nitroBP = ctx.createBiquadFilter();
    nitroBP.type = 'bandpass';
    nitroBP.frequency.value = 1400;
    const nitroGain = ctx.createGain();
    nitroGain.gain.value = 0;
    nitroOsc.connect(nitroBP);
    nitroBP.connect(nitroGain);
    nitroGain.connect(this.master);

    osc.start();
    sub.start();
    nitroOsc.start();
    this.engine = { osc, sub, filter, gain, nitroOsc, nitroGain };
  }

  stopEngine(): void {
    if (!this.engine) return;
    const { osc, sub, nitroOsc } = this.engine;
    try {
      osc.stop();
      sub.stop();
      nitroOsc.stop();
    } catch {
      /* already stopped */
    }
    this.engine = null;
  }

  setEngine(ratio: number, nitro: boolean): void {
    const e = this.engine;
    const ctx = this.ctx;
    if (!e || !ctx) return;
    const t = ctx.currentTime;
    const base = 42 + ratio * 150 + (nitro ? 22 : 0);
    e.osc.frequency.setTargetAtTime(base, t, 0.06);
    e.sub.frequency.setTargetAtTime(base * 0.5, t, 0.06);
    e.filter.frequency.setTargetAtTime(280 + ratio * 2600 + (nitro ? 1400 : 0), t, 0.06);
    e.gain.gain.setTargetAtTime(0.05 + ratio * 0.1, t, 0.08);
    e.nitroOsc.frequency.setTargetAtTime(520 + ratio * 480, t, 0.05);
    e.nitroGain.gain.setTargetAtTime(nitro ? 0.05 : 0, t, 0.1);
  }

  play(sfx: Sfx): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const master = this.master;

    const tone = (freq: number, dur: number, vol: number, type: OscillatorType = 'sine', at = 0) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(vol, t + at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g);
      g.connect(master);
      o.start(t + at);
      o.stop(t + at + dur + 0.02);
    };

    const noise = (dur: number, vol: number, cutoff: number) => {
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx, dur);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + dur);
    };

    switch (sfx) {
      case 'ui':
        tone(1100, 0.05, 0.04, 'square');
        break;
      case 'countdown':
        tone(760, 0.14, 0.1, 'sine');
        break;
      case 'go':
        tone(1180, 0.28, 0.12, 'sine');
        break;
      case 'crash':
        noise(0.32, 0.22, 520);
        tone(90, 0.3, 0.12, 'sawtooth');
        break;
      case 'finish':
        tone(523, 0.18, 0.1, 'triangle', 0);
        tone(659, 0.18, 0.1, 'triangle', 0.12);
        tone(784, 0.34, 0.12, 'triangle', 0.24);
        break;
      case 'nitro':
        noise(0.4, 0.1, 1800);
        break;
    }
  }
}

export const AudioManager: IAudioManager = new WebAudio();
