import { FirebaseService } from '../lib/firebaseService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ChecksumSystem } from '../lib/checksum';

import { UserStats, StatsManager } from './StatsManager';

export interface GameSaveData {
  score: number;
  wave: number;
  health: number;
  maxHealth: number;
  clickRadiusMultiplier: number;
  autoTurretLevel: number;
  healthLevel?: number;
  radiusLevel?: number;
  timestamp: number;
  stats?: UserStats;
  playedStoryBeats?: string[];
  checksum?: string;
}

export class SaveManager {
  private static STORAGE_KEY = 'bugsmasher_save_data';
  private static HIGH_SCORE_KEY = 'bugsmasher_all_time_high';

  static async save(data: GameSaveData): Promise<boolean> {
    try {
      const stats = StatsManager.getStats();
      const rawData = { ...data, stats };
      // @ts-ignore
      delete rawData.checksum; // Ensure we don't hash the previous checksum

      const checksum = await ChecksumSystem.generate(rawData);
      const fullData = { ...rawData, checksum };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullData));
      
      const user = auth.currentUser;
      if (user) {
        try {
          await FirebaseService.uploadSave(user.uid, fullData);
        } catch (uploadError) {
          console.warn('Could not sync save data to cloud, saved locally:', uploadError);
        }
      }
      
      return true;
    } catch (e) {
      console.error('Failed to save game data', e);
      return false;
    }
  }

  static async load(): Promise<GameSaveData | null> {
    try {
      // Try Cloud Save first if logged in
      const user = auth.currentUser;
      let dataStr: string | null = null;
      let isCloud = false;

      if (user) {
        try {
          const cloudData = await FirebaseService.downloadSave(user.uid);
          if (cloudData) {
            dataStr = JSON.stringify(cloudData);
            isCloud = true;
          }
        } catch (cloudError) {
          console.warn('Could not download save from cloud, falling back to local storage:', cloudError);
        }
      }

      if (!dataStr) {
        dataStr = localStorage.getItem(this.STORAGE_KEY);
      }

      if (!dataStr) return null;
      
      const parsed = JSON.parse(dataStr) as GameSaveData;
      const { checksum, ...pureData } = parsed;

      if (checksum) {
        const isValid = await ChecksumSystem.verify(pureData, checksum);
        if (!isValid) {
          console.error('Save data integrity check failed! Potential tampering detected.');
          // On failure, we could either reject or proceed with a warning
          // For a game, rejection is safer to prevent leaderboard pollution
          return null;
        }
      } else {
        console.warn('Save data lacks a checksum. This might be an old save or tampered.');
      }

      if (parsed.stats) StatsManager.setStats(parsed.stats);
      
      // If we loaded from cloud and it was valid, sync local
      if (isCloud) {
        localStorage.setItem(this.STORAGE_KEY, dataStr);
      }

      return parsed;
    } catch (e) {
      console.error('Failed to load game data', e);
      return null;
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static getHighScore(): number {
    const val = localStorage.getItem(this.HIGH_SCORE_KEY);
    return val ? parseInt(val) : 0;
  }

  static async setHighScore(score: number, wave: number): Promise<void> {
    const current = this.getHighScore();
    if (score > current) {
      localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
      
      const user = auth.currentUser;
      if (user) {
        try {
          // Get username from profile
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const username = userSnap.exists() ? userSnap.data().username : (user.displayName || 'Anonymous User');
          await FirebaseService.submitScore(user.uid, username, score, wave);
        } catch (fsError) {
          console.warn('Could not submit high score online. Stored locally.', fsError);
        }
      }
    }
  }
}
