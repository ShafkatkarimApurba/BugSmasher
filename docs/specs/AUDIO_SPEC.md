# BUGSMASHER — AUDIO_SPEC.md (M2)

> **Authority:** Supersedes prior audio descriptions in SESSION.md, AUDIT_REPORT.md, 10X reports for M2 audio work.  
> **Version:** 1.0 · 2026-06-03  
> **Owner:** Audio Engineer (per MASTER_BLUEPRINT Agent Routing)  
> **Milestone:** M2 — Game Feel & Audio (8.3 → 8.8)  
> **Status:** Initial spec + implementation start. Brutally honest baseline.

---

## 1. Honest Baseline Audit (2026-06-03)

**Blueprint rating: Audio 3.0/10** — #1 player-facing gap. "Every kill is satisfying" fails without pro audio matching the excellent VFX (hitstop + shake + bloom + trails).

### Current Reality (from code inspection of SoundManager.ts ~1420 LOC, AudioAssetLoader.ts, public/audio/, GameEngine.ts, WaveManager.ts, callers)

| Aspect | Current State | Problems |
|--------|---------------|----------|
| **SFX** | Hybrid: 7 tiny generated WAVs in `public/audio/` (1-22KB, 22.05kHz mono) + advanced procedural fallback (multi-osc, noise, filters, modulation, impact, richTone) | Only 3 sounds (shoot, splat, ui_click) actually try asset before synth. Others always synth. WAVs are ultra-basic single-oscillator (generate-sfx.mjs is toy sine/noise with simple env). Feels "beepy/synthetic" not "crunchy/viscous/squishy". |
| **Asset Loading** | AudioAssetLoader with fetch + decode on first `init(ctx)`. Lazy, fire-and-forget (no await in SoundManager.init). No early preload, no progress, no retry. | Cold start latency possible. No PWA precache guarantee for audio (though manifest claims). No strategy doc. |
| **Adaptive Soundtrack** | Layered oscillator "music" per biome (BIOME_MUSIC: 7 biomes, drone/pulse/arpeggio/chaos, 2-4 osc layers). `updateGameState({intensity, healthPercent, isBossWave})` modulates gains/pitch. Reverb send. | 100% synthetic. No real music stems/assets. setTimeout scheduling (scheduleMusicUpdate). No dt-driven update(). Intensity response crude. No ducking on impacts/hitstops. No stems layering (low/mid/high). |
| **Spatial / Impact Audio** | None. No PannerNode, StereoPannerNode, or listener. All sounds centered. | Kills on left feel identical to right. No position-tied panning. No intensity linking to hitstop/shake/VFX (e.g. heavy shake → sub rumble). |
| **Hitstop / Juice Ties** | `playHitstop(intensity)` exists (basic 150→30Hz sine thump). Wired via HitstopSystem.onHitstopStart in GameEngine. `splat()` on kill, `bossDeath()` etc. | playHitstop is weak (no noise, no layering, no reverb punch). No combo ping. No wave transition SFX. No modulation of music during hitstop. |
| **Timing & Architecture** | Heavy use of `setTimeout` for sound sequencing (powerup rapid/multi/overdrive, bossWarning pulses, nuke phases, armoryUnlockTier fanfare, skillUpgrade, stopMusic osc kill, music scheduler, voice fallback). `(window as any).webkitAudioContext`. No `update(dt)` on SoundManager. | Violates AGENTS.md / MASTER_BLUEPRINT hard rules: "No `setTimeout`/`setInterval` for game state. All timing via `dt` in update loop." "No `any` in `src/game/`". Music/sounds not driven from GameEngine scaledDt. Sequences can desync under hitstop. Monolithic (effects + music + voice + processors all in one 45KB file). |
| **Effects Chain** | Good intent: Compressor + Reverb (synthetic IR) + Distortion + Delay + buses (sfx/music/voice) + reverb sends. | Reverb IR is white noise decay (ok but cheap). No sidechain ducking. No per-source filters for spatial. |
| **Voice** | SpeechSynthesis wrapper with mood rates/pitches. Used in StoryCutscene. | Browser-dependent, no asset fallback, setTimeout risks, not "pro" cinematic. |
| **Settings / UX** | Volume sliders (master/sfx/music/voice), mute, persist localStorage. UI sounds on menus. | No "volume preview" sample on slider (P2-12). No reduced-audio mode. No spatial test. |
| **Wiring** | GameEngine: splat on kill, bossDeath, shoot on fire, powerup, hitBase on collisions, updateGameState, playHitstop via hitstop cb. WaveManager: playBiomeMusic on change, bossWarning. Lazy dynamic imports common (cycle avoidance). Many React components call ui* sounds. | Inconsistent (some direct import, some lazy). No central event bus for audio (tight coupling). No spatial passed on calls. Combo kills do not escalate audio beyond hitstop. |
| **Tests / Quality** | Zero dedicated SoundManager tests. Mocks in system tests. generate-sfx is the "asset" source of truth. | No coverage of audio paths, spatial, preload, dt scheduling. `npm run ci` would pass without audio improvements. |
| **PWA / Assets** | public/audio/ present. generate-sfx.mjs run produces them. | Assets are not "professional recordings" — they are procedural WAVs. Script comment claims "minimal WAV assets". No high-quality source assets committed. |

