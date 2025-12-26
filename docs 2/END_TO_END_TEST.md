# End-to-End Test Script (Ship Gate)

## Setup
1) Start DB
2) Run backend migrate + seed
3) Start backend server
4) Start user-app + admin-app

## Admin flow
1) Login as ADMIN
2) Verify sections show 4 sessions
3) Verify schemes exist for SET/ANY/ALL/BOXK
4) Ensure sales group + book exist and are active
5) Ensure an agent has a sales ticket assignment for today

## User flow
1) Login as AGENT
2) Choose section (e.g., DEAR 1:00 PM)
3) Go to Sales Entry
4) Select Group + Book
5) Enter a 3-digit bet with SET
6) Try 111 macro and verify count increases
7) Try 100 macro and verify count increases
8) Try BOXK toggle with 123 and verify preview shows permutations
9) Try ALL toggle and verify amount multiplier equals series_config length
10) Submit bill and confirm success toast

## Result publish + settlement
1) In admin app, publish result for that section/date (winning number matching one entry)
2) Verify winnings/settlement records exist
3) Verify reports show winning amounts

## Offline queue
1) Turn off network / point API to invalid URL
2) Submit bill → must be queued offline
3) Re-enable network → retry from Upload Queue → must upload successfully

Pass criteria: all steps complete without manual DB edits.
