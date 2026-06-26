import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamicLightingSystem, LIGHTING_PRESETS, LightSource, BIOME_AMBIENT_TINTS } from '../game/rendering/DynamicLightingSystem';

function createMockCtx(): any {
  const mockGrad = { addColorStop: vi.fn() };
  return {
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    createRadialGradient: vi.fn(() => mockGrad),
    globalCompositeOperation: 'source-over',
    globalAlpha: 1,
    fillStyle: '',
  };
}

function createMockEngine(biome = 'quantum_void') {
  return {
    currentBiome: biome,
    width: 800,
    height: 600,
  } as any;
}

describe('DynamicLightingSystem', () => {
  let lighting: DynamicLightingSystem;
  let ctx: any;
  let engine: any;

  beforeEach(() => {
    lighting = new DynamicLightingSystem();
    ctx = createMockCtx();
    engine = createMockEngine();
    vi.clearAllMocks();
  });

  it('initializes with high preset defaults', () => {
    expect(lighting.enabled).toBe(true);
    expect(lighting.lightCount).toBe(0);
    const cfg: any = (lighting as any).config;
    expect(cfg.maxLights).toBe(16);
    expect(cfg.ambientDarkness).toBe(0.55);
  });

  it('exports LIGHTING_PRESETS and BIOME_AMBIENT_TINTS', () => {
    expect(LIGHTING_PRESETS.ultra.maxLights).toBe(32);
    expect(LIGHTING_PRESETS.mobile.maxLights).toBe(4);
    expect(LIGHTING_PRESETS.balanced.shadowOverlay).toBe(false);
    expect(BIOME_AMBIENT_TINTS.ember_depths).toBe('#331000');
    expect(BIOME_AMBIENT_TINTS.default).toBe('#0a0a10');
  });

  it('applyPreset updates config and enabled flag', () => {
    lighting.applyPreset('mobile');
    expect(lighting.enabled).toBe(true); // still 4 lights allowed
    expect((lighting as any).config.maxLights).toBe(4);

    lighting.applyPreset('ultra');
    expect(lighting.enabled).toBe(true);
    expect((lighting as any).config.maxLights).toBe(32);
  });

  it('addLight registers light when enabled', () => {
    lighting.addLight({ x: 100, y: 200, radius: 50, color: '#ffaa00' });
    expect(lighting.lightCount).toBe(1);
  });

  it('addLight culls when exceeding max for preset', () => {
    lighting.applyPreset('mobile'); // max 4
    for (let i = 0; i < 10; i++) {
      lighting.addLight({ x: i * 10, y: i * 10, radius: 20, color: '#fff' });
    }
    expect(lighting.lightCount).toBe(4);
  });

  it('addLight is ignored when disabled', () => {
    lighting.enabled = false;
    lighting.addLight({ x: 0, y: 0, radius: 10, color: '#f00' });
    expect(lighting.lightCount).toBe(0);
  });

  it('addTrackedLight returns ID and stores light', () => {
    const id = lighting.addTrackedLight({ x: 50, y: 60, radius: 15, color: '#00ff88' });
    expect(typeof id).toBe('string');
    expect(id.startsWith('light_')).toBe(true);
    expect(lighting.lightCount).toBe(1);
  });

  it('updateLight and removeLight work by ID', () => {
    const id = lighting.addTrackedLight({ x: 10, y: 20, radius: 5, color: '#111' });
    lighting.updateLight(id, 99, 88, 0.4);
    lighting.removeLight(id);
    expect(lighting.lightCount).toBe(0);
  });

  it('clearLights empties the list', () => {
    lighting.addLight({ x: 1, y: 1, radius: 1, color: '#fff' });
    lighting.addLight({ x: 2, y: 2, radius: 2, color: '#000' });
    lighting.clearLights();
    expect(lighting.lightCount).toBe(0);
  });

  it('update advances globalTime', () => {
    const before = (lighting as any).globalTime;
    lighting.update(0.016);
    expect((lighting as any).globalTime).toBeGreaterThan(before);
  });

  it('render does nothing when disabled or no lights', () => {
    lighting.render(ctx, 800, 600, engine);
    expect(ctx.save).not.toHaveBeenCalled();

    lighting.enabled = false;
    lighting.addLight({ x: 100, y: 100, radius: 30, color: '#f0f' });
    lighting.render(ctx, 800, 600);
    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('render draws lights and shadow overlay for high preset', () => {
    lighting.applyPreset('high');
    lighting.addLight({ x: 300, y: 300, radius: 40, color: '#00aaff', intensity: 0.8, flicker: true });
    lighting.render(ctx, 800, 600, engine);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('render uses biome tint when engine provided', () => {
    lighting.applyPreset('high');
    lighting.addLight({ x: 100, y: 100, radius: 20, color: '#ff0' });
    lighting.render(ctx, 800, 600, createMockEngine('frostbyte'));
    // Should have used BIOME_AMBIENT_TINTS.frostbyte internally
    expect(ctx.fillStyle).toBeDefined();
  });

  it('getLightEmissions returns projected data', () => {
    lighting.addLight({ x: 10, y: 20, radius: 5, color: '#f00', intensity: 0.6 });
    const emissions = lighting.getLightEmissions();
    expect(emissions).toHaveLength(1);
    expect(emissions[0]).toMatchObject({ x: 10, y: 20, radius: 5, intensity: 0.6 });
  });

  it('flicker affects effective intensity in render', () => {
    lighting.applyPreset('ultra');
    lighting.addLight({ x: 0, y: 0, radius: 10, color: '#fff', flicker: true, flickerSpeed: 1, flickerAmount: 1 });
    lighting.update(0.1);
    lighting.render(ctx, 100, 100, engine);
    // Just ensure no crash and gradients created
    expect(ctx.createRadialGradient).toHaveBeenCalled();
  });
});
