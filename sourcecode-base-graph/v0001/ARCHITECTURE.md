# Architecture Snapshot
- Monorepo using npm workspaces: backend (Express + Prisma + TS), apps/user-app (Expo RN), apps/admin-app (Expo RN), packages/shared (types).
- Backend entry: backend/src/index.ts mounts /api/v1 routes (auth, sections, sales-groups, sales-sub-groups, schemes, sales, results, reports). Error handling responds with {success:false,error,message}.
- Database layer via Prisma schema (backend/prisma/schema.prisma) defining users, sections, game groups, sales entities, results, etc. Migrations not checked in.
- Shared types in packages/shared for API contracts; currently diverge from backend (e.g., bet_mode not used in backend route).
