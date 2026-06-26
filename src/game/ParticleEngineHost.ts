/**
 * Minimal engine surface required by ParticleSystem (avoids circular imports with GameEngine).
 */
export interface ParticleEngineHost {
  isMobile: boolean;
  highFidelityVFX: boolean;
  renderer?: {
    vfxScalar: number;
  };
}