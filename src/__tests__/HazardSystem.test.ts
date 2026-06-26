import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { HazardSystem } from '../game/HazardSystem';
import { Hazard } from '../game/GameTypes';

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

describe('HazardSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let hazardSystem: HazardSystem;

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
    hazardSystem = engine.hazardSystem;
    engine.isRunning = true;
  });

  describe('initialization', () => {
    it('should store reference to engine', () => {
      expect(hazardSystem.engine).toBe(engine);
    });
  });

  describe('update', () => {
    it('should increment hazard timer', () => {
      const hazard = {
        active: true,
        x: 200, y: 200,
        radius: 50,
        type: 'web',
        timer: 0,
        duration: 8,
      } as Hazard;
      engine.hazards.push(hazard);

      hazardSystem.update(1.0);
      expect(hazard.timer).toBe(1.0);
    });

    it('should remove expired hazards', () => {
      const hazard = {
        active: true,
        x: 200, y: 200,
        radius: 50,
        type: 'web',
        timer: 7.0,
        duration: 8,
      } as Hazard;
      engine.hazards.push(hazard);

      hazardSystem.update(1.0);
      expect(hazard.timer).toBe(8.0); // At duration

      // One more update should trigger and remove
      hazardSystem.update(0.5);
      expect(engine.hazards.length).toBe(0);
    });

    it('should apply lava damage when player is touching lava', () => {
      engine.shieldTimer = 0;
      const initialHealth = engine.health;

      // Place lava right on the core
      const lava = {
        active: true,
        x: engine.coreX,
        y: engine.coreY,
        radius: 50,
        type: 'lava',
        timer: 0,
        duration: 5,
      } as Hazard;
      engine.hazards.push(lava);

      hazardSystem.update(1.0);

      expect(engine.health).toBeLessThan(initialHealth);
    });

    it('should not apply lava damage when shield is active', () => {
      engine.shieldTimer = 5;
      const initialHealth = engine.health;

      const lava = {
        active: true,
        x: engine.coreX,
        y: engine.coreY,
        radius: 50,
        type: 'lava',
        timer: 0,
        duration: 5,
      } as Hazard;
      engine.hazards.push(lava);

      hazardSystem.update(1.0);

      expect(engine.health).toBe(initialHealth);
    });

    it('should apply web slow effect when player is touching web', () => {
      const web = {
        active: true,
        x: engine.coreX,
        y: engine.coreY,
        radius: 50,
        type: 'web',
        timer: 0,
        duration: 8,
      } as Hazard;
      engine.hazards.push(web);

      hazardSystem.update(0.016);

      expect(engine.hazardSlowdown).toBe(0.4);
    });

    it('should reset slowdown when not in web', () => {
      engine.hazardSlowdown = 0.4;

      const web = {
        active: true,
        x: 1000, // Far from core
        y: 1000,
        radius: 50,
        type: 'web',
        timer: 0,
        duration: 8,
      } as Hazard;
      engine.hazards.push(web);

      hazardSystem.update(0.016);

      expect(engine.hazardSlowdown).toBe(1.0);
    });

    it('should not apply web slowdown when not touching web', () => {
      const web = {
        active: true,
        x: 1000,
        y: 1000, // Far from core
        radius: 50,
        type: 'web',
        timer: 0,
        duration: 8,
      } as Hazard;
      engine.hazards.push(web);

      hazardSystem.update(0.016);

      expect(engine.hazardSlowdown).toBe(1.0); // Full speed
    });

    it('should not apply lava damage when not touching lava', () => {
      const initialHealth = engine.health;

      const lava = {
        active: true,
        x: 1000, // Far from core
        y: 1000,
        radius: 50,
        type: 'lava',
        timer: 0,
        duration: 5,
      } as Hazard;
      engine.hazards.push(lava);

      hazardSystem.update(1.0);

      expect(engine.health).toBe(initialHealth);
    });

    it('should clean up multiple hazards simultaneously', () => {
      // Push multiple hazards that all expire
      for (let i = 0; i < 5; i++) {
        engine.hazards.push({
          active: true,
          x: 100 * i,
          y: 100 * i,
          radius: 50,
          type: 'web',
          timer: 8,
          duration: 8,
        } as Hazard);
      }

      engine.hazards.push({
        active: true,
        x: 100,
        y: 100,
        radius: 50,
        type: 'web',
        timer: 1, // Still valid
        duration: 8,
      } as Hazard);

      hazardSystem.update(0.016);

      expect(engine.hazards.length).toBe(1); // Only the one with timer=1
    });

    it('should handle empty hazards array', () => {
      engine.hazards = [];
      expect(() => hazardSystem.update(0.016)).not.toThrow();
    });
  });

  describe('barrage trigger', () => {
    it('should damage core when barrage expires on top of core', () => {
      engine.shieldTimer = 0;
      const initialHealth = engine.health;

      const barrage = {
        active: true,
        x: engine.coreX,
        y: engine.coreY,
        radius: 30,
        type: 'barrage',
        timer: 3,
        duration: 3,
      } as Hazard;
      engine.hazards.push(barrage);

      hazardSystem.update(1.0);

      expect(engine.health).toBeLessThan(initialHealth);
    });

    it('should not damage core when barrage is far away', () => {
      const initialHealth = engine.health;

      const barrage = {
        active: true,
        x: 1000,
        y: 1000,
        radius: 30,
        type: 'barrage',
        timer: 3,
        duration: 3,
      } as Hazard;
      engine.hazards.push(barrage);

      hazardSystem.update(1.0);

      expect(engine.health).toBe(initialHealth);
    });

    it('should not damage core when shield is active', () => {
      engine.shieldTimer = 5;
      const initialHealth = engine.health;

      const barrage = {
        active: true,
        x: engine.coreX,
        y: engine.coreY,
        radius: 30,
        type: 'barrage',
        timer: 3,
        duration: 3,
      } as Hazard;
      engine.hazards.push(barrage);

      hazardSystem.update(1.0);

      expect(engine.health).toBe(initialHealth);
    });

    it('should trigger explosion effects on barrage', () => {
      engine.particleSystem.spawnExplosion = vi.fn();
      engine.particleSystem.spawnShockwave = vi.fn();

      const barrage = {
        active: true,
        x: engine.coreX,
        y: engine.coreY,
        radius: 30,
        type: 'barrage',
        timer: 3,
        duration: 3,
      } as Hazard;
      engine.hazards.push(barrage);

      hazardSystem.update(1.0);

      expect(engine.particleSystem.spawnExplosion).toHaveBeenCalled();
      expect(engine.particleSystem.spawnShockwave).toHaveBeenCalled();
    });

    it('should shake on barrage damage', () => {
      engine.shieldTimer = 0;
      engine.shake = vi.fn();

      const barrage = {
        active: true,
        x: engine.coreX,
        y: engine.coreY,
        radius: 30,
        type: 'barrage',
        timer: 3,
        duration: 3,
      } as Hazard;
      engine.hazards.push(barrage);

      hazardSystem.update(1.0);

      expect(engine.shake).toHaveBeenCalled();
    });
  });
});
