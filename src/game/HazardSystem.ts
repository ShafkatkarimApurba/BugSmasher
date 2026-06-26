import { GameEngine } from './GameEngine';
import { Hazard } from './GameTypes';
import { GameConfig } from './GameConfig';
import { soundManager } from './SoundManager';

/**
 * HazardSystem — handles all hazard-related logic (barrages, webs, lava).
 * Follows the same pattern as WaveManager: receives a GameEngine reference.
 */
export class HazardSystem {
  engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Updates all active hazards each frame.
   * Checks expiration, player proximity, and applies cumulative effects.
   */
  update(dt: number) {
    let isInLava = false;
    let isInWeb = false;

    const centerX = this.engine.coreX;
    const centerY = this.engine.coreY;

    for (let i = this.engine.hazards.length - 1; i >= 0; i--) {
      const h = this.engine.hazards[i];
      h.timer += dt;

      if (h.timer >= h.duration) {
        this.trigger(h);
        this.engine.hazards.splice(i, 1);
        continue;
      }

      const dx = h.x - centerX;
      const dy = h.y - centerY;
      const distSq = dx * dx + dy * dy;
      const playerRadius = 20;
      const touchRadius = h.radius + playerRadius;
      const isTouchingPlayer = distSq < touchRadius * touchRadius;

      if (isTouchingPlayer) {
        if (h.type === 'lava') isInLava = true;
        else if (h.type === 'web') isInWeb = true;
      }
    }

    // Apply cumulative hazard effects
    if (isInLava && this.engine.shieldTimer <= 0) {
      this.engine.health -= dt * 8;
      if (Math.random() < 0.1) {
        this.engine.shake(0.1, 2);
        this.engine.renderer.impactFlash = Math.max(this.engine.renderer.impactFlash, 0.4);
      }
    }

    this.engine.hazardSlowdown = isInWeb ? 0.4 : 1.0;
  }

  /**
   * Triggers a hazard's effect when its timer expires.
   */
  private trigger(h: Hazard) {
    if (h.type === 'barrage') {
      this.engine.particleSystem.spawnExplosion(h.x, h.y, '#ff3300');
      this.engine.particleSystem.spawnShockwave(h.x, h.y, '#ff6600', h.radius * 2);
      soundManager.splat();

      const distSq =
        (h.x - this.engine.coreX) ** 2 + (h.y - this.engine.coreY) ** 2;
      const damageRadius = h.radius + 30;
      if (distSq < damageRadius * damageRadius && this.engine.shieldTimer <= 0) {
        this.engine.health -= GameConfig.player.hitDamage * 1.5;
        this.engine.renderer.impactFlash = 1.5;
        this.engine.shake(0.5, 25);
        soundManager.hitBase();
      }
    }
  }
}
