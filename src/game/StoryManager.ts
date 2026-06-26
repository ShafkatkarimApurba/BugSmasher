import { LORE_DATA, LOGS_DATA, StoryBeat } from '../data/lore';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export class StoryManager {
  private static playedBeats: Set<string> = new Set();
  private static unlockedLogs: Set<string> = new Set();
  private static isSyncing = false;

  static init() {
    this.loadLocal();
    this.initCloudSync();
  }

  private static loadLocal() {
    const saved = localStorage.getItem('bugsmasher_story_progress');
    if (saved) {
      const data = JSON.parse(saved);
      this.playedBeats = new Set(data.playedBeats || []);
      this.unlockedLogs = new Set(data.unlockedLogs || []);
    }
  }

  private static async initCloudSync() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'private', 'story');
          
          // Initial fetch
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data) {
              this.playedBeats = new Set(data.playedBeats || []);
              this.unlockedLogs = new Set(data.unlockedLogs || []);
              this.saveLocal();
            }
          } else {
            await setDoc(docRef, { 
              playedBeats: Array.from(this.playedBeats),
              unlockedLogs: Array.from(this.unlockedLogs)
            });
          }

          // Listener
          onSnapshot(docRef, (doc) => {
            if (doc.exists() && !this.isSyncing) {
              const data = doc.data();
              if (data) {
                this.playedBeats = new Set(data.playedBeats || []);
                this.unlockedLogs = new Set(data.unlockedLogs || []);
                this.saveLocal();
              }
            }
          }, (err) => {
            console.warn("Story real-time listener offline or blocked:", err);
          });
        } catch (error) {
          console.warn("Could not synchronize Story data with cloud, playing offline:", error);
        }
      }
    });
  }

  static getTriggeredBeat(type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige', value: number): StoryBeat | null {
    const beat = LORE_DATA.find(b => 
      b.trigger.type === type && 
      b.trigger.value === value && 
      !this.playedBeats.has(b.id)
    );

    if (beat) {
      this.playedBeats.add(beat.id);
      this.save();
      return beat;
    }

    return null;
  }

  static checkLogs(wave: number): string[] {
    const newlyUnlocked: string[] = [];
    LOGS_DATA.forEach(log => {
      if (wave >= log.unlockedAt && !this.unlockedLogs.has(log.id)) {
        this.unlockedLogs.add(log.id);
        newlyUnlocked.push(log.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.save();
    }
    return Array.from(this.unlockedLogs);
  }

  static getUnlockedLogs(): string[] {
    return Array.from(this.unlockedLogs);
  }

  private static save() {
    this.saveLocal();
    this.saveCloud();
  }

  private static saveLocal() {
    localStorage.setItem('bugsmasher_story_progress', JSON.stringify({
      playedBeats: Array.from(this.playedBeats),
      unlockedLogs: Array.from(this.unlockedLogs)
    }));
  }

  private static async saveCloud() {
    const user = auth.currentUser;
    if (user) {
      this.isSyncing = true;
      try {
        const docRef = doc(db, 'users', user.uid, 'private', 'story');
        await setDoc(docRef, { 
          playedBeats: Array.from(this.playedBeats),
          unlockedLogs: Array.from(this.unlockedLogs)
        });
      } catch (e) {
        console.error("Story cloud sync failed", e);
      } finally {
        this.isSyncing = false;
      }
    }
  }

  static reset() {
    this.playedBeats.clear();
    this.unlockedLogs.clear();
    this.save();
  }
}
