# Data Flows (current state)
- Auth: POST /api/v1/auth/login -> JWT; GET /api/v1/auth/me uses authMiddleware to verify token.
- Sections: GET /api/v1/sections/active retrieves active sections from Prisma; details endpoint returns section info and available digit groups.
- Sales create_bill: request -> gates via SalesService (cutoff, ticket assignment, number blocks, credit) -> Prisma transaction creates bill and entries, updates credit limit. Lacks bet_mode handling and ticket assignment routes.
- Results: publish -> upsert result, compute winnings, ledger entries; revoke -> cancel winnings, mark result revoked.
- Reports: number-wise aggregates bill entries; net-pay aggregates sales and winnings; winning report returns winnings with user info.
