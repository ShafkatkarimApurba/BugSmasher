# BUGSMASHER — TASK REGISTRY

> **Authority:** `MASTER_BLUEPRINT.md` · **Status Legend:** `[ ]` todo · `[/]` in-progress · `[x]` done · `[!]` blocked

---

## Milestone 1: Visual FX Pipeline (7.5 → 8.3)

### M1-T1 · Create BloomSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/rendering/BloomSystem.ts`
- **Reference:** `overhaul/rendering/BloomSystem.ts`
- **Acceptance Criteria:**
  - [ ] Exports `BloomSystem` class with `addEmission()`, `render()`, `resize()`, `applyPreset()`
  - [ ] Exports `BloomConfig` interface and `BLOOM_PRESETS` object (ultra/high/balanced/mobile)
  - [ ] Uses two offscreen canvases for ping-pong Gaussian blur
  - [ ] `render(targetCtx, sourceCanvas)` composites bloom onto target with `screen` blend mode
  - [ ] Mobile preset disables bloom entirely (no GPU cost)
  - [ ] No imports from GameEngine — this is a standalone rendering utility
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[x]`

---

### M1-T2 · Create DynamicLightingSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/rendering/DynamicLightingSystem.ts`
- **Reference:** `overhaul/rendering/DynamicLightingSystem.ts`
- **Acceptance Criteria:**
  - [ ] Exports `DynamicLightingSystem` class with `addLight()`, `clearLights()`, `update(dt)`, `applyPreset()`
  - [ ] Light sources are radial gradients composited with `screen` blend
  - [ ] Supports ambient base lighting layer (dark overlay with light holes)
  - [ ] Max light count capped per quality preset (ultra: 64, high: 32, balanced: 16, mobile: 8)
  - [ ] Light sources decay over time (configurable TTL)
  - [ ] No imports from GameEngine
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[x]`

---

### M1-T3 · Create PostProcessingSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/rendering/PostProcessingSystem.ts`
- **Reference:** `overhaul/rendering/PostProcessingSystem.ts`
- **Acceptance Criteria:**
  - [x] Exports `PostProcessingSystem` class with `render(ctx, w, h, time)`, `applyPreset()`
  - [x] Implements: vignette (health-responsive), chromatic aberration, CRT scanlines, color grading
  - [x] `setHealthRatio(ratio)` — vignette intensifies when health <30%
  - [x] `setSaturationBoost(amount)` — driven by combo system
  - [x] `setChromaticOverride(pixels)` — driven by screen shake
  - [x] Quality presets control which effects are active (mobile: vignette only)
  - [x] Replaces the inline vignette code currently at Renderer.ts lines 231-252
  - [x] Replaces the inline CRT code currently delegated to EnvironmentRenderer
  - [x] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[x]`

---

### M1-T4 · Create VisualFXPipeline (orchestrator)
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/rendering/VisualFXPipeline.ts`
- **Reference:** `overhaul/rendering/VisualFXPipeline.ts`
- **Acceptance Criteria:**
  - [ ] Exports `VisualFXPipeline` class that orchestrates BloomSystem, DynamicLightingSystem, PostProcessingSystem, ScreenShakeSystem (M2), ComboVisualSystem (M2), WaveTransitionSystem (M2)
  - [ ] Constructor takes `(engine: GameEngine, scaler: PerformanceScaler)`
  - [ ] Manages two offscreen canvases: `bgCanvas`, `gameCanvas`
  - [ ] Frame lifecycle: `beginFrame()` → `getBackgroundContext()` / `getGameContext()` → `composite(targetCtx)`
  - [ ] `update(dt)` ticks all subsystems
  - [ ] `applyPreset(preset)` propagates to all subsystems
  - [ ] `resize(w, h, dpr)` propagates to all subsystems
  - [ ] `addGlowEmission(x, y, radius, color, intensity)` — for bloom
  - [ ] `addLight(x, y, radius, color, intensity)` — for lighting
  - [ ] `reset()` clears all state (on game over)
  - [ ] M2 subsystems (shake, combo, wave) can be stubbed as no-ops initially, wired in M2
  - [ ] `npm run lint` passes
