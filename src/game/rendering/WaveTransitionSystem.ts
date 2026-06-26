/**
 * WaveTransitionSystem — Cinematic wave start/end sequences
 *
 * Creates dramatic visual transitions between waves:
 *   - Wave start: Flash wipe + "WAVE N" text animation
 *   - Wave complete: Slow-motion clear + particle celebration
 *   - Boss incoming: Red pulse + warning text + escalating screen shake
 *   - Perfect wave bonus: Gold flash + special celebration
 *
 * All effects are time-based and auto-complete without blocking game logic.
 */

export type TransitionType = 'wave_start' | 'wave_complete' | 'boss_incoming' | 'perfect_wave' | 'game_over';

export interface TransitionEffect {
  type: TransitionType;
  waveNumber?: number;
  /** Progress 0-1 */
  progress: number;
  /** Duration in seconds */
  duration: number;
  /** Current time in seconds */
  elapsed: number;
  /** Whether effect is active */
  active: boolean;
}

export interface WaveTransitionConfig {
  enabled: boolean;
  /** Duration of wave start effect (seconds) */
  waveStartDuration: number;
  /** Duration of wave complete effect */
  waveCompleteDuration: number;
  /** Duration of boss warning */
  bossWarningDuration: number;
  /** Duration of perfect wave celebration */
  perfectWaveDuration: number;
  /** Whether to use slow-mo on wave complete */
  slowMotionOnComplete: boolean;
  /** Font for wave text */
  font: string;
}

export const WAVE_TRANSITION_PRESETS = {
  ultra:    { enabled: true,  waveStartDuration: 2.0, waveCompleteDuration: 2.5, bossWarningDuration: 3.0, perfectWaveDuration: 3.0, slowMotionOnComplete: true,  font: '900 72px "JetBrains Mono", monospace' },
  high:     { enabled: true,  waveStartDuration: 1.5, waveCompleteDuration: 2.0, bossWarningDuration: 2.5, perfectWaveDuration: 2.5, slowMotionOnComplete: true,  font: '800 64px "JetBrains Mono", monospace' },
  balanced: { enabled: true,  waveStartDuration: 1.0, waveCompleteDuration: 1.0, bossWarningDuration: 1.5, perfectWaveDuration: 1.5, slowMotionOnComplete: false, font: '700 48px "JetBrains Mono", monospace' },
  mobile:   { enabled: false, waveStartDuration: 0.5, waveCompleteDuration: 0.5, bossWarningDuration: 1.0, perfectWaveDuration: 1.0, slowMotionOnComplete: false, font: '700 32px "JetBrains Mono", monospace' },
} as const;

export class WaveTransitionSystem {
  private config: WaveTransitionConfig;
  private activeEffects: TransitionEffect[] = [];
  private waveNumber: number = 0;

  /** Callbacks for external integration */
  onRequestScreenShake?: (preset: string) => void;
  onRequestHitstop?: (intensity: number) => void;
  onRequestFlash?: (color: string, duration?: number) => void;
  onRequestSlowMotion?: (timeScale: number, duration: number) => void;
  onRequestParticles?: (x: number, y: number, count: number, color: string) => void;

  /** Whether any transition is currently active */
  get isActive(): boolean {
    return this.activeEffects.some(e => e.active);
  }

  constructor(config: Partial<WaveTransitionConfig> = {}) {
    this.config = { ...WAVE_TRANSITION_PRESETS.high, ...config };
  }

  /**
   * Apply a quality preset.
   */
  applyPreset(preset: keyof typeof WAVE_TRANSITION_PRESETS): void {
    this.config = { ...WAVE_TRANSITION_PRESETS[preset] };
  }

  /**
   * Trigger wave start transition.
   */
  triggerWaveStart(waveNumber: number): void {
    if (!this.config.enabled) return;
    this.waveNumber = waveNumber;

    this.activeEffects.push({
      type: 'wave_start',
      waveNumber,
      progress: 0,
      duration: this.config.waveStartDuration,
      elapsed: 0,
      active: true,
    });

    this.onRequestFlash?.('rgba(255,255,255,0.3)', 0.2);
    this.onRequestScreenShake?.('waveTransition');
  }

