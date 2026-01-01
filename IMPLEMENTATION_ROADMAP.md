# Implementation Roadmap: Aligning with Project Specification

**Date**: 2026-01-01  
**Purpose**: Phased approach to achieve full spec compliance  
**Current Compliance**: ~55%  
**Target**: 100%

---

## Overview

This roadmap provides a detailed, phased approach to align the current implementation with the project specification. Each phase builds on the previous one and can be deployed independently.

---

## Phase 1: Foundation & Critical Data Model (Week 1-2)

**Goal**: Fix core database schema gaps that block all other features.

### 1.1 Add User Hierarchy Support

**Database Changes**:
```prisma
model User {
  // ... existing fields ...
  parent_user_id    Int?     // Parent in hierarchy
  permissions_json  Json?    // Granular permissions
  
  // Relations
  parent            User?    @relation("UserHierarchy", fields: [parent_user_id], references: [id])
  children          User[]   @relation("UserHierarchy")
}
```

**Migration**:
```sql
ALTER TABLE users ADD COLUMN parent_user_id INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN permissions_json JSONB;
CREATE INDEX idx_users_parent ON users(parent_user_id);
```

**Seed Data Update**:
- Link agent1 to admin as parent
- Add permissions: `{"allowCreateSubagent": true, "canEditRates": false, "canEditCredit": false}`

**Validation**: Query user tree: `SELECT * FROM users WHERE parent_user_id = 1`

---

### 1.2 Create Tickets Entity

**Database Changes**:
```prisma
model Ticket {
  id                  Int       @id @default(autoincrement())
  name                String    // "LSK-SUPER", "BOXK", "LSK-A", "DEAR-A"
  draw_id             Int       // Link to Draw (Section)
  allowed_digit_modes Json      // [1, 2, 3]
  is_active           Boolean   @default(true)
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt
  
  // Relations
  draw                Section   @relation(fields: [draw_id], references: [id])
  rate_assignments    RateAssignment[]
  blocked_numbers     BlockedNumber[]
  
  @@unique([draw_id, name])
  @@map("tickets")
}
```

**Migration**:
```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  draw_id INTEGER NOT NULL REFERENCES sections(id),
  allowed_digit_modes JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(draw_id, name)
);
```

**Seed Data**:
```typescript
// For each section (draw), create tickets
const tickets = [
  { name: "LSK-SUPER", draw_id: 2, allowed_digit_modes: [1, 2, 3] }, // LSK 3PM
  { name: "LSK-A", draw_id: 2, allowed_digit_modes: [3] },
  { name: "DEAR-A", draw_id: 1, allowed_digit_modes: [1, 2, 3] },    // DEAR 1PM
  { name: "BOXK", draw_id: 1, allowed_digit_modes: [2, 3] },
  // ... repeat for all 4 draws
];
```

**API Endpoint**:
```typescript
// GET /api/v1/tickets?draw_id=X
router.get('/tickets', authMiddleware, async (req, res) => {
  const draw_id = parseInt(req.query.draw_id as string);
  const tickets = await prisma.ticket.findMany({
    where: { draw_id, is_active: true }
  });
  return res.json(successResponse({ tickets }));
});
```

**Validation**: `curl http://localhost:3002/api/v1/tickets?draw_id=1`

---

### 1.3 Create Rate Assignments Table

**Database Changes**:
```prisma
model RateAssignment {
  id                          Int       @id @default(autoincrement())
  upline_user_id              Int       // Parent user
  downline_user_id            Int       // Child user
  ticket_id                   Int       // Specific ticket
  base_rate                   Decimal   @db.Decimal(10, 2)  // Cost to upline
  assign_rate                 Decimal   @db.Decimal(10, 2)  // Price to downline
  scope_section_id            Int?      // Null = all sections
  applies_to_all_related      Boolean   @default(false)
  is_active                   Boolean   @default(true)
  created_at                  DateTime  @default(now())
  updated_at                  DateTime  @updatedAt
  
  // Relations
  upline                      User      @relation("UplineRates", fields: [upline_user_id], references: [id])
  downline                    User      @relation("DownlineRates", fields: [downline_user_id], references: [id])
  ticket                      Ticket    @relation(fields: [ticket_id], references: [id])
  section                     Section?  @relation(fields: [scope_section_id], references: [id])
  
  @@unique([upline_user_id, downline_user_id, ticket_id, scope_section_id])
  @@map("rate_assignments")
}
```

