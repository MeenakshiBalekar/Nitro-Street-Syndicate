import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { IAudioManager, Sfx } from './AudioManager.types';
import countdownSrc from '../../assets/audio/countdown.wav';
import crashSrc from '../../assets/audio/crash.wav';
import engineSrc from '../../assets/audio/engine.wav';
import finishSrc from '../../assets/audio/finish.wav';
import goSrc from '../../assets/audio/go.wav';
import nitroSrc from '../../assets/audio/nitro.wav';
import uiSrc from '../../assets/audio/ui.wav';

// Native backend: sample-based playback via expo-audio. The engine loop's rate &
// volume track speed; SFX are one-shot players reused by seeking to 0.
//
// NOTE: this compiles and bundles, but on-device playback can only be confirmed
// on a real device (no audio in this build container). On web the .web.ts
// synthesis backend is used instead.

const SFX_SRC: Record<Sfx, number> = {
  ui: uiSrc,
  countdown: countdownSrc,
  go: goSrc,
  crash: crashSrc,
  finish: finishSrc,
  nitro: nitroSrc,
};

class NativeAudio implements IAudioManager {
  private enabled = true;
  private engine: AudioPlayer | null = null;
  private players: Partial<Record<Sfx, AudioPlayer>> = {};
  private lastRate = 0;

  init(): void {
    try {
      void setAudioModeAsync({ playsInSilentMode: true });
    } catch {
      /* ignore */
    }
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) this.stopEngine();
  }

  unlock(): void {
    /* native needs no gesture unlock */
  }

  startEngine(): void {
    if (!this.enabled || this.engine) return;
    try {
      const p = createAudioPlayer(engineSrc);
      p.loop = true;
      p.volume = 0.25;
      p.play();
      this.engine = p;
    } catch {
      this.engine = null;
    }
  }

  stopEngine(): void {
    if (!this.engine) return;
    try {
      this.engine.pause();
    } catch {
      /* ignore */
    }
    this.engine = null;
  }

  setEngine(ratio: number, nitro: boolean): void {
    const e = this.engine;
    if (!e) return;
    // Throttle native bridge writes to ~12/sec to avoid jitter.
    const now = Date.now();
    if (now - this.lastRate < 80) return;
    this.lastRate = now;
    try {
      e.setPlaybackRate(0.7 + ratio * 1.5 + (nitro ? 0.3 : 0));
      e.volume = 0.2 + ratio * 0.5;
    } catch {
      /* ignore */
    }
  }

  play(sfx: Sfx): void {
    if (!this.enabled) return;
    try {
      let p = this.players[sfx];
      if (!p) {
        p = createAudioPlayer(SFX_SRC[sfx]);
        this.players[sfx] = p;
      }
      void p.seekTo(0);
      p.play();
    } catch {
      /* ignore */
    }
  }
}

export const AudioManager: IAudioManager = new NativeAudio();
