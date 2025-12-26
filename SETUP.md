# Setup Guide - Lottery Prediction System

This guide provides step-by-step instructions to set up and run the Lottery Prediction System on a fresh machine.

## Prerequisites

- **Node.js**: v20.19.6 (pinned in `.nvmrc`)
- **npm**: v10.8.2 or later
- **PostgreSQL**: 15+ (via Docker or local installation)
- **Docker** (optional, recommended for PostgreSQL)

## Quick Start (One-Command Path)

### Option 1: Using Docker for PostgreSQL (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/MohdSaleh/PredictnWinLottery.git
cd PredictnWinLottery

# 2. Install Node.js version (if using nvm)
nvm install
nvm use

# 3. Start PostgreSQL with Docker
docker-compose up -d

# 4. Install dependencies
npm ci

# 5. Setup backend database
cd backend
cp .env.example .env
npm run db:migrate
npm run seed
cd ..

# 6. Start all services
npm run dev:all
```

Backend will be available at: http://localhost:3002
User app will start on Expo Metro
Admin app will start on Expo Metro

### Option 2: Using Local PostgreSQL

```bash
# 1-2. Same as Option 1 (clone and install Node)

# 3. Ensure PostgreSQL is running locally
# Create database manually:
createdb lottery_db

# 4-6. Continue with same steps as Option 1
```

## Detailed Setup Instructions

### 1. Node.js Installation

#### Using nvm (Recommended)

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use pinned version
nvm install
nvm use
```

#### Without nvm

Download and install Node.js v20.19.6 from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node -v  # Should output: v20.19.6
npm -v   # Should output: 10.8.2 or higher
```

### 2. Database Setup

#### Option A: Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d

# Verify container is running
docker ps | grep lottery_postgres

# Check logs if needed
docker logs lottery_postgres

# Stop when done (optional)
docker-compose down
```

**Database credentials** (from docker-compose.yml):
- Host: localhost
- Port: 5432
- Database: lottery_db
- User: lottery_user
- Password: lottery_pass

#### Option B: Local PostgreSQL

1. Install PostgreSQL 15+ on your system
2. Create database:
   ```bash
   createdb lottery_db
   ```
3. Update `backend/.env` with your PostgreSQL credentials

### 3. Install Dependencies

```bash
# From repository root
npm ci
```

This installs all dependencies for:
- Root workspace
- Backend
- User app
- Admin app
- Shared packages

**Expected time**: 30-60 seconds

### 4. Backend Configuration

```bash
cd backend
```

#### Create .env file

```bash
# Copy example environment file
cp .env.example .env
```

#### Edit .env if needed

```env
NODE_ENV=development
PORT=3002
DATABASE_URL="postgresql://lottery_user:lottery_pass@localhost:5432/lottery_db?schema=public"
JWT_SECRET=your-secret-key-change-in-production-minimum-32-characters
```

**For local PostgreSQL**, update DATABASE_URL with your credentials.

#### Run migrations

```bash
npm run db:migrate
```

**Expected output**:
```
Prisma Migrate applied successfully
```

This creates 19 tables in the database.

#### Seed database

```bash
npm run seed
```

**Expected output**:
```
✓ Created 4 sections (DEAR 1PM, LSK 3PM, DEAR 6PM, DEAR 8PM)
✓ Created 8 schemes
✓ Created 2 users (admin, agent1)
✓ Created ticket assignments
✓ Seed completed successfully
```

### 5. Verify Backend Setup

```bash
# Start backend server
npm run dev
```

**Expected output**:
```
Server running on http://localhost:3002
```

#### Test health endpoint

```bash
curl http://localhost:3002/health
```

**Expected response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-26T...",
    "environment": "development"
  },
  "message": null
}
```

#### Test login

```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"agent1","password":"agent123"}'
```

**Expected**: JWT token in response

### 6. Mobile Apps Setup

#### User/Agent App

```bash
cd apps/user-app
npx expo start
```

Scan QR code with Expo Go app or press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web

#### Admin App

```bash
cd apps/admin-app
npx expo start
```

Same options as user app.

### 7. Run All Services Together

From repository root:

```bash
npm run dev:all
```

This starts:
- Backend server (port 3002)
- User app (Expo Metro)
- Admin app (Expo Metro)

Use different terminal tabs/windows or a multiplexer like `tmux`.

## Verification Checklist

- [ ] Node.js v20.19.6 installed (`node -v`)
- [ ] PostgreSQL running (docker or local)
- [ ] `npm ci` completed without errors
- [ ] Database migrated (19 tables created)
- [ ] Database seeded (4 sections, 2 users)
- [ ] Backend health check responds
- [ ] Login endpoint returns JWT
- [ ] User app starts in Expo
- [ ] Admin app starts in Expo

## Test Credentials

### Admin User
- Username: `admin`
- Password: `admin123`
- Role: ADMIN

### Agent User
- Username: `agent1`
- Password: `agent123`
- Role: AGENT

## Common Issues & Troubleshooting

### Issue: `npm ci` fails with "Cannot find module"

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection error

**Symptoms**: `ECONNREFUSED` or `Can't reach database server`

