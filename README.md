# Psikotest MVP

Monorepo scaffold for a psychological assessment web app with a React frontend and an Express backend.

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Node.js + Express + TypeScript
- MySQL via `mysql2`

## Apps

- `apps/web`: public landing page, admin shell, participant flow
- `apps/api`: REST API, MySQL-backed public sessions and results, migrations and seeds
- `packages/shared`: shared types for test and result payloads
- `deploy/`: local deployment artifacts for the API manual upload flow

## Getting started

1. Copy `.env.example` and `apps/web/.env.example` values into your local environment as needed.
2. Copy `apps/api/.env.example` for the API environment.
3. Install dependencies with `npm install`.
4. Run the dev servers with `npm run dev`.

## Useful scripts

- `npm run dev`
- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run build:web`
- `npm run build:api`
- `npm run build:hostinger-web`
- `npm run build:hostinger-api`
- `npm run typecheck`
- `npm run check`

## Deployment split

### Main app from GitHub

Deploy the repo root as the main app. The root `server.js` serves the built SPA from `apps/web/dist`.

Recommended Hostinger settings:

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build:hostinger-web`
- Startup file: `server.js`
- Start command if requested: `npm start`

Set this environment variable in Hostinger for the main app build:

- `VITE_API_BASE_URL=https://api2.codeyourcareer.my.id/api`

### API manual upload

Keep the API as a separate manual deployment. The uploadable package and SQL helpers stay under `deploy/`, and the app-specific entry remains [apps/api/server.js](D:/web/psikotest/apps/api/server.js).

See [hostinger-api-deploy.md](D:/web/psikotest/docs/hostinger-api-deploy.md) for API deployment details.

## Database

SQL files live under `apps/api/src/database`.

Import them in this order:

1. `001_init_schema.sql`
2. `001_seed_test_types.sql`
3. `002_seed_disc_questions.sql`
4. `003_seed_iq_questions.sql`
5. `004_seed_workload_questions.sql`
6. `005_seed_demo_sessions.sql`

If you already imported the older demo-session seed and the public token endpoint still returns `{"error":"Public session not found"}`, import `006_repair_demo_sessions.sql` once.

## Demo public tokens

- `disc-batch-a`
- `iq-screening`
- `workload-check`
