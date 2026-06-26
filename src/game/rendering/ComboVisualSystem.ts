/**
 * ComboVisualSystem — Visual feedback for score combos
 *
 * Displays floating combo counters, milestone celebrations, and escalating
 * visual effects as the player's kill combo increases.
 *
 * Milestone effects:
 *   5x:  Small flash + text pop at kill location
 *   10x: Screen pulse + golden text + particle burst
 *   25x: Chromatic aberration + time dilation + explosion ring
 *   50x: Full hitstop + mega-flash + shockwave + screen shake
 *
 * Architecture:
 *   - Floating texts: ring buffer of active floating labels
 *   - Combo timer: visual ring around player/cursor
 *   - Color grading: saturation increases with combo
 *   - All visuals are purely cosmetic — no gameplay impact
 */

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  life: number;
  maxLife: number;
  vy: number; // upward velocity
  scale: number;
  /** 'pop' | 'float' | 'explode' */
  animStyle: string;
}

export interface ComboMilestone {
  threshold: number;
  /** Effect name */
  effect: string;
  /** Screen shake preset name */
  shakePreset?: string;
  /** Whether to trigger hitstop */
  hitstop: boolean;
  /** Particle count */
  particles: number;
  /** Text color */
  textColor: string;
  /** Flash color */
  flashColor: string;
}

export const COMBO_MILESTONES: ComboMilestone[] = [
  { threshold: 5,  effect: 'pop',      hitstop: false, particles: 8,  textColor: '#ffffff', flashColor: 'rgba(255,255,255,0.1)' },
  { threshold: 10, effect: 'pulse',    hitstop: false, particles: 20, textColor: '#ffd700', flashColor: 'rgba(255,215,0,0.15)' },
  { threshold: 25, effect: 'explode',  hitstop: true,  particles: 40, textColor: '#ff6b35', flashColor: 'rgba(255,107,53,0.25)' },
  { threshold: 50, effect: 'megaflash',hitstop: true,  particles: 80, textColor: '#ff0040', flashColor: 'rgba(255,0,64,0.4)' },
  { threshold: 100,effect: 'legendary',hitstop: true,  particles: 150,textColor: '#ff00ff', flashColor: 'rgba(255,0,255,0.5)' },
];

export interface ComboVisualConfig {
  /** Max floating texts on screen */
  maxFloatingTexts: number;
  /** How long floating text lasts (ms) */
  textDurationMs: number;
  /** Upward drift speed (px/frame) */
  textRiseSpeed: number;
  /** Whether combo ring is shown */
  showComboRing: boolean;
  /** Whether to color-grade by combo */
  colorGrading: boolean;
  /** Font for combo text */
  font: string;
}

export const COMBO_PRESETS = {
  ultra:    { maxFloatingTexts: 20, textDurationMs: 1200, textRiseSpeed: 1.5, showComboRing: true,  colorGrading: true,  font: '900 24px "JetBrains Mono", monospace' },
  high:     { maxFloatingTexts: 15, textDurationMs: 1000, textRiseSpeed: 1.2, showComboRing: true,  colorGrading: true,  font: '800 22px "JetBrains Mono", monospace' },
  balanced: { maxFloatingTexts: 10, textDurationMs: 800,  textRiseSpeed: 1.0, showComboRing: false, colorGrading: false, font: '700 18px "JetBrains Mono", monospace' },
  mobile:   { maxFloatingTexts: 5,  textDurationMs: 600,  textRiseSpeed: 0.8, showComboRing: false, colorGrading: false, font: '700 14px "JetBrains Mono", monospace' },
} as const;

/** Max combo timer duration in seconds */
const COMBO_TIMEOUT_SECONDS = 3;

export class ComboVisualSystem {
  private config: ComboVisualConfig;
  private floatingTexts: FloatingText[] = [];
  private textIdx: number = 0;

  /** Current combo count */
  private combo: number = 0;
  /** Combo timer (counts down) */
  private comboTimer: number = 0;
  /** Last milestone that was triggered */
  private lastMilestone: number = 0;

  /** Current screen pulse intensity (0-1) */
  private pulseIntensity: number = 0;
  /** Current color grading saturation boost (0-1) */
  private saturationBoost: number = 0;

  /** Callbacks for external systems */
  onRequestScreenShake?: (preset: string) => void;
  onRequestHitstop?: (intensity: number) => void;
  onRequestParticles?: (x: number, y: number, count: number, color: string) => void;
  onRequestFlash?: (color: string) => void;

  /** Whether system is enabled */
  enabled: boolean = true;

  constructor(config: Partial<ComboVisualConfig> = {}) {
    this.config = { ...COMBO_PRESETS.high, ...config };
    this.floatingTexts = Array.from({ length: this.config.maxFloatingTexts }, () => ({
      x: 0, y: 0, text: '', color: '#fff', fontSize: 20,
      life: 0, maxLife: 1, vy: 0, scale: 1, animStyle: 'pop',
    }));
  }

  /**
   * Apply a quality preset.
   */
  applyPreset(preset: keyof typeof COMBO_PRESETS): void {
    this.config = { ...COMBO_PRESETS[preset] };
  }

  /**
   * Register a kill. Call from GameEngine when a bug is killed.
   * @returns The milestone that was triggered (if any)
   */
  registerKill(x: number, y: number, _killScore: number): ComboMilestone | null {
    if (!this.enabled) return null;

    this.combo++;
    this.comboTimer = COMBO_TIMEOUT_SECONDS;

    // Spawn floating text
    this.spawnFloatingText(x, y, `${this.combo}x`, this.getComboColor());

    // Check milestones
    for (const milestone of COMBO_MILESTONES) {
      if (this.combo >= milestone.threshold && this.lastMilestone < milestone.threshold) {
        this.triggerMilestone(milestone, x, y);
        this.lastMilestone = milestone.threshold;
        return milestone;
      }
    }

    return null;
  }

