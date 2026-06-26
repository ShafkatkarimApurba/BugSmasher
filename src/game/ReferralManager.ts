// ReferralSystem - Viral growth engine with incentivized referrals

export interface ReferralReward {
  referrals: number;
  reward: string;
  description: string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalInvitesSent: number;
  successfulConversions: number;
}

const REFERRAL_KEY = 'bugsmasher_referral';

const REWARD_TIERS: ReferralReward[] = [
  { referrals: 1, reward: 'core_spark', description: 'Spark Core skin' },
  { referrals: 3, reward: '50_prestige', description: '50 Prestige Points' },
  { referrals: 5, reward: 'bug_rainbow', description: 'Rainbow Bug skin' },
  { referrals: 10, reward: '100_prestige', description: '100 Prestige Points' },
  { referrals: 25, reward: 'trail_rainbow', description: 'Rainbow Trail' },
  { referrals: 50, reward: 'exclusive_pack', description: 'All exclusive skins' },
];

export class ReferralManager {
  private referrerId: string = '';
  private totalReferrals: number = 0;
  private invitesSent: number = 0;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(REFERRAL_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.referrerId = data.referrerId || '';
        this.totalReferrals = data.totalReferrals || 0;
        this.invitesSent = data.invitesSent || 0;
      }
    } catch (e) {
      console.warn('Failed to load referral data:', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(REFERRAL_KEY, JSON.stringify({
        referrerId: this.referrerId,
        totalReferrals: this.totalReferrals,
        invitesSent: this.invitesSent,
      }));
    } catch (e) {
      console.warn('Failed to save referral data:', e);
    }
  }

  setReferrer(referrerId: string): void {
    this.referrerId = referrerId;
    this.save();
  }

  getReferrer(): string {
    return this.referrerId;
  }

  generateReferralLink(): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bugsmasher.shafkat.app';
    const userId = this.getUserId();
    return `${baseUrl}?ref=${userId}`;
  }

  private getUserId(): string {
    let userId = localStorage.getItem('bugsmasher_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('bugsmasher_user_id', userId);
    }
    return userId;
  }

  registerReferral(): boolean {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const refId = params.get('ref');
    
    if (refId && refId !== this.getUserId()) {
      this.referrerId = refId;
      this.totalReferrals++;
      this.save();
      return true;
    }
    return false;
  }

  recordInvite(): void {
    this.invitesSent++;
    this.save();
  }

  getStats(): ReferralStats {
    return {
      totalReferrals: this.totalReferrals,
      totalInvitesSent: this.invitesSent,
      successfulConversions: this.totalReferrals,
    };
  }

  getNextReward(): ReferralReward | null {
    const currentTier = REWARD_TIERS.findIndex(t => this.totalReferrals < t.referrals);
    if (currentTier === -1) return null;
    return REWARD_TIERS[currentTier];
  }

  getAllTiers(): ReferralReward[] {
    return REWARD_TIERS;
  }

  getProgressToReward(referrals: number): { current: ReferralReward | null; next: ReferralReward | null } {
    let current = null;
    let next = null;
    
    for (const tier of REWARD_TIERS) {
      if (this.totalReferrals >= tier.referrals) {
        current = tier;
      } else if (!next) {
        next = tier;
      }
    }
    
    return { current, next };
  }

  getInviteMessage(): string {
    const score = 0;
    return `🎮 I scored ${score.toLocaleString()} points in BugSmasher! Can you beat my score?\n\n🐛 DEFEND THE CORE. SMASH THE SWARM.\n\nJoin me: ${this.generateReferralLink()}`;
  }

  getConversionRate(): number {
    if (this.invitesSent === 0) return 0;
    return this.totalReferrals / this.invitesSent;
  }
}

export const referralManager = new ReferralManager();