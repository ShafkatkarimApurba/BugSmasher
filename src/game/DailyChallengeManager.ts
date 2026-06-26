/**
 * DailyChallengeManager — generates seed-based daily challenges,
 * applies unique modifiers, tracks completion, and manages streak/cosmetic rewards.
 *
 * Completely stateless (uses localStorage for persistence).
 * No external dependencies beyond localStorage & the game's resource types.
 */

export type ChallengeModifierId =
  | 'fast_bugs'
  | 'tank_wave'
  | 'glass_cannon'
  | 'darkness'
  | 'speed_demon'
  | 'scrap_hunger'
  | 'healer_horde'
  | 'boss_rush'
  | 'no_shield'
  | 'frostbite';

export interface ChallengeModifier {
  id: ChallengeModifierId;
  name: string;
  description: string;
  icon: string;
  flavor: string; // terminal-style flavor text
}

export type WinConditionType = 'wave' | 'score' | 'kills';

export interface WinCondition {
  type: WinConditionType;
  value: number;
  label: string;
}

export interface ChallengeReward {
  type: 'cursor_skin' | 'resources';
  id: string;
  name: string;
  description: string;
}

export interface DailyChallenge {
  date: string; // ISO date string YYYY-MM-DD
  seed: number;
  modifiers: ChallengeModifierId[];
  winCondition: WinCondition;
  rewards: ChallengeReward[];
  streakReward?: ChallengeReward; // bonus for 3+ day streak
}

export interface ChallengeResult {
  completed: boolean;
  score: number;
  wave: number;
  modifierConditions: Record<string, boolean>;
}

export interface CosmeticsState {
  unlockedSkins: string[];
  activeSkin: string | null;
}

/** All defined challenge modifiers with metadata. */
export const CHALLENGE_MODIFIERS: Record<ChallengeModifierId, ChallengeModifier> = {
  fast_bugs: {
    id: 'fast_bugs',
    name: 'Accelerated Evolution',
    description: 'All bugs move 40% faster.',
    icon: 'zap',
    flavor: '[ANOMALY] — Kinetic redundancy detected. Swarm velocity elevated.',
  },
  tank_wave: {
    id: 'tank_wave',
    name: 'Heavy Armor Division',
    description: 'Heavy tanks spawn 3x more frequently.',
    icon: 'shield',
    flavor: '[WARNING] — Armored battalion signature on long-range scanners.',
  },
  glass_cannon: {
    id: 'glass_cannon',
    name: 'Glass Cannon Protocol',
    description: '2x damage dealt, but only 50% core health.',
    icon: 'crosshair',
    flavor: '[OVERRIDE] — Offensive capacitors at maximum. Structural integrity compromised.',
  },
  darkness: {
    id: 'darkness',
    name: 'Signal Blackout',
    description: 'Reduced visibility. Core glow radius halved.',
    icon: 'moon',
    flavor: '[ALERT] — Photon emissions suppressed. Tactical visibility reduced.',
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Adrenaline Surge',
    description: 'Bug speed increases 2% per kill (max 80%).',
    icon: 'flame',
    flavor: '[LOG] — Swarm is adapting to engagement patterns. Threat escalation imminent.',
  },
  scrap_hunger: {
    id: 'scrap_hunger',
    name: 'Resource Famine',
    description: 'Resources worth 3x, but drop rate reduced by 60%.',
    icon: 'package',
    flavor: '[ECON] — Resource extraction efficiency critically degraded. Rationing protocol active.',
  },
  healer_horde: {
    id: 'healer_horde',
    name: 'Medical Emergency',
    description: 'Healer bugs spawn 4x more frequently.',
    icon: 'heart-plus',
    flavor: '[MEDBAY] — Biologics detected. Swarm medics converging on battlefield.',
  },
  boss_rush: {
    id: 'boss_rush',
    name: 'Overseer Recall',
    description: 'Boss appears every 5 waves instead of 10.',
    icon: 'skull',
    flavor: '[CORE BREACH] — Overseer reinforcement pattern accelerated. Intercept immediately.',
  },
  no_shield: {
    id: 'no_shield',
    name: 'Shield Depletion',
    description: 'Shield powerups do not spawn.',
    icon: 'ban',
    flavor: '[SYS] — Shield generator offline. Deflector arrays non-functional.',
  },
  frostbite: {
    id: 'frostbite',
    name: 'Cryogenic Field',
    description: 'Bugs slow to 20% speed near core, but gain speed over time.',
    icon: 'snowflake',
    flavor: '[ENV] — Ambient temperature dropping. Swarm cold-acclimation in progress.',
  },
};

