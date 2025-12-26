# Remaining Work - Implementation Roadmap
Date: 2025-12-26

## Current Status: 46% Complete

### ✅ Completed (46%)
- M0: Repository Skeleton (5%)
- M1: Spec Lock (10%)
- M2: Database + Seed (15%)
- M3: Backend APIs (20%) - **FULLY FUNCTIONAL**

### 🔨 Remaining (54%)
- M4: User/Agent App (20%)
- M5: Admin App (15%)
- M6: Reports (10%)
- M7: QA + Release (5%)
- M8: Additional features (4%)

---

## M4: User/Agent Mobile App (20% - Priority 1)

### Core Implementation Steps

#### 1. Setup Dependencies
```bash
cd apps/user-app
npm install @react-navigation/native @react-navigation/stack @react-navigation/drawer
npm install react-native-screens react-native-safe-area-context
npm install axios @react-native-async-storage/async-storage
npm install react-native-vector-icons
```

#### 2. Project Structure
```
apps/user-app/
├── src/
│   ├── api/
│   │   └── client.ts          # Axios instance with auth
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SalesEntryScreen.tsx
│   │   ├── OfflineQueueScreen.tsx
│   │   └── ReportsScreen.tsx
│   ├── components/
│   │   ├── SectionCard.tsx
│   │   ├── SalesEntryForm.tsx
│   │   └── CountdownTimer.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── DrawerNavigator.tsx
│   ├── store/
│   │   └── offlineQueue.ts    # Local storage for offline bills
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── utils/
│       ├── colors.ts          # UI colors (#AA292E, #F19826, #C61111)
│       └── storage.ts         # AsyncStorage helpers
```

#### 3. Key Screens Implementation

**LoginScreen.tsx**
- Username/password inputs
- JWT token storage in AsyncStorage
- Navigate to Home on success
- Use colors from UI_STYLE_GUIDE.md

**HomeScreen.tsx (Choose Section)**
- Display 4 sections from `/api/v1/sections/active`
- Show countdown timers (draw_time - cutoff_offset_minutes)
- Cards with section name, draw time
- Navigate to Sales Entry on card tap

**SalesEntryScreen.tsx (Most Complex)**
- Header: Section name, countdown, stats (COUNT / Rs / TIME)
- Tabs: 1 Digit / 2 Digit / 3 Digit
- Dropdowns: Group, Book (from `/api/v1/sales-groups`, `/api/v1/sales-sub-groups`)
- Number input with validation
- Toggles: Any/Set, 100, 111, Qty, BOXK, ALL
- Cart list showing entries
- Total count and amount display
- Submit button calls `/api/v1/sales/create_bill`
- On network error: save to offline queue
- Success: show toast and clear form

**OfflineQueueScreen.tsx**
- List bills from AsyncStorage with status
- Retry single bill button
- Retry all bills button
- Clear all button
- Upload with `/api/v1/sales/create_bill`
- Remove from queue on success

#### 4. Offline Queue Implementation

```typescript
// store/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_bills_queue';

export interface OfflineBill {
  id: string;
  section_id: number;
  date: string;
  entries: any[];
  timestamp: number;
}

export async function addToQueue(bill: OfflineBill) {
  const queue = await getQueue();
  queue.push(bill);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<OfflineBill[]> {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function removeFromQueue(id: string) {
  const queue = await getQueue();
  const filtered = queue.filter(b => b.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}
```

#### 5. API Client Setup

```typescript
// api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3002/api/v1'; // Change for production

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

#### 6. Colors Configuration

```typescript
// utils/colors.ts
export const COLORS = {
  PRIMARY: '#AA292E',    // Header/Primary
  ACCENT: '#F19826',     // Accent/Orange
  ERROR: '#C61111',      // Error/Timer red
  BACKGROUND: '#FFFFFF',
  TEXT: '#000000',
  TEXT_LIGHT: '#666666',
};
```

---

## M5: Admin Mobile App (15% - Priority 2)

### Core Implementation Steps

#### 1. Similar Structure to User App
- Reuse navigation patterns
- Reuse API client setup
- Different screens for admin functions

#### 2. Key Screens

**Admin Dashboard**
- Statistics cards
- Quick actions

**Masters Management Screens**
- Sections (list, create, edit with series_config editor)
- Schemes (list, create, edit rates)
- Sales Groups/Books (CRUD)
- Users (CRUD with role selection)
- Ticket Assignments (CRUD)
- Blocked Numbers (CRUD)
- Credit Limits (CRUD)

**Result Publish Screen**
- Section selector
- Date picker
- Winning number input
- Series input (if applicable)
- Confirm button with dialog
- Shows settlement summary after publish

**Result Revoke Screen**
- Section and date selector
- List published results
- Revoke button with confirmation

---

## M6: Reports & Exports (10% - Priority 3)

### Backend - Reports Endpoints

Add to `backend/src/routes/reports.ts`:

```typescript
// GET /api/v1/reports/number-wise
router.get('/number-wise', authMiddleware, async (req, res) => {
  const { section_id, date } = req.query;
  
  // Aggregate sales by number
  const results = await prisma.$queryRaw`
    SELECT 
      be.number,
      SUM(be.quantity) as total_quantity,
      SUM(be.stake_per_unit * be.quantity * be.expanded_count) as total_amount,
      COUNT(DISTINCT be.bill_id) as bill_count
    FROM bill_entries be
    JOIN bills b ON b.id = be.bill_id
    WHERE b.section_id = ${section_id}
      AND b.date = ${date}
      AND b.status = 'SUBMITTED'
    GROUP BY be.number
    ORDER BY be.number
  `;
  
  return res.json(successResponse({ report: results }));
});

