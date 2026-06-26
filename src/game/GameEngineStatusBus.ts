/**
 * Typed replacement for `(window as any).__gameEngineStatus`.
 * React/UI layers subscribe via events; GameEngine publishes each frame while running.
 */

export interface GameEngineStatus {
  health: number;
  maxHealth: number;
  currentBiome: string;
  intensity: number;
  performanceFactor: number;
  weaponHeat: number;
  isOverheated: boolean;
  dashCooldownTimer: number;
  dashCooldown: number;
  rapidFireTimer: number;
  spikeBurstTimer: number;
}

export type GameEngineStatusListener = (status: GameEngineStatus | null) => void;

const STATUS_EVENT = 'bugsmasher:engine-status';

export class GameEngineStatusBus {
  private static current: GameEngineStatus | null = null;

  static publish(status: GameEngineStatus | null): void {
    this.current = status;
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent<GameEngineStatus | null>(STATUS_EVENT, { detail: status })
    );
  }

  static getSnapshot(): GameEngineStatus | null {
    return this.current;
  }

  static subscribe(listener: GameEngineStatusListener): () => void {
    if (typeof window === 'undefined') {
      listener(this.current);
      return () => {};
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<GameEngineStatus | null>).detail ?? null;
      listener(detail);
    };

    window.addEventListener(STATUS_EVENT, handler);
    listener(this.current);

    return () => window.removeEventListener(STATUS_EVENT, handler);
  }

  /** @deprecated Use subscribe() — kept for one release to ease migration */
  static syncLegacyWindowGlobal(status: GameEngineStatus | null): void {
    if (typeof window === 'undefined') return;
    (window as Window & { __gameEngineStatus?: GameEngineStatus | null }).__gameEngineStatus =
      status;
  }
}