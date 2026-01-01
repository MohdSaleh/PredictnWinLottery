# Critical Gaps Between Specification and Implementation

**Date**: 2026-01-01  
**Priority**: High - These gaps prevent full spec compliance

---

## Top 10 Critical Issues

### 1. ❌ Missing User Hierarchy (CRITICAL)

**Spec Requirement**: Users must have `parent_user_id` field to create a hierarchy (Stockist → Sub-Stockist → Agent → Sub-Agent).

**Current State**: Users table has no parent relationship field.

**Impact**: 
- Cannot implement down-line management
- Rate assignments cannot propagate through hierarchy
- Credit limit inheritance doesn't work
- Reporting by user tree is impossible

**Fix Required**:
```sql
ALTER TABLE users ADD COLUMN parent_user_id INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN permissions_json JSONB;
```

---

### 2. ❌ Missing Tickets Entity (CRITICAL)

**Spec Requirement**: A `Tickets` table that links ticket types (e.g., "LSK-SUPER", "BOXK", "LSK-A", "DEAR-A") to specific draws, with allowed_digit_modes.

**Current State**: No Tickets table. Implementation has:
- `TicketProduct` (just names like "SET", "ANY")
- `Scheme` (pricing/pattern info)
- But no draw-to-ticket association

**Impact**:
- Cannot enforce which tickets are allowed for which draws
- Cannot restrict digit modes per ticket
- API endpoint `/tickets?draw_id=...` cannot be implemented
- Sales validation cannot check if ticket is valid for the draw

**Fix Required**: Create new Tickets table and migrate existing data model.

---

### 3. ❌ Missing Rate Assignments Table (CRITICAL)

**Spec Requirement**: A `Rate Assignments` table with:
- upline_user_id
- downline_user_id  
- ticket_id
- base_rate (cost owed upward)
- assign_rate (price charged to next level)
- scope_section_id

**Current State**: Only `Scheme` table with flat base_price and payout_rate. No hierarchical rate assignment.

**Impact**:
- Cannot implement commission/rate propagation
- Each user cannot have different rates
- Net Pay calculation (base rate vs assign rate) is impossible
- Agents cannot set rates for their sub-agents
- Key business requirement completely missing

**Fix Required**: Create RateAssignments table and implement hierarchical rate logic.

---

### 4. ❌ Missing Global Exposure Limits (HIGH)

**Spec Requirement**: A `Global Exposure Limits` table to cap total quantity sold for a number across ALL users in a draw.

**Current State**: No such table or enforcement logic.

**Impact**:
- Cannot limit risk exposure system-wide
- A popular number could create unlimited liability
- Key risk management feature missing
- Error code `GLOBAL_LIMIT_REACHED` cannot be returned

**Fix Required**: 
1. Create GlobalExposureLimits table
2. Implement aggregation logic during bill save
3. Add enforcement gate

---

### 5. ❌ Missing Exposures Table (HIGH)

**Spec Requirement**: Store expanded entries in an `Exposures` table with columns:
- bill_id
- ticket_id
- draw_id
- digit_mode
- number_exact (expanded)
- qty
- flags_json

**Current State**: Expansions calculated on-the-fly, not persisted.

**Impact**:
- Cannot enforce global exposure limits (need to aggregate all exposures)
- Winning matching must re-expand entries every time
- Performance issues when calculating limits across all bills
- Audit trail of what was actually sold (after expansion) is missing

**Fix Required**: Create Exposures table and populate during bill save.

---

### 6. ❌ Missing Bill Number (MEDIUM-HIGH)

**Spec Requirement**: Bills must have a unique `bill_no` (string) that users can reference.

**Current State**: Bills only have auto-increment `id`. No human-readable bill number.

**Impact**:
- Users cannot search for "Bill #12345"
- API endpoint `/bills/by-no/{bill_no}` cannot work
- Agents cannot give customers a printable bill number
- Poor user experience

**Fix Required**: 
```sql
ALTER TABLE bills ADD COLUMN bill_no VARCHAR(50) UNIQUE;
-- Generate format: DRAW_CODE-YYYYMMDD-SEQNO
```

---

### 7. ❌ Missing Bill Edit/Delete with Soft Delete (MEDIUM-HIGH)

**Spec Requirement**: 
- `PATCH /bills/{bill_id}` - Edit bill before close time
- `DELETE /bills/{bill_id}` - Soft delete with deleted_at, deleted_by
- Status enum includes SAVED, DELETED

**Current State**: 
- No edit endpoint
- No delete endpoint  
- Status values are PENDING, SUBMITTED, CONFIRMED, CANCELLED (different semantics)
- No deleted_at or deleted_by fields

**Impact**:
- Agents cannot correct mistakes before close time
- No audit trail of deletions
- Cannot distinguish between "never submitted" and "deleted after save"

**Fix Required**: Add fields and implement edit/delete endpoints with time gate.

---

