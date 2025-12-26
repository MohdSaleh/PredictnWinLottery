# Stage 2 Database + Seed Evidence
Date: 2025-12-26

## Database Schema Implementation
- ✅ Prisma schema created based on DB_SCHEMA_CANONICAL.md
- ✅ All required tables implemented
- ✅ Relationships and constraints defined
- ✅ Migrations generated and applied successfully

## Schema Components

### Core Entities
- users (with roles: ADMIN, STOCKIST, SUBSTOCKIST, AGENT, SUBAGENT)
- sections (sessions with variable series_config)
- game_groups (digit counts: 1, 2, 3)
- section_groups (linking sections to digit groups)
- sales_groups (dropdown 1)
- sales_sub_groups (dropdown 2 / books)

### Pricing & Payout
- schemes (SET, ANY, BOXK, ALL patterns with rates)

### Sales
- bills (with status tracking)
- bill_entries (with pattern flags and expansion count)
- sales_ticket_assignments (authorization gate)

### Inventory
- ticket_products
- ticket_books

### Settlement
- results (with publish/revoke tracking)
- winnings
- ledger (debits/credits/settlements)

### Controls
- blocked_numbers
- block_rules
- credit_limits
- audit_logs

## Migration Execution
```bash
$ npx prisma migrate dev --name init
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "lottery_db"

Applying migration `20251226180810_init`
✔ Migration applied successfully
```
Status: ✅ PASSED

## Seed Execution
```bash
$ npm run seed
Starting database seed...
Creating users...
✅ Created users: admin (1), agent1 (2)
Creating sections...
✅ Created section: DEAR 1:00 PM (1)
✅ Created section: LSK 3:00 PM (2)
✅ Created section: DEAR 6:00 PM (3)
✅ Created section: DEAR 8:00 PM (4)
...
✅ Database seed completed successfully!
```
Status: ✅ PASSED

## Seed Verification Queries

### Exactly 4 Sections (Required)
```sql
SELECT id, name, code, draw_time_local, cutoff_offset_minutes, 
       jsonb_array_length(series_config::jsonb) as series_count
FROM sections ORDER BY id;
```

Result:
```
 id |     name     |   code   | draw_time_local | cutoff_offset_minutes | series_count 
----+--------------+----------+-----------------+-----------------------+--------------
  1 | DEAR 1:00 PM | DEAR_1PM | 13:00           |                     5 |           12
  2 | LSK 3:00 PM  | LSK_3PM  | 15:00           |                     5 |            6
  3 | DEAR 6:00 PM | DEAR_6PM | 18:00           |                     5 |           12
  4 | DEAR 8:00 PM | DEAR_8PM | 20:00           |                     5 |           12
```
Status: ✅ PASSED - Exactly 4 sections created

### Variable series_config (Required)
```sql
SELECT code, series_config FROM sections ORDER BY id;
```

Result:
```
   code   |                        series_config                         
----------+--------------------------------------------------------------
 DEAR_1PM | ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
 LSK_3PM  | ["A", "B", "C", "D", "E", "F"]
 DEAR_6PM | ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
 DEAR_8PM | ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
```
Status: ✅ PASSED - Variable series_config (LSK has 6, DEAR sessions have 12)

### Game Groups
```
 id | digit_count |  name   
----+-------------+---------
  1 |           1 | 1 Digit
  2 |           2 | 2 Digit
  3 |           3 | 3 Digit
```
Status: ✅ PASSED

### Sales Groups & Sub-Groups
```
 id |  group_name   | sub_id | sub_name 
----+---------------+--------+----------
  1 | Default Group |      1 | Book A
  1 | Default Group |      2 | Book B
  1 | Default Group |      3 | Book C
```
Status: ✅ PASSED

### Schemes
```
  name  | digit_count | pattern_type | base_price | payout_rate 
--------+-------------+--------------+------------+-------------
 ANY-1  |           1 | ANY          |       1.00 |        9.00
 SET-1  |           1 | SET          |       1.00 |        9.00
 ANY-2  |           2 | ANY          |       1.00 |       45.00
 SET-2  |           2 | SET          |       1.00 |       90.00
 ALL-3  |           3 | ALL          |       1.00 |      900.00
 ANY-3  |           3 | ANY          |       1.00 |      150.00
 BOXK-3 |           3 | BOXK         |       1.00 |      150.00
 SET-3  |           3 | SET          |       1.00 |      900.00
```
Status: ✅ PASSED - All required pattern types present

## Seed Summary
- Users: 2 (admin, agent1)
- Sections: 4 (DEAR 1PM, LSK 3PM, DEAR 6PM, DEAR 8PM)
- Game Groups: 3 (1, 2, 3 digit)
- Sales Groups: 1
- Sales Sub-Groups: 3
- Schemes: 8 (covering SET/ANY/BOXK/ALL patterns)
- Ticket Products: 4
- Sales Ticket Assignment: 1 (for test agent)
- Credit Limit: 1 (for test agent)

## Test Credentials
- Admin: username=admin, password=admin123
- Agent: username=agent1, password=agent123

## Conclusion
Stage 2 (M2 - DB Schema + Seed) is complete.
All acceptance criteria met:
- ✅ Migrations apply on fresh DB
- ✅ Seed creates exactly 4 sessions
- ✅ series_config is variable per section (not hardcoded to 12)
- ✅ Base masters exist (users, groups, schemes, etc.)
- ✅ SQL query outputs demonstrate correctness
