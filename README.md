# Psikotest Frontend

The repository root is the frontend project for Hostinger Git import. It is a Vite + React app that builds directly into `public_html` for shared-hosting style deployment.

## Frontend deployment

Use the repository root for your main app domain.

Recommended Hostinger settings:

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build`
- Startup file: `server.js`
- Start command if requested: `npm start`

Required environment variable:

- `VITE_API_BASE_URL=https://api.your-app-domain.com/api`

## Output folder

The frontend build now writes directly to `public_html/` and includes an `.htaccess` SPA fallback for routes like `/admin/dashboard` and `/t/disc-batch-a`.

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

## Set an admin password

Generate a password hash locally:

```bash
npm --prefix apps/api run hash:password -- "YourStrongPasswordHere"
```

Then update your admin row in MySQL:

```sql
UPDATE admins
SET password_hash = 'paste-generated-hash-here'
WHERE email = 'admin@your-domain.com';
```

## Local scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run dev:api`
- `npm run build:api`