**Migration**:
```sql
CREATE TABLE rate_assignments (
  id SERIAL PRIMARY KEY,
  upline_user_id INTEGER NOT NULL REFERENCES users(id),
  downline_user_id INTEGER NOT NULL REFERENCES users(id),
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  base_rate DECIMAL(10,2) NOT NULL,
  assign_rate DECIMAL(10,2) NOT NULL,
  scope_section_id INTEGER REFERENCES sections(id),
  applies_to_all_related BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(upline_user_id, downline_user_id, ticket_id, scope_section_id)
);
CREATE INDEX idx_rate_assignments_downline ON rate_assignments(downline_user_id);
```

**Seed Data**:
```typescript
// Admin assigns rates to agent1
const rateAssignments = [
  {
    upline_user_id: 1, // admin
    downline_user_id: 2, // agent1
    ticket_id: 1,
    base_rate: 10.00,      // Agent pays 10 to admin
    assign_rate: 12.00,    // Agent charges 12 to customers
    scope_section_id: null // All sections
  }
];
```

**API Endpoint**:
```typescript
// GET /api/v1/rates/my?draw_id=X&ticket_id=Y
router.get('/rates/my', authMiddleware, async (req, res) => {
  const user_id = req.user!.id;
  const draw_id = req.query.draw_id ? parseInt(req.query.draw_id as string) : undefined;
  const ticket_id = req.query.ticket_id ? parseInt(req.query.ticket_id as string) : undefined;
  
  const rates = await prisma.rateAssignment.findMany({
    where: {
      downline_user_id: user_id,
      ...(ticket_id && { ticket_id }),
      ...(draw_id && { scope_section_id: draw_id }),
      is_active: true
    },
    include: { ticket: true, section: true }
  });
  
  return res.json(successResponse({ rates }));
});
```

**Validation**: User can retrieve their rates per ticket and draw.

---

### 1.4 Add Bill Number Generation

**Database Changes**:
```prisma
model Bill {
  // ... existing fields ...
  bill_no           String?   @unique  // "LSK_3PM-20260101-001"
  deleted_at        DateTime?
  deleted_by        Int?
  
  // Relations
  deleter           User?     @relation("BillDeleter", fields: [deleted_by], references: [id])
}
```

**Migration**:
```sql
ALTER TABLE bills ADD COLUMN bill_no VARCHAR(100) UNIQUE;
ALTER TABLE bills ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE bills ADD COLUMN deleted_by INTEGER REFERENCES users(id);
CREATE INDEX idx_bills_bill_no ON bills(bill_no);
```

**Bill Number Generation Logic**:
```typescript
// Format: SECTION_CODE-YYYYMMDD-SEQUENCE
async function generateBillNo(section_id: number, date: Date): Promise<string> {
  const section = await prisma.section.findUnique({ where: { id: section_id } });
  const dateStr = format(date, 'yyyyMMdd');
  
  // Get last bill for this section and date
  const lastBill = await prisma.bill.findFirst({
    where: {
      section_id,
      date,
      bill_no: { not: null }
    },
    orderBy: { bill_no: 'desc' }
  });
  
  let sequence = 1;
  if (lastBill?.bill_no) {
    const parts = lastBill.bill_no.split('-');
    sequence = parseInt(parts[2] || '0') + 1;
  }
  
  return `${section.code}-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}
```

**Update Sales Service**:
```typescript
// In create_bill
const bill_no = await generateBillNo(section_id, date);
const bill = await tx.bill.create({
  data: {
    bill_no,
    // ... other fields
  }
});
```

**API Endpoint**:
```typescript
// GET /api/v1/bills/by-no/:bill_no
router.get('/by-no/:bill_no', authMiddleware, async (req, res) => {
  const bill = await prisma.bill.findUnique({
    where: { bill_no: req.params.bill_no },
    include: { entries: true, user: true, section: true }
  });
  
  if (!bill) {
    return res.status(404).json(
      errorResponse(ErrorCodes.NOT_FOUND, 'Bill not found')
    );
  }
  
  return res.json(successResponse({ bill }));
});
```

**Validation**: Bills have unique, readable numbers like "LSK_3PM-20260101-001".

---

## Phase 2: Business Logic & Enforcement (Week 3-4)

**Goal**: Implement critical business rules for risk management.

### 2.1 Create Global Exposure Limits

**Database Changes**:
```prisma
enum AggregationMode {
  WITH_TICKET_NAME
  WITHOUT_TICKET_NAME
}

