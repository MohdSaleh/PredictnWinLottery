# Test Plan

## Backend
- Unit tests: gates (cutoff, blocks, credit), expansion logic (100/111, BOXK, ALL)
- Integration tests: create_bill → result publish → settlement generated
- Contract tests: response shape and error codes

## Apps
- Manual UI test: follow `END_TO_END_TEST.md`
- Screenshot evidence for parity in `docs/screens_build/`

## Release
- End-to-end demo must pass before shipping.
