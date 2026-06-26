export const GameConfig = {
  canvas: {
    mobileDprCap: 1.5,
    desktopDprCap: 2,
  },
  player: {
    maxHealth: 100,
    hitDamage: 10,
    baseClickRadiusMultiplier: 2.5,
  },
  upgrades: {
    health: { 
      baseCost: 300, 
      costMultiplier: 200, 
      healAmount: 50 
    },
    radius: { 
      baseCost: 500, 
      costMultiplier: 300, 
      radiusMultiplier: 1.25 
    },
    turret: { 
      baseCost: 1000, 
      costMultiplier: 500, 
      baseFireRate: 1.5, 
      fireRateReduction: 0.2, 
      minFireRate: 0.2 
    },
  },
  bugs: {
    basic: { color: '#4CAF50', baseSpeed: 50, speedPerWave: 5, size: 15, score: 10, baseHp: 1, hpPerWave: 0 },
    scout: { color: '#9C27B0', baseSpeed: 100, speedPerWave: 10, size: 12, score: 20, baseHp: 1, hpPerWave: 0 },
    tank:  { color: '#ff00ff', baseSpeed: 30, speedPerWave: 3, size: 25, score: 50, baseHp: 3, hpPerWave: 0.33 },
    swarmer: { color: '#FF9800', baseSpeed: 40, speedPerWave: 4, size: 18, score: 30, baseHp: 2, hpPerWave: 0.1 },
    mini: { color: '#ffaa00', baseSpeed: 120, speedPerWave: 8, size: 8, score: 5, baseHp: 1, hpPerWave: 0 },
    ghost: { color: '#e0e0ff', baseSpeed: 60, speedPerWave: 5, size: 15, score: 40, baseHp: 1, hpPerWave: 0 },
    phase: { color: '#d400ff', baseSpeed: 45, speedPerWave: 6, size: 16, score: 45, baseHp: 2, hpPerWave: 0.15 },
    ember: { color: '#ff5500', baseSpeed: 35, speedPerWave: 4, size: 20, score: 55, baseHp: 4, hpPerWave: 0.4 },
    frost: { color: '#00b3ff', baseSpeed: 80, speedPerWave: 12, size: 14, score: 35, baseHp: 1.5, hpPerWave: 0.05 },
    healer: { color: '#33ff77', baseSpeed: 40, speedPerWave: 3, size: 22, score: 100, baseHp: 10, hpPerWave: 1.0 },
    boss: { 
      color: '#ff2255', 
      baseSpeed: 20, 
      speedPerWave: 2, 
      size: 60, 
      score: 5000, 
      baseHp: 100, 
      hpPerWave: 50,
      attackRate: 3.5,
      minionSpawnCount: 4,
      glitchChance: 0.15,
      barrageRate: 8.0,
      barrageCount: 5,
      barrageWarningTime: 1.5,
      barrageRadius: 80,
      shieldDuration: 6.0,
      variants: [
        { id: 'arachne', name: 'Arachne-Prime', color: '#ff0066', logic: 'spider' },
        { id: 'mandible', name: 'Steel Mandible', color: '#ff9900', logic: 'ant' },
        { id: 'moth', name: 'Moth-Caster', color: '#00ffff', logic: 'moth' }
      ]
    },
  },
  biomes: {
    neon_core: { id: 'neon_core', name: 'Neon Core', color: '#39ff14', description: 'Standard gameplay environment.', minWave: 1 },
    quantum_void: { id: 'quantum_void', name: 'Quantum Void', color: '#bb00ff', description: 'Phase bugs teleport unpredictably.', minWave: 5 },
    ember_depths: { id: 'ember_depths', name: 'Ember Depths', color: '#ff4400', description: 'Armored tanks require burst damage.', minWave: 10 },
    frostbyte: { id: 'frostbyte', name: 'Frostbyte', color: '#00ccff', description: 'Fast scout swarms; use AoE.', minWave: 15 },
    void_abyss: { id: 'void_abyss', name: 'Void Abyss', color: '#ffffff', description: 'Bugs teleport unpredictably.', minWave: 20 },
    golden_cache: { id: 'golden_cache', name: 'Golden Cache', color: '#ffcc00', description: 'Split bugs spawn mini-bugs.', minPrestige: 1 },
    golden_spire: { id: 'golden_spire', name: 'Golden Spire', color: '#ffcc00', description: 'Regenerating elites.', minPrestige: 3 },
  },
  powerups: {
    dropChance: 0.15,
    duration: 10, // shield/multiplier/rapid_fire
    life: 8, // time on ground
    types: [
      { type: 'shield', color: '#00ccff', icon: 'S', collection: 'click' },
      { type: 'multiplier', color: '#ffffff', icon: '2X', collection: 'hover' },
      { type: 'nuke', color: '#ff3333', icon: 'X', collection: 'click' },
      { type: 'rapid_fire', color: '#ffcc00', icon: 'RF', collection: 'hover' },
      { type: 'slow_mo', color: '#33ff99', icon: 'SM', collection: 'hover' },
      { type: 'freeze', color: '#00ffff', icon: 'FR', collection: 'hover' },
      { type: 'magnet', color: '#ff00cc', icon: 'M', collection: 'hover' },
      { type: 'spike_burst', color: '#ff3300', icon: 'SB', collection: 'click' },
      { type: 'overdrive', color: '#ff6600', icon: '!!', collection: 'click' },
      { type: 'repair_cell', color: '#00ffaa', icon: '+', collection: 'click' }
    ]
  },
  waves: {
    baseBugs: 10,
    bugsPerWave: 5,
    baseSpawnRate: 1.5,
    spawnRateReduction: 0.1,
    minSpawnRate: 0.1,
  }
};