model GlobalExposureLimit {
  id                Int              @id @default(autoincrement())
  draw_id           Int
  digit_mode        Int              // 1, 2, or 3
  number_exact      String           // Zero-padded
  limit_qty         Int              // Max quantity
  aggregation_mode  AggregationMode
  is_active         Boolean          @default(true)
  created_at        DateTime         @default(now())
  updated_at        DateTime         @updatedAt
  
  // Relations
  draw              Section          @relation(fields: [draw_id], references: [id])
  
  @@unique([draw_id, digit_mode, number_exact, aggregation_mode])
  @@map("global_exposure_limits")
}
```

**Enforcement Logic**:
```typescript
async checkGlobalExposureLimit(
  draw_id: number,
  ticket_id: number,
  digit_mode: number,
  number: string,
  qty: number,
  aggregation_mode: string
): Promise<void> {
  // Get limit
  const limit = await prisma.globalExposureLimit.findFirst({
    where: {
      draw_id,
      digit_mode,
      number_exact: number,
      aggregation_mode,
      is_active: true
    }
  });
  
  if (!limit) return; // No limit set
  
  // Calculate current exposure
  let currentQty = 0;
  if (aggregation_mode === 'WITH_TICKET_NAME') {
    currentQty = await prisma.exposure.aggregate({
      where: { draw_id, digit_mode, number_exact: number, ticket_id },
      _sum: { qty: true }
    })._sum.qty || 0;
  } else {
    currentQty = await prisma.exposure.aggregate({
      where: { draw_id, digit_mode, number_exact: number },
      _sum: { qty: true }
    })._sum.qty || 0;
  }
  
  if (currentQty + qty > limit.limit_qty) {
    throw new Error(
      `GLOBAL_LIMIT_REACHED: Number ${number} has reached exposure limit ` +
      `(${currentQty}/${limit.limit_qty}, trying to add ${qty})`
    );
  }
}
```

**Admin API**:
```typescript
// POST /api/v1/limits/exposure
router.post('/limits/exposure', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { draw_id, digit_mode, number_exact, limit_qty, aggregation_mode } = req.body;
  
  const limit = await prisma.globalExposureLimit.create({
    data: { draw_id, digit_mode, number_exact, limit_qty, aggregation_mode }
  });
  
  return res.json(successResponse({ limit }));
});

