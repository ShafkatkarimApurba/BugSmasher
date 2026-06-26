/**
 * CosmeticsManager — handles cosmetics-only monetization:
 * cursor skins, core themes, supporter pack.
 *
 * No gameplay advantages. Pure visual customization.
 * Shares localStorage with DailyChallengeManager's cosmetics system
 * (key: 'bugsmasher_cosmetics').
 */
import { getActiveSkin as dcGetActiveSkin } from './DailyChallengeManager';

// ===== TYPES =====

export type CoreThemeId = 'theme_void' | 'theme_magma' | 'theme_frost';
export type SupporterTier = 'basic' | 'premium' | 'ultimate' | null;

export interface CoreTheme {
  id: CoreThemeId;
  name: string;
  description: string;
  tier: SupporterTier;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
    accent: string;
  };
  pattern: 'tech' | 'lattice' | 'sine' | 'hex';
}

export interface PurchasableSkin {
  id: string;
  name: string;
  description: string;
  tier: SupporterTier;
}

// ===== DATA =====

/** Supporter unlock key — hardcoded for client-side verification. */
export const SUPPORTER_KEY = 'NEXUS_SUPPORTER';
export const PREMIUM_KEY = 'NEXUS_PREMIUM';
export const ULTIMATE_KEY = 'NEXUS_ULTIMATE';

/** 3 core themes, one per supporter tier. */
export const CORE_THEMES: Record<CoreThemeId, CoreTheme> = {
  theme_void: {
    id: 'theme_void',
    name: 'Void Walker',
    description: 'Deep purple core with drifting void particles and a dark ambient glow.',
    tier: 'basic',
    colors: {
      primary: '#a855f7',
      secondary: '#7c3aed',
      glow: 'rgba(168, 85, 247, 0.6)',
      accent: '#c084fc',
    },
    pattern: 'lattice',
  },
  theme_magma: {
    id: 'theme_magma',
    name: 'Magma Forge',
    description: 'Molten orange-red core with ember trails and heat-pulse waves.',
    tier: 'premium',
    colors: {
      primary: '#f97316',
      secondary: '#dc2626',
      glow: 'rgba(249, 115, 22, 0.7)',
      accent: '#fdba74',
    },
    pattern: 'sine',
  },
  theme_frost: {
    id: 'theme_frost',
    name: 'Frost Protocol',
    description: 'Cyan-white crystalline core with ice shard particles and frost rings.',
    tier: 'ultimate',
    colors: {
      primary: '#22d3ee',
      secondary: '#0891b2',
      glow: 'rgba(34, 211, 238, 0.6)',
      accent: '#67e8f9',
    },
    pattern: 'hex',
  },
};

/** Purchasable cursor skins (beyond challenge rewards). */
export const PURCHASABLE_SKINS: PurchasableSkin[] = [
  {
    id: 'skin_plasma_arc',
    name: 'Plasma Arc',
    description: 'Electrified cursor with crackling plasma trails.',
    tier: 'basic',
  },
  {
    id: 'skin_shadow_ops',
    name: 'Shadow Ops',
    description: 'Stealth-black cursor with faint afterimage ghosting.',
    tier: 'basic',
  },
  {
    id: 'skin_solar_flare',
    name: 'Solar Flare',
    description: 'Brilliant orange-gold cursor with radiant burst pulses.',
    tier: 'premium',
  },
  {
    id: 'skin_void_echo',
    name: 'Void Echo',
    description: 'Purple-black cursor with phase-shifting echo trails.',
    tier: 'premium',
  },
  {
    id: 'skin_quantum_core',
    name: 'Quantum Core',
    description: 'Cyan-magenta cursor with blinking quantum entanglement nodes.',
    tier: 'ultimate',
  },
  {
    id: 'skin_overseer_elite',
    name: 'Overseer Elite',
    description: 'Premium boss-themed cursor with continuous glitch static.',
    tier: 'ultimate',
  },
];

// ===== INTERNAL STORAGE EXTENSION =====

interface ExtendedCosmetics {
  unlockedSkins: string[];
  activeSkin: string | null;
  unlockedCoreThemes: CoreThemeId[];
  activeCoreTheme: CoreThemeId | null;
  isSupporter: boolean;
  supporterTier: SupporterTier;
  supporterUnlockedAt?: string;
  devUnlocked: boolean;
}

const STORAGE_KEY = 'bugsmasher_cosmetics';

function loadExtended(): ExtendedCosmetics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unlockedSkins: parsed.unlockedSkins || [],
        activeSkin: parsed.activeSkin || null,
        unlockedCoreThemes: parsed.unlockedCoreThemes || [],
        activeCoreTheme: parsed.activeCoreTheme || null,
        isSupporter: parsed.isSupporter || false,
        supporterTier: parsed.supporterTier || null,
        supporterUnlockedAt: parsed.supporterUnlockedAt || undefined,
        devUnlocked: parsed.devUnlocked || false,
      };
    }
  } catch {
    // fall through
  }
  return {
    unlockedSkins: [],
    activeSkin: null,
    unlockedCoreThemes: [],
    activeCoreTheme: null,
    isSupporter: false,
    supporterTier: null,
    devUnlocked: false,
  };
}

