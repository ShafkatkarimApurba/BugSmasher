import fs from 'fs';
import path from 'path';

const src = fs.readFileSync('src/game/Renderer.ts', 'utf8');
const lines = src.split('\n');

const imports = `import { GameEngine } from '../GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from '../GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from '../ParticleSystem';
import { assetManager } from '../AssetManager';
import { GameConfig } from '../GameConfig';
import { getActiveCoreThemeConfig } from '../CosmeticsManager';
import type { Renderer } from '../Renderer';
import type { PerformanceScaler } from './PerformanceScaler';
`;

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function wrap(className, body, extra = '') {
  return `${imports}${extra}
export class ${className} {
  constructor(
    protected engine: GameEngine,
    protected parent: Renderer,
    protected scaler: PerformanceScaler
  ) {}

  protected get isLowEnd() { return this.parent.isLowEnd; }
  protected get currentFps() { return this.scaler.currentFps; }
  protected get vfxScalar() { return this.scaler.vfxScalar; }
  protected get meshComplexityStep() { return this.scaler.meshComplexityStep; }

${body}
}
`;
}

// PerformanceScaler: lines 17-85 (0-indexed 16-84) - fields + updatePerformanceScaler
const perfBody = slice(17, 85).replace('private ', '');
fs.writeFileSync(
  'src/game/rendering/PerformanceScaler.ts',
  `${imports}
export class PerformanceScaler {
${perfBody}
}
`
);

// UIRenderer: 245-353
fs.writeFileSync(
  'src/game/rendering/UIRenderer.ts',
  wrap('UIRenderer', slice(245, 353))
);

// EnvironmentRenderer: 355-792
fs.writeFileSync(
  'src/game/rendering/EnvironmentRenderer.ts',
  wrap('EnvironmentRenderer', slice(355, 792))
);

// BugRenderer: 793-1814
fs.writeFileSync(
  'src/game/rendering/BugRenderer.ts',
  wrap('BugRenderer', slice(793, 1814))
);

// ParticleRenderer: 1815-2118, fix drawResource type
let particleBody = slice(1815, 2118).replace('drawResource(r: any)', 'drawResource(r: ResourcePickup)');
fs.writeFileSync(
  'src/game/rendering/ParticleRenderer.ts',
  wrap('ParticleRenderer', particleBody)
);

console.log('Split complete');