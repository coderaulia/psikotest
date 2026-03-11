# Psikotest Frontend

The repository root is the frontend project for Hostinger Git import. It is a Vite + React app that serves the built SPA on the main domain.

## Frontend deployment

Use the repository root for `codeyourcareer.my.id`.

Recommended Hostinger settings:

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build`
- Startup file: `server.js`
- Start command if requested: `npm start`

Required environment variable:

- `VITE_API_BASE_URL=https://api2.codeyourcareer.my.id/api`

## API deployment

The backend stays separate and should not be served on the main domain.

- API source: `apps/api`
- API entry: `apps/api/server.js`
- API upload artifacts: `deploy/`
- API domain: `https://api2.codeyourcareer.my.id/api`

## Local scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run dev:api`
- `npm run build:api`

## Public test flow

The frontend routes are SPA routes, so the root server provides an index fallback for:

- `/admin/login`
- `/admin/dashboard`
- `/t/disc-batch-a`