/** Win condition presets indexed by challenge difficulty tier. */
const WIN_CONDITIONS: WinCondition[] = [
  { type: 'wave', value: 10, label: 'Reach Wave 10' },
  { type: 'wave', value: 15, label: 'Reach Wave 15' },
  { type: 'wave', value: 20, label: 'Reach Wave 20' },
  { type: 'score', value: 50000, label: 'Score 50,000 points' },
  { type: 'score', value: 100000, label: 'Score 100,000 points' },
  { type: 'kills', value: 500, label: 'Smash 500 bugs' },
  { type: 'kills', value: 1000, label: 'Smash 1,000 bugs' },
];

/** Cosmetic reward skins unlockable from challenges. */
const CURSOR_SKINS: ChallengeReward[] = [
  {
    type: 'cursor_skin',
    id: 'skin_cyber_red',
    name: 'Crimson Protocol',
    description: 'Aggressive red cursor ring with heat-pulse animation.',
  },
  {
    type: 'cursor_skin',
    id: 'skin_gold_empire',
    name: 'Golden Empire',
    description: 'Luxurious gold cursor with particle trail.',
  },
  {
    type: 'cursor_skin',
    id: 'skin_void_black',
    name: 'Void Walker',
    description: 'Dark cursor with white core and distortion effect.',
  },
  {
    type: 'cursor_skin',
    id: 'skin_neon_pulse',
    name: 'Neon Pulse',
    description: 'Cyan/pink dual-tone cursor with pulse ring.',
  },
  {
    type: 'cursor_skin',
    id: 'skin_quantum_shift',
    name: 'Quantum Shift',
    description: 'Phase-shifting cursor that flickers between colors.',
  },
  {
    type: 'cursor_skin',
    id: 'skin_overseer',
    name: 'Overseer',
    description: 'Red and black boss-themed cursor with glitch effect.',
  },
  {
    type: 'cursor_skin',
    id: 'skin_rainbow',
    name: 'Chromatic Surge',
    description: 'Full-spectrum cursor cycling through all colors. (7-day streak bonus)',
  },
];

