// Leaderboard - Full Supabase Integration
// Global and friends leaderboards with cloud sync

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { LeaderboardEntry, FriendProfile } from './types';
import { authManager } from './AuthManager';
import { getSupabaseUrl, getSupabaseAnonKey } from './supabaseConfig';

const LEADERBOARD_KEY = 'bugsmasher_leaderboard';
const FRIENDS_KEY = 'bugsmasher_friends';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  
  supabase = createClient(url, key);
  return supabase;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  lastUpdated: string;
}

const MOCK_PLAYERS: Omit<LeaderboardEntry, 'rank'>[] = [
  { profile_id: 'cpu_1', username: 'NeonSlayer', avatar_id: 'legend', score: 125000, wave: 45, updated_at: '2026-04-26' },
  { profile_id: 'cpu_2', username: 'CyberHunter', avatar_id: 'assassin', score: 98500, wave: 38, updated_at: '2026-04-25' },
  { profile_id: 'cpu_3', username: 'QuantumBug', avatar_id: 'scout', score: 87200, wave: 35, updated_at: '2026-04-25' },
  { profile_id: 'cpu_4', username: 'VoidWalker', avatar_id: 'tank', score: 75800, wave: 32, updated_at: '2026-04-24' },
  { profile_id: 'cpu_5', username: 'DataBreaker', avatar_id: 'warrior', score: 65400, wave: 28, updated_at: '2026-04-24' },
  { profile_id: 'cpu_6', username: 'BugExterminator', avatar_id: 'default', score: 58200, wave: 25, updated_at: '2026-04-23' },
  { profile_id: 'cpu_7', username: 'SwarmDestroyer', avatar_id: 'scout', score: 52100, wave: 22, updated_at: '2026-04-23' },
  { profile_id: 'cpu_8', username: 'CoreGuardian', avatar_id: 'tank', score: 45600, wave: 20, updated_at: '2026-04-22' },
  { profile_id: 'cpu_9', username: 'DigitalNinja', avatar_id: 'assassin', score: 38900, wave: 18, updated_at: '2026-04-22' },
  { profile_id: 'cpu_10', username: 'PixelHunter', avatar_id: 'warrior', score: 32500, wave: 15, updated_at: '2026-04-21' },
];