**Solutions**:
1. **Docker**: Ensure container is running
   ```bash
   docker-compose ps
   docker-compose up -d
   ```

2. **Local PostgreSQL**: Check service status
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   ```

3. Verify DATABASE_URL in `backend/.env`

### Issue: Port 3002 already in use

**Solution**:
```bash
# Find and kill process
lsof -ti:3002 | xargs kill -9

# Or change PORT in backend/.env
PORT=3003
```

### Issue: Expo app won't start

**Solution**:
```bash
# Clear Expo cache
cd apps/user-app  # or apps/admin-app
npx expo start -c
```

### Issue: TypeScript errors

**Solution**:
```bash
# Regenerate Prisma client
cd backend
npx prisma generate
```

### Issue: Migration fails

**Solution**:
```bash
# Reset database (WARNING: destroys data)
cd backend
npx prisma migrate reset
npm run seed
```

## Development Workflow

### Start backend only
```bash
cd backend
npm run dev
```

### Run database migrations
```bash
cd backend
npm run db:migrate
```

### Re-seed database
```bash
cd backend
npm run seed
```

### Type-check all code
```bash
npx tsc --noEmit --project backend/tsconfig.json
```

### View database with Prisma Studio
```bash
cd backend
npx prisma studio
```

Opens at http://localhost:5555

## API Documentation

- **Base URL**: http://localhost:3002/api/v1
- **API Contract**: See `docs 2/API_CONTRACT_CANONICAL.md`
- **Test Scenarios**: See `docs 2/logs/end_to_end_test_execution.md`

### Key Endpoints

- `POST /auth/login` - Authentication
- `GET /sections/active` - Get 4 sections
- `POST /sales/create_bill` - Create sales bill with gates
- `POST /results/publish` - Publish results (admin)
- `GET /reports/net-pay` - Financial reports

## Project Structure

```
/
├── apps/
│   ├── user-app/          # User/Agent mobile app (Expo)
│   ├── admin-app/         # Admin mobile app (Expo)
├── backend/               # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, etc.
│   │   └── utils/        # Helpers
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
├── packages/
│   └── shared/           # Shared utilities
├── docs 2/               # Documentation & evidence
├── docker-compose.yml    # PostgreSQL container
├── .nvmrc               # Node version pinning
└── package.json         # Monorepo config
```

## Scripts Reference

### Root scripts (from repository root)
- `npm run dev:all` - Start all services
- `npm run dev` - Start backend only
- `npm ci` - Clean install (deterministic)
- `npm install` - Install with updates

### Backend scripts (from backend/)
- `npm run dev` - Start dev server with hot-reload
- `npm run build` - Compile TypeScript
- `npm run db:migrate` - Run Prisma migrations
- `npm run seed` - Seed database with test data
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Mobile app scripts (from apps/user-app or apps/admin-app)
- `npx expo start` - Start Expo dev server
- `npx expo start -c` - Start with cache cleared

## Additional Resources

- **Full validation report**: `docs 2/PROJECT_VALIDATION_REPORT.md`
- **End-to-end tests**: `docs 2/logs/end_to_end_test_execution.md`
- **Database schema**: `backend/prisma/schema.prisma`
- **API contract**: `docs 2/API_CONTRACT_CANONICAL.md`

## Support

For issues or questions:
1. Check this SETUP.md troubleshooting section
2. Review logs in `docs 2/logs/`
3. Check Prisma schema and migrations
4. Verify environment variables in `.env`

## Next Steps

After successful setup:
1. Review `docs 2/PROJECT_COMPLETION_REPORT.md` for feature overview
2. Test API endpoints with curl (see `docs 2/logs/end_to_end_test_execution.md`)
3. Explore mobile app screens
4. Review business logic in `backend/src/services/sales.service.ts`

---

**Setup complete!** The system is ready for development and testing.
