# API Contract (Canonical) — Express

Base URL: `/api/v1`

## Response Shape (locked)
Success:
```json
{ "success": true, "data": {}, "message": null }
```
Error:
```json
{ "success": false, "error": "VALIDATION_FAILED", "message": "..." }
```

## Auth
### POST `/auth/login`
Request:
```json
{ "username": "string", "password": "string" }
```
Response:
```json
{ "success": true, "data": { "token": "jwt", "user": { "id": 1, "role": "ADMIN" } }, "message": null }
```

### GET `/auth/me`
Auth: Bearer JWT

## Sections (Sessions)
### GET `/sections/active`
Returns 4 default sessions by seed (backend configurable).

### GET `/sections/:id/details?date=YYYY-MM-DD`
Includes:
- draw_time_local
- cutoff_offset_minutes (default 5 if missing)
- series_config (array)

## Sales Groups (dropdown masters)
### GET/POST `/sales-groups`
### GET/POST `/sales-sub-groups` (filter by group_id)

## Schemes / Rates
### GET/POST `/schemes`
### GET `/my-rates` (agent) [if applicable]

## Sales (User/Agent)
### POST `/sales/create_bill`
Request (minimum):
```json
{
  "section_id": 1,
  "date": "YYYY-MM-DD",
  "digit_len": 3,
  "group_id": 1,
  "sub_group_id": 1,
  "bet_mode": "LSK_SUPER|BOXK|ALL|SET|ANY",
  "entries": [
    { "number": "123", "quantity": 1, "stake_per_unit": 10.0, "pattern_flags": 1 }
  ]
}
```

Server responsibilities (authoritative):
- cutoff gate (SALES_CLOSED)
- ticket assignment gate (NO_TICKETS_ASSIGNED)
- number blocks (NUMBER_BLOCKED)
- credit limit (CREDIT_LIMIT_EXCEEDED)
- expansion:
  - 100 macro → 10 numbers (000,100,...900)
  - 111 macro → 10 triples (000,111,...999)
  - BOXK permutation explode
  - ALL series multiplier by `series_config.length`

## Results (Admin)
### POST `/results/publish`
### POST `/results/revoke`
### GET `/results?section_id=&date=`

## Reports
### GET `/reports/number-wise`
### GET `/reports/net-pay`
### GET `/reports/winning`
