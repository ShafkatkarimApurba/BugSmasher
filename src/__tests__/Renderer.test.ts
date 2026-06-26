import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { Renderer } from '../game/Renderer';

vi.mock('../game/SoundManager', () => ({
  soundManager: {
    init: vi.fn(),
    shoot: vi.fn(),
    splat: vi.fn(),
    hitBase: vi.fn(),
    powerup: vi.fn(),
    nuke: vi.fn(),
    upgrade: vi.fn(),
    uiClick: vi.fn(),
    uiHover: vi.fn(),
    scoreTick: vi.fn(),
    resource: vi.fn(),
    bossHit: vi.fn(),
    bossDeath: vi.fn(),
    bossWarning: vi.fn(),
    bossAbility: vi.fn(),
    skillUpgrade: vi.fn(),
    dash: vi.fn(),
    uiError: vi.fn(),
    speak: vi.fn(),
    stopSpeaking: vi.fn(),
    updateGameState: vi.fn(),
    setMasterVolume: vi.fn(),
    setSfxVolume: vi.fn(),
    setMusicVolume: vi.fn(),
    setVoiceVolume: vi.fn(),
    toggleMute: vi.fn(),
    stopMusic: vi.fn(),
    playBiomeMusic: vi.fn(),
    destroy: vi.fn(),
  }
}));

