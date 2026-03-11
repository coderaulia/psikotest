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

## Getting started

1. Copy `.env.example` values into your local environment.
2. Install dependencies with `npm install`.
3. Run the dev servers with `npm run dev`.

## Useful scripts

- `npm run dev`
- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run build:hostinger-api`
- `npm run typecheck`
- `npm run check`

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

## Current API coverage

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/dashboard/summary`
- `GET /api/test-sessions`
- `GET /api/results`
- `GET /api/public/session/:token`
- `POST /api/public/session/:token/start`
- `POST /api/public/submissions/:submissionId/answers`
- `POST /api/public/submissions/:submissionId/submit`

## Hostinger GitHub deployment

For a Node.js app deployed directly from this repository root:

- Repository branch: `main`
- Build command: `npm run build:hostinger-api`
- Startup file: `server.js`
- Start command if requested: `npm start`
- Node.js version: `20.x`

The repo root now includes `server.js`, which starts the built API from `apps/api/dist/index.js` so Hostinger can deploy directly from GitHub without uploading only the `apps/api` folder.

## Troubleshooting public tokens

If `GET /api/public/session/disc-batch-a` returns `{"error":"Public session not found"}`:

1. Import `apps/api/src/database/seeds/006_repair_demo_sessions.sql`.
2. Verify the rows exist:
   - `SELECT id, email FROM admins WHERE email = 'admin@psikotest.local';`
   - `SELECT id, access_token, status, created_by_admin_id FROM test_sessions ORDER BY id DESC;`
3. Confirm `disc-batch-a`, `iq-screening`, and `workload-check` are present with `status = 'active'`.