### 8. ❌ Missing Validation Endpoints (MEDIUM)

**Spec Requirement**:
- `POST /bills/validate-line` - Validate single line before adding
- `POST /bills/validate-lines` - Validate bulk paste lines

**Current State**: No validation endpoints. Validation only happens on full bill save.

**Impact**:
- User doesn't know if a number is blocked until they save entire bill
- Bulk paste cannot show which lines are invalid
- Poor UX - errors discovered too late
- Cannot implement real-time validation as user types

**Fix Required**: Extract validation logic from `create_bill` into separate endpoints.

---

### 9. ❌ Missing Admin Endpoints (MEDIUM)

**Spec Requirement**: Admin endpoints for:
- `POST/PUT/GET /users` - User management
- `POST/PUT /tickets` - Ticket management
- `POST /rates/assign` - Rate assignment
- `POST /limits/exposure` - Exposure limits management
- `POST /blocked` - Blocked numbers management
- `POST /payments` - Payments ledger

**Current State**: Most admin endpoints missing. Only result publish/revoke exists.

**Impact**:
- Admin app cannot function
- All configuration must be done via database directly
- No way to manage system through UI
- Admin features are unusable

**Fix Required**: Implement all missing admin endpoints with role-based access.

---

### 10. ❌ Missing Multi-Position Results (MEDIUM)

**Spec Requirement**: Results should have `payload_json` with multiple winning positions and prize tiers.

**Current State**: Results only have single `winning_number` field.

**Impact**:
- Cannot publish results with 1st, 2nd, 3rd place winners
- Cannot implement different payout rates per position
- `is_super` flag in payout schema cannot be used
- Simplified to single winner only

**Fix Required**: 
```sql
ALTER TABLE results ADD COLUMN payload_json JSONB;
-- Format: {"positions": [{"rank": 1, "number": "123", "is_super": true}, ...]}
```

---

## Additional Important Gaps

### 11. Missing timezone field in Draws
Spec requires explicit timezone. Implementation assumes server timezone.

### 12. Primary keys are Int instead of UUID
Spec uses UUID for all primary keys. Implementation uses auto-increment Int.

### 13. Missing permissions_json in Users
Cannot implement granular permissions like `allowCreateSubagent`.

### 14. Missing audit log details
Spec requires module, request_id, before_json, after_json. Current audit log is simplified.

### 15. Missing /rates/my endpoint
Users cannot retrieve their assigned rates.

### 16. Different bill status semantics
Spec: SAVED, DELETED. Implementation: PENDING, SUBMITTED, CONFIRMED, CANCELLED.

---

## Impact Summary by Stakeholder

### For Agents (Users App):
- ❌ Cannot manage sub-agents' rates
- ❌ Cannot validate entries before saving
- ❌ Cannot edit or delete bills
- ❌ Cannot search by bill number
- ❌ Poor error feedback (no pre-validation)

### For Admin (Admin App):
- ❌ Cannot create/manage users
- ❌ Cannot configure tickets per draw
- ❌ Cannot assign rates hierarchically
- ❌ Cannot set exposure limits
- ❌ Cannot manage blocked numbers
- ❌ Most admin functions unusable

### For Business:
- ❌ No risk management (exposure limits)
- ❌ No hierarchical commission model
- ❌ No multi-level rate assignment
- ❌ Limited reporting capabilities
- ❌ Cannot track user hierarchy

---

## Recommended Fix Priority

### Phase 1 (Must Have - 3-4 weeks):
1. Add user hierarchy (parent_user_id)
2. Create Tickets table and link to draws
3. Create RateAssignments table
4. Add bill_no generation
5. Add soft delete to bills

### Phase 2 (Critical Business Logic - 2-3 weeks):
6. Create GlobalExposureLimits table
7. Create Exposures table
8. Implement validation endpoints
9. Add edit/delete bill endpoints

### Phase 3 (Admin Functionality - 2-3 weeks):
10. Implement all admin endpoints
11. Add multi-position results
12. Enhance audit logging

### Phase 4 (Polish - 1-2 weeks):
13. Add timezone support
14. Migrate to UUIDs (if critical)
15. Add permissions_json
16. Complete mobile app screens

**Total Estimated Effort**: 8-12 weeks

---

## Quick Win Recommendations

If full spec compliance is not immediately required, focus on these quick wins:

1. **Add bill_no** (1 day) - Improves UX significantly
2. **Add validation endpoints** (2-3 days) - Better error feedback
3. **Add soft delete** (1 day) - Audit trail for deletions
4. **Implement edit/delete bills** (2-3 days) - Critical for agents
5. **Add user hierarchy fields** (1 day) - Foundation for future work

These 5 items (1 week of work) would address the most painful user-facing gaps without major architectural changes.

---

*Document prepared: 2026-01-01*  
*For questions or clarifications, refer to SPEC_VS_IMPLEMENTATION_ANALYSIS.md*
