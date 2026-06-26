/**
 * ParticleTrailSystem — Persistent movement trails for entities
 *
 * Generates fading trail segments behind moving bugs, giving a sense of
 * speed and motion. Trails are rendered as connected line segments with
 * decreasing opacity, creating a "comet tail" effect.
 *
 * Architecture:
 *   - Ring buffer of trail points per entity (max 32 points)
 *   - Auto-culling for offscreen entities
 *   - Color matches bug type with optional biome tinting
 *   - Performance: O(n) where n = active trails, capped at 128 total
 */

export interface TrailPoint {
  x: number;
  y: number;
  /** 0-1 opacity factor based on age */
  opacity: number;
  /** Size of trail at this point */
  size: number;
}

export interface EntityTrail {
  /** Entity ID (bug index or custom string) */
  entityId: string;
  /** Ring buffer of trail points */
  points: TrailPoint[];
  /** Current write index in ring buffer */
  writeIndex: number;
  /** Whether this trail is currently being written to */
  active: boolean;
  /** Color of the trail (derived from entity) */
  color: string;
  /** Glow color for bloom integration */
  glowColor: string;
  /** Max length of trail in points */
  maxLength: number;
}

export interface TrailConfig {
  /** Max trail points per entity */
  maxPointsPerTrail: number;
  /** How often to sample a point (in frames) */
  sampleInterval: number;
  /** Trail fade speed (opacity loss per frame) */
  fadeSpeed: number;
  /** Base trail width */
  baseWidth: number;
  /** Whether to taper trail ends */
  taper: boolean;
  /** Whether trails glow (for bloom integration) */
  glow: boolean;
}

export const TRAIL_PRESETS = {
  ultra:   { maxPointsPerTrail: 32, sampleInterval: 1, fadeSpeed: 0.02, baseWidth: 4, taper: true, glow: true },
  high:    { maxPointsPerTrail: 24, sampleInterval: 1, fadeSpeed: 0.025, baseWidth: 3, taper: true, glow: true },
  balanced:{ maxPointsPerTrail: 16, sampleInterval: 2, fadeSpeed: 0.035, baseWidth: 2.5, taper: true, glow: false },
  mobile:  { maxPointsPerTrail: 0,  sampleInterval: 3, fadeSpeed: 0.05, baseWidth: 2, taper: false, glow: false },
} as const;

/** Max concurrent trails system-wide */
const MAX_TRAILS = 128;

export class ParticleTrailSystem {
  private trails: Map<string, EntityTrail> = new Map();
  private config: TrailConfig;
  private frameCounter: number = 0;

  /** Whether trails are enabled */
  enabled: boolean = true;

  constructor(config: Partial<TrailConfig> = {}) {
    this.config = { ...TRAIL_PRESETS.high, ...config };
  }

  /**
   * Apply a quality preset.
   */
  applyPreset(preset: keyof typeof TRAIL_PRESETS): void {
    this.config = { ...TRAIL_PRESETS[preset] };
    this.enabled = this.config.maxPointsPerTrail > 0;
  }

  /**
   * Register a new trail for an entity. Call when entity is spawned.
   */
  registerTrail(
    entityId: string,
    color: string,
    glowColor: string,
    maxLength?: number,
  ): void {
    if (!this.enabled) return;
    if (this.trails.size >= MAX_TRAILS) {
      // Cull oldest inactive trail
      this.cullOldest();
    }

    this.trails.set(entityId, {
      entityId,
      points: new Array(this.config.maxPointsPerTrail).fill(null).map(() => ({
        x: 0, y: 0, opacity: 0, size: 0,
      })),
      writeIndex: 0,
      active: true,
      color,
      glowColor,
      maxLength: maxLength || this.config.maxPointsPerTrail,
    });
  }

  /**
   * Add a point to an entity's trail. Call each frame from entity update.
   */
  addPoint(entityId: string, x: number, y: number, size: number = 1): void {
    if (!this.enabled) return;
    const trail = this.trails.get(entityId);
    if (!trail || !trail.active) return;

    // Check sample interval based on the static frameCounter updated in update()
    if (this.frameCounter % this.config.sampleInterval !== 0) return;

    const point = trail.points[trail.writeIndex];
    point.x = x;
    point.y = y;
    point.opacity = 1;
    point.size = size * this.config.baseWidth;

    trail.writeIndex = (trail.writeIndex + 1) % trail.maxLength;
  }

