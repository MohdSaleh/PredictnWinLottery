# Knowledge / Belief / Guess

## KNOWLEDGE
- Repo lacks package-lock.json; npm ci fails (artifact: artifacts/dev_pack/current/dependency_snapshot.txt).
- Backend dependencies not installed; dev/test commands fail without tsx/jest (from prior runs and missing node_modules).
- Prisma migrations folder is absent (backend/prisma/migrations missing).
- Apps present: apps/user-app (Expo), apps/admin-app (Expo); no mobile-app workspace.
- Docs under "docs 2" include canonical API contract and spec; actual code only implements partial routes.
- User app App.tsx contains only placeholder static screens (Login, Home, SalesEntry, OfflineQueue) with no real flows or navigation drawer.
- Admin app App.tsx contains placeholder static screens (Login, Dashboard, Masters, ResultPublish); no masters or reports implemented.
- Backend routes limited to auth, sections, sales-groups/sub-groups, schemes, sales/create_bill, results, and limited reports; missing draws/tickets/rates/blocked/limits/ticket assignments/bills CRUD/validate-lines/paginated reports/payments per spec.

## BELIEF
- Installing dependencies will require generating a new lockfile using npm (due to workspaces).
- Docker-compose Postgres can serve as local DB for Prisma migrations/seeds.

## GUESS
- Expo CLI not installed globally; running mobile apps will need npx expo after install.
- Some report routes may be incomplete beyond current implemented routes.
