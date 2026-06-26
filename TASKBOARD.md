# BUGSMASHER — AI Coder Taskboard

**Session closed:** 2026-06-03 · See `SESSION.md` for wrap-up.

> **10X Elevation (this feat branch):** CI hardened (functions + previews), PWA complete (icons + SW), bundle split (main ~290kB), QUALITY_PRESETS + post FX tunables added (three.js concepts ported to Canvas2D), tests green 411/411. See docs/2026_10X_TRANSFORMATION_ROADMAP.md and git log. Next: remaining any cleanup + full i18n wire + E2E.

**Legend:** `[x]` done · `[~]` partial · `[ ]` todo

---

## Phase 1 — Production Readiness (P0)

| ID | Task | Status |
|----|------|--------|
| P1-01 | Extract engine systems | [x] |
| P1-02 | Split Renderer | [x] |
| P1-03 | GameEngineStatusBus | [x] |
| P1-04 | ParticleEngineHost | [x] |
| P1-05 | Test suite 400+ | [x] |
| P1-06 | Remove UI `any` types | [ ] |
| P1-07 | Server checksum validation | [x] client + functions stub |
| P1-08 | Offscreen environment cache | [x] |

---

## Phase 2 — Commercial Polish (P1)

| ID | Task | Status |
|----|------|--------|
| P2-01 | SFX asset pack | [x] WAV + AudioAssetLoader |
| P2-02 | Adaptive music layers | [x] |
| P2-03 | Colorblind canvas filter | [x] |
| P2-04 | Difficulty presets | [x] |
| P2-05 | Reduced motion | [x] |
| P2-06 | Gamepad support | [x] |
| P2-07 | Enemy shape markers | [x] |
| P2-08 | Control remapping UI | [~] bindings exist, no Settings UI |
| P2-09 | Achievement gallery | [x] |
| P2-10 | Lifetime stats dashboard | [~] StatsManager extended |
| P2-11 | Daily challenge polish | [~] metadata exists |
| P2-12 | Volume preview | [ ] |

---

## Phase 3 — Growth (P1)

| ID | Task | Status |
|----|------|--------|
| P3-01 | Analytics wrapper | [~] facade + events |
| P3-02 | Share score image | [x] |
| P3-03 | Friend challenge links | [x] URL params |
| P3-04 | Monetization stub | [x] |
| P3-05 | Rewarded ads stub | [x] |

---

## Phase 4 — Expansion (P2)

| ID | Task | Status |
|----|------|--------|
| P4-01 | Endless mode | [x] |
| P4-02 | Boss Rush mode | [x] |
| P4-03 | i18n en + es | [~] catalogs only |
| P4-04 | Mobile haptics | [x] |
| P4-05 | Story expansion | [ ] |

---

## Quick Commands

```bash
npm run ci
npm run dev
```

**Deploy:** [DEPLOYMENT.md](./DEPLOYMENT.md) · **Wrap-up:** [SESSION.md](./SESSION.md)