describe('Renderer', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let engine: GameEngine;
  let renderer: Renderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 800, bottom: 600,
      width: 800, height: 600,
      x: 0, y: 0,
      toJSON: () => {},
    });
    // Mock canvas context
    const mockCtx = {
      setTransform: vi.fn(),
      fillStyle: '',
      fillRect: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(),
      bezierCurveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      fill: vi.fn(),
      clip: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowBlur: 0,
      shadowColor: '',
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      fillText: vi.fn(),
      strokeText: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      setLineDash: vi.fn(),
      lineDashOffset: 0,
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      putImageData: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      clearRect: vi.fn(),
      canvas: canvas,
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);
    ctx = mockCtx;

    engine = new GameEngine(canvas);
    renderer = engine.renderer;

    // Set engine to running state
    engine.start();
  });

  describe('initialization', () => {
    it('should store reference to engine', () => {
      expect(renderer.engine).toBe(engine);
    });

    it('should initialize visual state fields', () => {
      expect(renderer.isGlitching).toBe(false);
      expect(renderer.fireAlpha).toBe(0);
      expect(renderer.clickFlash).toBe(0);
      expect(renderer.impactFlash).toBe(0);
      expect(renderer.powerupAlpha).toBe(0);
      expect(renderer.chromaticOffset).toBe(0);
    });

    it('should initialize performance scaler state', () => {
      expect(renderer.currentFps).toBe(90);
      // Default High preset (0.95 vfx keeps headroom; Ultra would be 1.0)
      expect(renderer.vfxScalar).toBe(0.95);
      expect(renderer.meshComplexityStep).toBe(10);
    });
  });

  describe('isLowEnd', () => {
    it('should return true when engine is mobile', () => {
      engine.isMobile = true;
      expect(renderer.isLowEnd).toBe(true);
    });

    it('should return true when highFidelityVFX is disabled', () => {
      engine.highFidelityVFX = false;
      expect(renderer.isLowEnd).toBe(true);
    });

    it('should return true when vfxScalar is below 0.6', () => {
      renderer.vfxScalar = 0.5;
      expect(renderer.isLowEnd).toBe(true);
    });

    it('should return false on desktop with high fidelity and good fps', () => {
      engine.isMobile = false;
      engine.highFidelityVFX = true;
      renderer.vfxScalar = 1.0;
      expect(renderer.isLowEnd).toBe(false);
    });
  });

  describe('updatePerformanceScaler', () => {
    beforeEach(() => {
      (renderer as any).scaler.targetFps = 60;
      (renderer as any).scaler.currentFps = 60;
    });

    it('should use default values on first call', () => {
      // First call sets baseline (High preset starts at 0.95)
      renderer.updatePerformanceScaler();
      expect(renderer.vfxScalar).toBe(0.95);
    });

    it('should calculate FPS after accumulating frames', () => {
      // Simulate 30 frames over 500ms
      (renderer as any).scaler.lastFpsTime = performance.now() - 500;
      (renderer as any).scaler.frameCount = 30;
      (renderer as any).scaler.fpsBuffer = [];

      renderer.updatePerformanceScaler();

      // FPS should be approximately 60, but depends on timing
      expect(renderer.currentFps).toBeGreaterThan(0);
      expect(renderer.currentFps).toBeLessThan(120);
    });

    it('should reduce vfxScalar when FPS drops below 40', () => {
      (renderer as any).scaler.fpsBuffer = [25, 25, 25]; // Low FPS
      // Simulate accumulated frames
      (renderer as any).scaler.lastFpsTime = performance.now() - 1000;
      (renderer as any).scaler.frameCount = 25;

      renderer.updatePerformanceScaler();

      expect(renderer.vfxScalar).toBeLessThan(1.0);
    });

    it('should gradually restore vfxScalar when FPS recovers', () => {
      renderer.vfxScalar = 0.5;
      (renderer as any).scaler.fpsBuffer = [55, 55, 55]; // Good FPS
      (renderer as any).scaler.lastFpsTime = performance.now() - 1000;
      (renderer as any).scaler.frameCount = 55;

      renderer.updatePerformanceScaler();

      expect(renderer.vfxScalar).toBeGreaterThan(0.5);
    });

    it('should increase meshComplexityStep at very low fps', () => {
      (renderer as any).scaler.fpsBuffer = [18, 18, 18];
      (renderer as any).scaler.lastFpsTime = performance.now() - 1000;
      (renderer as any).scaler.frameCount = 18;

      renderer.updatePerformanceScaler();

      expect(renderer.meshComplexityStep).toBe(80);
    });

    it('should increase meshComplexityStep at medium low fps', () => {
      (renderer as any).scaler.fpsBuffer = [25, 25, 25];
      (renderer as any).scaler.lastFpsTime = performance.now() - 1000;
      (renderer as any).scaler.frameCount = 25;

      renderer.updatePerformanceScaler();
      expect(renderer.meshComplexityStep).toBe(40);
    });

    it('should set meshComplexityStep to 20 for fps between 30-40', () => {
      (renderer as any).scaler.fpsBuffer = [35, 35, 35];
      (renderer as any).scaler.lastFpsTime = performance.now() - 1000;
      (renderer as any).scaler.frameCount = 35;

      renderer.updatePerformanceScaler();
      expect(renderer.meshComplexityStep).toBe(20);
    });
  });

  describe('draw', () => {
    it('should call updatePerformanceScaler', () => {
      const spy = vi.spyOn(renderer as any, 'updatePerformanceScaler');
      renderer.draw();
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when drawing', () => {
      expect(() => renderer.draw()).not.toThrow();
    });

    it('should set background fill', () => {
      renderer.draw();
      expect(ctx.drawImage).toHaveBeenCalled();
    });

    it('should draw glitch overlay when isGlitching is true', () => {
      renderer.isGlitching = true;
      renderer.draw();
      // in v3.0, compositing is done via drawImage
      expect(ctx.drawImage).toHaveBeenCalled();
    });

    it('should reset transform at end', () => {
      renderer.draw();
      expect(ctx.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
    });
  });

  describe('drawBug', () => {
    it('should draw a bug without throwing', () => {
      engine.startWave();
      (engine as any).waveManager.spawnBug();
      const bug = engine.bugs[0];
      expect(() => renderer.drawBug(bug)).not.toThrow();
    });

    it('should draw boss bug without throwing', () => {
      const bug = {
        active: true,
        x: 400, y: 300,
        type: 'boss',
        variantId: 'moth',
        rotation: 0,
        walkCycle: 0,
        color: '#ff0000',
        size: 30,
        hp: 100, maxHp: 100,
        hitTimer: 0,
        phase: 1,
        abilityTimer: 0,
        isShielded: false,
        isHealing: false,
        offsetTime: 0,
        armor: 1.0,
        webTimer: 0,
      };
      expect(() => renderer.drawBug(bug as any)).not.toThrow();
    });

    it('should skip ghost bugs when flickering', () => {
      const bug = {
        active: true,
        x: 400, y: 300,
        type: 'ghost',
        variantId: undefined,
        rotation: 0,
        walkCycle: 0,
        color: '#ff00ff',
        size: 15,
        hp: 5, maxHp: 5,
        hitTimer: 0,
        phase: 1,
        abilityTimer: 0,
        isShielded: false,
        isHealing: false,
        offsetTime: 0,
        armor: 1.0,
        webTimer: 0,
      };
      // Should not throw
      expect(() => renderer.drawBug(bug as any)).not.toThrow();
    });
  });

  describe('drawBugBody variants', () => {
    it('should draw scout body', () => {
      const bug = { type: 'scout', color: '#00ff00', size: 15, walkCycle: 0, rotation: 0 } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });

    it('should draw tank body', () => {
      const bug = { type: 'tank', color: '#ff6600', size: 25, walkCycle: 0, rotation: 0 } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });

    it('should draw healer body', () => {
      const bug = { type: 'healer', color: '#00ff88', size: 15, walkCycle: 0, rotation: 0, isHealing: false } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });

    it('should draw swarmer body', () => {
      const bug = { type: 'swarmer', color: '#ffff00', size: 10, walkCycle: 0, rotation: 0 } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });

    it('should draw phase body', () => {
      const bug = { type: 'phase', color: '#00ffff', size: 15, walkCycle: 0, rotation: 0 } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });

    it('should draw ember body', () => {
      const bug = { type: 'ember', color: '#ff4400', size: 15, walkCycle: 0, rotation: 0 } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });

    it('should draw frost body', () => {
      const bug = { type: 'frost', color: '#00ccff', size: 15, walkCycle: 0, rotation: 0 } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });

    it('should draw default beetle body for unknown types', () => {
      const bug = { type: 'unknown', color: '#ff00ff', size: 15, walkCycle: 0, rotation: 0 } as any;
      expect(() => renderer.drawBugBody(bug, 0)).not.toThrow();
    });
  });

  describe('drawPowerup', () => {
    it('should draw a powerup without throwing', () => {
      const p = {
        active: true,
        x: 100, y: 100,
        type: 'shield',
        color: '#00ccff',
        icon: 'S',
        life: 8, maxLife: 8, size: 15,
        collection: 'click',
      };
      expect(() => renderer.drawPowerup(p as any)).not.toThrow();
    });

    it('should draw hover-type powerup without throwing', () => {
      const p = {
        active: true,
        x: 100, y: 100,
        type: 'multiplier',
        color: '#ffffff',
        icon: '2X',
        life: 8, maxLife: 8, size: 15,
        collection: 'hover',
      };
      expect(() => renderer.drawPowerup(p as any)).not.toThrow();
    });

    it('should flicker powerup with low life', () => {
      const p = {
        active: true,
        x: 100, y: 100,
        type: 'shield',
        color: '#00ccff',
        icon: 'S',
        life: 1.5, maxLife: 8, size: 15,
        collection: 'click',
      };
      expect(() => renderer.drawPowerup(p as any)).not.toThrow();
    });
  });

  describe('drawResource', () => {
    it('should draw a resource pickup', () => {
      const r = {
        active: true,
        x: 200, y: 200,
        type: 'scrap',
        color: '#aaaaaa',
        life: 15, maxLife: 20, size: 8,
      };
      expect(() => renderer.drawResource(r as import('../game/GameTypes').ResourcePickup)).not.toThrow();
    });

    it('should skip inactive resources', () => {
      const r = {
        active: false,
        x: 200, y: 200,
        type: 'scrap',
        color: '#aaaaaa',
        life: 0, maxLife: 20, size: 8,
      };
      expect(() => renderer.drawResource(r as import('../game/GameTypes').ResourcePickup)).not.toThrow();
    });
  });

  describe('drawSplatter', () => {
    it('should draw a splatter without throwing', () => {
      const s = {
        active: true,
        x: 150, y: 150,
        color: '#ff0000',
        life: 3, maxLife: 5,
        size: 15,
        rotation: 0,
        drops: Array.from({ length: 16 }, () => ({
          x: Math.random() * 20 - 10,
          y: Math.random() * 20 - 10,
          size: 3,
          active: true,
        })),
      };
      expect(() => renderer.drawSplatter(s as any)).not.toThrow();
    });
  });

  describe('drawHazard', () => {
    it('should draw a barrage hazard', () => {
      const h = {
        active: true,
        x: 300, y: 300,
        type: 'barrage',
        radius: 50,
        timer: 1,
        duration: 3,
      };
      expect(() => renderer.drawHazard(h as any)).not.toThrow();
    });

    it('should draw a web hazard', () => {
      const h = {
        active: true,
        x: 300, y: 300,
        type: 'web',
        radius: 50,
        timer: 2,
        duration: 8,
      };
      expect(() => renderer.drawHazard(h as any)).not.toThrow();
    });
  });

  describe('drawBase', () => {
    it('should draw the base/core', () => {
      engine.start();
      expect(() => renderer.drawBase()).not.toThrow();
    });

    it('should show shield when shieldTimer is active', () => {
      engine.shieldTimer = 5;
      expect(() => renderer.drawBase()).not.toThrow();
    });

    it('should show upgrade flash when upgradeFlash is set', () => {
      engine.upgradeFlash = 1.0;
      expect(() => renderer.drawBase()).not.toThrow();
    });
  });

  describe('drawBiomeBackground', () => {
    it('should draw for each biome type', () => {
      const biomes = ['quantum_void', 'ember_depths', 'frostbyte', 'void_abyss', 'golden_cache', 'golden_spire'];
      for (const biome of biomes) {
        engine.currentBiome = biome;
        expect(() => renderer.drawBiomeBackground()).not.toThrow();
      }
    });
  });

  describe('visual effect draw methods', () => {
    it('should draw shockwave', () => {
      const sw = { x: 200, y: 200, radius: 50, color: '#ffffff', life: 0.2, maxLife: 0.3 } as any;
      expect(() => renderer.drawShockwave(sw)).not.toThrow();
    });

    it('should draw laser', () => {
      const l = { x1: 0, y1: 0, x2: 100, y2: 100, color: '#ff0000', width: 3, life: 0.1, maxLife: 0.15 } as any;
      expect(() => renderer.drawLaser(l)).not.toThrow();
    });

    it('should draw spark particle', () => {
      const p = { x: 100, y: 100, type: 'spark', color: '#ffff00', size: 5, life: 0.5, maxLife: 1.0, rotation: 0 } as any;
      expect(() => renderer.drawParticle(p)).not.toThrow();
    });

    it('should draw smoke particle', () => {
      const p = { x: 100, y: 100, type: 'smoke', color: 'rgba(100,100,100,0.5)', size: 10, life: 0.5, maxLife: 1.0, rotation: 0 } as any;
      expect(() => renderer.drawParticle(p)).not.toThrow();
    });

    it('should draw regular particle', () => {
      const p = { x: 100, y: 100, type: 'regular', color: '#ffffff', size: 5, life: 0.5, maxLife: 1.0, rotation: 0 } as any;
      expect(() => renderer.drawParticle(p)).not.toThrow();
    });

    it('should draw muzzle flash', () => {
      const f = { x: 100, y: 100, size: 40, life: 0.03, maxLife: 0.05 } as any;
      expect(() => renderer.drawMuzzleFlash(f)).not.toThrow();
    });
  });

  describe('boss effects', () => {
    it('should draw boss intro', () => {
      engine.waveManager.bossIntroActive = true;
      engine.waveManager.bossIntroTimer = 2;
      expect(() => (renderer as any).drawBossIntro()).not.toThrow();
    });

    it('should draw boss warning', () => {
      expect(() => renderer.drawBossWarning()).not.toThrow();
    });

    it('should draw boss health bar when boss exists', () => {
      // Create a boss bug
      const boss = {
        active: true,
        x: 400, y: 300,
        type: 'boss',
        variantId: 'moth',
        rotation: 0,
        walkCycle: 0,
        color: '#ff0000',
        size: 30,
        hp: 80, maxHp: 100,
        hitTimer: 0,
        phase: 1,
        abilityTimer: 0,
        isShielded: false,
        isHealing: false,
        offsetTime: 0,
        armor: 1.0,
        webTimer: 0,
      };
      engine.bugs.push(boss as any);
      expect(() => renderer.drawBossHealthBar(800, 600)).not.toThrow();
    });
  });

  describe('drawLightingPass', () => {
    it('should draw lighting pass', () => {
      expect(() => renderer.drawLightingPass(800, 600)).not.toThrow();
    });

    it('should skip detailed lighting on low FPS', () => {
      renderer.currentFps = 25;
      expect(() => renderer.drawLightingPass(800, 600)).not.toThrow();
    });
  });

  describe('drawActivePowerupUI', () => {
    it('should show active powerup timers', () => {
      engine.multiplierTimer = 5;
      engine.rapidFireTimer = 10;
      expect(() => renderer.drawActivePowerupUI(800, 600)).not.toThrow();
    });

    it('should show nothing when no timers active', () => {
      engine.multiplierTimer = 0;
      engine.rapidFireTimer = 0;
      engine.slowMoTimer = 0;
      engine.overdriveTimer = 0;
      expect(() => renderer.drawActivePowerupUI(800, 600)).not.toThrow();
    });
  });

  describe('drawBossHealthBar', () => {
    it('should not draw when no boss exists', () => {
      engine.bugs = [];
      expect(() => renderer.drawBossHealthBar(800, 600)).not.toThrow();
    });
  });

  describe('environmental draws', () => {
    it('should draw grid', () => {
      expect(() => renderer.drawGrid(200, 'rgba(255,255,255,0.01)')).not.toThrow();
    });

    it('should draw starfield', () => {
      expect(() => renderer.drawStarfield(50)).not.toThrow();
    });

    it('should draw lava bubbles', () => {
      expect(() => renderer.drawLavaBubbles()).not.toThrow();
    });

    it('should draw snowflakes', () => {
      expect(() => renderer.drawSnowflakes()).not.toThrow();
    });

    it('should draw dynamic mesh', () => {
      renderer.currentFps = 60;
      expect(() => renderer.drawDynamicMesh()).not.toThrow();
    });

    it('should skip dynamic mesh on very low FPS', () => {
      renderer.currentFps = 15;
      expect(() => renderer.drawDynamicMesh()).not.toThrow();
    });

    it('should draw clouds', () => {
      expect(() => renderer.drawClouds()).not.toThrow();
    });
  });

  describe('full draw lifecycle', () => {
    it('should handle a full draw cycle without throwing', () => {
      // Set up various engine states
      engine.startWave();
      engine.waveManager.bossIntroActive = true;
      engine.waveManager.bossIntroTimer = 2;
      engine.shieldTimer = 5;
      engine.multiplierTimer = 3;
      renderer.fireAlpha = 0.5;
      renderer.isGlitching = true;
      renderer.clickFlash = 0.5;
      renderer.impactFlash = 0.3;
      renderer.powerupAlpha = 0.5;

      expect(() => renderer.draw()).not.toThrow();
    });

    it('should handle multiple frames without error', () => {
      for (let i = 0; i < 10; i++) {
        engine.globalTime = i * 0.016;
        renderer.draw();
        // Simulate bugs moving
        engine.bugs.forEach(b => { b.x += 1; b.y += 1; });
      }
      // Ensure no exceptions over multiple frames
      expect(true).toBe(true);
    });

    it('should handle low-end mode without errors', () => {
      engine.isMobile = true;
      renderer.currentFps = 20;
      expect(() => renderer.draw()).not.toThrow();
    });
  });
});
