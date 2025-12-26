# General Instructions (Fail‑Safe Build Rules)

These instructions are mandatory for all agents working on this repo.

---

## A) Deliverables (locked)
1) Android User App (React Native): `apps/user-app`
2) Android Admin App (React Native): `apps/admin-app`
3) Backend API (Node.js Express): `backend`
4) PostgreSQL schema + seed

---

## B) No-Guess Policy
If anything is ambiguous:
1) Check `Project_Spec_APK_Faithful_Clone_v2.*`
2) Check `docs/screens/*` for the exact screen
3) Check `UI_PARITY_CHECKLIST.md`
4) Check `API_CONTRACT_CANONICAL.md` + `DB_SCHEMA_CANONICAL.md`
5) If still unknown: add to `OPEN_QUESTIONS.md` and implement a config knob (Rule Engine), not a hardcode guess.

---

## C) APK‑Faithful UI Rules
- Do not redesign.
- Strings must match casing exactly.
- Use `UI_STYLE_GUIDE.md` for colors/spacing.
- Navigation must match `NAVIGATION_MAP.md`.
- Use screenshots as truth.

---

## D) Canonical API response shape
All endpoints must return:

Success:
```json
{ "success": true, "data": {}, "message": null }
```

Error:
```json
{ "success": false, "error": "VALIDATION_FAILED", "message": "..." }
```

Never return `{code: ...}` in new code.

---

## E) Progress must be evidence-based
Progress only increases if acceptance criteria and evidence are attached in `PROGRESS.md`.
See `PROGRESS_CALC.md`.

---

## F) When stuck
Follow `CONFUSION_PROTOCOL.md`.
