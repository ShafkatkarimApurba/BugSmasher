import { GameEngine } from '../GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from '../GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from '../ParticleSystem';
import { assetManager } from '../AssetManager';
import { GameConfig } from '../GameConfig';
import { getActiveCoreThemeConfig } from '../CosmeticsManager';
import type { Renderer } from '../Renderer';
import type { PerformanceScaler } from './PerformanceScaler';

export class BugRenderer {
  constructor(
    protected engine: GameEngine,
    protected parent: Renderer,
    protected scaler: PerformanceScaler
  ) {}

  protected get isLowEnd() { return this.parent.isLowEnd; }
  protected get currentFps() { return this.scaler.currentFps; }
  protected get vfxScalar() { return this.scaler.vfxScalar; }
  protected get meshComplexityStep() { return this.scaler.meshComplexityStep; }
  protected get emissiveScale() { return this.scaler.emissiveScale; }

  drawHazard(h: Hazard) {
    const ctx = this.engine.ctx;
    const progress = h.timer / h.duration;
    
    ctx.save();
    ctx.translate(h.x, h.y);
    
    if (h.type === 'barrage') {
        const pulse = Math.sin(this.engine.globalTime * 15) * 5;
        
        // Target Reticle
        ctx.strokeStyle = `rgba(255, 50, 0, ${0.5 + Math.sin(this.engine.globalTime * 20) * 0.3})`;
        ctx.lineWidth = 2;
        
        // Outer segments
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + this.engine.globalTime;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, h.radius + pulse), angle, angle + Math.PI / 4);
            ctx.stroke();
        }
        
        // Filling Progress
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, h.radius * progress), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + progress * 0.2})`;
        ctx.fill();
        
        // Text
        ctx.fillStyle = '#ff0000';
        ctx.font = '800 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('! DANGER !', 0, h.radius + 20);
        ctx.fillText(`${Math.ceil((h.duration - h.timer)*10)/10}s`, 0, -h.radius - 10);
    } else if (h.type === 'web') {
        const alpha = Math.min(1, (h.duration - h.timer) * 0.5);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // Octagonal pattern
        for (let j = 1; j <= 3; j++) {
            const r = h.radius * (j / 3);
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.stroke();
        }
        // Radiating lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * h.radius, Math.sin(angle) * h.radius);
            ctx.stroke();
        }
    }
    
    ctx.restore();
  }

  drawBase() {
    const ctx = this.engine.ctx;
    const cx = this.engine.coreX;
    const cy = this.engine.coreY;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Apply Recoil displacement
    if (this.engine.baseRecoil > 0) {
      const rx = Math.cos(this.engine.baseRecoilAngle) * this.engine.baseRecoil;
      const ry = Math.sin(this.engine.baseRecoilAngle) * this.engine.baseRecoil;
      ctx.translate(-rx, -ry); // Recoil is opposite to click direction
    }

    // Apply scale for "kick"
    ctx.scale(this.engine.baseScale, this.engine.baseScale);
    
    const time = this.engine.globalTime;
    const upgradePulse = this.engine.upgradeFlash;
    const pulse = Math.sin(time * 5) * 5;
    
    if (upgradePulse > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        const r = 20 + upgradePulse * 200;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, `rgba(0, 255, 255, ${upgradePulse * 0.8})`);
        grad.addColorStop(0.5, `rgba(0, 255, 255, ${upgradePulse * 0.3})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${upgradePulse})`;
        ctx.lineWidth = 4 * upgradePulse;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, 30 + upgradePulse * 150), 0, Math.PI * 2);
        if (!this.isLowEnd) {
            ctx.shadowBlur = 20 * upgradePulse;
            ctx.shadowColor = '#fff';
        }
        ctx.stroke();
        ctx.restore();
    }
    
    if (this.engine.shieldTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, 60 + pulse), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 204, 255, 0.1)`;
      ctx.strokeStyle = `rgba(0, 204, 255, 0.8)`;
      ctx.lineWidth = 2; // Sharp wireframe
      ctx.fill();
      ctx.stroke();
    }
    
    // Technical structural plates (Mechanical feel) - skip on low FPS
    if (this.currentFps > 40) {
      const t = this.engine.globalTime;
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + t * 0.2;
        // Plates "kick" back during recoil
        const recoilOffset = -(this.engine.baseRecoil * 0.5);
        const floatOffset = Math.sin(t * 3 + i) * 2;
        
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(35 + recoilOffset + floatOffset, 0);
        
        // Plate shape
        ctx.fillStyle = '#111';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-4, -12, 12, 24);
        ctx.fill();
        ctx.stroke();

        // Technical details on plates
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Outer containment ring
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.setLineDash([5, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // The primary core
    const healthFactor = this.engine.health / this.engine.maxHealth;
    const bugIntensity = Math.min(1, this.engine.bugs.length / 20);
    const pulseFactor = 1 + Math.sin(time * (5 + bugIntensity * 10)) * (0.05 + bugIntensity * 0.1);
    
    // Read active core theme (cosmetic)
    const coreTheme = getActiveCoreThemeConfig();
    
    // Core color shifts with damage, powerups, and core theme
    let coreColor = healthFactor < 0.3 ? '#ff3333' : '#ffffff';
    if (this.parent.powerupAlpha > 0) {
        // Blend towards cyan/gold when powerup is active
        coreColor = healthFactor < 0.3 ? '#ff6633' : '#00ffff';
    }
    // Override with theme colors if active
    if (coreTheme && this.parent.powerupAlpha <= 0.01) {
      if (healthFactor < 0.3) {
        coreColor = coreTheme.colors.secondary; // Damaged state uses secondary color
      } else {
        coreColor = coreTheme.colors.primary;
      }
    }
    
    const coreRadius = (20 + this.parent.fireAlpha * 10) * pulseFactor;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    
    if (!this.isLowEnd) {
      const themeShadow = coreTheme ? coreTheme.colors.glow : coreColor;
      ctx.shadowColor = coreTheme && this.parent.powerupAlpha <= 0.01 ? themeShadow : coreColor;
      // emissiveScale from preset (1.6 ultra ... 0.9 mobile) boosts core "glow" feel
      const em = this.scaler.emissiveScale ?? 1.0;
      ctx.shadowBlur = (coreTheme ? 22 : 14) * em;
      ctx.shadowBlur = (20 + this.parent.fireAlpha * 40 + this.parent.impactFlash * 60 + this.parent.powerupAlpha * 40) * pulseFactor;
    }
    ctx.fill();

    // Impact flash overlay (red pulse when hit)
    if (this.parent.impactFlash > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 1.5, 0, Math.PI * 2);
        const hitGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 1.5);
        hitGrad.addColorStop(0, `rgba(255, 0, 0, ${this.parent.impactFlash * 0.8})`);
        hitGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = hitGrad;
        ctx.fill();
        ctx.restore();
    }

    // Animated surface texture
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, coreRadius), 0, Math.PI * 2);
    ctx.clip();
    
    // Rotating tech pattern
    ctx.save();
    ctx.rotate(time * (0.3 + bugIntensity * 2)); // Speeds up with intensity
    ctx.strokeStyle = healthFactor < 0.3 ? 'rgba(255, 255, 255, 0.2)' : (this.parent.powerupAlpha > 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 255, 255, 0.2)');
    ctx.lineWidth = 1.5 + this.parent.powerupAlpha * 2;
    for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(coreRadius * 0.3, 0);
        ctx.lineTo(coreRadius * 0.9, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, coreRadius * 0.6), 0.2, Math.PI * 0.3);
        ctx.stroke();
    }
    ctx.restore();

    // Subtle moving "energy" noise
    ctx.globalAlpha = 0.2 + this.parent.powerupAlpha * 0.3;
    for (let i = 0; i < 3; i++) {
        const speedMult = 1 + bugIntensity * 3;
        const x = Math.cos(time * (0.4 + i * 0.2) * speedMult + i) * coreRadius * 0.6;
        const y = Math.sin(time * (0.5 + i * 0.1) * speedMult + i * 2) * coreRadius * 0.6;
        const r = (4 + Math.sin(time + i) * 2) * (1 + this.parent.powerupAlpha);
        ctx.fillStyle = healthFactor < 0.3 ? '#f00' : (this.parent.powerupAlpha > 0 ? '#fff' : (i % 2 === 0 ? '#0ff' : '#fff'));
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Scanning pulse line
    const scanSpeed = 1.5 + bugIntensity * 4;
    const scanPos = (Math.sin(time * scanSpeed) * 0.5 + 0.5) * coreRadius * 2 - coreRadius;
    const scanGrad = ctx.createLinearGradient(0, scanPos - 4, 0, scanPos + 4);
    const scanColor = healthFactor < 0.3 ? '255, 50, 50' : (this.parent.powerupAlpha > 0 ? '255, 255, 255' : '0, 255, 255');
    scanGrad.addColorStop(0, `rgba(${scanColor}, 0)`);
    scanGrad.addColorStop(0.5, `rgba(${scanColor}, ${0.4 + this.parent.powerupAlpha * 0.4})`);
    scanGrad.addColorStop(1, `rgba(${scanColor}, 0)`);
    ctx.fillStyle = scanGrad;
    ctx.fillRect(-coreRadius, scanPos - 4, coreRadius * 2, 8);
    
    ctx.restore();

    // Decay animation variables
    this.parent.impactFlash = Math.max(0, this.parent.impactFlash - 0.05);
    this.parent.powerupAlpha = Math.max(0, this.parent.powerupAlpha - 0.02);

    // Core "Energy" Gradient
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 30 + pulse + this.parent.fireAlpha * 20 + this.parent.powerupAlpha * 30);
    grd.addColorStop(0, coreColor);
    grd.addColorStop(0.3, `${coreColor}66`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fill();

    // Core fire pulse overlay
    if (this.parent.fireAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Secondary expanding ring
        const ringSize = 40 + (1 - this.parent.fireAlpha) * 100;
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.parent.fireAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, ringSize), 0, Math.PI * 2);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100 * this.parent.fireAlpha);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.parent.fireAlpha})`);
        gradient.addColorStop(0.4, `rgba(0, 255, 255, ${this.parent.fireAlpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, 100 * this.parent.fireAlpha), 0, Math.PI * 2);
        ctx.fill();
        
        this.parent.fireAlpha *= (1 - 6 * 0.016); // Faster decay
        if (this.parent.fireAlpha < 0.01) this.parent.fireAlpha = 0;
        ctx.restore();
    }

    ctx.fill();
    
    ctx.fillStyle = '#050505'; // Dark text on white core
    ctx.font = '800 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(this.engine.health)}`, 0, 1);
    
    ctx.restore();
  }

  drawBug(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(bug.x, bug.y);
    
    // Draw glow trail (subtle persistent path) - skip on very low FPS
    if (!this.isLowEnd && bug.active && this.currentFps > 40) {
      this.drawBugTrail(bug);
    }

    ctx.rotate(bug.rotation);
    
    const legSwing = Math.sin(bug.walkCycle) * 0.8;
    
    ctx.fillStyle = bug.color;
    ctx.strokeStyle = bug.color;
    ctx.lineWidth = 1;
    
    const scale = bug.size / 15;
    ctx.scale(scale, scale);

    // Damage flash
    if (bug.hitTimer > 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Simplified hitbox-based flash
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = bug.color;
    }

    // Ghost bug flickering effect
    if (bug.type === 'ghost') {
      const flicker = Math.sin(this.engine.globalTime * 20) * 0.5 + 0.5;
      if (flicker < 0.3) {
        ctx.restore();
        return;
      }
      ctx.globalAlpha = 0.4 + flicker * 0.4;
    }
    
    if (!this.isLowEnd && this.currentFps > 45) {
      ctx.shadowColor = bug.color;
      ctx.shadowBlur = 15;
    }

    // Body Detailing
    this.drawBugBody(bug, legSwing);

    if (this.engine.accessibility?.showEnemyShapes) {
      this.drawEnemyShapeMarker(bug);
    }
    
    // Eyes (Global for all types)
    ctx.fillStyle = '#050505'; 
    ctx.beginPath();
    ctx.arc(-6, -18, 3, 0, Math.PI * 2);
    ctx.arc(6, -18, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner Glow/Pupil - skip on very low FPS
    if (this.currentFps > 35) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(-6, -19, 1, 0, Math.PI * 2);
      ctx.arc(6, -19, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Technical overlay (circuit patterns) - skip on low FPS
    if ((bug.type === 'boss' || bug.type === 'tank') && this.currentFps > 40) {
        this.drawTechnicalDetails(bug);
    }

    // Mandible boss special armor visualization - skip on low FPS
    if (bug.variantId === 'mandible' && bug.armor && bug.armor < 1.0 && this.currentFps > 40) {
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 3;
      const angleShift = Math.sin(this.engine.globalTime * 15) * 0.2;
      
      // Visual feedback for hardened armor
      ctx.save();
      // Left Mandible
      ctx.beginPath();
      ctx.arc(-10, -15, 25, Math.PI * 1.1 + angleShift, Math.PI * 1.6 + angleShift);
      ctx.stroke();
      
      // Right Mandible
      ctx.beginPath();
      ctx.arc(10, -15, 25, Math.PI * 1.4 - angleShift, Math.PI * 1.9 - angleShift);
      ctx.stroke();
      ctx.restore();

      // Armor glow pulse
      const armorPulse = Math.abs(Math.sin(this.engine.globalTime * 10)) * 0.2;
      ctx.fillStyle = `rgba(255, 100, 0, ${0.1 + armorPulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // v3.0: Emit glow + light for bloom/lighting pipeline (M1-T6)
    // Guarded by vfxScalar per quality / performance scaler
    if (this.vfxScalar > 0.3) {
      const gRadius = bug.glowRadius ?? (bug.size * 1.4);
      const gColor = bug.glowColor ?? bug.color;
      const gIntensity = (bug.type === 'boss' || bug.glowColor) ? 0.95 : 0.65;
      this.parent.emitGlow(bug.x, bug.y, gRadius, gColor, gIntensity);

      const lRadius = bug.lightRadius ?? (bug.size * 2.8);
      const lColor = bug.lightColor ?? bug.color;
      this.parent.addLight(bug.x, bug.y, lRadius, lColor, 0.45);
    }

    // Health Bar for tougher bugs - skip on very low FPS
    if (bug.maxHp > 1 && bug.type !== 'boss' && this.currentFps > 35) {
      const barW = Math.max(30, bug.size * scale);
      const barH = 2.5;
      const bx = bug.x - barW / 2;
      const by = bug.y - (bug.size * scale) - 12;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(bx, by, barW, barH);
      
      // Progress
      const hpRatio = bug.hp / bug.maxHp;
      ctx.fillStyle = bug.color;
      ctx.fillRect(bx, by, barW * hpRatio, barH);
      
      // Critical Flash
      if (hpRatio < 0.25 && Math.sin(this.engine.globalTime * 15) > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, barW * hpRatio, barH);
      }
    }
  }

  private drawEnemyShapeMarker(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    const r = 14;
    ctx.beginPath();
    switch (bug.type) {
      case 'scout':
        ctx.moveTo(0, -r);
        ctx.lineTo(r, r);
        ctx.lineTo(-r, r);
        ctx.closePath();
        break;
      case 'tank':
        ctx.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
        break;
      case 'healer':
        ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
        break;
      case 'boss':
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        break;
      default:
        ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawBugTrail(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bug.size * 2);
    grad.addColorStop(0, `${bug.color}33`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, bug.size * 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBugBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;

    if (bug.type === 'scout') {
      this.drawScoutBody(bug, legSwing);
    } else if (bug.type === 'tank') {
      this.drawTankBody(bug, legSwing);
    } else if (bug.type === 'healer') {
      this.drawHealerBody(bug);
    } else if (bug.type === 'boss') {
      this.drawBossBody(bug);
    } else if (bug.type === 'swarmer' || bug.type === 'mini') {
      this.drawSwarmerBody(bug);
    } else if (bug.type === 'phase') {
      this.drawPhaseBody(bug);
    } else if (bug.type === 'ember') {
      this.drawEmberBody(bug);
    } else if (bug.type === 'frost') {
      this.drawFrostBody(bug);
    } else {
      this.drawBeetleBody(bug, legSwing);
    }
  }

  private drawLegSegment(x: number, y: number, side: number, swing: number, joint1: number, joint2: number) {
    const ctx = this.engine.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    const midX = x + side * joint1;
    const midY = y + swing * 15;
    const endX = x + side * (joint1 + joint2);
    const endY = y + swing * 5;
    
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
    
    // Joint dot
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath(); ctx.arc(midX, midY, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  private drawBeetleBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    ctx.lineWidth = 2;
    ctx.strokeStyle = bug.color;

    // Legs
    for (let i = 0; i < 3; i++) {
      const y = -10 + i * 15;
      const swing = (i % 2 === 0 ? legSwing : -legSwing);
      this.drawLegSegment(-10, y, -1, swing, 15, 10);
      this.drawLegSegment(10, y, 1, -swing, 15, 10);
    }

    // Body segments with AAA shading
    const grad = ctx.createRadialGradient(-5, -5, 0, 0, 0, 30);
    grad.addColorStop(0, '#ffffff'); // Highlight
    grad.addColorStop(0.2, bug.color);
    grad.addColorStop(1, '#000000'); // Shadow

    ctx.fillStyle = grad;
    
    // Abdomen (Large back)
    ctx.beginPath();
    ctx.ellipse(0, 15, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();

    // Thorax (Middle)
    ctx.beginPath();
    ctx.ellipse(0, -5, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(0, -22, 11, 0, Math.PI * 2);
    ctx.fill();

    // Wings/Shell line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 35); ctx.stroke();
  }

  private drawScoutBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const wingVibe = Math.sin(t * 40) * 10;
    
    // Wings (Translucent layered)
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 2; i++) {
        const offset = i * 5;
        ctx.fillStyle = bug.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-20, -10 + wingVibe, -40, 10 + offset, -10, 20);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(20, -10 + wingVibe, 40, 10 + offset, 10, 20);
        ctx.fill();
    }
    ctx.restore();

    // High-tech body
    ctx.fillStyle = bug.color;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(12, 5);
    ctx.lineTo(0, 15);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();

    // Glowing thruster
    const thrusterGlow = Math.abs(Math.sin(t * 20)) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${thrusterGlow})`;
    ctx.beginPath(); ctx.arc(0, 15, 4, 0, Math.PI * 2); ctx.fill();
  }

  private drawTankBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    ctx.lineWidth = 3;
    ctx.strokeStyle = bug.color;

    // Heavy segmented legs
    for (let i = 0; i < 3; i++) {
        const y = -15 + i * 20;
        const swing = (i % 2 === 0 ? legSwing : -legSwing) * 0.5;
        this.drawLegSegment(-25, y, -1, swing, 20, 15);
        this.drawLegSegment(25, y, 1, -swing, 20, 15);
    }

    // Armor Plates
    ctx.fillStyle = bug.color;
    for (let i = 0; i < 4; i++) {
        const y = -30 + i * 18;
        const width = 25 - Math.abs(i - 1.5) * 4;
        ctx.beginPath();
        ctx.roundRect(-width, y, width * 2, 15, 4);
        ctx.fill();
        
        // Highlight on each plate
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(-width + 2, y + 2, width * 2 - 4, 3);
        ctx.fillStyle = bug.color;
    }

    // Side Turrets/Shields
    this.drawSidePlates(bug);
  }

  private drawHealerBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;

    // Healing Aura
    const auraAlpha = 0.15 + Math.sin(t * 5) * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 150, ${auraAlpha})`;
    ctx.fill();

    // Mechanical Chassis
    ctx.fillStyle = bug.color;
    ctx.beginPath();
    ctx.roundRect(-8, -28, 16, 56, 8); // Vertical
    ctx.roundRect(-28, -8, 56, 16, 8); // Horizontal
    ctx.fill();

    // Central Core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Floating panels
    for (let i = 0; i < 4; i++) {
        const angle = t + (i * Math.PI / 2);
        const dist = 35 + Math.sin(t * 4 + i) * 5;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = bug.color;
        ctx.fillRect(dist, -5, 10, 10);
        ctx.restore();
    }

    if (bug.isHealing) {
      this.drawHealingPulses(bug);
    }
  }

  private drawHealingPulses(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const pulse = (t % 0.8) / 0.8;
    ctx.strokeStyle = `rgba(100, 255, 200, ${1 - pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + pulse * 80, 0, Math.PI * 2);
    ctx.stroke();

    const healerScale = bug.size / 15;
    this.engine.bugs.forEach(other => {
      if (other !== bug && other.active) {
          const dx = other.x - bug.x;
          const dy = other.y - bug.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 150 * 150) {
            this.drawHealingBeam(0, 0, dx / healerScale, dy / healerScale, bug.color);
          }
      }
    });
  }

  private drawSwarmerBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const spines = bug.type === 'mini' ? 4 : 8;
    
    ctx.fillStyle = bug.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let i = 0; i < spines * 2; i++) {
        const isSpike = i % 2 === 0;
        const r = isSpike ? 28 : 14;
        const angle = (i / (spines * 2)) * Math.PI * 2 + (t * 4);
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner core
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  }

  private drawPhaseBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const alpha = 0.5 + Math.sin(t * 12) * 0.4;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = bug.color;
    
    // Shifting geometric shards
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(t * 2 + i);
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(15, 15);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  private drawEmberBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    // Inner Glow
    const glow = 20 + Math.sin(t * 15) * 10;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glow);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(0, glow), 0, Math.PI * 2); ctx.fill();

    // Magma Shell
    ctx.fillStyle = '#441100';
    ctx.beginPath();
    ctx.roundRect(-18, -18, 36, 36, 6);
    ctx.fill();
    
    // Glowing Cracks
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
    ctx.moveTo(10, -10); ctx.lineTo(-10, 10);
    ctx.stroke();
  }

  private drawFrostBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    // Ice Lattice
    ctx.strokeStyle = '#8bd8ff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + (t * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
        ctx.stroke();
    }

    // Crystalline Core
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(10, 0); ctx.lineTo(0, 5); ctx.closePath();
    ctx.fill();
  }


  drawSidePlates(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.fillStyle = '#00000033';
    ctx.fillRect(-30, -15, 10, 30);
    ctx.fillRect(20, -15, 10, 30);
  }

  drawTankLegs(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.strokeStyle = bug.color;
    for (let i = 0; i < 3; i++) {
      const y = -15 + i * 15;
      ctx.beginPath();
      ctx.moveTo(-25, y); ctx.lineTo(-40, y + (i-1)*5);
      ctx.moveTo(25, y); ctx.lineTo(40, y + (i-1)*5);
      ctx.stroke();
    }
  }

  drawBossBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    // VARIANT: Arachne Spindly Legs
    if (bug.variantId === 'arachne') {
      const pulse = Math.sin(t * 8) * 0.5 + 0.5;
      ctx.strokeStyle = bug.color;
      ctx.lineWidth = 2 + pulse * 2;
      ctx.shadowBlur = 10 + pulse * 10;
      ctx.shadowColor = bug.color;
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.sin(t * 5 + i) * 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const r1 = 35; 
        const r2 = 110 + Math.sin(t * 12 + i) * 15;
        // Jointed leg look
        const midX = Math.cos(angle - 0.2) * r1 * 1.5;
        const midY = Math.sin(angle - 0.2) * r1 * 1.5;
        ctx.lineTo(midX, midY);
        ctx.lineTo(Math.cos(angle + 0.1) * r2, Math.sin(angle + 0.1) * r2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // VARIANT: Steel Mandible
    if (bug.variantId === 'mandible') {
      const open = bug.armor === 1.0; 
      const angle = open ? 0.9 : 0.15;
      const vibrato = !open ? Math.sin(t * 50) * 2 : 0;
      
      // Armored shell look
      ctx.fillStyle = '#1a1a1a';
      ctx.strokeStyle = bug.color;
      ctx.lineWidth = 3;
      
      // Mandibles
      for (let side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * angle + vibrato * 0.01);
        
        ctx.fillStyle = bug.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.quadraticCurveTo(side * 50, -50, side * 30, -110);
        ctx.lineTo(side * 10, -40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Inner "teeth"
        ctx.fillStyle = '#fff';
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.arc(side * (15 + j * 5), -40 - j * 15, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
      }
    }

    // VARIANT: Moth Wings
    if (bug.variantId === 'moth') {
      const wingVibe = Math.sin(t * 45) * 35;
      const shift = Math.sin(t * 2) * 20;
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = bug.color;
      
      // Layered ethereal wings with patterns
      for (let layer = 0; layer < 2; layer++) {
        ctx.globalAlpha = layer === 0 ? 0.2 : 0.5;
        const sizeMod = layer === 0 ? 1.3 : 1.0;
        ctx.fillStyle = bug.color;
        
        // Top Wings
        ctx.beginPath();
        ctx.ellipse(-55, -15 + shift, (100 + wingVibe) * sizeMod, 45 * sizeMod, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(55, -15 + shift, (100 + wingVibe) * sizeMod, 45 * sizeMod, -0.4, 0, Math.PI * 2); ctx.fill();
        
        // Wing Eye Patterns
        if (layer === 1) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-70, -20 + shift, 10, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(70, -20 + shift, 10, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = bug.color;
    ctx.setLineDash([5, 12]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 85, t * 0.5, t * 0.5 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    for (let i = 0; i < 3; i++) {
        const offset = t * 2 + (i * Math.PI * 2 / 3);
        ctx.save();
        ctx.rotate(offset);
        ctx.fillStyle = bug.isShielded ? '#00ffff44' : '#ffffff22';
        ctx.fillRect(90, -8, 4, 16);
        ctx.restore();
    }

    // Main Chassis
    ctx.fillStyle = bug.color;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.bezierCurveTo(60, -20, 40, 70, 0, 50);
    ctx.bezierCurveTo(-40, 70, -60, -20, 0, -70);
    ctx.fill();
    
    // Core Glow
    const pulse = Math.abs(Math.sin(t * 5)) * 0.5 + 0.5;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, bug.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;

    // Ability Charging Indicators
    const conf = GameConfig.bugs.boss;
    const barrageCharge = bug.phase >= 2 ? Math.min(1, bug.abilityTimer! / conf.barrageRate) : 0;
    
    if (barrageCharge > 0.7) {
        const warningAlpha = (barrageCharge - 0.7) / 0.3;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, ${warningAlpha * (Math.sin(t * 20) * 0.5 + 0.5)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 95, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#ff0000';
        ctx.font = '900 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BARRAGE_IMMINENT', 0, -110);
        ctx.restore();
    }

    if (bug.isShielded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 105, 0, Math.PI * 2);
        
        const sPulse = Math.sin(t * 10) * 0.2 + 0.8;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 * sPulse})`;
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 * sPulse})`;
        for(let i=0; i<6; i++) {
            const ang = i * Math.PI / 3 + t;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * 105, Math.sin(ang) * 105);
            ctx.lineTo(Math.cos(ang + Math.PI/3) * 105, Math.sin(ang + Math.PI/3) * 105);
            ctx.stroke();
        }
        ctx.restore();
    }
  }

  drawHealingBeam(x1: number, y1: number, x2: number, y2: number, color: string) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -this.engine.globalTime * 20;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    
    // Add small particles along the beam
    const t = this.engine.globalTime;
    for (let i = 0; i < 3; i++) {
        const p = (t * 2 + i / 3) % 1;
        const px = x1 + (x2 - x1) * p;
        const py = y1 + (y2 - y1) * p;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }

  drawTechnicalDetails(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(10, -10);
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(-10, 10); ctx.lineTo(10, 10);
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5 + Math.sin(this.engine.globalTime * 5) * 0.5;
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;
  }


}
