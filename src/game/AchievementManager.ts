import { StatsManager, UserStats } from './StatsManager';
import type { AchievementSession } from './AchievementSession';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (stats: UserStats, session: AchievementSession) => boolean;
  unlocked: boolean;
}

export const ACHIEVEMENTS_DATA: Omit<Achievement, 'unlocked'>[] = [
  { id: 'first_blood', title: 'First Blood', description: 'Smash your first bug.', icon: 'target', check: (s) => s.totalBugsKilled >= 1 },
  { id: 'exterminator_1', title: 'Exterminator I', description: 'Smash 100 bugs.', icon: 'skull', check: (s) => s.totalBugsKilled >= 100 },
  { id: 'exterminator_2', title: 'Exterminator II', description: 'Smash 500 bugs.', icon: 'skull', check: (s) => s.totalBugsKilled >= 500 },
  { id: 'score_1k', title: 'Apprentice Smasher', description: 'Reach a score of 1,000.', icon: 'star', check: (s) => s.totalScore >= 1000 },
  { id: 'score_10k', title: 'Elite Smasher', description: 'Reach a score of 10,000.', icon: 'star', check: (s) => s.totalScore >= 10000 },
  { id: 'wave_10', title: 'Survivor', description: 'Reach Wave 10.', icon: 'shield', check: (s) => s.totalWavesCompleted >= 10 },
  { id: 'boss_slayer', title: 'Giant Slayer', description: 'Kill your first boss.', icon: 'award', check: (s) => s.bossesKilled >= 1 },
  { id: 'swarmer_slayer', title: 'Swarmer Slayer', description: 'Kill 10 swarmers.', icon: 'zap', check: (s, sess) => sess.swarmerKills >= 10 },
  { id: 'healer_hunter', title: 'Healer Hunter', description: 'Kill 5 healers.', icon: 'heart-off', check: (s, sess) => sess.healerKills >= 5 },
  { id: 'perfectionist', title: 'Perfectionist', description: 'Complete sub-wave without missing a click.', icon: 'aim', check: (s, sess) => sess.perfectSequence && sess.kills >= 10 }
];

export class AchievementManager {
  private static unlockedIds: Set<string> = AchievementManager.load();

  private static load(): Set<string> {
    const saved = localStorage.getItem('nexus_achievements');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  }

  static getAll(): (Omit<Achievement, 'unlocked'> & { unlocked: boolean })[] {
    return ACHIEVEMENTS_DATA.map((a) => ({
      ...a,
      unlocked: this.isUnlocked(a.id),
    }));
  }

  static checkAchievements(sessionData: AchievementSession) {
    const stats = StatsManager.getStats();
    let newlyUnlocked = false;

    ACHIEVEMENTS_DATA.forEach(ach => {
      if (!this.unlockedIds.has(ach.id)) {
        if (ach.check(stats, sessionData)) {
          this.unlockedIds.add(ach.id);
          newlyUnlocked = true;
          this.notify(ach);
        }
      }
    });

    if (newlyUnlocked) this.save();
  }

  private static save() {
    localStorage.setItem('nexus_achievements', JSON.stringify(Array.from(this.unlockedIds)));
  }

  private static notify(achievement: Omit<Achievement, 'unlocked'>) {
    console.log(`ACHIEVEMENT UNLOCKED: ${achievement.title}`);
    // Dispatch custom event for UI to pick up
    window.dispatchEvent(new CustomEvent('achievement_unlocked', { detail: achievement }));
  }

  static getUnlockedCount(): number {
    return this.unlockedIds.size;
  }

  static isUnlocked(id: string): boolean {
    return this.unlockedIds.has(id);
  }
}
