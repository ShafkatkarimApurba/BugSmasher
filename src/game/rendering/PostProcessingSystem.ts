/**
 * PostProcessingSystem — Final frame effects for cinematic polish
 *
 * Applies fullscreen post-processing effects to the rendered frame:
 *   - Vignette: Darkened edges (intensity varies by health level)
 *   - Scanlines: Horizontal CRT-style line overlay
 *   - Film grain: Subtle noise for texture (GPU-optimized via tiled pattern)
 *   - Chromatic aberration: RGB channel separation (fixed recursion bug via temp copy)
 *   - Color grading: Hue/saturation shifts by biome/health/combo
 *
 * Performance: Film grain is optimized using a pre-rendered tiled noise canvas,
 * avoiding expensive CPU-bound getImageData calls. Chromatic aberration is fixed
 * by copying the frame to a temporary offscreen buffer before drawing offsets,
 * preventing recursive rendering artifacts.
 */

export interface PostProcessConfig {
  enabled: boolean;
  /** Vignette intensity (0-1, 0 = off) */
  vignetteIntensity: number;
  /** Whether scanlines are shown */
  scanlines: boolean;
  /** Scanline opacity (0-1) */
  scanlineOpacity: number;
  /** Film grain intensity (0-1) */
  grainIntensity: number;
  /** Chromatic aberration offset in pixels */
  chromaticOffset: number;
  /** Whether to apply health-based vignette */
  healthBasedVignette: boolean;
  /** Whether to apply combo-based saturation */
  comboColorGrading: boolean;
  /** CSS filter string override (applied to canvas element) */
  cssFilter: string;
}

export const POSTPROCESS_PRESETS = {
  ultra:    { enabled: true,  vignetteIntensity: 0.6, scanlines: true,  scanlineOpacity: 0.08, grainIntensity: 0.04, chromaticOffset: 2, healthBasedVignette: true,  comboColorGrading: true,  cssFilter: '' },
  high:     { enabled: true,  vignetteIntensity: 0.45, scanlines: true,  scanlineOpacity: 0.06, grainIntensity: 0.02, chromaticOffset: 1.5, healthBasedVignette: true,  comboColorGrading: true,  cssFilter: '' },
  balanced: { enabled: true,  vignetteIntensity: 0.3, scanlines: false, scanlineOpacity: 0,    grainIntensity: 0,    chromaticOffset: 1,   healthBasedVignette: false, comboColorGrading: false, cssFilter: '' },
  mobile:   { enabled: false, vignetteIntensity: 0,    scanlines: false, scanlineOpacity: 0,    grainIntensity: 0,    chromaticOffset: 0,   healthBasedVignette: false, comboColorGrading: false, cssFilter: '' },
} as const;

export class PostProcessingSystem {
  private config: PostProcessConfig;

  /** Cached scanline pattern canvas */
  private scanlineCanvas: HTMLCanvasElement | null = null;
  private scanlineCtx: CanvasRenderingContext2D | null = null;
  private scanlineGenerated: boolean = false;

  /** Pre-rendered film grain canvas */
  private grainCanvas: HTMLCanvasElement | null = null;
  private grainPattern: CanvasPattern | null = null;

  /** Temporary canvas for chromatic aberration to avoid recursive self-draw */
  private tempCanvas: HTMLCanvasElement | null = null;
  private tempCtx: CanvasRenderingContext2D | null = null;

  /** Health ratio (0-1) for vignette adjustment */
  private healthRatio: number = 1;
  /** Combo saturation boost (0-1) */
  private saturationBoost: number = 0;
  /** Chromatic offset override (from screen shake) */
  private chromaticOverride: number = 0;
  /** Canvas width for scanline generation */
  private lastWidth: number = 0;

  constructor(config: Partial<PostProcessConfig> = {}) {
    this.config = { ...POSTPROCESS_PRESETS.high, ...config };
    this.preRenderGrain();
  }

  /**
   * Apply a quality preset.
   */
  applyPreset(preset: keyof typeof POSTPROCESS_PRESETS): void {
    this.config = { ...POSTPROCESS_PRESETS[preset] };
  }

  /**
   * Update health ratio for vignette adjustment.
   */
  setHealthRatio(ratio: number): void {
    this.healthRatio = Math.max(0, Math.min(1, ratio));
  }

  /**
   * Update combo saturation boost.
   */
  setSaturationBoost(boost: number): void {
    this.saturationBoost = Math.max(0, Math.min(1, boost));
  }

  /**
   * Set chromatic aberration override (from screen shake).
   */
  setChromaticOverride(offset: number): void {
    this.chromaticOverride = offset;
  }

