# BUGSMASHER: Conceptual Design & Core Loop

## 1. The Theme: "Tactical QA" (Brutalist OS vs. Bio-Luminescent Squish)
**The Concept:** You are an automated, ruthless Quality Assurance AI operating a top-secret server mainframe. 
**The Contrast (The Viral Hook):** The interface is an ultra-serious, hyper-minimalist "Brutalist OS" (dark mode, crisp wireframes, military-grade typography). However, the "bugs" are literal, highly saturated, gelatinous, bioluminescent creatures. 
*   **Why it's viral:** The juxtaposition between the deadpan, serious "CRITICAL SYSTEM FAILURE" text and the utterly visceral, vibrant, squishy neon-gummy-bear-like bugs exploding all over the pristine interface creates highly shareable, visually arresting moments. It's "Military Simulator" meets "Fruit Ninja".

## 2. Visual Identity & Art Style
*   **The OS (The Player):** Swiss modernism, JetBrains Mono font, pure black `#050505` backgrounds, stark white UI elements. Very "Grok" or "Palantir" dashboard.
*   **The Swarm (The Enemies):** 3D-feeling, glossy, neon-colored (Hot Pink, Cyan, Toxic Green) insects. They should look almost tangible and squishy.
*   **The VFX (The Payoff):** When smashed, they shouldn't just disappear—they must violently detonate, staining the pristine black-and-white OS with glowing, colorful "digital goop" and glitching the UI where they die. The contrast of bright pink fluid dripping down a serious terminal screen is our memeable money-shot.
*   **Audio (CRITICAL GAP):** Currently all audio is procedurally generated (sine wave drones, white noise bursts). For commercial release, this MUST be replaced with professional SFX (satisfying splats, mechanical UI clicks, heavy bass drones) and an adaptive soundtrack that responds to combat intensity.

## 3. Marketing & Community Engagement Angles
*   **"Squash Your Jira Tickets":** Marketing campaigns leaning into developer/office culture. "Send this to your QA team." Name bosses after notorious actual software bugs (e.g., "The Null Pointer", "The Memory Leak").
*   **Clip-ability:** The "Stain Level." Players sharing screenshots of their completely neon-goop-covered OS after surviving a massive Surge to wave 50. 
*   **Merchandising:** The squishy neon bugs are perfect for physical plushies or desk toys, while the OS aesthetic appeals to the tech community.

## 4. Audit-Driven Feature Roadmap

### Current Status (June 2026)
**Overall Rating: 7.4/10** — Pre-production. See [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) and [`TASKBOARD.md`](./TASKBOARD.md).

### Phase 1 — Production Readiness ✅
- [x] Split GameEngine.ts into: CollisionSystem, BossSystem, PowerupSystem, HazardSystem
- [x] Split Renderer.ts into sub-renderers under `src/game/rendering/`
- [x] `GameEngineStatusBus` typed event bus
- [x] `ParticleEngineHost` (no `engine?: any` in ParticleSystem)
- [x] 409 tests across 16 files · CI via GitHub Actions

### Phase 2 — Commercial Polish (Priority: High)
- [ ] **Professional Audio Overhaul** (top player-facing gap)
- [x] **Accessibility Suite** (partial): difficulty, reduced motion, gamepad, enemy shapes
- [ ] Colorblind canvas filter pipeline · control remapping
- [x] **Daily Challenges** — modifiers, cosmetics, modal UI
- [ ] **Achievement Gallery** — full visual dashboard

### Phase 3 — Growth & Monetization (Priority: Medium)
- [ ] **Cosmetics-Only Monetization**:
  - Cursor skins and trail effects
  - Core/defense system themes
  - Splatter color palettes
  - "Supporter Pack" with exclusive cosmetics
  - Rewarded video ads for resource boosts (gameplay stays 100% free)
- [ ] **Social Features**:
  - Auto-generated score share images
  - Friend challenges ("Beat my score")
  - Weekly tournaments with leaderboards
  - Invite links with referral rewards
- [ ] **Analytics**: PostHog/Mixpanel integration for retention, DAU, funnel analysis
- [ ] **Re-engagement**: Push notifications, email campaigns for returning players

### Phase 4 — Expansion (Priority: Nice-to-Have)
- [ ] New game modes: Endless, Boss Rush, Time Attack, Survival
- [ ] Story expansion: 5+ additional story beats, multiple endings based on prestige
- [ ] i18n / localization for international markets
- [ ] Network connectivity status indicator
- [ ] Mobile haptic feedback

---

## 5. The Core Gameplay Loop

### The Micro-Loop (Second-to-Second)
1. **Identify & Prioritize:** Radar blips indicate incoming swarm vectors. Player must rapidly visually parse target threats (e.g., fast pink scouts vs. slow green tanks).
2. **Execute (APM):** Rapid, precise "smashing" (clicking/tapping). High APM (Actions Per Minute) and accuracy are rewarded.
3. **Exploit Anomalies:** Smashed bugs drop transient Powerups (Nuke, Rapid Fire Turret, Core Shield) that must be clicked to collect, forcing the player to balance defensive clicking with offensive collection.
4. **Survive the Surge:** Manage periodic "Surges" where intensity doubles, pushing the player's reaction time to the absolute limit.

### The Macro-Loop (Run-to-Run)
1. **Defend:** Protect the central Core. If health drops to 0, the session terminates.
2. **Harvest:** Collect "Data Shards" (score/currency) based on surviving waves, combos, and clean defenses.
3. **Upgrade (Meta-Progression):** Use collected shards in the Main Menu to permanently upgrade OS capabilities:
    * *Hardware:* Larger click radius, tougher core armor.
    * *Software:* Automated defense turrets, higher powerup drop rates.
4. **Escalate:** Re-enter the simulation against increasingly mutated/complex Bug variations.