  /**
   * Trigger wave complete transition.
   */
  triggerWaveComplete(): void {
    if (!this.config.enabled) return;

    this.activeEffects.push({
      type: 'wave_complete',
      progress: 0,
      duration: this.config.waveCompleteDuration,
      elapsed: 0,
      active: true,
    });

    this.onRequestFlash?.('rgba(100,255,100,0.2)', 0.3);
    this.onRequestScreenShake?.('killStandard');

    if (this.config.slowMotionOnComplete) {
      this.onRequestSlowMotion?.(0.3, 0.5);
    }
  }

  /**
   * Trigger boss incoming warning.
   */
  triggerBossIncoming(): void {
    if (!this.config.enabled) return;

    this.activeEffects.push({
      type: 'boss_incoming',
      progress: 0,
      duration: this.config.bossWarningDuration,
      elapsed: 0,
      active: true,
    });

    this.onRequestFlash?.('rgba(255,0,0,0.2)', 0.5);
    this.onRequestScreenShake?.('bossDamage');
    this.onRequestHitstop?.(0.3);
  }

  /**
   * Trigger perfect wave bonus celebration.
   */
  triggerPerfectWave(): void {
    if (!this.config.enabled) return;

    this.activeEffects.push({
      type: 'perfect_wave',
      progress: 0,
      duration: this.config.perfectWaveDuration,
      elapsed: 0,
      active: true,
    });

    this.onRequestFlash?.('rgba(255,215,0,0.4)', 0.5);
    this.onRequestScreenShake?.('bossDamage');
    this.onRequestHitstop?.(0.5);
  }

  /**
   * Update all active transitions. Call once per frame.
   */
  update(dt: number): void {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      if (!effect.active) continue;

      effect.elapsed += dt;
      effect.progress = Math.min(1, effect.elapsed / effect.duration);

      if (effect.progress >= 1) {
        effect.active = false;
      }
    }

