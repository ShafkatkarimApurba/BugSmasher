export type AuthInitStage = 'idle' | 'token_exchange' | 'session_lookup' | 'ready';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function parseOAuthTokensFromHash(hash: string): OAuthTokens | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!normalized) return null;

  const params = new URLSearchParams(normalized);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresInRaw = params.get('expires_in');

  if (!accessToken || !refreshToken || !expiresInRaw) return null;

  const expiresIn = Number(expiresInRaw);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) return null;

  return { accessToken, refreshToken, expiresIn };
}
