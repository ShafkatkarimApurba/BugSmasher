/**
 * Analytics facade — provider-agnostic event tracking.
 * Wire to PostHog/Mixpanel in production via VITE_ANALYTICS_PROVIDER.
 */

export type AnalyticsEvent =
  | 'session_start'
  | 'session_end'
  | 'wave_complete'
  | 'wave_fail'
  | 'game_over'
  | 'powerup_collected'
  | 'daily_challenge_start'
  | 'settings_changed'
  | 'achievement_unlocked';

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined;
}

type AnalyticsProvider = 'none' | 'console' | 'posthog' | 'mixpanel';

function getProvider(): AnalyticsProvider {
  const raw = import.meta.env.VITE_ANALYTICS_PROVIDER as string | undefined;
  if (raw === 'console' || raw === 'posthog' || raw === 'mixpanel') return raw;
  return 'none';
}

class AnalyticsService {
  private sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  private enabled = getProvider() !== 'none';

  track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
    if (!this.enabled) return;
    const envelope = {
      event,
      sessionId: this.sessionId,
      ts: Date.now(),
      ...payload,
    };
    const provider = getProvider();
    if (provider === 'console') {
      console.info('[analytics]', envelope);
    }
    // posthog / mixpanel: inject SDK in Sprint B (TASKBOARD P3-01)
  }

  identify(userId: string, traits?: AnalyticsPayload): void {
    if (!this.enabled) return;
    if (getProvider() === 'console') {
      console.info('[analytics] identify', userId, traits);
    }
  }

  reset(): void {
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const analytics = new AnalyticsService();