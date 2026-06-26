/**
 * ScreenShakeSystem — Enhanced directional screen shake with physical accuracy
 *
 * Replaces the basic shake in GameEngine with a full physics-based system:
 *   - Directional shake (vector from impact toward center)
 *   - Rotational shake (subtle canvas rotation during impact)
 *   - Zoom pulse (brief FOV change on heavy impacts)
 *   - Chromatic separation (RGB channel offset proportional to shake)
 *   - Multiple simultaneous shakes (additive)
 *   - Perlin-like noise for organic feel (avoids pure sine repetition)
 */

export interface ShakeParams {
  /** Maximum pixel displacement */
  magnitude: number;
  /** Direction in radians (0 = right, PI/2 = down) */
  direction: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Decay curve: 'exponential' | 'linear' | 'bounce' */
  decay: 'exponential' | 'linear' | 'bounce';
  /** Whether to include rotational shake */
  includeRotation: boolean;
  /** Whether to include zoom pulse */
  includeZoom: boolean;
  /** Whether to include chromatic separation */
  includeChromatic: boolean;
  /** Rotation magnitude in radians (if includeRotation) */
  rotationMagnitude?: number;
  /** Zoom magnitude as ratio (1.05 = 5% zoom) */
  zoomMagnitude?: number;
  /** Chromatic separation in pixels */
  chromaticMagnitude?: number;
  /** Frequency of shake oscillation */
  frequency?: number;
}

export interface ShakeFrame {
  /** Horizontal offset in pixels */
  offsetX: number;
  /** Vertical offset in pixels */
  offsetY: number;
  /** Rotation in radians */
  rotation: number;
  /** Zoom ratio (1.0 = no zoom) */
  zoom: number;
  /** Chromatic aberration offset in pixels */
  chromaticOffset: number;
  /** Current shake intensity 0-1 */
  intensity: number;
}

interface ActiveShake {
  params: ShakeParams;
  startTime: number;
  elapsedMs: number;
  seed: number; // unique seed for noise variation
}

export const DEFAULT_SHAKE_PARAMS: ShakeParams = {
  magnitude: 10,
  direction: 0,
  durationMs: 500,
  decay: 'exponential',
  includeRotation: true,
  includeZoom: true,
  includeChromatic: true,
  rotationMagnitude: 0.02,
  zoomMagnitude: 1.03,
  chromaticMagnitude: 3,
  frequency: 25,
};

/** Preset shake configurations for common game events */
export const SHAKE_PRESETS = {
  /** Light bug kill */
  killLight: (): ShakeParams => ({
    ...DEFAULT_SHAKE_PARAMS,
    magnitude: 4,
    direction: Math.random() * Math.PI * 2,
    durationMs: 200,
    includeRotation: false,
    includeZoom: false,
    includeChromatic: false,
    frequency: 30,
  }),
  /** Standard bug kill */
  killStandard: (): ShakeParams => ({
    ...DEFAULT_SHAKE_PARAMS,
    magnitude: 8,
    direction: Math.random() * Math.PI * 2,
    durationMs: 350,
    includeRotation: true,
    includeZoom: false,
    includeChromatic: true,
    chromaticMagnitude: 2,
    frequency: 22,
  }),
  /** Elite bug kill */
  killElite: (): ShakeParams => ({
    ...DEFAULT_SHAKE_PARAMS,
    magnitude: 14,
    direction: Math.random() * Math.PI * 2,
    durationMs: 500,
    includeRotation: true,
    includeZoom: true,
    includeChromatic: true,
    chromaticMagnitude: 4,
    frequency: 18,
  }),
  /** Boss damage */
  bossDamage: (direction: number): ShakeParams => ({
    ...DEFAULT_SHAKE_PARAMS,
    magnitude: 18,
    direction,
    durationMs: 600,
    decay: 'bounce',
    includeRotation: true,
    includeZoom: true,
    includeChromatic: true,
    rotationMagnitude: 0.04,
    zoomMagnitude: 1.06,
    chromaticMagnitude: 6,
    frequency: 15,
  }),
  /** Player taking damage */
  playerDamage: (direction: number): ShakeParams => ({
    ...DEFAULT_SHAKE_PARAMS,
    magnitude: 22,
    direction,
    durationMs: 800,
    decay: 'bounce',
    includeRotation: true,
    includeZoom: true,
    includeChromatic: true,
    rotationMagnitude: 0.05,
    zoomMagnitude: 1.08,
    chromaticMagnitude: 8,
    frequency: 12,
  }),
  /** Wave transition */
  waveTransition: (): ShakeParams => ({
    ...DEFAULT_SHAKE_PARAMS,
    magnitude: 6,
    direction: Math.random() * Math.PI * 2,
    durationMs: 400,
    includeRotation: false,
    includeZoom: true,
    includeChromatic: false,
    zoomMagnitude: 1.02,
    frequency: 20,
  }),
  /** Explosion / shockwave */
  explosion: (direction: number): ShakeParams => ({
    ...DEFAULT_SHAKE_PARAMS,
    magnitude: 16,
    direction,
    durationMs: 450,
    decay: 'exponential',
    includeRotation: true,
    includeZoom: true,
    includeChromatic: true,
    rotationMagnitude: 0.03,
    zoomMagnitude: 1.04,
    chromaticMagnitude: 5,
    frequency: 20,
  }),
} as const;

