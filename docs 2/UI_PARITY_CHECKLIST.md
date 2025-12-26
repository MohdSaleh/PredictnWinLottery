# UI Parity Checklist (APK Match)

Use this checklist screen-by-screen. Attach emulator screenshots in `docs/screens_build/`.

## Global
- [ ] Header color matches `#AA292E`
- [ ] Accent buttons match `#F19826`
- [ ] Error/timer text matches `#C61111`
- [ ] Strings/casing match screenshots exactly
- [ ] No extra padding/modern redesign

## Login
- [ ] Fields and labels match
- [ ] Validation/toast matches
- [ ] Skip fake bank page; start here

## Home / Choose Section
- [ ] Shows 4 sessions only (DEAR 1PM, LSK 3PM, DEAR 6PM, DEAR 8PM)
- [ ] Countdown logic uses section draw_time - cutoff offset (default 5 min)
- [ ] Navigation to Sales Entry exact

## Sales Entry
- [ ] Stats strip shows COUNT / Rs / TIME
- [ ] Group tab 1/2/3 digits
- [ ] Group + Book dropdown row present
- [ ] Toggles: Any, Set, 100, 111, Qty, BOXK, ALL
- [ ] 100 macro inserts 000/100/200.../900
- [ ] 111 macro inserts 000/111/.../999
- [ ] BOXK expands permutations server-side (and preview client-side)
- [ ] ALL multiplies by series_config length
- [ ] Offline queue saves on network errors, retry screen works
- [ ] Save/submit toasts match

## Pending Uploads
- [ ] Lists queued bills, retry single/all, clear all

## Admin Masters
- [ ] CRUD works with validations
- [ ] Result publish prompts confirmation

Attach evidence screenshots and update `VALIDATION_REPORT.md` for any mismatch.
