# Psikotest Frontend

The repository root is the frontend project for Hostinger Git import. The frontend source lives directly in `src/`, while the separate API source stays in `apps/api`.

## Structure

- `src/`: frontend app source
- `apps/api/`: separate backend API source
- `deploy/`: API manual-upload artifacts and SQL helpers

## Frontend deployment

Use the repository root for your main app domain.

Recommended Hostinger settings:

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build`
- Output directory: `dist`

Required environment variable:

- `VITE_API_BASE_URL=https://api.your-app-domain.com/api`

## Hostinger behavior

Hostinger's frontend deployment expects a build output directory such as `dist/`. After build, Hostinger publishes that output to the domain web root, which is `public_html` on the server.

You do not manually point the site root to `nodejs/` for a frontend-only Vite app on Hostinger shared hosting.

## API deployment

The backend stays separate and should not be served on the main domain.

- API source: `apps/api`
- API entry: `apps/api/server.js`
- API upload artifacts: `deploy/`
- API domain: `https://api.your-app-domain.com/api`

## Security notes

- Do not commit real deployment credentials or real administrator credentials.
- Store a long `JWT_SECRET` only in the API environment.
- Admin login is validated against the `admins` table in MySQL.
- Participant answer save and submit endpoints require a signed submission access token.
