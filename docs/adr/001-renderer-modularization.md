# ADR-001: Renderer Modularization

**Status:** Accepted  
**Date:** 2026-06-03

## Context

`Renderer.ts` grew to 2100+ lines, mixing environment, entities, particles, and HUD. This violated `AGENTS.md` "systems over monoliths" and blocked safe parallel development.

## Decision

Split rendering into:

- `PerformanceScaler` — FPS sampling, `vfxScalar`, mesh step
- `EnvironmentRenderer` — backgrounds, CRT, scanlines, boss intro
- `BugRenderer` — base, hazards, all bug bodies
- `ParticleRenderer` — splatters, particles, powerups, clouds
- `UIRenderer` — lighting pass, boss bar, powerup timers
- `Renderer` — orchestrates `draw()` + delegation API for tests

Shared visual state (`fireAlpha`, `powerupAlpha`, `chromaticOffset`) remains on `Renderer`; sub-renderers access via `parent`.

## Consequences

**Positive:** Test surface preserved via delegation; files < 1100 lines each.  
**Negative:** Slight indirection; must use `parent.*` for cross-renderer visual state.

## Compliance

Tests: `Renderer.test.ts` (40+ cases) — all green after migration.