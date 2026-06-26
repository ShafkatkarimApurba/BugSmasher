# ADR-002: GameEngineStatusBus

**Status:** Accepted  
**Date:** 2026-06-03

## Context

`CustomCursor` and HUD components read `(window as any).__gameEngineStatus` every animation frame — untyped, untestable, and anti-pattern for React.

## Decision

Introduce `GameEngineStatusBus`:

- `publish(status | null)` each frame while running
- `subscribe(listener)` for React `useEffect` integration
- `getSnapshot()` for synchronous reads
- Deprecated `syncLegacyWindowGlobal()` for one-release migration

## Consequences

**Positive:** Typed contract, decoupled React from engine internals.  
**Negative:** CustomEvent overhead negligible vs prior global writes.

## Alternatives Considered

- React Context from `Game` — rejected: canvas loop outside React tree
- Zustand store — rejected: unnecessary dependency for 12 fields