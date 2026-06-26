import { soundManager } from './SoundManager';
import { GameConfig } from './GameConfig';
import { Renderer } from './Renderer';
import { ParticleSystem } from './ParticleSystem';
import { WaveManager } from './WaveManager';
import { GameSaveData } from './SaveManager';
import { StatsManager } from './StatsManager';
import { ProgressionManager } from './ProgressionManager';
import { InputSystem } from './InputSystem';
import { Bug, Hazard, Powerup, ResourcePickup } from './GameTypes';
import { CollisionSystem } from './CollisionSystem';
import { BossSystem } from './BossSystem';
import { PowerupSystem } from './PowerupSystem';
import { HazardSystem } from './HazardSystem';
import { HitstopSystem } from './HitstopSystem';
import { ParticleTrailSystem } from './ParticleTrailSystem';
import { computeModifierState, type ChallengeModifierId, type ChallengeModifierState } from './DailyChallengeManager';
import { GameEngineStatusBus } from './GameEngineStatusBus';
import {
  loadAccessibilitySettings,
  DIFFICULTY_PRESETS,
  subscribeAccessibility,
  type AccessibilitySettings,
} from './AccessibilitySettings';
import { getGameModeConfig, type GameModeId, type GameModeConfig } from './GameMode';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number = 1;
  isMobile: boolean = false;
  highFidelityVFX: boolean = true;

  bugs: Bug[] = [];
  hazards: Hazard[] = [];

  particleSystem: ParticleSystem;
  waveManager: WaveManager;
  hitstop!: HitstopSystem;
  trailSystem!: ParticleTrailSystem;

  private killCombo: number = 0;
  private killComboTimer: number = 0;
  private readonly KILL_COMBO_TIMEOUT: number = 2.0; // seconds
  private registeredBugTrails = new Set<string>();

  /** Public read for systems that need combo level (e.g. wave transitions, hitstop) without any-casts */
  get currentKillCombo(): number {
    return this.killCombo;
  }

  // Extracted Systems
  collisionSystem: CollisionSystem;
  bossSystem: BossSystem;
  powerupSystem: PowerupSystem;
  hazardSystem: HazardSystem;

  powerups: Powerup[] = [];
  resources: ResourcePickup[] = [];

  score: number = 0;
  health: number = GameConfig.player.maxHealth;
  maxHealth: number = GameConfig.player.maxHealth;
  wave: number = 1;

  lastTime: number = 0;
  globalTime: number = 0;
  animationFrameId: number = 0;

  shakeTime: number = 0;
  shakeMagnitude: number = 0;
  shakeX: number = 0;
  shakeY: number = 0;

  hitStopTimer: number = 0;

  isRunning: boolean = false;
  isPaused: boolean = false;

  currentBiome: string = 'neon_core';
  prestigeLevel: number = 0;

  // Upgrades
  clickRadiusMultiplier: number = 1;
  autoTurretLevel: number = 0;
  healthLevel: number = 0;
  radiusLevel: number = 0;

  damageMultiplier: number = 1.0;

  clickCooldown: number = 0;
  weaponHeat: number = 0;
  isOverheated: boolean = false;

  // Powerups (timers maintained here for external access)
  shieldTimer: number = 0;
  multiplierTimer: number = 0;
  rapidFireTimer: number = 0;
  autoTurretTimer: number = 0;
  slowMoTimer: number = 0;
  overdriveTimer: number = 0;
  freezeTimer: number = 0;
  magnetTimer: number = 0;
  spikeBurstTimer: number = 0;
  controlDistortionTimer: number = 0;
  hazardSlowdown: number = 1.0;

  // Session Stats for Achievements
  swarmerKills: number = 0;
  healerKills: number = 0;
  killsInSubwave: number = 0;
  missedClicksInSubwave: number = 0;

  // Performance Scaling Metrics
  streakCount: number = 0;
  streakTimer: number = 0;
  lastHitTime: number = 0;
  performanceFactor: number = 1.0;

  playTimeAccumulator: number = 0;
  accessibility: AccessibilitySettings = loadAccessibilitySettings();
  private unsubscribeAccessibility?: () => void;
  gameMode: GameModeId = 'standard';
  gameModeConfig: GameModeConfig = getGameModeConfig('standard');

  baseScale: number = 1.0;
  baseRecoil: number = 0;
  baseRecoilAngle: number = 0;

  glitchTimer: number = 0;
  upgradeFlash: number = 0;
  impactFrame: number = 0;

  // Core Position
  coreX: number = 0;
  coreY: number = 0;

  // Dash Mechanics
  dashTimer: number = 0;
  dashCooldownTimer: number = 0;
  readonly dashDuration: number = 0.15;
  readonly dashCooldown: number = 3.0;
  readonly dashDistance: number = 180;
  dashStartX: number = 0;
  dashStartY: number = 0;
  dashTargetX: number = 0;
  dashTargetY: number = 0;

  // Tutorial tracking
  totalKills: number = 0;
  totalPowerupsCollected: number = 0;
  forceNextPowerup: boolean = false;

  // Challenge Mode
  isChallengeMode: boolean = false;
  challengeModifiers: ChallengeModifierState | null = null;
  challengeBugSpeedBonus: number = 0; // For speed_demon modifier

  renderer: Renderer;
  inputSystem: InputSystem;

  onGameOver?: (score: number) => void;
  onWaveComplete?: () => void;
  onStoryTrigger?: (type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige', value: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.handleVfxSettingsChange = this.handleVfxSettingsChange.bind(this);
    window.addEventListener('nexus_vfx_settings_changed', this.handleVfxSettingsChange);

    this.handleHzSettingsChange = this.handleHzSettingsChange.bind(this);
    window.addEventListener('nexus_target_hz_changed', this.handleHzSettingsChange);

    this.syncVfxSettings();
    this.handleResize();

    this.particleSystem = new ParticleSystem();
    this.particleSystem.engine = this;
    this.waveManager = new WaveManager(this);
    this.renderer = new Renderer(this);
    if (typeof window !== 'undefined') {
      const savedHz = localStorage.getItem('nexus_target_hz');
      if (savedHz) {
        const hz = parseInt(savedHz, 10);
        if (this.renderer && (this.renderer as any).scaler) {
          (this.renderer as any).scaler.targetFps = hz;
          (this.renderer as any).scaler.currentFps = hz;
        }
      }
    }
    this.inputSystem = new InputSystem(this);

    // Initialize extracted systems
    this.collisionSystem = new CollisionSystem(this);
    this.bossSystem = new BossSystem(this);
    this.powerupSystem = new PowerupSystem(this);
    this.hazardSystem = new HazardSystem(this);

    this.hitstop = new HitstopSystem();
    this.hitstop.applyPreset(this.getQualityPreset());

    this.trailSystem = new ParticleTrailSystem();
    this.trailSystem.applyPreset(this.getQualityPreset());

    // Wire hitstop callbacks
    this.hitstop.onHitstopStart = (intensity) => {
      soundManager.playHitstop(intensity);
    };

    this.applyAccessibility();
    this.unsubscribeAccessibility = subscribeAccessibility((settings) => {
      this.accessibility = settings;
      this.applyAccessibility();
    });
  }

  setGameMode(mode: GameModeId): void {
    this.gameMode = mode;
    this.gameModeConfig = getGameModeConfig(mode);
  }

  applyAccessibility(): void {
    const preset = DIFFICULTY_PRESETS[this.accessibility.difficulty];
    const baseMax = GameConfig.player.maxHealth * preset.playerMaxHealth;
    this.maxHealth = baseMax;
    if (!this.isRunning) {
      this.health = this.maxHealth;
    }
    if (this.waveManager) {
      this.waveManager.difficultySpeedMultiplier = preset.enemySpeed;
      this.waveManager.difficultyHpMultiplier = preset.enemyHp;
    }
    if (this.powerupSystem) {
      this.powerupSystem.dropBonusMultiplier = preset.dropBonus;
    }
  }

  syncVfxSettings() {
    this.isMobile = (window.innerWidth < 768) ||
      (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      ('ontouchstart' in window);

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_high_fidelity_vfx');
      if (saved !== null) {
        this.highFidelityVFX = saved === 'true';
        return;
      }
    }
    this.highFidelityVFX = !this.isMobile;
  }

  private getQualityPreset(): 'ultra' | 'high' | 'balanced' | 'mobile' {
    if (this.isMobile) return 'mobile';
    if (this.dpr >= 2 && !this.isMobile) return 'high';
    return 'balanced';
  }

  handleVfxSettingsChange() {
    this.syncVfxSettings();
    this.handleResize();
  }

  handleHzSettingsChange(e: Event) {
    const customEvent = e as CustomEvent<number>;
    if (this.renderer && (this.renderer as any).scaler) {
      (this.renderer as any).scaler.targetFps = customEvent.detail;
      (this.renderer as any).scaler.currentFps = customEvent.detail;
    }
  }

  handleResize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.syncVfxSettings();
      let maxDpr = this.isMobile ? GameConfig.canvas.mobileDprCap : GameConfig.canvas.desktopDprCap;
      if (!this.highFidelityVFX) {
        maxDpr = 1.0;
      }
      this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      const clientWidth = parent.clientWidth || window.innerWidth;
      const clientHeight = parent.clientHeight || window.innerHeight;

      this.canvas.width = clientWidth * this.dpr;
      this.canvas.height = clientHeight * this.dpr;
      this.canvas.style.width = `${clientWidth}px`;
      this.canvas.style.height = `${clientHeight}px`;

      this.ctx.scale(this.dpr, this.dpr);

      const oldWidth = this.width || clientWidth;
      const oldHeight = this.height || clientHeight;
      this.width = clientWidth;
      this.height = clientHeight;

      if (this.coreX === 0 || this.coreY === 0) {
        this.coreX = this.width / 2;
        this.coreY = this.height / 2;
      } else {
        this.coreX = (this.coreX / oldWidth) * this.width;
        this.coreY = (this.coreY / oldHeight) * this.height;
      }
    }
  }

  start() {
    if (this.isRunning) return;
    soundManager.init();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.globalTime = 0;
    this.score = 0;
    this.coreX = this.width / 2;
    this.coreY = this.height / 2;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.syncSkills();
    this.applyAccessibility();
    this.health = this.maxHealth;
    this.wave = 1;
    this.resetEntities();

    this.inputSystem.startGamepadPolling();
    this.startWave();
    this.loop(this.lastTime);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      return;
    }
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.startWave();
    this.loop(this.lastTime);
  }

  resetEntities() {
    this.bugs = [];
    this.hazards = [];
    this.particleSystem.reset();
    this.powerups = [];
    this.weaponHeat = 0;
    this.isOverheated = false;

    if (this.hitstop) this.hitstop.reset();
    if (this.trailSystem) this.trailSystem.reset();
    this.killCombo = 0;
    this.killComboTimer = 0;
  }

  startWave() {
    this.waveManager.startWave();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.inputSystem.stopGamepadPolling();
    GameEngineStatusBus.publish(null);
    GameEngineStatusBus.syncLegacyWindowGlobal(null);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('nexus_vfx_settings_changed', this.handleVfxSettingsChange);
    this.inputSystem.destroy();
    this.unsubscribeAccessibility?.();
  }

  shake(duration: number, magnitude: number, dx: number = 0, dy: number = 0) {
    this.shakeTime = duration;
    this.shakeMagnitude = magnitude;
    this.shakeX = dx;
    this.shakeY = dy;
  }

  triggerHitStop(duration: number) {
    this.hitStopTimer = duration;
  }

  get threatShakeIntensity(): number {
    const bugCount = this.bugs.length;
    return Math.min(3.5, bugCount * 0.12);
  }

  loop(currentTime: number) {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    const status = {
      health: this.health,
      maxHealth: this.maxHealth,
      currentBiome: this.currentBiome,
      intensity: this.waveManager ? this.waveManager.intensity : 1,
      performanceFactor: this.performanceFactor || 1.0,
      weaponHeat: this.weaponHeat,
      isOverheated: this.isOverheated,
      dashCooldownTimer: this.dashCooldownTimer,
      dashCooldown: this.dashCooldown,
      rapidFireTimer: this.rapidFireTimer,
      spikeBurstTimer: this.spikeBurstTimer,
    };
    GameEngineStatusBus.publish(status);
    GameEngineStatusBus.syncLegacyWindowGlobal(status);

    if (this.isPaused) {
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
      return;
    }

    this.globalTime += dt;

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
      return;
    }

    this.update(dt);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  /** Delegates to PowerupSystem. */
  spawnPowerup(x: number, y: number, force: boolean = false) {
    this.powerupSystem.spawn(x, y, force);
  }

  /** Delegates to PowerupSystem. */
  spawnResource(x: number, y: number, bugType: string) {
    this.powerupSystem.spawnResource(x, y, bugType);
  }

  private musicUpdateTimer: number = 0;

  update(dt: number) {
    const rawDt = dt;
    const scaledDt = this.hitstop.update(rawDt);

    // Sync current PerformanceScaler quality settings to hitstop and trailSystem
    const currentPreset = this.renderer.isLowEnd ? 'mobile' : this.getQualityPreset();
    this.hitstop.applyPreset(currentPreset);
    this.trailSystem.applyPreset(currentPreset);

    // Update trail system and visual pipeline using raw unscaled delta-time
    this.trailSystem.update();
    this.renderer.updateVisuals(rawDt);

    if (scaledDt <= 0.001) {
      this.globalTime += rawDt; // Time still advances for visual effects
      return; // Skip game logic during freeze
    }

    if (this.health <= 0) {
      this.isRunning = false;
      this.onGameOver?.(this.score);
      return;
    }

    // Update speed_demon modifier: bug speed increases per kill
    if (this.challengeModifiers?.speedDemonActive && this.totalKills > 0) {
      this.challengeBugSpeedBonus = Math.min(
        this.challengeModifiers.speedDemonMax,
        this.totalKills * this.challengeModifiers.speedDemonPerKill
      );
    }

    // Update combo timer
    if (this.killComboTimer > 0) {
      this.killComboTimer -= scaledDt;
      if (this.killComboTimer <= 0) {
        this.killCombo = 0;
      }
    }

    // Core Logic Systems
    this.updateTimers(scaledDt);
    this.updateCorePhysics(scaledDt);
    this.updateMetrics(scaledDt);
    this.waveManager.update(scaledDt);

    // Entity Systems
    this.updateTurrets(scaledDt);
    this.updateBugs(scaledDt);
    this.hazardSystem.update(scaledDt);

    // Environmental Systems
    this.particleSystem.update(scaledDt);
    this.powerupSystem.updatePowerups(scaledDt);
    this.powerupSystem.updateResources(scaledDt);

    // Adaptive Music State Sync (every 500ms)
    this.musicUpdateTimer += scaledDt;
    if (this.musicUpdateTimer >= 0.5) {
      this.musicUpdateTimer = 0;
      soundManager.updateGameState({
        intensity: this.performanceFactor,
        healthPercent: this.health / this.maxHealth,
        isBossWave: this.waveManager.isBossWave,
      });
    }
  }

  fireAutoTurret(isRapidFire: boolean = false) {
    let closest = null;
    let minHealth = Infinity;
    let minDistSq = Infinity;
    const cx = this.coreX;
    const cy = this.coreY;

    for (let i = 0; i < this.bugs.length; i++) {
      const bug = this.bugs[i];
      const dx = bug.x - cx;
      const dy = bug.y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = bug;
      }
    }

    if (closest) {
      soundManager.shoot();
      this.renderer.fireAlpha = 1.0;
      this.renderer.clickFlash = 0.3;
      this.particleSystem.spawnMuzzleFlash(cx, cy, 30);

      this.baseScale = 1.1;
      this.baseRecoil = 5;
      this.baseRecoilAngle = Math.atan2(closest.y - cy, closest.x - cx);

      if (isRapidFire) {
        this.shake(0.05, 3);
        this.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#ff00ff', 4);
      } else {
        this.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#00ffcc', 2);
      }
      this.damageBug(closest, 1);
    }
  }

  triggerUpgradeEffect() {
    this.upgradeFlash = 1.0;
    this.shake(0.2, 10);
    this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#00ffff', 400);
    soundManager.skillUpgrade();
  }

  damageBug(bug: Bug, amount: number) {
    let finalAmount = amount * this.damageMultiplier;

    let isCrit = false;
    // Boss Vulnerability Strategy: Core Exposure
    if (bug.type === 'boss') {
      if (bug.isShielded) {
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#00ffff', 40);
        soundManager.uiError();
        return;
      }
      soundManager.bossHit();
      const pulse = Math.sin(this.globalTime * 10);
      if (pulse > 0.8) {
        isCrit = true;
        finalAmount *= 2;
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 60);
        this.triggerHitStop(0.05);
        this.renderer.chromaticOffset = 10;
      } else if (pulse < -0.8) {
        finalAmount *= 0.5;
      }
    } else {
      const critChance = 0.05 + ProgressionManager.getSkillBonus('crit_hit');
      if (Math.random() < critChance) {
        isCrit = true;
        finalAmount *= 2.0;
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffd700', 80);
        this.renderer.chromaticOffset = 12;
      }
    }

    if (isCrit && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_crit_hit'));
    }

    if (bug.armor && bug.armor < 1.0 && bug.armor > 0) {
      finalAmount *= bug.armor;
    }

    bug.hp -= finalAmount;
    bug.hitTimer = 0.1;

    if (finalAmount >= 1) {
      this.triggerHitStop(0.05);
      this.shake(0.05, 2);
    }

    if (bug.hp <= 0) {
      this.killBug(bug);
    } else {
      soundManager.shoot();
      this.particleSystem.spawnGibs(bug.x, bug.y, bug.color, 3);
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 30);
    }
  }

  private killBug(bug: Bug) {
    const idx = this.bugs.indexOf(bug);
    if (idx < 0) return;

    if (bug.type === 'swarmer') this.swarmerKills++;
    if (bug.type === 'healer') this.healerKills++;
    this.killsInSubwave++;

    this.totalKills++;
    this.streakCount++;
    this.streakTimer = 2.0;

    const isBossKill = bug.type === 'boss';

    StatsManager.updateStats({ totalBugsKilled: 1, bossesKilled: isBossKill ? 1 : 0 });

    const mult = this.multiplierTimer > 0 ? 2 : 1;
    this.score += bug.scoreValue * mult;

    this.killCombo++;
    this.killComboTimer = this.KILL_COMBO_TIMEOUT;

    // Trigger hitstop
    const isElite = bug.type === 'elite' || bug.type === 'boss' || bug.type === 'tank' || bug.type === 'healer';
    this.hitstop.triggerKill(this.killCombo, isElite);

    // Enhanced kill visual effect
    this.renderer.triggerKillEffect(bug.x, bug.y, isElite, this.killCombo);

    // Register combo with combo visual system
    this.renderer.comboVisual.registerKill(bug.x, bug.y, bug.scoreValue);

    soundManager.splat();

    this.triggerHitStop(0.04);

    const isBoss = bug.type === 'boss';
    const intensity = isBoss ? 4.0 : ((bug.type === 'tank' || bug.type === 'swarmer') ? 1.4 : (bug.type === 'scout' ? 0.7 : 0.9));
    this.shake(isBoss ? 0.6 : 0.15 * intensity, isBoss ? 40 : 8 * intensity);

    this.particleSystem.spawnSplatter(bug.x, bug.y, bug.color);
    this.particleSystem.spawnExplosion(bug.x, bug.y, bug.color);

    this.spawnResource(bug.x, bug.y, bug.type);

    if (isBoss) {
      soundManager.bossDeath();
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#ff0000', 800);

      this.onStoryTrigger?.('boss_kill', this.wave);

      const dx = (bug.x - this.coreX) / (this.width / 2);
      const dy = (bug.y - this.coreY) / (this.height / 2);
      this.shake(1.5, 60, dx, dy);
      this.triggerHitStop(0.2);
      this.renderer.chromaticOffset = 40;
      this.impactFrame = 1.0;

      for (let i = 0; i < 3; i++) {
        this.spawnPowerup(bug.x + (Math.random() - 0.5) * 50, bug.y + (Math.random() - 0.5) * 50, true);
      }

      for (let i = 0; i < 40; i++) {
        this.particleSystem.spawnParticle(bug.x, bug.y, bug.color);
      }
    }

    // Swarmer splitting logic
    if (bug.type === 'swarmer' || this.currentBiome === 'golden_cache') {
      const splitCount = this.currentBiome === 'golden_cache' ? 2 : 3;
      for (let i = 0; i < splitCount; i++) {
        const angle = (Math.PI * 2 / splitCount) * i;
        const dist = 20;
        const miniConf = GameConfig.bugs.mini;
        this.bugs.push({
          id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`,
          active: true,
          x: bug.x + Math.cos(angle) * dist,
          y: bug.y + Math.sin(angle) * dist,
          type: 'mini',
          speed: miniConf.baseSpeed + (this.wave * miniConf.speedPerWave),
          color: miniConf.color,
          size: miniConf.size,
          scoreValue: miniConf.score,
          hp: miniConf.baseHp,
          maxHp: miniConf.baseHp,
          walkCycle: Math.random() * 10,
          rotation: 0,
          offsetTime: Math.random() * 100,
          hitTimer: 0,
        });
      }
    }

    if (this.forceNextPowerup) {
      this.forceNextPowerup = false;
      this.spawnPowerup(bug.x, bug.y, true);
    } else {
      this.spawnPowerup(bug.x, bug.y);
    }

    const trailId = `bug_${bug.id}`;
    this.trailSystem.deactivateTrail(trailId);
    this.registeredBugTrails.delete(trailId);

    this.bugs.splice(idx, 1);
  }

  draw() {
    this.renderer.draw();
  }

  /** Delegates to PowerupSystem. */
  activatePowerup(type: string, px?: number, py?: number) {
    this.powerupSystem.activate(type, px, py);
  }

  exportState(): GameSaveData {
    return {
      score: this.score,
      wave: this.wave,
      health: this.health,
      maxHealth: this.maxHealth,
      clickRadiusMultiplier: this.clickRadiusMultiplier,
      autoTurretLevel: this.autoTurretLevel,
      healthLevel: this.healthLevel,
      radiusLevel: this.radiusLevel,
      timestamp: Date.now(),
    };
  }

  importState(data: GameSaveData) {
    this.score = data.score;
    this.wave = data.wave;
    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.clickRadiusMultiplier = data.clickRadiusMultiplier;
    this.autoTurretLevel = data.autoTurretLevel || 0;
    this.healthLevel = data.healthLevel || 0;
    this.radiusLevel = data.radiusLevel || 0;

    this.resetEntities();
    this.waveManager.waveActive = false;
  }

  syncSkills() {
    const data = ProgressionManager.getData();
    this.maxHealth = GameConfig.player.maxHealth + ProgressionManager.getSkillBonus('hardened_hull');
    this.clickRadiusMultiplier = 1 + ProgressionManager.getSkillBonus('amplified_pulse');
    this.damageMultiplier = 1 + ProgressionManager.getSkillBonus('kinetic_amplifier');
    this.prestigeLevel = data.prestigeLevel;

    // Apply challenge modifier overrides
    if (this.challengeModifiers) {
      this.maxHealth *= this.challengeModifiers.maxHealthMultiplier;
      this.damageMultiplier *= this.challengeModifiers.playerDamageMultiplier;
    }
  }

  /** Configure challenge modifiers for this run. */
  setChallengeModifiers(modifiers: ChallengeModifierId[]) {
    this.isChallengeMode = true;
    this.challengeModifiers = computeModifierState(modifiers);
    this.syncSkills(); // Apply glass_cannon health/damage multipliers immediately
  }

  useConsumable(id: string): boolean {
    if (!ProgressionManager.useConsumable(id)) return false;

    switch (id) {
      case 'repair_kit':
        this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.25);
        this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, '#00ffaa', 300);
        soundManager.skillUpgrade();
        break;
      case 'emp_generator':
        this.bugs.forEach(b => {
          if (b.type !== 'boss') {
            b.hp = 0;
            this.particleSystem.spawnExplosion(b.x, b.y, b.color);
          }
        });
        this.shake(1.5, 40);
        this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, '#ffffff', 1000);
        soundManager.bossDeath();
        break;
      case 'overdrive_chip':
        this.overdriveTimer = 20;
        soundManager.powerup('overdrive');
        break;
    }
    return true;
  }

  private updateTimers(dt: number) {
    if (this.clickCooldown > 0) this.clickCooldown -= dt;

    if (this.isOverheated) {
      this.weaponHeat -= 45 * dt;
      if (this.weaponHeat <= 0) {
        this.weaponHeat = 0;
        this.isOverheated = false;
      }
    } else if (this.weaponHeat > 0) {
      this.weaponHeat -= 50 * dt;
      if (this.weaponHeat < 0) this.weaponHeat = 0;
    }

    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.multiplierTimer > 0) this.multiplierTimer -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    if (this.slowMoTimer > 0) this.slowMoTimer -= dt;
    if (this.overdriveTimer > 0) this.overdriveTimer -= dt;
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.magnetTimer > 0) this.magnetTimer -= dt;
    if (this.spikeBurstTimer > 0) this.spikeBurstTimer -= dt;
    if (this.controlDistortionTimer > 0) this.controlDistortionTimer -= dt;
    if (this.glitchTimer > 0) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) this.renderer.isGlitching = false;
    }
  }

  private updateMetrics(dt: number) {
    if (this.streakTimer > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) this.streakCount = 0;
    }
    const safetyBonus = Math.min(1.0, (this.globalTime - this.lastHitTime) / 20);
    const streakBonus = Math.min(1.0, this.streakCount / 50);
    this.performanceFactor = 0.8 + (safetyBonus * 0.7) + (streakBonus * 1.0);
    this.playTimeAccumulator += dt;
    if (this.playTimeAccumulator >= 10) {
      StatsManager.updateStats({ totalPlayTime: 10 });
      this.playTimeAccumulator -= 10;
    }
    this.baseScale += (1.0 - this.baseScale) * 0.15;
    this.baseRecoil *= 0.85;
    this.upgradeFlash *= 0.92;
    this.impactFrame = Math.max(0, this.impactFrame - dt * 6);
  }

  private updateTurrets(dt: number) {
    if (this.autoTurretLevel > 0 || this.rapidFireTimer > 0 || this.overdriveTimer > 0) {
      this.autoTurretTimer += dt * this.hazardSlowdown;
      const baseFireRate = GameConfig.upgrades.turret.baseFireRate;
      let fireRate = Math.max(GameConfig.upgrades.turret.minFireRate,
        baseFireRate - this.autoTurretLevel * GameConfig.upgrades.turret.fireRateReduction - ProgressionManager.getSkillBonus('sentry_optimization')
      );
      if (this.overdriveTimer > 0) fireRate *= 0.3;
      if (this.rapidFireTimer > 0) fireRate = 0.05;

      if (this.autoTurretTimer > fireRate && this.bugs.length > 0) {
        this.autoTurretTimer = 0;
        this.fireAutoTurret(this.rapidFireTimer > 0);
      }
    }
  }

  private updateBugs(dt: number) {
    const centerX = this.coreX;
    const centerY = this.coreY;
    let timeScale = this.slowMoTimer > 0 ? 0.3 : 1.0;
    if (this.freezeTimer > 0) timeScale = 0;

    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      const dx = centerX - bug.x;
      const dy = centerY - bug.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 900) {
        this.collisionSystem.handleBugImpact(bug, centerX, centerY);
        const trailId = `bug_${bug.id}`;
        this.trailSystem.deactivateTrail(trailId);
        this.registeredBugTrails.delete(trailId);
        this.bugs.splice(i, 1);
        continue;
      }

      const dist = Math.sqrt(distSq);
      this.moveBug(bug, dx, dy, dist, dt, timeScale);
      this.updateBugAbilities(bug, dt, timeScale, distSq);
      if (bug.hitTimer > 0) bug.hitTimer -= dt;
      if (bug.healEffectTimer && bug.healEffectTimer > 0) {
        bug.healEffectTimer -= dt * timeScale;
        if (bug.healEffectTimer <= 0) bug.isHealing = false;
      }

      // Trail Registration & Point Update
      const trailId = `bug_${bug.id}`;
      if (!this.registeredBugTrails.has(trailId)) {
        this.trailSystem.registerTrail(
          trailId,
          bug.color,
          bug.glowColor || bug.color,
          16, // max trail length
        );
        this.registeredBugTrails.add(trailId);
      }
      this.trailSystem.addPoint(
        trailId,
        bug.x,
        bug.y,
        bug.size * 0.3
      );
    }
  }

  private moveBug(bug: Bug, dx: number, dy: number, dist: number, dt: number, timeScale: number) {
    let speed = bug.speed * timeScale;

    // Apply challenge modifiers
    if (this.challengeModifiers) {
      speed *= this.challengeModifiers.bugSpeedMultiplier;
      if (this.challengeModifiers.speedDemonActive) {
        speed *= (1 + this.challengeBugSpeedBonus);
      }
      if (this.challengeModifiers.frostbiteActive) {
        // Slow to 20% speed when close to core, speed up over time
        const distFactor = Math.min(1, dist / 300);
        const frostSlow = 0.2 + distFactor * 0.8;
        speed *= frostSlow;
      }
    }
    let vx = (dx / dist) * speed;
    let vy = (dy / dist) * speed;
    if (bug.type === 'scout' || bug.type === 'swarmer') {
      const erratic = Math.sin(this.globalTime * 10 + bug.offsetTime) * (bug.type === 'swarmer' ? 1.2 : 0.5);
      vx += -vy * erratic;
      vy += (dx / dist) * speed * erratic;
    }
    bug.rotation = Math.atan2(vy, vx) - Math.PI / 2;
    bug.x += vx * dt;
    bug.y += vy * dt;
    bug.walkCycle += speed * dt * 0.2;
  }

  private updateBugAbilities(bug: Bug, dt: number, timeScale: number, distSq: number) {
    // Biome-specific and type-specific abilities
    if (this.currentBiome === 'void_abyss' || bug.type === 'phase') {
      bug.lastTeleportTime = (bug.lastTeleportTime || 0) + dt * timeScale;
      if (bug.lastTeleportTime > (bug.type === 'phase' ? 2.0 : 4.0) && distSq > 10000) {
        bug.lastTeleportTime = 0;
        this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 40);
        const angle = Math.random() * Math.PI * 2;
        bug.x += Math.cos(angle) * 100;
        bug.y += Math.sin(angle) * 100;
        this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 30);
      }
    }
    if (this.currentBiome === 'golden_spire') {
      bug.hp = Math.min(bug.maxHp, Math.max(0, bug.hp + dt * 0.5));
    }
    if (bug.type === 'healer') {
      bug.healCooldown = (bug.healCooldown || 0) + dt * timeScale;
      if (bug.healCooldown > 3.0) {
        bug.healCooldown = 0;
        bug.isHealing = true;
        bug.healEffectTimer = 0.5;
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#00ff66', 150);

        const HEAL_RADIUS_SQ = 22500;
        for (let j = 0; j < this.bugs.length; j++) {
          const o = this.bugs[j];
          if (o !== bug && o.active) {
            const odx = o.x - bug.x;
            const ody = o.y - bug.y;
            if (odx * odx + ody * ody < HEAL_RADIUS_SQ) {
              o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.2);
            }
          }
        }
      }
    }
    // Delegate boss ability updates to BossSystem
    if (bug.type === 'boss') {
      this.bossSystem.update(bug, dt, timeScale);
    }
  }

  updateCorePhysics(dt: number) {
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;

      const t = 1 - (this.dashTimer / this.dashDuration);
      const ease = t * (2 - t);
      this.coreX = this.dashStartX + (this.dashTargetX - this.dashStartX) * ease;
      this.coreY = this.dashStartY + (this.dashTargetY - this.dashStartY) * ease;

      const trailColor = this.shieldTimer > 0 ? '#00e1ff' : '#00ffcc';
      this.particleSystem.spawnSparkExplosion(this.coreX, this.coreY, trailColor);

      // Delegate dash push/damage to CollisionSystem
      this.collisionSystem.handleDashPush(dt);

      if (this.dashTimer <= 0) {
        this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#00ffff', 160);
      }
    } else {
      const targetCenterX = this.width / 2;
      const targetCenterY = this.height / 2;

      const dx = targetCenterX - this.coreX;
      const dy = targetCenterY - this.coreY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        const slideSpeed = 240;
        this.coreX += (dx / dist) * Math.min(dist, slideSpeed * dt);
        this.coreY += (dy / dist) * Math.min(dist, slideSpeed * dt);
      } else {
        this.coreX = targetCenterX;
        this.coreY = targetCenterY;
      }
    }
  }

  triggerDash(targetX: number, targetY: number) {
    if (this.dashCooldownTimer > 0 || this.isPaused || !this.isRunning) return;

    this.dashCooldownTimer = this.dashCooldown;
    this.dashTimer = this.dashDuration;

    soundManager.dash();

    this.dashStartX = this.coreX;
    this.dashStartY = this.coreY;

    const dx = targetX - this.coreX;
    const dy = targetY - this.coreY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const actualDist = Math.min(dist, this.dashDistance);
    this.dashTargetX = this.coreX + (dx / dist) * actualDist;
    this.dashTargetY = this.coreY + (dy / dist) * actualDist;

    const margin = 50;
    this.dashTargetX = Math.max(margin, Math.min(this.width - margin, this.dashTargetX));
    this.dashTargetY = Math.max(margin, Math.min(this.height - margin, this.dashTargetY));

    this.renderer.chromaticOffset = 25;
    this.impactFrame = 0.35;
    this.shake(0.4, 12);

    this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#ffffff', 80);
  }
}
