# BUGSMASHER // Tactical QA System 🛡️👾

An ultra-minimalist, high-intensity AI-themed base defense game showcasing the visual contrast between a pristine, deadpan modern "Brutalist OS" terminal and viscous, glowing neon bio-luminescent bugs. Built inside the browser with a high-performance **React 19**, **Vite**, and high-tier **Canvas 2D** rendering engine.

**Repository:** [github.com/HopeTheoory/BugSmasher-ApZz](https://github.com/HopeTheoory/BugSmasher-ApZz) · **Version:** 2.4.0

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [AUDIT_REPORT.md](./AUDIT_REPORT.md) | Brutal honest quality audit (7.4/10) |
| [TASKBOARD.md](./TASKBOARD.md) | Phased backlog for AI/human coders |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | CI/CD, Firebase Hosting, release checklist |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | PR workflow, commit standards |
| [AGENTS.md](./AGENTS.md) | Architecture rules for AI agents |
| [DESIGN_DOC.md](./DESIGN_DOC.md) | Creative vision & core loop |
| [SESSION.md](./SESSION.md) | Latest session log |
| [security_spec.md](./security_spec.md) | Firestore security model |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [docs/ENTERPRISE_TRANSFORMATION.md](./docs/ENTERPRISE_TRANSFORMATION.md) | Enterprise gap analysis & roadmap |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture (Mermaid) |
| [docs/PLAYER_GUIDE.md](./docs/PLAYER_GUIDE.md) | Player onboarding |
| [docs/adr/](./docs/adr/) | Architecture Decision Records |

---

## 🏆 Project Status — June 2026

**Overall Audit Rating: 7.4/10 (Pre-Production)**

Full analysis: [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) · AI task list: [`TASKBOARD.md`](./TASKBOARD.md)

| Category | Rating | Status |
|---|---|---|
| Architecture & Code Quality | 8.0/10 | ✅ Engine + Renderer modularized |
| Performance & Optimization | 7.8/10 | ✅ Real-time FPS scaler |
| UI/UX & Visual Design | 8.7/10 | ✅ Brutalist OS aesthetic |
| Game Design & Engagement | 7.4/10 | ⚠️ Procedural audio — top gap |
| Business Viability | 4.0/10 | ⚠️ No analytics/revenue yet |
| Security & Data Integrity | 7.0/10 | ⚠️ Client-side checksums |
| Testing Coverage | 8.5/10 | ✅ 409 tests |
| Feature Completeness | 7.2/10 | ✅ A11y + daily challenges |

---

## 🚀 Key Achievements (This Session)

### 1. ⚙️ Real-Time Performance Scaler Utility
To ensure a buttery smooth, high-intensity 60 FPS experience on any system, we implemented a real-time framerate scaling utility in `Renderer.ts`:
- **Smooth FPS Sampling**: Tracks delta render loops using high-accuracy timestamps (`performance.now()`), calculating a sliding window average (last 6 samples) to eliminate scale-jitter.
- **Dynamic VFX Quality Downscaling**: If the framerate falls below **40 FPS**, the scaler dynamically reduces particle counts (`vfxScalar`) proportionally down to `0.15` and optimizes rendering calculations.
- **Geometric Complexity Reduction**: Seamlessly increases the dynamic background mesh grid spacing step (from `10px` all the way up to `80px` during severe lag), cutting rendering vertices in real-time.
- **Auto-Recovery**: Smoothly restores full visual fidelity once high-framerates stabilize above the critical 40 FPS benchmark.

### 2. 🎛️ High-Fidelity VFX Switcher & Mobile Protection
Integrated adaptive configuration policies:
- **Intelligent Defaults**: Automatically detects touch capabilities, inner screen widths, and user-agent details. High Fidelity settings are deactivated on mobile screens to safeguard battery life and eliminate overheating.
- **Manual Toggle Controls**: Added a stylized toggler inside the settings menu with custom ambient green halo glows to toggle glows, heavy shadow blurs, vector cloud simulations, and complex particle lifespans.
- **Device Pixel Ratio (DPR) Clamping**: When high-fidelity features are disabled, the engine clamps down retina and high-DPI scaling factors to a strict `1.0`, rescuing fill-rate bound systems instantly.

### 3. 🫧 Particle Spawn Multiplexing
Re-engineered particle generation in `ParticleSystem.ts` to follow the dynamic scaler's outputs:
- All core effects (`spawnGibs`, `spawnSmoke`, `spawnSparkExplosion`, `spawnExplosion`, `spawnMissParticles`) multiply their spawn iteration indices with the scaler's current real-time performance factor (`vfxCountMultiplier`).

### 4. 🪱 React Hook-Mismatch Architectural Fix
Resolved a critical rendering crash within `<CustomCursor>`:
- Refactored the conditional early-return checks for mobile/touch screens to sit strictly **at the bottom** of the component.
- Guaranteed that all state hooks, reference hooks, tracking logic, and ambient particle animation callbacks execute in a perfect, deterministic order, complying with React's strict hook safety laws.

---

## 🛠️ Architecture Standards

- **Systemic Orchestration**: Core engine mechanics are organized into modular single-purpose controllers (`InputSystem`, `WaveManager`, `CollisionSystem`, `BossSystem`, `PowerupSystem`, `HazardSystem`).
- **Renderer Split**: `Renderer.ts` orchestrates `src/game/rendering/{Environment,Bug,Particle,UIRenderer}.ts` + `PerformanceScaler.ts`.
- **Standard Delta Timing (`dt`)**: Game math and physics calculations are strictly tied to high-precision update delta ticks. No `setTimeout` or `setInterval` structures are used.
- **Deterministic Type Safety**: Game-specific interface definitions and strict schemas reside in `src/game/GameTypes.ts`.

---

## 🧭 Development Roadmap (Priority Order)

### Phase 1 — Production Readiness ✅
- [x] Extract monoliths: CollisionSystem, BossSystem, PowerupSystem, HazardSystem
- [x] Split Renderer into sub-renderers under `src/game/rendering/`
- [x] `GameEngineStatusBus` typed event bus
- [x] `ParticleEngineHost` replaces `engine?: any`
- [x] 409 tests across 16 files

### Phase 2 — Commercial Polish
- [ ] Replace procedural audio with professional SFX + adaptive soundtrack
- [x] Accessibility suite (difficulty, reduced motion, gamepad, shape markers)
- [x] Daily challenges with modifiers and cosmetics
- [ ] Achievement gallery and lifetime stats dashboard

### Phase 3 — Growth & Monetization
- [ ] Cosmetics-only monetization (cursor skins, core themes, supporter pack)
- [ ] Social features (auto-generated score images, friend challenges)
- [ ] Analytics integration (PostHog/Mixpanel) for user behavior tracking
- [ ] Re-engagement mechanics (push notifications, email campaigns)

---

## 🏃 Getting Started

### Development
```bash
git clone https://github.com/HopeTheoory/BugSmasher-ApZz.git
cd BugSmasher-ApZz
npm install
npm run dev
```

### Quality & CI (required before push)
```bash
npm run ci          # lint + test + build
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy
See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Firebase Hosting, GitHub Actions, and release checklist.

```bash
npm run deploy:hosting   # build + firebase deploy
```
