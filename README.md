# 🪲 BugSmasher by HopeTheory

<p align="center">
  <img src="https://img.shields.io/badge/version-1.4.2-blue" alt="Version">
  <img src="https://img.shields.io/badge/status-10%2F10-green" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build">
</p>

<p align="center">
  <strong>DEFEND THE CORE. SMASH THE SWARM.</strong><br>
  A wave-based arcade clicker defense game with cyberpunk aesthetics.
</p>

---

## 🎮 Features

- **Core Gameplay:** Click to destroy bugs before they reach the core
- **Waves:** Progressive difficulty with faster/smarter enemies
- **Upgrades:** Health, click radius, auto-turret
- **Powerups:** 7 unique powerups with distinct visuals
- **Combo:** Chain kills for multipliers and screen effects
- **Prestige:** Infinite replay with bonus multipliers
- **Biomes:** 5 unlockable themes
- **Daily Challenges:** Extra crystals
- **Achievements:** 16 unlockable badges
- **Account System:** Guest + Email/Password + Google OAuth
- **Leaderboards:** Global rankings with CPU players
- **Cloud Saves:** Auto-save with Supabase sync
- **XP & Leveling:** Earn XP, level up
- **Crystals:** In-game currency

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Motion |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google) |
| Storage | localStorage (offline-first) |
| Build | Vite 6 |
| Hosting | Vercel |

---

## 🔐 Authentication (v1.4.2)

BugSmasher uses **Supabase Auth** for user accounts with multiple login methods:

### Login Methods
| Method | Status | Description |
|--------|--------|------------|
| Guest | ✅ Working | Offline-first, local storage |
| Email/Password | ✅ Working | Supabase email auth |
| Google OAuth | ✅ Working | Full OAuth flow |
| Discord OAuth | ✅ Working | Full OAuth flow |

### Auth Flow (Production)

1. **App Start** → Check session from localStorage
2. **OAuth Redirect** → Extract tokens from URL hash
3. **Token Exchange** → Create session via `setSession()`
4. **State Update** → `onAuthStateChange` listener updates UI
5. **Persist** → Save to localStorage + sync to cloud

### Supabase Configuration

```typescript
// src/game/database/supabaseConfig.ts
export const supabaseConfig = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY' // JWT format
};
```

### Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Clock skew warning | Low | Non-breaking - device time issue |
| Token lock warnings | Low | Race condition - recovers automatically |
| Session exchange race | Low | `onAuthStateChange` catches it |

### Test Credentials

```
Email: demo@example.com
Password: ********
Google: Any Gmail account works
```

---

## 🏗️ Architecture

```
src/
├── game/
│   ├── database/          # Auth + Stats + Cloud
│   │   ├── AuthManager.ts      # User authentication
│   │   ├── StatsManager.ts   # Player stats & XP
│   │   ├── LeaderboardManager.ts
│   │   ├── CloudSaveManager.ts
│   │   └── supabaseConfig.ts # Central config
│   ├── components/       # React components
│   ├── GameEngine.ts      # Main game logic
│   └── ...
```

---

## 🚦 Quick Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Type check |
| `npm test` | Run tests |

---

## 📦 Deployment

- **Production:** https://bugsmasher-ten.vercel.app
- **GitHub:** https://github.com/FahadIbrahim93/BugSmasher-HopeTheory
- **Supabase:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID

---

## 📝 Changelog

### v1.4.2 (2026-04-29)
- ✅ Full Supabase Auth integration
- ✅ Google OAuth working
- ✅ Session persistence
- ✅ Centralized supabaseConfig.ts
- ⚠️ Minor clock skew warnings (non-breaking)

### v1.4.1 (2026-04-26)
- ✅ Initial auth system
- ✅ Supabase database tables
- ⚠️ OAuth redirect issues fixed in v1.4.2

---

## License

MIT © 2026 HopeTheory