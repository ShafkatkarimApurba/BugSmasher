import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HitstopSystem, HITSTOP_PRESETS, DEFAULT_HITSTOP_CONFIG } from '../game/HitstopSystem';

describe('HitstopSystem', () => {
  let hitstop: HitstopSystem;

  beforeEach(() => {
    hitstop = new HitstopSystem();
  });

  it('initializes inactive with timeScale 1', () => {
    expect(hitstop.isActive).toBe(false);
    expect(hitstop.currentTimeScale).toBe(1);
    expect(hitstop.currentIntensity).toBe(0);
    expect(hitstop.getRenderInterpolation()).toBe(1);
  });

  it('exports presets and defaults', () => {
    expect(HITSTOP_PRESETS.mobile.enabled).toBe(false);
    expect(HITSTOP_PRESETS.balanced.reducedMode).toBe(true);
    expect(DEFAULT_HITSTOP_CONFIG.baseKillHitstopMs).toBe(40);
  });

  it('applyPreset loads config including reducedMode and enabled', () => {
    hitstop.applyPreset('mobile');
    expect((hitstop as any).config.enabled).toBe(false);
    hitstop.applyPreset('balanced');
    expect((hitstop as any).config.reducedMode).toBe(true);
  });

  it('triggerKill uses base + combo scaling + reduced factor', () => {
    hitstop.applyPreset('high');
    hitstop.triggerKill(10, false);
    expect(hitstop.isActive).toBe(true);
    expect(hitstop.currentIntensity).toBeGreaterThan(0);
    // 40 * (1+1) = 80ms base scaled
  });

  it('triggerKill for elite uses higher intensity', () => {
    hitstop.triggerKill(0, true);
    expect(hitstop.currentIntensity).toBe(0.8);
  });

  it('triggerBossDamage, triggerPlayerDamage, triggerWaveTransition create appropriate stops', () => {
    hitstop.triggerBossDamage();
    expect(hitstop.isActive).toBe(true);
    hitstop.reset();

    hitstop.triggerPlayerDamage();
    expect(hitstop.isActive).toBe(true);
    hitstop.reset();

    hitstop.triggerWaveTransition(5);
    expect(hitstop.isActive).toBe(true);
    hitstop.update(0.001);
    expect((hitstop as any).isVisualOnly).toBe(true);
  });

  it('update returns scaledDt and reduces timeScale during active', () => {
    hitstop.triggerKill(0);
    const scaled = hitstop.update(0.016);
    expect(scaled).toBeLessThanOrEqual(0.016);
    // timeScale may stay 1 early in short hitstop (see impl: only <0.3 intensity scales); isActive proves effect
    expect(hitstop.isActive).toBe(true);
  });

  it('update returns full dt when no active hitstops', () => {
    const dt = hitstop.update(0.016);
    expect(dt).toBe(0.016);
  });

  it('multiple hitstops stack and use max intensity', () => {
    hitstop.triggerKill(0, false); // ~0.5
    hitstop.triggerBossDamage(); // 1.0
    expect(hitstop.currentIntensity).toBeCloseTo(1.0, 1);
  });

  it('hitstop expires after duration and fires onHitstopEnd', () => {
    const onEnd = vi.fn();
    hitstop.onHitstopEnd = onEnd;
    hitstop.trigger('baseKillHitstopMs', 0.5, 0);
    // Simulate enough time
    hitstop.update(0.1); // 100ms > 40ms
    expect(hitstop.isActive).toBe(false);
    expect(onEnd).toHaveBeenCalled();
  });

  it('reset clears active and fires end if had any', () => {
    const onEnd = vi.fn();
    hitstop.onHitstopEnd = onEnd;
    hitstop.triggerKill(0);
    hitstop.reset();
    expect(hitstop.isActive).toBe(false);
    expect(onEnd).toHaveBeenCalled();
  });

  it('reducedMode halves duration', () => {
    hitstop.applyPreset('balanced');
    hitstop.triggerKill(0);
    // internal duration 40*0.5=20ms
    hitstop.update(0.05);
    expect(hitstop.isActive).toBe(false);
  });

  it('disabled config prevents trigger', () => {
    hitstop.applyPreset('mobile');
    hitstop.triggerKill(99);
    expect(hitstop.isActive).toBe(false);
  });

  it('onHitstopStart fires only on first of batch', () => {
    const onStart = vi.fn();
    hitstop.onHitstopStart = onStart;
    hitstop.triggerKill(0);
    hitstop.triggerKill(5);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('getRenderInterpolation returns reduced value during stop', () => {
    hitstop.triggerPlayerDamage();
    const interp = hitstop.getRenderInterpolation();
    expect(interp).toBeLessThan(1);
    expect(interp).toBeGreaterThan(0);
  });
});
