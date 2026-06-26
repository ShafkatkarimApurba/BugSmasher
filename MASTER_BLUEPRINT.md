# BUGSMASHER — MASTER BLUEPRINT: 10/10 Elevation

> **Version:** 1.0 · **Date:** 2026-06-03  
> **Authority:** This document supersedes SESSION.md, TASKBOARD.md, and AUDIT_REPORT.md for all 10/10 elevation work.  
> **Audience:** Any AI coding agent (Gemini, Cursor, Copilot, Windsurf, Claude) executing tasks against this repo.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | BugSmasher |
| **One-line** | A tactical QA base-defense game: brutalist OS terminal vs. bioluminescent neon bugs |
| **Stack** | React 19 · TypeScript 5.8 · Vite 6 · Canvas 2D · Firebase · Tailwind 4 |
| **Repo** | `https://github.com/HopeTheoory/BugSmasher-ApZz` |
| **Version** | 2.5.0 |
| **Tests** | 411 passing across 17 suites (Vitest) |
| **Build** | `npm run ci` → lint → validate:functions → test → build |

---

## 2. Honest Baseline Assessment (NOT the inflated 9.8)

| Dimension | Honest Rating | Why | 10/10 Requires |
|-----------|:---:|---|---|
| **Architecture** | 8.0 | Modular systems, clean extraction, event bus | Zero `any`, full DI, error recovery |
| **Visual FX** | 5.0 | Basic fills, rudimentary glow, no bloom/lighting | Full VFX pipeline: bloom, dynamic lighting, screen shake, combo visuals, trails, post-processing |
| **Audio** | 3.0 | 45KB SoundManager is ALL procedural oscillators | Professional-grade SFX, spatial audio, adaptive layered soundtrack |
| **Game Feel (Juice)** | 4.0 | Basic hitStop + random shake | Physics-based screen shake, hitstop with combo scaling, chromatic aberration, impact freeze |
| **UI/UX** | 6.0 | Functional menus, not premium | Glassmorphism, micro-animations, premium typography, branded preloader, onboarding flow |
| **Type Safety** | 7.0 | Multiple `any` in UI components | Zero `any` across entire codebase |
| **Testing** | 8.5 | 411 unit tests, zero E2E | E2E via Playwright, visual regression, VFX system unit tests |
| **Error Recovery** | 3.0 | No try-catch in render loop | Graceful degradation, error logging, fallback rendering |
| **Analytics** | 1.0 | Empty facade, no tracking | PostHog/Mixpanel integration, funnel analysis |
| **i18n** | 2.0 | Catalog files exist, not wired | Full hook-through, language picker, 2+ locales |
| **Social** | 3.0 | URL params for friend challenge | Share cards, tournament backend, invite system |
| **Accessibility** | 7.0 | Difficulty presets, reduced motion, gamepad | ARIA menus, screen reader, colorblind filter pipeline, control remapping UI |
| **Performance** | 8.0 | FPS scaler, quality presets | Offscreen layer caching, <300kB gzip main bundle, sub-1ms bloom |
| **DevOps** | 8.5 | CI/CD, Firebase + Vercel | E2E in CI, lighthouse perf gate, staging previews |
| **Business** | 1.0 | Stubs only, no revenue | Payment integration, supporter pack, ad placement |

**Composite: 7.5 / 10** (honest) — strong foundation, severe VFX/audio/business gaps.

---

## 3. The 10/10 Definition

A game is 10/10 when a senior engineer at a top studio would say:

> "I would ship this. The code is clean, the game feels incredible, every kill is satisfying, the UI is premium, it runs on any device, players can pay if they want to, and I can onboard a new developer in under an hour."

### Four Pillars of 10/10

| Pillar | Test |
|--------|------|
| **Technical Excellence** | `npm run ci` passes. Zero `any`. Zero console errors in 20-wave run. Bundle <300kB gzip. 60fps desktop, 30fps mobile. |
| **Player Experience** | Kills feel "crunchy" (hitstop + audio + particles + shake). UI is premium (glassmorphism, micro-animations). Smooth onboarding. Works offline (PWA). |
| **Operational Excellence** | CI/CD green. E2E in pipeline. Analytics tracking. Error monitoring. Docs current. |
| **Business Viability** | Analytics funnel. At least one monetization path. Social sharing. i18n for 2+ locales. |

