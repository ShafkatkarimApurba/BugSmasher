/**
 * HitstopSystem — Game juice through frame-freezing
 *
 * Hitstop (also called "impact freeze") is a technique originating from fighting
 * games (Street Fighter, Mortal Kombat, Smash Bros) where the game pauses for
 * a brief moment on impact to give weight to attacks and provide a window for
 * player reaction.
 *
 * Architecture:
 *   - Integrates into GameEngine's update loop
 *   - Freezes game state updates while allowing render interpolation
 *   - Supports stackable hitstops (multiple simultaneous freezes)
 *   - Visual-only mode: freezes entities but particles still animate
 *
 * @see https://www.youtube.com/watch?v=6FRUg-Lu99M
 */

import { GameConfig } from './GameConfig';

export interface HitstopFrame {
  remainingMs: number;
  totalMs: number;
  intensity: number; // 0-1, controls visual/audio distortion amount
  visualOnly: boolean; // if true, entities freeze but particles continue
  comboMultiplier: number; // hitstop duration scales with combo
}

export interface HitstopConfig {
  /** Base duration in ms for a standard bug kill */
  baseKillHitstopMs: number;
  /** Base duration in ms for boss damage */
  bossDamageHitstopMs: number;
  /** Base duration in ms for player taking damage */
  playerDamageHitstopMs: number;
  /** Base duration in ms for wave transition */
  waveTransitionHitstopMs: number;
  /** Maximum combo multiplier for hitstop duration */
  maxComboMultiplier: number;
  /** Whether hitstop is enabled at all */
  enabled: boolean;
  /** Reduced hitstop mode (50% duration) for accessibility */
  reducedMode: boolean;
}

export const DEFAULT_HITSTOP_CONFIG: HitstopConfig = {
  baseKillHitstopMs: 40,
  bossDamageHitstopMs: 120,
  playerDamageHitstopMs: 200,
  waveTransitionHitstopMs: 300,
  maxComboMultiplier: 3.0,
  enabled: true,
  reducedMode: false,
};

/** Quality-preset hitstop configurations */
export const HITSTOP_PRESETS = {
  ultra: { ...DEFAULT_HITSTOP_CONFIG, enabled: true, reducedMode: false },
  high: { ...DEFAULT_HITSTOP_CONFIG, enabled: true, reducedMode: false },
  balanced: { ...DEFAULT_HITSTOP_CONFIG, enabled: true, reducedMode: true },
  mobile: { ...DEFAULT_HITSTOP_CONFIG, enabled: false, reducedMode: false },
} as const;

export class HitstopSystem {
  private activeHitstops: HitstopFrame[] = [];
  private config: HitstopConfig;

  /** Global time dilation during hitstop (0 = frozen, 1 = normal) */
  private timeScale: number = 1;

  /** Visual-only mode: entities freeze but particles/effects continue */
  private isVisualOnly: boolean = false;

  /** Callback invoked when hitstop starts (for audio pitch shift) */
  onHitstopStart?: (intensity: number) => void;

  /** Callback invoked when hitstop ends */
  onHitstopEnd?: () => void;

  constructor(config: Partial<HitstopConfig> = {}) {
    this.config = { ...DEFAULT_HITSTOP_CONFIG, ...config };
  }

  get isActive(): boolean {
    return this.activeHitstops.length > 0;
  }

  get currentTimeScale(): number {
    return this.timeScale;
  }

  get currentIntensity(): number {
    if (this.activeHitstops.length === 0) return 0;
    return Math.max(...this.activeHitstops.map(h => h.intensity));
  }

  /**
   * Apply the current quality preset configuration.
   */
  applyPreset(preset: keyof typeof HITSTOP_PRESETS): void {
    this.config = { ...HITSTOP_PRESETS[preset] };
  }

