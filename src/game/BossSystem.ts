import { GameEngine } from './GameEngine';
import { Bug, BossConfig } from './GameTypes';
import { GameConfig } from './GameConfig';
import { soundManager } from './SoundManager';

/**
 * BossSystem — handles all boss-specific ability logic.
 * Follows the same pattern as WaveManager: receives a GameEngine reference.
 */
export class BossSystem {
  engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Updates boss abilities and variant-specific logic each frame.
   * Called from GameEngine.updateBugs() for each boss bug.
   */
  update(bug: Bug, dt: number, timeScale: number) {
    if (bug.phase === undefined) {
      bug.phase = 1;
      bug.abilityTimer = 0;
      bug.isShielded = false;
    }
    bug.offsetTime += dt;
    bug.abilityTimer = (bug.abilityTimer || 0) + dt;
    const conf = GameConfig.bugs.boss;
    const hpPercent = bug.hp / bug.maxHp;

    // Phase Transitions
    if (bug.phase === 1 && hpPercent < 0.66) {
      bug.phase = 2;
      this.engine.shake(1.0, 30);
      soundManager.powerup('overdrive');
    } else if (bug.phase === 2 && hpPercent < 0.33) {
      bug.phase = 3;
      bug.isShielded = true;
      bug.abilityTimer = 0;
      this.engine.shake(1.5, 40);
      this.engine.renderer.chromaticOffset = 20;
    }

    // Ability 1: Minion Spawn
    if (bug.offsetTime > conf.attackRate) {
      bug.offsetTime = 0;
      this.engine.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 120);
      const spawnCount = bug.phase === 3 ? conf.minionSpawnCount * 1.5 : conf.minionSpawnCount;
      for (let j = 0; j < spawnCount; j++) {
        this.engine.waveManager.spawnSpecificMinion(bug.x, bug.y);
      }
    }

    // Ability 2: Barrier / Shield Loop
    if (bug.phase === 3 && !bug.isShielded && bug.abilityTimer > 10) {
      bug.isShielded = true;
      bug.abilityTimer = 0;
    }
    if (bug.phase === 3 && bug.isShielded && bug.abilityTimer > conf.shieldDuration) {
      bug.isShielded = false;
      bug.abilityTimer = 0;
    }

    // VARIANT SPECIFIC LOGIC
    if (bug.variantId === 'arachne') {
      this.updateArachne(bug, dt, timeScale);
    } else if (bug.variantId === 'moth') {
      this.updateMoth(bug, dt);
    } else if (bug.variantId === 'mandible') {
      this.updateMandible(bug);
    }

    // Global Barrage
    if (bug.phase >= 2 && bug.abilityTimer > conf.barrageRate) {
      bug.abilityTimer = 0;
      soundManager.bossAbility();
      for (let j = 0; j < conf.barrageCount; j++) {
        this.engine.hazards.push({
          id: `barrage_${this.engine.globalTime}_${j}`,
          x: Math.random() * this.engine.width,
          y: Math.random() * this.engine.height,
          radius: conf.barrageRadius,
          type: 'barrage',
          timer: 0,
          duration: conf.barrageWarningTime,
          active: true,
        });
      }
    }

    // Random glitch effects
    if (Math.random() < conf.glitchChance * dt) {
      this.engine.shake(0.3, 15);
      this.engine.renderer.isGlitching = true;
      this.engine.glitchTimer = 0.5;
    }
  }

  private updateArachne(bug: Bug, dt: number, timeScale: number) {
    bug.webTimer = (bug.webTimer || 0) + dt * timeScale;
    if (bug.webTimer > 4.0) {
      bug.webTimer = 0;
      this.engine.hazards.push({
        id: `web_${this.engine.globalTime}`,
        x: Math.random() * this.engine.width,
        y: Math.random() * this.engine.height,
        radius: 50,
        type: 'web',
        timer: 0,
        duration: 8.0,
        active: true,
      });
      soundManager.uiHover();
    }
  }

  private updateMoth(bug: Bug, dt: number) {
    if (Math.random() < 0.05 * dt * (bug.phase || 1)) {
      this.engine.controlDistortionTimer = 2.0;
      this.engine.renderer.isGlitching = true;
      this.engine.glitchTimer = 0.5;
    }
  }

  private updateMandible(bug: Bug) {
    const armored = Math.sin(this.engine.globalTime * Math.PI) > 0;
    bug.armor = armored ? 0.8 : 1.0;
  }
}
