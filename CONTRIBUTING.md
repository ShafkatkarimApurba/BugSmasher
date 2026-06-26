# Contributing to BUGSMASHER

Thank you for contributing. This project uses strict architecture rules so humans and AI agents can work safely in parallel.

---

## Before You Start

1. Read [AGENTS.md](./AGENTS.md) — architecture and coding standards  
2. Read [TASKBOARD.md](./TASKBOARD.md) — pick an open task by ID  
3. Read [AUDIT_REPORT.md](./AUDIT_REPORT.md) — understand current quality bar (7.4/10)

---

## Development Workflow

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name

npm install
npm run dev
```

### Required checks

```bash
npm run lint
npm test
npm run build
```

**Do not merge without all three passing.**

---

## Pull Request Guidelines

- One task per PR (reference TASKBOARD ID in description, e.g. `P2-01`)  
- Include tests for new game systems  
- No `any` in `src/game/` — use `GameTypes.ts`  
- No `(window as any)` for game state — use `GameEngineStatusBus`  
- Do not add logic directly to `GameEngine.ts` — extract systems  
- Update `TASKBOARD.md` checkbox when complete  

### PR title format

```
feat(scope): short description [P2-01]
fix(scope): short description [P1-07]
docs: update deployment guide
```

---

## Commit Message Format

```
type(scope): imperative summary

- Bullet for notable changes
- Reference TASKBOARD ID

Tests: 409 passing
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`

---

## AI Agent Instructions

If you are an AI coder:

1. Claim a task in `TASKBOARD.md` by noting it in `SESSION.md`  
2. Follow acceptance criteria in the task row exactly  
3. Run full test suite before marking `[x]`  
4. Update `AUDIT_REPORT.md` ratings only when dimensions materially change  

---

## Code Review Focus

- Delta-time (`dt`) only — no `setTimeout` / `setInterval` for gameplay  
- Renderer changes go in `src/game/rendering/`, not a growing monolith  
- Accessibility settings via `AccessibilitySettings.ts`  
- Firebase changes must update `firestore.rules` and `security_spec.md`  

---

## Questions

Open an issue on [HopeTheoory/BugSmasher-ApZz](https://github.com/HopeTheoory/BugSmasher-ApZz) with the `question` label.