export class LeaderboardManager {
  private data: LeaderboardData = { entries: [], lastUpdated: '' };
  private cachedLeaderboard: LeaderboardEntry[] | null = null;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load leaderboard:', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save leaderboard:', e);
    }
  }

  async syncToCloud(score: number, wave: number): Promise<void> {
    const sb = getSupabase();
    const profile = authManager.getProfile();
    if (!sb || !profile) return;

    try {
      await sb.from('leaderboard').upsert({
        profile_id: profile.id,
        score,
        wave,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
    } catch (e) {
      console.warn('Leaderboard sync failed:', e);
    }
  }

  async loadFromCloud(): Promise<LeaderboardEntry[]> {
    const sb = getSupabase();
    if (!sb) return this.getLocalLeaderboard();

    try {
      const { data, error } = await sb
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(25);

      if (error || !data || data.length === 0) {
        return this.getLocalLeaderboard();
      }

      const profileIds = data.map((d: any) => d.profile_id);
      const { data: profiles } = await sb
        .from('profiles')
        .select('id, username, avatar_id')
        .in('id', profileIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      const entries: LeaderboardEntry[] = data.map((entry: any, idx: number) => {
        const profile = profileMap.get(entry.profile_id);
        return {
          rank: idx + 1,
          profile_id: entry.profile_id,
          username: profile?.username || 'Unknown',
          avatar_id: profile?.avatar_id || 'default',
          score: entry.score,
          wave: entry.wave,
          updated_at: entry.updated_at,
        };
      });

      this.cachedLeaderboard = entries;
      return entries;
    } catch (e) {
      console.warn('Leaderboard load failed:', e);
      return this.getLocalLeaderboard();
    }
  }

  private getLocalLeaderboard(): LeaderboardEntry[] {
    return MOCK_PLAYERS.map((player, idx) => ({
      ...player,
      rank: idx + 1,
    }));
  }

  async getGlobalLeaderboard(limit: number = 25): Promise<LeaderboardEntry[]> {
    const entries = await this.loadFromCloud();

    const profile = authManager.getProfile();
    const stats = this.getMyStats();

    if (profile && stats) {
      const playerEntry: LeaderboardEntry = {
        rank: 0,
        profile_id: profile.id,
        username: profile.username,
        avatar_id: profile.avatar_id,
        score: stats.total_score,
        wave: stats.highest_wave,
        updated_at: new Date().toISOString(),
      };

      let insertIndex = entries.findIndex(e => stats.total_score > e.score);
      if (insertIndex === -1) insertIndex = entries.length;

      entries.splice(insertIndex, 0, playerEntry);
      entries.forEach((e, i) => e.rank = i + 1);
    }

    return entries.slice(0, limit);
  }

  getGlobalLeaderboardSync(limit: number = 25): LeaderboardEntry[] {
    if (this.cachedLeaderboard) {
      return this.cachedLeaderboard.slice(0, limit);
    }
    return this.getLocalLeaderboard().slice(0, limit);
  }

  private getMyStats(): { total_score: number; highest_wave: number } | null {
    try {
      const stored = localStorage.getItem('bugsmasher_stats');
      if (stored) {
        const stats = JSON.parse(stored);
        return {
          total_score: stats.total_score || 0,
          highest_wave: stats.highest_wave || 0,
        };
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  async submitScore(score: number, wave: number): Promise<number> {
    await this.syncToCloud(score, wave);

    const leaderboard = await this.getGlobalLeaderboard(100);
    const profile = authManager.getProfile();
    if (!profile) return 0;

    const myEntry = leaderboard.find(e => e.profile_id === profile.id);
    return myEntry?.rank || 0;
  }

  async getMyRank(): Promise<number> {
    const leaderboard = await this.getGlobalLeaderboard(100);
    const profile = authManager.getProfile();
    if (!profile) return 0;

    const myEntry = leaderboard.find(e => e.profile_id === profile.id);
    return myEntry?.rank || 0;
  }

  getTopScore(): number {
    return MOCK_PLAYERS[0]?.score || 0;
  }

  getPercentile(rank: number): string {
    const totalPlayers = MOCK_PLAYERS.length + 1;
    const p = ((totalPlayers - rank + 1) / totalPlayers) * 100;

    if (p >= 99) return 'Top 1%';
    if (p >= 95) return 'Top 5%';
    if (p >= 90) return 'Top 10%';
    if (p >= 75) return 'Top 25%';
    if (p >= 50) return 'Top 50%';
    return 'Top 75%';
  }

  async getFriends(): Promise<FriendProfile[]> {
    const sb = getSupabase();
    const profile = authManager.getProfile();
    if (!sb || !profile) return [];

    try {
      const { data, error } = await sb
        .from('friends')
        .select('friend_id, last_seen, online, profiles!inner(id, username, avatar_id, level)')
        .eq('profile_id', profile.id)
        .eq('status', 'accepted');

      if (error || !data) return [];

      return data.map((f: any) => ({
        id: f.friend_id,
        username: f.profiles.username,
        avatar_id: f.profiles.avatar_id,
        level: f.profiles.level,
        last_seen: f.last_seen,
        online: f.online,
      }));
    } catch (e) {
      console.warn('Friends load failed:', e);
      return [];
    }
  }

  async addFriend(friendId: string): Promise<void> {
    const sb = getSupabase();
    const profile = authManager.getProfile();
    if (!sb || !profile) return;

    try {
      await sb.from('friends').insert({
        profile_id: profile.id,
        friend_id: friendId,
        status: 'pending',
      });
    } catch (e) {
      console.warn('Add friend failed:', e);
    }
  }

  async removeFriend(friendId: string): Promise<void> {
    const sb = getSupabase();
    const profile = authManager.getProfile();
    if (!sb || !profile) return;

    try {
      await sb.from('friends').delete()
        .eq('profile_id', profile.id)
        .eq('friend_id', friendId);
    } catch (e) {
      console.warn('Remove friend failed:', e);
    }
  }
}

export const leaderboardManager = new LeaderboardManager();