// ---- Seed-based pseudo-random number generator (mulberry32) ----
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateFromNow(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- STORAGE KEYS ----
const STORAGE_CHALLENGE = 'bugsmasher_daily_challenge';
const STORAGE_STREAK = 'bugsmasher_challenge_streak';
const STORAGE_COSMETICS = 'bugsmasher_cosmetics';

// ---- CHALLENGE GENERATION ----

/**
 * Generates today's challenge deterministically from the date.
 */
export function generateDailyChallenge(dateStr?: string): DailyChallenge {
  const date = dateStr || getTodayDateStr();
  const seed = hashDate(date);
  const rng = mulberry32(seed);

  // Pick 2-3 modifiers based on seed
  const modifierPool: ChallengeModifierId[] = [
    'fast_bugs',
    'tank_wave',
    'glass_cannon',
    'darkness',
    'speed_demon',
    'scrap_hunger',
    'healer_horde',
    'boss_rush',
    'no_shield',
    'frostbite',
  ];

  const modifierCount = rng() < 0.4 ? 3 : 2;
  const shuffled = [...modifierPool].sort(() => rng() - 0.5);
  const modifiers = shuffled.slice(0, modifierCount);

  // Pick a win condition based on seed
  const winIdx = Math.floor(rng() * WIN_CONDITIONS.length);
  const winCondition = WIN_CONDITIONS[winIdx];

  // Generate rewards
  const rewards: ChallengeReward[] = [];
  // Always give resources
  rewards.push({
    type: 'resources',
    id: 'scrap',
    name: '500 Biotic Scrap',
    description: '',
  });
  rewards.push({
    type: 'resources',
    id: 'crystals',
    name: '25 Void Crystals',
    description: '',
  });

  // Occasionally offer a cursor skin (roughly every 3 days)
  const skinIdx = Math.floor(rng() * CURSOR_SKINS.length);
  rewards.push(CURSOR_SKINS[skinIdx]);

  // Streak bonus skin on 3+ day streaks
  const streakReward: ChallengeReward = {
    type: 'cursor_skin',
    id: 'skin_rainbow',
    name: 'Chromatic Surge',
    description: 'Full-spectrum cursor. (7-day streak bonus)',
  };

  return {
    date,
    seed,
    modifiers,
    winCondition,
    rewards,
    streakReward,
  };
}

// ---- PERSISTENCE ----

interface PersistedChallenge {
  date: string;
  completed: boolean;
  completedAt?: string;
  score: number;
  wave: number;
}

interface PersistedStreak {
  currentStreak: number;
  lastCompletedDate: string;
  highestStreak: number;
}

interface PersistedCosmetics {
  unlockedSkins: string[];
  activeSkin: string | null;
}

function loadChallenge(): PersistedChallenge | null {
  try {
    const raw = localStorage.getItem(STORAGE_CHALLENGE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveChallenge(data: PersistedChallenge) {
  localStorage.setItem(STORAGE_CHALLENGE, JSON.stringify(data));
}

function loadStreak(): PersistedStreak {
  try {
    const raw = localStorage.getItem(STORAGE_STREAK);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return { currentStreak: 0, lastCompletedDate: '', highestStreak: 0 };
}

function saveStreak(data: PersistedStreak) {
  localStorage.setItem(STORAGE_STREAK, JSON.stringify(data));
}

// ---- PUBLIC API ----

/** Returns true if today's challenge has been completed. */
export function isTodaysChallengeCompleted(): boolean {
  const today = getTodayDateStr();
  const saved = loadChallenge();
  return saved !== null && saved.date === today && saved.completed;
}

/** Returns today's challenge with its completion status. */
export function getTodaysChallenge(): DailyChallenge & {
  completed: boolean;
  completedAt?: string;
  score: number;
  wave: number;
} {
  const today = getTodayDateStr();
  const challenge = generateDailyChallenge(today);
  const saved = loadChallenge();

  if (saved && saved.date === today) {
    return { ...challenge, completed: saved.completed, completedAt: saved.completedAt, score: saved.score, wave: saved.wave };
  }
  return { ...challenge, completed: false, score: 0, wave: 0 };
}

/** Mark today's challenge as completed with result data. */
export function completeChallenge(result: ChallengeResult) {
  const today = getTodayDateStr();

  // Save completion
  saveChallenge({
    date: today,
    completed: true,
    completedAt: new Date().toISOString(),
    score: result.score,
    wave: result.wave,
  });

  // Update streak
  const streak = loadStreak();
  const yesterday = getDateFromNow(-1);

  if (streak.lastCompletedDate === yesterday) {
    streak.currentStreak += 1;
  } else if (streak.lastCompletedDate !== today) {
    // Broke streak or first time
    streak.currentStreak = 1;
  }
  streak.lastCompletedDate = today;
  streak.highestStreak = Math.max(streak.highestStreak, streak.currentStreak);
  saveStreak(streak);

  // Grant rewards to progression
  const challenge = generateDailyChallenge(today);
  grantRewards(challenge, streak.currentStreak);
}

/** Get current streak info. */
export function getStreakInfo() {
  return loadStreak();
}

/** Apply a cursor skin change. */
export function setActiveSkin(skinId: string | null) {
  const cosmetics = loadCosmetics();
  cosmetics.activeSkin = skinId;
  localStorage.setItem(STORAGE_COSMETICS, JSON.stringify(cosmetics));
}

/** Get the active cursor skin. */
export function getActiveSkin(): string | null {
  return loadCosmetics().activeSkin ?? null;
}

/** Get all unlocked cosmetics. */
export function getUnlockedCosmetics(): string[] {
  return loadCosmetics().unlockedSkins;
}

/** Check if a skin is unlocked. */
export function isSkinUnlocked(skinId: string): boolean {
  return loadCosmetics().unlockedSkins.includes(skinId);
}

// ---- INTERNAL REWARD GRANTING ----

function loadCosmetics(): CosmeticsState {
  try {
    const raw = localStorage.getItem(STORAGE_COSMETICS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.unlockedSkins)) parsed.unlockedSkins = [];
      return parsed;
    }
  } catch {
    // fall through
  }
  return { unlockedSkins: [], activeSkin: null };
}

function grantRewards(challenge: DailyChallenge, streak: number) {
  // Read full stored data to preserve extended fields from CosmeticsManager
  const cosmetics = loadCosmetics();

  for (const reward of challenge.rewards) {
    if (reward.type === 'cursor_skin') {
      if (!cosmetics.unlockedSkins.includes(reward.id)) {
        cosmetics.unlockedSkins.push(reward.id);
      }
    } else if (reward.type === 'resources') {
      // Handled via an event since we can't import ProgressionManager
      window.dispatchEvent(
        new CustomEvent('challenge_reward', {
          detail: { type: reward.type, id: reward.id, name: reward.name },
        })
      );
    }
  }

  // Grant streak bonus if applicable
  if (streak >= 3 && challenge.streakReward) {
    if (!cosmetics.unlockedSkins.includes(challenge.streakReward.id)) {
      cosmetics.unlockedSkins.push(challenge.streakReward.id);
    }
  }
  // Special 7-day streak bonus
  if (streak >= 7) {
    const sevenDaySkin = CURSOR_SKINS.find(s => s.id === 'skin_rainbow');
    if (sevenDaySkin && !cosmetics.unlockedSkins.includes(sevenDaySkin.id)) {
      cosmetics.unlockedSkins.push(sevenDaySkin.id);
    }
  }

  localStorage.setItem(STORAGE_COSMETICS, JSON.stringify(cosmetics));
}

// ---- MODIFIER APPLICATION HELPERS ----

export interface ChallengeModifierState {
  activeModifiers: ChallengeModifierId[];
  // Computed values for GameEngine
  bugSpeedMultiplier: number;
  tankSpawnMultiplier: number;
  healerSpawnMultiplier: number;
  playerDamageMultiplier: number;
  maxHealthMultiplier: number;
  visibilityRadiusMultiplier: number;
  speedDemonActive: boolean;
  speedDemonPerKill: number;
  speedDemonMax: number;
  resourceDropMultiplier: number;
  resourceValueMultiplier: number;
  bossWaveInterval: number;
  shieldPowerupsDisabled: boolean;
  frostbiteActive: boolean;
  killsPerWaveForSpeed: number;
}

/**
 * Computes the effective numeric state from a list of modifier IDs.
 */
export function computeModifierState(modifiers: ChallengeModifierId[]): ChallengeModifierState {
  const state: ChallengeModifierState = {
    activeModifiers: modifiers,
    bugSpeedMultiplier: 1,
    tankSpawnMultiplier: 1,
    healerSpawnMultiplier: 1,
    playerDamageMultiplier: 1,
    maxHealthMultiplier: 1,
    visibilityRadiusMultiplier: 1,
    speedDemonActive: false,
    speedDemonPerKill: 0,
    speedDemonMax: 0,
    resourceDropMultiplier: 1,
    resourceValueMultiplier: 1,
    bossWaveInterval: 10,
    shieldPowerupsDisabled: false,
    frostbiteActive: false,
    killsPerWaveForSpeed: 0,
  };

  for (const mod of modifiers) {
    switch (mod) {
      case 'fast_bugs':
        state.bugSpeedMultiplier = 1.4;
        break;
      case 'tank_wave':
        state.tankSpawnMultiplier = 3;
        break;
      case 'glass_cannon':
        state.playerDamageMultiplier = 2;
        state.maxHealthMultiplier = 0.5;
        break;
      case 'darkness':
        state.visibilityRadiusMultiplier = 0.5;
        break;
      case 'speed_demon':
        state.speedDemonActive = true;
        state.speedDemonPerKill = 0.02; // 2% per kill
        state.speedDemonMax = 0.8; // max 80% increase
        break;
      case 'scrap_hunger':
        state.resourceDropMultiplier = 0.4; // 60% less
        state.resourceValueMultiplier = 3; // 3x value
        break;
      case 'healer_horde':
        state.healerSpawnMultiplier = 4;
        break;
      case 'boss_rush':
        state.bossWaveInterval = 5;
        break;
      case 'no_shield':
        state.shieldPowerupsDisabled = true;
        break;
      case 'frostbite':
        state.frostbiteActive = true;
        break;
    }
  }

  return state;
}
