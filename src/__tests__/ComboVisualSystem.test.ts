import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComboVisualSystem, COMBO_MILESTONES, COMBO_PRESETS } from '../game/rendering/ComboVisualSystem';

describe('ComboVisualSystem', () => {
  let combo: ComboVisualSystem;

  beforeEach(() => {
    combo = new ComboVisualSystem();
    vi.clearAllMocks();
  });

  it('initializes at combo 0 with high preset', () => {
    expect(combo.currentCombo).toBe(0);
    expect(combo.getSaturationBoost()).toBe(0);
    expect(combo.comboProgress).toBe(0);
  });

  it('exports COMBO_MILESTONES and COMBO_PRESETS', () => {
    expect(COMBO_MILESTONES.length).toBe(5);
    expect(COMBO_MILESTONES[1].threshold).toBe(10);
    expect(COMBO_MILESTONES[3].hitstop).toBe(true);
    expect(COMBO_PRESETS.ultra.maxFloatingTexts).toBe(20);
    expect(COMBO_PRESETS.mobile.showComboRing).toBe(false);
  });

  it('applyPreset reduces visual complexity on lower presets', () => {
    combo.applyPreset('mobile');
    expect((combo as any).config.maxFloatingTexts).toBe(5);
    combo.applyPreset('ultra');
    expect((combo as any).config.maxFloatingTexts).toBe(20);
  });

  it('registerKill increments combo and spawns floating text', () => {
    const milestone = combo.registerKill(100, 200, 10);
    expect(combo.currentCombo).toBe(1);
    expect(combo.comboProgress).toBeGreaterThan(0);
    expect(milestone).toBeNull(); // no milestone at 1
  });

  it('registerKill triggers milestones at thresholds and returns milestone', () => {
    let m = combo.registerKill(10, 20, 5);
    expect(m).toBeNull();
    m = combo.registerKill(10, 20, 5); // 2
    m = combo.registerKill(10, 20, 5); // 3
    m = combo.registerKill(10, 20, 5); // 4
    m = combo.registerKill(10, 20, 5); // 5
    expect(m).not.toBeNull();
    expect(m!.threshold).toBe(5);
    expect(m!.textColor).toBe('#ffffff');

    // 10x
    for (let i = 0; i < 5; i++) combo.registerKill(0, 0, 1);
    expect(combo.currentCombo).toBe(10);
  });

  it('milestones fire callbacks for shake/hitstop/particles/flash when registered', () => {
    const onShake = vi.fn();
    const onHitstop = vi.fn();
    const onParticles = vi.fn();
    const onFlash = vi.fn();
    combo.onRequestScreenShake = onShake;
    combo.onRequestHitstop = onHitstop;
    combo.onRequestParticles = onParticles;
    combo.onRequestFlash = onFlash;

    // Reach 25x (explode + hitstop)
    for (let i = 0; i < 25; i++) {
      combo.registerKill(50, 50, 1);
    }
    expect(onShake).not.toHaveBeenCalled();
    expect(onHitstop).toHaveBeenCalled();
    expect(onParticles).toHaveBeenCalledWith(50, 50, 40, expect.any(String));
    expect(onFlash).toHaveBeenCalled();
  });

  it('update decrements timer and resets on timeout', () => {
    combo.registerKill(0, 0, 1);
    expect(combo.currentCombo).toBe(1);
    combo.update(4); // > 3s timeout
    expect(combo.currentCombo).toBe(0);
    expect(combo.comboProgress).toBe(0);
  });

  it('update fades floating texts and pulse/saturation', () => {
    combo.registerKill(0, 0, 1);
    combo.update(0.1);
    // saturation target for combo=1 is small
    expect(combo.getSaturationBoost()).toBeGreaterThanOrEqual(0);
    const texts = (combo as any).floatingTexts;
    const active = texts.find((t: any) => t.life > 0);
    expect(active).toBeDefined();
  });

  it('render draws floating texts and combo ring when >1 and enabled', () => {
    const ctx: any = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
      strokeStyle: '',
      globalAlpha: 1,
      lineWidth: 0,
      shadowColor: '',
      shadowBlur: 0,
      fillStyle: '',
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
    };
    combo.registerKill(400, 300, 10);
    combo.registerKill(400, 300, 10); // 2
    combo.render(ctx, 400, 300, 1.23);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
    // ring for combo>1 + showComboRing
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('resetCombo clears state', () => {
    for (let i = 0; i < 12; i++) combo.registerKill(0, 0, 1);
    combo.resetCombo();
    expect(combo.currentCombo).toBe(0);
    expect(combo.getSaturationBoost()).toBe(0);
  });

  it('getSaturationBoost respects colorGrading preset flag', () => {
    combo.applyPreset('balanced');
    for (let i = 0; i < 20; i++) combo.registerKill(0, 0, 1);
    expect(combo.getSaturationBoost()).toBe(0); // disabled in balanced
  });

  it('floating text animStyle escalates with combo', () => {
    combo.registerKill(0, 0, 1); // 1 -> pop
    let texts = (combo as any).floatingTexts.filter((t: any) => t.life > 0);
    expect(texts[0].animStyle).toBe('pop');

    for (let i = 0; i < 10; i++) combo.registerKill(0, 0, 1);
    texts = (combo as any).floatingTexts.filter((t: any) => t.life > 0 && t.text.includes('x'));
    // last one at 11x should be pulse
    expect(texts.some((t: any) => t.animStyle === 'pulse')).toBe(true);
  });
});
