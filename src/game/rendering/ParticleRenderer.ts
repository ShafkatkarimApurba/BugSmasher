import { GameEngine } from '../GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from '../GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash, SplatterDrop } from '../ParticleSystem';
import { assetManager } from '../AssetManager';
import { GameConfig } from '../GameConfig';
import { getActiveCoreThemeConfig } from '../CosmeticsManager';
import type { Renderer } from '../Renderer';
import type { PerformanceScaler } from './PerformanceScaler';

export class ParticleRenderer {
  constructor(
    protected engine: GameEngine,
    protected parent: Renderer,
    protected scaler: PerformanceScaler
  ) {}

  protected get isLowEnd() { return this.parent.isLowEnd; }
  protected get currentFps() { return this.scaler.currentFps; }
  protected get vfxScalar() { return this.scaler.vfxScalar; }
  protected get meshComplexityStep() { return this.scaler.meshComplexityStep; }

  drawPowerup(p: Powerup) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    
    const pulse = Math.sin(this.engine.globalTime * 10) * 2;
    
    if (p.life < 2 && Math.floor(this.engine.globalTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }
    
    if (p.collection === 'hover') {
      // Hover collection: spinning dashed outer ring
      ctx.save();
      ctx.rotate(this.engine.globalTime * 2);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, p.size + 8), 0, Math.PI * 2);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1; // Sleeker line
      ctx.stroke();
      ctx.restore();
    } else {
      // Click collection: solid pulsing outer ring
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, p.size + 6 + pulse), 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1; // Sleeker line
      ctx.stroke();
    }
    
    ctx.rotate(this.engine.globalTime);
    ctx.beginPath();
    ctx.moveTo(0, -(p.size + pulse));
    ctx.lineTo(p.size + pulse, 0);
    ctx.lineTo(0, p.size + pulse);
    ctx.lineTo(-(p.size + pulse), 0);
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(5, 5, 5, 0.9)'; // Dark center
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2; // Strong border
    if (!this.isLowEnd) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    
    ctx.rotate(-this.engine.globalTime);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(p.icon, 0, 1);
    
    ctx.restore();
  }

  drawResource(r: ResourcePickup) {
    if (!r.active) return;
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    ctx.save();
    ctx.translate(r.x, r.y);
    
    const lifeFactor = Math.min(1, r.life / 2);
    const scale = (0.8 + Math.cos(t * 12 + r.x) * 0.1) * lifeFactor;
    ctx.scale(scale, scale);
    
    // Draw resource shape (diamond for technical feel)
    ctx.rotate(t * 2 + r.y);
    ctx.fillStyle = r.color;
    if (!this.isLowEnd) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = r.color;
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -r.size);
    ctx.lineTo(r.size * 0.7, 0);
    ctx.lineTo(0, r.size);
    ctx.lineTo(-r.size * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  drawSplatter(s: Splatter) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    
    // Splatters are very persistent but become transparent to not obscure UI
    const lifeRatio = s.life / s.maxLife;
    const alpha = Math.min(0.6, lifeRatio * 1.5);
    const scale = 1.0; 
    ctx.globalAlpha = alpha;
    ctx.scale(scale, scale);
    ctx.fillStyle = s.color;
    
    // Digital noise/glitch effect on splatter
    if (Math.random() > 0.95) {
        ctx.translate((Math.random() - 0.5) * 5, 0);
    }

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, s.size), 0, Math.PI * 2);
    ctx.fill();
    
    s.drops.forEach((drop: SplatterDrop, index: number) => {
      ctx.beginPath();
      // Every 3rd drop is a square for that digital glitch look
      if (index % 3 === 0) {
        ctx.rect(drop.x - drop.size, drop.y - drop.size, drop.size * 2, drop.size * 2);
      } else {
        ctx.arc(drop.x, drop.y, Math.max(0, drop.size), 0, Math.PI * 2);
      }
      ctx.fill();
    });
    
    ctx.restore();

    // v3.0: Emit for bloom (splatters per M1-T6, lower intensity)
    if (this.vfxScalar > 0.3) {
      this.parent.emitGlow(s.x, s.y, s.size * 1.3, s.color, 0.6);
    }
  }

  drawParticle(p: Particle) {
    const ctx = this.engine.ctx;
    const alpha = p.life / p.maxLife;
    
    if (p.type === 'spark') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.stroke();
      
      if (!this.isLowEnd) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.5;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (p.type === 'smoke') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, p.size * (2 - alpha)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (!this.isLowEnd) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.lineTo(p.size/3, -p.size/3);
    ctx.lineTo(p.size, 0);
    ctx.lineTo(p.size/3, p.size/3);
    ctx.lineTo(0, p.size);
    ctx.lineTo(-p.size/3, p.size/3);
    ctx.lineTo(-p.size, 0);
    ctx.lineTo(-p.size/3, -p.size/3);
    ctx.closePath();
    ctx.fill();

    // v3.0: Emit for bloom from bright/explosion-like particles (M1-T6)
    if (this.vfxScalar > 0.3 && p.size > 4) {
      const intensity = p.size > 10 ? 1.0 : 0.7;
      this.parent.emitGlow(p.x, p.y, p.size * 1.8, p.color, intensity);
      if (p.size > 8) {
        this.parent.addLight(p.x, p.y, p.size * 3, p.color, 0.5);
      }
    }
    
    ctx.restore();
  }

  drawShockwave(sw: Shockwave) {
    const ctx = this.engine.ctx;
    ctx.save();
    const alpha = sw.life / sw.maxLife;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, Math.max(0, sw.radius), 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 10 * alpha;
    if (!this.isLowEnd) {
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 20;
    }
    ctx.stroke();
    ctx.restore();

    // v3.0: Emit for bloom (shockwaves are high intensity per M1-T6)
    if (this.vfxScalar > 0.3) {
      this.parent.emitGlow(sw.x, sw.y, sw.radius * 1.1, sw.color, 1.0);
      this.parent.addLight(sw.x, sw.y, sw.radius * 2, sw.color, 0.6);
    }
  }

  drawLaser(l: Laser) {
    const ctx = this.engine.ctx;
    ctx.save();
    const alpha = l.life / l.maxLife;
    ctx.globalAlpha = alpha;
    
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = l.color;
    ctx.lineWidth = l.width * 5 * alpha;
    ctx.lineCap = 'round';
    if (!this.isLowEnd) {
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 15;
    }
    ctx.stroke();

    // Inner core
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = l.width * alpha;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Impact sparks at target point (handled by ParticleSystem during spawnLaser)
    
    ctx.restore();
  }

  drawClouds() {
    if (this.isLowEnd) return;
    const ctx = this.engine.ctx;
    const w = this.engine.width;
    const h = this.engine.height;
    const t = this.engine.globalTime;
    const isBoss = this.engine.waveManager.isBossWave;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Pulsing intensity based on game surge and boss presence
    const surge = Math.min(1, this.engine.performanceFactor * 0.2 + this.parent.fireAlpha * 0.5);
    const bossFactor = isBoss ? 1.5 : 1.0;
    
    // Create 3 large moving atmospheric clouds that react to combat
    const clouds = [
        { x: Math.sin(t * 0.1) * 200 + w * 0.5, y: Math.cos(t * 0.15) * 150 + h * 0.5, r: 400 * bossFactor, color: isBoss ? 'rgba(255, 50, 50, 0.03)' : 'rgba(50, 100, 255, 0.02)' },
        { x: Math.cos(t * 0.08) * 300 + w * 0.5, y: Math.sin(t * 0.12) * 200 + h * 0.5, r: 500 * bossFactor, color: isBoss ? 'rgba(255, 50, 150, 0.02)' : 'rgba(255, 50, 150, 0.015)' },
        { x: Math.sin(t * 0.05 + 2) * 250 + w * 0.5, y: Math.cos(t * 0.07 + 1) * 180 + h * 0.5, r: 600 * bossFactor, color: isBoss ? 'rgba(200, 0, 255, 0.015)' : 'rgba(50, 255, 200, 0.01)' }
    ];

    clouds.forEach(c => {
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * (1 + surge * 0.3));
        grad.addColorStop(0, c.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    });

    ctx.restore();
  }

  drawMuzzleFlash(f: MuzzleFlash) {
    const ctx = this.engine.ctx;
    ctx.save();
    const alpha = f.life / f.maxLife;
    
    const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(0.3, `rgba(255, 255, 100, ${alpha * 0.8})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(f.x, f.y, Math.max(0, f.size), 0, Math.PI * 2);
    ctx.fill();
    
    // Spiky flash bits
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const len = f.size * (1 + Math.random() * 1.5);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(angle) * len, f.y + Math.sin(angle) * len);
        ctx.stroke();
    }
    
    ctx.restore();

    // v3.0: Emit for bloom (muzzle flashes per M1-T6)
    if (this.vfxScalar > 0.3) {
      this.parent.emitGlow(f.x, f.y, f.size * 1.2, '#ffdd88', 0.9);
      this.parent.addLight(f.x, f.y, f.size * 2.5, '#ffaa44', 0.7);
    }
  }
}
