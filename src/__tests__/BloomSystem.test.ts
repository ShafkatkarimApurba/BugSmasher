import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BloomSystem, BLOOM_PRESETS, GlowEmission } from '../game/rendering/BloomSystem';

function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createMockCtx(): CanvasRenderingContext2D {
  const mockGrad = {
    addColorStop: vi.fn(),
  };
  const ctx: any = {
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => mockGrad),
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    // For blur passes
    canvas: createMockCanvas(400, 300), // scaled
  };
  return ctx as CanvasRenderingContext2D;
}

describe('BloomSystem', () => {
  let bloom: BloomSystem;
  let targetCtx: CanvasRenderingContext2D;
  let gameCanvas: HTMLCanvasElement;

  beforeEach(() => {
    bloom = new BloomSystem();
    gameCanvas = createMockCanvas(800, 600);
    targetCtx = createMockCtx();
    // Reset spies between tests
    vi.clearAllMocks();
  });

  it('should initialize with high preset by default', () => {
    const config = bloom.getConfig();
    expect(config.enabled).toBe(true);
    expect(config.blurPasses).toBe(1);
    expect(config.blurRadius).toBe(3);
    expect(config.intensity).toBe(1.0);
    expect(config.resolutionScale).toBe(0.75);
    expect(config.blendMode).toBe('screen');
  });

  it('should export BLOOM_PRESETS with all quality levels', () => {
    expect(BLOOM_PRESETS.ultra.enabled).toBe(true);
    expect(BLOOM_PRESETS.high.enabled).toBe(true);
    expect(BLOOM_PRESETS.balanced.enabled).toBe(true);
    expect(BLOOM_PRESETS.mobile.enabled).toBe(false);
    expect(BLOOM_PRESETS.mobile.blurPasses).toBe(0);
  });

  it('applyPreset updates config for known preset', () => {
    bloom.applyPreset('ultra');
    const cfg = bloom.getConfig();
    expect(cfg.blurPasses).toBe(2);
    expect(cfg.resolutionScale).toBe(1.0);
    expect(cfg.intensity).toBe(1.2);

    bloom.applyPreset('balanced');
    expect(bloom.getConfig().blurRadius).toBe(2);
  });

  it('applyPreset ignores unknown preset', () => {
    const before = bloom.getConfig();
    bloom.applyPreset('invalid' as any);
    expect(bloom.getConfig()).toEqual(before);
  });

  it('resize scales internal canvases by resolutionScale', () => {
    bloom.applyPreset('high'); // 0.75
    bloom.resize(800, 600);
    // Access private via any for verification of coverage (acceptable in tests)
    const priv = bloom as any;
    expect(priv.width).toBe(600); // 800*0.75
    expect(priv.height).toBe(450);
    expect(priv.canvasA.width).toBe(600);
    expect(priv.captureCanvas.height).toBe(450);
  });

  it('resize uses full res for ultra preset', () => {
    bloom.applyPreset('ultra');
    bloom.resize(400, 300);
    const priv = bloom as any;
    expect(priv.width).toBe(400);
    expect(priv.height).toBe(300);
  });

  it('addEmission registers when enabled', () => {
    const emission: GlowEmission = { x: 100, y: 200, radius: 15, color: '#ff00aa', intensity: 0.9 };
    bloom.addEmission(emission);
    // Indirect: render will use it
    bloom.resize(800, 600);
    bloom.render(targetCtx, gameCanvas);
    expect(targetCtx.drawImage).toHaveBeenCalled();
  });

  it('addEmission ignores when disabled (mobile)', () => {
    bloom.applyPreset('mobile');
    bloom.addEmission({ x: 50, y: 50, radius: 10, color: '#fff', intensity: 1 });
    bloom.resize(800, 600);
    bloom.render(targetCtx, gameCanvas);
    expect(targetCtx.save).not.toHaveBeenCalled();
    expect(targetCtx.drawImage).not.toHaveBeenCalled();
  });

  it('render does nothing with zero emissions', () => {
    bloom.resize(800, 600);
    bloom.render(targetCtx, gameCanvas);
    expect(targetCtx.save).not.toHaveBeenCalled();
    expect(targetCtx.drawImage).not.toHaveBeenCalled();
  });

  it('render clears emissions after composite', () => {
    bloom.addEmission({ x: 10, y: 10, radius: 5, color: '#00ff00', intensity: 1 });
    bloom.resize(800, 600);
    bloom.render(targetCtx, gameCanvas);
    // Second render should do no work
    bloom.render(targetCtx, gameCanvas);
    // drawImage called only once (from first render's final composite)
    const drawCalls = (targetCtx.drawImage as any).mock.calls.length;
    expect(drawCalls).toBe(1); // capture + 2 blur passes? but final one
  });

  it('render uses screen blend and intensity from config', () => {
    bloom.applyPreset('ultra');
    bloom.addEmission({ x: 200, y: 300, radius: 25, color: '#ffff00', intensity: 0.7 });
    bloom.resize(800, 600);
    bloom.render(targetCtx, gameCanvas);

    expect(targetCtx.globalCompositeOperation).toBe('screen');
    expect(targetCtx.globalAlpha).toBe(1.2);
    expect(targetCtx.drawImage).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      0, 0,
      gameCanvas.width, gameCanvas.height
    );
  });

  it('render handles missing internal contexts gracefully', () => {
    const broken = new BloomSystem();
    (broken as any).ctxA = null;
    (broken as any).ctxB = null;
    (broken as any).captureCtx = null;
    broken.addEmission({ x: 0, y: 0, radius: 10, color: '#f00', intensity: 1 });
    broken.resize(100, 100);
    expect(() => broken.render(targetCtx, gameCanvas)).not.toThrow();
  });

  it('multiple emissions are captured and blurred', () => {
    bloom.addEmission({ x: 100, y: 100, radius: 10, color: '#f0f', intensity: 0.5 });
    bloom.addEmission({ x: 400, y: 300, radius: 30, color: '#0ff', intensity: 1.0 });
    bloom.resize(800, 600);
    bloom.render(targetCtx, gameCanvas);
    expect(((bloom as any).captureCtx.createRadialGradient).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
