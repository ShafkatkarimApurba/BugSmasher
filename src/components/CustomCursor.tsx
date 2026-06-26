import { useEffect, useState, useRef } from 'react';
import { getActiveSkin } from '../game/DailyChallengeManager';
import { GameEngineStatusBus, type GameEngineStatus } from '../game/GameEngineStatusBus';

interface VentParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export function CustomCursor() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [trailOffset, setTrailOffset] = useState({ dx: 0, dy: 0 });
  
  // Game states we track for color transformations
  const [biome, setBiome] = useState('neon_core');
  const [healthPercent, setHealthPercent] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [weaponHeat, setWeaponHeat] = useState(0);
  const [isOverheated, setIsOverheated] = useState(false);

  // New features state
  const [dashCooldownTimer, setDashCooldownTimer] = useState(0);
  const [dashCooldown, setDashCooldown] = useState(3.0);
  const [rapidFireActive, setRapidFireActive] = useState(false);
  const [spikeBurstActive, setSpikeBurstActive] = useState(false);
  const [lastCritTime, setLastCritTime] = useState(0);

  // Active cursor skin from daily challenge rewards
  const [activeSkin, setActiveSkin] = useState<string | null>(null);
  useEffect(() => {
    if (!isMobileDevice) {
      setActiveSkin(getActiveSkin());
    }
  }, [isMobileDevice]);
  
  const currentPosRef = useRef({ x: -100, y: -100 });
  const trailPosRef = useRef({ x: -100, y: -100 });
  const requestRef = useRef<number | null>(null);
  const lastStateRef = useRef({ biome: 'neon_core', healthPercent: 1, intensity: 1 });

  // Spring physics variables for heavy/tactile Cursor Ring
  const ringPosRef = useRef({ x: -100, y: -100 });
  const ringVelRef = useRef({ x: 0, y: 0 });
  const [ringTransform, setRingTransform] = useState({ dx: 0, dy: 0, angle: 0, scaleX: 1, scaleY: 1 });

  // Refs for venting steam particles
  const ventCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<VentParticle[]>([]);

  useEffect(() => {
    const isMobile = (window.innerWidth < 768) || 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0) ||
      ('ontouchstart' in window);
    setIsMobileDevice(isMobile);
  }, []);

  const applyEngineStatus = (status: GameEngineStatus | null) => {
    if (!status) {
      if (lastStateRef.current.biome !== 'neon_core') {
        lastStateRef.current = { biome: 'neon_core', healthPercent: 1, intensity: 1 };
        setBiome('neon_core');
        setHealthPercent(1);
        setIntensity(1);
        setWeaponHeat(0);
        setIsOverheated(false);
      }
      return;
    }
    const pct = status.maxHealth > 0 ? status.health / status.maxHealth : 1;
    const biomeVal = status.currentBiome || 'neon_core';
    const intensityVal = Math.round((status.intensity || 1) * 100) / 100;
    setWeaponHeat(status.weaponHeat || 0);
    setIsOverheated(!!status.isOverheated);
    setDashCooldownTimer(status.dashCooldownTimer || 0);
    setDashCooldown(status.dashCooldown || 3.0);
    setRapidFireActive(!!(status.rapidFireTimer && status.rapidFireTimer > 0));
    setSpikeBurstActive(!!(status.spikeBurstTimer && status.spikeBurstTimer > 0));
    if (
      biomeVal !== lastStateRef.current.biome ||
      Math.abs(pct - lastStateRef.current.healthPercent) > 0.01 ||
      Math.abs(intensityVal - lastStateRef.current.intensity) > 0.05
    ) {
      lastStateRef.current = { biome: biomeVal, healthPercent: pct, intensity: intensityVal };
      setBiome(biomeVal);
      setHealthPercent(pct);
      setIntensity(intensityVal);
    }
  };

  useEffect(() => {
    if (isMobileDevice) return;
    return GameEngineStatusBus.subscribe(applyEngineStatus);
  }, [isMobileDevice]);

  // Listen for critical hit notifications from the Engine
  useEffect(() => {
    if (isMobileDevice) return;
    const handleCritHit = () => {
      setLastCritTime(performance.now());
    };
    window.addEventListener('nexus_crit_hit', handleCritHit);
    return () => {
      window.removeEventListener('nexus_crit_hit', handleCritHit);
    };
  }, [isMobileDevice]);

  useEffect(() => {
    if (isMobileDevice) return;
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setPos({ x: clientX, y: clientY });
      currentPosRef.current = { x: clientX, y: clientY };
      
      if (trailPosRef.current.x === -100) {
        trailPosRef.current = { x: clientX, y: clientY };
      }
      if (ringPosRef.current.x === -100) {
        ringPosRef.current = { x: clientX, y: clientY };
      }

      // Detect hover over interactive elements or powerups
      const target = e.target as HTMLElement | null;
      if (target) {
        const hasInteractiveHover = !!(
          target.tagName === 'BUTTON' ||
          target.closest('button') ||
          target.closest('a') ||
          target.classList.contains('cursor-pointer') ||
          target.closest('.cursor-pointer') ||
          target.closest('[role="button"]') ||
          target.closest('.interactive') ||
          target.closest('.glass-panel') ||
          target.getAttribute('data-hovering-game-object') === 'true' ||
          (target.tagName === 'CANVAS' && target.getAttribute('data-hovering-game-object') === 'true')
        );
        setIsHoveringInteractive(hasInteractiveHover);
      } else {
        setIsHoveringInteractive(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobileDevice]);

  // Animate the trajectory trail line and spring physics behind the cursor
  useEffect(() => {
    if (isMobileDevice) return;
    let lastTime = performance.now();
    const animateTrail = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const target = currentPosRef.current;
      const trail = trailPosRef.current;
      const ring = ringPosRef.current;
      
      if (target.x !== -100 && trail.x !== -100) {
        // Smoothly lerp trailing dot position to catch up
        const lerpFactor = 0.22; // Quick but noticeable elastic lag
        trail.x += (target.x - trail.x) * lerpFactor;
        trail.y += (target.y - trail.y) * lerpFactor;
        
        // Offset is distance vector from current mouse to trailing position
        const dx = trail.x - target.x;
        const dy = trail.y - target.y;
        
        // Render trail line if the distance is significant
        if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
          setTrailOffset({ dx: 0, dy: 0 });
        } else {
          setTrailOffset({ dx, dy });
        }
      }

      // Standard spring-dampener physics equations for heavy / mechanical feeling
      if (target.x !== -100 && ring.x !== -100) {
        const stiffness = 220; // Mechanical resistance strength
        const damping = 18;     // Solid dampening prevents infinite wiggle
        
        const ax = stiffness * (target.x - ring.x) - damping * ringVelRef.current.x;
        const ay = stiffness * (target.y - ring.y) - damping * ringVelRef.current.y;
        
        ringVelRef.current.x += ax * dt;
        ringVelRef.current.y += ay * dt;
        ring.x += ringVelRef.current.x * dt;
        ring.y += ringVelRef.current.y * dt;

        // Calculate velocity vector for direction and squish factor
        const vx = ringVelRef.current.x;
        const vy = ringVelRef.current.y;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const stretchFactor = Math.min(0.24, speed * 0.00015);
        const ringAngle = Math.atan2(vy, vx);

        // Map displacement values
        const rdx = ring.x - target.x;
        const rdy = ring.y - target.y;

        setRingTransform({
          dx: rdx,
          dy: rdy,
          angle: ringAngle,
          scaleX: 1 + stretchFactor,
          scaleY: 1 - stretchFactor
        });
      }

      // Update steam venting particle canvas overlay
      const canvas = ventCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = 120;
          const dpr = window.devicePixelRatio || 1;
          if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            ctx.scale(dpr, dpr);
          }
          ctx.clearRect(0, 0, size, size);

          // Emit steam particles
          // If overheated, emit very dense active venting steam. If high heat, emit minor venting steam.
          const emitChance = isOverheated ? 0.8 : (weaponHeat > 60 ? 0.25 : 0.0);
          if (emitChance > 0 && Math.random() < emitChance) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 12 + Math.random() * 8;
            const px = size / 2 + Math.cos(angle) * dist;
            const py = size / 2 + Math.sin(angle) * dist;
            
            // upward drifting speeds
            const speedX = Math.cos(angle) * 0.4 + (Math.random() - 0.5) * 0.3;
            const speedY = -0.5 - Math.random() * 1.5; // Rise up
            
            const heatColor = isOverheated 
              ? (Math.random() < 0.3 ? 'rgba(239, 68, 68, 0.5)' : Math.random() < 0.6 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(220, 220, 220, 0.45)') 
              : 'rgba(200, 200, 200, 0.3)';

            particlesRef.current.push({
              x: px,
              y: py,
              vx: speedX,
              vy: speedY,
              size: 2.2 + Math.random() * 2.5,
              alpha: 0.55 + Math.random() * 0.35,
              life: 0.35 + Math.random() * 0.35,
              maxLife: 0.7,
              color: heatColor
            });
          }

          // Update & draw particles with a trail effect
          particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            p.size += dt * 5; // Expand as it dissipates
            p.alpha = Math.max(0, (p.life / p.maxLife) * 0.7);

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();

            return p.life > 0;
          });
          ctx.globalAlpha = 1.0;
        }
      }

      requestRef.current = requestAnimationFrame(animateTrail);
    };
    
    requestRef.current = requestAnimationFrame(animateTrail);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [weaponHeat, isOverheated, isMobileDevice]);

  if (isMobileDevice) return null;

  const hasTrail = trailOffset.dx !== 0 || trailOffset.dy !== 0;
  const isCritical = healthPercent < 0.3;
  const hasWeaponMode = rapidFireActive || spikeBurstActive;

  // Determine styling based on active biome & game metrics
  const cursorRingClass = [
    'custom-cursor-ring',
    `biome-${biome}`,
    isHoveringInteractive ? 'hovering' : '',
    isClicking ? 'clicking' : '',
    isCritical ? 'critical-health' : '',
    hasWeaponMode ? 'has-weapon-mode' : '',
    activeSkin ? `cursor-skin-${activeSkin}` : ''
  ].filter(Boolean).join(' ');

  // Direct element custom property injection for elite visual flair
  const customProperties = {
    '--biome-intensity': intensity,
  } as React.CSSProperties;

  // Active critical hit golden overlay effect calculations
  const critActive = performance.now() - lastCritTime < 250;
  const critProgress = critActive ? (performance.now() - lastCritTime) / 250 : 1;
  const critScale = critActive ? 1.0 + Math.sin(critProgress * Math.PI) * 0.50 : 1.0;

  const critCustomProperties = critActive ? {
    '--cursor-color': '#ffd700',
    '--cursor-shadow': 'rgba(255, 215, 0, 0.95)',
  } : {};

  // Compute dash cooldown replenishment progress (filled up when charges ready)
  const dashCooldownPercent = dashCooldownTimer > 0 ? (1 - dashCooldownTimer / dashCooldown) : 1;

  return (
    <div 
      className="custom-cursor-container"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Venting steam canvas overlay centered relative to physics cursor */}
      <canvas
        ref={ventCanvasRef}
        className="absolute pointer-events-none select-none"
        style={{
          width: '120px',
          height: '120px',
          left: `calc(50% + ${ringTransform.dx}px)`,
          top: `calc(50% + ${ringTransform.dy}px)`,
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}
      />

      {/* Dynamic line indicating motion trajectory vector / direction from mouse center */}
      {hasTrail && (
        <svg 
          className="absolute overflow-visible pointer-events-none" 
          style={{ left: 0, top: 0, width: 1, height: 1 }}
        >
          <line
            x1="0"
            y1="0"
            x2={trailOffset.dx}
            y2={trailOffset.dy}
            stroke={critActive ? '#ffd700' : "var(--cursor-color, rgba(255, 255, 255, 0.45))"}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_2px_rgba(0,0,0,0.85)]"
          />
        </svg>
      )}

      {/* Primary gameplay / UI cursor ring (subjected to spring translations, stretches, & crits) */}
      <div 
        className={cursorRingClass}
        style={{
          ...customProperties,
          ...critCustomProperties,
          transform: `translate3d(${ringTransform.dx}px, ${ringTransform.dy}px, 0) rotate(${ringTransform.angle}rad) scale(${ringTransform.scaleX * critScale}, ${ringTransform.scaleY * critScale}) rotate(${-ringTransform.angle}rad)`
        }}
      >
        {/* Rapid Fire overlay center icon */}
        {rapidFireActive && (
          <div className="absolute inset-0 flex items-center justify-center text-[#ffcc00] animate-pulse">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current drop-shadow-[0_0_3px_#ffcc00]">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}

        {/* Spike Burst overlay center icon */}
        {spikeBurstActive && (
          <div className="absolute inset-0 flex items-center justify-center text-[#ff3300] animate-spin" style={{ animationDuration: '4s' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current drop-shadow-[0_0_3px_#ff3300]">
              <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Dash-Charge Radial Cooldown Progress Track (only visible when recharging) */}
      {dashCooldownPercent < 1 && (
        <svg
          className="absolute pointer-events-none overflow-visible"
          style={{
            width: '46px',
            height: '46px',
            left: `calc(50% + ${ringTransform.dx}px)`,
            top: `calc(50% + ${ringTransform.dy}px)`,
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            zIndex: 5
          }}
        >
          {/* Track background */}
          <circle
            cx="23"
            cy="23"
            r="19"
            fill="transparent"
            stroke="rgba(0, 243, 255, 0.1)"
            strokeWidth="1.5"
            strokeDasharray="119.38"
          />
          {/* Charging stroke */}
          <circle
            cx="23"
            cy="23"
            r="19"
            fill="transparent"
            stroke="#00f3ff"
            strokeWidth="2"
            strokeDasharray="119.38"
            strokeDashoffset={119.38 * (1 - dashCooldownPercent)}
            strokeLinecap="round"
            className="transition-all duration-75"
            style={{
              filter: 'drop-shadow(0 0 4px #00f3ff)'
            }}
          />
        </svg>
      )}

      {/* Weapon Heat Ring Progress Meter centered with physics offset */}
      {weaponHeat > 0 && (
        <svg
          className="absolute pointer-events-none overflow-visible"
          style={{
            width: '42px',
            height: '42px',
            left: `calc(50% + ${ringTransform.dx}px)`,
            top: `calc(50% + ${ringTransform.dy}px)`,
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            zIndex: 10
          }}
        >
          {/* Subtle background track */}
          <circle
            cx="21"
            cy="21"
            r="17"
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.4)"
            strokeWidth="2.5"
            strokeDasharray="106.81"
            className="drop-shadow-[0_0_1px_rgba(255,255,255,0.05)]"
          />
          {/* Active progress heat ring */}
          <circle
            cx="21"
            cy="21"
            r="17"
            fill="transparent"
            stroke={isOverheated ? '#f87171' : `rgba(239, 68, 68, ${0.45 + (weaponHeat / 100) * 0.55})`}
            strokeWidth="3"
            strokeDasharray="106.81"
            strokeDashoffset={106.81 * (1 - weaponHeat / 100)}
            strokeLinecap="round"
            className="transition-all duration-75"
            style={{
              filter: isOverheated 
                ? 'drop-shadow(0 0 5px #ef4444) drop-shadow(0 0 2px #f87171)' 
                : `drop-shadow(0 0 3px rgba(239, 68, 68, ${0.1 + (weaponHeat / 100) * 0.6}))`
            }}
          />
        </svg>
      )}

      {/* Overheat Alert Badge */}
      {isOverheated && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 font-mono text-[8px] font-black text-red-500 bg-black/80 border border-red-500/30 px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(239,68,68,0.5)] tracking-widest uppercase animate-pulse select-none whitespace-nowrap"
          style={{ 
            textShadow: '0 0 5px rgba(239, 68, 68, 0.8)',
            transform: `translate3d(calc(-50% + ${ringTransform.dx}px), ${ringTransform.dy}px, 0)`
          }}
        >
          OVERHEATED
        </div>
      )}
    </div>
  );
}
