// Authentication System - Full Supabase Integration
// Hybrid local-first with Supabase Auth + OAuth

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile, UserStats, UserSettings } from './types';
import { supabaseConfig } from './supabaseConfig';
import { parseOAuthTokensFromHash, type AuthInitStage } from './authSession';

export type AuthProvider = 'guest' | 'email' | 'google' | 'discord' | 'apple';

export interface AuthUser {
  id: string;
  provider: AuthProvider;
  email: string | null;
  username: string;
  createdAt: string;
  isAnonymous: boolean;
  linkedProviders: AuthProvider[];
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AUTH_KEY = 'bugsmasher_auth';
const PROFILE_KEY = 'bugsmasher_profile';
const STATS_KEY = 'bugsmasher_stats';
const SETTINGS_KEY = 'bugsmasher_settings';

let supabase: SupabaseClient | null = null;
let authStateListenerInitialized = false;

function setupAuthStateListener(sb: SupabaseClient): void {
  if (authStateListenerInitialized) return;
  
  sb.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    
    if (event === 'SIGNED_IN' && session?.user) {
      await authManager.handleSupabaseUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      authManager.signOut();
    }
  });
  
  authStateListenerInitialized = true;
  console.log('Auth state listener initialized');
}

const SUPABASE_URL = supabaseConfig.url;
const SUPABASE_ANON_KEY = supabaseConfig.anonKey;

function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  
  console.log('Initializing Supabase with:', { url, hasKey: !!key });
  
  if (!url || !key) {
    console.error('Supabase not configured - missing env vars', { url: !!url, key: !!key });
    return null;
  }
  
  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
  
  setupAuthStateListener(supabase);
  console.log('Supabase client initialized successfully');
  return supabase;
}

