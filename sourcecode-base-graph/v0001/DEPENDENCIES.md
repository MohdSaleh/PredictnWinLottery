# Dependencies & Tooling
- Package manager: npm workspaces (root package.json). Lockfile: missing package-lock.json (must generate).
- Node runtime: node $(node -v 2>/dev/null || echo 'unknown'); npm $(npm -v 2>/dev/null || echo 'unknown').
- Backend deps: express, cors, dotenv, jsonwebtoken, bcryptjs, @prisma/client; dev: typescript, tsx, prisma, jest, ts-jest, eslint, @typescript-eslint.
- Mobile apps deps: Expo ~54, React 19, react-native 0.81, navigation libs, axios.
- Database: Postgres (docker-compose.yml defines lottery_postgres). Prisma schema present; migrations absent.
