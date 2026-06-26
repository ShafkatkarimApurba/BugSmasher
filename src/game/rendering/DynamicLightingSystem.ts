/**
 * DynamicLightingSystem — 2D lighting with radial gradients
 *
 * Creates a "living" atmosphere by attaching dynamic light sources to
 * game entities (bug glow, explosions, powerups) and applying ambient
 * shadow overlay to unlit areas.
 *
 * Architecture:
 *   - Light sources: { x, y, radius, color, intensity, flicker }
 *   - Rendered as radial gradients composited with 'screen' or 'lighter'
 *   - Shadow overlay: full-screen darkening with light cutouts
 *   - Biome-specific ambient tints
 *   - Flicker variation for organic "living" feel
 *
 * Performance: O(n) per frame where n = active lights, capped at 32/16/8/4
 * based on quality preset.
 */

import { GameEngine } from '../GameEngine';
import { applyAlpha } from './RenderUtils';

export interface LightSource {
  /** Position */
  x: number;
  y: number;
  /** Light radius in pixels */
  radius: number;
  /** Light color as CSS string */
  color: string;
  /** 0-1 intensity */
  intensity: number;
  /** Whether light flickers organically */
  flicker: boolean;
  /** Flicker speed in Hz */
  flickerSpeed: number;
  /** Flicker amount (0 = steady, 1 = extreme flicker) */
  flickerAmount: number;
  /** Optional: unique ID for stable reference */
  id?: string;
  /** Inner radius for gradient (0 = pure radial, higher = hard center) */
  innerRadius?: number;
}

export interface LightingConfig {
  /** Maximum simultaneous lights */
  maxLights: number;
  /** Ambient darkness level (0 = fully lit, 0.8 = very dark) */
  ambientDarkness: number;
  /** Whether to use shadow overlay */
  shadowOverlay: boolean;
  /** Whether lights flicker organically */
  organicFlicker: boolean;
  /** Shadow overlay color */
  shadowColor: string;
  /** Light blend mode: 'screen' | 'lighter' | 'source-over' */
  blendMode: GlobalCompositeOperation;
}

export const LIGHTING_PRESETS = {
  ultra:    { maxLights: 32, ambientDarkness: 0.65, shadowOverlay: true,  organicFlicker: true,  blendMode: 'screen' as GlobalCompositeOperation, shadowColor: '#000510' },
  high:     { maxLights: 16, ambientDarkness: 0.55, shadowOverlay: true,  organicFlicker: true,  blendMode: 'screen' as GlobalCompositeOperation, shadowColor: '#000510' },
  balanced: { maxLights: 8,  ambientDarkness: 0.4,  shadowOverlay: false, organicFlicker: false, blendMode: 'lighter' as GlobalCompositeOperation, shadowColor: '#000000' },
  mobile:   { maxLights: 4,  ambientDarkness: 0.25, shadowOverlay: false, organicFlicker: false, blendMode: 'source-over' as GlobalCompositeOperation, shadowColor: '#000000' },
} as const;

/** Biome-specific ambient light tints */
export const BIOME_AMBIENT_TINTS: Record<string, string> = {
  default: '#0a0a10',
  quantum_void: '#1a0033',
  ember_depths: '#331000',
  frostbyte: '#001a2a',
  void_abyss: '#000000',
  golden_cache: '#2a2a00',
  golden_spire: '#1a1a0a',
};

export class DynamicLightingSystem {
  private lights: LightSource[] = [];
  private config: LightingConfig;

  /** Screen resolution cache for distance culling */
  private width: number = 800;
  private height: number = 600;

  /** Whether lighting is enabled */
  enabled: boolean = true;

  /** Global time reference for flicker animation */
  private globalTime: number = 0;

  /** Biome-specific ambient tint override */
  ambientTint: string | null = null;

  constructor(config: Partial<LightingConfig> = {}) {
    this.config = { ...LIGHTING_PRESETS.high, ...config };
  }

  /**
   * Apply a quality preset.
   */
  applyPreset(preset: keyof typeof LIGHTING_PRESETS): void {
    this.config = { ...LIGHTING_PRESETS[preset] };
    this.enabled = this.config.maxLights > 0;
  }

  /**
   * Add a dynamic light source.
   * If max lights exceeded, furthest light is removed.
   */
  addLight(light: Partial<LightSource> & Pick<LightSource, 'x' | 'y' | 'radius' | 'color'>): void {
    if (!this.enabled) return;

    const fullLight: LightSource = {
      intensity: 1,
      flicker: false,
      flickerSpeed: 8,
      flickerAmount: 0.3,
      innerRadius: 0,
      ...light,
    };

    this.lights.push(fullLight);

    // Cull excess lights (remove furthest from screen center)
    if (this.lights.length > this.config.maxLights) {
      this.cullFurthestLight();
    }
  }

