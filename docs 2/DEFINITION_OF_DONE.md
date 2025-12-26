# Definition of Done (Project Complete)

Project is complete only when all checkboxes are true **with evidence**.

## Deliverables exist
- [ ] `apps/user-app` builds/runs (expo)
- [ ] `apps/admin-app` builds/runs (expo)
- [ ] `backend` builds/runs and `/health` works
- [ ] PostgreSQL migrations + seed work on clean DB

## Spec parity
- [ ] All screens in `SCREEN_MAP.md` exist
- [ ] UI parity checklist completed with emulator screenshots archived
- [ ] Navigation matches `NAVIGATION_MAP.md`

## Backend correctness
- [ ] APIs match `API_CONTRACT_CANONICAL.md`
- [ ] Canonical error schema used everywhere
- [ ] Sales expansion + gates tested
- [ ] Settlement works after result publish

## Admin controls
- [ ] Admin can manage masters (sections, schemes, groups/books, blocks, credit, users)
- [ ] Admin can publish and revoke results

## End-to-end
- [ ] `END_TO_END_TEST.md` passes fully
- [ ] Offline queue flow works end-to-end

## Release
- [ ] Release checklist completed
- [ ] Android build artifacts created (APK/AAB) and installable
