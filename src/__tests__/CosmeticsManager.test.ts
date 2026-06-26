import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Core themes
  CORE_THEMES,
  getUnlockedCoreThemes,
  isCoreThemeUnlocked,
  setActiveCoreTheme,
  getActiveCoreTheme,
  getActiveCoreThemeConfig,
  // Skins
  PURCHASABLE_SKINS,
  unlockSkin,
  isSkinUnlocked,
  setActiveSkin,
  getUnlockedSkins,
  getActiveSkin,
  // Supporter pack
  SUPPORTER_KEY,
  PREMIUM_KEY,
  ULTIMATE_KEY,
  isSupporter,
  getSupporterTier,
  unlockSupporterPack,
  // Dev tools
  devUnlockAll,
  isDevUnlocked,
  type CoreThemeId,
  type SupporterTier,
} from '../game/CosmeticsManager';

beforeEach(() => {
  localStorage.clear();
});

// =============================================================================
// Core Themes
// =============================================================================

describe('core themes', () => {
  describe('CORE_THEMES', () => {
    it('should have all 3 core themes defined', () => {
      const ids = Object.keys(CORE_THEMES);
      expect(ids).toEqual(['theme_void', 'theme_magma', 'theme_frost']);
    });

    it('each theme should have a tier assigned', () => {
      for (const [id, theme] of Object.entries(CORE_THEMES)) {
        expect(theme.tier).toBeTruthy();
        expect(['basic', 'premium', 'ultimate']).toContain(theme.tier);
      }
    });

    it('each theme should have valid color values', () => {
      for (const theme of Object.values(CORE_THEMES)) {
        expect(theme.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.colors.glow).toMatch(/rgba?\(/);
        expect(theme.colors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('Void Walker should be basic tier', () => {
      expect(CORE_THEMES.theme_void.tier).toBe('basic');
    });

    it('Magma Forge should be premium tier', () => {
      expect(CORE_THEMES.theme_magma.tier).toBe('premium');
    });

    it('Frost Protocol should be ultimate tier', () => {
      expect(CORE_THEMES.theme_frost.tier).toBe('ultimate');
    });
  });

  describe('getUnlockedCoreThemes', () => {
    it('should return empty array initially', () => {
      expect(getUnlockedCoreThemes()).toEqual([]);
    });

    it('should return themes stored in localStorage', () => {
      const data = {
        unlockedSkins: [],
        activeSkin: null,
        unlockedCoreThemes: ['theme_void', 'theme_magma'],
        activeCoreTheme: null,
        isSupporter: true,
        supporterTier: 'premium' as SupporterTier,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      expect(getUnlockedCoreThemes()).toEqual(['theme_void', 'theme_magma']);
    });
  });

  describe('isCoreThemeUnlocked', () => {
    it('should return false for all themes initially', () => {
      expect(isCoreThemeUnlocked('theme_void')).toBe(false);
      expect(isCoreThemeUnlocked('theme_magma')).toBe(false);
      expect(isCoreThemeUnlocked('theme_frost')).toBe(false);
    });

    it('should return true for unlocked themes', () => {
      const data = {
        unlockedSkins: [],
        activeSkin: null,
        unlockedCoreThemes: ['theme_void', 'theme_frost'],
        activeCoreTheme: null,
        isSupporter: true,
        supporterTier: 'ultimate' as SupporterTier,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      expect(isCoreThemeUnlocked('theme_void')).toBe(true);
      expect(isCoreThemeUnlocked('theme_magma')).toBe(false);
      expect(isCoreThemeUnlocked('theme_frost')).toBe(true);
    });
  });

  describe('setActiveCoreTheme / getActiveCoreTheme', () => {
    it('should return null when no theme is selected', () => {
      expect(getActiveCoreTheme()).toBeNull();
    });

    it('should not set a locked theme', () => {
      setActiveCoreTheme('theme_void');
      expect(getActiveCoreTheme()).toBeNull();
    });

    it('should set an unlocked theme', () => {
      // Unlock theme_void by writing to localStorage
      const data = {
        unlockedSkins: [],
        activeSkin: null,
        unlockedCoreThemes: ['theme_void'],
        activeCoreTheme: null,
        isSupporter: true,
        supporterTier: 'basic' as SupporterTier,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      setActiveCoreTheme('theme_void');
      expect(getActiveCoreTheme()).toBe('theme_void');
    });

    it('should allow switching between unlocked themes', () => {
      const data = {
        unlockedSkins: [],
        activeSkin: null,
        unlockedCoreThemes: ['theme_void', 'theme_magma'],
        activeCoreTheme: null,
        isSupporter: true,
        supporterTier: 'premium' as SupporterTier,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      setActiveCoreTheme('theme_void');
      expect(getActiveCoreTheme()).toBe('theme_void');

      setActiveCoreTheme('theme_magma');
      expect(getActiveCoreTheme()).toBe('theme_magma');
    });

    it('should allow clearing the active theme back to default', () => {
      const data = {
        unlockedSkins: [],
        activeSkin: null,
        unlockedCoreThemes: ['theme_void'],
        activeCoreTheme: 'theme_void',
        isSupporter: true,
        supporterTier: 'basic' as SupporterTier,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      setActiveCoreTheme(null);
      expect(getActiveCoreTheme()).toBeNull();
    });
  });

  describe('getActiveCoreThemeConfig', () => {
    it('should return null when no theme is active', () => {
      expect(getActiveCoreThemeConfig()).toBeNull();
    });

    it('should return the full CoreTheme object for the active theme', () => {
      const data = {
        unlockedSkins: [],
        activeSkin: null,
        unlockedCoreThemes: ['theme_void'],
        activeCoreTheme: 'theme_void',
        isSupporter: true,
        supporterTier: 'basic' as SupporterTier,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      const config = getActiveCoreThemeConfig();
      expect(config).not.toBeNull();
      expect(config!.id).toBe('theme_void');
      expect(config!.name).toBe('Void Walker');
      expect(config!.colors.primary).toBe('#a855f7');
      expect(config!.pattern).toBe('lattice');
    });

    it('should return the correct config after switching themes', () => {
      const data = {
        unlockedSkins: [],
        activeSkin: null,
        unlockedCoreThemes: ['theme_void', 'theme_frost'],
        activeCoreTheme: null,
        isSupporter: true,
        supporterTier: 'ultimate' as SupporterTier,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      setActiveCoreTheme('theme_frost');
      const config = getActiveCoreThemeConfig();
      expect(config!.id).toBe('theme_frost');
      expect(config!.name).toBe('Frost Protocol');
      expect(config!.colors.primary).toBe('#22d3ee');
    });
  });
});

// =============================================================================
// Skin Management
// =============================================================================

describe('skin management', () => {
  describe('PURCHASABLE_SKINS', () => {
    it('should have 6 purchasable skins', () => {
      expect(PURCHASABLE_SKINS.length).toBe(6);
    });

    it('should have 2 skins per tier', () => {
      const basic = PURCHASABLE_SKINS.filter(s => s.tier === 'basic');
      const premium = PURCHASABLE_SKINS.filter(s => s.tier === 'premium');
      const ultimate = PURCHASABLE_SKINS.filter(s => s.tier === 'ultimate');
      expect(basic.length).toBe(2);
      expect(premium.length).toBe(2);
      expect(ultimate.length).toBe(2);
    });

    it('each skin should have a unique id', () => {
      const ids = PURCHASABLE_SKINS.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getUnlockedSkins', () => {
    it('should return empty array initially', () => {
      expect(getUnlockedSkins()).toEqual([]);
    });

    it('should return skins from localStorage', () => {
      const data = {
        unlockedSkins: ['skin_plasma_arc', 'skin_shadow_ops'],
        activeSkin: null,
        unlockedCoreThemes: [],
        activeCoreTheme: null,
        isSupporter: false,
        supporterTier: null,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));
      expect(getUnlockedSkins()).toEqual(['skin_plasma_arc', 'skin_shadow_ops']);
    });
  });

  describe('unlockSkin', () => {
    it('should unlock a single skin', () => {
      unlockSkin('skin_plasma_arc');
      expect(getUnlockedSkins()).toContain('skin_plasma_arc');
    });

    it('should allow unlocking multiple skins', () => {
      unlockSkin('skin_plasma_arc');
      unlockSkin('skin_shadow_ops');
      unlockSkin('skin_solar_flare');

      const unlocked = getUnlockedSkins();
      expect(unlocked).toContain('skin_plasma_arc');
      expect(unlocked).toContain('skin_shadow_ops');
      expect(unlocked).toContain('skin_solar_flare');
      expect(unlocked.length).toBe(3);
    });

    it('should be idempotent (not duplicate on second call)', () => {
      unlockSkin('skin_plasma_arc');
      unlockSkin('skin_plasma_arc');
      unlockSkin('skin_plasma_arc');

      expect(getUnlockedSkins().length).toBe(1);
    });
  });

  describe('isSkinUnlocked', () => {
    it('should return false for all skins initially', () => {
      expect(isSkinUnlocked('skin_plasma_arc')).toBe(false);
      expect(isSkinUnlocked('skin_quantum_core')).toBe(false);
    });

    it('should return true after unlocking', () => {
      unlockSkin('skin_plasma_arc');
      expect(isSkinUnlocked('skin_plasma_arc')).toBe(true);
    });

    it('should return false for skins not unlocked', () => {
      unlockSkin('skin_plasma_arc');
      expect(isSkinUnlocked('skin_shadow_ops')).toBe(false);
    });
  });

  describe('getActiveSkin', () => {
    it('should return null initially', () => {
      expect(getActiveSkin()).toBeNull();
    });

    it('should return the active skin from localStorage', () => {
      const data = {
        unlockedSkins: ['skin_plasma_arc'],
        activeSkin: 'skin_plasma_arc',
        unlockedCoreThemes: [],
        activeCoreTheme: null,
        isSupporter: false,
        supporterTier: null,
        devUnlocked: false,
      };
      localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));

      expect(getActiveSkin()).toBe('skin_plasma_arc');
    });
  });

  describe('setActiveSkin', () => {
    it('should not set a locked skin', () => {
      setActiveSkin('skin_plasma_arc');
      expect(getActiveSkin()).toBeNull();
    });

    it('should set an unlocked skin', () => {
      unlockSkin('skin_plasma_arc');
      setActiveSkin('skin_plasma_arc');
      expect(getActiveSkin()).toBe('skin_plasma_arc');
    });

    it('should allow switching between unlocked skins', () => {
      unlockSkin('skin_plasma_arc');
      unlockSkin('skin_shadow_ops');

      setActiveSkin('skin_plasma_arc');
      expect(getActiveSkin()).toBe('skin_plasma_arc');

      setActiveSkin('skin_shadow_ops');
      expect(getActiveSkin()).toBe('skin_shadow_ops');
    });

    it('should allow clearing the active skin', () => {
      unlockSkin('skin_plasma_arc');
      setActiveSkin('skin_plasma_arc');
      setActiveSkin(null);
      expect(getActiveSkin()).toBeNull();
    });
  });
});

// =============================================================================
// Supporter Pack
// =============================================================================

describe('supporter pack', () => {
  describe('key constants', () => {
    it('should have defined key codes', () => {
      expect(SUPPORTER_KEY).toBe('NEXUS_SUPPORTER');
      expect(PREMIUM_KEY).toBe('NEXUS_PREMIUM');
      expect(ULTIMATE_KEY).toBe('NEXUS_ULTIMATE');
    });
  });

  describe('unlockSupporterPack', () => {
    it('should return null for an invalid key', () => {
      const result = unlockSupporterPack('INVALID_KEY');
      expect(result).toBeNull();
    });

    it('should return null for an empty string', () => {
      const result = unlockSupporterPack('');
      expect(result).toBeNull();
    });

    it('should return null for random garbage', () => {
      const result = unlockSupporterPack('asdf1234!!!!');
      expect(result).toBeNull();
    });

    it('should be case insensitive for key matching', () => {
      const result = unlockSupporterPack('nexus_supporter');
      expect(result).toBe('basic');
    });

    it('should accept mixed case keys', () => {
      const result = unlockSupporterPack('Nexus_Premium');
      expect(result).toBe('premium');
    });
  });

  describe('basic supporter tier (NEXUS_SUPPORTER)', () => {
    it('should unlock basic supporter status', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      expect(isSupporter()).toBe(true);
      expect(getSupporterTier()).toBe('basic');
    });

    it('should grant Void Walker theme', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      expect(getUnlockedCoreThemes()).toContain('theme_void');
    });

    it('should NOT grant premium or ultimate themes', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      expect(getUnlockedCoreThemes()).not.toContain('theme_magma');
      expect(getUnlockedCoreThemes()).not.toContain('theme_frost');
    });

    it('should grant basic purchasable skins', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      const unlocked = getUnlockedSkins();
      expect(unlocked).toContain('skin_plasma_arc');
      expect(unlocked).toContain('skin_shadow_ops');
    });

    it('should NOT grant premium or ultimate skins', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      const unlocked = getUnlockedSkins();
      expect(unlocked).not.toContain('skin_solar_flare');
      expect(unlocked).not.toContain('skin_void_echo');
      expect(unlocked).not.toContain('skin_quantum_core');
      expect(unlocked).not.toContain('skin_overseer_elite');
    });

    it('should NOT grant the rainbow skin', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      expect(getUnlockedSkins()).not.toContain('skin_rainbow');
    });

    it('should return "basic" from the function', () => {
      expect(unlockSupporterPack(SUPPORTER_KEY)).toBe('basic');
    });
  });

  describe('premium supporter tier (NEXUS_PREMIUM)', () => {
    it('should unlock premium supporter status', () => {
      unlockSupporterPack(PREMIUM_KEY);
      expect(isSupporter()).toBe(true);
      expect(getSupporterTier()).toBe('premium');
    });

    it('should grant Void Walker AND Magma Forge themes', () => {
      unlockSupporterPack(PREMIUM_KEY);
      const themes = getUnlockedCoreThemes();
      expect(themes).toContain('theme_void');
      expect(themes).toContain('theme_magma');
    });

    it('should NOT grant Frost Protocol theme', () => {
      unlockSupporterPack(PREMIUM_KEY);
      expect(getUnlockedCoreThemes()).not.toContain('theme_frost');
    });

    it('should grant basic AND premium purchasable skins', () => {
      unlockSupporterPack(PREMIUM_KEY);
      const unlocked = getUnlockedSkins();
      expect(unlocked).toContain('skin_plasma_arc');
      expect(unlocked).toContain('skin_shadow_ops');
      expect(unlocked).toContain('skin_solar_flare');
      expect(unlocked).toContain('skin_void_echo');
    });

    it('should NOT grant ultimate skins', () => {
      unlockSupporterPack(PREMIUM_KEY);
      const unlocked = getUnlockedSkins();
      expect(unlocked).not.toContain('skin_quantum_core');
      expect(unlocked).not.toContain('skin_overseer_elite');
    });

    it('should NOT grant the rainbow skin', () => {
      unlockSupporterPack(PREMIUM_KEY);
      expect(getUnlockedSkins()).not.toContain('skin_rainbow');
    });

    it('should return "premium" from the function', () => {
      expect(unlockSupporterPack(PREMIUM_KEY)).toBe('premium');
    });
  });

  describe('ultimate supporter tier (NEXUS_ULTIMATE)', () => {
    it('should unlock ultimate supporter status', () => {
      unlockSupporterPack(ULTIMATE_KEY);
      expect(isSupporter()).toBe(true);
      expect(getSupporterTier()).toBe('ultimate');
    });

    it('should grant ALL core themes', () => {
      unlockSupporterPack(ULTIMATE_KEY);
      const themes = getUnlockedCoreThemes();
      expect(themes).toContain('theme_void');
      expect(themes).toContain('theme_magma');
      expect(themes).toContain('theme_frost');
    });

    it('should grant ALL purchasable skins', () => {
      unlockSupporterPack(ULTIMATE_KEY);
      const unlocked = getUnlockedSkins();
      expect(unlocked).toContain('skin_plasma_arc');
      expect(unlocked).toContain('skin_shadow_ops');
      expect(unlocked).toContain('skin_solar_flare');
      expect(unlocked).toContain('skin_void_echo');
      expect(unlocked).toContain('skin_quantum_core');
      expect(unlocked).toContain('skin_overseer_elite');
    });

    it('should also grant the rainbow skin from DailyChallenge', () => {
      unlockSupporterPack(ULTIMATE_KEY);
      expect(getUnlockedSkins()).toContain('skin_rainbow');
    });

    it('should return "ultimate" from the function', () => {
      expect(unlockSupporterPack(ULTIMATE_KEY)).toBe('ultimate');
    });
  });

  describe('isSupporter', () => {
    it('should return false initially', () => {
      expect(isSupporter()).toBe(false);
    });

    it('should return true after any tier unlock', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      expect(isSupporter()).toBe(true);
    });
  });

  describe('getSupporterTier', () => {
    it('should return null initially', () => {
      expect(getSupporterTier()).toBeNull();
    });

    it('should reflect the unlocked tier', () => {
      unlockSupporterPack(PREMIUM_KEY);
      expect(getSupporterTier()).toBe('premium');
    });
  });

  describe('idempotency', () => {
    it('should be safe to call unlock multiple times', () => {
      unlockSupporterPack(SUPPORTER_KEY);
      unlockSupporterPack(SUPPORTER_KEY);
      unlockSupporterPack(SUPPORTER_KEY);

      expect(isSupporter()).toBe(true);
      expect(getSupporterTier()).toBe('basic');
      expect(getUnlockedSkins().length).toBe(2); // Basic skins only
    });

    it('should not overwrite a higher tier with a lower one', () => {
      unlockSupporterPack(ULTIMATE_KEY);
      expect(getSupporterTier()).toBe('ultimate');

      // Unlocking basic again should not downgrade
      unlockSupporterPack(SUPPORTER_KEY);
      expect(getSupporterTier()).toBe('ultimate');
      expect(isSupporter()).toBe(true);
    });
  });

  it('supporter unlock should set a timestamp', () => {
    unlockSupporterPack(PREMIUM_KEY);
    const raw = localStorage.getItem('bugsmasher_cosmetics');
    const parsed = JSON.parse(raw!);
    expect(parsed.supporterUnlockedAt).toBeDefined();
    expect(parsed.supporterUnlockedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// =============================================================================
// Dev Tools
// =============================================================================

describe('dev tools', () => {
  describe('isDevUnlocked', () => {
    it('should return false initially', () => {
      expect(isDevUnlocked()).toBe(false);
    });
  });

  describe('devUnlockAll', () => {
    it('should set devUnlocked to true', () => {
      devUnlockAll();
      expect(isDevUnlocked()).toBe(true);
    });

    it('should grant all 3 core themes', () => {
      devUnlockAll();
      const themes = getUnlockedCoreThemes();
      expect(themes).toContain('theme_void');
      expect(themes).toContain('theme_magma');
      expect(themes).toContain('theme_frost');
      expect(themes.length).toBe(3);
    });

    it('should grant all 6 purchasable skins', () => {
      devUnlockAll();
      const unlocked = getUnlockedSkins();
      for (const skin of PURCHASABLE_SKINS) {
        expect(unlocked).toContain(skin.id);
      }
    });

    it('should grant all challenge reward skins', () => {
      devUnlockAll();
      const unlocked = getUnlockedSkins();
      const challengeSkins = [
        'skin_cyber_red',
        'skin_gold_empire',
        'skin_void_black',
        'skin_neon_pulse',
        'skin_quantum_shift',
        'skin_overseer',
        'skin_rainbow',
      ];
      for (const id of challengeSkins) {
        expect(unlocked).toContain(id);
      }
    });

    it('should set supporter to true with ultimate tier', () => {
      devUnlockAll();
      expect(isSupporter()).toBe(true);
      expect(getSupporterTier()).toBe('ultimate');
    });

    it('should allow setting any skin as active (bypasses unlock check)', () => {
      devUnlockAll();
      setActiveSkin('skin_quantum_core');
      expect(getActiveSkin()).toBe('skin_quantum_core');
    });

    it('should allow setting any theme as active', () => {
      devUnlockAll();
      setActiveCoreTheme('theme_frost');
      expect(getActiveCoreTheme()).toBe('theme_frost');
    });
  });
});

// =============================================================================
// Integration & Storage Compatibility
// =============================================================================

describe('storage compatibility', () => {
  it('should coexist with DailyChallengeManager data in the same localStorage key', () => {
    // Simulate DailyChallengeManager having written data with extended fields
    const dcmData = {
      unlockedSkins: ['skin_cyber_red'],
      activeSkin: 'skin_cyber_red',
      // CosmeticsManager fields won't be here if DCM wrote them
    };
    localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(dcmData));

    // CosmeticsManager should still read the shared fields
    expect(getUnlockedSkins()).toContain('skin_cyber_red');
    expect(getActiveSkin()).toBe('skin_cyber_red');
  });

  it('should preserve extended fields when CosmeticsManager writes after DCM', () => {
    // DCM writes first (only has skin fields)
    const dcmData = {
      unlockedSkins: ['skin_cyber_red'],
      activeSkin: 'skin_cyber_red',
    };
    localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(dcmData));

    // CosmeticsManager writes (unlock a purchasable skin)
    unlockSkin('skin_plasma_arc');

    // Both sets of data should survive
    const raw = JSON.parse(localStorage.getItem('bugsmasher_cosmetics')!);
    expect(raw.unlockedSkins).toContain('skin_cyber_red');
    expect(raw.unlockedSkins).toContain('skin_plasma_arc');
  });

  it('should handle corrupted JSON gracefully', () => {
    localStorage.setItem('bugsmasher_cosmetics', 'not-valid-json{{{');
    // Should not throw, return defaults
    expect(getUnlockedSkins()).toEqual([]);
    expect(getUnlockedCoreThemes()).toEqual([]);
    expect(getActiveSkin()).toBeNull();
    expect(getActiveCoreTheme()).toBeNull();
    expect(isSupporter()).toBe(false);
    expect(isDevUnlocked()).toBe(false);
  });

  it('should handle missing localStorage key gracefully', () => {
    localStorage.removeItem('bugsmasher_cosmetics');
    expect(getUnlockedSkins()).toEqual([]);
    expect(getActiveCoreTheme()).toBeNull();
    expect(getSupporterTier()).toBeNull();
  });

  it('should handle empty object in localStorage', () => {
    localStorage.setItem('bugsmasher_cosmetics', '{}');
    expect(getUnlockedSkins()).toEqual([]);
    expect(getUnlockedCoreThemes()).toEqual([]);
    expect(getActiveSkin()).toBeNull();
    expect(isSupporter()).toBe(false);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  it('setActiveCoreTheme should work with dev unlock bypass', () => {
    devUnlockAll();
    // Should work without needing explicit unlock
    setActiveCoreTheme('theme_magma');
    expect(getActiveCoreTheme()).toBe('theme_magma');
  });

  it('setActiveSkin should work with dev unlock bypass', () => {
    devUnlockAll();
    setActiveSkin('skin_overseer_elite');
    expect(getActiveSkin()).toBe('skin_overseer_elite');
  });

  it('should track total unlocked count correctly', () => {
    unlockSkin('skin_plasma_arc');
    unlockSkin('skin_shadow_ops');
    unlockSkin('skin_solar_flare');

    const unlocked = getUnlockedSkins();
    expect(unlocked.length).toBe(3);
    expect(unlocked).toEqual(['skin_plasma_arc', 'skin_shadow_ops', 'skin_solar_flare']);
  });

  it('should return null for getActiveCoreThemeConfig when theme cleared', () => {
    const data = {
      unlockedSkins: [],
      activeSkin: null,
      unlockedCoreThemes: ['theme_void'],
      activeCoreTheme: null,
      isSupporter: true,
      supporterTier: 'basic' as SupporterTier,
      devUnlocked: false,
    };
    localStorage.setItem('bugsmasher_cosmetics', JSON.stringify(data));
    expect(getActiveCoreThemeConfig()).toBeNull();
  });
});
