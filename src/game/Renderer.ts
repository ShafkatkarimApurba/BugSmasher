/**
 * Renderer v3.0 — Visual Overhaul Edition
 *
 * Replaces the original Renderer with a VisualFXPipeline-powered compositor.
 * All sub-renderers (BugRenderer, EnvironmentRenderer, ParticleRenderer, UIRenderer)
 * are preserved but now render to layer contexts provided by the pipeline.
 *
 * New in v3.0:
 *   - VisualFXPipeline for multi-layer compositing
 *   - ScreenShakeSystem integration
 *   - Bloom emission from bugs and particles
 *   - Dynamic lighting from entities
 *   - Post-processing (vignette, scanlines, grain)
 *   - Combo visual feedback
 *   - Wave transition effects
 *
 * The Renderer remains the single interface that GameEngine talks to.
 */

import { GameEngine } from './GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from './GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from './ParticleSystem';
import { PerformanceScaler } from './rendering/PerformanceScaler';
import { EnvironmentRenderer } from './rendering/EnvironmentRenderer';
import { BugRenderer } from './rendering/BugRenderer';
import { ParticleRenderer } from './rendering/ParticleRenderer';
import { UIRenderer } from './rendering/UIRenderer';
import { VisualFXPipeline, QualityPreset } from './rendering/VisualFXPipeline';

/**
 * Canvas orchestrator — delegates drawing to focused sub-renderers
 * and composites through the VisualFXPipeline.
 *
 * @see EnvironmentRenderer, BugRenderer, ParticleRenderer, UIRenderer
 * @see VisualFXPipeline for multi-layer compositing
 */
export class Renderer {
  engine: GameEngine;
  isGlitching: boolean = false;
  fireAlpha: number = 0;
  clickFlash: number = 0;
  impactFlash: number = 0;
  powerupAlpha: number = 0;
  chromaticOffset: number = 0;

  private scaler: PerformanceScaler;
  private environment: EnvironmentRenderer;
  private bugs: BugRenderer;
  private particles: ParticleRenderer;
  private ui: UIRenderer;

  /** v3.0: Visual effects pipeline */
  private pipeline: VisualFXPipeline;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.scaler = new PerformanceScaler(engine);
    this.environment = new EnvironmentRenderer(engine, this, this.scaler);
    this.bugs = new BugRenderer(engine, this, this.scaler);
    this.particles = new ParticleRenderer(engine, this, this.scaler);
    this.ui = new UIRenderer(engine, this, this.scaler);