**Composite honest rating: 3.5/10** (slight bump from 3.0 because hybrid loader + layered music + hitstop hook + effects chain exist; still catastrophic mismatch for "viscous neon combat" fantasy and VFX quality).

**Why critical:** Visuals deliver "crunch" via hitstop + directional shake + particles + bloom. Audio must match or immersion dies on first kill. Player-facing #1 defect per root SESSION, blueprint, AGENTS.

---

## 2. 10/10 Definition for Audio

A senior audio designer at a top studio would say: "Every squish, impact, and layer feels intentional, weighty, and spatial. Kills are crunchy. Music breathes with tension. No synthetic beeps. Works on mobile without drain. Tight sync to hitstop/shake/VFX."

### Success Criteria (Verifiable)
- Every kill uses spatial-panned asset or pro-grade layered synth + hitstop thump + combo ping escalation.
- Wave start/complete/boss have distinct musical/SFX cues (playWaveTransition).
- Music: 7 biome themes, intensity + boss + low-health reactive layers (duck on hitstop, pitch on shake).
- Assets load at boot (preload promise), 100% of provided WAVs wired + fallback robust.
- Zero `setTimeout` for game-timed audio sequences (pure dt accumulators in `update(dt)`).
- Zero `(window as any)` or `any` in src/game/SoundManager.ts + AudioAssetLoader.ts.
- Spatial: left/right bugs audibly pan; impact audio intensity scales with hitstop/shake magnitude.
- `npm run ci` green; manual 20-wave play: audio feels "pro" not toy (subjective but described).
- Mobile preset: fewer layers, no heavy IR reverb, shorter tails.
- Preload strategy: called from App/MainMenu before game start; assets cached; graceful no-sound if decode fails.
- Documentation + spec in sync; TASK_REGISTRY M2-T9 + follow-ups marked.

---

## 3. Architecture (Post M2 Improvements)

### Hybrid Model (Keep + Elevate)
- **Preferred:** Preloaded decoded AudioBuffer WAVs (real or high-quality generated) played via BufferSource + per-play Gain + StereoPannerNode.
- **Fallback (always available):** High-quality procedural synthesis (keep richTone, shapedNoise, impact, modulated — but elevate envelopes, add more layers, tie to params).
- **Why hybrid?** Small bundle, no external hosting, works offline, easy iteration, graceful on asset load fail.

### Key Modules
- `AudioAssetLoader.ts`: Expand SfxId, preloadAll at boot, `playSpatial(id, dest, vol, pan, rate?)`, `getBuffer`, error stats.
- `SoundManager.ts`: 
  - `init()` / `preload()` early.
  - `update(dt: number)` — REQUIRED. Drive all pending sequences, music modulation, timers. Use scaledDt awareness?
  - Processors stay (improve reverb?).
  - Music: convert scheduleMusicUpdate to dt accumulator. Add impact ducking, hitstop pitch dip.
  - Spatial: `setListenerPosition(centerX: number, canvasWidth: number)`; internal currentPan. Or per-call pan.
  - New public: `playHitstop(intensity)`, `playComboPing(tier: number)`, `playWaveTransition(phase: 'start'|'complete'|'boss')`, `playSfx(id: SfxId | 'synthetic', opts?: {x?:number, pan?:number, intensity?:number})`.
  - Improve existing: splat/hit/bossDeath use asset + layers + spatial + reverb tail.
