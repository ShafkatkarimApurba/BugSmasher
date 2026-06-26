import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { BossSystem } from '../game/BossSystem';
import { Bug } from '../game/GameTypes';

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

describe('BossSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let bossSystem: BossSystem;

  function createBoss(overrides: Partial<Bug> = {}): Bug {
    return {
      active: true,
      x: 400,
      y: 300,
      type: 'boss',
      variantId: undefined,
      rotation: 0,
      walkCycle: 0,
      color: '#ff0000',
      size: 30,
      hp: 100,
      maxHp: 100,
      hitTimer: 0,
      offsetTime: 0,
      webTimer: 0,
      armor: 1.0,
      isHealing: false,
      isShielded: false,
      phase: undefined,
      abilityTimer: undefined,
      ...overrides,
    } as Bug;
  }

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
    engine = new GameEngine(canvas);
    bossSystem = engine.bossSystem;
    engine.isRunning = true;
  });

  describe('initialization', () => {
    it('should store reference to engine', () => {
      expect(bossSystem.engine).toBe(engine);
    });
  });

  describe('update', () => {
    it('should initialize phase and abilityTimer on first update', () => {
      const boss = createBoss();
      bossSystem.update(boss, 0.016, 1);

      expect(boss.phase).toBe(1);
      expect(boss.abilityTimer).toBe(0.016);
      expect(boss.isShielded).toBe(false);
    });

    it('should not re-initialize if already set', () => {
      const boss = createBoss({ phase: 2, abilityTimer: 5, isShielded: true });
      bossSystem.update(boss, 0.016, 1);

      expect(boss.phase).toBe(2);
      expect(boss.abilityTimer).not.toBe(0.016); // is incremented
    });

    it('should increment abilityTimer over time', () => {
      const boss = createBoss();
      bossSystem.update(boss, 1.0, 1);
      expect(boss.abilityTimer).toBe(1.0);

      bossSystem.update(boss, 1.0, 1);
      expect(boss.abilityTimer).toBe(2.0);
    });

    it('should transition to phase 2 at 66% health', () => {
      const boss = createBoss({ hp: 65, maxHp: 100 }); // < 66%
      engine.shake = vi.fn();

      bossSystem.update(boss, 0.016, 1);

      expect(boss.phase).toBe(2);
      expect(engine.shake).toHaveBeenCalled();
    });

    it('should transition to phase 3 at 33% health', () => {
      const boss = createBoss({ hp: 32, maxHp: 100, phase: 2 }); // < 33%
      engine.shake = vi.fn();
      engine.renderer.chromaticOffset = 0;

      bossSystem.update(boss, 0.016, 1);

      expect(boss.phase).toBe(3);
      expect(boss.isShielded).toBe(true);
      expect(boss.abilityTimer).toBe(0); // Reset on phase transition
      expect(engine.shake).toHaveBeenCalled();
      expect(engine.renderer.chromaticOffset).toBe(20);
    });

    it('should spawn minions at attack intervals', () => {
      const boss = createBoss({ offsetTime: 5 });
      engine.waveManager.spawnSpecificMinion = vi.fn();

      bossSystem.update(boss, 0.016, 1);

      expect(engine.waveManager.spawnSpecificMinion).toHaveBeenCalled();
    });

    it('should toggle shield in phase 3', () => {
      const boss = createBoss({ hp: 30, maxHp: 100, phase: 3, isShielded: false, abilityTimer: 15 });

      bossSystem.update(boss, 0.016, 1);
      expect(boss.isShielded).toBe(true);
      expect(boss.abilityTimer).toBe(0);
    });

    it('should remove shield after shield duration', () => {
      const boss = createBoss({ hp: 30, maxHp: 100, phase: 3, isShielded: true, abilityTimer: 15 });

      bossSystem.update(boss, 0.016, 1);
      expect(boss.isShielded).toBe(false);
      expect(boss.abilityTimer).toBe(0);
    });

    it('should add barrage hazards in phase 2+', () => {
      const boss = createBoss({ phase: 2, abilityTimer: 10 });
      const initialHazards = engine.hazards.length;

      bossSystem.update(boss, 0.016, 1);

      expect(engine.hazards.length).toBeGreaterThan(initialHazards);
    });
  });

  describe('variant specific: arachne', () => {
    it('should spawn web hazards periodically', () => {
      const boss = createBoss({ variantId: 'arachne', webTimer: 5 });

      const initialHazards = engine.hazards.length;
      bossSystem.update(boss, 0.016, 1);

      expect(engine.hazards.length).toBeGreaterThan(initialHazards);
      const web = engine.hazards[engine.hazards.length - 1];
      expect(web.type).toBe('web');
    });

    it('should not spawn web before timer threshold', () => {
      const boss = createBoss({ variantId: 'arachne', webTimer: 2 });
      const initialHazards = engine.hazards.length;

      bossSystem.update(boss, 0.016, 1);

      expect(engine.hazards.length).toBe(initialHazards);
    });
  });

  describe('variant specific: moth', () => {
    it('should set controlDistortionTimer randomly', () => {
      const boss = createBoss({ variantId: 'moth' });
      engine.renderer.isGlitching = false;

      // Mock Math.random to trigger the effect
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

      bossSystem.update(boss, 1.0, 1);

      expect(engine.controlDistortionTimer).toBe(2.0);
      expect(engine.renderer.isGlitching).toBe(true);

      spy.mockRestore();
    });
  });

  describe('variant specific: mandible', () => {
    it('should toggle armor value sinusoidally', () => {
      const boss = createBoss({ variantId: 'mandible' });

      bossSystem.update(boss, 0.016, 1);

      expect([0.8, 1.0]).toContain(boss.armor);
    });
  });

  describe('glitch effects', () => {
    it('should randomly trigger glitch', () => {
      const boss = createBoss();
      engine.shake = vi.fn();

      // Force random to return a very small value
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.001);

      bossSystem.update(boss, 1.0, 1);

      expect(engine.shake).toHaveBeenCalled();
      expect(engine.renderer.isGlitching).toBe(true);
      expect(engine.glitchTimer).toBe(0.5);

      spy.mockRestore();
    });
  });
});
