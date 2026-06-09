// Audio slot. The vertical slice ships without bundled audio assets, so this is
// a safe no-op that documents where engine pitch / SFX hooks attach. Wire it to
// expo-av (or expo-audio) and drop sound files in assets/audio to enable.

type Sfx = 'nitro' | 'crash' | 'countdown' | 'finish' | 'ui';

class AudioManagerImpl {
  private enabled = false;

  init(): void {
    this.enabled = false; // flip on once audio assets are added
  }

  /** Map current speed ratio (0..1) to engine pitch when audio is enabled. */
  setEngine(_speedRatio: number, _nitro: boolean): void {
    if (!this.enabled) return;
    // TODO: adjust looped engine sample playback rate.
  }

  play(_sfx: Sfx): void {
    if (!this.enabled) return;
    // TODO: play one-shot.
  }
}

export const AudioManager = new AudioManagerImpl();
