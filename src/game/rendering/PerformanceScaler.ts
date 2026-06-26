import { GameEngine } from '../GameEngine';

/**
 * Quality presets inspired by professional 2026 browser/3D game engines (e.g. adaptive
 * Ultra/High/Balanced/Mobile with explicit dpr, vfx, post-effect scalars).
 * Our Canvas2D port: controls vfxScalar, mesh, + new crt/heat/emissive/glow hooks
 * that renderers consume. FPS scaler still auto-downgrades; manual preset overrides base.
 */
export const QUALITY_PRESETS = {
  Ultra:    { label: 'Ultra — max neon, full post, high DPR', vfx: 1.0,  mesh: 8,  crt: 0.22, heat: 0.008, emissive: 1.6, glow: 1.0, dprCap: 2.0 },
  High:     { label: 'High — rich VFX, balanced post',       vfx: 0.95, mesh: 10, crt: 0.16, heat: 0.006, emissive: 1.35, glow: 0.9, dprCap: 1.75 },
  Balanced: { label: 'Balanced — 60fps target, lighter FX',  vfx: 0.8,  mesh: 16, crt: 0.10, heat: 0.003, emissive: 1.1,  glow: 0.7, dprCap: 1.25 },
  Mobile:   { label: 'Mobile — 30-60fps, minimal post',      vfx: 0.55, mesh: 32, crt: 0.04, heat: 0.0,   emissive: 0.9,  glow: 0.4, dprCap: 1.0 },
} as const;

export type QualityPresetName = keyof typeof QUALITY_PRESETS;

export class PerformanceScaler {
  private engine: GameEngine;
  lastFpsTime: number = 0;
  frameCount: number = 0;
  fpsBuffer: number[] = [];
  targetFps: number = 90;
  currentFps: number = 90;
  vfxScalar: number = 1.0;
  meshComplexityStep: number = 10;

  // New post-effect / material scalars (ported concepts; 0=off, 1=full)
  crtIntensity: number = 0.16;
  heatDistort: number = 0.006;
  emissiveScale: number = 1.35;
  glowScalar: number = 0.9;

  currentPreset: QualityPresetName = 'High';

  constructor(engine: GameEngine) {
    this.engine = engine;
    if (typeof window !== 'undefined') {
      const savedHz = localStorage.getItem('nexus_target_hz');
      if (savedHz) {
        this.targetFps = parseInt(savedHz, 10);
        this.currentFps = this.targetFps;
      }
    }
    this.applyPreset('High');
  }

  /**
   * Apply named preset (manual quality switch). FPS auto-scaler still modulates on top.
   * Exposed for Settings + debug (window or engine hook).
   */
  applyPreset(name: QualityPresetName): void {
    const p = QUALITY_PRESETS[name];
    if (!p) return;
    this.currentPreset = name;
    this.vfxScalar = p.vfx;
    this.meshComplexityStep = p.mesh;
    this.crtIntensity = p.crt;
    this.heatDistort = p.heat;
    this.emissiveScale = p.emissive;
    this.glowScalar = p.glow;
    // Note: DPR clamping happens in GameEngine / highFidelity path using p.dprCap as guide
  }

  get isLowEnd(): boolean {
    return this.engine.isMobile || !this.engine.highFidelityVFX || this.vfxScalar < 0.6;
  }

  tick(): void {
    const now = performance.now();
    if (this.lastFpsTime === 0) {
      this.lastFpsTime = now;
      this.frameCount = 0;
      return;
    }

    this.frameCount++;
    const elapsed = now - this.lastFpsTime;

    if (elapsed >= 500) {
      const calculatedFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;

      this.fpsBuffer.push(calculatedFps);
      if (this.fpsBuffer.length > 6) {
        this.fpsBuffer.shift();
      }

      const sum = this.fpsBuffer.reduce((a, b) => a + b, 0);
      this.currentFps = Math.round(sum / this.fpsBuffer.length);

      // Auto-scale on top of current preset baseline
      const base = QUALITY_PRESETS[this.currentPreset];
      const downgradeThreshold = this.targetFps * 0.75;
      const severeLowThreshold = this.targetFps * 0.35;
      const mediumLowThreshold = this.targetFps * 0.50;

      if (this.currentFps < downgradeThreshold) {
        const rangePercent = Math.max(0, (this.currentFps - severeLowThreshold) / (downgradeThreshold - severeLowThreshold));
        this.vfxScalar = Math.min(base.vfx, 0.15 + rangePercent * 0.85);

        if (this.currentFps < severeLowThreshold) {
          this.meshComplexityStep = Math.max(base.mesh, 80);
        } else if (this.currentFps < mediumLowThreshold) {
          this.meshComplexityStep = Math.max(base.mesh, 40);
        } else {
          this.meshComplexityStep = Math.max(base.mesh, 20);
        }
        // Dampen post FX on low FPS
        this.crtIntensity = base.crt * 0.6;
        this.heatDistort = base.heat * 0.5;
        this.glowScalar = base.glow * 0.6;
      } else {
        this.vfxScalar = Math.min(base.vfx, this.vfxScalar + 0.08);
        if (this.vfxScalar >= base.vfx * 0.98) {
          this.vfxScalar = base.vfx;
          this.meshComplexityStep = base.mesh;
          this.crtIntensity = base.crt;
          this.heatDistort = base.heat;
          this.glowScalar = base.glow;
        } else if (this.vfxScalar > base.vfx * 0.65) {
          this.meshComplexityStep = Math.min(base.mesh, 20);
        }
      }
    }
  }
}