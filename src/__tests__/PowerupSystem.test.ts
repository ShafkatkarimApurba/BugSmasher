import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { PowerupSystem } from '../game/PowerupSystem';
import { Powerup } from '../game/GameTypes';

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

describe('PowerupSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let powerupSystem: PowerupSystem;

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
    powerupSystem = engine.powerupSystem;
    engine.isRunning = true;
  });

  describe('initialization', () => {
    it('should store reference to engine', () => {
      expect(powerupSystem.engine).toBe(engine);
    });
  });

  describe('spawn (powerup)', () => {
    it('should spawn a powerup when force is true', () => {
      powerupSystem.spawn(100, 200, true);
      expect(engine.powerups.length).toBe(1);
      const p = engine.powerups[0];
      expect(p.x).toBe(100);
      expect(p.y).toBe(200);
      expect(p.active).toBe(true);
    });

    it('should not spawn when random rolls higher than drop chance', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.999);
      powerupSystem.spawn(100, 200);
      expect(engine.powerups.length).toBe(0);
      spy.mockRestore();
    });

    it('should spawn when random rolls within drop chance', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.001);
      powerupSystem.spawn(100, 200);
      expect(engine.powerups.length).toBe(1);
      spy.mockRestore();
    });

    it('should increase drop chance after wave 4', () => {
      engine.wave = 8;
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.001);
      powerupSystem.spawn(100, 200, true);
      expect(engine.powerups.length).toBeGreaterThan(0);
      spy.mockRestore();
    });

    it('should set powerup lifetime from config', () => {
      powerupSystem.spawn(100, 200, true);
      const p = engine.powerups[0];
      expect(p.life).toBeGreaterThan(0);
      expect(p.maxLife).toBe(p.life);
      expect(p.size).toBe(15);
    });
  });

  describe('spawnResource', () => {
    it('should spawn scrap from basic bugs', () => {
      powerupSystem.spawnResource(100, 200, 'basic');
      const resources = engine.resources.filter(r => r.active);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0].type).toBe('scrap');
    });

    it('should spawn plasma from scout bugs', () => {
      powerupSystem.spawnResource(100, 200, 'scout');
      const resources = engine.resources.filter(r => r.active);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0].type).toBe('plasma');
    });

    it('should spawn neural_core from boss bugs', () => {
      powerupSystem.spawnResource(100, 200, 'boss');
      const resources = engine.resources.filter(r => r.active);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0].type).toBe('neural_core');
    });

    it('should spawn alloy from tank bugs', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      powerupSystem.spawnResource(100, 200, 'tank');
      const resources = engine.resources.filter(r => r.active);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0].type).toBe('alloy');
    });

    it('should spawn at slightly offset positions', () => {
      powerupSystem.spawnResource(100, 100, 'basic');
      const r = engine.resources[0];
      expect(r.x).not.toBe(100); // Slightly randomized
      expect(r.y).not.toBe(100);
    });

    it('should set resource life to 20 seconds', () => {
      powerupSystem.spawnResource(100, 100, 'basic');
      const r = engine.resources[0];
      expect(r.life).toBe(20);
      expect(r.maxLife).toBe(20);
    });
  });

  describe('activate', () => {
    it('should activate shield powerup', () => {
      powerupSystem.activate('shield');
      expect(engine.shieldTimer).toBeGreaterThan(0);
    });

    it('should activate multiplier powerup', () => {
      powerupSystem.activate('multiplier');
      expect(engine.multiplierTimer).toBeGreaterThan(0);
    });

    it('should activate rapid_fire powerup', () => {
      powerupSystem.activate('rapid_fire');
      expect(engine.rapidFireTimer).toBeGreaterThan(0);
    });

    it('should activate slow_mo powerup', () => {
      powerupSystem.activate('slow_mo');
      expect(engine.slowMoTimer).toBeGreaterThan(0);
    });

    it('should activate freeze powerup', () => {
      powerupSystem.activate('freeze');
      expect(engine.freezeTimer).toBeGreaterThan(0);
    });

    it('should activate magnet powerup', () => {
      powerupSystem.activate('magnet');
      expect(engine.magnetTimer).toBeGreaterThan(0);
    });

    it('should activate spike_burst powerup', () => {
      powerupSystem.activate('spike_burst');
      expect(engine.spikeBurstTimer).toBeGreaterThan(0);
    });

    it('should activate overdrive powerup', () => {
      powerupSystem.activate('overdrive');
      expect(engine.overdriveTimer).toBeGreaterThan(0);
    });

    it('should heal with repair_cell', () => {
      engine.health = 50;
      powerupSystem.activate('repair_cell');
      expect(engine.health).toBeGreaterThan(50);
    });

    it('should set powerupAlpha on activation', () => {
      powerupSystem.activate('shield');
      expect(engine.renderer.powerupAlpha).toBe(1.0);
    });

    it('should increment totalPowerupsCollected', () => {
      const before = engine.totalPowerupsCollected;
      powerupSystem.activate('shield');
      expect(engine.totalPowerupsCollected).toBe(before + 1);
    });

    it('should spawn shockwave on activation', () => {
      engine.particleSystem.spawnShockwave = vi.fn();
      powerupSystem.activate('shield');
      expect(engine.particleSystem.spawnShockwave).toHaveBeenCalled();
    });
  });

  describe('updatePowerups', () => {
    it('should decrease powerup life over time', () => {
      powerupSystem.spawn(100, 200, true);
      const p = engine.powerups[0];
      const originalLife = p.life;

      powerupSystem.updatePowerups(1.0);
      expect(p.life).toBeLessThan(originalLife);
    });

    it('should remove expired powerups', () => {
      powerupSystem.spawn(100, 200, true);
      expect(engine.powerups.length).toBe(1);

      // Fast forward past expiry
      const p = engine.powerups[0];
      p.life = 0.5;
      powerupSystem.updatePowerups(1.0);

      expect(engine.powerups.length).toBe(0);
    });

    it('should attract powerups toward core when magnet is active', () => {
      engine.magnetTimer = 5;
      powerupSystem.spawn(500, 500, true);
      const p = engine.powerups[0];
      const distToCore = Math.sqrt(
        (p.x - engine.coreX) ** 2 + (p.y - engine.coreY) ** 2
      );

      powerupSystem.updatePowerups(0.1);

      const newDist = Math.sqrt(
        (p.x - engine.coreX) ** 2 + (p.y - engine.coreY) ** 2
      );
      expect(newDist).toBeLessThan(distToCore);
    });

    it('should handle empty powerups array', () => {
      engine.powerups = [];
      expect(() => powerupSystem.updatePowerups(0.016)).not.toThrow();
    });
  });

  describe('updateResources', () => {
    it('should decrease resource life', () => {
      powerupSystem.spawnResource(100, 100, 'basic');
      const r = engine.resources[0];
      const originalLife = r.life;

      powerupSystem.updateResources(1.0);
      expect(r.life).toBeLessThan(originalLife);
    });

    it('should deactivate expired resources', () => {
      powerupSystem.spawnResource(100, 100, 'basic');
      const r = engine.resources[0];
      r.life = 0.5;

      powerupSystem.updateResources(1.0);
      expect(r.active).toBe(false);
    });

    it('should attract resources within 200px of core', () => {
      // Place resource just inside the 200px threshold
      const angle = Math.atan2(0, 1);
      const rX = engine.coreX + 180;
      const rY = engine.coreY;

      powerupSystem.spawnResource(rX, rY, 'basic');
      const r = engine.resources.filter(res => res.active)[0];

      const distBefore = Math.sqrt(
        (r.x - engine.coreX) ** 2 + (r.y - engine.coreY) ** 2
      );

      powerupSystem.updateResources(0.1);

      const distAfter = Math.sqrt(
        (r.x - engine.coreX) ** 2 + (r.y - engine.coreY) ** 2
      );
      expect(distAfter).toBeLessThan(distBefore);
    });

    it('should collect resources when close enough to core', () => {
      // Place resource very close to core
      const rX = engine.coreX + 20;
      const rY = engine.coreY + 20;

      // Mock Math.random to center the resource (no random offset)
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      powerupSystem.spawnResource(rX, rY, 'basic');
      spy.mockRestore();

      const r = engine.resources.filter(res => res.active)[0];

      powerupSystem.updateResources(0.016);

      // Resource should be collected (deactivated)
      expect(r.active).toBe(false);
    });

    it('should handle empty resources array', () => {
      engine.resources = [];
      expect(() => powerupSystem.updateResources(0.016)).not.toThrow();
    });
  });
});
