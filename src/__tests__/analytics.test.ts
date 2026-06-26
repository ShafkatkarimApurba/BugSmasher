import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'console');
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('tracks events when console provider enabled', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { analytics } = await import('../lib/analytics');
    analytics.track('wave_complete', { wave: 5, score: 1200 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});