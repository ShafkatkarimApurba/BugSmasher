/**
 * Loads optional WAV assets from /audio/*. Falls back to synthesis in SoundManager.
 */
export type SfxId =
  | 'shoot'
  | 'splat'
  | 'ui_click'
  | 'ui_hover'
  | 'powerup'
  | 'hit_base'
  | 'boss_warning';

const PATHS: Record<SfxId, string> = {
  shoot: '/audio/shoot.wav',
  splat: '/audio/splat.wav',
  ui_click: '/audio/ui_click.wav',
  ui_hover: '/audio/ui_hover.wav',
  powerup: '/audio/powerup.wav',
  hit_base: '/audio/hit_base.wav',
  boss_warning: '/audio/boss_warning.wav',
};

export class AudioAssetLoader {
  private buffers = new Map<SfxId, AudioBuffer>();
  private ctx: AudioContext | null = null;
  private loadPromise: Promise<void> | null = null;

  async init(ctx: AudioContext): Promise<void> {
    this.ctx = ctx;
    if (!this.loadPromise) {
      this.loadPromise = this.loadAll();
    }
    await this.loadPromise;
  }

  private async loadAll(): Promise<void> {
    if (!this.ctx) return;
    await Promise.all(
      (Object.keys(PATHS) as SfxId[]).map(async (id) => {
        try {
          const res = await fetch(PATHS[id]);
          if (!res.ok) return;
          const ab = await res.arrayBuffer();
          const buf = await this.ctx!.decodeAudioData(ab.slice(0));
          this.buffers.set(id, buf);
        } catch {
          /* synthesis fallback */
        }
      })
    );
  }

  has(id: SfxId): boolean {
    return this.buffers.has(id);
  }

  play(id: SfxId, dest: AudioNode, volume = 1, playbackRate = 1): boolean {
    if (!this.ctx || !this.buffers.has(id)) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(id)!;
    src.playbackRate.value = playbackRate;
    const g = this.ctx.createGain();
    g.gain.value = volume;
    src.connect(g);
    g.connect(dest);
    src.start();
    return true;
  }
}

export const audioAssets = new AudioAssetLoader();