    // Clean up finished effects
    this.activeEffects = this.activeEffects.filter(e => e.active);
  }

  /**
   * Render transitions to canvas.
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number, globalTime: number): void {
    if (this.activeEffects.length === 0) return;

    ctx.save();

    for (const effect of this.activeEffects) {
      switch (effect.type) {
        case 'wave_start':
          this.renderWaveStart(ctx, width, height, effect, globalTime);
          break;
        case 'wave_complete':
          this.renderWaveComplete(ctx, width, height, effect, globalTime);
          break;
        case 'boss_incoming':
          this.renderBossWarning(ctx, width, height, effect, globalTime);
          break;
        case 'perfect_wave':
          this.renderPerfectWave(ctx, width, height, effect, globalTime);
          break;
      }
    }

    ctx.restore();
  }

  /** Reset all effects */
  reset(): void {
    this.activeEffects.length = 0;
  }

  private renderWaveStart(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    effect: TransitionEffect,
    _globalTime: number,
  ): void {
    const p = Math.max(0, Math.min(1, effect.progress));
    const waveNum = effect.waveNumber || 0;

    // Flash wipe from center
    const flashRadius = Math.max(0, p < 0.3
      ? p / 0.3 * Math.max(width, height) * 1.5
      : Math.max(width, height) * 1.5 * (1 - (p - 0.3) / 0.7));

    const flashAlpha = Math.max(0, Math.min(1, p < 0.3
      ? p / 0.3 * 0.15
      : 0.15 * (1 - (p - 0.3) / 0.7)));

    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, flashRadius, 0, Math.PI * 2);
    ctx.fill();

    // "WAVE N" text
    if (p > 0.2 && p < 0.9) {
      const textProgress = Math.min(1, (p - 0.2) / 0.3);
      const textFade = p > 0.7 ? 1 - (p - 0.7) / 0.2 : 1;

      const scale = 0.5 + textProgress * 0.5;
      const alpha = textProgress * textFade;

      ctx.save();
      ctx.translate(width / 2, height / 3);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      // Glow effect
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;

      ctx.fillStyle = '#ffffff';
      ctx.font = this.config.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WAVE ${waveNum}`, 0, 0);

      // Subtitle (Safely parsed font size)
      const match = this.config.font.match(/(\d+)px/);
      const fontSize = match ? parseInt(match[1]) : 64;
      ctx.font = this.config.font.replace(/\d+px/, `${fontSize * 0.3}px`);
      ctx.fillStyle = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillText('INCOMING', 0, 60);

      ctx.restore();
    }
  }

  private renderWaveComplete(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    effect: TransitionEffect,
    _globalTime: number,
  ): void {
    const p = effect.progress;

    // Green victory flash
    const flashAlpha = p < 0.2 ? p / 0.2 * 0.15 : 0.15 * Math.exp(-(p - 0.2) * 5);
    ctx.fillStyle = `rgba(100,255,100,${flashAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // "WAVE CLEAR" text
    if (p > 0.1 && p < 0.8) {
      const textProgress = Math.min(1, (p - 0.1) / 0.3);
      const textFade = p > 0.6 ? 1 - (p - 0.6) / 0.2 : 1;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.globalAlpha = textProgress * textFade;

      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 15;

      ctx.fillStyle = '#ffffff';
      ctx.font = this.config.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WAVE CLEAR', 0, 0);

      ctx.restore();
    }
  }

  private renderBossWarning(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    effect: TransitionEffect,
    globalTime: number,
  ): void {
    const p = effect.progress;

    // Pulsing red vignette
    const pulse = Math.sin(globalTime * 10) * 0.3 + 0.7;
    const vigIntensity = (1 - p) * 0.3 * pulse;

    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
    grad.addColorStop(0, 'rgba(255,0,0,0)');
    grad.addColorStop(1, `rgba(255,0,0,${vigIntensity})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warning text with heavy shake
    if (p < 0.9) {
      const shakeX = Math.sin(globalTime * 30) * 5 * (1 - p);
      const shakeY = Math.cos(globalTime * 25) * 3 * (1 - p);
      const alpha = p < 0.1 ? p / 0.1 : p > 0.8 ? 1 - (p - 0.8) / 0.1 : 1;
      const scale = 1 + Math.sin(globalTime * 5) * 0.05;

      ctx.save();
      ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 30;

      ctx.fillStyle = '#ff3333';
      ctx.font = this.config.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WARNING', 0, -20);

      const match = this.config.font.match(/(\d+)px/);
      const fontSize = match ? parseInt(match[1]) : 64;
      ctx.font = this.config.font.replace(/\d+px/, `${fontSize * 0.4}px`);
      ctx.fillStyle = '#ff6666';
      ctx.shadowBlur = 15;
      ctx.fillText('BOSS DETECTED', 0, 40);

      ctx.restore();
    }
  }

  private renderPerfectWave(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    effect: TransitionEffect,
    globalTime: number,
  ): void {
    const p = effect.progress;

    // Gold celebration flash
    const flashAlpha = p < 0.1 ? p / 0.1 * 0.25 : 0.25 * Math.exp(-(p - 0.1) * 3);
    ctx.fillStyle = `rgba(255,215,0,${flashAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // "PERFECT!" text
    if (p < 0.9) {
      const scale = 1 + Math.sin(globalTime * 8) * 0.08;
      const alpha = p < 0.05 ? p / 0.05 : p > 0.7 ? 1 - (p - 0.7) / 0.2 : 1;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 25;

      ctx.fillStyle = '#ffd700';
      ctx.font = this.config.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PERFECT!', 0, 0);

      const match = this.config.font.match(/(\d+)px/);
      const fontSize = match ? parseInt(match[1]) : 64;
      ctx.font = this.config.font.replace(/\d+px/, `${fontSize * 0.35}px`);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillText('NO DAMAGE TAKEN', 0, 55);

      ctx.restore();
    }
  }
}
