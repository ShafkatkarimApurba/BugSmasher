-- BugSmasher Supabase Database Schema
-- Run this in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (User accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  avatar_id TEXT DEFAULT 'default',
  is_guest BOOLEAN DEFAULT true,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  crystals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER_STATS TABLE (Player statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_playtime INTEGER DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  highest_wave INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  bugs_smashed INTEGER DEFAULT 0,
  enemies_killed INTEGER DEFAULT 0,
  powerups_collected INTEGER DEFAULT 0,
  upgrades_purchased INTEGER DEFAULT 0,
  achievements_unlocked TEXT[] DEFAULT '{}',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER_SETTINGS TABLE (User preferences)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  sound_volume REAL DEFAULT 0.8,
  music_volume REAL DEFAULT 0.6,
  graphics_quality TEXT DEFAULT 'medium',
  haptics_enabled BOOLEAN DEFAULT true,
  show_damage_numbers BOOLEAN DEFAULT true,
  show_fps BOOLEAN DEFAULT false,
  difficulty TEXT DEFAULT 'normal'
);

-- ============================================
-- GAME_SAVES TABLE (Game state snapshots)
-- ============================================
CREATE TABLE IF NOT EXISTS game_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_state JSONB NOT NULL,
  version TEXT DEFAULT '1.4.0',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- ============================================
-- LEADERBOARD TABLE (Global rankings)
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  score INTEGER DEFAULT 0,
  wave INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FRIENDS TABLE (Social features)
-- ============================================
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, friend_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_stats_profile ON user_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_game_saves_profile ON game_saves(profile_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_friends_profile ON friends(profile_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id::text OR is_guest = true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id::text);

-- User Stats: Only read own, only update own
CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (profile_id::text = auth.uid()::text);

-- User Settings: Only read own, only update own
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (profile_id::text = auth.uid()::text);

-- Game Saves: Only read own, only update own
CREATE POLICY "Users can view own saves" ON game_saves FOR SELECT USING (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own saves" ON game_saves FOR INSERT WITH CHECK (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can update own saves" ON game_saves FOR UPDATE USING (profile_id::text = auth.uid()::text);

-- Leaderboard: Everyone can read, users can update their own
CREATE POLICY "Leaderboard is viewable by everyone" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can upsert own score" ON leaderboard FOR INSERT WITH CHECK (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can update own score" ON leaderboard FOR UPDATE USING (profile_id::text = auth.uid()::text);

-- Friends: Only see own friends
CREATE POLICY "Users can view own friends" ON friends FOR SELECT USING (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can insert friends" ON friends FOR INSERT WITH CHECK (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can update own friends" ON friends FOR UPDATE USING (profile_id::text = auth.uid()::text);
CREATE POLICY "Users can delete own friends" ON friends FOR DELETE USING (profile_id::text = auth.uid()::text);

-- ============================================
-- ANON/PUBLIC ACCESS (For guest players without auth)
-- ============================================

-- Function to allow public leaderboard reads without auth
CREATE POLICY "Public leaderboard read" ON leaderboard FOR SELECT USING (true);

-- Function to allow guest profile creation
CREATE POLICY "Guest profile creation" ON profiles FOR INSERT WITH CHECK (is_guest = true);