// GET /api/v1/limits/exposure?draw_id=X
router.get('/limits/exposure', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const draw_id = parseInt(req.query.draw_id as string);
  const limits = await prisma.globalExposureLimit.findMany({
    where: { draw_id, is_active: true }
  });
  return res.json(successResponse({ limits }));
});
```

---

### 2.2 Create Exposures Table

**Database Changes**:
```prisma
model Exposure {
  id            Int       @id @default(autoincrement())
  bill_id       Int
  ticket_id     Int
  draw_id       Int
  digit_mode    Int
  number_exact  String    // Expanded number (zero-padded)
  qty           Int
  flags_json    Json?     // Inherited flags
  created_at    DateTime  @default(now())
  
  // Relations
  bill          Bill      @relation(fields: [bill_id], references: [id], onDelete: Cascade)
  ticket        Ticket    @relation(fields: [ticket_id], references: [id])
  draw          Section   @relation(fields: [draw_id], references: [id])
  
  @@index([bill_id])
  @@index([draw_id, digit_mode, number_exact])
  @@index([draw_id, ticket_id, digit_mode, number_exact])
  @@map("exposures")
}
```

**Population Logic**:
```typescript
// In create_bill, after creating BillEntry
async function createExposures(
  tx: PrismaTransaction,
  bill_id: number,
  ticket_id: number,
  draw_id: number,
  entry: BillEntryInput
): Promise<void> {
  const expandedNumbers = expandEntry(entry); // Returns string[]
  
  for (const number of expandedNumbers) {
    await tx.exposure.create({
      data: {
        bill_id,
        ticket_id,
        draw_id,
        digit_mode: entry.number.length,
        number_exact: number.padStart(entry.number.length, '0'),
        qty: entry.quantity,
        flags_json: {
          use_100_macro: entry.use_100_macro,
          use_111_macro: entry.use_111_macro,
          use_boxk: entry.use_boxk,
          use_all: entry.use_all
        }
      }
    });
  }
}
```

**Update Sales Service**: Call `createExposures` after creating bill entries, before exposure limit check.

---

### 2.3 Implement Validation Endpoints

**Single Line Validation**:
```typescript
// POST /api/v1/bills/validate-line
router.post('/validate-line', authMiddleware, async (req, res) => {
  try {
    const { section_id, date, ticket_id, digit_len, entry } = req.body;
    const user_id = req.user!.id;
    
    // Run all gates
    const section = await prisma.section.findUnique({ where: { id: section_id } });
    await salesService.checkCutoffGate(section, new Date(date));
    await salesService.checkTicketAssignmentGate(user_id, section_id, new Date(date), digit_len);
    await salesService.checkNumberBlockingGate(section_id, new Date(date), digit_len, [entry]);
    
    // Expand entry
    const expanded = expandEntry(entry);
    
    // Return validation result
    return res.json(successResponse({
      valid: true,
      expanded_count: expanded.length,
      expanded_numbers: expanded,
      total_amount: entry.stake_per_unit * expanded.length
    }));
    
  } catch (error: any) {
    return res.status(400).json(
      errorResponse(error.message.split(':')[0], error.message)
    );
  }
});
```

**Bulk Lines Validation**:
```typescript
// POST /api/v1/bills/validate-lines
router.post('/validate-lines', authMiddleware, async (req, res) => {
  const { section_id, date, ticket_id, digit_len, entries } = req.body;
  const user_id = req.user!.id;
  
  const results = [];
  for (let i = 0; i < entries.length; i++) {
    try {
      // Validate each line
      const section = await prisma.section.findUnique({ where: { id: section_id } });
      await salesService.checkCutoffGate(section, new Date(date));
      await salesService.checkTicketAssignmentGate(user_id, section_id, new Date(date), digit_len);
      await salesService.checkNumberBlockingGate(section_id, new Date(date), digit_len, [entries[i]]);
      
      const expanded = expandEntry(entries[i]);
      
      results.push({
        index: i,
        valid: true,
        expanded_count: expanded.length,
        total_amount: entries[i].stake_per_unit * expanded.length
      });
      
    } catch (error: any) {
      results.push({
        index: i,
        valid: false,
        error: error.message
      });
    }
  }
  
  return res.json(successResponse({ results }));
});
```

---

### 2.4 Implement Edit/Delete Bills

**Edit Bill**:
```typescript
// PATCH /api/v1/bills/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  const bill_id = parseInt(req.params.id);
  const { entries } = req.body;
  const user_id = req.user!.id;
  
  // Get existing bill
  const existingBill = await prisma.bill.findUnique({
    where: { id: bill_id },
    include: { section: true }
  });
  
  if (!existingBill) {
    return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Bill not found'));
  }
  
  if (existingBill.user_id !== user_id) {
    return res.status(403).json(errorResponse(ErrorCodes.FORBIDDEN, 'Not your bill'));
  }
  
  // Check cutoff gate
  await salesService.checkCutoffGate(existingBill.section, existingBill.date);
  
  // Delete old entries and exposures
  await prisma.$transaction(async (tx) => {
    await tx.billEntry.deleteMany({ where: { bill_id } });
    await tx.exposure.deleteMany({ where: { bill_id } });
    
    // Create new entries (same logic as create_bill)
    // ... (re-use creation logic)
  });
  
  return res.json(successResponse({ message: 'Bill updated' }));
});
```

**Delete Bill (Soft Delete)**:
```typescript
// DELETE /api/v1/bills/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const bill_id = parseInt(req.params.id);
  const user_id = req.user!.id;
  
  const existingBill = await prisma.bill.findUnique({
    where: { id: bill_id },
    include: { section: true }
  });
  
  if (!existingBill) {
    return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Bill not found'));
  }
  
  if (existingBill.user_id !== user_id) {
    return res.status(403).json(errorResponse(ErrorCodes.FORBIDDEN, 'Not your bill'));
  }
  
  // Check cutoff gate
  await salesService.checkCutoffGate(existingBill.section, existingBill.date);
  
  // Soft delete
  await prisma.bill.update({
    where: { id: bill_id },
    data: {
      status: 'CANCELLED', // or add DELETED status
      deleted_at: new Date(),
      deleted_by: user_id
    }
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      actor_id: user_id,
      action: 'DELETE_BILL',
      entity: 'Bill',
      entity_id: bill_id,
      payload: { bill_no: existingBill.bill_no }
    }
  });
  
  return res.json(successResponse({ message: 'Bill deleted' }));
});
```

---

## Phase 3: Admin Functionality (Week 5-6)

**Goal**: Enable full admin control through APIs.

### 3.1 User Management

```typescript
// POST /api/v1/users (Create user)
router.post('/users', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { username, password, name, email, phone, role, parent_user_id, permissions_json } = req.body;
  
  const password_hash = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      username,
      password_hash,
      name,
      email,
      phone,
      role,
      parent_user_id,
      permissions_json
    }
  });
  
  return res.json(successResponse({ user }));
});

