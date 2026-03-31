# Cloudflare Workers Deployment with GitHub

Complete setup guide for deploying Psikotest API to Cloudflare Workers using GitHub integration.

## Quick Setup

### 1. Prepare Repository

The repository is already configured with:
- `workers/` - API code for Cloudflare Workers
- `.github/workflows/deploy-workers.yml` - Auto-deployment on push
- `wrangler.toml` - Workers configuration
- D1 migrations in `workers/migrations/`

### 2. Cloudflare Setup

#### Create Cloudflare Account
1. Sign up at https://dash.cloudflare.com
2. Verify your email

#### Get API Token
1. Go to **My Profile** (top right) → **API Tokens**
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Or create custom token with permissions:
   - Zone:Read (for custom domains)
   - Workers Scripts:Edit
   - Workers Routes:Edit
   - D1:Edit
5. Copy the token

#### Get Account ID
1. Go to any domain's dashboard
2. Look at the right sidebar
3. Copy **Account ID**

### 3. GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add:
- `CLOUDFLARE_API_TOKEN` - Your API token from step 2
- `CLOUDFLARE_ACCOUNT_ID` - Your account ID from step 2

### 4. Create D1 Database

#### Option A: Local (Recommended)
```bash
cd workers
npm install -g wrangler
wrangler login
wrangler d1 create psikotest-db
```

Copy the `database_id` from output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "psikotest-db"
database_id = "your-database-id-here"
```

#### Option B: Via GitHub Actions (First run will fail, then update)
1. Push the code
2. First deployment will fail (no database_id)
3. Create DB locally and update wrangler.toml
4. Push again

### 5. Set Secrets

Set JWT secret for authentication:

```bash
cd workers
wrangler secret put JWT_SECRET
# Enter a secure random string (min 32 characters)
```

Or via Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Settings → Variables and Secrets
4. Add `JWT_SECRET`

### 6. Deploy

Push to main branch:
```bash
git add .
git commit -m "Setup Cloudflare Workers deployment"
git push origin main
```

GitHub Actions will automatically:
1. Install dependencies
2. Deploy Workers
3. Apply database migrations

### 7. Custom Domain (Optional)

Add to `wrangler.toml`:
```toml
routes = [
  { pattern = "api.psikotest.vanaila.com/*", custom_domain = true }
]
```

Then in Cloudflare:
1. Add your domain to Cloudflare
2. Create DNS record pointing to Workers
3. Or use Workers Routes

### 8. Update Frontend

After successful deployment, update your frontend environment:

**Via Hostinger environment variables:**
```
VITE_API_BASE_URL=https://psikotest-api.YOUR_SUBDOMAIN.workers.dev/api
```

Or with custom domain:
```
VITE_API_BASE_URL=https://api.psikotest.vanaila.com/api
```

## Migration from MySQL

If you have existing data in Hostinger MySQL:

1. **Export MySQL Data:**
   - Use phpMyAdmin to export your database
   - Save as SQL file

2. **Convert to SQLite:**
   ```bash
   # Use the migration guide
   cat MIGRATION.md
   
   # Or use online converter
   # https://www.rebasedata.com/convert-mysql-to-sqlite-online
   ```

3. **Import to D1:**
   ```bash
   wrangler d1 execute psikotest-db --file=./converted_data.sql
   ```

4. **Verify:**
   ```bash
   wrangler d1 execute psikotest-db --command="SELECT COUNT(*) FROM admins;"
   ```

## Testing

### Test Health Endpoint
```bash
curl https://psikotest-api.YOUR_SUBDOMAIN.workers.dev/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Test Admin Login
```bash
curl -X POST https://psikotest-api.YOUR_SUBDOMAIN.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vanaila.com","password":"admin123"}'
```

## Troubleshooting

### "Cannot find module"
- Run `npm install` in workers directory
- Check wrangler.toml main entry points to correct file

### "Database not found"
- Verify `database_id` in wrangler.toml
- Run: `wrangler d1 list` to confirm database exists

### "JWT_SECRET not set"
- Set the secret: `wrangler secret put JWT_SECRET`
- Or add in Cloudflare dashboard

### "Build failed"
- Check GitHub Actions logs
- Ensure all dependencies in package.json

### "CORS errors"
- Update `APP_ORIGIN` in wrangler.toml to match frontend URL

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Hostinger)            │
│     https://psikotest.vanaila.com       │
└──────────────┬──────────────────────────┘
               │ API calls
               ▼
┌─────────────────────────────────────────┐
│      Cloudflare Workers (Edge)          │
│   https://psikotest-api...workers.dev   │
└──────────────┬──────────────────────────┘
               │ SQL queries
               ▼
┌─────────────────────────────────────────┐
│       Cloudflare D1 (SQLite)            │
│         psikotest-db                    │
└─────────────────────────────────────────┘
```

## Files Structure

```
psikotest/
├── workers/
│   ├── src/
│   │   ├── index.ts           # Main entry
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, errors
│   │   └── lib/               # DB helpers
│   ├── migrations/            # D1 migrations
│   ├── package.json
│   ├── wrangler.toml
│   └── README.md
├── .github/
│   └── workflows/
│       └── deploy-workers.yml # Auto-deploy
└── src/
    └── services/
        └── api-client.ts      # Update API URL
```

## Monitoring

### View Logs
```bash
wrangler tail
```

### Check Database
```bash
wrangler d1 execute psikotest-db --command="SELECT * FROM admins LIMIT 5;"
```

### Analytics
- Cloudflare Dashboard → Workers → Analytics
- View requests, errors, CPU time

## Security

1. **JWT_SECRET**: Keep it secret, minimum 32 characters
2. **API Token**: Rotate regularly
3. **Custom Domain**: Always use HTTPS
4. **CORS**: Only allow your frontend domain
5. **Rate Limiting**: Workers have built-in protection

## Next Steps

1. ✅ Deploy Workers
2. ✅ Migrate data (if needed)
3. ✅ Update frontend API URL
4. ✅ Test all endpoints
5. ✅ Set up custom domain (optional)
6. ✅ Configure monitoring
7. ✅ Add admin user with secure password

## Support

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Cloudflare D1**: https://developers.cloudflare.com/d1/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/