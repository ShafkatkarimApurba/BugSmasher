import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { InputSystem } from '../game/InputSystem';
import { GameConfig } from '../game/GameConfig';

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

describe('InputSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let input: InputSystem;

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
    input = engine.inputSystem;
  });

  describe('initialization', () => {
    it('should initialize with mouse at canvas center', () => {
      expect(input.lastMouseX).toBe(engine.width / 2);
      expect(input.lastMouseY).toBe(engine.height / 2);
    });

    it('should store a reference to the engine', () => {
      expect((input as any).engine).toBe(engine);
    });
  });

  describe('handleKeyDown (dash trigger)', () => {
    it('should trigger dash on Shift key', () => {
      engine.isRunning = true;
      engine.start();
      engine.triggerDash = vi.fn();

      const event = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(event);

      expect(engine.triggerDash).toHaveBeenCalled();
    });

    it('should trigger dash on Space key', () => {
      engine.isRunning = true;
      engine.start();
      engine.triggerDash = vi.fn();

      // Provide code to match DEFAULT_BINDINGS.dash = 'Space' (jsdom synthetic KeyboardEvent requires explicit .code)
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' });
      window.dispatchEvent(event);

      expect(engine.triggerDash).toHaveBeenCalled();
    });

    it('should not trigger dash when paused', () => {
      engine.isRunning = true;
      engine.isPaused = true;
      engine.triggerDash = vi.fn();

      const event = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(event);

      expect(engine.triggerDash).not.toHaveBeenCalled();
    });

    it('should not trigger dash when not running', () => {
      engine.isRunning = false;
      engine.triggerDash = vi.fn();

      const event = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(event);

      expect(engine.triggerDash).not.toHaveBeenCalled();
    });

    it('should ignore keyboard repeats', () => {
      engine.isRunning = true;
      engine.triggerDash = vi.fn();

      const event = new KeyboardEvent('keydown', { key: 'Shift', repeat: true });
      window.dispatchEvent(event);

      expect(engine.triggerDash).not.toHaveBeenCalled();
    });
  });

  describe('processClick', () => {
    beforeEach(() => {
      engine.isRunning = true;
      engine.waveManager.waveActive = true;
    });

    it('should not process click when paused', () => {
      engine.isPaused = true;
      engine.damageBug = vi.fn();

      input.processClick(400, 300);

      expect(engine.damageBug).not.toHaveBeenCalled();
    });

    it('should not process click when not running', () => {
      engine.isRunning = false;
      engine.damageBug = vi.fn();

      input.processClick(400, 300);

      expect(engine.damageBug).not.toHaveBeenCalled();
    });

    it('should not process click when wave is not active', () => {
      engine.waveManager.waveActive = false;
      engine.damageBug = vi.fn();

      input.processClick(400, 300);

      expect(engine.damageBug).not.toHaveBeenCalled();
    });

    it('should not process click during cooldown', () => {
      engine.clickCooldown = 1.0;
      engine.damageBug = vi.fn();

      input.processClick(400, 300);

      expect(engine.damageBug).not.toHaveBeenCalled();
    });

    it('should increase weapon heat on click', () => {
      const initialHeat = engine.weaponHeat;
      input.processClick(400, 300);
      expect(engine.weaponHeat).toBeGreaterThan(initialHeat);
    });

    it('should set overheat when weapon heat reaches 100', () => {
      // Rapid clicks to overheat
      engine.weaponHeat = 90;
      input.processClick(400, 300);
      expect(engine.isOverheated).toBe(true);
    });

    it('should process click on a bug and deal damage', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      
      const bug = engine.bugs[0];
      // Place bug at a clickable position
      bug.x = 400;
      bug.y = 300;
      bug.size = 15;
      bug.hp = 2;
      const initialHp = bug.hp;

      input.processClick(400, 300);

      // Bug should take damage
      expect(bug.hp).toBeLessThan(initialHp);
    });

    it('should collect powerups on click within range', () => {
      const powerup = {
        active: true,
        x: 400, y: 300,
        type: 'shield',
        color: '#00ccff',
        icon: 'S',
        life: 8, maxLife: 8, size: 15,
        collection: 'click',
      };
      engine.powerups.push(powerup);
      engine.activatePowerup = vi.fn();

      input.processClick(400, 300);

      expect(engine.activatePowerup).toHaveBeenCalledWith('shield', 400, 300);
      expect(engine.powerups.length).toBe(0);
    });

    it('should trigger spike burst AoE when spikeBurstTimer is active', () => {
      engine.spikeBurstTimer = 5.0;
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      
      const bug = engine.bugs[0];
      bug.x = 400;
      bug.y = 300;
      bug.hp = 5;

      input.processClick(400, 300);

      expect(bug.hp).toBeLessThan(5);
    });

    it('should create miss particles when clicking empty space', () => {
      const initialMissed = engine.missedClicksInSubwave;
      input.processClick(400, 300);
      expect(engine.missedClicksInSubwave).toBe(initialMissed + 1);
    });

    it('should apply distortion mirroring when controlDistortionTimer is active', () => {
      engine.controlDistortionTimer = 2.0;
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      
      const bug = engine.bugs[0];
      // Place bug at mirrored position
      const clickX = 100;
      const clickY = 100;
      // Mirror: x' = centerX + (centerX - x) = 400 + (400 - 100) = 700
      bug.x = 700;
      bug.y = 500;
      bug.hp = 2;

      input.processClick(clickX, clickY);
      expect(bug.hp).toBeLessThan(2);
    });
  });

  describe('pointer move (hover powerup detection)', () => {
    it('should detect hover over collectible powerups', () => {
      engine.isRunning = true;
      engine.waveManager.waveActive = true;

      const powerup = {
        active: true,
        x: 200, y: 200,
        type: 'multiplier',
        color: '#ffffff',
        icon: '2X',
        life: 8, maxLife: 8, size: 15,
        collection: 'hover',
      };
      engine.powerups.push(powerup);

      const moveEvent = new PointerEvent('pointermove', {
        clientX: 200,
        clientY: 200,
      });
      canvas.dispatchEvent(moveEvent);

      expect(canvas.getAttribute('data-hovering-game-object')).toBe('true');
    });

    it('should collect hover-type powerups when close enough', () => {
      engine.isRunning = true;
      engine.waveManager.waveActive = true;
      engine.activatePowerup = vi.fn();

      const powerup = {
        active: true,
        x: 210, y: 210,
        type: 'multiplier',
        color: '#ffffff',
        icon: '2X',
        life: 8, maxLife: 8, size: 15,
        collection: 'hover',
      };
      engine.powerups.push(powerup);

      const moveEvent = new PointerEvent('pointermove', {
        clientX: 210,
        clientY: 210,
      });
      canvas.dispatchEvent(moveEvent);

      expect(engine.activatePowerup).toHaveBeenCalled();
      expect(engine.powerups.length).toBe(0);
    });
  });
});
