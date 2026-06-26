export interface Particle { 
  active: boolean; 
  x: number; 
  y: number; 
  vx: number; 
  vy: number; 
  size: number; 
  color: string; 
  rotation: number; 
  life: number; 
  maxLife: number; 
  type?: 'circle' | 'spark' | 'smoke' | 'debris';
}
export interface SplatterDrop { x: number; y: number; size: number; active: boolean; }
export interface Splatter { active: boolean; x: number; y: number; rotation: number; size: number; color: string; life: number; maxLife: number; drops: SplatterDrop[]; }
export interface Shockwave { active: boolean; x: number; y: number; radius: number; speed: number; color: string; life: number; maxLife: number; }
export interface Laser { active: boolean; x1: number; y1: number; x2: number; y2: number; life: number; maxLife: number; color: string; width: number; }
export interface MuzzleFlash { active: boolean; x: number; y: number; life: number; maxLife: number; size: number; }

const MAX_PARTICLES = 500;
const MAX_SPLATTERS = 100;
const MAX_SHOCKWAVES = 50;
const MAX_LASERS = 50;
const MAX_MUZZLE_FLASHES = 20;
const MAX_DROPS_PER_SPLATTER = 16;

import type { ParticleEngineHost } from './ParticleEngineHost';

export class ParticleSystem {
  engine?: ParticleEngineHost;
  
  get vfxCountMultiplier(): number {
    if (!this.engine) return 1.0;
    const renderer = this.engine.renderer;
    if (!renderer) return 1.0;
    return renderer.vfxScalar;
  }

  particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', rotation: 0, life: 0, maxLife: 0 }));
  particleIdx = 0;
  
  splatters: Splatter[] = Array.from({ length: MAX_SPLATTERS }, () => ({ 
    active: false, x: 0, y: 0, rotation: 0, size: 0, color: '', life: 0, maxLife: 0, 
    drops: Array.from({ length: MAX_DROPS_PER_SPLATTER }, () => ({ x: 0, y: 0, size: 0, active: false }))
  }));
  splatterIdx = 0;
  
  shockwaves: Shockwave[] = Array.from({ length: MAX_SHOCKWAVES }, () => ({ active: false, x: 0, y: 0, radius: 0, speed: 0, color: '', life: 0, maxLife: 0 }));
  shockwaveIdx = 0;
  
  lasers: Laser[] = Array.from({ length: MAX_LASERS }, () => ({ active: false, x1: 0, y1: 0, x2: 0, y2: 0, life: 0, maxLife: 0, color: '', width: 0 }));
  laserIdx = 0;

  muzzleFlashes: MuzzleFlash[] = Array.from({ length: MAX_MUZZLE_FLASHES }, () => ({ active: false, x: 0, y: 0, life: 0, maxLife: 0, size: 0 }));
  muzzleFlashIdx = 0;

  reset() {
    this.particles.forEach(p => p.active = false);
    this.splatters.forEach(s => s.active = false);
    this.shockwaves.forEach(sw => sw.active = false);
    this.lasers.forEach(l => l.active = false);
    this.muzzleFlashes.forEach(f => f.active = false);
  }

