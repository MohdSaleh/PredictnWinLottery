# Progress Calculation Rules (No Fake Progress)

## Weights (locked)
- M0 5%
- M1 10%
- M2 15%
- M3 20%
- M4 20%
- M5 15%
- M6 10%
- M7 5%

## How progress moves
A milestone may be marked Done only when:
- acceptance criteria in `IMPLEMENTATION_PLAN.md` is met
- AND evidence exists in `PROGRESS.md`

## Evidence rules
- Backend: tests + health + sample curl
- User app: emulator screenshots + navigation proof
- Admin app: masters working + result publish demo
- DB: migrate+seed+verification queries
- End-to-end: follow `END_TO_END_TEST.md`
