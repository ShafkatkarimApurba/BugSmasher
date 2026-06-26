import { GameEngine } from './GameEngine';
import { Bug } from './GameTypes';
import { GameConfig } from './GameConfig';

export class WaveManager {
  engine: GameEngine;
  bugsToSpawn: number = 0;
  spawnTimer: number = 0;
  waveActive: boolean = false;
  intensity: number = 1;
  intensityTimer: number = 0;
  surgeActive: boolean = false;
  surgeTimer: number = 0;
  isBossWave: boolean = false;
  bossSpawned: boolean = false;
  bossWarningSounded: boolean = false;
  bossIntroActive: boolean = false;
  bossIntroTimer: number = 0;
  difficultySpeedMultiplier: number = 1;
  difficultyHpMultiplier: number = 1;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  startWave() {
    this.waveActive = true;
    const bossInterval = this.engine.challengeModifiers?.bossWaveInterval || 10;
    this.isBossWave = this.engine.gameModeConfig.bossEveryWave
      || (this.engine.wave % bossInterval === 0);
    this.bossSpawned = false;
    this.bossWarningSounded = false;
    this.bossIntroActive = this.isBossWave;
    this.bossIntroTimer = this.isBossWave ? 1.5 : 0; 
    
    this.updateBiome();

    if (this.isBossWave) {
      this.engine.renderer.waveTransition.triggerBossIncoming();
    } else {
      this.engine.renderer.waveTransition.triggerWaveStart(this.engine.wave);
    }
    this.engine.hitstop.triggerWaveTransition(this.engine.currentKillCombo || 0);

    if (this.isBossWave) {
        this.bugsToSpawn = 1 + Math.floor(this.engine.wave * 1.5); // Boss + minions
    } else {
        const perfBonus = Math.floor(this.engine.performanceFactor * 5);
        this.bugsToSpawn = GameConfig.waves.baseBugs + this.engine.wave * GameConfig.waves.bugsPerWave + perfBonus;
    }
    
    this.spawnTimer = 0;
    this.intensity = 1;
    this.intensityTimer = 0;
    this.surgeActive = false;
    this.surgeTimer = Math.random() * 5 + 5; 
    
    // Performance-adjusted surge frequency
    if (this.engine.performanceFactor > 1.8) {
        this.surgeTimer = 2.0; // Fast surge for power users
    }
  }

  private updateBiome() {
    const wave = this.engine.wave;
    const prestige = this.engine.prestigeLevel;
    const oldBiome = this.engine.currentBiome;
    
    if (prestige >= 3 && wave >= 30) this.engine.currentBiome = 'golden_spire';
    else if (wave >= 40) this.engine.currentBiome = 'void_abyss';
    else if (prestige >= 1 && wave >= 10) this.engine.currentBiome = 'golden_cache';
    else if (wave >= 25) this.engine.currentBiome = 'frostbyte';
    else if (wave >= 15) this.engine.currentBiome = 'ember_depths';
    else if (wave >= 5) this.engine.currentBiome = 'quantum_void';
    else this.engine.currentBiome = 'neon_core';

    if (oldBiome !== this.engine.currentBiome) {
        import('./SoundManager').then(({ soundManager }) => soundManager.playBiomeMusic(this.engine.currentBiome));
    }
  }

  update(dt: number) {
    if (!this.waveActive) return;

    if (this.bossIntroActive) {
        this.bossIntroTimer -= dt;
        if (this.bossIntroTimer <= 0) {
            this.bossIntroActive = false;
        }
        
        if (this.bossIntroTimer < 2.0 && !this.bossWarningSounded) {
             import('./SoundManager').then(({ soundManager }) => soundManager.bossWarning());
             this.bossWarningSounded = true;
        }
        return; // Don't spawn anything during intro
    }

    // Intensity pulses over time
    this.intensityTimer += dt;
    this.intensity = 1 + Math.sin(this.intensityTimer * 0.5) * 0.5;

    // Surges (Disabled during boss wave to keep focus on boss)
    if (!this.isBossWave) {
        this.surgeTimer -= dt;
        if (this.surgeTimer <= 0) {
            this.surgeActive = !this.surgeActive;
            this.surgeTimer = this.surgeActive ? (Math.random() * 3 + 2) : (Math.random() * 10 + 10);
        }
    } else {
        this.surgeActive = false;
    }

    if (this.bugsToSpawn > 0) {
      this.spawnTimer += dt;
      let spawnRate = Math.max(
        GameConfig.waves.minSpawnRate, 
        GameConfig.waves.baseSpawnRate - this.engine.wave * GameConfig.waves.spawnRateReduction
      );

      if (this.isBossWave) {
          spawnRate = 1.7; // Slower spawn rate for minions during boss
          if (!this.bossSpawned) {
              this.spawnBoss();
              this.bossSpawned = true;
              this.spawnTimer = -2.0; // Wait a bit after boss spawns
          }
      }

    // Apply intensity and surge multipliers
    spawnRate /= (this.intensity * (this.surgeActive ? (1 + this.engine.performanceFactor) : 1));
    
    if (this.spawnTimer > spawnRate) {
      this.spawnTimer = 0;
      // Group sizes scale with performance
      const baseGroup = this.surgeActive ? 2 : 1;
      const perfBonus = this.engine.performanceFactor > 1.5 ? 1 : 0;
      const groupSize = baseGroup + perfBonus;
      
      for (let i = 0; i < groupSize; i++) {
        if (this.bugsToSpawn > 0) this.spawnBug();
      }
    }
    } else if (this.engine.bugs.length === 0) {
      this.engine.renderer.waveTransition.triggerWaveComplete();
      this.waveActive = false;
      this.engine.wave++;
      const mode = this.engine.gameModeConfig;
      if (mode.endlessWaves) {
        this.engine.onWaveComplete?.();
        this.startWave();
      } else {
        this.engine.stop();
        this.engine.onWaveComplete?.();
      }
    }
  }