  /**
   * Update hitstop state. Call once per frame from GameEngine.
   * @param dt Delta time in seconds (NOT affected by hitstop time scale)
   * @returns Adjusted dt for game logic (scaled by hitstop)
   */
  update(dt: number): number {
    if (this.activeHitstops.length === 0) {
      this.timeScale = 1;
      this.isVisualOnly = false;
      return dt;
    }

    const dtMs = dt * 1000;
    let maxIntensity = 0;
    let anyVisualOnly = false;

    // Update all active hitstops
    for (let i = this.activeHitstops.length - 1; i >= 0; i--) {
      const hitstop = this.activeHitstops[i];
      hitstop.remainingMs -= dtMs;

      if (hitstop.remainingMs <= 0) {
        this.activeHitstops.splice(i, 1);
        continue;
      }

      const progress = 1 - hitstop.remainingMs / hitstop.totalMs;
      // Ease-out curve for smooth transition back to normal
      const easeOut = 1 - Math.pow(progress, 3);

      maxIntensity = Math.max(maxIntensity, hitstop.intensity * easeOut);
      if (hitstop.visualOnly) anyVisualOnly = true;
    }

    if (this.activeHitstops.length === 0) {
      this.timeScale = 1;
      this.isVisualOnly = false;
      this.onHitstopEnd?.();
      return dt;
    }

    // Time scale goes from 0 at peak to 1 as hitstop fades
    this.timeScale = maxIntensity < 0.3 ? maxIntensity / 0.3 : 1;
    this.isVisualOnly = anyVisualOnly;

    return dt * this.timeScale;
  }

  /**
   * Trigger a hitstop effect.
   *
   * @param type Category of hitstop for base duration lookup
   * @param intensity 0-1 intensity level (affects visual/audio distortion)
   * @param comboCount Current combo multiplier
   * @param visualOnly If true, only freeze entities (particles continue)
   */
  trigger(
    type: keyof Pick<
      HitstopConfig,
      'baseKillHitstopMs' | 'bossDamageHitstopMs' | 'playerDamageHitstopMs' | 'waveTransitionHitstopMs'
    >,
    intensity: number = 0.5,
    comboCount: number = 0,
    visualOnly: boolean = false,
  ): void {
    if (!this.config.enabled) return;

    const baseMs = this.config[type];
    const comboMultiplier = Math.min(
      1 + comboCount * 0.1,
      this.config.maxComboMultiplier,
    );
    const reducedFactor = this.config.reducedMode ? 0.5 : 1;
    const durationMs = baseMs * comboMultiplier * reducedFactor;

    this.activeHitstops.push({
      remainingMs: durationMs,
      totalMs: durationMs,
      intensity: Math.min(1, Math.max(0, intensity)),
      visualOnly,
      comboMultiplier,
    });

    // Notify on first hitstop of a batch
    if (this.activeHitstops.length === 1) {
      this.onHitstopStart?.(intensity);
    }
  }

  /**
   * Convenience: trigger kill hitstop with combo scaling.
   */
  triggerKill(comboCount: number = 0, isElite: boolean = false): void {
    const intensity = isElite ? 0.8 : 0.5;
    this.trigger('baseKillHitstopMs', intensity, comboCount, false);
  }

  /**
   * Convenience: trigger boss damage hitstop.
   */
  triggerBossDamage(comboCount: number = 0): void {
    this.trigger('bossDamageHitstopMs', 1.0, comboCount, false);
  }

  /**
   * Convenience: trigger player damage hitstop.
   */
  triggerPlayerDamage(): void {
    this.trigger('playerDamageHitstopMs', 1.0, 0, false);
  }

  /**
   * Convenience: trigger wave transition hitstop.
   */
  triggerWaveTransition(comboCount: number = 0): void {
    this.trigger('waveTransitionHitstopMs', 0.6, comboCount, true);
  }

  /**
   * Reset all active hitstops. Call on game over / wave reset.
   */
  reset(): void {
    const hadHitstops = this.activeHitstops.length > 0;
    this.activeHitstops.length = 0;
    this.timeScale = 1;
    this.isVisualOnly = false;
    if (hadHitstops) {
      this.onHitstopEnd?.();
    }
  }

  /**
   * Get interpolation value for render smoothing during hitstop.
   * Returns 0-1 where 0 = fully frozen, 1 = fully animated.
   */
  getRenderInterpolation(): number {
    if (this.activeHitstops.length === 0) return 1;
    return 1 - this.currentIntensity * 0.5;
  }
}
