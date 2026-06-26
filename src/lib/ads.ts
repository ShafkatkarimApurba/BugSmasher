/**
 * Rewarded ads facade — no-op until AdMob/AdSense integration (TASKBOARD P3-05).
 */

export interface AdReward {
  type: 'resource_boost' | 'continue_run';
  amount?: number;
}

const ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';

export class AdsService {
  static isEnabled(): boolean {
    return ENABLED;
  }

  static async showRewarded(_placement: string): Promise<AdReward | null> {
    if (!ENABLED) return null;
    // Provider SDK hooks here
    return null;
  }

  static preload(): void {
    if (!ENABLED) return;
  }
}