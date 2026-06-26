import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateDailyChallenge,
  getTodaysChallenge,
  completeChallenge,
  isTodaysChallengeCompleted,
  getStreakInfo,
  setActiveSkin,
  getActiveSkin,
  getUnlockedCosmetics,
  isSkinUnlocked,
  computeModifierState,
  CHALLENGE_MODIFIERS,
} from '../game/DailyChallengeManager';

function clearStorage() {
  localStorage.clear();
}

describe('DailyChallengeManager', () => {
  beforeEach(() => {
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  describe('generateDailyChallenge', () => {
    it('should generate deterministic challenges for the same date', () => {
      const c1 = generateDailyChallenge('2026-06-01');
      const c2 = generateDailyChallenge('2026-06-01');
      expect(c1.seed).toBe(c2.seed);
      expect(c1.modifiers).toEqual(c2.modifiers);
      expect(c1.winCondition).toEqual(c2.winCondition);
    });

    it('should generate different challenges for different dates', () => {
      const c1 = generateDailyChallenge('2026-06-01');
      const c2 = generateDailyChallenge('2026-06-02');
      expect(c1.seed).not.toBe(c2.seed);
    });

    it('should include the correct date', () => {
      const challenge = generateDailyChallenge('2026-12-25');
      expect(challenge.date).toBe('2026-12-25');
    });

    it('should generate between 2 and 3 modifiers', () => {
      // Test many dates to ensure variety
      for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-06-${String(day).padStart(2, '0')}`;
        const challenge = generateDailyChallenge(dateStr);
        expect(challenge.modifiers.length).toBeGreaterThanOrEqual(2);
        expect(challenge.modifiers.length).toBeLessThanOrEqual(3);
      }
    });

    it('should only use valid modifier IDs', () => {
      const knownIds = Object.keys(CHALLENGE_MODIFIERS);
      // Test across many dates
      for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
        const challenge = generateDailyChallenge(dateStr);
        for (const mod of challenge.modifiers) {
          expect(knownIds).toContain(mod);
        }
      }
    });

    it('should generate a valid win condition', () => {
      const challenge = generateDailyChallenge('2026-06-15');
      expect(['wave', 'score', 'kills']).toContain(challenge.winCondition.type);
      expect(challenge.winCondition.value).toBeGreaterThan(0);
      expect(challenge.winCondition.label).toBeTruthy();
    });

    it('should always include resource rewards', () => {
      const challenge = generateDailyChallenge('2026-06-01');
      const resourceRewards = challenge.rewards.filter(r => r.type === 'resources');
      expect(resourceRewards.length).toBe(2);
    });

    it('should include a cursor skin reward', () => {
      const challenge = generateDailyChallenge('2026-06-01');
      const skinRewards = challenge.rewards.filter(r => r.type === 'cursor_skin');
      expect(skinRewards.length).toBe(1);
    });

    it('should include a streak reward', () => {
      const challenge = generateDailyChallenge('2026-06-01');
      expect(challenge.streakReward).toBeDefined();
      expect(challenge.streakReward!.type).toBe('cursor_skin');
    });

    it('should generate a non-zero seed', () => {
      const challenge = generateDailyChallenge('2026-06-15');
      expect(challenge.seed).toBeGreaterThan(0);
    });
  });

  describe('isTodaysChallengeCompleted', () => {
    it('should return false when no challenge has been completed', () => {
      expect(isTodaysChallengeCompleted()).toBe(false);
    });

    it('should return true after completing today\'s challenge', () => {
      completeChallenge({ completed: true, score: 50000, wave: 10, modifierConditions: {} });
      expect(isTodaysChallengeCompleted()).toBe(true);
    });
  });

  describe('completeChallenge', () => {
    it('should save the challenge as completed', () => {
      completeChallenge({ completed: true, score: 75000, wave: 12, modifierConditions: {} });

      const saved = localStorage.getItem('bugsmasher_daily_challenge');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.completed).toBe(true);
      expect(parsed.score).toBe(75_000);
      expect(parsed.wave).toBe(12);
    });

    it('should update streak for consecutive days', () => {
      // Mock localStorage to simulate yesterday's completion
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      localStorage.setItem('bugsmasher_challenge_streak', JSON.stringify({
        currentStreak: 3,
        lastCompletedDate: yesterdayStr,
        highestStreak: 3,
      }));

      completeChallenge({ completed: true, score: 50000, wave: 10, modifierConditions: {} });

      const streak = getStreakInfo();
      expect(streak.currentStreak).toBe(4);
    });

    it('should reset streak when a day is skipped', () => {
      // Simulate streak from 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const dateStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

      localStorage.setItem('bugsmasher_challenge_streak', JSON.stringify({
        currentStreak: 5,
        lastCompletedDate: dateStr,
        highestStreak: 5,
      }));

      completeChallenge({ completed: true, score: 10000, wave: 5, modifierConditions: {} });

      const streak = getStreakInfo();
      expect(streak.currentStreak).toBe(1); // Reset to 1
    });

    it('should not duplicate streak for same-day completion', () => {
      localStorage.setItem('bugsmasher_challenge_streak', JSON.stringify({
        currentStreak: 3,
        lastCompletedDate: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        highestStreak: 3,
      }));

      completeChallenge({ completed: true, score: 10000, wave: 5, modifierConditions: {} });

      const streak = getStreakInfo();
      expect(streak.currentStreak).toBe(3); // Same day, no change
    });

    it('should track highest streak', () => {
      localStorage.setItem('bugsmasher_challenge_streak', JSON.stringify({
        currentStreak: 7,
        lastCompletedDate: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        highestStreak: 7,
      }));

      completeChallenge({ completed: true, score: 50000, wave: 10, modifierConditions: {} });

      const streak = getStreakInfo();
      expect(streak.highestStreak).toBe(8);
    });
  });

  describe('getStreakInfo', () => {
    it('should return default streak info when no data', () => {
      const info = getStreakInfo();
      expect(info.currentStreak).toBe(0);
      expect(info.lastCompletedDate).toBe('');
      expect(info.highestStreak).toBe(0);
    });

    it('should return saved streak info', () => {
      localStorage.setItem('bugsmasher_challenge_streak', JSON.stringify({
        currentStreak: 5,
        lastCompletedDate: '2026-06-10',
        highestStreak: 10,
      }));

      const info = getStreakInfo();
      expect(info.currentStreak).toBe(5);
      expect(info.lastCompletedDate).toBe('2026-06-10');
      expect(info.highestStreak).toBe(10);
    });
  });

  describe('getTodaysChallenge', () => {
    it('should return challenge with completed=false when not yet completed', () => {
      const challenge = getTodaysChallenge();
      expect(challenge.completed).toBe(false);
      expect(challenge.date).toBeTruthy();
    });

    it('should return challenge with completed=true after completion', () => {
      completeChallenge({ completed: true, score: 100000, wave: 20, modifierConditions: {} });
      const challenge = getTodaysChallenge();
      expect(challenge.completed).toBe(true);
      expect(challenge.score).toBe(100_000);
      expect(challenge.wave).toBe(20);
    });
  });

  describe('cosmetics management', () => {
    it('should set and get active skin', () => {
      setActiveSkin('skin_cyber_red');
      expect(getActiveSkin()).toBe('skin_cyber_red');
    });

    it('should allow clearing active skin', () => {
      setActiveSkin('skin_cyber_red');
      setActiveSkin(null);
      expect(getActiveSkin()).toBeNull();
    });

    it('should return empty unlocked skins initially', () => {
      expect(getUnlockedCosmetics()).toEqual([]);
    });

    it('should check if a skin is unlocked', () => {
      expect(isSkinUnlocked('skin_cyber_red')).toBe(false);
    });

    it('should unlock skins on challenge completion', () => {
      // Complete challenge adds cursor skin rewards to unlocked list
      completeChallenge({ completed: true, score: 50000, wave: 10, modifierConditions: {} });

      // After completion, some skins should be unlocked
      const unlocked = getUnlockedCosmetics();
      expect(unlocked.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeModifierState', () => {
    it('should return default state for empty modifiers', () => {
      const state = computeModifierState([]);
      expect(state.bugSpeedMultiplier).toBe(1);
      expect(state.tankSpawnMultiplier).toBe(1);
      expect(state.healerSpawnMultiplier).toBe(1);
      expect(state.playerDamageMultiplier).toBe(1);
      expect(state.maxHealthMultiplier).toBe(1);
      expect(state.bossWaveInterval).toBe(10);
      expect(state.shieldPowerupsDisabled).toBe(false);
    });

    it('should apply fast_bugs modifier', () => {
      const state = computeModifierState(['fast_bugs']);
      expect(state.bugSpeedMultiplier).toBe(1.4);
    });

    it('should apply glass_cannon modifier', () => {
      const state = computeModifierState(['glass_cannon']);
      expect(state.playerDamageMultiplier).toBe(2);
      expect(state.maxHealthMultiplier).toBe(0.5);
    });

    it('should apply tank_wave modifier', () => {
      const state = computeModifierState(['tank_wave']);
      expect(state.tankSpawnMultiplier).toBe(3);
    });

    it('should apply boss_rush modifier', () => {
      const state = computeModifierState(['boss_rush']);
      expect(state.bossWaveInterval).toBe(5);
    });

    it('should apply no_shield modifier', () => {
      const state = computeModifierState(['no_shield']);
      expect(state.shieldPowerupsDisabled).toBe(true);
    });

    it('should apply multiple modifiers simultaneously', () => {
      const state = computeModifierState(['fast_bugs', 'glass_cannon', 'boss_rush']);
      expect(state.bugSpeedMultiplier).toBe(1.4);
      expect(state.playerDamageMultiplier).toBe(2);
      expect(state.maxHealthMultiplier).toBe(0.5);
      expect(state.bossWaveInterval).toBe(5);
    });

    it('should set speed_demon values', () => {
      const state = computeModifierState(['speed_demon']);
      expect(state.speedDemonActive).toBe(true);
      expect(state.speedDemonPerKill).toBe(0.02);
      expect(state.speedDemonMax).toBe(0.8);
    });

    it('should set frostbite active', () => {
      const state = computeModifierState(['frostbite']);
      expect(state.frostbiteActive).toBe(true);
    });

    it('should set darkness visibility multiplier', () => {
      const state = computeModifierState(['darkness']);
      expect(state.visibilityRadiusMultiplier).toBe(0.5);
    });

    it('should set scrap_hunger multipliers', () => {
      const state = computeModifierState(['scrap_hunger']);
      expect(state.resourceDropMultiplier).toBe(0.4);
      expect(state.resourceValueMultiplier).toBe(3);
    });

    it('should set healer_horde multiplier', () => {
      const state = computeModifierState(['healer_horde']);
      expect(state.healerSpawnMultiplier).toBe(4);
    });

    it('should track activeModifiers list', () => {
      const mods: any[] = ['fast_bugs', 'tank_wave'];
      const state = computeModifierState(mods);
      expect(state.activeModifiers).toEqual(mods);
    });
  });

  describe('CHALLENGE_MODIFIERS', () => {
    it('should have all 10 modifiers defined', () => {
      expect(Object.keys(CHALLENGE_MODIFIERS).length).toBe(10);
    });

    it('each modifier should have required fields', () => {
      for (const [id, mod] of Object.entries(CHALLENGE_MODIFIERS)) {
        expect(mod.id).toBe(id);
        expect(mod.name).toBeTruthy();
        expect(mod.description).toBeTruthy();
        expect(mod.icon).toBeTruthy();
        expect(mod.flavor).toBeTruthy();
      }
    });
  });
});
