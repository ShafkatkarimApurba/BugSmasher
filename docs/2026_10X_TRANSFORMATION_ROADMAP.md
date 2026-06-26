# BUGSMASHER — 10/10 Enterprise Elevation Plan (2026)

**Mission:** Systematically elevate the repository from current ~7.6-7.8/10 pre-production state to demonstrable 10/10 enterprise-grade, best-in-class browser game as of 2026 across technical, player experience, operational, and long-term excellence.

**Date of Analysis:** 2026-06 (this session)  
**Starting Branch:** `release/v2.4.0-preproduction` (now on `feat/enterprise-10x-elevation-v2.4.2`)  
**Current Package:** 2.4.1  
**Auditor/Architect:** Elite Game Systems + Enterprise Transformation Lead (Grok)

---

## PHASE 1: RECONNAISSANCE — Findings (Mandatory, Completed)

### 1. Repository Structure & Tech Stack (Discovered — Unique, No Assumptions)
- **Primary Stack:** React 19 + TypeScript ~5.8 + Vite 6 + Tailwind CSS 4 (via Vite plugin) + Lucide icons + Motion for animations. **Custom Canvas 2D game engine** (not Unity/Unreal/Godot/Pixi/Phaser — fully bespoke high-perf).
- **Game Core:** `src/game/` — `GameEngine.ts` (orchestrator, ~960 LOC), modular systems per AGENTS.md (`InputSystem`, `CollisionSystem`, `BossSystem`, `PowerupSystem`, `HazardSystem`, `WaveManager`, `ParticleSystem`), `Renderer.ts` (thin orchestrator ~278 LOC delegating to `src/game/rendering/{PerformanceScaler,EnvironmentRenderer,BugRenderer,ParticleRenderer,UIRenderer,OffscreenEnvironmentCache}`).
- **UI/Shell:** React components in `src/components/` (MainMenu, Game, HUD, Settings, Armory, AchievementGallery, etc.), contexts/AuthContext, i18n stub.
- **Persistence/Backend:** Firebase (Auth + Firestore via `src/lib/firebase*`, rules in `firestore.rules`), `functions/` (Node TS Cloud Functions stub for checksum validation).
- **Audio:** Hybrid — advanced Web Audio synthesis (reverb, compressor, delay, distortion, voice via SpeechSynthesis) in `SoundManager.ts` + `AudioAssetLoader.ts` + 7 real WAV assets in `public/audio/` (partial wiring for shoot/splat/ui).
- **Testing:** Vitest 4 + jsdom (411 tests across 17 files, 1 failing; strong engine coverage).
- **Build/Deploy:** Vite build (~1.194 MB JS, gzip ~318 KB, single chunk, warnings), Firebase Hosting (`firebase.json`), GitHub Actions (`.github/workflows/ci.yml`), no PWA SW.
- **Other:** `src/lib/{analytics,checksum,monetization,shareCard,ads}.ts` (stubs/facades), `src/i18n/` (en/es catalogs, ~25 keys, **zero integration**), daily challenges, game modes (standard/endless/boss_rush), cosmetics, progression, achievements (data + gallery component), stats.
- **Config:** `vite.config.ts` (minimal, env define, alias, HMR toggle), `tsconfig.json` (ES2022, bundler, paths @/*), `vitest.config.ts` (jsdom), no coverage, no PWA plugin.
- **Public:** Only audio/ + manifest.webmanifest (references missing icon-192/512.png).
- **Scripts:** `generate-sfx.mjs`, `split-renderer.mjs` (historical).
- **Docs:** Exceptionally rich for a game repo (see below).

**Key Files Analyzed (Full Reads + Grep):**
- All root *.md (README, AUDIT_REPORT, TASKBOARD, DEPLOYMENT, CONTRIBUTING, CHANGELOG, DESIGN_DOC, AGENTS, security_spec, SESSION).
- All docs/ (ENTERPRISE_TRANSFORMATION, ARCHITECTURE w/ Mermaid, PLAYER_GUIDE, 2 ADRs).
- package.json, tsconfig, vite/vitest.config, firebase.json + .firebaserc, firestore.rules, functions/package.json + src/index.ts.
- Core: GameEngine.ts, Renderer.ts + all rendering/, GameTypes.ts (45 LOC, clean interfaces), GameConfig, SoundManager (advanced), AudioAssetLoader, GameMode.ts, AccessibilitySettings, InputSystem, etc.
- Components: MainMenu (modes + achievements), GameCanvas (any proxy hack), App, Game, etc.
- Tests: All 17, plus failing InputSystem.test.ts.
- GitHub: ci.yml, pull_request_template.md.
- Live assets + build output inspected.

**Git State:**
- History: **Extremely shallow (only 6 commits)**. Last: `feat(enterprise): docs, analytics, a11y filters, PWA [P2-03][P3-01]`.
- Branch: `feat/enterprise-10x-elevation-v2.4.2` (created for this mission; was release/v2.4.0-preproduction).
- Remotes: origin (HopeTheoory/BugSmasher-ApZz), upstream (FahadIbrahim93/BugSmasher-HopeTheory).
- **Working tree dirty on branch creation:** 16 files modified (362 insertions, e.g. MainMenu modes/achievements wiring, EnvironmentRenderer cache usage, firebaseService, Stats, etc.), + untracked (functions full, public/audio full, src/i18n full, AchievementGallery, AudioAssetLoader, GameMode, Offscreen..., ControlBindings, monetization/ads/share, etc.).
- Commits in history: Conventional style, good messages referencing tasks.
- No evidence of extensive PR reviews or stacked branches in visible history.
- Tag: v2.4.1 present locally.

**Live Deployment/Demo:**
- Configured target: `https://studio-1155838266-56095.web.app` (Firebase project `studio-1155838266-56095`).
- **Current behavior:** "Site Not Found" (empty/no deploy, or hosting not initialized for this applet context). No smoke-testable live version observed.
- CI deploys to "live" channel on main push (if secret present); no per-PR preview channels active.

**Existing Strengths (Protect & Amplify — Do Not Break):**
1. **Architecture (8.0/10 base):** Strict adherence to AGENTS.md — systems over monoliths, no logic in GameEngine beyond orchestration, delta `dt` everywhere (no setTimeout/setInterval for game state), typed `GameTypes.ts`, `GameEngineStatusBus` (no window globals), `ParticleEngineHost`. Renderer split complete (orchestrator delegates).
2. **Performance (7.8/10 base, rare for browser):** Real-time `PerformanceScaler` (sliding-window FPS via performance.now(), `vfxScalar` 0.15-1.0, dynamic mesh step 10-80px, auto-recovery). OffscreenEnvironmentCache (partial, for neon/golden biomes — static grid/starfield). DPR clamp on low-end/mobile. High-fidelity toggles + intelligent defaults.
3. **Testing (8.5/10):** 411 tests (engine systems heavily covered: Collision, Boss, Powerup, Hazard, Wave, Renderer, Input, etc.). Vitest + setup. CI enforces.
4. **Documentation & Maintainability (9.5/10):** AUDIT_REPORT, TASKBOARD (with IDs like P1-06), DEPLOYMENT (detailed checklist), CONTRIBUTING + AGENTS (strict rules for AI/humans), CHANGELOG (Keep a Changelog), DESIGN_DOC, PLAYER_GUIDE, ARCHITECTURE (Mermaid), 2 ADRs, ENTERPRISE_TRANSFORMATION (prior), security_spec. Living docs.
5. **Visual/UX Identity (8.7/10):** Brutalist OS (black #050505, mono, stark) × visceral neon bio-luminescent bugs + goop VFX is distinctive, meme-ready, high-production for scope. Accessibility foundation (difficulty presets via DIFFICULTY_PRESETS, reducedMotion, enemy shape markers, colorblind CSS filters, gamepad, haptics stub).
6. **Game Design/Engagement (7.4/10 rising):** Deep meta (prestige, resources, skills, armory cosmetics, daily challenges with modifiers), multiple modes (endless, boss_rush), story beats, leaderboards, share cards.
7. **Ops/Security Base:** Firebase rules (owner-only + validation), client checksum + functions stub for server validation (P1-07), CI (lint/test/build + artifact + hosting deploy attempt).
8. **Other Protected:** Strict timing, mobile protection, SoundManager effects chain + partial asset pipeline, analytics facade, i18n scaffolding (even if unused).

**Weaknesses / Technical Debt Observed (Current On-Disk State):**
- **Git/History:** 6 commits only (shallow), dirty tree (uncommitted "prior progress" including audio/i18n/modes/achievements), branch/version drift (release/v2.4.0 vs 2.4.1 in package/CHANGELOG), no release tags consistently pushed in visible ops.
- **CI/CD:** Lint fails on `functions/src` (missing firebase-functions/admin types at root `npm ci` — no subdir install or tsconfig project refs). Deploy job only on main (to live, no PR previews). No coverage, no performance/lighthouse/a11y checks in CI. No functions deploy step. Concurrency present but basic.
- **Bundle/Perf:** 1.194MB main chunk (gzip 318KB) — exceeds 500KB warning. Mixed static/dynamic imports prevent splitting (SoundManager, ProgressionManager, DailyChallengeManager). Offscreen cache exists but limited scope. No Vite PWA plugin / SW / offline.
- **PWA:** manifest.webmanifest present + meta, but **no icon files** (public/icon-*.png missing → install broken, 404s). No service worker registration, no offline support, no beforeinstallprompt handling. "Installable" claim in docs but not reality.
- **Type Safety:** Remaining `any` (P1-06): GameCanvas.tsx (Proxy + any for imperative engine exposure — major hack), Game.tsx (as any for resources), firebaseService.ts (updatedAt: any), WaveManager.ts (config cast), SoundManager (webkit cast), tests (mocks ok-ish). No `any` in pure engine per rules, but UI + proxy leak.
- **Tests:** 1 failing (InputSystem dash on Space — engine.triggerDash assignment timing vs listener closure or start() side effects?). Canvas getContext warnings (jsdom). No coverage reports. Thin component/UI tests (mostly engine units). No a11y (axe), no E2E (Playwright/Cypress), no visual.
- **Audio/Player Polish (top historical gap, partially addressed):** Assets + loader exist + partial wiring, advanced synth+FX+voice. But still synth-dominant for many effects; "procedural" critique lingers. No volume preview (P2-12). Adaptive layers claimed but verify depth. setTimeout in voice (non-game-state, but still).
- **i18n:** Full scaffolding (en/es, t(), setLocale, subscribe, localStorage, custom event) but **zero calls to t() outside i18n itself**. Menus, HUD, etc. hardcoded English. (P4-03).
- **A11y (partial):** Good presets + filters + gamepad + shapes. Gaps vs WCAG 2.2 AA: canvas focus/keyboard nav/aria-describedby for game, modal focus traps, target sizes, full ARIA on menus, live regions for HUD/wave, color contrast verification, reduced-motion more pervasive? Screen reader friendly terminal/intel?
- **Security/Ops:** Checksum + server validator stub good, but functions not deployed/tested in CI. SALT default. No rate limiting visible, client-heavy validation still risk. No telemetry for errors (Sentry etc.).
- **Business/Engagement:** Analytics facade (console/none only; no real PostHog/Mixpanel wiring). Monetization/ads stubs only (no real integration). No error boundaries beyond basic, no observability.
- **Other:** Large SoundManager (effects + music + voice) in game code (potential for extract?). Vite config minimal (no optimize, no chunk config). Some dynamic import warnings in build. Version/branch naming inconsistent. Dist has old build. No CONTRIBUTING updates for new 10x items. Live site dead.
- **Metrics Snapshot:** ~960 LOC GameEngine (orchestrator ok), BugRenderer 1083 LOC (largest), total rendering ~2k, 411 tests, build time ~8s, bundle 1.2MB.

**Prior Session State (from docs/ENTERPRISE + SESSION + AUDIT):** Rated 7.6/10 audit, 8.3 ops. Many P1/P2 items marked done in TASKBOARD/SESSION but implementation is partial (i18n, audio full, UI any, functions deploy, PWA icons, volume, control remap, full stats, E2E). This recon confirms "on-disk" is ahead of some docs but still pre-10/10.

**Internal Analysis Conclusion:** Project has **exceptional foundations** (modularity, perf scaler, docs, tests base, aesthetic) that prior transformations amplified. It is "pre-production strong" but not enterprise 10/10. Gaps are mostly polish, completeness, and professional ops hardening — not core rewrites. Live demo absent hurts validation. Shallow git + dirty + CI holes are immediate drags on "operational excellence".

---

## PHASE 2: RESEARCH & BENCHMARKING (2026 Standards, Translated to Repo)

**Genre/Scope:** High-intensity browser-based 2D arcade defense / "tactical QA" (like Vampire Survivors wave survival meets Fruit Ninja precision + Balatro polish + FAANG dashboard aesthetic). Canvas 2D + React shell. Target: stable 60 FPS on mid devices, viral shareable moments, 5-15 min sessions, meta progression for retention.

**Key 2026 Benchmarks (from searches + known refs):**
- **Technical/Perf:** Stable 60 FPS with graceful (scaler already excellent — amplify offscreen/layering per MDN/web.dev: separate static bg/game/ui canvases conceptually via offscreen; pre-render; batch; minimize state changes). Bundle: aim initial <250-400kB gzip via splitting (Vite manualChunks + splitVendor + React.lazy for menus/modes). Core Web Vitals: LCP<2.5s, INP<200ms (avoid long tasks in game loop). OffscreenCanvas preferred where supported (already attempted). DPR/mobile caps (protected).
- **PWA/Install/Offline (2026):** Full PWA = manifest + 192/512 maskable icons + service worker (precache + runtime) via `vite-plugin-pwa` + Workbox (standard for Vite/React). Offline play for core loop (cache assets/WASM if any). Install prompt. Lighthouse PWA 100. (Current: partial manifest only.)
- **Accessibility (WCAG 2.2 AA minimum for games):** Focus not obscured (2.4.11), target size 24x24 (2.5.8), no drag-only (2.5.7), keyboard (canvas tabindex + roving or simulated), color contrast 4.5:1, non-color cues (shapes already), reduced motion (WCAG + prefers-reduced), ARIA for custom controls/menus/modals (live regions for score/wave/health), focus traps in overlays, canvas described-by for screenreaders (or separate text log). Colorblind: filters + semantic shapes + patterns (partial good). Gamepad already strong.
- **Testing Maturity:** Pyramid (heavy unit like current — good), integration for systems, E2E (Playwright recommended 2026 for canvas + React flows, visual traces, CI). Add a11y (vitest-axe or jest-axe + axe-core), coverage >80% (target new code), visual regression optional. CI must gate on all.
- **Security:** Server-enforced (current checksum CF onWrite good start; make deployable + tested + secret SALT; add more rules validation). No client-only trust for leaderboards/scores. HTTPS (Firebase). CSP headers possible via hosting.
- **CI/CD/DevOps 2026:** npm ci + cache, concurrency (has), matrix (low need), quality job separate from deploy. **Preview environments per PR/feat branch** (Firebase Hosting channels via action + GITHUB_TOKEN). Add Lighthouse CI or simple perf/a11y checks. Functions: deploy in pipeline (or separate), use emulators in test. Artifact retention, rollback docs (has). Environments protection.
- **Git Professional:** Conventional Commits (has base, enforce via CI/husky or action if needed; already driving CHANGELOG). Branching: feat/<scope>-<ticket>, fix/, chore/, release/. PRs: small, reviewable, template (has, enhance), squash or rebase clean. CHANGELOG keepachangelog + conventional (has). No direct main; PRs required.
- **Live-Ops/Engagement/Ethical:** Analytics for funnels/retention (facade ready — wire real provider). Daily/seasonal content (has challenges). Share loops (has card). No dark patterns (fair prestige, no pay-to-win — protect). Re-engagement via notifications (future).
- **Audio/Polish:** Pro assets + adaptive (layer intensity) + tactile (haptics partial). 2026 bar: studio SFX + music that reacts (current synth+assets hybrid moving right direction).
- **Refs Translated:** Vampire Survivors (retention via dailies/modes — amplify), Balatro (high bar polish + audio must match visuals), Fruit Ninja (satisfying feedback), FAANG web (typed, tested, observable, deployable). Prior audit refs still valid.

**Repo-Specific Recommendations (Protect Strong Parts):**
- Amplify PerformanceScaler + OffscreenCache (expand to more layers, full bg + perhaps particles selective).
- Build on modular systems: add new features as new *System or *Renderer.
- Leverage existing docs/ADRs/TASKBOARD — evolve them.
- Firebase is good fit; harden the CF path.
- Since React shell + Canvas, use React.lazy for heavy menus (Armory, Progression, Achievements) to aid splitting.
- i18n scaffolding ready — just integrate + expand keys.
- Audio assets + loader exist — complete wiring + volume preview + perhaps more layers.

**Risks from Research:** Over-splitting can hurt (waterfall); test perf after chunks. PWA SW can break dev — use proper plugin config. E2E canvas flaky — use stable selectors + traces. CF cold starts — keep light.

---

## PHASE 3: GAP ANALYSIS & PRIORITIZED, RISK-AWARE, BRANCH-BASED ROADMAP

**Current vs 10/10 (Evidence-Based, Weighted for Scope):**

| Dimension                  | Current (Recon) | 10/10 Target | Gap Evidence | Priority |
|----------------------------|-----------------|--------------|--------------|----------|
| Technical Excellence (Arch/Types/Perf) | 8.0-8.2 | 10 | any in UI/proxy, 1.2MB unsplit bundle, limited offscreen, functions types | P1 |
| Performance (60FPS/Loading) | 7.8-8.0 | 10 | Bundle size, no full PWA cache, partial offscreen, mixed imports | P1 |
| Player Experience (Polish/A11y/Engagement) | 7.6-8.0 | 10 | Audio hybrid not complete, i18n 0% wired, volume/control UI missing, WCAG partial (focus/ARIA/canvas), no icons | **P0 player-facing** |
| Testing/Reliability | 8.0 (1 fail) | 10 | 1 failing test, no coverage/E2E/a11y tests, canvas mocks | P1 |
| Security/Data | 7.0-7.5 | 10 | CF stub not deployed/in CI, client checksum still primary | P1 ops |
| Operational (CI/CD/Deploy/Docs) | 8.3 | 10 | No PR previews, lint fails on functions, no icons/PWA, live 404, shallow git, no coverage gate | P1 |
| Long-term (Maintain/Git/Contrib) | 9.0 | 10 | Excellent docs base, but drift in TASKBOARD/SESSION vs on-disk, branch naming, no auto-changelog tooling | P2 |
| Business/Telemetry | 4.0-5.0 | 10 | Analytics facade only, monetization stubs, no real events | P2 |

**Composite Current: ~7.8/10** (up from initial audits thanks to prior work on modularity, audio partial, modes, a11y, docs). **Not yet 10/10 commercial/enterprise.**

### Phased, Risk-Aware Roadmap (Branch-Based, Incremental, Test-After)

**Guiding Principles (Non-Negotiable):**
- New feature branch per major phase or large item (this feat/ already).
- Conventional commits only.
- `npm run ci` (or fixed equivalent) green after every significant step; expand tests.
- Preserve/Amplify: PerformanceScaler, dt, modular systems, docs, aesthetic, existing a11y/modes.
- No magic numbers undocumented; minimal risk changes first.
- Self-critique after each phase vs 10/10 definition.
- Use `todo_write` internally for tracking.
- For web: enhance Vite (split, PWA), a11y, PWA, Firebase.
- Risk: Bundle changes → measure build + smoke FPS. CF → emulator + test. i18n → incremental keys.

**Phase A: Foundation Hardening & Git Cleanup (Current Branch, Low Risk, Ops/Quality) — Target: CI green, clean tree, PWA baseline**
- Commit current dirty state (the "prior progress") with conventional `chore(enterprise): capture pre-10x state [TASKBOARD carryover]` (or split if too big).
- Fix immediate blockers: make `npm run ci` pass (handle functions/ in lint: e.g. root tsconfig skip or composite, or CI step `cd functions && npm ci && npm run build` before root lint? Better: update CI to build functions separately or ignore in root tsc via exclude; add functions test if any).
- Add missing PWA icons (use simple script or placeholders; generate via terminal if possible, or note for manual; update manifest if needed). Add basic vite-plugin-pwa (install + config for manifest + SW precache; test offline in preview).
- Fix 1 failing InputSystem test + investigate root cause (likely test setup vs recent GameEngine/Input changes).
- Update TASKBOARD/SESSION/AUDIT with current on-disk reality vs claims.
- Enhance .github/CI: add preview deploy job for PRs (use Firebase hosting preview channel, different channel per PR), add coverage (vitest --coverage, report), basic a11y or build size gate.
- Git hygiene start: ensure all future commits conventional; update CONTRIBUTING/PR template for 10x checklist; bump version consistently.
- **Validation:** `npm run ci`, manual preview build, PWA install check (manifest + icons), test on localhost.
- **Impact:** Ops to 9+, unblocks all further; makes project "pushable".
- **Risk:** Low (fixes); test functions install in CI.

**Phase B: Technical/Perf/Types to 9+ (Parallel or follow A on branch or stacked)**
- Vite config: add `build.rollupOptions.output.manualChunks` (vendor/react split, game-engine split?, components lazy). Use splitVendorChunkPlugin. Measure before/after bundle + load.
- Remove `any` debt (P1-06): Refactor GameCanvas Proxy to explicit interface (e.g. `ExposedEngineAPI` with only safe methods/props used by React; type the ref properly). Fix other casts with proper types from GameTypes or new interfaces. No any in src/game/.
- Expand offscreen/perf: Use cache for more biomes/layers; consider separate canvas layers if perf win (research-aligned); ensure scaler respected everywhere.
- Add vitest coverage to CI (threshold 80%+ for new).
- **Validation:** Build size <700kB? (aggressive), all any gone in engine/UI core, FPS stable, tests + coverage pass.
- **Impact:** Technical 9.5, perf 9.0.
- **Risk:** Bundle split can regress initial load if not tuned — benchmark with `npm run preview`.

**Phase C: Player Experience Polish (High Player Impact, After A)**
- Complete i18n: Wire `t()` + locale switcher into MainMenu, Settings, HUD, GameOver, modals, etc. Expand catalog keys as needed. Test en/es toggle.
- Audio completion: Full wire assets (all SFX), volume preview (P2-12: on slider release play sample via soundManager), verify adaptive music intensity layers respond to wave/threat.
- A11y enhancements: Canvas `tabindex`, ARIA labels/roles for custom UI (use existing brutalist but add), focus management in menus/modals (trap), live regions for critical game state (wave, health changes via status bus?), ensure 24px targets, verify colorblind + reduced motion end-to-end.
- Control remapping UI (P2-08): Use/extend ControlBindings.ts in Settings.
- Polish: Stats dashboard full (P2-10), daily challenge tooltips/polish, AchievementGallery integration polish.
- Add basic error observability (e.g. enhance ErrorBoundary with analytics).
- **Validation:** Playtest sessions (keyboard/gamepad/touch), a11y manual + basic automated, i18n switch works, audio satisfying + volume works, no regressions in 60FPS.
- **Impact:** Player to 9+, closes #1 historical gap (audio) + i18n.
- **Risk:** i18n scope creep — do core screens first; audio subjective — use existing assets.

**Phase D: Ops/Security/Deployment Hardening (Mandatory for 10/10)**
- Deployable functions: Fix CI to install/build/deploy functions (separate job or step; use firebase-tools in CI with secret). Add emulator test if possible. Enforce server checksum in practice.
- Full Firebase preview: Per-PR channels (e.g. `pr-${number}`) + comment preview URL on PR. Update DEPLOYMENT.
- Add Lighthouse or simple perf/a11y to CI (via action or script; report scores).
- Harden hosting headers/CSP if feasible.
- Update live demo (after merge/PR).
- Git: After commits, consider if history rewrite needed (shallow — perhaps not); ensure CHANGELOG updated on each user-facing; tag releases properly.
- **Validation:** CI fully green including functions; preview URL works in test PR; rules + CF validation end-to-end (local + deployed); rollback tested per docs.
- **Impact:** Ops 9.5-10, security 9+.
- **Risk:** Secrets/CI changes — document; use continue-on-error where appropriate.

**Phase E: Growth/Telemetry + Final 10/10 Polish (P2/P3)**
- Wire real analytics (PostHog or Mixpanel via env; facade already; track key events like session, wave, achievement, retention signals). Ethical: opt-in or transparent.
- Monetization: If desired, flesh stubs (but keep cosmetics-only, no pay2win).
- Expand tests: Add 1-2 Playwright E2E smoke (menu->start->play 1 wave->over; settings), a11y tests.
- More docs: Update ADRs for new decisions (e.g. PWA plugin, bundle strategy, i18n), contributor runbook, architecture updates.
- Self-eval + iterate: Re-run full audit mentally vs 10/10 definition.
- **Validation:** Analytics events fire (console or real), E2E pass in CI (add job), final `npm run ci`, build review, play delight score high.
- **Impact:** Business/engagement 7-8+, completeness 10.
- **Risk:** 3rd party SDKs — keep behind flags; E2E maintenance — start minimal.

**Overall Execution Order & Branching:**
- This branch: Phase A (commit dirty + fixes) → B (perf/types) → C (player) as incremental commits.
- Or PR this branch after A, then new feat/ for B/C if long.
- Use small PRs referencing this plan + TASKBOARD IDs.
- Pre-push always: `npm run ci`.
- After significant phase: Update AUDIT_REPORT.md ratings (only on material change), TASKBOARD checkboxes, CHANGELOG, SESSION.md, this roadmap with evidence.
- Final: Clean feature branch ready for PR to main (or release flow per DEPLOYMENT). Tag v2.5.0 or appropriate.

**Estimated Impact & Timeline (Rough, Risk-Aware):**
- Phase A: 1-2 days effort, high confidence, unblocks.
- B+C: 3-5 days, medium (audio/a11y subjective).
- D: 1-2 days (depends on Firebase perms/secrets).
- Total to high 10/10: 1-2 weeks focused + validation/playtest.
- Confidence: High because existing strengths (modularity, tests, scaler, docs) reduce risk of breakage. Brutal honesty: audio full pro feel + real analytics + deployed CF + PWA 100 + E2E may be the last 0.5-1 points; this plan targets them.

**Self-Critique Gate (After Each Phase in Execution):**
Re-score vs definition:
- Technical: clean modular? 60FPS stable? types? tests >80%? secure design?
- Player: polished? accessible/inclusive? delightful loop? ethical?
- Operational: robust CI/CD? living docs? observable? graceful? prod-ready?
- Long-term: invites contributors? supports iteration? professional standards?

Only proceed/declare done when evidence (CI green, metrics, manual verification) supports high 10/10.

---

## PHASE 4-6: EXECUTION, ITERATION, SELF-EVAL (To Be Performed)

(See execution log in git commits on this branch, updated TASKBOARD/CHANGELOG/AUDIT, final summary report at end.)

**Immediate Next (Post-Roadmap Presentation):**
1. Commit current state (git add -A + conventional).
2. Execute Phase A items incrementally, `npm run ci` after each cluster, self-critique.
3. Update this doc with "Execution Log" + before/after evidence.
4. At end: full deliverables (summary report, before/after, branch/PR, updated docs, CI status, next-steps).

**References Preserved:** All prior AUDIT/TASKBOARD/DEPLOYMENT/AGENTS/ENTERPRISE remain source of truth; this is additive 10x elevation plan.

**Honest Starting Verdict:** With protected strengths + disciplined execution of this roadmap, 10/10 is achievable without over-engineering. The project already exceeds most indie browser games in architecture/docs/testing. Elevate the "last mile" polish + ops to world-class.

---
*This document created as part of mandatory Phase 1-3 before any transformative code changes. All changes will be on the feature branch with conventional commits and validation.*
