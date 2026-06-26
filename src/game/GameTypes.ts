import { ResourceType } from './ResourceTypes';

export interface Bug { 
  id?: string;
  active: boolean; 
  x: number; 
  y: number; 
  type: string; 
  variantId?: string; // New field for boss variety
  speed: number; 
  color: string; 
  size: number; 
  scoreValue: number; 
  hp: number; 
  maxHp: number; 
  walkCycle: number; 
  rotation: number; 
  offsetTime: number; 
  hitTimer: number;
  // Bug specific fields
  lastTeleportTime?: number;
  armor?: number;
  isHealing?: boolean;
  healCooldown?: number;
  healEffectTimer?: number;
  lavaTimer?: number;
  webTimer?: number; // New mechanic for spider boss
  // Boss fields
  phase?: number;
  abilityTimer?: number;
  isShielded?: boolean;
  // Visual fields for bloom/lighting
  glowColor?: string;
  glowRadius?: number;
  lightRadius?: number;
  lightColor?: string;
}

export interface Hazard {
    id: string;
    x: number;
    y: number;
    radius: number;
    type: 'barrage' | 'shockwave' | 'lava' | 'web';
    timer: number;
    duration: number;
    active: boolean;
}

export interface Powerup { active: boolean; x: number; y: number; type: string; color: string; icon: string; life: number; maxLife: number; size: number; collection: string; }
export interface ResourcePickup { active: boolean; x: number; y: number; type: ResourceType; color: string; life: number; maxLife: number; size: number; }
