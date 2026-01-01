# Issues Tracker
- Missing package-lock.json: blocks npm ci and installs.
- No Prisma migrations checked in; DATABASE_URL unspecified.
- API gaps vs spec: ticket assignment endpoints absent; bet_mode ignored; error code mismatch.
- Mobile apps unimplemented vs spec/screens.
- Backend missing spec endpoints for draws/tickets/rates/schema/blocked/limits/bills CRUD/validate-lines/reports pagination/payments; data model diverges from spec (UUIDs, exposures, rate assignments, global limits).
- Users/Admin apps are placeholder screens without required flows (keypad entry, reports, masters, drawer navigation, timers, offline drafts).