- `scripts/generate-sfx.mjs`: Upgrade to produce richer, multi-layer, pro-ish WAVs (noise + harmonics, better env, multi-band). Add new assets: combo-ping, hitstop-thump, wave-sweep, impact-rumble.
- Call sites (GameEngine, WaveManager, Collision etc.): Pass position data where possible. E.g. `soundManager.splat(bug.x, width)`. Wire playComboPing on killCombo++, playWaveTransition on wave events, tie shake magnitude to audio thump.
- Integration with M2 VFX:
  - Hitstop: already hooks playHitstop. Enhance: pass combo/intensity; temporarily duck music + add low rumble.
  - ScreenShake: on heavy triggers (kill/boss), call soundManager.playImpactRumble(mag).
  - WaveTransitionSystem: callbacks already have onRequestHitstop; add audio calls or expose.
  - No direct VFX→audio; engine as orchestrator (keep lean per rules).

### Timing Rules (Hard)
- SoundManager must expose `update(dt: number): void`.
- GameEngine passes scaledDt (from hitstop) or raw? Audio should usually use raw wall dt for sound timing (sounds don't "freeze"), but can duck on hitstop state.
- **Zero setTimeout/setInterval inside SoundManager for sequencing.** Use arrays of `{ remaining: number, action: () => void }`. Decrement in update(dt).
- Exception: browser SpeechSynthesis (non-deterministic anyway) + UI hover/click (React event driven, not game loop).
- Music update driven purely from dt.

### No `any` / Type Safety
- Strict interfaces for SfxId, PlayOptions, MusicLayer, BiomeConfig, SpatialState.
- AudioContext: `const AudioContextCtor = (window as Window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as any).webkit...` — eliminate the any cast; use unknown + cast or feature detect only.
- All methods typed. No `type as any` from callers (fix in PowerupSystem etc if touched).

### Preload Strategy (M2+)
1. On app boot (App.tsx or MainMenu mount): `soundManager.preloadAssets()` (creates ctx if needed? careful with autoplay policy).
2. Audio init on first user gesture (click "Start" etc) — resume ctx.
3. Assets: fetch/decode in parallel; store promise; on complete mark ready.
4. If load fails for one, keep synth fallback, log once.
5. PWA: ensure audio/* in precache (vite-plugin-pwa config may need explicit).
6. Expose `isReady: boolean`, `getLoadErrors(): string[]`.

### Spatial + Impact Model
- `setSpatialPosition(x: number, canvasWidth: number)` — computes -1..1 pan. Stored.
- Or per SFX call accept optional `pan?: number` or `worldX?: number`.
- On play asset/synth: create StereoPannerNode, connect before gain/dest. For synth nodes, route osc→panner→gain.
- Impact: `playImpactAt(freq, vol, pan, punch)` used by hitBase, bossHit, kill events scaled by hitstop intensity + shake mag.
- Tie: In GameEngine.killBug after hitstop.trigger: compute pan from bug.x, call enhanced splat + playComboPing + (if heavy) low thump.

### Layered Adaptive Soundtrack
- Keep biome configs.
- Enhance layers: each layer has "role" (drone/bass/pulse/high).
- On hitstop: momentary gain duck + lowpass or pitch dip (recover over 200-500ms via dt).
- On shake high mag: add transient low layer or increase chaos.
- Intensity from waveManager + killsPerSec + health.
- Boss: swap/add aggressive layers.
- Low health: high dissonant layer + faster arpeggio.
- Future: replace drone layers with looped low-bitrate music stems (ogg) loaded same as SFX.

### SFX Catalog (Initial M2)
Use assets where possible + pro synth:

- Core Combat: shoot, splat (crunchy wet — asset + noise+squelch), hitBase, dash, bossHit, bossDeath (explosive + tail), bossAbility.
- Power/Collect: powerup(*), resource(*), skillUpgrade, nuke, upgrade.
- UI: uiHover, uiClick, uiError, scoreTick, armory*.
- Juice: playHitstop(intensity 0-1 → duration + low freq + noise punch), playComboPing(tier 1-5 → pitch + sparkle layers), playWaveTransition(phase).
- New internal: playImpactRumble(intensity).

Improve splat/bossDeath per M2-T9 ACs (envelopes, reverb tail).

---

## 4. Implementation Phases (This Work + Future)

**M2-T9 Core (this task):**
- [ ] Fix all `any` + webkit cast.
- [ ] Add `update(dt)` + replace setTimeout sequences with dt scheduler (at least for gameplay sounds: powerup, bossWarning, nuke, armory fanfares? keep simple for UI).
- [ ] Wire ALL 7 WAVs in their play methods.
- [ ] Implement `playComboPing`, `playWaveTransition`, `setSpatialPosition` + pan on key plays (splat, hit, shoot, boss*).
- [ ] Improve splat (envelope), bossDeath (reverb), playHitstop (layers).
- [ ] Early preload call site (e.g. Game or main menu).
- [ ] Music: dt driven update + simple hitstop duck.
- [ ] Call new APIs from kill/wave/hitstop paths.
- [ ] Enhance generate-sfx.mjs for better base WAVs + 2-3 new (hitstop, combo, wave).
- [ ] Update AudioAssetLoader for pan + more ids.
- [ ] `npm run ci` + manual verification.
- [ ] Update TASK_REGISTRY M2-T9 [x], add follow-ups M2-T9b etc if needed. Update SESSIONs honestly.

**M2 Follow-ups (parallel or next):**
- Full dt for all sequences.
- Music stem assets (opt-in).
- Volume preview (P2-12).
- Reduced audio preset.
- Dedicated audio unit tests (>80% for new paths).
- Extract MusicSystem / SfxPlayer if monolith grows.
- Real sample recordings (pro step).

**M3+:** Voice as asset clips, sidechain compression on hits, occlusion, etc.

---

## 5. API Surface (Target for SoundManager)

```ts
class SoundManager {
  // init / lifecycle (ctx on gesture)
  init(): void;
  preloadAssets(): Promise<void>; // early, non-blocking
  update(dt: number): void; // dt in SECONDS, call every frame with raw or scaled appropriately
  destroy(): void;

  // volumes (persist)
  setMasterVolume(v: number): void; /* ... sfx/music/voice */

  // spatial
  setSpatialPosition(x: number, canvasWidth: number): void; // or per play
  // internal: getPanForX(x, w): number

  // core sfx (enhanced)
  shoot(x?: number): void;
  splat(x?: number): void;
  // ...
  playHitstop(intensity: number): void;
  playComboPing(tier: number): void;
  playWaveTransition(phase: 'start' | 'complete' | 'bossIncoming'): void;
  playImpactRumble(intensity: number, pan?: number): void;

  // music
  playBiomeMusic(biome: string): void;
  stopMusic(): void;
  updateGameState(state: { intensity: number; healthPercent: number; isBossWave: boolean; hitstopIntensity?: number }): void;

  // ui / other (fire-forget)
  uiClick(): void; /* ... */
}
```

Callers updated to pass x where known. Engine provides listener center (coreX) or per-entity.

---

## 6. Verification & Honesty Gates

- Static: `npx tsc --noEmit` (or `npm run lint`) — zero errors in game audio files.
- Tests: existing pass; add SoundManager.test.ts if time (mock ctx, test preload, dt scheduling, pan calc, playCombo etc).
- Manual: Boot → start game → play 5+ waves on desktop. Listen for:
  - Spatial: bugs left/right different ear.
  - Crunch on splat + thump on hitstop (scales with combo/elite).
  - Combo pings escalate.
  - Wave transitions have cue.
  - Music reacts to intensity/boss/health + ducks on impact.
  - No synth beeps dominating when assets present.
- Cross: Mobile preset lighter.
- CI: full `npm run ci`.
- Docs: This spec + MASTER_BLUEPRINT + TASK_REGISTRY + root + repo/SESSION.md updated with gaps (e.g. "WAVs still generated not recorded; real samples P1 for ship").

**Brutally Honest Note:** Even after this, audio will be "good procedural + basic assets" not AAA foley. True pro requires recorded layers (squish, chitin crack, wet impacts) + proper mastering + music composition. This gets us from 3.0 to ~6.5-7 in audio dimension. Acceptable for M2 elevation. Recommend future budget for samples.

---

## 7. References
- MASTER_BLUEPRINT.md (M2, agent table, hard rules, success criteria)
- TASK_REGISTRY.md (M2-T9 + related VFX that audio must sync with: hitstop, shake, wave)
- AGENTS.md (dt, no any, systems)
- GameEngine.ts / HitstopSystem.ts / WaveManager.ts (integration points)
- public/audio/ + scripts/generate-sfx.mjs (asset truth)
- VisualFXPipeline / ScreenShakeSystem (juice sync targets)

*Created by Audio Engineer subagent. High-quality only. Will iterate in code + re-audit.*