- **Dependencies:** M1-T1, M1-T2, M1-T3
- **Status:** `[x]`

---

### M1-T5 · Integrate Pipeline into Renderer.ts
- **Agent:** VFX Engineer
- **Files:** `[MODIFY] src/game/Renderer.ts`, `[MODIFY] src/game/rendering/EnvironmentRenderer.ts`
- **Acceptance Criteria:**
  - [x] Renderer constructor creates `VisualFXPipeline` instance
  - [x] `Renderer.draw()` refactored to use pipeline:
    - `pipeline.beginFrame()`
    - Background drawn to `pipeline.getBackgroundContext()`
    - Entities/particles drawn to `pipeline.getGameContext()`
    - `pipeline.composite(this.engine.ctx)` for final output
  - [x] Inline vignette code (lines 231-252) REMOVED — handled by PostProcessingSystem
  - [x] Inline CRT/scanline calls REMOVED — handled by PostProcessingSystem
  - [x] Inline shake code (lines 97-113) preserved for now (M2 replaces it)
  - [x] `pipeline.resize()` called from constructor and when engine resizes
  - [x] BugRenderer emits glow via `pipeline.addGlowEmission()` when drawing bugs
  - [x] ParticleRenderer emits glow for explosions, shockwaves, lasers
  - [x] All 70 existing Renderer tests still pass
  - [x] `npm run ci` passes
- **Dependencies:** M1-T4
- **Status:** `[x]`

---

### M1-T6 · Wire Bloom Emissions into Bug/Particle Renderers
- **Agent:** VFX Engineer
- **Files:** `[MODIFY] src/game/rendering/BugRenderer.ts`, `[MODIFY] src/game/rendering/ParticleRenderer.ts`
- **Acceptance Criteria:**
  - [x] BugRenderer calls `pipeline.addGlowEmission(bug.x, bug.y, bug.size, bug.color, 0.8)` for each visible bug
  - [x] ParticleRenderer calls `pipeline.addGlowEmission()` for: splatters (intensity 0.6), shockwaves (1.0), muzzle flashes (0.9), explosions (1.0)
  - [x] BugRenderer calls `pipeline.addLight(bug.x, bug.y, bug.size * 3, bug.color, 0.5)` for each bug
  - [x] Light/glow calls are behind `if (scaler.vfxScalar > 0.3)` guard
  - [x] All existing tests pass
  - [x] `npm run ci` passes
- **Dependencies:** M1-T5
- **Status:** `[x]`

---

## Milestone 2: Game Feel & Audio (8.3 → 8.8)