  private spawnBoss() {
    this.bugsToSpawn--;
    const bug = this.createBug('boss', this.engine.wave);
    
    // Assign a random boss variant
    if (GameConfig.bugs.boss.variants) {
      const variantIdx = Math.floor(Math.random() * GameConfig.bugs.boss.variants.length);
      const variant = GameConfig.bugs.boss.variants[variantIdx];
      bug.variantId = variant.id;
      bug.color = variant.color;
    }

    this.engine.bugs.push(bug);
    if (!this.bossWarningSounded) {
        import('./SoundManager').then(({ soundManager }) => soundManager.bossWarning());
        this.bossWarningSounded = true;
    }
  }

  /** Internal for unit tests (per M4 any removal); not for production use. */
  spawnBug() {
    if (this.bugsToSpawn <= 0) return;
    this.bugsToSpawn--;
    
    this.engine.bugs.push(this.createBug(this.decideType(this.engine.wave), this.engine.wave));
  }

  public spawnSpecificMinion(x: number, y: number) {
      const type = Math.random() > 0.5 ? 'mini' : 'scout';
      const bug = this.createBug(type, this.engine.wave);
      bug.x = x;
      bug.y = y;
      this.engine.bugs.push(bug);
      this.engine.particleSystem.spawnShockwave(x, y, '#ff0000', 40);
  }

  private decideType(wave: number): string {
    const biome = this.engine.currentBiome;
    const r = Math.random();
    
    if (wave < 3) return 'basic';
    
    // Biome specific weighting
    if (biome === 'quantum_void' && r < 0.3) return 'phase';
    if (biome === 'ember_depths' && r < 0.4) return 'tank';
    if (biome === 'ember_depths' && r < 0.2) return 'ember';
    if (biome === 'frostbyte' && r < 0.4) return 'scout';
    if (biome === 'frostbyte' && r < 0.2) return 'frost';
    if (biome === 'void_abyss' && r < 0.4) return 'ghost';
    if (biome === 'void_abyss' && r < 0.2) return 'phase';
    
    // Special units chance
    const healerWeight = this.engine.challengeModifiers?.healerSpawnMultiplier || 1;
    if (wave > 8 && r < 0.05 * healerWeight) return 'healer';

    const types = ['basic', 'scout', 'tank', 'swarmer', 'ghost', 'phase', 'ember', 'frost'];
    if (wave < 6) return r < 0.6 ? 'basic' : (r < 0.8 ? 'scout' : 'swarmer');
    // Challenge modifier: tank_wave increases tank spawn rate
    const tankWeight = this.engine.challengeModifiers?.tankSpawnMultiplier || 1;

    if (wave < 12) {
        if (r < 0.3) return 'basic';
        if (r < 0.5) return 'scout';
        if (r < 0.7) return 'swarmer';
        if (r < 0.7 + 0.2 * tankWeight) return 'tank';
        return 'ghost';
    }
    
    // Late game mix
    const idx = Math.floor(Math.random() * types.length);
    return types[idx];
  }

  private createBug(typeName: string, wave: number): Bug {
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    const margin = 100;
    if (edge === 0) { x = Math.random() * this.engine.width; y = -margin; }
    else if (edge === 1) { x = this.engine.width + margin; y = Math.random() * this.engine.height; }
    else if (edge === 2) { x = Math.random() * this.engine.width; y = this.engine.height + margin; }
    else { x = -margin; y = Math.random() * this.engine.height; }

    const conf = GameConfig.bugs[typeName as keyof typeof GameConfig.bugs];
    
    // Scale stats by both Wave and Performance
    const scaling = 1 + (wave * 0.05) + (this.engine.performanceFactor - 1.0);
    const hp = Math.floor(
      (conf.baseHp + Math.floor(wave * conf.hpPerWave)) *
        (1 + (this.engine.performanceFactor - 1) * 0.5) *
        this.difficultyHpMultiplier
    );
    const speed =
      (conf.baseSpeed + wave * conf.speedPerWave) *
      (1 + (this.engine.performanceFactor - 1) * 0.2) *
      this.difficultySpeedMultiplier;

    return {
      id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      active: true,
      x, y,
      type: typeName,
      speed: speed,
      color: conf.color,
      size: conf.size,
      scoreValue: Math.floor(conf.score * this.engine.performanceFactor),
      hp: hp,
      maxHp: hp,
      walkCycle: Math.random() * Math.PI * 2,
      rotation: 0,
      offsetTime: Math.random() * 100,
      hitTimer: 0
    };
  }
}
