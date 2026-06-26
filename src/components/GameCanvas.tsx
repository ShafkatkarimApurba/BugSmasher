import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { GameModeId } from '../game/GameMode';
import { StatsManager } from '../game/StatsManager';

interface GameCanvasProps {
  gameMode?: GameModeId;
  onGameOver: (score: number) => void;
  onWaveComplete: () => void;
  onStoryTrigger?: (type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige', value: number) => void;
}

export const GameCanvas = forwardRef<GameEngine | null, GameCanvasProps>(({
  gameMode = 'standard',
  onGameOver,
  onWaveComplete,
  onStoryTrigger,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useImperativeHandle(ref, () => {
    return new Proxy({}, {
      get: (target, prop) => {
        if (!engineRef.current) return undefined;
        const value = (engineRef.current as any)[prop];
        if (typeof value === 'function') {
          return value.bind(engineRef.current);
        }
        return value;
      },
      set: (target, prop, value) => {
        if (engineRef.current) {
          (engineRef.current as any)[prop] = value;
          return true;
        }
        return false;
      }
    }) as any;
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.setGameMode(gameMode);
    engine.onGameOver = onGameOver;
    engine.onWaveComplete = onWaveComplete;
    engine.onStoryTrigger = onStoryTrigger;

    StatsManager.recordRunStart();
    engine.start();

    return () => {
      engine.destroy();
    };
  }, [onGameOver, onWaveComplete]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block touch-none"
      style={{ cursor: 'none' }}
    />
  );
});
