# Agent Playbook (Execution Rules + Anti-Patterns)

## 1) Work style
- Always work in small, verifiable steps.
- Always attach evidence (logs/screenshots).
- Prefer configuration over hardcoding when business logic is uncertain.

## 2) Anti-patterns (forbidden)
- Guessing missing rules
- Inventing screens not in screenshots/spec
- “Improving UI” beyond APK parity
- Adding new dependencies without parity necessity
- Changing error schemas ad-hoc
- Adding “extra” seeded sessions beyond the locked 4

## 3) Required work artifacts per change
- UI change: emulator screenshot + route proof
- Backend change: unit test + curl sample
- DB change: migration + seed update + verification query
- Any ambiguity: `OPEN_QUESTIONS.md` entry + config knob

## 4) Preferred approach
Spec → Contract → DB → Backend gates → UI → Admin masters → End-to-end demo.
