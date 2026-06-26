/**
 * VisualFXPipeline — Multi-layer render pipeline orchestrator
 *
 * Manages the complete visual rendering pipeline by:
 *   1. Maintaining separate render layers (background, game, glow, lighting)
 *   2. Coordinating all visual subsystems (bloom, lighting, shake, post-proc)
 *   3. Compositing layers in optimal order each frame
 *   4. Applying quality-preset aware optimizations
 *
 * Layer Order (bottom to top):
 *   background → lighting → game (with bloom extraction) → glow/bloom → post-processing
 *
 * Usage from Renderer.ts:
 *   const pipeline = new VisualFXPipeline(engine);
 *   pipeline.beginFrame();
 *   pipeline.renderBackground(() => envRenderer.draw());
 *   pipeline.renderGame(() => { bugRenderer.draw(); particleRenderer.draw(); });
 *   pipeline.composite(); // Final composite with bloom + post-processing
 */

import { GameEngine } from '../GameEngine';
import { BloomSystem } from './BloomSystem';
import { DynamicLightingSystem } from './DynamicLightingSystem';
import { PostProcessingSystem } from './PostProcessingSystem';
import { ScreenShakeSystem, SHAKE_PRESETS } from './ScreenShakeSystem';
import { ComboVisualSystem } from './ComboVisualSystem';
import { WaveTransitionSystem } from './WaveTransitionSystem';
import type { PerformanceScaler } from './PerformanceScaler';

export type QualityPreset = 'ultra' | 'high' | 'balanced' | 'mobile';

export interface PipelineConfig {
  /** Target canvas width */
  width: number;
  /** Target canvas height */
  height: number;
  /** DPR for high-DPI displays */
  dpr: number;
  /** Quality preset */
  preset: QualityPreset;
}

export class VisualFXPipeline {
  readonly engine: GameEngine;
  readonly scaler: PerformanceScaler;

  // Subsystems
  readonly bloom: BloomSystem;
  readonly lighting: DynamicLightingSystem;
  readonly postProcess: PostProcessingSystem;
  readonly shake: ScreenShakeSystem;
  readonly comboVisual: ComboVisualSystem;
  readonly waveTransition: WaveTransitionSystem;

  // Layer canvases
  private bgCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContext2D | null;
  private gameCanvas: HTMLCanvasElement;
  private gameCtx: CanvasRenderingContext2D | null;
  private lightCanvas: HTMLCanvasElement | null = null;

  // State
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;
  private _preset: QualityPreset = 'high';
  private frameStarted: boolean = false;

  /** Current shake frame data (applied during composite) */
  private shakeFrame = { offsetX: 0, offsetY: 0, rotation: 0, zoom: 1, chromaticOffset: 0, intensity: 0 };

  constructor(engine: GameEngine, scaler: PerformanceScaler) {
    this.engine = engine;
    this.scaler = scaler;

    // Initialize subsystems
    this.bloom = new BloomSystem();
    this.lighting = new DynamicLightingSystem();
    this.postProcess = new PostProcessingSystem();
    this.shake = new ScreenShakeSystem();
    this.comboVisual = new ComboVisualSystem();
    this.waveTransition = new WaveTransitionSystem();

    // Create layer canvases
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d') || null;
    this.gameCanvas = document.createElement('canvas');
    this.gameCtx = this.gameCanvas.getContext('2d') || null;

    // Wire subsystem callbacks
    this.comboVisual.onRequestScreenShake = (preset: string) => this.shake.triggerPreset(preset as keyof typeof SHAKE_PRESETS);
    this.comboVisual.onRequestFlash = (color) => {/* Handled by postProcess */};
    this.waveTransition.onRequestScreenShake = (preset: string) => this.shake.triggerPreset(preset as keyof typeof SHAKE_PRESETS);
    this.waveTransition.onRequestHitstop = (intensity) => this.engine.triggerHitStop(intensity * 1000);
  }

  /**
   * Apply a quality preset to all subsystems.
   */
  applyPreset(preset: QualityPreset): void {
    this._preset = preset;
    this.bloom.applyPreset(preset);
    this.lighting.applyPreset(preset);
    this.postProcess.applyPreset(preset);
    this.shake.enabled = preset !== 'mobile';
    this.comboVisual.applyPreset(preset);
    this.waveTransition.applyPreset(preset);
  }

