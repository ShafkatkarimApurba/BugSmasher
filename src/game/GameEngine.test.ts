import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import { GameConfig } from './GameConfig';

// Mock the sound manager to prevent AudioContext errors in jsdom
vi.mock('./SoundManager', () => ({
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

describe('GameEngine', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    engine = new GameEngine(canvas);
  });

  it('should initialize with correct default values', () => {
    expect(engine.score).toBe(0);
    expect(engine.health).toBe(GameConfig.player.maxHealth);
    expect(engine.wave).toBe(1);
    expect(engine.bugs.length).toBe(0);
  });

  it('should spawn bugs correctly', () => {
    engine.startWave();
    // bugsToSpawn includes a performance factor bonus (perfFactor=1.0 => +5)
    const expectedBase = GameConfig.waves.baseBugs + engine.wave * GameConfig.waves.bugsPerWave;
    const perfBonus = Math.floor(engine.performanceFactor * 5);
    expect(engine.waveManager.bugsToSpawn).toBe(expectedBase + perfBonus);
    
    engine.waveManager.spawnBug();
    expect(engine.bugs.length).toBe(1);
    expect(engine.waveManager.bugsToSpawn).toBe(expectedBase + perfBonus - 1);
    
    const bug = engine.bugs[0];
    expect(bug.active).toBe(true);
    expect(['basic', 'scout', 'tank', 'swarmer', 'ghost']).toContain(bug.type);
  });    it('should damage and kill bugs', () => {
    engine.startWave();
    engine.waveManager.spawnBug();
    const bug = engine.bugs[0];
    
    // Force bug type to basic for predictable HP
    bug.type = 'basic';
    bug.hp = 1;
    bug.maxHp = 1;
    bug.scoreValue = 10;
    
    engine.damageBug(bug, 1);
    
    expect(bug.hp).toBeLessThanOrEqual(0);
    expect(engine.bugs.length).toBe(0);
    expect(engine.score).toBe(10);
  });

  it('should activate shield powerup', () => {
    engine.activatePowerup('shield');
    expect(engine.shieldTimer).toBe(GameConfig.powerups.duration);
  });

  it('should activate multiplier powerup', () => {
    engine.activatePowerup('multiplier');
    expect(engine.multiplierTimer).toBe(GameConfig.powerups.duration);
  });

  it('should activate rapid fire powerup', () => {
    engine.activatePowerup('rapid_fire');
    expect(engine.rapidFireTimer).toBe(GameConfig.powerups.duration);
  });

  it('should activate nuke powerup and clear bugs', () => {
    engine.startWave();
    engine.waveManager.spawnBug();
    engine.waveManager.spawnBug();
    engine.waveManager.spawnBug();
    
    expect(engine.bugs.length).toBe(3);
    
    engine.activatePowerup('nuke');
    
    expect(engine.bugs.length).toBe(0);
    expect(engine.score).toBeGreaterThan(0);
  });

  it('should handle bug reaching the base', () => {
    engine.startWave();
    engine.waveManager.spawnBug();
    
    const bug = engine.bugs[0];
    // Align bug with core position
    engine.coreX = engine.width / 2;
    engine.coreY = engine.height / 2;
    bug.x = engine.width / 2;
    bug.y = engine.height / 2;
    
    const initialHealth = engine.health;
    
    // Trigger update to process collision
    engine.update(0.1);
    
    expect(engine.bugs.length).toBe(0); // Bug should be destroyed
    expect(engine.health).toBe(initialHealth - GameConfig.player.hitDamage);
  });

  it('should protect base when shield is active', () => {
    engine.startWave();
    engine.waveManager.spawnBug();
    
    const bug = engine.bugs[0];
    engine.coreX = engine.width / 2;
    engine.coreY = engine.height / 2;
    bug.x = engine.width / 2;
    bug.y = engine.height / 2;
    
    engine.activatePowerup('shield');
    const initialHealth = engine.health;
    
    engine.update(0.1);
    
    expect(engine.bugs.length).toBe(0); // Bug should be destroyed
    expect(engine.health).toBe(initialHealth); // Health should not decrease
  });
});
