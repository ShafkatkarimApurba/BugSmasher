import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScreenShakeSystem, SHAKE_PRESETS, DEFAULT_SHAKE_PARAMS, ShakeParams } from '../game/rendering/ScreenShakeSystem';

describe('ScreenShakeSystem', () => {
  let shake: ScreenShakeSystem;

  beforeEach(() => {
    shake = new ScreenShakeSystem();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes enabled with no active shakes', () => {
    expect(shake.enabled).toBe(true);
    const frame = shake.getCurrentFrame();
    expect(frame.intensity).toBe(0);
    expect(frame.offsetX).toBe(0);
    expect(frame.zoom).toBe(1);
  });

  it('exports SHAKE_PRESETS factory functions', () => {
    const kill = SHAKE_PRESETS.killStandard();
    expect(kill.magnitude).toBe(8);
    expect(kill.durationMs).toBe(350);
    expect(kill.includeChromatic).toBe(true);

    const boss = SHAKE_PRESETS.bossDamage(1.57);
    expect(boss.decay).toBe('bounce');
    expect(boss.magnitude).toBe(18);
  });

  it('trigger adds active shake when enabled', () => {
    shake.trigger({ magnitude: 12, durationMs: 400 });
    const frame = shake.getCurrentFrame();
    expect(frame.intensity).toBeGreaterThan(0);
  });

  it('trigger does nothing when disabled', () => {
    shake.enabled = false;
    shake.trigger({ magnitude: 50 });
    expect(shake.getCurrentFrame().intensity).toBe(0);
  });

  it('triggerPreset resolves factory and triggers', () => {
    shake.triggerPreset('killLight');
    expect(shake.getCurrentFrame().intensity).toBeGreaterThan(0);
    shake.triggerPreset('playerDamage', 0);
    const frame = shake.getCurrentFrame();
    expect(frame.intensity).toBeGreaterThan(0.5);
  });

  it('update advances and expires shakes', () => {
    shake.trigger({ magnitude: 10, durationMs: 100, decay: 'linear' });
    shake.update(50);
    let frame = shake.getCurrentFrame();
    expect(frame.intensity).toBeGreaterThan(0.4);

    shake.update(60); // past duration
    frame = shake.getCurrentFrame();
    expect(frame.intensity).toBe(0);
  });

  it('supports multiple simultaneous shakes (additive)', () => {
    shake.trigger({ magnitude: 5, direction: 0, durationMs: 1000 });
    shake.trigger({ magnitude: 5, direction: Math.PI / 2, durationMs: 1000 });
    const frame = shake.getCurrentFrame();
    // Should have components in x and y
    expect(Math.abs(frame.offsetX)).toBeGreaterThan(0);
    expect(Math.abs(frame.offsetY)).toBeGreaterThan(0);
    expect(frame.intensity).toBeGreaterThan(0);
  });

  it('decay exponential reduces intensity over time', () => {
    shake.trigger({ magnitude: 10, durationMs: 1000, decay: 'exponential' });
    shake.update(0);
    const start = shake.getCurrentFrame().intensity;
    shake.update(100);
    const later = shake.getCurrentFrame().intensity;
    expect(later).toBeLessThan(start);
  });

  it('decay linear is straight 1-progress', () => {
    shake.trigger({ magnitude: 10, durationMs: 200, decay: 'linear' });
    shake.update(100);
    const frame = shake.getCurrentFrame();
    expect(frame.intensity).toBeCloseTo(0.5, 1);
  });

  it('bounce decay oscillates', () => {
    shake.trigger({ magnitude: 10, durationMs: 1000, decay: 'bounce' });
    shake.update(50);
    const i1 = shake.getCurrentFrame().intensity;
    shake.update(30);
    const i2 = shake.getCurrentFrame().intensity;
    // Not strictly monotonic due to cos
    expect(i1).not.toBe(i2);
  });

  it('getCurrentFrame includes rotation/zoom/chromatic when configured', () => {
    shake.trigger({
      magnitude: 10,
      durationMs: 500,
      includeRotation: true,
      includeZoom: true,
      includeChromatic: true,
      rotationMagnitude: 0.1,
      zoomMagnitude: 1.1,
      chromaticMagnitude: 4,
    });
    const frame = shake.getCurrentFrame();
    expect(Math.abs(frame.rotation)).toBeGreaterThan(0);
    expect(frame.zoom).toBeGreaterThan(1);
    expect(frame.chromaticOffset).toBeGreaterThan(0);
  });

  it('noise produces values roughly in -0.5..0.5 range', () => {
    // Exercise private noise via repeated frames
    shake.trigger({ magnitude: 20, durationMs: 2000, frequency: 10 });
    for (let i = 0; i < 20; i++) {
      shake.update(10);
      const f = shake.getCurrentFrame();
      expect(Math.abs(f.offsetX)).toBeLessThan(25);
    }
  });

  it('reset clears all shakes', () => {
    shake.trigger({ magnitude: 10, durationMs: 500 });
    shake.triggerPreset('explosion', 0);
    shake.reset();
    expect(shake.getCurrentFrame().intensity).toBe(0);
  });

  it('applyToContext translates/rotates/scales when active', () => {
    const mockCtx: any = {
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    };
    shake.trigger({ magnitude: 8, durationMs: 100, includeRotation: true, includeZoom: true });
    shake.applyToContext(mockCtx);
    expect(mockCtx.translate).toHaveBeenCalled();
    expect(mockCtx.rotate).toHaveBeenCalled();
    expect(mockCtx.scale).toHaveBeenCalled();
  });

  it('shakeScale multiplies final intensity', () => {
    shake.shakeScale = 0.5;
    shake.trigger({ magnitude: 20, durationMs: 200 });
    const frame = shake.getCurrentFrame();
    expect(frame.intensity).toBeLessThan(0.6); // 20 * scale factor in envelope
  });

  it('DEFAULT_SHAKE_PARAMS is exported and reasonable', () => {
    expect(DEFAULT_SHAKE_PARAMS.magnitude).toBe(10);
    expect(DEFAULT_SHAKE_PARAMS.includeChromatic).toBe(true);
  });
});
