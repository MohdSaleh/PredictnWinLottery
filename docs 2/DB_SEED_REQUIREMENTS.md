# DB Seed Requirements (Locked Defaults)

Seed must create at least:

## 1) Roles and users
- admin user (ADMIN)
- at least one AGENT test user (recommended)

## 2) Default sections (exactly 4)
1) DEAR 1:00 PM
2) LSK 3:00 PM
3) DEAR 6:00 PM
4) DEAR 8:00 PM

## 3) Series config is variable
- Each section has `series_config` json array.
- Do not hardcode 12 globally.
- ALL multiplier = length(series_config).

## 4) Digit groups
- game_groups for 1,2,3 digits
- section_groups linking each section to allowed digit groups

## 5) Sales dropdown masters
- sales_groups: at least one default
- sales_sub_groups: at least one default under each group

## 6) Schemes
- schemes for SET/ANY/BOTH/BOXK/ALL as required by spec

## 7) Sales ticket gate rows (recommended for local demo)
- for test agent, seed one assignment so `/sales/create_bill` can succeed