// PUT /api/v1/users/:id (Update user)
router.put('/users/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const user_id = parseInt(req.params.id);
  const updates = req.body;
  
  if (updates.password) {
    updates.password_hash = await bcrypt.hash(updates.password, 10);
    delete updates.password;
  }
  
  const user = await prisma.user.update({
    where: { id: user_id },
    data: updates
  });
  
  return res.json(successResponse({ user }));
});

// GET /api/v1/users?parent_id=X&role=Y
router.get('/users', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const parent_id = req.query.parent_id ? parseInt(req.query.parent_id as string) : undefined;
  const role = req.query.role as string | undefined;
  
  const users = await prisma.user.findMany({
    where: {
      ...(parent_id && { parent_user_id: parent_id }),
      ...(role && { role })
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      parent_user_id: true,
      permissions_json: true,
      is_active: true
    }
  });
  
  return res.json(successResponse({ users }));
});
```

### 3.2 Ticket Management

```typescript
// POST /api/v1/tickets (Create ticket)
router.post('/tickets', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, draw_id, allowed_digit_modes } = req.body;
  
  const ticket = await prisma.ticket.create({
    data: { name, draw_id, allowed_digit_modes }
  });
  
  return res.json(successResponse({ ticket }));
});

// PUT /api/v1/tickets/:id (Update ticket)
router.put('/tickets/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const ticket_id = parseInt(req.params.id);
  const updates = req.body;
  
  const ticket = await prisma.ticket.update({
    where: { id: ticket_id },
    data: updates
  });
  
  return res.json(successResponse({ ticket }));
});
```

### 3.3 Rate Assignment Management

```typescript
// POST /api/v1/rates/assign (Assign rates)
router.post('/rates/assign', authMiddleware, async (req, res) => {
  const actor_id = req.user!.id;
  const actor_role = req.user!.role;
  const {
    upline_user_id,
    downline_user_id,
    ticket_id,
    base_rate,
    assign_rate,
    scope_section_id
  } = req.body;
  
  // Authorization: Only ADMIN or the upline user can assign rates
  if (actor_role !== 'ADMIN' && actor_id !== upline_user_id) {
    return res.status(403).json(
      errorResponse(ErrorCodes.FORBIDDEN, 'Cannot assign rates for other users')
    );
  }
  
  const rateAssignment = await prisma.rateAssignment.create({
    data: {
      upline_user_id,
      downline_user_id,
      ticket_id,
      base_rate,
      assign_rate,
      scope_section_id
    }
  });
  
  return res.json(successResponse({ rateAssignment }));
});

