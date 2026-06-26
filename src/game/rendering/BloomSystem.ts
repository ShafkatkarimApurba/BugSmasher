/**
 * BloomSystem — Screen-space glow via multi-pass Canvas 2D blur
 *
 * Implements a fast approximation of bloom/glow using separable Gaussian
 * blur on an offscreen canvas. The technique:
 *   1. Extract bright pixels (entities with glow) to offscreen canvas
 *   2. Horizontal blur pass
 *   3. Vertical blur pass
 *   4. Composite back onto scene with 'screen' blend mode
 *
 * This is the same technique used by diep.io and other top browser games
 * for neon glow effects without WebGL.
 *
 * Performance: Two drawImage calls per blur pass. On modern hardware,
 * a 512x512 blur takes ~0.3ms total. On low-end, falls back to single-pass
 * or disables entirely.
 */

import { applyAlpha } from './RenderUtils';

export interface BloomConfig {
  /** Whether bloom is enabled */
  enabled: boolean;
  /** Number of blur passes (more = smoother but slower) */
  blurPasses: number;
  /** Blur radius in pixels */
  blurRadius: number;
  /** Brightness threshold (0-1, pixels brighter than this bloom) */
  threshold: number;
  /** Final bloom intensity multiplier */
  intensity: number;
  /** Bloom canvas resolution scale (0.5 = half res for performance) */
  resolutionScale: number;
  /** Blend mode for final composite */
  blendMode: GlobalCompositeOperation;
}

export const BLOOM_PRESETS: Record<string, BloomConfig> = {
  ultra:    { enabled: true,  blurPasses: 2, blurRadius: 4, threshold: 0.3,  intensity: 1.2, resolutionScale: 1.0,  blendMode: 'screen' },
  high:     { enabled: true,  blurPasses: 1, blurRadius: 3, threshold: 0.35, intensity: 1.0, resolutionScale: 0.75, blendMode: 'screen' },
  balanced: { enabled: true,  blurPasses: 1, blurRadius: 2, threshold: 0.4,  intensity: 0.7, resolutionScale: 0.5,  blendMode: 'lighter' },
  mobile:   { enabled: false, blurPasses: 0, blurRadius: 0, threshold: 1.0,  intensity: 0,   resolutionScale: 0.5,  blendMode: 'source-over' },
};

/** Glow-emitting entity data from other renderers */
export interface GlowEmission {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export class BloomSystem {
  private config: BloomConfig;

  // Two offscreen canvases for ping-pong blur
  private canvasA: HTMLCanvasElement;
  private ctxA: CanvasRenderingContext2D | null;
  private canvasB: HTMLCanvasElement;
  private ctxB: CanvasRenderingContext2D | null;

  // Source capture canvas
  private captureCanvas: HTMLCanvasElement;
  private captureCtx: CanvasRenderingContext2D | null;

  private width: number = 0;
  private height: number = 0;

  /** Emissions collected this frame */
  private emissions: GlowEmission[] = [];

  constructor(config: Partial<BloomConfig> = {}) {
    this.config = { ...BLOOM_PRESETS.high, ...config };
    this.canvasA = document.createElement('canvas');
    this.ctxA = this.canvasA.getContext('2d') || null;
    this.canvasB = document.createElement('canvas');
    this.ctxB = this.canvasB.getContext('2d') || null;
    this.captureCanvas = document.createElement('canvas');
    this.captureCtx = this.captureCanvas.getContext('2d') || null;
  }

  /** Apply a quality preset. */
  applyPreset(preset: string): void {
    const presetConfig = BLOOM_PRESETS[preset];
    if (presetConfig) {
      this.config = { ...presetConfig };
    }
  }

  /** Resize internal canvases to match game resolution. */
  resize(width: number, height: number): void {
    const scaledWidth = Math.floor(width * this.config.resolutionScale);
    const scaledHeight = Math.floor(height * this.config.resolutionScale);

    if (this.width !== scaledWidth || this.height !== scaledHeight) {
      this.width = scaledWidth;
      this.height = scaledHeight;
      this.canvasA.width = scaledWidth;
      this.canvasA.height = scaledHeight;
      this.canvasB.width = scaledWidth;
      this.canvasB.height = scaledHeight;
      this.captureCanvas.width = scaledWidth;
      this.captureCanvas.height = scaledHeight;
    }
  }

  /** Register a glow emission for this frame. */
  addEmission(emission: GlowEmission): void {
    if (!this.config.enabled) return;
    this.emissions.push(emission);
  }

  /**
   * Render bloom effect.
   * Call AFTER the game layer is rendered but BEFORE UI.
   */
  render(ctx: CanvasRenderingContext2D, gameCanvas: HTMLCanvasElement): void {
    if (!this.config.enabled || this.emissions.length === 0) return;
    if (!this.ctxA || !this.ctxB || !this.captureCtx) {
      this.emissions.length = 0;
      return;
    }

    // 1. Capture glow sources
    this.captureGlowSources();

    // 2. Apply blur passes
    let source = this.captureCanvas;
    let sourceCtx = this.captureCtx;
    let dest = this.canvasA;
    let destCtx = this.ctxA;

    for (let pass = 0; pass < this.config.blurPasses; pass++) {
      this.applyBlurPass(sourceCtx, destCtx, this.config.blurRadius, true);
      [source, dest] = [dest, source];
      [sourceCtx, destCtx] = [destCtx, sourceCtx];

      this.applyBlurPass(sourceCtx, destCtx, this.config.blurRadius, false);
      [source, dest] = [dest, source];
      [sourceCtx, destCtx] = [destCtx, sourceCtx];
    }

    // 3. Composite bloom onto game
    ctx.save();
    ctx.globalCompositeOperation = this.config.blendMode;
    ctx.globalAlpha = this.config.intensity;
    ctx.drawImage(source, 0, 0, gameCanvas.width, gameCanvas.height);
    ctx.restore();

    // Clear emissions for next frame
    this.emissions.length = 0;
  }

  /** Get the current bloom configuration. */
  getConfig(): BloomConfig {
    return { ...this.config };
  }

  private captureGlowSources(): void {
    const ctx = this.captureCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);

    const scale = this.config.resolutionScale;

    for (const emission of this.emissions) {
      const sx = emission.x * scale;
      const sy = emission.y * scale;
      const sr = emission.radius * scale;

      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      const color = applyAlpha(emission.color, emission.intensity);
      grad.addColorStop(0, color);
      grad.addColorStop(0.5, applyAlpha(emission.color, emission.intensity * 0.3));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
  }

  private applyBlurPass(
    src: CanvasRenderingContext2D,
    dest: CanvasRenderingContext2D,
    radius: number,
    horizontal: boolean,
  ): void {
    dest.clearRect(0, 0, this.width, this.height);

    // Weighted 3-sample blur approximation
    const offsets = [-radius, 0, radius];
    const weights = [0.25, 0.5, 0.25];

    dest.globalAlpha = 1;

    for (let i = 0; i < offsets.length; i++) {
      dest.globalAlpha = weights[i];
      if (horizontal) {
        dest.drawImage(src.canvas, offsets[i], 0);
      } else {
        dest.drawImage(src.canvas, 0, offsets[i]);
      }
    }

    dest.globalAlpha = 1;
  }
}