export class ScreenShakeSystem {
  private activeShakes: ActiveShake[] = [];
  private currentTime: number = 0;

  /** Global shake multiplier (set by difficulty/accessibility) */
  shakeScale: number = 1;

  /** Whether shakes are enabled at all */
  enabled: boolean = true;

  /**
   * Trigger a shake with given parameters.
   */
  trigger(params: Partial<ShakeParams> = {}): void {
    if (!this.enabled) return;
    const fullParams = { ...DEFAULT_SHAKE_PARAMS, ...params };
    this.activeShakes.push({
      params: fullParams,
      startTime: this.currentTime,
      elapsedMs: 0,
      seed: Math.random() * 1000,
    });
  }

  /**
   * Trigger a preset shake.
   */
  triggerPreset(
    preset: keyof typeof SHAKE_PRESETS,
    ...args: Parameters<(typeof SHAKE_PRESETS)[typeof preset]>
  ): void {
    const params = (SHAKE_PRESETS[preset] as (...args: unknown[]) => unknown)(...args);
    this.trigger(params);
  }

  /**
   * Update shake state. Call once per frame.
   * @param dtMs Delta time in milliseconds
   */
  update(dtMs: number): void {
    this.currentTime += dtMs;

    for (let i = this.activeShakes.length - 1; i >= 0; i--) {
      this.activeShakes[i].elapsedMs += dtMs;
      if (this.activeShakes[i].elapsedMs >= this.activeShakes[i].params.durationMs) {
        this.activeShakes.splice(i, 1);
      }
    }
  }

  /**
   * Get the current shake transformation values for this frame.
   */
  getCurrentFrame(): ShakeFrame {
    if (this.activeShakes.length === 0) {
      return { offsetX: 0, offsetY: 0, rotation: 0, zoom: 1, chromaticOffset: 0, intensity: 0 };
    }

    let totalOffsetX = 0;
    let totalOffsetY = 0;
    let totalRotation = 0;
    let totalZoom = 0;
    let totalChromatic = 0;
    let maxIntensity = 0;
    let count = 0;

    for (const shake of this.activeShakes) {
      const { params, elapsedMs } = shake;
      const progress = elapsedMs / params.durationMs;
      if (progress >= 1) continue;

      // Decay envelope
      let envelope: number;
      switch (params.decay) {
        case 'linear':
          envelope = 1 - progress;
          break;
        case 'bounce':
          envelope = Math.exp(-progress * 5) * Math.abs(Math.cos(progress * 15));
          break;
        case 'exponential':
        default:
          envelope = Math.exp(-progress * 5);
          break;
      }

      // Noise-based offset for organic feel (avoids repetitive sine)
      const t = elapsedMs * 0.001;
      const freq = params.frequency || 25;
      const noise1 = this.noise(t * freq + shake.seed);
      const noise2 = this.noise(t * freq * 1.3 + shake.seed + 100);
      const noise3 = this.noise(t * freq * 0.7 + shake.seed + 200);

      const intensity = envelope * this.shakeScale;
      maxIntensity = Math.max(maxIntensity, intensity);

      totalOffsetX += Math.cos(params.direction) * intensity * params.magnitude * noise1;
      totalOffsetY += Math.sin(params.direction) * intensity * params.magnitude * noise2;

      if (params.includeRotation) {
        totalRotation += intensity * (params.rotationMagnitude || 0.02) * noise3;
      }
      if (params.includeZoom) {
        totalZoom += intensity * ((params.zoomMagnitude || 1.03) - 1);
      }
      if (params.includeChromatic) {
        totalChromatic += intensity * (params.chromaticMagnitude || 3);
      }
      count++;
    }

    return {
      offsetX: totalOffsetX,
      offsetY: totalOffsetY,
      rotation: totalRotation,
      zoom: count > 0 ? 1 + totalZoom : 1,
      chromaticOffset: totalChromatic,
      intensity: maxIntensity,
    };
  }

  /**
   * Apply the current shake to a Canvas 2D context.
   * Call after ctx.save() and before rendering.
   */
  applyToContext(ctx: CanvasRenderingContext2D): void {
    const frame = this.getCurrentFrame();
    if (frame.intensity <= 0.001) return;
    ctx.translate(frame.offsetX, frame.offsetY);
    if (frame.rotation !== 0) ctx.rotate(frame.rotation);
    if (frame.zoom !== 1) ctx.scale(frame.zoom, frame.zoom);
  }

  /**
   * Reset all active shakes.
   */
  reset(): void {
    this.activeShakes.length = 0;
  }

  /**
   * Simple 1D noise function for organic shake variation.
   * Not true Perlin, but fast and good enough for screen shake.
   */
  private noise(x: number): number {
    const ix = Math.floor(x);
    const fx = x - ix;
    const a = this.fractSin(ix * 12.9898 + 78.233);
    const b = this.fractSin((ix + 1) * 12.9898 + 78.233);
    const t = fx * fx * (3 - 2 * fx); // smoothstep
    return a + (b - a) * t - 0.5; // center around 0
  }

  private fractSin(x: number): number {
    return ((Math.sin(x) * 43758.5453) % 1 + 1) % 1;
  }
}
