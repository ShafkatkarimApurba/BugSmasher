# Gameplay Loop, Strategy, and Reliability Standards (2026-05-06)

## Scope
This document defines production gameplay standards for BugSmasher's core wave loop and the minimum technical quality gates required before release.

## Wave Loop Contract
1. **Wave Start:** `GameEngine.startWave()` initializes `WaveManager` for current wave.
2. **Combat:** enemies spawn until `bugsToSpawn = 0`; active entities continue until cleared.
3. **Wave Complete:** once spawned queue is empty and no enemies remain, engine transitions to upgrade state via `onWaveComplete`.
4. **Upgrade State:** player can:
   - buy upgrades,
   - skip upgrades,
   - close the panel and continue.
5. **Resume:** game must always be able to proceed to next wave without hidden dependency on a single control.

## Reliability Requirements
- No dead-end UI states between waves.
- Upgrade screen must expose at least **two** independent progression actions.
- Pause/HUD controls must not overlay or block upgrade interactions.
- Resuming from upgrade must explicitly clear paused state before loop restart.

## UX Standards
- Critical gameplay area should remain unobstructed by informational overlays.
- Non-critical information should be collapsible or auto-hidden in combat.
- Touch controls must have forgiving hit targets and avoid edge overlap conflicts.

## Data/Backend Standards for Gameplay Integrity
- Gameplay outcomes (scores, waves) should be validated server-side before leaderboard persistence.
- Client writes should be treated as untrusted signals.
- Schema and runtime queries must stay in lockstep (no columns queried that don't exist).

## Minimum CI Quality Gates
- `npm run build`
- `npm run lint`
- `npm test`

## Change Summary (This Iteration)
- Added explicit close + skip controls to wave-upgrade flow.
- Hid HUD during upgrade state to remove overlap risk.
- Ensured resume flow clears paused state before restarting wave loop.
- Fixed friends query projection to match SQL grammar.
- Added friends presence columns (`online`, `last_seen`) to schema for query parity.