// GET /api/v1/reports/net-pay
router.get('/net-pay', authMiddleware, async (req, res) => {
  const { section_id, date } = req.query;
  
  // Calculate net pay (sales - winnings)
  const bills = await prisma.bill.findMany({
    where: { section_id, date, status: 'SUBMITTED' },
    include: {
      entries: {
        include: {
          winnings: true
        }
      }
    }
  });
  
  let totalSales = 0;
  let totalWinnings = 0;
  
  bills.forEach(bill => {
    totalSales += Number(bill.total_amount);
    bill.entries.forEach(entry => {
      entry.winnings.forEach(winning => {
        totalWinnings += Number(winning.amount);
      });
    });
  });
  
  return res.json(successResponse({
    report: {
      total_sales: totalSales,
      total_winnings: totalWinnings,
      net_pay: totalSales - totalWinnings
    }
  }));
});

// GET /api/v1/reports/winning
router.get('/winning', authMiddleware, async (req, res) => {
  const { section_id, date } = req.query;
  
  const winnings = await prisma.winning.findMany({
    where: {
      bill_entry: {
        bill: {
          section_id,
          date
        }
      }
    },
    include: {
      bill_entry: {
        include: {
          bill: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
  
  return res.json(successResponse({ winnings }));
});
```

### Frontend - Report Screens

Add report screens to both user and admin apps showing aggregated data.

---

## M7: End-to-End Testing & Release (5% - Priority 4)

### Testing Steps (per END_TO_END_TEST.md)

#### 1. Setup
```bash
# Start all services
sudo service postgresql start
cd backend && npm run dev &
cd apps/user-app && npx expo start &
cd apps/admin-app && npx expo start &
```

#### 2. Admin Flow Test
- Login as admin
- Verify 4 sections exist
- Verify schemes exist
- Create/verify sales ticket assignment for tomorrow
- Check credit limit

#### 3. User Flow Test
- Login as agent
- Choose section (use tomorrow's date to bypass cutoff)
- Go to Sales Entry
- Select Group + Book
- Enter 3-digit bet
- Test 111 macro (should show 10 entries)
- Test 100 macro (should show 10 entries)
- Test BOXK with 123 (should show 6 permutations)
- Test ALL (should multiply by 12 for DEAR sections)
- Submit bill - verify success

#### 4. Result Publish Test
- Admin app: publish result
- Verify settlement calculated
- Check winning records created

#### 5. Offline Queue Test
- Disconnect network
- Submit bill in user app
- Verify saved to queue
- Reconnect network
- Retry from queue
- Verify successful upload

#### 6. Android Build
```bash
cd apps/user-app
eas build --platform android --profile production

cd apps/admin-app
eas build --platform android --profile production
```

### Release Checklist
- [ ] All END_TO_END_TEST.md scenarios pass
- [ ] UI matches screenshots in docs 2/screens/
- [ ] Both apps build successfully
- [ ] APK/AAB files created
- [ ] Test installation on device
- [ ] Update DEFINITION_OF_DONE.md

---

## Key Files to Create/Modify

### User App
1. `apps/user-app/App.js` → `App.tsx` (TypeScript)
2. Create all screens in `src/screens/`
3. Setup navigation in `src/navigation/`
4. Configure API client
5. Implement offline queue

### Admin App
1. `apps/admin-app/App.js` → `App.tsx`
2. Create admin screens
3. Setup navigation
4. Implement CRUD forms

### Backend
1. Add reports routes (3 endpoints)
2. Update index.ts to mount reports routes

---

## Estimated Effort

| Task | Complexity | Time Estimate |
|------|-----------|---------------|
| User App Basics (Login, Home) | Medium | 4-6 hours |
| Sales Entry Screen | High | 8-10 hours |
| Offline Queue | Medium | 3-4 hours |
| Admin App | Medium | 6-8 hours |
| Reports Backend | Low | 2-3 hours |
| Report Screens | Low | 2-3 hours |
| Testing & Debugging | Medium | 4-6 hours |
| Android Builds | Low | 1-2 hours |
| **Total** | | **30-42 hours** |

---

## Quick Start Commands

```bash
# Backend
cd backend
npm run dev

# User App
cd apps/user-app
npx expo start

# Admin App  
cd apps/admin-app
npx expo start

# Database
sudo service postgresql start
cd backend
npm run db:migrate
npm run seed
```

---

## Notes

1. **UI Parity**: Strictly match colors and layout from docs 2/UI_PARITY_CHECKLIST.md
2. **Offline First**: Always save to queue on network errors
3. **Error Handling**: Use canonical error codes from backend
4. **Testing**: Test each feature immediately after implementation
5. **Small Commits**: Commit after each working screen/feature

---

## Success Criteria

The project is complete when:
1. ✅ Backend fully functional (DONE)
2. ✅ Database seeded correctly (DONE)
3. [ ] User app allows complete sales flow
4. [ ] Offline queue works end-to-end
5. [ ] Admin app allows result publish
6. [ ] Android APK/AAB builds successfully
7. [ ] All END_TO_END_TEST.md scenarios pass
8. [ ] DEFINITION_OF_DONE.md fully checked
