import { describe, it, expect, vi } from 'vitest';
import { GameEngineStatusBus, type GameEngineStatus } from '../game/GameEngineStatusBus';

describe('GameEngineStatusBus', () => {
  it('publishes and returns snapshot', () => {
    const status: GameEngineStatus = {
      health: 50,
      maxHealth: 100,
      currentBiome: 'neon_core',
      intensity: 1.2,
      performanceFactor: 1,
      weaponHeat: 10,
      isOverheated: false,
      dashCooldownTimer: 0,
      dashCooldown: 3,
      rapidFireTimer: 0,
      spikeBurstTimer: 0,
    };
    GameEngineStatusBus.publish(status);
    expect(GameEngineStatusBus.getSnapshot()).toEqual(status);
    GameEngineStatusBus.publish(null);
    expect(GameEngineStatusBus.getSnapshot()).toBeNull();
  });

  it('notifies subscribers', () => {
    const listener = vi.fn();
    const unsub = GameEngineStatusBus.subscribe(listener);
    expect(listener).toHaveBeenCalled();
    unsub();
  });
});