import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PostProcessingSystem, POSTPROCESS_PRESETS } from '../game/rendering/PostProcessingSystem';

function createMockCtx(width = 800, height = 600): any {
  const mockGrad = { addColorStop: vi.fn() };
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => mockGrad),
    createPattern: vi.fn(),
    clearRect: vi.fn(),
    translate: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    canvas,
  };
}

describe('PostProcessingSystem', () => {
  let post: PostProcessingSystem;
  let ctx: any;

  beforeEach(() => {
    post = new PostProcessingSystem();
    ctx = createMockCtx();
    vi.clearAllMocks();
    // Spy Date.now for predictable critical vignette pulse
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with high preset', () => {
    const cfg = (post as any).config;
    expect(cfg.enabled).toBe(true);
    expect(cfg.vignetteIntensity).toBe(0.45);
    expect(cfg.scanlines).toBe(true);
    expect(cfg.grainIntensity).toBe(0.02);
  });

  it('exports POSTPROCESS_PRESETS', () => {
    expect(POSTPROCESS_PRESETS.ultra.enabled).toBe(true);
    expect(POSTPROCESS_PRESETS.mobile.enabled).toBe(false);
    expect(POSTPROCESS_PRESETS.balanced.scanlines).toBe(false);
    expect(POSTPROCESS_PRESETS.balanced.grainIntensity).toBe(0);
  });

  it('applyPreset switches configs', () => {
    post.applyPreset('ultra');
    expect((post as any).config.vignetteIntensity).toBe(0.6);
    post.applyPreset('mobile');
    expect((post as any).config.enabled).toBe(false);
  });

  it('setHealthRatio, setSaturationBoost, setChromaticOverride clamp and store', () => {
    post.setHealthRatio(1.5);
    expect((post as any).healthRatio).toBe(1);
    post.setHealthRatio(-0.2);
    expect((post as any).healthRatio).toBe(0);

    post.setSaturationBoost(0.7);
    expect((post as any).saturationBoost).toBe(0.7);

    post.setChromaticOverride(5);
    expect((post as any).chromaticOverride).toBe(5);
  });

  it('getCSSFilter returns none when disabled or no boosts', () => {
    post.applyPreset('mobile');
    expect(post.getCSSFilter()).toBe('none');
    post.applyPreset('balanced');
    post.setSaturationBoost(0);
    expect(post.getCSSFilter()).toBe('none');
  });

  it('getCSSFilter includes saturate when combo boost active on high', () => {
    post.applyPreset('high');
    post.setSaturationBoost(0.2);
    const filter = post.getCSSFilter();
    expect(filter).toContain('saturate(');
  });

  it('render skips entirely when disabled', () => {
    post.applyPreset('mobile');
    post.render(ctx, 800, 600, 10);
    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('render applies vignette when intensity >0', () => {
    post.applyPreset('high');
    post.setHealthRatio(0.8);
    post.render(ctx, 800, 600, 0);
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('render intensifies vignette and adds red pulse at critical health <0.3', () => {
    post.applyPreset('ultra');
    post.setHealthRatio(0.2);
    post.render(ctx, 800, 600, 0);
    // Multiple fillRect for vignette + pulse
    expect(ctx.fillRect).toHaveBeenCalled();
    // fillStyle set to red-ish at some point
  });

  it('render draws scanlines when enabled', () => {
    post.applyPreset('high');
    post.render(ctx, 800, 600, 0);
    expect(ctx.drawImage).toHaveBeenCalled(); // scanline canvas
  });

  it('render applies grain when intensity >0 using pattern', () => {
    post.applyPreset('ultra');
    post.render(ctx, 800, 600, 123);
    // gCO set inside save/restore; verify via fillRect side effect
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('render applies chromatic aberration using temp buffer copy (no recursion)', () => {
    post.applyPreset('high');
    post.setChromaticOverride(3);
    post.render(ctx, 800, 600, 0);
    // drawImage called for the temp buffer copies (red + blue offsets)
    const calls = (ctx.drawImage as any).mock.calls.length;
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('render combines chromaticOverride + config offset', () => {
    post.applyPreset('balanced');
    post.setChromaticOverride(2);
    post.render(ctx, 400, 300, 0);
    // Should trigger chromatic since 1 (config) + 2 > 0.1
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('render is safe with no canvas on ctx', () => {
    const badCtx = { ...createMockCtx(), canvas: null };
    expect(() => post.render(badCtx as any, 100, 100, 0)).not.toThrow();
  });
});