### M2-T1 · Create ScreenShakeSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/rendering/ScreenShakeSystem.ts`
- **Reference:** `overhaul/rendering/ScreenShakeSystem.ts`
- **Acceptance Criteria:**
  - [ ] Exports `ScreenShakeSystem` class with `trigger(params)`, `update(dtMs)`, `getCurrentFrame()`, `reset()`
  - [ ] `ShakeParams`: magnitude, direction, durationMs, decay (exponential/linear/bounce), rotation, zoom, chromatic
  - [ ] `ShakeFrame`: offsetX, offsetY, rotation, zoom, chromaticOffset, intensity
  - [ ] Supports multiple simultaneous shakes (additive)
  - [ ] Perlin-like noise function for organic feel (not pure sine)
  - [ ] `triggerPreset(name)` — presets: `kill`, `boss_kill`, `boss_damage`, `player_damage`, `wave_transition`
  - [ ] `enabled` flag — disabled on mobile or reduced motion
  - [ ] No imports from GameEngine
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M2-T2 · Create ComboVisualSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/rendering/ComboVisualSystem.ts`
- **Reference:** `overhaul/rendering/ComboVisualSystem.ts`
- **Acceptance Criteria:**
  - [ ] Exports `ComboVisualSystem` class with `registerKill(x, y, points)`, `render(ctx, cx, cy, time)`, `update(dt)`, `resetCombo()`
  - [ ] Combo counter with visual escalation tiers: 5x, 10x, 25x, 50x, 100x
  - [ ] Each tier has: unique color, pulse ring, optional text popup ("RAMPAGE!", "UNSTOPPABLE!")
  - [ ] `getSaturationBoost()` — returns 0-0.3 based on current combo for PostProcessingSystem
  - [ ] `onRequestScreenShake` callback — triggers shake at combo milestones
  - [ ] `applyPreset()` — reduces visual complexity on lower quality
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M2-T3 · Create WaveTransitionSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/rendering/WaveTransitionSystem.ts`
- **Reference:** `overhaul/rendering/WaveTransitionSystem.ts`
- **Acceptance Criteria:**
  - [ ] Exports `WaveTransitionSystem` with `triggerWaveStart(wave)`, `triggerWaveComplete()`, `triggerBossIncoming()`, `render(ctx, w, h, time)`, `update(dt)`
  - [ ] Wave start: number display with scale-in animation + scan line wipe
  - [ ] Wave complete: brief "CLEAR" text + particle burst
  - [ ] Boss incoming: red alert pulse + warning text + directional indicator
  - [ ] Each transition has configurable duration (default 1.5s for start, 1s for complete, 2s for boss)
  - [ ] `applyPreset()` — simplified/disabled on mobile
  - [ ] `onRequestScreenShake` and `onRequestHitstop` callbacks
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M2-T4 · Wire M2 Systems into VisualFXPipeline
- **Agent:** VFX Engineer
- **Files:** `[MODIFY] src/game/rendering/VisualFXPipeline.ts`
- **Acceptance Criteria:**
  - [ ] ScreenShakeSystem initialized and wired (replace stubs from M1-T4)
  - [ ] ComboVisualSystem initialized and wired
  - [ ] WaveTransitionSystem initialized and wired
  - [ ] `update(dt)` ticks all three new systems
  - [ ] `composite()` renders wave transitions and combo visuals in correct layer order
  - [ ] Shake frame applied to game layer context in `getGameContext()`
  - [ ] Chromatic offset from shake passed to PostProcessingSystem
  - [ ] All existing tests pass
  - [ ] `npm run ci` passes
- **Dependencies:** M2-T1, M2-T2, M2-T3, M1-T5
- **Status:** `[ ]`

---

