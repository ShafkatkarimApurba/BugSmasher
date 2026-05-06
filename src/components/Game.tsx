import { useState, useCallback, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { GameOver } from './GameOver';
import { UpgradeMenu } from './UpgradeMenu';
import { PauseMenu } from './PauseMenu';
import { TutorialOverlay } from './TutorialOverlay';
import { GameEngine } from '../game/GameEngine';
import { GameConfig } from '../game/GameConfig';
import { achievementSystem } from '../game/AchievementSystem';
import { useEffect } from 'react';

export function Game({ onMainMenu }: { onMainMenu: () => void }) {
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalWaves, setFinalWaves] = useState(1);
  const [finalKills, setFinalKills] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameId, setGameId] = useState(0);
  
  // We strictly manage these here ONLY for the menus that need them when paused
  const [finalScore, setFinalScore] = useState(0);
  const [currentWave, setCurrentWave] = useState(1);
  const [upgradeLevels, setUpgradeLevels] = useState({
    health: 0,
    radius: 0,
    turret: 0,
  });
  
  const engineRef = useRef<GameEngine | null>(null);

  const handleGameOver = useCallback((score: number, waves: number, kills: number) => {
    setFinalScore(score);
    setFinalWaves(waves);
    setFinalKills(kills);
    setIsGameOver(true);
  }, []);

  const handleWaveComplete = useCallback((completedWave: number) => {
    if (engineRef.current) {
      // Track wave achievement using completed wave number
      achievementSystem.onWaveComplete(completedWave);
      
      setFinalScore(engineRef.current.score);
      setCurrentWave(engineRef.current.wave);
    }
    setIsUpgrading(true);
  }, []);

  const handleUpgrade = (type: 'health' | 'radius' | 'turret', cost: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Defensive guard
    if (engine.score < cost) return;

    // Deduct score
    engine.score -= cost;
    setFinalScore(engine.score);

    // Apply upgrade
    if (type === 'health') {
      engine.maxHealth += GameConfig.upgrades.health.healAmount;
      engine.health = engine.maxHealth;
    } else if (type === 'radius') {
      engine.clickRadiusMultiplier *= GameConfig.upgrades.radius.radiusMultiplier;
    } else if (type === 'turret') {
      engine.autoTurretLevel += 1;
    }

    setUpgradeLevels((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  };

  const handleNextWave = () => {
    setIsUpgrading(false);
    setIsPaused(false);
    const engine = engineRef.current;
    if (engine) {
      engine.isPaused = false;
      engine.resume();
    }
  };

  const togglePause = useCallback(() => {
    if (isGameOver || isUpgrading) return;
    const engine = engineRef.current;
    if (engine) {
      engine.isPaused = !engine.isPaused;
      setIsPaused(engine.isPaused);
    }
  }, [isGameOver, isUpgrading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause]);

  return (
    <div className="relative w-full h-full">
      <GameCanvas 
        ref={engineRef}
        key={gameId}
        onGameOver={handleGameOver}
        onWaveComplete={handleWaveComplete}
      />
      
      {!isGameOver && !isUpgrading && <HUD engineRef={engineRef} onPauseToggle={togglePause} isPaused={isPaused} />}
      
      {isPaused && !isGameOver && !isUpgrading && (
        <PauseMenu 
          onResume={togglePause}
          onMainMenu={onMainMenu}
        />
      )}
      
      {isUpgrading && !isGameOver && (
        <UpgradeMenu 
          score={finalScore} 
          onUpgrade={handleUpgrade} 
          onNextWave={handleNextWave} 
          onClose={handleNextWave}
          wave={currentWave}
          healthLevel={upgradeLevels.health}
          radiusLevel={upgradeLevels.radius}
          turretLevel={upgradeLevels.turret}
        />
      )}

      {!isGameOver && !isUpgrading && (
        <TutorialOverlay engineRef={engineRef} />
      )}
      
      {isGameOver && (
        <GameOver 
          score={finalScore} 
          waves={finalWaves}
          kills={finalKills}
          onRetry={() => {
            setIsGameOver(false);
            setIsUpgrading(false);
            setFinalScore(0);
            setCurrentWave(1);
            setUpgradeLevels({ health: 0, radius: 0, turret: 0 });
            setGameId(id => id + 1);
          }} 
          onMainMenu={onMainMenu} 
        />
      )}
    </div>
  );
}
