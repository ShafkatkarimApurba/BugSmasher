# BugSmasher Tasks & Issues

## v1.4.2 Status: ✅ COMPLETE (Minor Warnings)

---

## ✅ Completed Tasks

| Task | Status | Notes |
|------|--------|-------|
| Supabase Auth Setup | ✅ Done | PostgreSQL + Auth |
| Google OAuth | ✅ Done | Working |
| Session Persistence | ✅ Done | localStorage + cloud |
| Email/Password Auth | ✅ Done | Working |
| Guest Mode | ✅ Done | Offline-first |
| Centralized Config | ✅ Done | supabaseConfig.ts |
| Auto session restore | ✅ Done | onAuthStateChange |

---

## 🔧 Minor Issues (Non-Breaking)

| Issue | Severity | Fix |
|-------|----------|-----|
| Clock skew warning | Low | Device time - ignore |
| Token lock warnings | Low | Race condition - recovers |
| Session exchange race | Low | Handled by listener |

---

## 📋 Backlog (v1.5.0+)

| Priority | Task | Notes |
|----------|------|-------|
| P1 | Discord OAuth | Ready to test |
| P2 | Apple OAuth | Optional |
| P3 | Improve session handling | Reduce warnings |
| P3 | Loading spinner | Better UX |
| P2 | Profile sync | More data to cloud |

---

## 🔐 Auth Implementation Notes

### Key Files
- `src/game/database/AuthManager.ts` - Main auth logic
- `src/game/database/supabaseConfig.ts` - Central config
- `src/App.tsx` - Initialization flow

### Flow
```
1. App loads → initializeDatabase()
2. authManager.initialize() → getSupabaseClient()
3. Check URL for OAuth tokens
4. setSession() with tokens
5. onAuthStateChange → SIGNED_IN
6. handleSupabaseUser() → update profile
```

### Env Vars (.env)
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY (JWT!)
```

---

## ✅ Quality Gates

| Gate | Result |
|------|--------|
| Lint | ✅ Pass |
| Tests | ✅ 9/9 Pass |
| Build | ✅ Pass |
| Deploy | ✅ Live |

---

Last Updated: 2026-04-29