  /**
   * Mark a trail as inactive (entity despawned). It will fade out naturally.
   */
  deactivateTrail(entityId: string): void {
    const trail = this.trails.get(entityId);
    if (trail) {
      trail.active = false;
    }
  }

  /**
   * Immediately remove a trail.
   */
  removeTrail(entityId: string): void {
    this.trails.delete(entityId);
  }

  /**
   * Update all trails. Call once per frame from GameEngine.
   */
  update(): void {
    if (!this.enabled) return;

    // Increment frame counter once per frame here
    this.frameCounter++;

    for (const [id, trail] of this.trails) {
      let allFaded = !trail.active;

      for (const point of trail.points) {
        if (point.opacity > 0) {
          point.opacity -= this.config.fadeSpeed;
          if (point.opacity < 0) point.opacity = 0;
          else allFaded = false;
        }
      }

      // Remove fully faded inactive trails
      if (allFaded) {
        this.trails.delete(id);
      }
    }
  }

  /**
   * Render all trails to a canvas context.
   * @param ctx Canvas rendering context
   * @param globalTime Current game time for optional shimmer
   * @param globalAlpha Base alpha multiplier
   */
  render(ctx: CanvasRenderingContext2D, globalTime: number, globalAlpha: number = 1): void {
    if (!this.enabled || this.trails.size === 0) return;

    ctx.save();

    for (const trail of this.trails.values()) {
      this.renderTrail(ctx, trail, globalTime, globalAlpha);
    }

    ctx.restore();
  }

  /**
   * Get glow emission data for bloom integration.
   * Returns array of { x, y, radius, intensity } for glowing trails.
   */
  getGlowEmissions(): Array<{ x: number; y: number; radius: number; intensity: number }> {
    if (!this.enabled || !this.config.glow) return [];

    const emissions: Array<{ x: number; y: number; radius: number; intensity: number }> = [];

    for (const trail of this.trails.values()) {
      for (let i = 0; i < trail.points.length; i++) {
        const point = trail.points[i];
        if (point.opacity < 0.2) continue;
        emissions.push({
          x: point.x,
          y: point.y,
          radius: point.size * 3,
          intensity: point.opacity * 0.3,
        });
      }
    }

    return emissions;
  }

  /**
   * Reset all active trails. Call on game over / wave reset.
   */
  reset(): void {
    this.trails.clear();
    this.frameCounter = 0;
  }

  /** Number of active trails */
  get trailCount(): number {
    return this.trails.size;
  }

  private renderTrail(
    ctx: CanvasRenderingContext2D,
    trail: EntityTrail,
    _globalTime: number,
    globalAlpha: number,
  ): void {
    const { points, maxLength, color } = trail;
    const len = maxLength;
    if (len < 2) return;

    // Build ordered list of points (handle ring buffer)
    const ordered: TrailPoint[] = [];
    for (let i = 0; i < len; i++) {
      const idx = (trail.writeIndex + i) % len;
      const point = points[idx];
      if (point.opacity > 0.01) {
        ordered.push(point);
      }
    }

    if (ordered.length < 2) return;

    // Draw as fading line strip
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1];
      const curr = ordered[i];
      const avgOpacity = (prev.opacity + curr.opacity) / 2;

      if (avgOpacity < 0.01) continue;

      const progress = i / ordered.length;
      let width = this.config.baseWidth * avgOpacity * globalAlpha;

      if (this.config.taper) {
        width *= (1 - progress * 0.8); // Taper toward end
      }

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.strokeStyle = color;
      ctx.globalAlpha = avgOpacity * 0.6 * globalAlpha;
      ctx.lineWidth = Math.max(0.5, width);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private cullOldest(): void {
    let oldestId: string | null = null;
    let oldestIndex = Infinity;

    for (const [id, trail] of this.trails) {
      if (!trail.active && trail.writeIndex < oldestIndex) {
        oldestIndex = trail.writeIndex;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.trails.delete(oldestId);
    }
  }
}