    // Initialize the visual FX pipeline
    this.pipeline = new VisualFXPipeline(engine, this.scaler);
    this.pipeline.applyPreset(this.detectPreset());
  }

  /** Auto-detect quality preset based on device capabilities */
  private detectPreset(): QualityPreset {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const nav = navigator as Navigator & { deviceMemory?: number };
    const memory = nav.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    if (isMobile && (memory < 4 || cores < 4)) return 'mobile';
    if (isMobile) return 'balanced';
    if (memory >= 8 && cores >= 8) return 'ultra';
    if (memory >= 4 && cores >= 4) return 'high';
    return 'balanced';
  }

  /** Helper to safely map scaler preset name to pipeline preset format */
  private mapPresetName(name: string): QualityPreset {
    const lower = name.toLowerCase();
    if (lower === 'ultra' || lower === 'high' || lower === 'balanced' || lower === 'mobile') {
      return lower;
    }
    return 'high';
  }

  /** Programmatically set quality preset */
  setQualityPreset(preset: QualityPreset): void {
    this.pipeline.applyPreset(preset);
  }

  get isLowEnd(): boolean {
    return this.scaler.isLowEnd;
  }

  get vfxScalar(): number {
    return this.scaler.vfxScalar;
  }

  set vfxScalar(value: number) {
    this.scaler.vfxScalar = value;
  }

  get meshComplexityStep(): number {
    return this.scaler.meshComplexityStep;
  }

  get currentFps(): number {
    return this.scaler.currentFps;
  }

  set currentFps(value: number) {
    this.scaler.currentFps = value;
  }

  /**
   * v3.0: Access the shake system for external triggers (e.g., GameEngine on kill).
   */
  get shake() {
    return this.pipeline.shake;
  }

  /**
   * v3.0: Access the combo visual system.
   */
  get comboVisual() {
    return this.pipeline.comboVisual;
  }

  /**
   * v3.0: Access the wave transition system.
   */
  get waveTransition() {
    return this.pipeline.waveTransition;
  }

  /**
   * v3.0: Register a glow emission for bloom.
   */
  emitGlow(x: number, y: number, radius: number, color: string, intensity: number = 1): void {
    this.pipeline.addGlowEmission(x, y, radius, color, intensity);
  }

  /**
   * v3.0: Add a dynamic light source.
   */
  addLight(x: number, y: number, radius: number, color: string, intensity: number = 1): void {
    this.pipeline.addLight(x, y, radius, color, intensity);
  }

  /**
   * v3.0: Update visual subsystems. Call from GameEngine update loop.
   */
  updateVisuals(dt: number): void {
    // Sync current PerformanceScaler quality settings to pipeline
    const currentPreset = this.mapPresetName(this.scaler.currentPreset);
    this.pipeline.applyPreset(currentPreset);

    this.pipeline.update(dt);
  }

  /**
   * v3.0: Trigger a kill effect (shake + bloom pulse).
   */
  triggerKillEffect(x: number, y: number, isElite: boolean = false, combo: number = 0): void {
    const preset = isElite ? 'killElite' : combo > 10 ? 'killStandard' : 'killLight';
    this.shake.triggerPreset(preset);

    // Bloom pulse at kill location
    const bloomRadius = isElite ? 80 : 40 + combo * 2;
    const color = isElite ? '#ff6600' : '#00ff88';
    this.emitGlow(x, y, bloomRadius, color, 0.8);

    // Dynamic light flash
    this.addLight(x, y, bloomRadius * 1.5, color, 0.6);
  }

  /** Legacy draw fallback method (GameEngine entry point) */
  draw(): void {
    this.updatePerformanceScaler();
    this.renderFrame(this.engine.ctx);
  }

  /**
   * v3.0: Full render pipeline with multi-layer compositing.
   * Call this instead of individual draw methods for the complete frame.
   */
  renderFrame(ctx: CanvasRenderingContext2D): void {
    const w = this.engine.width;
    const h = this.engine.height;

    // Ensure pipeline is sized correctly
    this.pipeline.resize(w, h, this.engine.dpr);

    // Begin frame
    this.pipeline.beginFrame();

    // 1. Render background layer (M1-T5: draw to pipeline bgCtx for correct integration)
    const bgCtx = this.pipeline.getBackgroundContext();
    const origCtx = this.engine.ctx;
    this.engine.ctx = bgCtx;
    this.drawBiomeBackground();
    this.engine.ctx = origCtx;
    this.releaseContext(bgCtx);

    // 2. Render game layer
    const gameCtx = this.pipeline.getGameContext();
    const originalCtx = this.engine.ctx;
    this.engine.ctx = gameCtx; // Temporarily redirect engine context for sub-renderers

    // Draw splatters
    const activeSplatters = this.engine.particleSystem.splatters.filter(s => s.active);
    for (let i = 0; i < activeSplatters.length; i++) {
      this.particles.drawSplatter(activeSplatters[i]);
    }

    // Draw shockwaves
    const activeShockwaves = this.engine.particleSystem.shockwaves.filter(s => s.active);
    for (let i = 0; i < activeShockwaves.length; i++) {
      this.particles.drawShockwave(activeShockwaves[i]);
    }

    // Draw lasers
    const activeLasers = this.engine.particleSystem.lasers.filter(l => l.active);
    for (let i = 0; i < activeLasers.length; i++) {
      this.particles.drawLaser(activeLasers[i]);
    }

    // Draw muzzle flashes
    const activeMuzzles = this.engine.particleSystem.muzzleFlashes.filter(m => m.active);
    for (let i = 0; i < activeMuzzles.length; i++) {
      this.particles.drawMuzzleFlash(activeMuzzles[i]);
    }

    // Draw hazards
    for (let i = 0; i < this.engine.hazards.length; i++) {
      this.drawHazard(this.engine.hazards[i]);
    }

    // Render trails
    this.engine.trailSystem.render(gameCtx, this.engine.globalTime);

    // Draw bugs
    for (let i = 0; i < this.engine.bugs.length; i++) {
      this.drawBug(this.engine.bugs[i], 0);
    }

    // Draw powerups
    for (let i = 0; i < this.engine.powerups.length; i++) {
      this.drawPowerup(this.engine.powerups[i]);
    }

    // Draw resources
    const activeResources = this.engine.resources.filter(r => r.active);
    for (let i = 0; i < activeResources.length; i++) {
      this.drawResource(activeResources[i]);
    }

    // Draw particles
    const activeParticles = this.engine.particleSystem.particles.filter(p => p.active);
    for (let i = 0; i < activeParticles.length; i++) {
      this.particles.drawParticle(activeParticles[i]);
    }

    // Draw base
    this.drawBase();

    this.engine.ctx = originalCtx; // Restore engine context
    this.releaseContext(gameCtx);

    // 3. Composite everything
    this.pipeline.composite(ctx);

    // M1-T3: apply postProcess CSS filter for saturation/combo grading (complements canvas post)
    const canvasEl = ctx.canvas as HTMLCanvasElement | undefined;
    if (canvasEl && this.pipeline.postProcess) {
      const filter = this.pipeline.postProcess.getCSSFilter ? this.pipeline.postProcess.getCSSFilter() : '';
      canvasEl.style.filter = filter || '';
    }

    // Apply white flash juice overlays directly on top of final composites
    if (this.clickFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.clickFlash * 0.05})`;
      ctx.fillRect(0, 0, w, h);
      this.clickFlash *= 0.85;
      if (this.clickFlash < 0.01) this.clickFlash = 0;
    }

    if (this.engine.impactFrame > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.engine.impactFrame * 0.8})`;
      ctx.fillRect(0, 0, w, h);
    }

    // 4. Draw UI on top (direct to screen, not through pipeline)
    this.ui.drawActivePowerupUI(w, h);
    this.ui.drawBossHealthBar(w, h);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private releaseContext(ctx: CanvasRenderingContext2D): void {
    this.pipeline.releaseContext(ctx);
  }

  // --- Delegation surface (preserves public API for tests & external callers) ---

  drawBiomeBackground = () => this.environment.drawBiomeBackground();
  drawGrid = (...args: Parameters<EnvironmentRenderer['drawGrid']>) => this.environment.drawGrid(...args);
  drawStarfield = (...args: Parameters<EnvironmentRenderer['drawStarfield']>) =>
    this.environment.drawStarfield(...args);
  drawLavaBubbles = () => this.environment.drawLavaBubbles();
  drawSnowflakes = () => this.environment.drawSnowflakes();
  drawDynamicMesh = () => this.environment.drawDynamicMesh();




  drawBossIntro = () => this.environment.drawBossIntro();
  drawBossWarning = () => this.environment.drawBossWarning();
  drawClouds = () => this.particles.drawClouds();

  drawHazard = (h: Hazard) => this.bugs.drawHazard(h);
  drawBase = () => this.bugs.drawBase();
  drawBug(bug: Bug, _flashT: number = 0) {
    // v3.0: BugRenderer now owns emission of glow/light for its entities (M1-T6)
    this.bugs.drawBug(bug);
  }
  drawBugTrail = (bug: Bug) => this.bugs.drawBugTrail(bug);
  drawBugBody = (bug: Bug, legSwing: number) => this.bugs.drawBugBody(bug, legSwing);

  drawPowerup(p: Powerup) {
    this.particles.drawPowerup(p);

    // v3.0: Glow from powerups
    const glowColors: Record<string, string> = {
      health: '#ff3366',
      shield: '#4488ff',
      speed: '#ffcc00',
      bomb: '#ff4444',
      freeze: '#44ffff',
      magnet: '#ff88ff',
    };
    const glowColor = glowColors[p.type] || '#ffffff';
    this.emitGlow(p.x, p.y, 30, glowColor, 0.5);
  }
  drawResource = (r: ResourcePickup) => this.particles.drawResource(r);
  drawSplatter = (s: Splatter) => this.particles.drawSplatter(s);
  drawParticle = (p: Particle) => this.particles.drawParticle(p);
  drawShockwave = (sw: Shockwave) => this.particles.drawShockwave(sw);
  drawLaser = (l: Laser) => this.particles.drawLaser(l);
  drawMuzzleFlash = (f: MuzzleFlash) => this.particles.drawMuzzleFlash(f);

  // --- Delegation methods to preserve legacy API for unit tests ---
  updatePerformanceScaler() {
    this.scaler.tick();
  }

  drawBossHealthBar(width: number, height: number) {
    this.ui.drawBossHealthBar(width, height);
  }

  drawActivePowerupUI(width: number, height: number) {
    this.ui.drawActivePowerupUI(width, height);
  }

  drawLightingPass(width: number, height: number) {
    this.ui.drawLightingPass(width, height);
  }
}