// GET /api/v1/rates/assignments?downline_user_id=X
router.get('/rates/assignments', authMiddleware, async (req, res) => {
  const downline_user_id = req.query.downline_user_id 
    ? parseInt(req.query.downline_user_id as string) 
    : req.user!.id;
  
  const assignments = await prisma.rateAssignment.findMany({
    where: { downline_user_id, is_active: true },
    include: { ticket: true, section: true }
  });
  
  return res.json(successResponse({ assignments }));
});
```

### 3.4 Blocked Numbers Management

```typescript
// POST /api/v1/blocked (Add blocked number)
router.post('/blocked', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { draw_id, digit_mode, ticket_id, number_pattern, reason } = req.body;
  
  const blocked = await prisma.blockedNumber.create({
    data: {
      pattern: number_pattern,
      section_id: draw_id,
      group_id: digit_mode, // Map digit_mode to game_group
      is_active: true
    }
  });
  
  return res.json(successResponse({ blocked }));
});

// GET /api/v1/blocked?draw_id=X
router.get('/blocked', authMiddleware, async (req, res) => {
  const draw_id = req.query.draw_id ? parseInt(req.query.draw_id as string) : undefined;
  
  const blocked = await prisma.blockedNumber.findMany({
    where: {
      ...(draw_id && { section_id: draw_id }),
      is_active: true
    }
  });
  
  return res.json(successResponse({ blocked }));
});

// DELETE /api/v1/blocked/:id (Remove block)
router.delete('/blocked/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);
  
  await prisma.blockedNumber.update({
    where: { id },
    data: { is_active: false }
  });
  
  return res.json(successResponse({ message: 'Block removed' }));
});
```

### 3.5 Payments Ledger

```typescript
// POST /api/v1/payments (Record payment)
router.post('/payments', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { user_id, amount, description, reference } = req.body;
  
  const payment = await prisma.ledger.create({
    data: {
      user_id,
      type: 'CREDIT',
      amount,
      description,
      reference
    }
  });
  
  // Update user's credit limit used_amount
  await prisma.creditLimit.update({
    where: { user_id },
    data: {
      used_amount: {
        decrement: amount
      }
    }
  });
  
  return res.json(successResponse({ payment }));
});

// GET /api/v1/payments?user_id=X
router.get('/payments', authMiddleware, async (req, res) => {
  const user_id = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;
  
  const payments = await prisma.ledger.findMany({
    where: {
      ...(user_id && { user_id }),
      type: { in: ['CREDIT', 'SETTLEMENT'] }
    },
    orderBy: { created_at: 'desc' }
  });
  
  return res.json(successResponse({ payments }));
});
```

---

## Phase 4: Enhanced Features (Week 7-8)

### 4.1 Multi-Position Results

**Update Results Schema**:
```prisma
model Result {
  // ... existing fields ...
  payload_json      Json?     // {"positions": [{rank: 1, number: "123", is_super: true}]}
}
```

**Enhanced Publish Logic**:
```typescript
// POST /api/v1/results/publish
// Body: { section_id, date, positions: [{rank: 1, number: "123", is_super: true}] }
router.post('/publish', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { section_id, date, positions } = req.body;
  const published_by = req.user!.id;
  
  await prisma.$transaction(async (tx) => {
    // Create result with payload
    const result = await tx.result.create({
      data: {
        section_id,
        date,
        winning_number: positions[0].number, // Primary winner
        payload_json: { positions },
        published_by
      }
    });
    
    // Calculate winnings for each position
    for (const position of positions) {
      const matchingExposures = await tx.exposure.findMany({
        where: {
          draw_id: section_id,
          number_exact: position.number
        },
        include: { bill: true }
      });
      
      for (const exposure of matchingExposures) {
        // Get scheme (consider is_super flag)
        const scheme = await getSchemeForPosition(position.rank, position.is_super);
        const winningAmount = Number(exposure.qty) * Number(scheme.payout_rate);
        
        await tx.winning.create({
          data: {
            bill_entry_id: exposure.bill_id, // Link properly
            amount: winningAmount,
            status: 'PENDING'
          }
        });
      }
    }
  });
  
  return res.json(successResponse({ message: 'Result published' }));
});
```

### 4.2 Enhanced Audit Logging

**Update Audit Schema**:
```prisma
model AuditLog {
  // ... existing fields ...
  module        String?   // "SALE", "RATE_MASTER", "RESULT"
  request_id    String?   // UUID for request correlation
  before_json   Json?     // Snapshot before
  after_json    Json?     // Snapshot after
}
```

**Helper Function**:
```typescript
async function createAuditLog(
  actor_id: number,
  module: string,
  action: string,
  entity: string,
  entity_id: number,
  before: any,
  after: any,
  request_id: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actor_id,
      module,
      action,
      entity,
      entity_id,
      request_id,
      before_json: before,
      after_json: after
    }
  });
}
```

### 4.3 Timezone Support

**Update Sections Schema**:
```prisma
model Section {
  // ... existing fields ...
  timezone      String    @default("UTC")  // e.g., "Asia/Kolkata"
}
```

**Update Time Gate Logic**:
```typescript
import { DateTime } from 'luxon';