  /**
   * Get the CSS filter string for the canvas element.
   * When used, this avoids all Canvas-based post-processing overhead.
   */
  getCSSFilter(): string {
    if (!this.config.enabled) return 'none';

    const filters: string[] = [];

    if (this.config.comboColorGrading && this.saturationBoost > 0) {
      const saturation = 1 + this.saturationBoost * 0.3;
      filters.push(`saturate(${saturation})`);
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
  }

  /**
   * Render post-processing effects to canvas.
   * Call AFTER all game rendering is complete.
   *
   * @param ctx Canvas context (already has the game rendered)
   * @param width Canvas width
   * @param height Canvas height
   * @param globalTime Game time for animated effects
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number, globalTime: number): void {
    if (!this.config.enabled) return;

    // 1. Vignette
    if (this.config.vignetteIntensity > 0) {
      this.renderVignette(ctx, width, height);
    }

    // 2. Scanlines
    if (this.config.scanlines && this.config.scanlineOpacity > 0) {
      this.renderScanlines(ctx, width, height);
    }

    // 3. Film grain (GPU-optimized tiling)
    if (this.config.grainIntensity > 0) {
      this.renderGrain(ctx, width, height, globalTime);
    }

    // 4. Chromatic aberration (using temporary buffer copy to prevent feedback recursion)
    const chromatic = this.config.chromaticOffset + this.chromaticOverride;
    if (chromatic > 0.1) {
      this.renderChromaticAberration(ctx, width, height, chromatic);
    }
  }

  private renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    let intensity = this.config.vignetteIntensity;

    // Health-based: lower health = stronger vignette
    if (this.config.healthBasedVignette && this.healthRatio < 0.5) {
      const healthMultiplier = 1 + (0.5 - this.healthRatio) * 2;
      intensity *= healthMultiplier;
    }

    // Red tint when critical health
    const isCritical = this.healthRatio < 0.3;
    const color = isCritical ? '64,0,0' : '0,0,0';

    const grad = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.25,
      width / 2, height / 2, width * 0.85,
    );
    grad.addColorStop(0, `rgba(${color},0)`);
    grad.addColorStop(0.7, `rgba(${color},0)`);
    grad.addColorStop(1, `rgba(${color},${intensity})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Critical health pulse
    if (isCritical) {
      const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.1;
      ctx.fillStyle = `rgba(255,0,0,${pulse * intensity})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private renderScanlines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.scanlineGenerated || this.lastWidth !== width) {
      this.generateScanlines(width, height);
    }

    if (this.scanlineCanvas) {
      ctx.save();
      ctx.globalAlpha = this.config.scanlineOpacity;
      ctx.drawImage(this.scanlineCanvas, 0, 0);
      ctx.restore();
    }
  }

  /**
   * Pre-renders a 256x256 noise texture to tile over the scene for high-performance grain.
   */
  private preRenderGrain(): void {
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = 256;
    this.grainCanvas.height = 256;
    const gCtx = this.grainCanvas.getContext('2d');
    if (!gCtx) return;

    const imgData = gCtx.createImageData(256, 256);
    const data = imgData.data;

    // Fill with random noise
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.floor(Math.random() * 255);
      data[i] = noise;       // R
      data[i + 1] = noise;   // G
      data[i + 2] = noise;   // B
      data[i + 3] = 255;     // A (solid, will scale draw opacity instead)
    }
    gCtx.putImageData(imgData, 0, 0);

    // Create pattern
    this.grainPattern = gCtx.createPattern(this.grainCanvas, 'repeat');
  }

  private renderGrain(ctx: CanvasRenderingContext2D, width: number, height: number, _globalTime: number): void {
    if (!this.grainPattern) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = this.config.grainIntensity;

    // Offset the pattern randomly to animate the noise
    const offsetX = Math.floor(Math.random() * 256);
    const offsetY = Math.floor(Math.random() * 256);

    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = this.grainPattern;
    ctx.fillRect(-offsetX, -offsetY, width, height);

    ctx.restore();
  }

  private renderChromaticAberration(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offset: number,
  ): void {
    // 1. Prepare/Resize temporary canvas buffer
    if (!this.tempCanvas) {
      this.tempCanvas = document.createElement('canvas');
      this.tempCtx = this.tempCanvas.getContext('2d') || null;
    }
    if (!this.tempCtx) return;
    if (!ctx || !ctx.canvas) return;
    if (this.tempCanvas.width !== ctx.canvas.width || this.tempCanvas.height !== ctx.canvas.height) {
      this.tempCanvas.width = ctx.canvas.width;
      this.tempCanvas.height = ctx.canvas.height;
    }

    // 2. Copy current scene to temporary offscreen buffer (handles DPR scaling internally)
    this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    this.tempCtx.drawImage(ctx.canvas, 0, 0);

    // 3. Draw red/blue channel splits from the static buffer onto the target context
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Red channel offset (toward top-left)
    ctx.globalAlpha = 0.5;
    ctx.drawImage(this.tempCanvas, -offset, -offset, width, height);

    // Blue channel offset (toward bottom-right)
    ctx.globalAlpha = 0.3;
    ctx.drawImage(this.tempCanvas, offset * 0.5, offset * 0.5, width, height);

    ctx.restore();
  }

  private generateScanlines(width: number, height: number): void {
    if (!this.scanlineCanvas) {
      this.scanlineCanvas = document.createElement('canvas');
      this.scanlineCtx = this.scanlineCanvas.getContext('2d') || null;
    }
    if (!this.scanlineCtx) return;

    this.scanlineCanvas.width = width;
    this.scanlineCanvas.height = height;
    this.lastWidth = width;

    const ctx = this.scanlineCtx;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

    // 2-pixel pattern: 1px line, 1px gap
    for (let y = 0; y < height; y += 2) {
      ctx.fillRect(0, y, width, 1);
    }

    this.scanlineGenerated = true;
  }
}
