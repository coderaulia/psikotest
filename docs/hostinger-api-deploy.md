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

## 2. Import the schema

Import the schema migration using phpMyAdmin:

1. `apps/api/src/database/migrations/001_init_schema.sql`

Assessment content, question banks, demo sessions, and any bootstrap seed data should be managed outside this repository. They are intentionally not versioned here.

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

## 5. Create an admin password

Generate a hash locally:

```bash
npm --prefix apps/api run hash:password -- "YourStrongPasswordHere"
```

Insert or update the admin row in MySQL:

```sql
INSERT INTO admins (full_name, email, password_hash, role, status)
VALUES ('Administrator', 'admin@your-domain.com', 'paste-generated-hash-here', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  status = VALUES(status);
```

## 6. Domain and testing

Deploy the app to your API domain.

After deployment, test:

- `https://api.your-app-domain.com/api/health`
- `https://api.your-app-domain.com/api/auth/login`
- `https://api.your-app-domain.com/api/public/session/<assessment-token>` once you create your own session data

## 7. Security notes

- Admin endpoints require a signed bearer token issued by `/api/auth/login`.
- Admin login is checked against the `admins` table in MySQL.
- Public participant save and submit endpoints require a signed submission access token returned by `/api/public/session/:token/start`.
- Keep `JWT_SECRET` only in the server environment, never in the frontend repo.