---

## 4. Milestone Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    MILESTONE PROGRESSION                         │
│                                                                  │
│  M1: VFX Pipeline ──► M2: Game Feel ──► M3: UI Polish           │
│  (7.5→8.3)            (8.3→8.8)         (8.8→9.2)               │
│       │                    │                  │                   │
│       ▼                    ▼                  ▼                   │
│  M4: Tech Excellence ──► M5: Business ──► M6: Final QA          │
│  (9.2→9.5)              (9.5→9.8)        (9.8→10.0)             │
└─────────────────────────────────────────────────────────────────┘
```

### M1 — Visual FX Pipeline (7.5 → 8.3)
**Goal:** Transform flat 2D rendering into a multi-layer VFX pipeline with bloom, dynamic lighting, and post-processing.

### M2 — Game Feel & Audio (8.3 → 8.8)
**Goal:** Every kill is satisfying. Physics-based screen shake, hitstop system, particle trails, improved audio.

### M3 — UI/UX Premium Polish (8.8 → 9.2)
**Goal:** First impression = "this is a professional game." Glassmorphism, micro-animations, branded preloader, onboarding flow.

### M4 — Technical Excellence (9.2 → 9.5)
**Goal:** Zero tech debt. Zero `any`. Error recovery. E2E tests. Comprehensive unit tests for new systems.

### M5 — Business & Growth (9.5 → 9.8)
**Goal:** Analytics, i18n, social sharing, accessibility completion, monetization path.

### M6 — Final QA & Ship (9.8 → 10.0)
**Goal:** Full regression. Performance audit. Documentation update. Version bump. Clean deploy.

---

## 5. Agent Routing Table

Every task is assigned to a specific **agent role**. Any AI tool can act as any agent — what matters is following the role's rules.

| Agent Role | Milestones | Required Reading Before Work |
|------------|-----------|------|
| **VFX Engineer** | M1, M2 | `AGENTS.md`, `docs/ARCHITECTURE.md`, `RENDERING_SPEC.md` |
| **Audio Engineer** | M2 | `AGENTS.md`, `AUDIO_SPEC.md`, `src/game/SoundManager.ts` |
| **UI/UX Designer** | M3 | `AGENTS.md`, `UI_SPEC.md`, `DESIGN_DOC.md` |
| **TypeScript Specialist** | M4 | `AGENTS.md`, `TECH_DEBT_SPEC.md` |
| **Test Engineer** | M4, M6 | `AGENTS.md`, `TEST_SPEC.md` |
| **Business Engineer** | M5 | `AGENTS.md`, `BUSINESS_SPEC.md` |
| **QA Lead** | M6 | All specs + `FINAL_QA_CHECKLIST.md` |

---

## 6. Global Execution Protocol

Every AI agent working on this repo MUST follow this protocol:

### Before Starting ANY Task

```
1. Read AGENTS.md (architecture + coding standards)
2. Read the relevant SPEC file for your milestone
3. Read CONTRIBUTING.md (commit format, PR rules)
4. Read the specific task from TASK_REGISTRY.md
5. Run `npm run ci` — confirm green baseline
```

### During Execution

```
1. Create a feature branch: `feat/M{N}-{short-name}`
2. Write code following clean-code standards
3. Write tests for every new system (>80% coverage)
4. Run `npm run ci` after every logical change
5. Update TASK_REGISTRY.md status as you go
```

### After Completion

```
1. Run `npm run ci` — must be green
2. Update TASK_REGISTRY.md: mark task [x]
3. Update AUDIT_REPORT.md ratings if dimension materially changed
4. Commit with conventional format: `feat(vfx): add BloomSystem [M1-T2]`
5. Do NOT self-rate above the honest rating criteria in this document
```

### Hard Rules (Violations = Reject the Work)

| Rule | Rationale |
|------|-----------|
| No `any` in `src/game/` | Type safety is non-negotiable |
| No `setTimeout`/`setInterval` for game state | All timing via `dt` in update loop |
| No logic in `GameEngine.ts` — extract systems | Keep orchestrator lean |
| No `(window as any)` | Use `GameEngineStatusBus` |
| Renderer changes in `src/game/rendering/` only | No monolith regrowth |
| Every new system has tests | No untested code ships |
| `npm run ci` passes before marking done | Green gate |

---

## 7. File Map (Current → Target)

### Existing Architecture
```
src/
├── App.tsx                          # Root component
├── main.tsx                         # Entry point
├── index.css                        # Global styles (25KB)
├── components/                      # 22 React components
│   ├── Game.tsx                     # Game session orchestrator
│   ├── GameCanvas.tsx               # Canvas mount
│   ├── MainMenu.tsx                 # Main menu
│   ├── HUD.tsx                      # In-game HUD
│   ├── GameOver.tsx                 # Game over screen
│   ├── UpgradeMenu.tsx              # Between-wave upgrades
│   ├── SettingsMenu.tsx             # Settings panel
│   ├── Armory.tsx                   # Cosmetics shop
│   ├── CustomCursor.tsx             # Custom cursor
│   └── ... (13 more)
├── game/                            # Canvas game engine
│   ├── GameEngine.ts                # 961 lines — orchestrator
│   ├── Renderer.ts                  # 290 lines — draw orchestrator
│   ├── ParticleSystem.ts            # Particle spawning/update
│   ├── SoundManager.ts              # 45KB — procedural audio
│   ├── WaveManager.ts               # Wave spawn pacing
│   ├── BossSystem.ts                # Boss AI
│   ├── CollisionSystem.ts           # Hit detection
│   ├── PowerupSystem.ts             # Powerup logic
│   ├── HazardSystem.ts              # Hazard logic
│   ├── InputSystem.ts               # Input handling
│   ├── GameConfig.ts                # Balance constants
│   ├── GameTypes.ts                 # Entity interfaces
│   ├── ... (8 more managers)
│   └── rendering/                   # Sub-renderers
│       ├── PerformanceScaler.ts     # FPS-based quality scaling
│       ├── EnvironmentRenderer.ts   # Background, CRT, scanlines
│       ├── BugRenderer.ts           # Bug drawing (35KB!)
│       ├── ParticleRenderer.ts      # Particle drawing
│       ├── UIRenderer.ts            # Lighting pass, boss HP, powerup UI
│       └── OffscreenEnvironmentCache.ts
├── contexts/                        # React contexts
├── data/                            # Static data (lore, etc.)
├── i18n/                            # Translation catalogs
└── lib/                             # Utilities (analytics, firebase)
```

### New Files to Create (by Milestone)

```
src/game/
├── HitstopSystem.ts                 # [M2] Fighting-game impact freeze
├── ParticleTrailSystem.ts           # [M2] Bug motion trails
├── HapticFeedback.ts                # [M2] Vibration/rumble integration
└── rendering/
    ├── VisualFXPipeline.ts          # [M1] Multi-layer render pipeline
    ├── BloomSystem.ts               # [M1] Screen-space glow
    ├── DynamicLightingSystem.ts     # [M1] Per-frame light sources
    ├── PostProcessingSystem.ts      # [M1] Vignette, chromatic, CRT, color grade
    ├── ScreenShakeSystem.ts         # [M2] Physics-based directional shake
    ├── ComboVisualSystem.ts         # [M2] Combo counter VFX
    └── WaveTransitionSystem.ts      # [M2] Cinematic wave transitions