  /**
   * Update combo timer and floating texts. Call once per frame.
   */
  update(dt: number): void {
    if (!this.enabled) return;

    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    // Update pulse
    if (this.pulseIntensity > 0) {
      this.pulseIntensity -= dt * 2;
      if (this.pulseIntensity < 0) this.pulseIntensity = 0;
    }

    // Update saturation boost
    const targetSaturation = Math.min(0.3, this.combo * 0.005);
    this.saturationBoost += (targetSaturation - this.saturationBoost) * dt * 5;

    // Update floating texts
    for (const text of this.floatingTexts) {
      if (text.life <= 0) continue;
      // Convert maxLife in milliseconds to seconds for clean consistent logic
      const maxLifeSec = text.maxLife / 1000;
      text.life -= dt / maxLifeSec;
      text.y -= text.vy;
      if (text.life <= 0) text.life = 0;
    }
  }

  /**
   * Render combo visuals to canvas context.
   */
  render(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    globalTime: number,
  ): void {
    if (!this.enabled) return;

    // Render floating texts
    this.renderFloatingTexts(ctx);

    // Render combo ring
    if (this.config.showComboRing && this.combo > 1) {
      this.renderComboRing(ctx, playerX, playerY, globalTime);
    }
  }

  /**
   * Reset combo (timeout expired or game over).
   */
  resetCombo(): void {
    this.combo = 0;
    this.comboTimer = 0;
    this.lastMilestone = 0;
    this.saturationBoost = 0;
  }

  /**
   * Get current color grading saturation boost (0-1).
   * Apply to canvas filter or global composite.
   */
  getSaturationBoost(): number {
    return this.config.colorGrading ? this.saturationBoost : 0;
  }

  /**
   * Get current screen pulse intensity (0-1).
   */
  getPulseIntensity(): number {
    return this.pulseIntensity;
  }

  /** Current combo count */
  get currentCombo(): number {
    return this.combo;
  }

  /** Combo progress 0-1 (how close to timeout) */
  get comboProgress(): number {
    if (COMBO_TIMEOUT_SECONDS <= 0) return 0;
    return this.comboTimer / COMBO_TIMEOUT_SECONDS;
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const ft = this.floatingTexts[this.textIdx];
    ft.x = x;
    ft.y = y;
    ft.text = text;
    ft.color = color;
    ft.life = 1;
    ft.maxLife = this.config.textDurationMs;
    ft.vy = this.config.textRiseSpeed;
    ft.scale = 1 + this.combo * 0.05; // Scale up with combo
    ft.animStyle = this.combo >= 25 ? 'explode' : this.combo >= 10 ? 'pulse' : 'pop';
    ft.fontSize = 16 + Math.min(24, this.combo * 0.5);

    this.textIdx = (this.textIdx + 1) % this.config.maxFloatingTexts;
  }

  private triggerMilestone(milestone: ComboMilestone, x: number, y: number): void {
    // Screen shake
    if (milestone.shakePreset) {
      this.onRequestScreenShake?.(milestone.shakePreset);
    }

    // Hitstop
    if (milestone.hitstop) {
      this.onRequestHitstop?.(0.5 + (milestone.threshold / 100) * 0.5);
    }

    // Particles
    this.onRequestParticles?.(x, y, milestone.particles, milestone.textColor);

    // Flash
    this.onRequestFlash?.(milestone.flashColor);

    // Pulse
    this.pulseIntensity = Math.min(1, milestone.threshold / 50);
  }

  private getComboColor(): string {
    if (this.combo >= 50) return '#ff0040';
    if (this.combo >= 25) return '#ff6b35';
    if (this.combo >= 10) return '#ffd700';
    return '#ffffff';
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const text of this.floatingTexts) {
      if (text.life <= 0) continue;

      const progress = 1 - text.life;
      const alpha = text.life > 0.7 ? 1 : text.life / 0.7;

      let scale = text.scale;
      let offsetX = 0;

      // Animation styles
      if (text.animStyle === 'pop') {
        scale *= 1 + Math.sin(progress * Math.PI) * 0.3;
      } else if (text.animStyle === 'pulse') {
        scale *= 1 + Math.sin(progress * Math.PI * 4) * 0.15;
      } else if (text.animStyle === 'explode') {
        scale *= 1 + Math.sin(progress * Math.PI * 2) * 0.4;
        offsetX = Math.sin(progress * Math.PI * 6) * 5;
      }

      ctx.save();
      ctx.translate(text.x + offsetX, text.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = this.config.font.replace(/\d+px/, `${text.fontSize}px`);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(text.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }

  private renderComboRing(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    globalTime: number,
  ): void {
    const radius = 40 + this.combo * 0.5;
    const pulse = Math.sin(globalTime * 8) * 3;

    ctx.save();
    ctx.strokeStyle = this.getComboColor();
    ctx.globalAlpha = 0.4 + this.comboTimer / COMBO_TIMEOUT_SECONDS * 0.4;
    ctx.lineWidth = 2;

    // Rotating dashes
    const dashLen = 10;
    const gapLen = 5;
    ctx.setLineDash([dashLen, gapLen]);
    ctx.lineDashOffset = -globalTime * 50;

    ctx.beginPath();
    ctx.arc(playerX, playerY, radius + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Timer arc (shrinks as combo times out)
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(playerX, playerY, radius - 5, -Math.PI / 2, -Math.PI / 2 + this.comboProgress * Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