  /**
   * Resize all internal canvases. Call when game canvas resizes.
   */
  resize(width: number, height: number, dpr: number = 1): void {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    const scaledW = Math.floor(width * dpr);
    const scaledH = Math.floor(height * dpr);

    if (this.bgCanvas.width !== scaledW || this.bgCanvas.height !== scaledH) {
      this.bgCanvas.width = scaledW;
      this.bgCanvas.height = scaledH;
      if (this.bgCtx) this.bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (this.gameCanvas.width !== scaledW || this.gameCanvas.height !== scaledH) {
      this.gameCanvas.width = scaledW;
      this.gameCanvas.height = scaledH;
      if (this.gameCtx) this.gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (this.lightCanvas) {
      if (this.lightCanvas.width !== scaledW || this.lightCanvas.height !== scaledH) {
        this.lightCanvas.width = scaledW;
        this.lightCanvas.height = scaledH;
      }
    }

    this.bloom.resize(width, height);
  }

  /**
   * Begin a new frame. Must be called before any rendering.
   */
  beginFrame(): void {
    this.frameStarted = true;
    this.shakeFrame = this.shake.getCurrentFrame();

    // Clear game layer
    if (this.gameCtx) {
      this.gameCtx.save();
      this.gameCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.gameCtx.clearRect(0, 0, this.width, this.height);
      this.gameCtx.restore();
    }
  }

  /**
   * Get the context for background rendering.
   * Use this to draw the environment/background layer.
   */
  getBackgroundContext(): CanvasRenderingContext2D {
    if (!this.bgCtx) return this.engine.ctx;
    this.bgCtx.save();
    this.bgCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.bgCtx.clearRect(0, 0, this.width, this.height);
    return this.bgCtx;
  }

  /**
   * Get the context for game entity rendering.
   * Use this to draw bugs, particles, hazards, etc.
   *
   * Emissions for bloom are automatically captured.
   */
  getGameContext(): CanvasRenderingContext2D {
    if (!this.gameCtx) return this.engine.ctx;
    this.gameCtx.save();
    // Apply screen shake to game layer
    if (this.shakeFrame.intensity > 0) {
      this.gameCtx.translate(this.shakeFrame.offsetX, this.shakeFrame.offsetY);
      if (this.shakeFrame.rotation !== 0) this.gameCtx.rotate(this.shakeFrame.rotation);
      if (this.shakeFrame.zoom !== 1) this.gameCtx.scale(this.shakeFrame.zoom, this.shakeFrame.zoom);
    }
    return this.gameCtx;
  }

  /**
   * Release a context (restore transform).
   */
  releaseContext(ctx: CanvasRenderingContext2D): void {
    if (ctx === this.engine.ctx) return;
    ctx.restore();
  }

  /**
   * Register a glow emission for bloom.
   * Call from renderers when drawing glowing entities.
   */
  addGlowEmission(x: number, y: number, radius: number, color: string, intensity: number = 1): void {
    this.bloom.addEmission({ x, y, radius, color, intensity });
  }

  /**
   * Add a dynamic light source.
   */
  addLight(x: number, y: number, radius: number, color: string, intensity: number = 1): void {
    this.lighting.addLight({ x, y, radius, color, intensity });
  }

  /**
   * Update all subsystems. Call once per frame from GameEngine.
   */
  update(dt: number): void {
    this.shake.update(dt * 1000);
    this.comboVisual.update(dt);
    this.waveTransition.update(dt);
    this.lighting.update(dt);
  }

  /**
   * Composite all layers and render final frame to the target canvas.
   * This is the final step in the render pipeline.
   *
   * @param targetCtx The main game canvas context
   */
  composite(targetCtx: CanvasRenderingContext2D): void {
    if (!this.frameStarted) return;
    this.frameStarted = false;

    if (!targetCtx || !targetCtx.canvas) {
      return;
    }

    const w = this.width;
    const h = this.height;

    targetCtx.save();

    // 1. Draw background layer
    if (this.bgCtx) {
      targetCtx.drawImage(this.bgCanvas, 0, 0, w, h);
    }

    // 2. Draw lighting layer (if enabled and lights present)
    if (this.lighting.enabled && this.lighting.lightCount > 0) {
      if (!this.lightCanvas) {
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = targetCtx.canvas.width;
        this.lightCanvas.height = targetCtx.canvas.height;
      } else if (this.lightCanvas.width !== targetCtx.canvas.width || this.lightCanvas.height !== targetCtx.canvas.height) {
        this.lightCanvas.width = targetCtx.canvas.width;
        this.lightCanvas.height = targetCtx.canvas.height;
      }
      
      const lightCtx = this.lightCanvas.getContext('2d');
      if (lightCtx) {
        lightCtx.save();
        lightCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        lightCtx.clearRect(0, 0, w, h);
        this.lighting.render(lightCtx, w, h, this.engine);
        lightCtx.restore();

        targetCtx.save();
        targetCtx.globalCompositeOperation = 'screen';
        targetCtx.drawImage(this.lightCanvas, 0, 0, w, h);
        targetCtx.restore();
      }
    }

    // 3. Draw game layer
    if (this.gameCtx) {
      targetCtx.drawImage(this.gameCanvas, 0, 0, w, h);
    }

    // 4. Apply bloom
    if (this.bloom.getConfig().enabled) {
      this.bloom.render(targetCtx, targetCtx.canvas);
    }

    // 5. Apply wave transitions
    this.waveTransition.render(targetCtx, w, h, this.engine.globalTime);

    // 6. Apply combo visuals
    this.comboVisual.render(targetCtx, w / 2, h / 2, this.engine.globalTime);

    // 7. Apply post-processing
    this.postProcess.setHealthRatio(this.engine.health / this.engine.maxHealth);
    this.postProcess.setSaturationBoost(this.comboVisual.getSaturationBoost());
    this.postProcess.setChromaticOverride(this.shakeFrame.chromaticOffset);
    this.postProcess.render(targetCtx, w, h, this.engine.globalTime);

    targetCtx.restore();
  }

  /**
   * Reset all visual effects. Call on game over.
   */
  reset(): void {
    this.shake.reset();
    this.comboVisual.resetCombo();
    this.waveTransition.reset();
    this.lighting.clearLights();
  }

  /** Current quality preset */
  get preset(): QualityPreset {
    return this._preset;
  }
}