function generateId(): string {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function generateUsername(): string {
  const adjectives = ['Neon', 'Cyber', 'Digital', 'Quantum', 'Shadow', 'Storm', 'Thunder', 'Phoenix'];
  const nouns = ['Hunter', 'Slayer', 'Warrior', 'Ninja', 'Ghost', 'Knight', 'Striker', 'Viper'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

export class AuthManager {
  private user: AuthUser | null = null;
  private profile: Profile | null = null;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private initialized = false;
  private sessionInitInFlight: Promise<void> | null = null;
  private authInitStage: AuthInitStage = 'idle';

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const authData = localStorage.getItem(AUTH_KEY);
      if (authData) {
        this.user = JSON.parse(authData);
      }

      const profileData = localStorage.getItem(PROFILE_KEY);
      if (profileData) {
        this.profile = JSON.parse(profileData);
      }
    } catch (e) {
      console.warn('Failed to load auth data:', e);
    }
  }

  save(): void {
    try {
      if (this.user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }

      if (this.profile) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
      } else {
        localStorage.removeItem(PROFILE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save auth data:', e);
    }

    this.notify();
  }

  async syncToCloud(): Promise<void> {
    if (!this.profile || !getSupabaseClient()) return;
    
    const sb = getSupabaseClient();
    if (!sb) return;

    try {
      const { error } = await sb.from('profiles').upsert({
        id: this.profile.id,
        username: this.profile.username,
        email: this.profile.email,
        avatar_url: this.profile.avatar_url,
        avatar_id: this.profile.avatar_id,
        is_guest: this.profile.is_guest,
        level: this.profile.level,
        xp: this.profile.xp,
        crystals: this.profile.crystals,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) {
        console.warn('Failed to sync profile to cloud:', error.message);
      }
    } catch (e) {
      console.warn('Cloud sync error:', e);
    }
  }

  async loadFromCloud(): Promise<Profile | null> {
    const sb = getSupabaseClient();
    if (!sb || !this.user) return null;

    try {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error) {
        console.warn('Failed to load from cloud:', error.message);
        return null;
      }

      return data as Profile;
    } catch (e) {
      console.warn('Cloud load error:', e);
      return null;
    }
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): AuthState {
    return {
      user: this.user,
      profile: this.profile,
      isLoading: false,
      isAuthenticated: !!this.user,
    };
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getProfile(): Profile | null {
    return this.profile;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  isGuest(): boolean {
    return this.user?.provider === 'guest';
  }

  async signInAsGuest(): Promise<AuthUser> {
    const userId = 'guest_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    const username = generateUsername();

    this.user = {
      id: userId,
      provider: 'guest',
      email: null,
      username,
      createdAt: new Date().toISOString(),
      isAnonymous: true,
      linkedProviders: ['guest'],
    };

    this.profile = {
      id: userId,
      username,
      email: null,
      avatar_url: null,
      avatar_id: 'default',
      is_guest: true,
      level: 1,
      xp: 0,
      crystals: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.save();
    await this.syncToCloud();

    return this.user;
  }

  private initializeStats(): void {
    const stats: UserStats = {
      profile_id: this.user!.id,
      total_playtime: 0,
      total_kills: 0,
      total_score: 0,
      highest_wave: 0,
      games_played: 0,
      bugs_smashed: 0,
      enemies_killed: 0,
      powerups_collected: 0,
      upgrades_purchased: 0,
      achievements_unlocked: [],
      current_streak: 0,
      longest_streak: 0,
      last_played_at: new Date().toISOString(),
    };

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  private initializeSettings(): void {
    const settings: UserSettings = {
      profile_id: this.user!.id,
      sound_volume: 0.8,
      music_volume: 0.6,
      graphics_quality: 'medium',
      haptics_enabled: true,
      show_damage_numbers: true,
      show_fps: false,
      difficulty: 'normal',
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  private loadStats(): void {
    try {
      const statsData = localStorage.getItem(STATS_KEY);
      if (!statsData) {
        this.initializeStats();
      }
    } catch (e) {
      this.initializeStats();
    }
  }

  private loadSettings(): void {
    try {
      const settingsData = localStorage.getItem(SETTINGS_KEY);
      if (!settingsData) {
        this.initializeSettings();
      }
    } catch (e) {
      this.initializeSettings();
    }
  }

  async signUpWithEmail(email: string, password: string, username: string): Promise<AuthUser> {
    // In production, this would call Supabase
    // For now, simulate email signup
    const userId = generateId();

    this.user = {
      id: userId,
      provider: 'email',
      email,
      username,
      createdAt: new Date().toISOString(),
      isAnonymous: false,
      linkedProviders: ['guest', 'email'],
    };

    this.profile = {
      id: userId,
      username,
      email: null,
      avatar_url: null,
      avatar_id: 'default',
      is_guest: false,
      level: 1,
      xp: 0,
      crystals: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.initializeStats();
    this.initializeSettings();
    this.save();

    return this.user;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    // Simulate sign in - in production, use Supabase
    const userId = generateId();

    this.user = {
      id: userId,
      provider: 'email',
      email,
      username: 'Player',
      createdAt: new Date().toISOString(),
      isAnonymous: false,
      linkedProviders: ['email'],
    };

    this.profile = {
      id: userId,
      username: 'Player',
      email,
      avatar_url: null,
      avatar_id: 'default',
      is_guest: false,
      level: 1,
      xp: 0,
      crystals: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.loadStats();
    this.loadSettings();
    this.save();
    return this.user;
  }

  async linkProvider(provider: AuthProvider): Promise<void> {
    if (!this.user) return;

    // In production, this would trigger OAuth flow with Supabase
    if (!this.user.linkedProviders.includes(provider)) {
      this.user.linkedProviders.push(provider);
    }
    this.save();
  }

  async updateUsername(username: string): Promise<void> {
    if (!this.user || !this.profile) return;

    this.user.username = username;
    this.profile.username = username;
    this.profile.updated_at = new Date().toISOString();
    this.save();
    await this.syncToCloud();
  }

  async updateAvatar(avatarId: string): Promise<void> {
    if (!this.profile) return;

    this.profile.avatar_id = avatarId;
    this.profile.updated_at = new Date().toISOString();
    this.save();
    await this.syncToCloud();
  }

  addXP(amount: number): void {
    if (!this.profile) return;

    this.profile.xp += amount;

    while (this.profile.xp >= 100 * this.profile.level) {
      this.profile.xp -= 100 * this.profile.level;
      this.profile.level++;
    }

    this.profile.updated_at = new Date().toISOString();
    this.save();
    this.syncToCloud();
  }

  addCrystals(amount: number): void {
    if (!this.profile) return;

    this.profile.crystals += amount;
    this.profile.updated_at = new Date().toISOString();
    this.save();
    this.syncToCloud();
  }

  spendCrystals(amount: number): boolean {
    if (!this.profile || this.profile.crystals < amount) return false;

    this.profile.crystals -= amount;
    this.profile.updated_at = new Date().toISOString();
    this.save();
    this.syncToCloud();
    return true;
  }

  signOut(): void {
    this.user = null;
    this.profile = null;
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    this.notify();
  }

  async restoreSession(): Promise<Profile | null> {
    if (!this.user) return null;
    
    const cloudProfile = await this.loadFromCloud();
    if (cloudProfile) {
      this.profile = cloudProfile;
      this.save();
    }
    return cloudProfile;
  }

  deleteAccount(): void {
    // In production, this would delete from Supabase
    this.signOut();
    localStorage.clear();
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sb = getSupabaseClient();
      if (!sb) {
        await this.signInWithEmail(email, password);
        return { success: true };
      }

      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await this.handleSupabaseUser(data.user);
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Login failed' };
    }
  }

  async signUp(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sb = getSupabaseClient();
      if (!sb) {
        await this.signUpWithEmail(email, password, username);
        return { success: true };
      }

      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await this.handleSupabaseUser(data.user);
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Registration failed' };
    }
}

  private static readonly REDIRECT_URL = 'https://bugsmasher-ten.vercel.app';

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const sb = getSupabaseClient();
      console.log('Google sign-in attempt, client:', !!sb);
      
      if (!sb) {
        console.error('Supabase client is null');
        return { success: false, error: 'Supabase not configured. Please refresh and try again.' };
      }

      console.log('Attempting Google OAuth sign-in...');
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthManager.REDIRECT_URL,
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        return { success: false, error: error.message };
      }

      console.log('Google OAuth initiated, url:', data?.url ? 'generated' : 'none');
      return { success: true };
    } catch (e) {
      console.error('Google sign-in exception:', e);
      return { success: false, error: e instanceof Error ? e.message : 'Google sign-in failed' };
    }
  }

  async signInWithDiscord(): Promise<{ success: boolean; error?: string }> {
    try {
      const sb = getSupabaseClient();
      if (!sb) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { error } = await sb.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: AuthManager.REDIRECT_URL,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Discord sign-in failed' };
    }
  }

  async handleSupabaseUser(sbUser: SupabaseUser): Promise<void> {
    const userId = sbUser.id;
    const email = sbUser.email || null;
    const username = sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || 'Player';
    
    let provider: AuthProvider = 'email';
    if (sbUser.app_metadata?.provider) {
      provider = sbUser.app_metadata.provider as AuthProvider;
    }

    this.user = {
      id: userId,
      provider,
      email,
      username,
      createdAt: sbUser.created_at,
      isAnonymous: sbUser.is_anonymous,
      linkedProviders: [provider],
    };

    this.profile = {
      id: userId,
      username,
      email,
      avatar_url: sbUser.user_metadata?.avatar_url || null,
      avatar_id: sbUser.user_metadata?.avatar_id || 'default',
      is_guest: false,
      level: 1,
      xp: 0,
      crystals: 0,
      created_at: sbUser.created_at,
      updated_at: new Date().toISOString(),
    };

    this.save();
    await this.syncToCloud();
  }

  async convertGuest(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.signUp(username, email, password);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Conversion failed' };
    }
  }

  async checkSession(): Promise<void> {
    if (this.sessionInitInFlight) {
      await this.sessionInitInFlight;
      return;
    }

    const sb = getSupabaseClient();
    if (!sb) return;

    this.authInitStage = 'session_lookup';
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      await this.handleSupabaseUser(session.user);
    }
    this.authInitStage = 'ready';
  }

  getSupabaseConfig(): { url: string; anonKey: string } {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }

  isSupabaseConfigured(): boolean {
    const config = this.getSupabaseConfig();
    return !!config.url && !!config.anonKey;
  }

  async initialize(): Promise<void> {
    if (this.sessionInitInFlight) {
      await this.sessionInitInFlight;
      return;
    }

    this.sessionInitInFlight = (async () => {
      console.log('Initializing auth system...');
      const sb = getSupabaseClient();
      if (!sb) {
        console.log('Supabase not available, using local-only mode');
        return;
      }

      const oauthTokens = parseOAuthTokensFromHash(window.location.hash);

      if (oauthTokens) {
        this.authInitStage = 'token_exchange';
        console.log('OAuth tokens detected in URL, exchanging for session...');
        try {
          const { data, error } = await sb.auth.setSession({
            access_token: oauthTokens.accessToken,
            refresh_token: oauthTokens.refreshToken
          });
          if (error) {
            console.error('Session exchange error:', error.message);
          } else if (data.session) {
            console.log('Session exchanged successfully for:', data.session.user.email);
            await this.handleSupabaseUser(data.session.user);
            this.authInitStage = 'ready';
            return;
          }
        } catch (e) {
          console.error('Failed to exchange session:', e);
        }
      }

      this.authInitStage = 'session_lookup';
      let { data: { session } } = await sb.auth.getSession();

      if (!session?.user) {
        console.log('No session yet, checking again...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const result = await sb.auth.getSession();
        session = result.data.session;
      }

      if (session?.user) {
        console.log('Found session for:', session.user.email);
        await this.handleSupabaseUser(session.user);
      } else {
        console.log('No existing session found');
      }
      this.authInitStage = 'ready';
    })();

    try {
      await this.sessionInitInFlight;
    } finally {
      this.sessionInitInFlight = null;
    }
  }
}

export function getSupabase() {
  return getSupabaseClient();
}

export function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export const authManager = new AuthManager();