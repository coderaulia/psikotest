# Hostinger API Deployment Guide

Target API domain: `api2.codeyourcareer.my.id`

## 1. Create the MySQL database

In Hostinger hPanel:

1. Open `Databases -> MySQL Databases`
2. Create a database, username, and password
3. Note these values:
   - host, usually `localhost`
   - database name
   - database user
   - database password

## 2. Import the SQL files

Import these files in order using phpMyAdmin:

1. `001_init_schema.sql`
2. `001_seed_test_types.sql`
3. `002_seed_disc_questions.sql`
4. `003_seed_iq_questions.sql`
5. `004_seed_workload_questions.sql`
6. `005_seed_demo_sessions.sql`

The final seed creates these public demo tokens:

- `disc-batch-a`
- `iq-screening`
- `workload-check`

If you already imported the earlier demo-session seed and the token endpoint is still empty, import `006_repair_demo_sessions.sql` once.

## 3. GitHub deployment setup

For direct deployment from GitHub, use the repository root.

Recommended Hostinger settings:

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build:hostinger-api`
- Startup file: `server.js`
- Start command, if the panel asks for it: `npm start`

The repo root contains a `server.js` shim that starts the compiled API from `apps/api/dist/index.js`, so you do not need to upload the `apps/api` folder separately when using GitHub deployment.

## 4. Environment variables

Add these variables in the Environment Variables step or import them from `.env`:

```env
APP_ORIGIN=https://codeyourcareer.my.id
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=replace-with-a-long-random-secret
```

If Hostinger injects a `PORT` variable automatically, leave it as-is. The API already respects `PORT` when present.

## 5. Domain and testing

Deploy the app to the Node.js website using `api2.codeyourcareer.my.id`.

After deployment, test:

- `https://api2.codeyourcareer.my.id/api/health`
- `https://api2.codeyourcareer.my.id/api/public/session/disc-batch-a`

## 6. Frontend API base URL

Your frontend should use:

```env
VITE_API_BASE_URL=https://api2.codeyourcareer.my.id/api
```

## 7. If a public token is missing

If the public session endpoint returns `{"error":"Public session not found"}`, import `006_repair_demo_sessions.sql` and verify the rows below.

```sql
SELECT id, email FROM admins WHERE email = 'admin@psikotest.local';
SELECT id, access_token, status, created_by_admin_id FROM test_sessions ORDER BY id DESC;
```

Expected tokens:

- `disc-batch-a`
- `iq-screening`
- `workload-check`

## Notes

- This API reads MySQL credentials from `DB_*` variables, with fallback support for the previous `MYSQL_*` names.
- Results and public submissions are persisted in MySQL.
- Admin dashboard endpoints are still partially mock-backed and can be moved to repositories next.
