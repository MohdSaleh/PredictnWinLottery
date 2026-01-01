# Specification vs Implementation Analysis Report

**Date**: 2026-01-01  
**Purpose**: Compare the provided project specification with the current implementation  
**Repository**: PredictnWinLottery

---

## Executive Summary

This analysis compares the detailed project specification provided (which describes a dual-mobile-app lottery system) against the current repository implementation. The goal is to identify gaps, deviations, and alignment issues.

### Key Findings

1. **Overall Architecture**: The current implementation follows the general structure (Backend + User App + Admin App) but with significant differences in domain modeling and API design.

2. **Database Schema**: The implementation uses different terminology and structure compared to the spec (e.g., "Sections" vs "Draws", missing "Tickets" entity).

3. **API Design**: Current APIs exist but don't fully match the spec's endpoint structure and naming conventions.

4. **Business Logic**: Core concepts like expansions and gates exist but implementation details differ from spec requirements.

---

## 1. Domain Model Comparison

### 1.1 Users

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity name | `Users` | `User` | ✅ Match |
| Primary key | UUID | Int (auto-increment) | ⚠️ **Deviation** |
| Fields | id, username, password_hash, role, parent_user_id, is_active, permissions_json | id, username, password_hash, name, email, phone, role, is_active | ⚠️ **Missing**: parent_user_id, permissions_json |
| Roles | ADMIN, STOCKIST, SUBSTOCKIST, AGENT, SUBAGENT | ADMIN, STOCKIST, SUBSTOCKIST, AGENT, SUBAGENT | ✅ Match |
| Hierarchy | Supported via parent_user_id | **Missing** - no parent relationship | ❌ **Gap** |

**Impact**: User hierarchy and down-line management (critical for rate/credit assignment) cannot be implemented.

### 1.2 Draws (Sections)

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity name | `Draws` | `Section` | ⚠️ **Terminology Difference** |
| Primary key | UUID | Int | ⚠️ **Deviation** |
| Fields | id, name, publish_time_local, close_offset_minutes, timezone, is_active | id, name, code, draw_time_local, cutoff_offset_minutes, series_config, is_active | ⚠️ **Differences** |
| Timezone | Explicit timezone field | **Missing** | ❌ **Gap** |
| Series config | Not in spec | Added (JSON) | ℹ️ **Extension** |

**Impact**: Timezone handling may cause issues with multi-region deployments. The "code" field and "series_config" are additions not in spec.

### 1.3 Tickets

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Tickets` with draw_id, name, allowed_digit_modes | **MISSING** | ❌ **Critical Gap** |
| Related | Should link to Draws | N/A | ❌ **Gap** |

**Implementation has**:
- `TicketProduct` (name only, e.g., "SET", "ANY")
- `Scheme` (digit_count, pattern_type, pricing)
- `SalesTicketAssignment` (user assignments)

**Impact**: The spec's "Tickets" entity (e.g., "LSK-SUPER", "BOXK", "LSK-A", "DEAR-A") that ties specific ticket types to draws is **completely missing**. This is a fundamental architectural difference.

### 1.4 Rate Assignments

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Rate Assignments` table | **MISSING** | ❌ **Critical Gap** |
| Fields | upline_user_id, downline_user_id, ticket_id, base_rate, assign_rate, scope_section_id | N/A | ❌ **Gap** |

**Implementation has**: `Scheme` with base_price, payout_rate, commission_rate (flat rates, not hierarchical)

**Impact**: Cannot implement rate assignment per spec requirements. The commission/rate propagation down user hierarchy cannot work without this.

### 1.5 Global Exposure Limits

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Global Exposure Limits` | **MISSING** | ❌ **Gap** |
| Fields | draw_id, digit_mode, number_exact, limit_qty, aggregation_mode | N/A | ❌ **Gap** |

**Implementation has**: `BlockedNumber` and `BlockRule` (pattern-based blocking only)

**Impact**: Cannot enforce quantity-based exposure limits as specified.

### 1.6 Blocked Numbers

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Blocked Numbers` | `BlockedNumber` + `BlockRule` | ⚠️ **Partial** |
| Fields | draw_id, digit_mode, ticket_id, number_pattern, reason, is_active | pattern, section_id, group_id, max_count, is_active | ⚠️ **Differences** |
| Per-ticket blocking | Supported (ticket_id nullable) | **Missing** | ❌ **Gap** |

**Impact**: Cannot block numbers for specific tickets only.

