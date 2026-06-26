import { GameEngine } from './GameEngine';
import { Bug, ResourcePickup } from './GameTypes';
import { GameConfig } from './GameConfig';
import { soundManager } from './SoundManager';

/**
 * CollisionSystem — handles bug-core collision, dash push, and resource proximity.
 * Follows the same pattern as WaveManager: receives a GameEngine reference.
 */
export class CollisionSystem {
  engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Handles a bug reaching the core (within 30px).
   * Applies damage, impact effects, and streak-break logic.
   */
  handleBugImpact(bug: Bug, cx: number, cy: number) {
    if (this.engine.shieldTimer <= 0) {
      this.engine.health -= GameConfig.player.hitDamage;
      this.engine.renderer.impactFlash = 1.0;
      this.engine.lastHitTime = this.engine.globalTime;
      this.engine.streakCount = 0;
      this.engine.shake(
        0.3,
        10,
        -(bug.x - cx) / 100,
        -(bug.y - cy) / 100
      );
      this.engine.renderer.chromaticOffset = 15;
      this.engine.triggerHitStop(0.1);
      soundManager.hitBase();
    } else {
      this.engine.shake(0.2, 5);
      soundManager.splat();
    }
    this.engine.particleSystem.spawnExplosion(bug.x, bug.y, bug.color);
  }

  /**
   * Handles bug push and damage during a dash.
   */
  handleDashPush(dt: number) {
    if (this.engine.dashTimer <= 0) return;

    const pushRadiusSq = 120 * 120;
    for (const bug of this.engine.bugs) {
      const dx = bug.x - this.engine.coreX;
      const dy = bug.y - this.engine.coreY;
      const distSq = dx * dx + dy * dy;
      if (distSq < pushRadiusSq) {
        const dist = Math.sqrt(distSq) || 1;
        bug.x += (dx / dist) * 450 * dt;
        bug.y += (dy / dist) * 450 * dt;
        this.engine.damageBug(bug, 0.4);
      }
    }
  }
}
