# AGENTS + TASKBOARD

## Vision
Ship BugSmasher as a secure, honest, and maintainable production-quality web game.

## Working Standards
- No hardcoded secrets in code/docs.
- All claims in docs must map to verifiable evidence (test output, code refs, build artifacts).
- Every change must pass: typecheck, lint, tests, build.

## Taskboard
| ID | Task | Dependency | Status |
|---|---|---|---|
| T1 | Remove hardcoded Supabase defaults and sanitize docs | none | ✅ Complete |
| T2 | Add ESLint + Prettier and wire scripts | T1 | ✅ Complete |
| T3 | Add CI pipeline for build/type/lint/test | T2 | ✅ Complete |
| T4 | Create canonical status + logbook protocol | T1 | ✅ Complete |
| T5 | Expand auth edge-case/integration tests | T2 | ✅ Complete |
| T6 | Runtime auth race hardening state machine | T5 | ✅ Complete |

## Logbook Protocol
Record every completed task in `LOGBOOK.md` with:
- Task ID
- UTC date/time
- Agent
- Summary
- Acceptance checks
- Follow-up risks
