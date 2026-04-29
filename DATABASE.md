# Database System Documentation

## Overview

BugSmasher uses a **hybrid offline-first architecture** with Supabase cloud sync:

1. **Local Storage:** Data saves to localStorage immediately (instant access)
2. **Cloud Sync:** Background sync to Supabase (persistence across devices/sessions)
3. **Restore:** On page load, pulls latest data from cloud if localStorage is cleared

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GAME CLIENT                         │
├─────────────────────────────────────────────────────────────┤
│  AuthManager ───► CloudSaveManager ───► StatsManager    │
│       │                │                    │               │
│       ▼                ▼                    ▼              │
│  localStorage      localStorage         localStorage     │
│       │                │                    │               │
│       ▼                ▼                    ▼              │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Supabase (Cloud)                      │    │
│  │  profiles | user_stats | game_saves | leaderboard│   │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Current Status (v1.4.2)

| System | Status |
|--------|--------|
| Database Tables | ✅ 4 tables active |
| Auth | ✅ Email + Google OAuth |
| Cloud Sync | ✅ Working |
| Leaderboard | ✅ 17 players |

## Database Tables

### profiles
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,           -- Unique user ID
  username TEXT UNIQUE NOT NULL, -- Display name
  email TEXT,                    -- Email (for accounts)
  avatar_id TEXT,                -- Selected avatar
  is_guest BOOLEAN DEFAULT true, -- Guest vs account
  level INTEGER DEFAULT 1,       -- Player level
  xp INTEGER DEFAULT 0,         -- Experience points
  crystals INTEGER DEFAULT 0,   -- In-game currency
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### user_stats
```sql
CREATE TABLE user_stats (
  profile_id TEXT PRIMARY KEY,   -- Links to profiles.id
  total_playtime INTEGER,        -- Seconds played
  total_kills INTEGER,           -- Total bugs killed
  total_score INTEGER,           -- Highest score
  highest_wave INTEGER,         -- Furthest wave reached
  games_played INTEGER,
  bugs_smashed INTEGER,
  enemies_killed INTEGER,
  powerups_collected INTEGER,
  upgrades_purchased INTEGER,
  achievements_unlocked TEXT[],  -- Array of achievement IDs
  current_streak INTEGER,       -- Daily play streak
  longest_streak INTEGER,
  last_played_at TIMESTAMPTZ
);
```

### game_saves
```sql
CREATE TABLE game_saves (
  profile_id TEXT PRIMARY KEY,
  game_state JSONB NOT NULL,     -- Full game snapshot
  version TEXT,                 -- Game version
  timestamp TIMESTAMPTZ
);
```

### leaderboard
```sql
CREATE TABLE leaderboard (
  profile_id TEXT PRIMARY KEY,
  score INTEGER,
  wave INTEGER,
  updated_at TIMESTAMPTZ
);
```

## Security (Row Level Security)

All tables have RLS policies that allow:
- Anyone to read (leaderboard, profiles)
- Only the profile owner to insert/update their own data

This prevents users from modifying other players' data.

## Sync Flow

### On Game End
1. Save game state to localStorage
2. Sync stats to Supabase (`await statsManager.syncToCloud()`)
3. Sync profile to Supabase (`await authManager.syncToCloud()`)
4. Submit leaderboard score

### On Page Load
1. Load from localStorage (instant)
2. Call `restoreUserData()` which:
   - Loads profile from Supabase
   - Loads stats from Supabase
   - Loads game save from Supabase

## Manager APIs

### AuthManager
```typescript
authManager.getProfile(): Profile | null
authManager.getUser(): AuthUser | null
authManager.isAuthenticated(): boolean
authManager.syncToCloud(): Promise<void>
authManager.restoreSession(): Promise<Profile | null>
authManager.signInAsGuest(): Promise<AuthUser>
authManager.addXP(amount: number): void
authManager.addCrystals(amount: number): void
authManager.spendCrystals(amount: number): boolean
```

### StatsManager
```typescript
statsManager.getStats(): UserStats | null
statsManager.initialize(): void
statsManager.syncToCloud(): Promise<void>
statsManager.loadFromCloud(): Promise<UserStats | null>
statsManager.restore(): Promise<boolean>
statsManager.recordGameEnd(score, wave, kills, playTime): void
statsManager.getAchievements(): Achievement[]
statsManager.getStreak(): number
```

### CloudSaveManager
```typescript
cloudSaveManager.saveGame(state): void
cloudSaveManager.loadGame(): GameStateSnapshot | null
cloudSaveManager.restoreGame(): Promise<GameStateSnapshot | null>
cloudSaveManager.hasSave(): boolean
```

### LeaderboardManager
```typescript
leaderboardManager.getGlobalLeaderboard(): Promise<LeaderboardEntry[]>
leaderboardManager.submitScore(score, wave): Promise<rank>
leaderboardManager.getMyRank(): Promise<number>
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Troubleshooting

### Data not persisting?
1. Check browser console for errors
2. Verify Supabase tables exist
3. Check RLS policies are set

### Leaderboard not updating?
- Ensure `submitScore()` is called after game ends
- Check network tab for failed requests

### Restore not working?
- Ensure `restoreUserData()` is called on app init
- Check cloud data exists

---

## Test Credentials

```bash
Email: demo@example.com
Password: ********
```

## Admin Commands

```bash
# List all users
node user-admin.mjs list

# Show leaderboard
node user-admin.mjs leaderboard

# Full system check
node check-system.mjs
```

## Files

- `src/game/database/AuthManager.ts` - User authentication
- `src/game/database/StatsManager.ts` - Player statistics
- `src/game/database/CloudSaveManager.ts` - Game state persistence
- `src/game/database/LeaderboardManager.ts` - Global rankings
- `src/game/database/types.ts` - TypeScript interfaces
- `src/game/database/index.ts` - Module exports- `supabase/schema.sql` - Database schema (run in SQL Editor)