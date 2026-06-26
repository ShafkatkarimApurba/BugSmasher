# Application Context & Standards

## Project Overview
This is a high-intensity, FAANG-level React/TypeScript game engine using Canvas 2D. 
It follows a modular architecture where the `GameEngine` orchestrates several systems.

## Audit Status (June 2026)
**Overall Rating: 7.4/10** — Pre-production. See `AUDIT_REPORT.md` and `TASKBOARD.md`.

| Category | Rating | Key Issue |
|---|---|---|
| Architecture & Code Quality | 8.0 | Renderer split complete; UI `any` types remain |
| Performance & Optimization | 7.8 | FPS scaler strong; offscreen canvas pending |
| UI/UX & Visual Design | 8.7 | Exceptional aesthetic; volume preview pending |
| Game Design & Engagement | 7.4 | Procedural audio is the #1 player-facing gap |
| Business Viability | 4.0 | No analytics or payment integration |
| Security & Data Integrity | 7.0 | Client-side checksum only |
| Testing Coverage | 8.5 | 409 tests — maintain for new features |
| Feature Completeness | 7.2 | A11y + gamepad added; i18n/social pending |

## Architecture Standards
- **Systems over Monoliths**: Avoid adding logic directly to `GameEngine.ts`. Extract specialized systems (e.g., `InputSystem`, `CollisionSystem`) to keep the engine lean.
  - Renderer delegates to `src/game/rendering/{Environment,Bug,Particle,UIRenderer}.ts` + `PerformanceScaler.ts`.
  - HUD sync uses `GameEngineStatusBus` — do not reintroduce `(window as any).__gameEngineStatus`.
- **Strict Timing**: NEVER use `setTimeout` or `setInterval` for game state. Use delta-time (`dt`) passed through the `update` loop.
- **Type Safety**: Core entities (`Bug`, `Powerup`, `Hazard`) are defined in `src/game/GameTypes.ts`. Always import from there to avoid circular dependencies.
- **Service Isolation**: Third-party services like Firebase should be abstracted or kept in specialized contexts (`AuthContext`).

## Implementation Guidelines
- **Brutal Honesty**: If a feature is implemented with "magic numbers" or hacks, document the technical debt immediately.
- **Performance**: High DPR is capped manually for mobile. Always check `isMobile` before intensive rendering effects (like `shadowBlur`).
- **Observability**: Game events should be logged internally for debugging and potentially surfaced to the player in "Intel" or "Terminal" components.

## Coding Standards (Post-Audit)
- **No `any` types in engine code**: Use `ParticleEngineHost`, `GameTypes.ts`. UI components still have `any` — see TASKBOARD P1-06.
- **No global state buses**: Use `GameEngineStatusBus.subscribe()` from React; legacy window sync is deprecated.
- **Prefer dependency injection over static managers**: Static service locators (ProgressionManager, StatsManager) make testing difficult — refactor with proper DI.
- **Test coverage target**: All new systems must have >80% test coverage. No merging without tests.
- **No client-side-only security**: Client-side checksums and validations must be mirrored with server-side enforcement.

## Documentation & Deployment

| Doc | Use when |
|-----|----------|
| `DEPLOYMENT.md` | Shipping to Firebase / configuring CI secrets |
| `CONTRIBUTING.md` | Opening PRs, commit format |
| `TASKBOARD.md` | Picking next implementation task |
| `AUDIT_REPORT.md` | Understanding quality gaps |

**Pre-push:** `npm run ci` · **Release:** follow DEPLOYMENT.md checklist · **Version:** `package.json` (currently 2.4.0)

## Recent Refactors (Completed June 2026)
- Split `Renderer` into `src/game/rendering/*` sub-modules.
- `GameEngineStatusBus`, `AccessibilitySettings`, `ParticleEngineHost`.
- GitHub Actions CI (`.github/workflows/ci.yml`).

## Earlier Refactors (May 2026)
- extracted `InputSystem` from `GameEngine`.
- centralize `GameTypes.ts`.
- remove `supabase` (unused).
- replace all `setTimeout` with `dt` based game timers.
