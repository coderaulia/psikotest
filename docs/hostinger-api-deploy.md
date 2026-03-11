# Hostinger API Deployment Guide

Target API domain: `https://api.your-app-domain.com`

## Deployment mode

This API is intended for manual upload as a separate Node.js app.
Always generate a fresh upload package before redeploying:

```bash
npm run package:api-deploy
```

That command rebuilds the API and writes a new ZIP to `deploy/api2-codeyourcareer-api.zip`.

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

## 3. API app settings

Recommended Hostinger settings:

- Node.js version: `20.x`
- Build command: `npm run build`
- Startup file: `server.js`
- Start command, if the panel asks for it: `npm start`

Upload the package generated at `deploy/api2-codeyourcareer-api.zip`.
The API entry file inside the package is `apps/api/server.js`.

## 4. Environment variables

Add these variables in the Environment Variables step or import them from `.env`:

```env
APP_ORIGIN=https://your-app-domain.com
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=replace-this-with-a-long-random-secret
```

If Hostinger injects a `PORT` variable automatically, leave it as-is. The API already respects `PORT` when present.

## 5. Set an admin password

Generate a hash locally:

```bash
npm --prefix apps/api run hash:password -- "YourStrongPasswordHere"
```

Update the admin row in MySQL:

```sql
UPDATE admins
SET password_hash = 'paste-generated-hash-here'
WHERE email = 'admin@your-domain.com';
```

## 6. Domain and testing

Deploy the app to your API domain.

After deployment, test:

- `https://api.your-app-domain.com/api/health`
- `https://api.your-app-domain.com/api/public/session/disc-batch-a`

## 7. Security notes

- Admin endpoints require a signed bearer token issued by `/api/auth/login`.
- Admin login is checked against the `admins` table in MySQL.
- Public participant save and submit endpoints require a signed submission access token returned by `/api/public/session/:token/start`.
- Keep `JWT_SECRET` only in the server environment, never in the frontend repo.

## 8. If a public token is missing

If the public session endpoint returns `{"error":"Public session not found"}`, import `006_repair_demo_sessions.sql` and verify the rows below.

```sql
SELECT id, email FROM admins WHERE email = 'admin@psikotest.local';
SELECT id, access_token, status, created_by_admin_id FROM test_sessions ORDER BY id DESC;
```

Expected tokens:

- `disc-batch-a`
- `iq-screening`
- `workload-check`
