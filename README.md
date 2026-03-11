# Psikotest MVP

Monorepo scaffold for a psychological assessment web app with a React frontend and an Express backend.

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Node.js + Express + TypeScript
- MySQL via `mysql2`

## Apps

- `apps/web`: public landing page, admin shell, participant flow
- `apps/api`: REST API starter, environment config, database migration and seeds
- `packages/shared`: shared enums and result types

## Getting started

1. Copy `.env.example` values into your environment.
2. Install dependencies with `npm install`.
3. Run the dev servers with `npm run dev`.

## Useful scripts

- `npm run dev`
- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run typecheck`
- `npm run check`

## Database

Migration and seed SQL live under:

- `apps/api/src/database/migrations`
- `apps/api/src/database/seeds`

Apply them in phpMyAdmin or via MySQL CLI in this order:

1. `001_init_schema.sql`
2. `001_seed_test_types.sql`
3. `002_seed_disc_questions.sql`
4. `003_seed_iq_questions.sql`
5. `004_seed_workload_questions.sql`

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

## Hostinger deployment notes

- Build the frontend with `npm run build --workspace @psikotest/web`.
- Build the API with `npm run build --workspace @psikotest/api`.
- Point the Node.js app entry to `apps/api/dist/index.js`.
- Serve the built frontend either from a static subdomain or from Express later in the deployment step.