### M2-T5 · Create HitstopSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/HitstopSystem.ts`
- **Reference:** `overhaul/HitstopSystem.ts`
- **Acceptance Criteria:**
  - [ ] Exports `HitstopSystem` class with `triggerKill(combo, isElite)`, `triggerBossDamage()`, `triggerPlayerDamage()`, `triggerWaveTransition(combo)`, `update(dt)`, `reset()`
  - [ ] `update(dt)` returns `scaledDt` — zero during freeze, scaled during slow-mo recovery
  - [ ] Combo multiplier: hitstop duration scales with kill combo (capped at 3x)
  - [ ] `onHitstopStart` callback for audio sync
  - [ ] `applyPreset()` — disabled on mobile, reduced on balanced
  - [ ] `reducedMode` for accessibility (50% duration)
  - [ ] Import from `GameConfig` only (for any config values)
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M2-T6 · Create ParticleTrailSystem
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/ParticleTrailSystem.ts`
- **Reference:** `overhaul/ParticleTrailSystem.ts`
- **Acceptance Criteria:**
  - [ ] Exports `ParticleTrailSystem` with `registerTrail(id, color, glow, maxLength)`, `addPoint(id, x, y, width)`, `deactivateTrail(id)`, `update()`, `render(ctx, time)`, `reset()`
  - [ ] Trails rendered as connected line segments with gradient opacity (head=full, tail=transparent)
  - [ ] Optional glow effect on trail (radial gradient per segment)
  - [ ] `applyPreset()` — shorter trails on balanced, disabled on mobile
  - [ ] Trail pool: max 100 active trails, oldest recycled
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M2-T7 · Integrate HitstopSystem + ParticleTrailSystem into GameEngine
- **Agent:** VFX Engineer
- **Files:** `[MODIFY] src/game/GameEngine.ts`, `[MODIFY] src/game/Renderer.ts`
- **Acceptance Criteria:**
  - [ ] GameEngine imports and initializes HitstopSystem and ParticleTrailSystem
  - [ ] `GameEngine.update(dt)`:
    - Calls `hitstop.update(dt)` → gets `scaledDt`
    - Uses `scaledDt` for all game logic (bug movement, timers, wave updates)
    - During full freeze: only visual updates (trails, renderer) continue
  - [ ] `GameEngine.killBug()`:
    - Increments `killCombo`, resets `killComboTimer`
    - Calls `hitstop.triggerKill(combo, isElite)`
    - Calls `renderer.pipeline.comboVisual.registerKill(x, y, points)`
  - [ ] `GameEngine.damageBug()`:
    - Replaces basic `triggerHitStop(0.05)` with `hitstop.triggerKill()` for regular bugs
    - Boss damage uses `hitstop.triggerBossDamage()`
  - [ ] Old `hitStopTimer` field deprecated, preserved for backward compat
  - [ ] Bug position updates register trails via `trailSystem.addPoint()`
  - [ ] Wave events fire `renderer.pipeline.waveTransition.triggerWaveStart()` etc.
  - [ ] Renderer.draw() calls `trailSystem.render(ctx, time)` between particles and entities
  - [ ] GameEngine.test.ts still passes (9 tests)
  - [ ] `npm run ci` passes
- **Dependencies:** M2-T4, M2-T5, M2-T6
- **Status:** `[ ]`

---

### M2-T8 · Replace Inline Shake with ScreenShakeSystem
- **Agent:** VFX Engineer
- **Files:** `[MODIFY] src/game/GameEngine.ts`, `[MODIFY] src/game/Renderer.ts`
- **Acceptance Criteria:**
  - [ ] `GameEngine.shake(duration, magnitude, dx, dy)` now delegates to `renderer.pipeline.shake.trigger()` with proper ShakeParams
  - [ ] Remove inline shake application from `Renderer.draw()` (lines 97-113)
  - [ ] Screen shake applied via pipeline in `getGameContext()` using `getCurrentFrame()`
  - [ ] All existing shake calls in GameEngine preserved (same API surface) but routed to new system
  - [ ] `accessibility.reducedMotion` disables shake system
  - [ ] All 70 Renderer tests pass (may need adjustment for new shake path)
  - [ ] `npm run ci` passes
- **Dependencies:** M2-T4
- **Status:** `[ ]`

---

### M2-T9 · Audio Enhancement
- **Agent:** Audio Engineer
- **Files:** `[MODIFY] src/game/SoundManager.ts`
- **Acceptance Criteria:**
  - [ ] Add `playHitstop(intensity: number)` method — brief low-frequency "thump" proportional to intensity
  - [ ] Add `playComboPing(tier: number)` method — escalating pitch per combo tier
  - [ ] Improve `splat()` — add envelope shaping (attack: 5ms, decay: 100ms, sustain: 0, release: 200ms) for more "crunchy" feel
  - [ ] Improve `bossDeath()` — add reverb tail (convolver or delay feedback)
  - [ ] Add spatial panning: `setSpatialPosition(x, y, canvasWidth)` — bugs on left sound on left
  - [ ] Add `playWaveTransition()` — ascending tone sweep for wave start
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M2-T10 · Create HapticFeedback System
- **Agent:** VFX Engineer
- **Files:** `[NEW] src/game/HapticFeedback.ts`
- **Acceptance Criteria:**
  - [ ] Exports `HapticFeedback` class with `trigger(pattern)`, `isSupported()`
  - [ ] Patterns: `kill_light` (20ms), `kill_heavy` (50ms), `boss_hit` (100ms), `boss_kill` ([100, 50, 200]), `wave_complete` ([50, 30, 50, 30, 100])
  - [ ] Uses `navigator.vibrate()` for mobile
  - [ ] Uses Gamepad hapticActuators API for controllers (if available)
  - [ ] No-op when not supported or user has disabled haptics
  - [ ] `npm run lint` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

## Milestone 3: UI/UX Premium Polish (8.8 → 9.2)

### M3-T1 · Design System Upgrade (CSS)
- **Agent:** UI/UX Designer
- **Files:** `[MODIFY] src/index.css`
- **Acceptance Criteria:**
  - [ ] Add CSS custom properties for curated color palette (no generic red/blue/green):
    - `--color-neon-cyan: hsl(180, 100%, 50%)`
    - `--color-neon-magenta: hsl(320, 100%, 60%)`
    - `--color-neon-lime: hsl(90, 100%, 45%)`
    - `--color-surface-glass: hsla(0, 0%, 100%, 0.05)`
    - `--color-border-glass: hsla(0, 0%, 100%, 0.1)`
  - [ ] Add glassmorphism utility: `.glass-panel` with `backdrop-filter: blur(16px); background: var(--color-surface-glass); border: 1px solid var(--color-border-glass);`
  - [ ] Add keyframe animations: `fadeSlideUp`, `pulseGlow`, `shimmer`, `scaleIn`, `numberTick`
  - [ ] Add `@font-face` for JetBrains Mono (or Google Fonts import) — align with DESIGN_DOC "Swiss modernism" identity
  - [ ] Add responsive breakpoints: `--bp-mobile: 640px`, `--bp-tablet: 768px`
  - [ ] No Tailwind class changes break existing components
  - [ ] `npm run build` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M3-T2 · Premium Preloader
- **Agent:** UI/UX Designer
- **Files:** `[MODIFY] src/components/Preloader.tsx`
- **Acceptance Criteria:**
  - [ ] Replace generic loading with branded "system boot" sequence matching brutalist theme
  - [ ] Terminal-style text typing animation: `> INITIALIZING NEXUS QA PROTOCOL...`
  - [ ] Progressive loading bar with percentage and glow effect
  - [ ] Minimum display time of 2 seconds (even if loaded instantly) for branding
  - [ ] Smooth fade transition to menu
  - [ ] Uses Framer Motion (`motion` package) for animations
  - [ ] `npm run build` passes
- **Dependencies:** M3-T1
- **Status:** `[ ]`

---

### M3-T3 · MainMenu Premium Redesign
- **Agent:** UI/UX Designer
- **Files:** `[MODIFY] src/components/MainMenu.tsx`
- **Acceptance Criteria:**
  - [ ] Title reveal animation: staggered letter-by-letter with glow trail
  - [ ] Button hover effects: scale 1.02, neon border glow, subtle sound on hover
  - [ ] Background: subtle canvas particle animation (repurpose existing particle system or CSS animation)
  - [ ] Version badge in corner: `v2.5.0` with subtle pulse
  - [ ] Friend challenge banner: if URL has challenge params, show animated "CHALLENGE ACCEPTED" banner
  - [ ] All existing functionality preserved
  - [ ] `npm run build` passes
- **Dependencies:** M3-T1
- **Status:** `[ ]`

---

### M3-T4 · GameOver Screen Enhancement
- **Agent:** UI/UX Designer
- **Files:** `[MODIFY] src/components/GameOver.tsx`
- **Acceptance Criteria:**
  - [ ] Score number counting animation (rolls up from 0 to final score over 1.5s)
  - [ ] "NEW HIGH SCORE" celebration: particles + screen flash + special sound (if applicable)
  - [ ] Stats panel with glassmorphism: wave reached, bugs killed, accuracy
  - [ ] Share button generates canvas-based share card image
  - [ ] Smooth entrance animation (fade + slide from bottom)
  - [ ] `npm run build` passes
- **Dependencies:** M3-T1
- **Status:** `[ ]`

---

### M3-T5 · HUD Enhancement
- **Agent:** UI/UX Designer
- **Files:** `[MODIFY] src/components/HUD.tsx`
- **Acceptance Criteria:**
  - [ ] Health bar pulse animation on damage (red flash + shake)
  - [ ] Combo counter display: shows current combo with scaling text animation
  - [ ] Wave indicator with animated progress fill
  - [ ] Powerup timer bars with smooth depletion animation
  - [ ] All HUD elements use glassmorphism panels
  - [ ] Responsive layout for mobile screens
  - [ ] `npm run build` passes
- **Dependencies:** M3-T1
- **Status:** `[ ]`

---

### M3-T6 · UpgradeMenu & PauseMenu Polish
- **Agent:** UI/UX Designer
- **Files:** `[MODIFY] src/components/UpgradeMenu.tsx`, `[MODIFY] src/components/PauseMenu.tsx`
- **Acceptance Criteria:**
  - [ ] Upgrade cards: hover tilt effect (CSS perspective), glow border, icon scaling
  - [ ] Purchase animation: flash + particle burst on card
  - [ ] Pause menu: glassmorphism overlay with blur backdrop
  - [ ] Smooth entrance/exit animations on both menus
  - [ ] `npm run build` passes
- **Dependencies:** M3-T1
- **Status:** `[ ]`

---

## Milestone 4: Technical Excellence (9.2 → 9.5)

### M4-T1 · Eliminate All `any` Types
- **Agent:** TypeScript Specialist
- **Files:** `[MODIFY] src/components/ProgressionCenter.tsx`, `[MODIFY] src/components/Armory.tsx`, `[MODIFY] src/components/AccountMenu.tsx`, `[MODIFY] src/components/GameCanvas.tsx`, `[MODIFY] src/lib/firebaseService.ts`
- **Acceptance Criteria:**
  - [ ] Zero `any` casts in entire `src/` directory
  - [ ] Proper TypeScript interfaces for all component props
  - [ ] Exhaustive switch/case with `never` guard for discriminated unions
  - [ ] `npm run lint` (which is `tsc --noEmit`) passes with zero errors
  - [ ] All existing tests pass
- **Dependencies:** None (can run parallel to M1-M3)
- **Status:** `[ ]`

---

### M4-T2 · Error Recovery in Rendering Pipeline
- **Agent:** TypeScript Specialist
- **Files:** `[MODIFY] src/game/Renderer.ts`, `[MODIFY] src/game/rendering/VisualFXPipeline.ts`
- **Acceptance Criteria:**
  - [ ] Each render pass (background, game, bloom, post-processing) wrapped in try-catch
  - [ ] Failed subsystem logged via `console.warn('[BugSmasher] BloomSystem error:', e)`
  - [ ] Failed subsystem auto-disabled for remainder of session (no repeat errors)
  - [ ] Game continues rendering without crashed subsystem (graceful degradation)
  - [ ] Error state exposed: `renderer.getDisabledSystems(): string[]`
  - [ ] `npm run ci` passes
- **Dependencies:** M1-T5
- **Status:** `[ ]`

---

### M4-T3 · Unit Tests for New VFX Systems
- **Agent:** Test Engineer
- **Files:** `[NEW] src/__tests__/BloomSystem.test.ts`, `[NEW] src/__tests__/ScreenShakeSystem.test.ts`, `[NEW] src/__tests__/HitstopSystem.test.ts`, `[NEW] src/__tests__/ComboVisualSystem.test.ts`, `[NEW] src/__tests__/VisualFXPipeline.test.ts`
- **Acceptance Criteria:**
  - [ ] BloomSystem tests: emission registration, preset switching, render call with mock canvas, resize
  - [ ] ScreenShakeSystem tests: trigger, decay curves, multiple simultaneous shakes, getCurrentFrame values, preset triggers
  - [ ] HitstopSystem tests: kill trigger, combo scaling, boss damage, update returns correct scaledDt, reset, accessibility reduced mode
  - [ ] ComboVisualSystem tests: kill registration, combo tier escalation, saturation boost calculation, reset
  - [ ] VisualFXPipeline tests: frame lifecycle (begin→composite), preset propagation, resize propagation, subsystem update
  - [ ] Total new tests: ≥40
  - [ ] All tests use mock canvas context (jsdom)
  - [ ] `npm run ci` passes with 450+ total tests
- **Dependencies:** M1-T1 through M2-T8
- **Status:** `[ ]`

---

### M4-T4 · E2E Test Suite
- **Agent:** Test Engineer
- **Files:** `[NEW] e2e/game-flow.spec.ts`, `[NEW] e2e/menu-navigation.spec.ts`, `[NEW] e2e/settings.spec.ts`, `[NEW] playwright.config.ts`
- **Acceptance Criteria:**
  - [ ] Playwright installed as devDependency
  - [ ] `game-flow.spec.ts`: launch → preloader completes → menu visible → start game → canvas renders → kill bugs (click) → wave complete → upgrade menu appears
  - [ ] `menu-navigation.spec.ts`: main menu → settings → back → intel hub → back → start modes (standard, boss rush, endless)
  - [ ] `settings.spec.ts`: open settings → toggle VFX → change difficulty → change volume → persist after reload
  - [ ] All E2E tests pass in CI (headless Chromium)
  - [ ] `npm run e2e` script added to package.json
- **Dependencies:** M3-T2 (preloader must be stable)
- **Status:** `[ ]`

---

### M4-T5 · ErrorBoundary Enhancement
- **Agent:** TypeScript Specialist
- **Files:** `[MODIFY] src/components/ErrorBoundary.tsx`
- **Acceptance Criteria:**
  - [ ] Catches render errors with full stack trace display
  - [ ] "Restart Game" button that resets state and returns to menu
  - [ ] Styled to match brutalist theme (monospace text, dark background)
  - [ ] Logs error to analytics if available
  - [ ] `npm run build` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

## Milestone 5: Business & Growth (9.5 → 9.8)

### M5-T1 · Analytics Integration
- **Agent:** Business Engineer
- **Files:** `[NEW] src/lib/posthog.ts`, `[MODIFY] src/lib/analytics.ts`, `[MODIFY] .env.example`
- **Acceptance Criteria:**
  - [ ] PostHog SDK initialized with project key from env var
  - [ ] `analytics.ts` wired to PostHog (currently a no-op facade)
  - [ ] Events tracked: `session_start`, `game_over` (score, wave), `wave_complete`, `upgrade_purchased`, `achievement_unlocked`, `settings_changed`
  - [ ] Funnel defined: menu → game_start → wave_5 → wave_10 → game_over → retry
  - [ ] Anonymous user ID from localStorage (or Firebase Auth UID if logged in)
  - [ ] No PII collected
  - [ ] `.env.example` updated with `VITE_POSTHOG_KEY` placeholder
  - [ ] `npm run build` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M5-T2 · i18n Wiring
- **Agent:** Business Engineer
- **Files:** `[MODIFY] src/components/MainMenu.tsx`, `[MODIFY] src/components/SettingsMenu.tsx`, `[MODIFY] src/components/GameOver.tsx`, `[MODIFY] src/components/HUD.tsx`, `[MODIFY] src/components/UpgradeMenu.tsx`, `[NEW] src/i18n/useTranslation.ts`
- **Acceptance Criteria:**
  - [ ] `useTranslation()` hook created, reads from existing i18n catalog files
  - [ ] Language stored in localStorage, default = browser language or 'en'
  - [ ] Language selector dropdown added to SettingsMenu
  - [ ] All user-facing strings in MainMenu, GameOver, HUD, UpgradeMenu use `t('key')` calls
  - [ ] English and Spanish catalogs complete for all wired strings
  - [ ] Switching language instantly updates all visible text (no reload)
  - [ ] `npm run build` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M5-T3 · Accessibility Completion
- **Agent:** UI/UX Designer
- **Files:** `[MODIFY] src/components/SettingsMenu.tsx`, `[MODIFY] src/components/MainMenu.tsx`, `[MODIFY] src/components/PauseMenu.tsx`, `[MODIFY] src/components/UpgradeMenu.tsx`
- **Acceptance Criteria:**
  - [ ] Control remapping UI in Settings (P2-08): display current bindings, allow rebinding via click-to-capture
  - [ ] Volume preview: play sample sound on slider release (P2-12)
  - [ ] ARIA roles and labels on all menu buttons, sliders, and interactive elements
  - [ ] Focus management: arrow key navigation through menu items
  - [ ] `role="dialog"` on modal overlays with proper focus trapping
  - [ ] `npm run build` passes
- **Dependencies:** None
- **Status:** `[ ]`

---

### M5-T4 · Social Sharing Enhancement
- **Agent:** Business Engineer
- **Files:** `[MODIFY] src/components/GameOver.tsx`
- **Acceptance Criteria:**
  - [ ] Share button generates a canvas-based card image (900x600px) with: game logo, score, wave, kill count, biome background gradient
  - [ ] Card downloadable as PNG
  - [ ] Web Share API integration (navigator.share) for mobile native sharing
  - [ ] Fallback: copy share URL to clipboard with toast notification
  - [ ] `npm run build` passes
- **Dependencies:** M3-T4
- **Status:** `[ ]`

---

## Milestone 6: Final QA & Ship (9.8 → 10.0)

### M6-T1 · Full Regression Test
- **Agent:** QA Lead
- **Acceptance Criteria:**
  - [ ] `npm run ci` passes (all tests, lint, build)
  - [ ] E2E suite passes in headless Chromium
  - [ ] Manual playthrough: 20 waves on desktop Chrome, Firefox, Safari
  - [ ] Manual playthrough: 10 waves on mobile Chrome (Android) and Safari (iOS)
  - [ ] Zero `console.error` during any playthrough
  - [ ] Performance: ≥60fps desktop, ≥30fps mobile on "Balanced" quality
  - [ ] All quality presets work correctly (Ultra → Mobile)
  - [ ] Reduced motion mode fully disables all shake/bloom/chromatic effects
  - [ ] Colorblind mode applies canvas CSS filters correctly

---

### M6-T2 · Performance Audit
- **Agent:** QA Lead
- **Acceptance Criteria:**
  - [ ] Build output: main chunk ≤300kB gzip
  - [ ] Lighthouse performance score ≥90 on production build
  - [ ] Bloom pass: ≤1ms per frame (measured via `performance.now()`)
  - [ ] No memory leaks: 20-wave session shows stable heap in DevTools
  - [ ] Trail system doesn't grow unbounded: old trails recycled
  - [ ] FPS doesn't drop below 55 on desktop during boss + bloom + trails + combo VFX

---

### M6-T3 · Documentation Sync
- **Agent:** QA Lead
- **Files:** `[MODIFY] AGENTS.md`, `[MODIFY] AUDIT_REPORT.md`, `[MODIFY] TASKBOARD.md`, `[MODIFY] SESSION.md`, `[MODIFY] docs/ARCHITECTURE.md`, `[MODIFY] CHANGELOG.md`, `[MODIFY] package.json`
- **Acceptance Criteria:**
  - [ ] `AGENTS.md` updated with new systems (VisualFXPipeline, HitstopSystem, etc.)
  - [ ] `AUDIT_REPORT.md` ratings updated to reflect 10/10 state with evidence
  - [ ] `TASKBOARD.md` all items marked `[x]`
  - [ ] `docs/ARCHITECTURE.md` mermaid diagram includes VFX pipeline, HitstopSystem, ParticleTrailSystem
  - [ ] `CHANGELOG.md` has `[3.0.0]` entry with all milestone changes
  - [ ] `package.json` version bumped to `3.0.0`
  - [ ] `SESSION.md` updated with honest 10/10 assessment

---

### M6-T4 · Clean Deploy
- **Agent:** QA Lead
- **Acceptance Criteria:**
  - [ ] Feature branch merged to main via clean commit history
  - [ ] `npm run ci` passes on main
  - [ ] Firebase Hosting deploy successful
  - [ ] PWA service worker updated with new assets
  - [ ] Production URL loads and plays correctly
  - [ ] Git tag `v3.0.0` created
