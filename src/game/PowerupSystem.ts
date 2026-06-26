import { GameEngine } from './GameEngine';
import { Powerup } from './GameTypes';
import { GameConfig } from './GameConfig';
import { ProgressionManager } from './ProgressionManager';
import { StatsManager } from './StatsManager';
import { RESOURCES, ResourceType } from './ResourceTypes';
import { soundManager } from './SoundManager';

/**
 * PowerupSystem — handles all powerup and resource logic.
 * Follows the same pattern as WaveManager: receives a GameEngine reference.
 */
export class PowerupSystem {
  engine: GameEngine;
  dropBonusMultiplier: number = 1;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Spawns a powerup at the given position (with optional force).
   */
  spawn(x: number, y: number, force: boolean = false) {
    let dropChance = GameConfig.powerups.dropChance * this.dropBonusMultiplier;
    if (this.engine.wave >= 4) {
      dropChance += Math.min(0.20, (this.engine.wave - 3) * 0.05);
    }

    // Challenge modifier: scrap_hunger reduces drop rate
    if (this.engine.challengeModifiers) {
      dropChance *= this.engine.challengeModifiers.resourceDropMultiplier;
    }

    // Challenge modifier: no_shield removes shield powerups
    const types = this.engine.challengeModifiers?.shieldPowerupsDisabled
      ? GameConfig.powerups.types.filter(t => t.type !== 'shield')
      : GameConfig.powerups.types;

    if (!force && Math.random() > dropChance) return;
    if (types.length === 0) return;

    const pType = types[Math.floor(Math.random() * types.length)];

    this.engine.powerups.push({
      active: true,
      x,
      y,
      type: pType.type,
      color: pType.color,
      icon: pType.icon,
      life: GameConfig.powerups.life,
      maxLife: GameConfig.powerups.life,
      size: 15,
      collection: pType.collection,
    });
  }

  /**
   * Spawns a resource pickup when a bug is killed.
   */
  spawnResource(x: number, y: number, bugType: string) {
    let type: ResourceType = 'scrap';
    let count = 1;

    switch (bugType) {
      case 'basic':
        type = 'scrap';
        count = 1 + ProgressionManager.getSkillBonus('scavenger_protocol');
        break;
      case 'scout':
        type = 'plasma';
        break;
      case 'tank':
        type = 'alloy';
        break;
      case 'ghost':
        type = 'flux';
        break;
      case 'boss':
        type = 'neural_core';
        count = 1;
        break;
      case 'swarmer':
        type = 'plasma';
        break;
      case 'mini':
        type = 'scrap';
        count = 1;
        break;
      default:
        type = 'scrap';
    }

    if (Math.random() < 0.1 && (bugType === 'tank' || bugType === 'swarmer')) {
      type = 'plasma';
    }

    for (let i = 0; i < count; i++) {
      const res = RESOURCES[type];
      this.engine.resources.push({
        active: true,
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        type: type,
        color: res.color,
        life: 20,
        maxLife: 20,
        size: 8,
      });
    }
  }

