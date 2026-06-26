import { GameEngine } from '../GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from '../GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from '../ParticleSystem';
import { assetManager } from '../AssetManager';
import { GameConfig } from '../GameConfig';
import { getActiveCoreThemeConfig } from '../CosmeticsManager';
import type { Renderer } from '../Renderer';
import type { PerformanceScaler } from './PerformanceScaler';
import { OffscreenEnvironmentCache } from './OffscreenEnvironmentCache';

export class EnvironmentRenderer {
  private staticLayerCache = new OffscreenEnvironmentCache();
  constructor(
    protected engine: GameEngine,
    protected parent: Renderer,
    protected scaler: PerformanceScaler
  ) {}

  protected get isLowEnd() { return this.parent.isLowEnd; }
  protected get currentFps() { return this.scaler.currentFps; }
  protected get vfxScalar() { return this.scaler.vfxScalar; }
  protected get meshComplexityStep() { return this.scaler.meshComplexityStep; }

  drawBiomeBackground() {
    const ctx = this.engine.ctx;
    const biomeId = this.engine.currentBiome;
    const t = this.engine.globalTime;
    const width = this.engine.width;
    const height = this.engine.height;

    ctx.save();
    
    // Base colors per biome
    let colorA = '#050505';
    let colorB = '#0a0a0a';
    
    switch(biomeId) {
      case 'quantum_void': colorA = '#08001a'; colorB = '#1a0033'; break;
      case 'ember_depths': colorA = '#1a0500'; colorB = '#330a00'; break;
      case 'frostbyte': colorA = '#001a1a'; colorB = '#003344'; break;
      case 'void_abyss': colorA = '#000000'; colorB = '#111111'; break;
      case 'golden_cache': colorA = '#1a1a00'; colorB = '#333300'; break;
      case 'golden_spire': colorA = '#0a0a05'; colorB = '#1a1a10'; break;
    }

    const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    
    // Dynamic shift based on intensity/health
    const healthRatio = this.engine.health / this.engine.maxHealth;
    const intensity = Math.min(1, this.engine.performanceFactor * 0.1);
    
    if (healthRatio < 0.3) {
      // Emergency red shift
      const pulse = Math.sin(t * 8) * 0.2 + 0.2;
      grad.addColorStop(0, colorB);
      grad.addColorStop(1, `rgba(180, 0, 0, ${pulse})`); 
    } else if (intensity > 0.4) {
      // High intensity pulse
      const pulse = Math.sin(t * 4) * 0.1;
      grad.addColorStop(0, colorB);
      grad.addColorStop(1, colorA);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + pulse})`; // Global flash
    } else {
      grad.addColorStop(0, colorB);
      grad.addColorStop(1, colorA);
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Biome specific background particles/grid (cached offscreen when static)
    if (biomeId === 'neon_core' || biomeId === 'golden_cache') {
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, biomeId, (c) =>
        this.paintGrid(c as CanvasRenderingContext2D, 200, 'rgba(255, 255, 255, 0.01)')
      );
      if (!cached) this.drawGrid(200, 'rgba(255, 255, 255, 0.01)');
    } else if (biomeId === 'quantum_void' || biomeId === 'void_abyss') {
      const count = biomeId === 'void_abyss' ? 100 : 50;
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, biomeId, (c) =>
        this.paintStarfield(c as CanvasRenderingContext2D, count)
      );
      if (!cached) this.drawStarfield(count);
    } else if (biomeId === 'ember_depths') {
      this.drawLavaBubbles();
    } else if (biomeId === 'frostbyte') {
      this.drawSnowflakes();
    }

    ctx.restore();
    
    if (this.isLowEnd) return;
    this.drawDynamicMesh();
  }

  private paintGrid(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < this.engine.width; x += size) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.engine.height);
    }
    for (let y = 0; y < this.engine.height; y += size) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.engine.width, y);
    }
    ctx.stroke();
  }

  drawGrid(size: number, color: string) {
    if (this.currentFps < 30) return;
    this.paintGrid(this.engine.ctx, size, color);
  }

  private paintStarfield(ctx: CanvasRenderingContext2D, count: number) {
    const step = 2;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < count; i += step) {
      const x = ((i * 137) % this.engine.width);
      const y = ((i * 89) % this.engine.height);
      const s = (i % 3) + 1;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawStarfield(count: number) {
    if (this.currentFps < 25) return;
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    // Reduce draw calls - skip every other star
    const step = this.currentFps < 40 ? 2 : 1;
    for (let i = 0; i < count; i += step) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * this.engine.width;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * this.engine.height;
        const s = (Math.sin(t + i) * 0.5 + 0.5) * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(t * 2 + i) * 0.5 + 0.5})`;
        ctx.fillRect(x, y, s, s);
    }
  }

  drawLavaBubbles() {
    // Skip on low FPS
    if (this.currentFps < 30) return;
    
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    // Reduce from 20 to 10 bubbles on low FPS
    const count = this.currentFps < 50 ? 5 : 10;
    for (let i = 0; i < count; i++) {
        const x = (Math.sin(i * 500) * 0.5 + 0.5) * this.engine.width;
        const y = (this.engine.height - (t * 50 + i * 40) % (this.engine.height + 100));
        const r = (Math.sin(t + i) * 0.5 + 0.5) * 10 + 5;
        ctx.fillStyle = `rgba(255, 50, 0, 0.1)`;
        ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill();
    }
  }

  drawSnowflakes() {
    // Skip on low FPS
    if (this.currentFps < 30) return;
    
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    // Reduce from 40 to 20 snowflakes on normal FPS, 10 on low FPS
    const count = this.currentFps < 50 ? 10 : 20;
    for (let i = 0; i < count; i++) {
        const x = (Math.sin(i * 1000 + t * 0.5) * 0.5 + 0.5) * this.engine.width;
        const y = (t * 80 + i * 30) % (this.engine.height + 50);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawDynamicMesh() {
    // Skip mesh on very low FPS
    if (this.currentFps < 20) return;
    
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const width = this.engine.width;
    const height = this.engine.height;
    
    // Determine dynamic state
    const healthRatio = this.engine.health / this.engine.maxHealth;
    const isLowHealth = healthRatio < 0.3;
    const isIntense = this.engine.performanceFactor > 1.5 || this.engine.bugs.length > 20 || this.engine.waveManager.isBossWave;
    
    let waveMultX = 20;
    let waveMultY = 15;
    let speedMult = 1;
    
    if (isLowHealth) {
      waveMultX = 30 + Math.sin(t * 10) * 10;
      waveMultY = 25 + Math.cos(t * 12) * 10;
      speedMult = 2;
    } else if (isIntense) {
      waveMultX = 25;
      waveMultY = 20;
      speedMult = 1.5;
    }

    ctx.lineWidth = 1;
    // Increase grid size on low FPS to reduce lines drawn
    const gridSize = this.currentFps < 40 ? 120 : 80;
    const step = this.meshComplexityStep;
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      let first = true;
      for (let y = 0; y <= height; y += step) {
        const waveX = Math.sin((y * 0.005) + (t * 0.2 * speedMult)) * waveMultX;
        const waveY = Math.cos((x * 0.005) + (t * 0.15 * speedMult)) * waveMultY;
        if (first) {
          ctx.moveTo(x + waveX, y + waveY);
          first = false;
        } else {
          ctx.lineTo(x + waveX, y + waveY);
        }
      }
    }
    for (let y = 0; y <= height; y += gridSize) {
      let first = true;
      for (let x = 0; x <= width; x += step) {
        const waveX = Math.sin((y * 0.005) + (t * 0.2 * speedMult)) * waveMultX;
        const waveY = Math.cos((x * 0.005) + (t * 0.15 * speedMult)) * waveMultY;
        if (first) {
          ctx.moveTo(x + waveX, y + waveY);
          first = false;
        } else {
          ctx.lineTo(x + waveX, y + waveY);
        }
      }
    }
    
    let strokeColor = 'rgba(255, 255, 255, 0.01)';
    if (isLowHealth) strokeColor = `rgba(255, 0, 0, ${0.05 + Math.abs(Math.sin(t * 5)) * 0.15})`;
    else if (isIntense) strokeColor = `rgba(255, 150, 0, 0.08)`;
    
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }

  drawBossIntro() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const timer = this.engine.waveManager.bossIntroTimer;
    const t = this.engine.globalTime;

    // Darken and glitch
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.8, (4 - timer) * 0.5)})`;
    ctx.fillRect(0, 0, width, height);

    if (Math.random() < 0.1) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, Math.random() * height, width, 10);
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Scanlines
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    // Lore / Narrative Text
    ctx.textAlign = 'left';
    ctx.font = '800 12px "JetBrains Mono", monospace';
    
    const logs = [
        "[ ALERT ] : PROJECT NEXUS INTEGRITY BREACHED",
        "[ LOG ]   : ANOMALY CLASS 'OVERSEER' DETECTED IN SECTOR 7",
        "[ LOG ]   : KINETIC SUPPRESSION PROTOCOLS: [ INACTIVE ]",
        "[ ERROR ] : SYSTEM CORRUPTION AT 84.3%",
        "[ LOG ]   : INITIATING EMERGENCY DATA PURGE...",
        "[ ALERT ] : SENTIENCE DETECTED WITHIN THE CORE"
    ];

    const displayCount = Math.floor((4 - timer) * 4);
    for (let i = 0; i < Math.min(logs.length, displayCount); i++) {
        const flicker = Math.random() > 0.1 ? 1 : 0.5;
        ctx.fillStyle = `rgba(255, 50, 50, ${flicker})`;
        ctx.fillText(logs[i], 40, height - 100 - (i * 20));
    }

    // Central Warning
    if (timer < 3) {
        const scale = 1 + Math.sin(t * 15) * 0.05;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        ctx.font = '900 64px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        
        // Glitch split
        const off = Math.sin(t * 40) * 4;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.fillText('CORE BREACH', off, 0);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillText('CORE BREACH', -off, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CORE BREACH', 0, 0);
        
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('SYSTEM OVERRIDE IN PROGRESS', 0, 50);
        
        // Progress bar for "override"
        const barW = 300;
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(-barW/2, 70, barW, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-barW/2, 70, barW * (1 - timer / 3), 4);
        
        ctx.restore();
    }
  }

  drawBossWarning() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const t = this.engine.globalTime;
    
    const alpha = Math.abs(Math.sin(t * 8));
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${0.1 * alpha})`;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.font = '900 42px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! WARNING: CRITICAL SYSTEM THREAT !', width / 2, height / 2 - 100);
    
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('OVERSEER CLASS ANOMALY DETECTED', width / 2, height / 2 - 60);
    ctx.restore();
  }

}
