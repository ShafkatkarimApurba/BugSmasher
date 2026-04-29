import { describe, expect, it } from 'vitest';
import { parseOAuthTokensFromHash } from './authSession';

describe('parseOAuthTokensFromHash', () => {
  it('parses valid token hash', () => {
    const res = parseOAuthTokensFromHash('#access_token=a&refresh_token=b&expires_in=3600');
    expect(res).toEqual({ accessToken: 'a', refreshToken: 'b', expiresIn: 3600 });
  });

  it('accepts hash without leading #', () => {
    const res = parseOAuthTokensFromHash('access_token=a&refresh_token=b&expires_in=1');
    expect(res?.expiresIn).toBe(1);
  });

  it('returns null for missing access token', () => {
    expect(parseOAuthTokensFromHash('#refresh_token=b&expires_in=3600')).toBeNull();
  });

  it('returns null for missing refresh token', () => {
    expect(parseOAuthTokensFromHash('#access_token=a&expires_in=3600')).toBeNull();
  });

  it('returns null for missing expires_in', () => {
    expect(parseOAuthTokensFromHash('#access_token=a&refresh_token=b')).toBeNull();
  });

  it('returns null for invalid expires_in', () => {
    expect(parseOAuthTokensFromHash('#access_token=a&refresh_token=b&expires_in=abc')).toBeNull();
  });

  it('returns null for negative expires_in', () => {
    expect(parseOAuthTokensFromHash('#access_token=a&refresh_token=b&expires_in=-1')).toBeNull();
  });

  it('returns null for empty hash', () => {
    expect(parseOAuthTokensFromHash('')).toBeNull();
  });

  it('returns null for unrelated params', () => {
    expect(parseOAuthTokensFromHash('#foo=bar')).toBeNull();
  });
});
