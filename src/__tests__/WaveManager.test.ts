import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WaveManager } from '../game/WaveManager';
import { GameEngine } from '../game/GameEngine';
import { GameConfig } from '../game/GameConfig';

// Mock SoundManager
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

describe('WaveManager', () => {
  let engine: GameEngine;
  let waveManager: WaveManager;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    engine = new GameEngine(canvas);
    waveManager = engine.waveManager;
  });

  it('should initialize and start waves properly', () => {
    waveManager.startWave();
    expect(waveManager.waveActive).toBe(true);
    expect(waveManager.intensity).toBe(1);
    expect(waveManager.bugsToSpawn).toBeGreaterThan(0);
  });

  it('should fluctuate intensity over time', () => {
    waveManager.startWave();
    const initialIntensity = waveManager.intensity;
    
    // Simulate some time passing to change intensity via Math.sin
    waveManager.update(1.0); // 1 second
    expect(waveManager.intensity).not.toBe(initialIntensity);
  });

  it('should eventually toggle surges', () => {
    waveManager.startWave();
    waveManager.surgeTimer = 0.1; // Force a surge transition
    
    waveManager.update(0.2);
    expect(waveManager.surgeActive).toBe(true);
    expect(waveManager.surgeTimer).toBeGreaterThan(0);
  });

  it('should complete wave when all bugs are dead and none left to spawn', () => {
    waveManager.startWave();
    waveManager.bugsToSpawn = 0;
    engine.bugs = [];
    
    let waveCompleteCalled = false;
    engine.onWaveComplete = () => { waveCompleteCalled = true; };
    
    waveManager.update(0.1);
    expect(waveManager.waveActive).toBe(false);
    expect(waveCompleteCalled).toBe(true);
  });
});