src/__tests__/
├── VisualFXPipeline.test.ts         # [M4]
├── BloomSystem.test.ts              # [M4]
├── HitstopSystem.test.ts            # [M4]
├── ScreenShakeSystem.test.ts        # [M4]
└── ComboVisualSystem.test.ts        # [M4]

src/lib/
└── posthog.ts                       # [M5] Analytics integration

e2e/                                 # [M4] Playwright E2E tests
├── game-flow.spec.ts
├── menu-navigation.spec.ts
└── settings.spec.ts
```

---

## 8. Reference Material

### Overhaul Source Files

The directory `overhaul/` (sibling to `repo/`) contains pre-written VFX systems. These are **reference implementations**, not drop-in files. They import from phantom paths and need adaptation.

| File | Purpose | Integration Risk |
|------|---------|-----------------|
| `overhaul/rendering/VisualFXPipeline.ts` | Pipeline orchestrator | Medium — needs import path fixes, PerformanceScaler interface alignment |
| `overhaul/rendering/BloomSystem.ts` | Bloom/glow | Low — self-contained, uses standard Canvas 2D |
| `overhaul/rendering/DynamicLightingSystem.ts` | Dynamic lights | Low — standalone system |
| `overhaul/rendering/PostProcessingSystem.ts` | Post-processing | Medium — replaces inline code in Renderer.draw() |
| `overhaul/rendering/ScreenShakeSystem.ts` | Enhanced shake | Medium — replaces GameEngine.shake() API |
| `overhaul/rendering/ComboVisualSystem.ts` | Combo VFX | Low — additive system |
| `overhaul/rendering/WaveTransitionSystem.ts` | Wave cinematics | Low — additive system |
| `overhaul/HitstopSystem.ts` | Impact freeze | Medium — replaces hitStopTimer in GameEngine |
| `overhaul/ParticleTrailSystem.ts` | Bug trails | Low — additive system |
| `overhaul/GameEngine.patch.ts` | Integration instructions | N/A — documentation, not code |
| `overhaul/Renderer.ts` | Replacement renderer | High — must be carefully merged with existing Renderer.ts |

---

## 9. Success Criteria (How We Know We're 10/10)

| Checkpoint | Verification |
|------------|-------------|
| VFX works | Play 10 waves — see bloom on bugs, dynamic lighting, screen shake on kills |
| Audio satisfies | Every kill has audible feedback that matches visual intensity |
| UI is premium | Cold launch → preloader → menu feels like a AAA indie |
| Zero errors | 20-wave DevTools run: zero console.error |
| Tests pass | `npm run ci` green, 450+ tests (411 baseline + new systems) |
| Performance | 60fps desktop, 30fps mobile on quality "Balanced" |
| Analytics | PostHog dashboard shows events after a play session |
| i18n works | Switch language in settings → all UI strings change |
| Accessibility | Screen reader can navigate menus. Colorblind mode works. |
| Share works | Game over → share → generates image with score |

---

## 10. Document Registry

| Document | Location | Purpose |
|----------|----------|---------|
| **This file** | `MASTER_BLUEPRINT.md` | Single source of truth |
| `TASK_REGISTRY.md` | `repo/TASK_REGISTRY.md` | Every task with acceptance criteria |
| `RENDERING_SPEC.md` | `repo/docs/specs/RENDERING_SPEC.md` | M1 VFX pipeline specification |
| `AUDIO_SPEC.md` | `repo/docs/specs/AUDIO_SPEC.md` | M2 audio specification |
| `GAMEFEEL_SPEC.md` | `repo/docs/specs/GAMEFEEL_SPEC.md` | M2 game feel specification |
| `UI_SPEC.md` | `repo/docs/specs/UI_SPEC.md` | M3 UI/UX specification |
| `TECH_DEBT_SPEC.md` | `repo/docs/specs/TECH_DEBT_SPEC.md` | M4 tech debt specification |
| `TEST_SPEC.md` | `repo/docs/specs/TEST_SPEC.md` | M4 testing specification |
| `BUSINESS_SPEC.md` | `repo/docs/specs/BUSINESS_SPEC.md` | M5 business features spec |
| `FINAL_QA_CHECKLIST.md` | `repo/docs/specs/FINAL_QA_CHECKLIST.md` | M6 ship checklist |
