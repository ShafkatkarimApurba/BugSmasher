import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { CollisionSystem } from '../game/CollisionSystem';
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

describe('CollisionSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let collisionSystem: CollisionSystem;

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
    collisionSystem = engine.collisionSystem;
    engine.isRunning = true;
  });

  describe('initialization', () => {
    it('should store reference to engine', () => {
      expect(collisionSystem.engine).toBe(engine);
    });
  });

  describe('handleBugImpact', () => {
    it('should reduce health when shield is down', () => {
      const initialHealth = engine.health;
      engine.shieldTimer = 0;

      const bug = {
        active: true,
        x: engine.coreX + 10,
        y: engine.coreY + 10,
        color: '#ff0000',
        size: 15,
        type: 'basic',
      } as Bug;
      // Only what handleBugImpact uses from the bug

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.health).toBeLessThan(initialHealth);
    });

    it('should not reduce health when shield is active', () => {
      const initialHealth = engine.health;
      engine.shieldTimer = 5;

      const bug = {
        active: true,
        x: engine.coreX + 10,
        y: engine.coreY + 10,
        color: '#ff0000',
        size: 15,
      } as Bug;

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.health).toBe(initialHealth);
    });

    it('should set impactFlash when taking damage', () => {
      engine.shieldTimer = 0;

      const bug = {
        active: true,
        x: engine.coreX + 10,
        y: engine.coreY + 10,
        color: '#ff0000',
        size: 15,
      } as Bug;

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.renderer.impactFlash).toBe(1.0);
    });

    it('should reset streak count on hit', () => {
      engine.streakCount = 25;
      engine.shieldTimer = 0;

      const bug = {
        active: true,
        x: engine.coreX + 10,
        y: engine.coreY + 10,
        color: '#ff0000',
        size: 15,
      } as Bug;

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.streakCount).toBe(0);
    });

    it('should trigger shake effect on hit', () => {
      engine.shake = vi.fn();
      engine.shieldTimer = 0;

      const bug = {
        active: true,
        x: engine.coreX + 50,
        y: engine.coreY + 50,
        color: '#ff0000',
        size: 15,
      } as Bug;

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.shake).toHaveBeenCalled();
    });

    it('should trigger chromatic offset on hit', () => {
      engine.shieldTimer = 0;

      const bug = {
        active: true,
        x: engine.coreX + 10,
        y: engine.coreY + 10,
        color: '#ff0000',
        size: 15,
      } as Bug;

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.renderer.chromaticOffset).toBe(15);
    });

    it('should spawn an explosion particle effect', () => {
      engine.particleSystem.spawnExplosion = vi.fn();
      engine.shieldTimer = 0;

      const bug = {
        active: true,
        x: 300,
        y: 200,
        color: '#ff0000',
        size: 15,
      } as Bug;

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.particleSystem.spawnExplosion).toHaveBeenCalledWith(300, 200, '#ff0000');
    });

    it('should shake even when shield is up (but less)', () => {
      engine.shieldTimer = 5;
      engine.shake = vi.fn();

      const bug = {
        active: true,
        x: engine.coreX + 10,
        y: engine.coreY + 10,
        color: '#ff0000',
        size: 15,
      } as Bug;

      collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);

      expect(engine.shake).toHaveBeenCalledWith(0.2, 5);
    });
  });

  describe('handleDashPush', () => {
    it('should not push bugs when dash is inactive', () => {
      engine.dashTimer = 0;
      const bug = {
        active: true,
        x: engine.coreX + 50,
        y: engine.coreY + 50,
      } as Bug;
      engine.bugs.push(bug);
      engine.damageBug = vi.fn();

      collisionSystem.handleDashPush(0.016);

      expect(engine.damageBug).not.toHaveBeenCalled();
    });

    it('should push bugs when dash is active', () => {
      engine.dashTimer = 1;
      const bug = {
        active: true,
        x: engine.coreX + 50,
        y: engine.coreY + 50,
      } as Bug;
      engine.bugs.push(bug);
      const originalX = bug.x;
      const originalY = bug.y;

      collisionSystem.handleDashPush(0.016);

      // Bug should be pushed away from core
      expect(bug.x).not.toBe(originalX);
      expect(bug.y).not.toBe(originalY);
    });

    it('should damage bugs during dash push', () => {
      engine.dashTimer = 1;
      engine.damageBug = vi.fn();
      const bug = {
        active: true,
        x: engine.coreX + 50,
        y: engine.coreY + 50,
      } as Bug;
      engine.bugs.push(bug);

      collisionSystem.handleDashPush(0.016);

      expect(engine.damageBug).toHaveBeenCalledWith(bug, 0.4);
    });

    it('should not push bugs far from core', () => {
      engine.dashTimer = 1;
      engine.damageBug = vi.fn();
      const bug = {
        active: true,
        x: engine.coreX + 500,
        y: engine.coreY + 500,
      } as Bug;
      engine.bugs.push(bug);
      const originalX = bug.x;

      collisionSystem.handleDashPush(0.016);

      // Bug far away should not be pushed
      expect(bug.x).toBe(originalX);
    });
  });
});
