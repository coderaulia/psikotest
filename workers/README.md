# Deploy to Cloudflare Workers

This guide sets up the Psikotest API on Cloudflare Workers with D1 database.

## Prerequisites

1. Cloudflare account (free tier works)
2. Wrangler CLI installed

## Setup Steps

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Authenticate

```bash
wrangler login
```

### 3. Navigate to Workers Directory

```bash
cd workers
npm install
```

### 4. Create D1 Database

```bash
wrangler d1 create psikotest-db
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "psikotest-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 5. Run Database Schema

```bash
wrangler d1 execute psikotest-db --file=./schema.sql
```

### 6. Set Secrets

```bash
wrangler secret put JWT_SECRET
# Enter a secure random string (min 32 characters)
```

### 7. Deploy

```bash
wrangler deploy
```

## Update Frontend

After deployment, update your frontend `.env`:

```
VITE_API_BASE_URL=https://api.psikotest.vanaila.com/api
```

Or if using a custom domain:
```
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev/api
```

## Database Management

### View Data

```bash
wrangler d1 execute psikotest-db --command="SELECT * FROM admins"
```

### Backup

```bash
wrangler d1 export psikotest-db --output=./backup.sql
```

### Create Admin User

Generate password hash locally:
```bash
# Using Node.js
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(console.log)"
```

Then insert:
```bash
wrangler d1 execute psikotest-db --command="INSERT INTO admins (full_name, email, password_hash, role) VALUES ('Admin', 'admin@vanaila.com', 'YOUR_HASH', 'super_admin')"
```

## Architecture

```
Frontend (Hostinger/psikotest.vanaila.com)
            │
            ▼
    Cloudflare Workers (API)
            │
            ▼
    Cloudflare D1 (SQLite DB)
```

## Development

```bash
# Local development
npm run dev

# Deploy updates
wrangler deploy
```

## Environment Variables

Set in `wrangler.toml` or via `wrangler secret put`:

| Variable | Type | Description |
|----------|------|-------------|
| `JWT_SECRET` | Secret | JWT signing key |
| `APP_ORIGIN` | Var | Frontend domain for CORS |
| `DB` | Binding | D1 database binding |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | Admin login |
| `/api/auth/me` | GET | Get current admin |
| `/api/site-auth/login` | POST | Customer login |
| `/api/site-auth/register` | POST | Customer signup |
| `/api/public/session/:token` | GET | Get test session |
| `/api/public/session/:token/start` | POST | Start test |

## Troubleshooting

### 500 Errors

Check logs:
```bash
wrangler tail
```

### Database Connection Issues

Verify database ID in wrangler.toml matches:
```bash
wrangler d1 list
```

### CORS Errors

Update `APP_ORIGIN` in wrangler.toml to match your frontend domain.

## Migration from MySQL

If you have existing MySQL data, export it and convert the SQL syntax to SQLite for D1:

1. Export MySQL data
2. Convert syntax (D1 uses SQLite)
3. Import using `wrangler d1 execute`

Note: Some MySQL features may need adjustment for SQLite compatibility.

## Pricing

Cloudflare Workers free tier:
- 100,000 requests/day
- 10ms CPU time per request
- D1: 5 million rows read/day, 100,000 rows written/day

For production with more traffic, upgrade to Workers Paid ($5/month).

## Security Notes

1. Never commit `JWT_SECRET` to git
2. Use strong passwords for admin accounts
3. Enable Cloudflare security features (WAF, DDoS protection)
4. Set up custom domain with SSL
5. Regular database backups