  update(dt: number) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }
      
    for (let i = 0; i < MAX_SPLATTERS; i++) {
      const s = this.splatters[i];
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) s.active = false;
    }
      
    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const sw = this.shockwaves[i];
      if (!sw.active) continue;
      sw.life -= dt;
      sw.radius += sw.speed * dt;
      if (sw.life <= 0) sw.active = false;
    }
      
    for (let i = 0; i < MAX_LASERS; i++) {
      const l = this.lasers[i];
      if (!l.active) continue;
      l.life -= dt;
      if (l.life <= 0) l.active = false;
    }

    for (let i = 0; i < MAX_MUZZLE_FLASHES; i++) {
      const f = this.muzzleFlashes[i];
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) f.active = false;
    }
  }

  spawnMuzzleFlash(x: number, y: number, size: number = 40) {
    const f = this.muzzleFlashes[this.muzzleFlashIdx];
    f.active = true;
    f.x = x;
    f.y = y;
    f.life = 0.05;
    f.maxLife = 0.05;
    f.size = size;
    this.muzzleFlashIdx = (this.muzzleFlashIdx + 1) % MAX_MUZZLE_FLASHES;
  }

  spawnShockwave(x: number, y: number, color: string, maxRadius: number) {
    const sw = this.shockwaves[this.shockwaveIdx];
    sw.active = true;
    sw.x = x;
    sw.y = y;
    sw.radius = 10;
    sw.speed = maxRadius * 3;
    sw.color = color;
    sw.life = 0.3;
    sw.maxLife = 0.3;
    this.shockwaveIdx = (this.shockwaveIdx + 1) % MAX_SHOCKWAVES;
  }
  
  spawnSplatter(x: number, y: number, color: string) {
    const s = this.splatters[this.splatterIdx];
    s.active = true;
    s.x = x;
    s.y = y;
    s.rotation = Math.random() * Math.PI * 2;
    s.size = Math.random() * 15 + 10;
    s.color = color;
    s.life = 5;
    s.maxLife = 5;
    
    for (let i = 0; i < MAX_DROPS_PER_SPLATTER; i++) {
      const drop = s.drops[i];
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 50 + 5;
      drop.active = true;
      drop.x = Math.cos(angle) * dist;
      drop.y = Math.sin(angle) * dist;
      drop.size = Math.random() * 8 + 2;
    }
    
    this.splatterIdx = (this.splatterIdx + 1) % MAX_SPLATTERS;
  }
  
  spawnGibs(x: number, y: number, color: string, count: number = 15) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let finalCount = isLowQuality ? Math.max(1, Math.round(count * 0.4)) : count;
    finalCount = Math.max(1, Math.round(finalCount * this.vfxCountMultiplier));
    for (let i = 0; i < finalCount; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 300 + 100;
      
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 8 + 3;
      p.color = color;
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.5 + Math.random() * 0.5;
      p.maxLife = 1;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }
  
  spawnMissParticles(x: number, y: number) {
    this.spawnClickPulse(x, y);
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let finalCount = isLowQuality ? 3 : 8;
    finalCount = Math.max(1, Math.round(finalCount * this.vfxCountMultiplier));
    for (let i = 0; i < finalCount; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 30;
      
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 4 + 1;
      p.color = '#00ffff';
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.2 + Math.random() * 0.2;
      p.maxLife = 0.4;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnExplosion(x: number, y: number, color: string) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    this.spawnSparkExplosion(x, y, '#ffffff');
    this.spawnSparkExplosion(x, y, color);
    this.spawnSmoke(x, y, 'rgba(50, 50, 50, 0.4)');
    this.spawnShockwave(x, y, '#ffffff', isLowQuality ? 50 : 80);
    if (!isLowQuality) {
      this.spawnShockwave(x, y, color, 120);
    }
    this.spawnGibs(x, y, color, isLowQuality ? 2 : 4);

    let extraCount = isLowQuality ? 3 : 8;
    extraCount = Math.max(1, Math.round(extraCount * this.vfxCountMultiplier));
    for (let i = 0; i < extraCount; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 500 + 200;
      
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 2 + 1;
      p.color = Math.random() > 0.5 ? '#ffffff' : color;
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.3 + Math.random() * 0.4;
      p.maxLife = 0.7;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }

    for (let i = 0; i < 2; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 20;
      
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + (Math.random() - 0.5) * 20;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 12 + 6;
      p.color = 'rgba(150, 150, 150, 0.4)';
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.8 + Math.random() * 0.8;
      p.maxLife = 1.6;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnClickPulse(x: number, y: number) {
    const sw = this.shockwaves[this.shockwaveIdx];
    sw.active = true;
    sw.x = x;
    sw.y = y;
    sw.radius = 1;
    sw.speed = 150;
    sw.color = '#ffffff';
    sw.life = 0.15;
    sw.maxLife = 0.15;
    this.shockwaveIdx = (this.shockwaveIdx + 1) % MAX_SHOCKWAVES;
  }

  spawnInputFeedback(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const sw = this.shockwaves[this.shockwaveIdx];
      sw.active = true;
      sw.x = x;
      sw.y = y;
      sw.radius = 5 + i * 5;
      sw.speed = 200 + i * 100;
      sw.color = i === 0 ? '#ffffff' : (i === 1 ? '#00ffff' : 'rgba(0, 255, 255, 0.5)');
      sw.life = 0.2;
      sw.maxLife = 0.2;
      this.shockwaveIdx = (this.shockwaveIdx + 1) % MAX_SHOCKWAVES;
    }
  }

  spawnLaser(x1: number, y1: number, x2: number, y2: number, color: string, width: number = 2) {
    const l = this.lasers[this.laserIdx];
    l.active = true;
    l.x1 = x1;
    l.y1 = y1;
    l.x2 = x2;
    l.y2 = y2;
    l.life = 0.15;
    l.maxLife = 0.15;
    l.color = color;
    l.width = width;
    this.laserIdx = (this.laserIdx + 1) % MAX_LASERS;
    
    const count = Math.max(1, Math.round(10 * this.vfxCountMultiplier));
    for (let i = 0; i < count; i++) {
      this.spawnParticle(x2, y2, color, Math.random() * 3 + 1, 0.2 + Math.random() * 0.1);
    }
  }

  spawnSparkExplosion(x: number, y: number, color: string) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let count = isLowQuality ? 6 : 20;
    count = Math.max(1, Math.round(count * this.vfxCountMultiplier));
    for (let i = 0; i < count; i++) {
        const p = this.particles[this.particleIdx];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 600 + 200;
        
        p.active = true;
        p.type = 'spark';
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = Math.random() * 15 + 10;
        p.color = color;
        p.rotation = angle;
        p.life = 0.3 + Math.random() * 0.2;
        p.maxLife = p.life;
        
        this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnSmoke(x: number, y: number, color: string = 'rgba(100, 100, 100, 0.5)') {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let count = isLowQuality ? 2 : 5;
    count = Math.max(1, Math.round(count * this.vfxCountMultiplier));
    for (let i = 0; i < count; i++) {
        const p = this.particles[this.particleIdx];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 40 + 20;
        
        p.active = true;
        p.type = 'smoke';
        p.x = x + (Math.random() - 0.5) * 20;
        p.y = y + (Math.random() - 0.5) * 20;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = Math.random() * 30 + 20;
        p.color = color;
        p.rotation = Math.random() * Math.PI * 2;
        p.life = 1.0 + Math.random() * 1.0;
        p.maxLife = p.life;
        
        this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnParticle(x: number, y: number, color: string, size: number = 5, life: number = 0.5) {
    const p = this.particles[this.particleIdx];
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 200 + 50;
    
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = size;
    p.color = color;
    p.rotation = Math.random() * Math.PI * 2;
    p.life = life;
    p.maxLife = life;
    
    this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
  }
}
