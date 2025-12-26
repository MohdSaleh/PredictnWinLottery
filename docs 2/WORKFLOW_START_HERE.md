# Workflow — START → FINAL DELIVERABLES

This is the **only allowed execution flow** to complete the project from scratch.

---

## Stage 0 — Inputs Lock (Required)
**Goal:** ensure spec inputs exist and are immutable.

### Required files (place inside `docs/inputs/`)
- APK: `docs/inputs/app.apk`
- Screenshots (APK UI): `docs/screens/*`
- Spec: `docs/Project_Spec_APK_Faithful_Clone_v2.pdf` (or `.docx`)

### Hard constraints (locked)
- Skip fake bank page; start at **Login**
- 2 Android apps:
  - `apps/user-app` (User/Agent flows)
  - `apps/admin-app` (Admin flows)
- Backend: Node.js (Express) + PostgreSQL
- UI must match screenshots (layout + strings + colors)

If Stage 0 is not satisfied: **STOP** and update `VALIDATION_REPORT.md`.

---

## Stage 1 — Repo Skeleton (Monorepo)
**Goal:** create clean structure with deterministic scripts.

Create folders:
- `apps/user-app` (React Native Expo)
- `apps/admin-app` (React Native Expo)
- `backend` (Express + TS)
- `packages/shared` (types, validation schemas)
- `docs` (this folder)

Add scripts:
- root `dev`, `dev:all`, `lint`, `test`, `db:migrate`, `db:seed`

Evidence required:
- `npm i` completes
- `npm run lint` runs
- `npx expo start` runs for both apps
- backend `/health` returns 200

---

## Stage 2 — Database + Seed (Authoritative Config)
**Goal:** implement schema + seed exactly as per `DB_SCHEMA_CANONICAL.md` and `DB_SEED_REQUIREMENTS.md`.

Non-negotiable seed defaults:
- Exactly 4 default sessions (sections):
  1) DEAR 1:00 PM
  2) LSK 3:00 PM
  3) DEAR 6:00 PM
  4) DEAR 8:00 PM
- `series_config` is **variable per section** (JSON array)

Evidence required:
- migrate ok
- seed ok
- queries proving 4 sessions exist

---

## Stage 3 — Backend Contract First (Spec-Locked APIs)
**Goal:** implement only APIs defined in `API_CONTRACT_CANONICAL.md` with canonical error schema.

Must implement early:
- auth (login/me)
- sections/active + section details
- schemes/rates retrieval
- sales create_bill with:
  - cutoff gate (default 5 min if missing)
  - number blocks
  - credit limit gate
  - expansion logic: 100/111 macros, BOX permutations, ALL series multiplier
- results publish/revoke
- admin masters (sales groups, books, schemes, blocks)

Evidence required:
- backend unit tests pass
- curl examples match contract
- no `{code: ...}` responses anywhere

---

## Stage 4 — User App (Agent Flow) APK-Parity
**Goal:** implement screens and navigation from `SCREEN_MAP.md` and `UI_PARITY_CHECKLIST.md`.

Must implement early:
- Login → Home/Choose Section
- Sales Entry matrix:
  - Group + Book dropdowns
  - 1/2/3 digit tabs
  - pattern toggles: Any/Set, 100, 111, Qty, BOXK, ALL
  - cart list + totals
  - save/submit
  - offline queue and retry screen
- Reports view (as per APK)
- Drawer navigation exactly

Evidence required:
- screenshots from emulator matching `docs/screens/*`
- flows tested with backend

---

## Stage 5 — Admin App (Masters + Result + Settlement)
**Goal:** admin features (not placeholder). Must be separate app.

Must implement:
- Login (admin) + role guard
- Masters:
  - Users + roles
  - Ticket books/assignments
  - Schemes + rates/commissions
  - Sections + series_config
  - Block rules / blocked numbers
  - Credit limits
- Result publish (manual result entry) + revoke
- Reports/exports/admin views required by spec

Evidence required:
- successful publish of result triggers settlement logic (backend)
- admin can manage masters without DB access

---

## Stage 6 — QA + Release
**Goal:** pass `END_TO_END_TEST.md` and ship installable builds.

Evidence required:
- end-to-end demo steps executed
- release checklist completed
- Android APK/AAB build artifacts created

---

## Always update
- `PROGRESS.md` (with evidence)
- `VALIDATION_REPORT.md` (parity mismatches)
- `DECISIONS.md` (append-only)