function saveExtended(data: ExtendedCosmetics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ===== PUBLIC API =====

// ---- Core Themes ----

/** Get all unlocked core theme IDs. */
export function getUnlockedCoreThemes(): CoreThemeId[] {
  return loadExtended().unlockedCoreThemes;
}

/** Check if a core theme is unlocked. */
export function isCoreThemeUnlocked(themeId: CoreThemeId): boolean {
  return loadExtended().unlockedCoreThemes.includes(themeId);
}

/** Set active core theme (must be unlocked). */
export function setActiveCoreTheme(themeId: CoreThemeId | null) {
  const data = loadExtended();
  if (themeId && !data.unlockedCoreThemes.includes(themeId) && !data.devUnlocked) return;
  data.activeCoreTheme = themeId;
  saveExtended(data);
}

/** Get the active core theme ID. */
export function getActiveCoreTheme(): CoreThemeId | null {
  return loadExtended().activeCoreTheme;
}

/** Get the active CoreTheme config object, or null if none selected. */
export function getActiveCoreThemeConfig(): CoreTheme | null {
  const id = getActiveCoreTheme();
  return id ? CORE_THEMES[id] : null;
}

// ---- Supporter Pack ----

/** Check if player is a supporter. */
export function isSupporter(): boolean {
  const data = loadExtended();
  return data.isSupporter || data.devUnlocked;
}

/** Get supporter tier. */
export function getSupporterTier(): SupporterTier {
  const data = loadExtended();
  return data.devUnlocked ? 'ultimate' : data.supporterTier;
}

/** Attempt to unlock supporter pack with a key code. Returns the tier unlocked or null. */
export function unlockSupporterPack(key: string): SupporterTier {
  let tier: SupporterTier = null;

  if (key.toUpperCase() === SUPPORTER_KEY) tier = 'basic';
  else if (key.toUpperCase() === PREMIUM_KEY) tier = 'premium';
  else if (key.toUpperCase() === ULTIMATE_KEY) tier = 'ultimate';

  if (!tier) return null;

  const data = loadExtended();
  // Prevent downgrading: if already supporter with a higher tier, skip
  if (data.isSupporter && data.supporterTier) {
    const tierOrder: SupporterTier[] = ['basic', 'premium', 'ultimate'];
    const currentIdx = tierOrder.indexOf(data.supporterTier);
    const newIdx = tierOrder.indexOf(tier);
    if (currentIdx >= newIdx) return null;
  }

  data.isSupporter = true;
  data.supporterTier = tier;
  data.supporterUnlockedAt = new Date().toISOString();

  // Grant all skins for this tier and below
  const tierOrder: SupporterTier[] = ['basic', 'premium', 'ultimate'];
  const grantedTierIndex = tierOrder.indexOf(tier);

  // Grant unlocked core themes
  const themeEntries = Object.entries(CORE_THEMES) as [CoreThemeId, CoreTheme][];
  for (const [id, theme] of themeEntries) {
    if (theme.tier && tierOrder.indexOf(theme.tier) <= grantedTierIndex) {
      if (!data.unlockedCoreThemes.includes(id)) {
        data.unlockedCoreThemes.push(id);
      }
    }
  }

  // Grant purchasable skins for this tier and below
  for (const skin of PURCHASABLE_SKINS) {
    if (skin.tier && tierOrder.indexOf(skin.tier) <= grantedTierIndex) {
      if (!data.unlockedSkins.includes(skin.id)) {
        data.unlockedSkins.push(skin.id);
      }
    }
  }

  // If ultimate, also grant the rainbow skin (from DailyChallenge)
  if (tier === 'ultimate' && !data.unlockedSkins.includes('skin_rainbow')) {
    data.unlockedSkins.push('skin_rainbow');
  }

  saveExtended(data);
  return tier;
}

// ---- Skin Management ----

/** Unlock a skin (called by DailyChallengeManager on reward grant). */
export function unlockSkin(skinId: string) {
  const data = loadExtended();
  if (!data.unlockedSkins.includes(skinId)) {
    data.unlockedSkins.push(skinId);
    saveExtended(data);
  }
}

/** Check if a skin is unlocked (combines DailyChallenge + CosmeticsManager sources). */
export function isSkinUnlocked(skinId: string): boolean {
  const data = loadExtended();
  return data.unlockedSkins.includes(skinId) || data.devUnlocked;
}

/** Set active skin. */
export function setActiveSkin(skinId: string | null) {
  const data = loadExtended();
  if (skinId && !data.unlockedSkins.includes(skinId) && !data.devUnlocked) return;
  data.activeSkin = skinId;
  saveExtended(data);
}

/** Get all unlocked skin IDs. */
export function getUnlockedSkins(): string[] {
  return loadExtended().unlockedSkins;
}

// Sync with DailyChallengeManager's getActiveSkin (it's the source of truth for active skin)
export function getActiveSkin(): string | null {
  return dcGetActiveSkin();
}

// ---- Dev Tools ----

/** Dev unlock: grants all cosmetics (for testing/demo). */
export function devUnlockAll() {
  const data = loadExtended();
  data.devUnlocked = true;
  data.isSupporter = true;
  data.supporterTier = 'ultimate';

  // All core themes
  for (const id of Object.keys(CORE_THEMES) as CoreThemeId[]) {
    if (!data.unlockedCoreThemes.includes(id)) {
      data.unlockedCoreThemes.push(id);
    }
  }

  // All purchasable skins
  for (const skin of PURCHASABLE_SKINS) {
    if (!data.unlockedSkins.includes(skin.id)) {
      data.unlockedSkins.push(skin.id);
    }
  }

  // Also include the DailyChallenge skins and rainbow
  const allChallengeSkins = [
    'skin_cyber_red', 'skin_gold_empire', 'skin_void_black',
    'skin_neon_pulse', 'skin_quantum_shift', 'skin_overseer', 'skin_rainbow',
  ];
  for (const id of allChallengeSkins) {
    if (!data.unlockedSkins.includes(id)) {
      data.unlockedSkins.push(id);
    }
  }

  saveExtended(data);
}

/** Check if dev unlock is active. */
export function isDevUnlocked(): boolean {
  return loadExtended().devUnlocked;
}
