import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem } from '../game/ParticleSystem';

describe('ParticleSystem', () => {
  let ps: ParticleSystem;

  beforeEach(() => {
    ps = new ParticleSystem();
  });

  describe('initialization', () => {
    it('should allocate fixed-size particle pools', () => {
      expect(ps.particles.length).toBe(500);
      expect(ps.splatters.length).toBe(100);
      expect(ps.shockwaves.length).toBe(50);
      expect(ps.lasers.length).toBe(50);
      expect(ps.muzzleFlashes.length).toBe(20);
    });

    it('should initialize all pool elements as inactive', () => {
      expect(ps.particles.every(p => !p.active)).toBe(true);
      expect(ps.splatters.every(s => !s.active)).toBe(true);
      expect(ps.shockwaves.every(sw => !sw.active)).toBe(true);
      expect(ps.lasers.every(l => !l.active)).toBe(true);
      expect(ps.muzzleFlashes.every(f => !f.active)).toBe(true);
    });

    it('should have correct number of drops per splatter', () => {
      for (const s of ps.splatters) {
        expect(s.drops.length).toBe(16);
      }
    });

    it('should start with zero indices', () => {
      expect(ps.particleIdx).toBe(0);
      expect(ps.splatterIdx).toBe(0);
      expect(ps.shockwaveIdx).toBe(0);
      expect(ps.laserIdx).toBe(0);
      expect(ps.muzzleFlashIdx).toBe(0);
    });

    it('should have vfxCountMultiplier of 1 when no engine', () => {
      expect(ps.vfxCountMultiplier).toBe(1.0);
    });
  });

  describe('reset', () => {
    it('should deactivate all particles, splatters, shockwaves, lasers, muzzleFlashes', () => {
      // Activate some
      ps.spawnParticle(100, 100, '#ffffff');
      ps.spawnSplatter(200, 200, '#ff0000');
      ps.spawnShockwave(300, 300, '#00ff00', 100);
      ps.spawnLaser(0, 0, 100, 100, '#0000ff', 2);
      ps.spawnMuzzleFlash(50, 50, 40);

      expect(ps.particles.some(p => p.active)).toBe(true);
      expect(ps.splatters.some(s => s.active)).toBe(true);
      expect(ps.shockwaves.some(sw => sw.active)).toBe(true);
      expect(ps.lasers.some(l => l.active)).toBe(true);
      expect(ps.muzzleFlashes.some(f => f.active)).toBe(true);

      ps.reset();

      expect(ps.particles.every(p => !p.active)).toBe(true);
      expect(ps.splatters.every(s => !s.active)).toBe(true);
      expect(ps.shockwaves.every(sw => !sw.active)).toBe(true);
      expect(ps.lasers.every(l => !l.active)).toBe(true);
      expect(ps.muzzleFlashes.every(f => !f.active)).toBe(true);
    });
  });

  describe('spawnParticle', () => {
    it('should create a single active particle at given position', () => {
      ps.spawnParticle(150, 250, '#ff00ff', 8, 1.0);

      const active = ps.particles.filter(p => p.active);
      expect(active.length).toBe(1);
      const p = active[0];
      expect(p.x).toBe(150);
      expect(p.y).toBe(250);
      expect(p.color).toBe('#ff00ff');
      expect(p.size).toBe(8);
      expect(p.life).toBe(1.0);
      expect(p.maxLife).toBe(1.0);
      expect(p.rotation).toBeDefined();
    });

    it('should advance the particle index', () => {
      const idx = ps.particleIdx;
      ps.spawnParticle(0, 0, '#fff');
      expect(ps.particleIdx).toBe((idx + 1) % 500);
    });

    it('should wrap around the pool', () => {
      // Force idx to near max
      ps.particleIdx = 498;
      ps.spawnParticle(0, 0, '#fff');
      expect(ps.particleIdx).toBe(499);
      ps.spawnParticle(0, 0, '#fff');
      expect(ps.particleIdx).toBe(0);
    });
  });

  describe('spawnMuzzleFlash', () => {
    it('should create a muzzle flash with correct properties', () => {
      ps.spawnMuzzleFlash(100, 200, 50);

      const active = ps.muzzleFlashes.filter(f => f.active);
      expect(active.length).toBe(1);
      const f = active[0];
      expect(f.x).toBe(100);
      expect(f.y).toBe(200);
      expect(f.size).toBe(50);
      expect(f.life).toBe(0.05);
      expect(f.maxLife).toBe(0.05);
    });

    it('should default size to 40', () => {
      ps.spawnMuzzleFlash(0, 0);
      expect(ps.muzzleFlashes[ps.muzzleFlashIdx === 0 ? 19 : ps.muzzleFlashIdx - 1].size).toBe(40);
    });
  });

  describe('spawnShockwave', () => {
    it('should create a shockwave with correct properties', () => {
      ps.spawnShockwave(300, 400, '#ff0000', 200);

      const active = ps.shockwaves.filter(sw => sw.active);
      expect(active.length).toBe(1);
      const sw = active[0];
      expect(sw.x).toBe(300);
      expect(sw.y).toBe(400);
      expect(sw.color).toBe('#ff0000');
      expect(sw.radius).toBe(10);
      expect(sw.speed).toBe(600); // maxRadius * 3
      expect(sw.life).toBe(0.3);
      expect(sw.maxLife).toBe(0.3);
    });
  });

  describe('spawnSplatter', () => {
    it('should create a splatter with 16 active drops', () => {
      ps.spawnSplatter(150, 150, '#00ff00');

      const active = ps.splatters.filter(s => s.active);
      expect(active.length).toBe(1);
      const s = active[0];
      expect(s.x).toBe(150);
      expect(s.y).toBe(150);
      expect(s.color).toBe('#00ff00');
      expect(s.life).toBe(5);
      expect(s.maxLife).toBe(5);
      expect(s.size).toBeGreaterThanOrEqual(10);
      expect(s.size).toBeLessThanOrEqual(25);

      const activeDrops = s.drops.filter(d => d.active);
      expect(activeDrops.length).toBe(16);
    });
  });

  describe('spawnGibs', () => {
    it('should create multiple particles at given position', () => {
      ps.spawnGibs(100, 100, '#ffffff', 10);

      const active = ps.particles.filter(p => p.active);
      expect(active.length).toBe(10);
      for (const p of active) {
        expect(p.x).toBe(100);
        expect(p.y).toBe(100);
        expect(p.color).toBe('#ffffff');
      }
    });

    it('should use default count of 15', () => {
      ps.spawnGibs(0, 0, '#fff');
      const count = ps.particles.filter(p => p.active).length;
      expect(count).toBe(15);
    });
  });

  describe('spawnMissParticles', () => {
    it('should create particles and a click pulse shockwave', () => {
      ps.spawnMissParticles(200, 200);

      expect(ps.particles.some(p => p.active)).toBe(true);
      expect(ps.shockwaves.some(sw => sw.active)).toBe(true);
    });

    it('should create 8 particles by default', () => {
      ps.spawnMissParticles(0, 0);
      const count = ps.particles.filter(p => p.active).length;
      expect(count).toBe(8);
    });
  });

  describe('spawnExplosion', () => {
    it('should spawn particles and shockwaves', () => {
      ps.spawnExplosion(300, 300, '#ff0000');

      expect(ps.particles.some(p => p.active)).toBe(true);
      expect(ps.shockwaves.some(sw => sw.active)).toBe(true);
    });

    it('should create at least 2 shockwaves (white + color)', () => {
      ps.spawnExplosion(0, 0, '#ff0000');
      const swCount = ps.shockwaves.filter(sw => sw.active).length;
      expect(swCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('spawnClickPulse', () => {
    it('should create a shockwave with radius 1 and fast speed', () => {
      ps.spawnClickPulse(50, 50);

      const active = ps.shockwaves.filter(sw => sw.active);
      expect(active.length).toBe(1);
      const sw = active[0];
      expect(sw.x).toBe(50);
      expect(sw.y).toBe(50);
      expect(sw.radius).toBe(1);
      expect(sw.speed).toBe(150);
      expect(sw.life).toBe(0.15);
    });
  });

  describe('spawnInputFeedback', () => {
    it('should create 3 shockwaves', () => {
      ps.spawnInputFeedback(100, 100);

      const active = ps.shockwaves.filter(sw => sw.active);
      expect(active.length).toBe(3);
    });

    it('should have increasing speeds', () => {
      ps.spawnInputFeedback(0, 0);
      const active = ps.shockwaves.filter(sw => sw.active);
      expect(active[0].speed).toBe(200);
      expect(active[1].speed).toBe(300);
      expect(active[2].speed).toBe(400);
    });
  });

  describe('spawnLaser', () => {
    it('should create a laser with correct endpoints', () => {
      ps.spawnLaser(0, 0, 100, 200, '#ff00ff', 3);

      const active = ps.lasers.filter(l => l.active);
      expect(active.length).toBe(1);
      const l = active[0];
      expect(l.x1).toBe(0);
      expect(l.y1).toBe(0);
      expect(l.x2).toBe(100);
      expect(l.y2).toBe(200);
      expect(l.color).toBe('#ff00ff');
      expect(l.width).toBe(3);
      expect(l.life).toBe(0.15);
    });

    it('should also spawn particles at target point', () => {
      ps.spawnLaser(0, 0, 100, 100, '#fff');
      expect(ps.particles.some(p => p.active && p.x === 100 && p.y === 100)).toBe(true);
    });
  });

  describe('spawnSparkExplosion', () => {
    it('should create multiple spark particles', () => {
      ps.spawnSparkExplosion(150, 150, '#ffff00');

      const active = ps.particles.filter(p => p.active && p.type === 'spark');
      expect(active.length).toBeGreaterThan(0);
      for (const p of active) {
        expect(p.x).toBe(150);
        expect(p.y).toBe(150);
        expect(p.color).toBe('#ffff00');
      }
    });

    it('should create 20 sparks by default', () => {
      ps.spawnSparkExplosion(0, 0, '#fff');
      const count = ps.particles.filter(p => p.active && p.type === 'spark').length;
      expect(count).toBe(20);
    });
  });

  describe('spawnSmoke', () => {
    it('should create smoke-type particles', () => {
      ps.spawnSmoke(250, 250, 'rgba(100,100,100,0.5)');

      const active = ps.particles.filter(p => p.active && p.type === 'smoke');
      expect(active.length).toBeGreaterThan(0);
      for (const p of active) {
        expect(p.color).toBe('rgba(100,100,100,0.5)');
      }
    });

    it('should create 5 smoke particles by default', () => {
      ps.spawnSmoke(0, 0);
      const count = ps.particles.filter(p => p.active && p.type === 'smoke').length;
      expect(count).toBe(5);
    });
  });

  describe('update', () => {
    it('should decrease particle life and deactivate expired ones', () => {
      ps.spawnParticle(0, 0, '#fff', 5, 0.5);
      ps.update(0.3);

      const p = ps.particles.find(p => p.active)!;
      expect(p.life).toBeCloseTo(0.2, 1);
    });

    it('should deactivate particles whose life reaches 0', () => {
      ps.spawnParticle(0, 0, '#fff', 5, 0.1);
      ps.update(0.2);

      expect(ps.particles.every(p => !p.active)).toBe(true);
    });

    it('should move particles by velocity', () => {
      const p = ps.particles[ps.particleIdx];
      ps.spawnParticle(100, 100, '#fff', 5, 1.0);
      // The particle has random velocity, but we can check it moved
      const originalX = p.x;
      ps.update(0.5);
      expect(p.x).not.toBe(originalX);
    });

    it('should expand shockwave radius over time', () => {
      ps.spawnShockwave(0, 0, '#fff', 100);
      const sw = ps.shockwaves.find(sw => sw.active)!;
      const originalRadius = sw.radius;
      ps.update(0.1);
      expect(sw.radius).toBeGreaterThan(originalRadius);
    });

    it('should deactivate shockwaves when life expires', () => {
      ps.spawnShockwave(0, 0, '#fff', 100);
      ps.update(0.4);
      expect(ps.shockwaves.every(sw => !sw.active)).toBe(true);
    });

    it('should deactivate expired lasers', () => {
      ps.spawnLaser(0, 0, 100, 100, '#fff', 2);
      ps.update(0.2);
      expect(ps.lasers.every(l => !l.active)).toBe(true);
    });

    it('should deactivate expired muzzle flashes', () => {
      ps.spawnMuzzleFlash(0, 0, 40);
      ps.update(0.1);
      expect(ps.muzzleFlashes.every(f => !f.active)).toBe(true);
    });

    it('should handle multiple updates without errors', () => {
      ps.spawnParticle(0, 0, '#fff', 5, 2.0);
      ps.spawnShockwave(0, 0, '#fff', 100);
      ps.spawnLaser(0, 0, 100, 100, '#fff', 2);
      
      for (let i = 0; i < 50; i++) {
        ps.update(0.016);
      }
      
      // Particle has maxLife=2.0 so still active after 50*0.016=0.8s
      expect(ps.shockwaves.every(sw => !sw.active)).toBe(true);
      expect(ps.lasers.every(l => !l.active)).toBe(true);
    });

    it('should not throw when updating with empty pools', () => {
      expect(() => ps.update(0.1)).not.toThrow();
    });
  });

  describe('vfxCountMultiplier', () => {
    it('should use engine renderer vfxScalar when available', () => {
      ps.engine = { isMobile: false, highFidelityVFX: true, renderer: { vfxScalar: 0.5 } };
      expect(ps.vfxCountMultiplier).toBe(0.5);
    });

    it('should return 1 when engine has no renderer', () => {
      ps.engine = { isMobile: false, highFidelityVFX: true };
      expect(ps.vfxCountMultiplier).toBe(1.0);
    });
  });
});
