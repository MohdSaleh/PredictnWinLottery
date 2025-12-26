# Docs Index (Indexed Map)

## 1) Start / Execution
- `WORKFLOW_START_HERE.md` — start → ship workflow
- `AGENT_GENERAL_INSTRUCTIONS.md` — non‑negotiables + what to do at any stage
- `AGENT_PLAYBOOK.md` — execution rules, anti‑patterns, safety rails
- `CONFUSION_PROTOCOL.md` — no‑guess process
- `PROMPT_SCHEMA.md` — strict task schema (YAML)
- `MASTER_AGENT_PROMPT.md` — paste to Copilot/Codex to run end‑to‑end

## 2) Spec & UI Parity
- `Project_Spec_APK_Faithful_Clone_v2.pdf|docx` — canonical product spec
- `SCREEN_MAP.md` — screens list + ownership + routes
- `NAVIGATION_MAP.md` — stacks/drawers and navigation rules
- `UI_STYLE_GUIDE.md` — colors, fonts, components (APK‑faithful)
- `UI_PARITY_CHECKLIST.md` — pixel‑parity checklist by screen

## 3) Backend / DB Contracts
- `API_CONTRACT_CANONICAL.md` — endpoints + payloads + error schema
- `ERROR_CODES.md` — normalized error codes
- `DB_SCHEMA_CANONICAL.md` — tables + columns + relations (PostgreSQL)
- `DB_SEED_REQUIREMENTS.md` — seed must-haves (4 sessions, series_config)
- `CONFIG_RULE_ENGINE.md` — ANY/SET/BOX + 100/111 + ALL logic (configurable)

## 4) Quality / Tests / Release
- `RUNBOOK_LOCAL_DEV.md` — local setup, commands, troubleshooting
- `TEST_PLAN.md` — unit/integration/e2e plan
- `END_TO_END_TEST.md` — step-by-step demo script (ship gate)
- `SECURITY_AND_AUDIT.md` — auth, roles, audit logs, hardening
- `RELEASE_CHECKLIST.md` — release checklist (Android builds, env)

## 5) Tracking / Decisions
- `PROGRESS.md` — progress with evidence
- `PROGRESS_CALC.md` — progress scoring rules
- `VALIDATION_REPORT.md` — mismatch log + fixes
- `OPEN_QUESTIONS.md` — unresolved unknowns (no guessing)
- `DECISIONS.md` — append-only decisions
- `ISSUE_TEMPLATES.md` — agent-friendly issue templates

## 6) Folders
- `inputs/` — keep APK + screenshots + spec PDFs (do not modify)
- `screens/` — exported screenshots / reference images
- `screens_build/` — emulator screenshots used as parity evidence
- `logs/` — build/test logs used as evidence
- `issues/` — optional local issue files
