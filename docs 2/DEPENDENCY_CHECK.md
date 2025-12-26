# Dependency Check (Spec → Code → Proof)

Run this before starting any task or when confused.

## 1) Inputs present
- [ ] `docs/Project_Spec_APK_Faithful_Clone_v2.pdf|docx`
- [ ] `docs/screens/` has reference screenshots
- [ ] `docs/inputs/app.apk` present

## 2) Docs contracts present
- [ ] `docs/API_CONTRACT_CANONICAL.md`
- [ ] `docs/DB_SCHEMA_CANONICAL.md`
- [ ] `docs/DB_SEED_REQUIREMENTS.md`
- [ ] `docs/UI_STYLE_GUIDE.md`
- [ ] `docs/UI_PARITY_CHECKLIST.md`
- [ ] `docs/SCREEN_MAP.md`
- [ ] `docs/NAVIGATION_MAP.md`

## 3) Backend health (if code exists)
- [ ] `npm run db:migrate --workspace=backend`
- [ ] `npm run db:seed --workspace=backend`
- [ ] `npm test --workspace=backend`
- [ ] `PORT=3002 npm run dev --workspace=backend` → `/health` 200

## 4) App health (if code exists)
- [ ] `cd apps/user-app && npx expo start`
- [ ] `cd apps/admin-app && npx expo start`

## 5) Seed integrity checks
- [ ] Exactly 4 default sessions exist
- [ ] `series_config` exists and is JSON array per session