  /**
   * Add a light with auto-generated ID and return the ID.
   */
  addTrackedLight(light: Partial<LightSource> & Pick<LightSource, 'x' | 'y' | 'radius' | 'color'>): string {
    const id = `light_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.addLight({ ...light, id });
    return id;
  }

  /**
   * Update a light's position by ID.
   */
  updateLight(id: string, x: number, y: number, intensity?: number): void {
    const light = this.lights.find(l => l.id === id);
    if (light) {
      light.x = x;
      light.y = y;
      if (intensity !== undefined) light.intensity = intensity;
    }
  }

  /**
   * Remove a light by ID.
   */
  removeLight(id: string): void {
    const idx = this.lights.findIndex(l => l.id === id);
    if (idx >= 0) this.lights.splice(idx, 1);
  }

  /**
   * Clear all lights.
   */
  clearLights(): void {
    this.lights.length = 0;
  }

  /**
   * Update lighting system. Call once per frame.
   */
  update(dt: number): void {
    this.globalTime += dt;
  }

  /**
   * Render lighting to the given context.
   * Draws light sources onto the scene with appropriate blending.
   *
   * @param ctx Canvas context (should be the lighting layer context)
   * @param width Canvas width
   * @param height Canvas height
   * @param engine GameEngine reference for ambient tint lookup
   */
  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    engine?: GameEngine,
  ): void {
    if (!this.enabled || this.lights.length === 0) return;

    this.width = width;
    this.height = height;

    // Clear lighting layer with ambient darkness
    const ambientTint = this.ambientTint ||
      (engine ? BIOME_AMBIENT_TINTS[engine.currentBiome || 'default'] || BIOME_AMBIENT_TINTS.default : BIOME_AMBIENT_TINTS.default);

    ctx.save();

    // Draw each light as radial gradient
    ctx.globalCompositeOperation = this.config.blendMode;

    for (const light of this.lights) {
      this.renderLight(ctx, light);
    }

    // Optional: shadow overlay
    if (this.config.shadowOverlay) {
      this.renderShadowOverlay(ctx, width, height, ambientTint);
    }

    ctx.restore();
  }

  /**
   * Get light data for other systems (e.g., bloom integration).
   */
  getLightEmissions(): Array<{ x: number; y: number; radius: number; intensity: number }> {
    return this.lights.map(l => ({
      x: l.x,
      y: l.y,
      radius: l.radius,
      intensity: l.intensity,
    }));
  }

  /** Number of active lights */
  get lightCount(): number {
    return this.lights.length;
  }

  private renderLight(ctx: CanvasRenderingContext2D, light: LightSource): void {
    const { x, y, radius, color, intensity, flicker, flickerSpeed, flickerAmount, innerRadius } = light;

    let effectiveIntensity = intensity;

    // Organic flicker
    if (flicker && this.config.organicFlicker) {
      const flickerNoise = Math.sin(this.globalTime * flickerSpeed) *
        Math.sin(this.globalTime * flickerSpeed * 2.3 + 1.7) *
        Math.sin(this.globalTime * flickerSpeed * 0.7 + 3.1);
      effectiveIntensity *= 1 + flickerNoise * flickerAmount * 0.5;
      effectiveIntensity = Math.max(0.1, Math.min(1, effectiveIntensity));
    }

    // Create radial gradient
    const grad = ctx.createRadialGradient(
      x, y, innerRadius || radius * 0.1,
      x, y, radius,
    );

    // Parse color and apply intensity using shared utility
    const colorWithAlpha = applyAlpha(color, effectiveIntensity);
    const fadeColor = applyAlpha(color, 0);

    grad.addColorStop(0, colorWithAlpha);
    grad.addColorStop(0.4, applyAlpha(color, effectiveIntensity * 0.5));
    grad.addColorStop(1, fadeColor);

    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  private renderShadowOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tint: string,
  ): void {
    // Use destination-out to cut holes for lights, then fill with tint
    ctx.globalCompositeOperation = 'destination-out';

    for (const light of this.lights) {
      const grad = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius * 1.2,
      );
      grad.addColorStop(0, `rgba(0,0,0,${light.intensity})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(
        light.x - light.radius * 1.2,
        light.y - light.radius * 1.2,
        light.radius * 2.4,
        light.radius * 2.4,
      );
    }

    // Now fill the shadow
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.config.shadowColor || tint;
    ctx.globalAlpha = this.config.ambientDarkness;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  private cullFurthestLight(): void {
    // Find light furthest from screen center (optimized to correct coordinates)
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    let furthestIdx = 0;
    let furthestDistSq = 0;

    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      const dx = light.x - centerX;
      const dy = light.y - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq > furthestDistSq) {
        furthestDistSq = distSq;
        furthestIdx = i;
      }
    }

    this.lights.splice(furthestIdx, 1);
  }
}