async function checkCutoffGate(section: Section, date: Date): Promise<void> {
  const drawDateTime = DateTime.fromISO(`${date.toISOString().split('T')[0]}T${section.draw_time_local}`, {
    zone: section.timezone
  });
  
  const cutoffDateTime = drawDateTime.minus({ minutes: section.cutoff_offset_minutes });
  const nowDateTime = DateTime.now().setZone(section.timezone);
  
  if (nowDateTime > cutoffDateTime) {
    throw new Error(`SALES_CLOSED: Sales closed at ${cutoffDateTime.toFormat('h:mm a')}`);
  }
}
```

---

## Phase 5: Mobile App Completion (Week 9-10)

### 5.1 Users App Screens

**Implement**:
1. Login screen with JWT storage
2. Home screen with 4 sections and countdown
3. Sales entry screen with all pattern toggles
4. Bill search by number
5. Bill edit/delete functionality
6. Reports screens (sales, winning, net-pay)
7. Rate master screen (view only for agents)
8. Blocked numbers view

### 5.2 Admin App Screens

**Implement**:
1. Login with admin role guard
2. Dashboard overview
3. User management (CRUD)
4. Ticket management
5. Rate & schema management
6. Rate assignment interface
7. Exposure limits management
8. Blocked numbers management
9. Result publish screen (multi-position)
10. Payments ledger
11. Reports (system-wide)

---

## Testing & Validation

### Unit Tests
- Test all new services (rate calculation, exposure aggregation)
- Test expansion algorithms with edge cases
- Test validation logic

### Integration Tests
- Test complete bill creation flow with all gates
- Test result publish and settlement
- Test hierarchical rate assignment

### End-to-End Tests
- Run all scenarios from spec (END_TO_END_TEST.md)
- Verify UI parity with reference screenshots
- Test offline queue with network failures

---

## Deployment Checklist

- [ ] All database migrations applied
- [ ] Seed data updated with new entities
- [ ] All API endpoints documented
- [ ] All tests passing
- [ ] Backend deployed and healthy
- [ ] User app APK built and tested
- [ ] Admin app APK built and tested
- [ ] Production environment configured

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Spec compliance | 100% |
| API endpoint coverage | 100% of spec |
| Business rule enforcement | All gates + limits |
| Mobile app feature completeness | All screens functional |
| Test coverage | >80% |
| Zero breaking changes | Backward compatible |

---

## Timeline Summary

| Phase | Duration | Cumulative | Completion |
|-------|----------|------------|------------|
| Phase 1: Foundation | 2 weeks | 2 weeks | 20% → 40% |
| Phase 2: Business Logic | 2 weeks | 4 weeks | 40% → 65% |
| Phase 3: Admin APIs | 2 weeks | 6 weeks | 65% → 85% |
| Phase 4: Enhanced Features | 2 weeks | 8 weeks | 85% → 95% |
| Phase 5: Mobile Apps | 2 weeks | 10 weeks | 95% → 100% |

**Total: 10 weeks (2.5 months)**

---

*Roadmap created: 2026-01-01*  
*For questions, refer to SPEC_VS_IMPLEMENTATION_ANALYSIS.md and CRITICAL_GAPS_SUMMARY.md*