### 1.7 Bills

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Bills` | `Bill` | ✅ Match |
| Primary key | UUID | Int | ⚠️ **Deviation** |
| Fields | bill_no, user_id, draw_id, sold_at, total_qty, gross_amount_customer, settlement_amount_base, status, note, deleted_at, deleted_by | user_id, section_id, date, total_count, total_amount, status, is_offline | ⚠️ **Differences** |
| Bill number | Unique bill_no string | **Missing** | ❌ **Gap** |
| Soft delete | deleted_at, deleted_by | **Missing** | ❌ **Gap** |
| Status values | SAVED, DELETED | PENDING, SUBMITTED, CONFIRMED, CANCELLED | ⚠️ **Different** |

**Impact**: Bill numbering system missing; soft delete not implemented; status semantics differ.

### 1.8 Bill Items (Raw)

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Bill Items (Raw)` | `BillEntry` | ✅ Match |
| Fields | ticket_id, digit_mode, number_entered, qty, flags_json, line_amount | number, quantity, stake_per_unit, pattern_flags (int), expanded_count, series | ⚠️ **Differences** |
| Flags storage | JSON | Int (bit flags) | ⚠️ **Different approach** |

**Impact**: Implementation uses bit flags instead of JSON for pattern flags. Functional but different format.

### 1.9 Exposures (Expanded)

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Exposures (Expanded)` table | **MISSING** | ❌ **Critical Gap** |
| Purpose | Store expanded entries for limit enforcement and winning matching | Expansions calculated on-the-fly | ❌ **Architectural difference** |

**Impact**: Without stored exposures, limit enforcement across the system is not possible. Winning calculation must re-expand entries.

### 1.10 Results & Winnings

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Results entity | draw_id, result_date, published_at, payload_json, status | section_id, date, winning_number, series, published_by, published_at, is_revoked | ⚠️ **Differences** |
| Status values | PUBLISHED, ROLLED_BACK | is_revoked (boolean) | ⚠️ **Different** |
| Payload | JSON with multiple winners and positions | Single winning_number | ⚠️ **Simplified** |
| Winnings | Computed with payout schema, is_super flag | amount, status (PENDING/PAID/CANCELLED) | ⚠️ **Partial** |

**Impact**: Cannot handle multiple prize positions. Net Pay calculation may not match spec.

### 1.11 Audit Log

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Entity | `Audit Log` | `AuditLog` | ✅ Match |
| Fields | ts, actor_user_id, module, action, entity_type, entity_id, request_id, before_json, after_json | actor_id, action, entity, entity_id, payload, created_at | ⚠️ **Partial** |
| Before/After | Separate fields | Combined in payload | ⚠️ **Different** |
| Module/Request ID | Supported | **Missing** | ❌ **Gap** |

**Impact**: Less granular audit trail. Cannot trace request correlation.

---

## 2. Backend API Comparison

### 2.1 Authentication

| Endpoint | Specification | Implementation | Status |
|----------|--------------|----------------|--------|
| Login | `POST /auth/login` → {token, user_id, role, permissions} | `POST /api/v1/auth/login` → {token, user} | ✅ **Match** |
| Current user | `GET /auth/me` | `GET /api/v1/auth/me` | ✅ **Match** |
| Device ID | Required in login | **Missing** | ⚠️ **Optional** |

### 2.2 Draw/Ticket Master Endpoints

| Endpoint | Specification | Implementation | Status |
|----------|--------------|----------------|--------|
| List draws | `GET /draws` | `GET /api/v1/sections/active` | ⚠️ **Different path** |
| Draw details | `GET /draws/:id` | `GET /api/v1/sections/:id/details` | ⚠️ **Different path** |
| List tickets | `GET /tickets?draw_id=...` | **MISSING** | ❌ **Gap** |
| Get rates | `GET /rates/my?draw_id=...` | **MISSING** | ❌ **Gap** |
| Get schema | `GET /schema?draw_id=...` | `GET /api/v1/schemes` (not per draw) | ⚠️ **Partial** |
| Blocked numbers | `GET /blocked?draw_id=...` | **MISSING** | ❌ **Gap** |
| Exposure limits | `GET /limits/exposure?draw_id=...` | **MISSING** | ❌ **Gap** |

**Impact**: Several spec endpoints missing. Cannot retrieve tickets, rates, or limits per draw.

### 2.3 Sales Endpoints

| Endpoint | Specification | Implementation | Status |
|----------|--------------|----------------|--------|
| Validate line | `POST /bills/validate-line` | **MISSING** | ❌ **Gap** |
| Validate lines | `POST /bills/validate-lines` | **MISSING** | ❌ **Gap** |
| Create bill | `POST /bills` | `POST /api/v1/sales/create_bill` | ⚠️ **Different path** |
| Edit bill | `PATCH /bills/{bill_id}` | **MISSING** | ❌ **Gap** |
| Delete bill | `DELETE /bills/{bill_id}` | **MISSING** | ❌ **Gap** |
| Get by number | `GET /bills/by-no/{bill_no}` | **MISSING** | ❌ **Gap** |

**Impact**: Cannot validate before save; cannot edit/delete bills; cannot search by bill number.

### 2.4 Reports Endpoints

| Endpoint | Specification | Implementation | Status |
|----------|--------------|----------------|--------|
| Sales report | `GET /reports/sales?...` | **MISSING** | ❌ **Gap** |
| Winning report | `GET /reports/winning?...` | `GET /api/v1/reports/winning` | ✅ **Match** |
| Numberwise winning | `GET /reports/numberwise-winning?...` | `GET /api/v1/reports/number-wise` | ✅ **Match** |
| Net pay | `GET /reports/net-pay?...` | `GET /api/v1/reports/net-pay` | ✅ **Match** |
| Account summary | `GET /reports/account-summary?...` | **MISSING** | ❌ **Gap** |

**Impact**: Missing sales report and account summary endpoints.

### 2.5 Admin Endpoints

| Endpoint | Specification | Implementation | Status |
|----------|--------------|----------------|--------|
| User CRUD | `POST/PUT/GET /users` | **MISSING** | ❌ **Gap** |
| Ticket CRUD | `POST/PUT /tickets` | **MISSING** | ❌ **Gap** |
| Rate schema | `POST /rates/schema` | `POST /api/v1/schemes` | ⚠️ **Partial** |
| Rate assign | `POST /rates/assign` | **MISSING** | ❌ **Gap** |
| Exposure limits | `POST /limits/exposure` | **MISSING** | ❌ **Gap** |
| Blocked numbers | `POST /blocked` | **MISSING** | ❌ **Gap** |
| Publish result | `POST /results/publish` | `POST /api/v1/results/publish` | ✅ **Match** |
| Rollback result | `POST /results/rollback` | `POST /api/v1/results/revoke` | ✅ **Match** |
| Payments | `POST /payments` | **MISSING** | ❌ **Gap** |

**Impact**: Major admin functions missing (user management, rate assignment, limit management).

---

## 3. Enforcement Rules

### 3.1 Time Gate

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Logic | close_time = publish_time - close_offset | Implemented in `checkCutoffGate` | ✅ **Implemented** |
| Enforcement | Block sales/edits/deletes after close | Implemented for sales creation | ⚠️ **Partial** (no edit/delete) |

### 3.2 Global Exposure Limit (QTY)

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Table | Global Exposure Limits | **MISSING** | ❌ **Not Implemented** |
| Enforcement | Check total qty across all users | **MISSING** | ❌ **Not Implemented** |
| Error | GLOBAL_LIMIT_REACHED | **N/A** | ❌ **Not Implemented** |

### 3.3 Blocked Numbers

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Table | Blocked Numbers | BlockedNumber + BlockRule | ⚠️ **Partial** |
| Enforcement | Pattern matching | Implemented in `checkNumberBlockingGate` | ✅ **Implemented** |

### 3.4 Credit Limit Check

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Table | Credit Limits | CreditLimit | ✅ **Implemented** |
| Enforcement | Check before save/edit | Implemented in `checkCreditLimitGate` | ✅ **Implemented** |
| Error | CREDIT_LIMIT_EXCEEDED | Implemented | ✅ **Implemented** |

### 3.5 Draft Persistence

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Requirement | Save drafts locally, keyed by user/draw | Implemented in user-app offlineQueue | ✅ **Implemented** |
| Expiry | 24 hours or draw close | **Logic not visible** | ⚠️ **Unclear** |

### 3.6 Copy/Paste Bulk Entry

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Requirement | Parse multi-line text entries | **MISSING** | ❌ **Not Implemented** |
| Validation | `POST /bills/validate-lines` | **MISSING** | ❌ **Not Implemented** |

---

## 4. Business Logic

### 4.1 Expansions

| Expansion | Specification | Implementation | Status |
|-----------|--------------|----------------|--------|
| 100 Macro | 10 numbers (000, 100, ..., 900) | `expand100Macro` in SalesService | ✅ **Implemented** |
| 111 Macro | 10 triples (000, 111, ..., 999) | `expand111Macro` in SalesService | ✅ **Implemented** |
| Box (BOXK) | All permutations | `generatePermutations` in SalesService | ✅ **Implemented** |
| Set | Uses series list | Implied via `series_config` | ⚠️ **Unclear** |
| ALL | Multiply by series_config.length | `applyAllMultiplier` in SalesService | ✅ **Implemented** |

**Impact**: Core expansion logic matches spec intent, though "Set" expansion details are unclear.

### 4.2 Settlement

| Aspect | Specification | Implementation | Status |
|--------|--------------|----------------|--------|
| Trigger | On result publish | Implemented in `/results/publish` | ✅ **Implemented** |
| Matching | Match exposures to result | Matches `bill_entries` directly | ⚠️ **Different** (no exposures table) |
| Payout | Based on scheme, is_super flag | Based on scheme payout_rate | ⚠️ **Partial** (no is_super) |
| Net Pay | payable - winnings | Calculated in reports | ⚠️ **Partial** |

**Impact**: Settlement works but doesn't follow spec's exposure-based approach. Cannot handle multiple prize positions.

---

## 5. Mobile App Architecture

### 5.1 Users App

| Feature | Specification | Implementation | Status |
|---------|--------------|----------------|--------|
| Login screen | Required | Placeholder exists | ⚠️ **Incomplete** |
| Draw selector | Show all draws with countdown | Placeholder exists | ⚠️ **Incomplete** |
| Sales entry | Full matrix with patterns | Placeholder exists | ⚠️ **Incomplete** |
| Offline queue | AsyncStorage with retry | Implemented (`offlineQueue.ts`) | ✅ **Implemented** |
| Reports | Multiple report screens | Placeholder exists | ⚠️ **Incomplete** |
| Rate master | Agents can edit assign_rate | **MISSING** | ❌ **Gap** |
| Blocked numbers view | Read-only list | **MISSING** | ❌ **Gap** |

### 5.2 Admin App

| Feature | Specification | Implementation | Status |
|---------|--------------|----------------|--------|
| User management | CRUD for users | **MISSING** | ❌ **Gap** |
| Ticket/Draw master | Configure draws and tickets | **MISSING** | ❌ **Gap** |
| Rate & schema | Define payout schemas | **MISSING** | ❌ **Gap** |
| Rate master | Assign rates hierarchically | **MISSING** | ❌ **Gap** |
| Exposure limits | Set global limits | **MISSING** | ❌ **Gap** |
| Blocked numbers | Add/remove blocks | **MISSING** | ❌ **Gap** |
| Result publish | Manual entry and publish | Placeholder exists | ⚠️ **Incomplete** |
| Credit limit master | Set credit limits | **MISSING** | ❌ **Gap** |
| Payments ledger | Record payments | **MISSING** | ❌ **Gap** |
| Reports | System-wide reports | Placeholder exists | ⚠️ **Incomplete** |

---

## 6. Critical Gaps Summary

### 6.1 Database Schema Gaps (Critical)

1. ❌ **Missing Tickets entity** - Cannot associate ticket types with draws
2. ❌ **Missing Rate Assignments table** - Cannot implement hierarchical rate assignment
3. ❌ **Missing Global Exposure Limits table** - Cannot enforce system-wide quantity limits
4. ❌ **Missing Exposures table** - Cannot store expanded entries for enforcement
5. ❌ **Missing parent_user_id in Users** - Cannot implement user hierarchy
6. ❌ **Missing permissions_json in Users** - Cannot implement granular permissions
7. ❌ **Missing bill_no in Bills** - No unique bill numbering system
8. ❌ **Missing soft delete fields in Bills** - Cannot track deletions

### 6.2 API Gaps (Critical)

1. ❌ **Missing `/tickets` endpoint** - Cannot list tickets for a draw
2. ❌ **Missing `/rates/my` endpoint** - Cannot get user's rates
3. ❌ **Missing `/bills/validate-line(s)` endpoints** - Cannot pre-validate entries
4. ❌ **Missing `/bills/{id}` PATCH/DELETE** - Cannot edit or delete bills
5. ❌ **Missing `/bills/by-no/{bill_no}` GET** - Cannot search by bill number
6. ❌ **Missing `/users` CRUD endpoints** - Cannot manage users
7. ❌ **Missing `/rates/assign` endpoint** - Cannot assign rates
8. ❌ **Missing `/limits/exposure` endpoint** - Cannot manage exposure limits
9. ❌ **Missing `/blocked` CRUD endpoints** - Cannot manage blocked numbers
10. ❌ **Missing `/payments` endpoint** - Cannot record payments

### 6.3 Business Logic Gaps (High Priority)

1. ❌ **Global exposure limit enforcement** - Cannot cap risk system-wide
2. ❌ **Per-ticket blocking** - Can only block by pattern, not by ticket
3. ❌ **Multi-position results** - Can only publish one winning number
4. ❌ **is_super flag in payout** - Cannot differentiate super payouts
5. ❌ **Bulk paste validation** - Cannot validate multiple lines at once
6. ❌ **Bill editing** - Cannot modify saved bills before close time
7. ❌ **Soft delete with audit** - Cannot track who deleted bills and when

### 6.4 Mobile App Gaps (High Priority)

1. ❌ **Rate master screens** - Cannot manage rates in app
2. ❌ **Blocked numbers view** - Cannot see blocked numbers
3. ❌ **Admin user management** - Cannot create/edit users
4. ❌ **Admin masters management** - Cannot configure draws, tickets, schemas
5. ❌ **Admin exposure limits** - Cannot set limits
6. ❌ **Admin blocked numbers** - Cannot manage blocks
7. ❌ **Payments ledger** - Cannot record settlements

---

## 7. Terminology Mapping

To bridge understanding between spec and implementation:

| Specification Term | Implementation Term | Notes |
|-------------------|-------------------|-------|
| Draw | Section | Same concept, different name |
| Ticket | TicketProduct / Scheme | Spec's "Ticket" is split across multiple tables |
| publish_time_local | draw_time_local | Same concept |
| close_offset_minutes | cutoff_offset_minutes | Same concept |
| Box | BOXK | Same concept |
| Set | ALL / series-based | Implemented differently |

---

## 8. Recommendations

### 8.1 Immediate Actions (Critical Path)

To align with the specification:

1. **Add User Hierarchy**
   - Add `parent_user_id` to Users table
   - Add `permissions_json` field
   - Update seed data to establish hierarchy

2. **Implement Tickets Entity**
   - Create Tickets table (id, name, draw_id, allowed_digit_modes)
   - Link to Draws (Sections)
   - Update sales flow to require ticket selection

3. **Add Rate Assignments**
   - Create RateAssignments table per spec
   - Implement hierarchical rate calculation
   - Add `/rates/assign` and `/rates/my` endpoints

4. **Add Exposure Limits**
   - Create GlobalExposureLimits table
   - Store expanded entries in Exposures table
   - Implement aggregation and enforcement logic
   - Add admin endpoints

5. **Enhance Bills**
   - Add `bill_no` generation (e.g., sequential per day)
   - Add soft delete fields (deleted_at, deleted_by)
   - Implement edit/delete endpoints with time gate

### 8.2 Medium Priority

6. **Enhance Result Publishing**
   - Support multiple winning positions
   - Add payload_json field
   - Implement is_super flag in payout calculation

7. **Add Missing Admin Endpoints**
   - User CRUD
   - Ticket CRUD
   - Blocked numbers CRUD
   - Payments endpoint

8. **Implement Validation Endpoints**
   - `/bills/validate-line`
   - `/bills/validate-lines`
   - Support bulk paste validation

### 8.3 Lower Priority (UX Enhancements)

9. **Per-Ticket Blocking**
   - Add ticket_id to BlockedNumber
   - Update enforcement logic

10. **Enhanced Audit Log**
    - Add module, request_id fields
    - Separate before_json and after_json
    - Implement request correlation

11. **Complete Mobile Apps**
    - Implement all placeholder screens
    - Add missing admin functions
    - Implement rate master screens

---

## 9. Alignment Score

Based on this analysis:

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Database Schema | 30% | 60% | 18% |
| Backend APIs | 30% | 55% | 16.5% |
| Business Logic | 20% | 70% | 14% |
| Mobile Apps | 20% | 30% | 6% |
| **Total** | **100%** | **-** | **54.5%** |

**Overall Assessment**: The implementation captures approximately **55% of the specification**. Core functionality exists but significant gaps remain in hierarchical features, exposure management, and admin capabilities.

---

## 10. Conclusion

The current implementation provides a **solid foundation** with:
- ✅ Core sales flow working
- ✅ Basic expansion logic implemented
- ✅ Authentication and authorization
- ✅ Some reporting functionality
- ✅ Offline queue architecture

However, it **diverges significantly** from the specification in:
- ❌ User hierarchy and rate assignment model
- ❌ Tickets entity and draw-ticket relationships
- ❌ Global exposure limit enforcement
- ❌ Multi-level rate/commission propagation
- ❌ Complete admin functionality

To fully implement the specification, the architectural gaps (user hierarchy, tickets, rate assignments, exposure limits) must be addressed first, followed by the API endpoints and mobile app screens.

**Estimated Effort to Full Spec Compliance**: 8-12 weeks of development work.

---

*Report compiled: 2026-01-01*  
*Basis: Project specification document vs. repository code at commit ae83e7a*