  /**
   * Activates a powerup by type. Returns true if the powerup was handled.
   * Called from GameEngine (which is called by InputSystem on collection).
   */
  activate(type: string, px?: number, py?: number) {
    this.engine.renderer.powerupAlpha = 1.0;
    this.engine.totalPowerupsCollected++;
    StatsManager.updateStats({ totalPowerupsCollected: 1 });
    soundManager.powerup(type);
    this.engine.particleSystem.spawnShockwave(
      this.engine.coreX,
      this.engine.coreY,
      '#ffffff',
      300
    );

    // Wave 4+ collection shockwave blaster
    if (this.engine.wave >= 4 && px !== undefined && py !== undefined) {
      this.engine.particleSystem.spawnShockwave(px, py, '#ffffff', 140);
      this.engine.particleSystem.spawnShockwave(px, py, '#ffaa00', 100);

      const DAMAGE_RADIUS_SQ = 140 * 140;
      for (const bug of this.engine.bugs) {
        const dx = bug.x - px;
        const dy = bug.y - py;
        if (dx * dx + dy * dy < DAMAGE_RADIUS_SQ) {
          this.engine.damageBug(bug, 1.5);
        }
      }
    }

    switch (type) {
      case 'shield':
        this.engine.shieldTimer = GameConfig.powerups.duration;
        break;
      case 'multiplier':
        this.engine.multiplierTimer = GameConfig.powerups.duration;
        break;
      case 'rapid_fire':
        this.engine.rapidFireTimer = GameConfig.powerups.duration;
        break;
      case 'slow_mo':
        this.engine.slowMoTimer = GameConfig.powerups.duration;
        break;
      case 'freeze':
        this.engine.freezeTimer = GameConfig.powerups.duration;
        break;
      case 'magnet':
        this.engine.magnetTimer = GameConfig.powerups.duration;
        break;
      case 'spike_burst':
        this.engine.spikeBurstTimer = GameConfig.powerups.duration;
        break;
      case 'nuke': {
        this.engine.renderer.clickFlash = 1.0;
        soundManager.nuke();
        this.engine.shake(1.5, 40, 0, 1);
        this.engine.renderer.chromaticOffset = 30;
        this.engine.triggerHitStop(0.15);
        this.engine.particleSystem.spawnShockwave(
          this.engine.coreX,
          this.engine.coreY,
          '#ffaa00',
          1000
        );
        this.engine.impactFrame = 1.0;
        for (let i = this.engine.bugs.length - 1; i >= 0; i--) {
          this.engine.damageBug(this.engine.bugs[i], 9999);
        }
        break;
      }
      case 'overdrive':
        this.engine.overdriveTimer = GameConfig.powerups.duration;
        break;
      case 'repair_cell': {
        this.engine.health = Math.min(
          this.engine.maxHealth,
          this.engine.health + 15
        );
        this.engine.particleSystem.spawnShockwave(
          px !== undefined ? px : this.engine.coreX,
          py !== undefined ? py : this.engine.coreY,
          '#00ffaa',
          180
        );
        this.engine.rapidFireTimer = 10;
        this.engine.isOverheated = false;
        this.engine.weaponHeat = 0;
        soundManager.skillUpgrade();
        break;
      }
    }
  }

  /**
   * Updates powerup timers (life/decay) and magnet attraction each frame.
   */
  updatePowerups(dt: number) {
    for (let i = this.engine.powerups.length - 1; i >= 0; i--) {
      const p = this.engine.powerups[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.engine.powerups.splice(i, 1);
        continue;
      }
      if (this.engine.magnetTimer > 0) {
        const dx = this.engine.coreX - p.x;
        const dy = this.engine.coreY - p.y;
        const distSq = dx * dx + dy * dy;
        const d = Math.sqrt(distSq);
        p.x += (dx / d) * 400 * dt;
        p.y += (dy / d) * 400 * dt;
      }
    }
  }

  /**
   * Updates resource pickups (life, movement toward core, collection).
   */
  updateResources(dt: number) {
    for (let i = this.engine.resources.length - 1; i >= 0; i--) {
      const r = this.engine.resources[i];
      if (!r.active) continue;
      r.life -= dt;
      if (r.life <= 0) r.active = false;

      const dx = r.x - this.engine.coreX;
      const dy = r.y - this.engine.coreY;
      const distSq = dx * dx + dy * dy;

      if (distSq < 40000 || this.engine.magnetTimer > 0) {
        const dist = Math.sqrt(distSq);
        const factor = this.engine.magnetTimer > 0 ? 1 : 1 - dist / 200;
        const angle = Math.atan2(dy, dx);
        r.x -= Math.cos(angle) * 500 * factor * dt;
        r.y -= Math.sin(angle) * 500 * factor * dt;
      }

      if (distSq < 900) {
        ProgressionManager.addResource(r.type, 1);
        r.active = false;
        soundManager.resource(r.type);
      }
    }
  }
}
