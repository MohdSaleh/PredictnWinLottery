# Implementation Plan (Milestones + Acceptance Gates)

This plan is the authoritative “what to build next” list.

## M0 Repo Skeleton + Build Health (5%)
Acceptance:
- root scripts exist for dev/lint/test
- backend /health 200
- expo starts for both apps
Evidence:
- logs in `docs/logs/`
- PROGRESS.md updated

## M1 Spec Lock + Contracts (10%)
Acceptance:
- API contract canonical exists and used by backend
- DB schema canonical exists and used by migrations
- UI style guide + navigation map exist
Evidence:
- links to docs files
- Validation report has zero missing dependencies

## M2 DB Schema + Seed (15%)
Acceptance:
- migrations apply on fresh DB
- seed creates exactly 4 sessions + variable series_config
- base masters exist
Evidence:
- SQL query outputs stored in docs/logs

## M3 Backend APIs + Gates + Tests (20%)
Acceptance:
- contract endpoints implemented
- sales gates + expansions tested
- canonical error schema everywhere
Evidence:
- test output + curl examples

## M4 User App Core Flows + Offline Queue (20%)
Acceptance:
- login → section → sales entry works
- offline queue end-to-end works
- UI parity checklist for these screens is satisfied
Evidence:
- emulator screenshots in docs/screens_build

## M5 Admin App Masters + Result Publish (15%)
Acceptance:
- admin CRUD masters + publish/revoke results
- settlement occurs on publish
Evidence:
- end-to-end test steps logged

## M6 Reports/Exports/Accounts/Audit (10%)
Acceptance:
- reports endpoints + screens exist per spec
- audit logs recorded
Evidence:
- screenshot + curl

## M7 End-to-End Demo + Release (5%)
Acceptance:
- END_TO_END_TEST passes
- RELEASE_CHECKLIST done
Evidence:
- build artifacts info + logs
