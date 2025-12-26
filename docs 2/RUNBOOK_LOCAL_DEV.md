# Local Dev Runbook (React Native + Express + Postgres)

## Prereqs
- Node LTS
- Postgres running
- Android Studio / Emulator (optional for screenshots)

## Install
```bash
npm i
```

## Backend
```bash
npm run db:migrate --workspace=backend
npm run db:seed --workspace=backend
PORT=3002 npm run dev --workspace=backend
```
Check:
- `GET http://localhost:3002/health`

## User App
```bash
cd apps/user-app
npx expo start
```

## Admin App
```bash
cd apps/admin-app
npx expo start
```

## Troubleshooting
- If port is busy: change PORT env
- If Android build blocked by ADB permissions: fix local environment; attach logs in `docs/logs/`
