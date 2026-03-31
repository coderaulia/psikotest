# MySQL to D1 Migration Guide

## Overview

This guide helps you migrate from Hostinger MySQL to Cloudflare D1.

## Prerequisites

1. Node.js 18+ installed
2. Wrangler CLI: `npm install -g wrangler`
3. Cloudflare account
4. Existing MySQL database on Hostinger

## Step 1: Export MySQL Data

### Option A: Via phpMyAdmin
1. Log in to Hostinger hPanel
2. Go to **Databases** → **phpMyAdmin**
3. Select your database
4. Click **Export** tab
5. Choose **Custom** format
6. Select all tables
7. Check **Add DROP TABLE**
8. Click **Go** to download

### Option B: Via Command Line (if SSH available)
```bash
mysqldump -u username -p database_name > psikotest_backup.sql
```

## Step 2: Create D1 Database

```bash
# Navigate to workers directory
cd workers

# Create the database
wrangler d1 create psikotest-db

# Copy the database_id from output and update wrangler.toml
```

Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "psikotest-db"
database_id = "your-database-id-from-above"
```

## Step 3: Apply Schema

```bash
# Apply the D1 schema
wrangler d1 execute psikotest-db --file=./migrations/001_initial_schema.sql
```

## Step 4: Convert MySQL to SQLite

### Data Type Conversions

| MySQL | SQLite |
|-------|--------|
| `INT` | `INTEGER` |
| `VARCHAR(255)` | `TEXT` |
| `DATETIME` | `DATETIME` |
| `BOOLEAN` | `INTEGER` (0/1) |
| `AUTO_INCREMENT` | `AUTOINCREMENT` |

### Syntax Changes

1. **Remove MySQL-specific:**
   - `ENGINE=InnoDB`
   - `DEFAULT CHARSET=utf8mb4`
   - Backticks around table names (optional in SQLite)

2. **Modify INSERT statements:**
   - Remove multiple row inserts (split into separate statements)
   - Or use: `INSERT INTO table VALUES (...), (...), (...);`

### Automated Conversion Script

```bash
# Install converter
npm install -g mysql-to-sqlite3

# Convert
mysql-to-sqlite3 psikotest_backup.sql psikotest_converted.sql
```

Or use this Node.js script:

```javascript
const fs = require('fs');

const mysqlDump = fs.readFileSync('psikotest_backup.sql', 'utf8');

// Basic conversions
let sqliteDump = mysqlDump
  .replace(/ENGINE=InnoDB[^;]*;/g, ';')
  .replace(/DEFAULT CHARSET=utf8mb4[^;]*;/g, ';')
  .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
  .replace(/int\(\d+\)/g, 'INTEGER')
  .replace(/varchar\(\d+\)/g, 'TEXT')
  .replace(/datetime\(6\)/g, 'DATETIME');

fs.writeFileSync('psikotest_sqlite.sql', sqliteDump);
console.log('Converted to SQLite format');
```

## Step 5: Import Data to D1

```bash
# Split large files if needed
# Then execute
wrangler d1 execute psikotest-db --file=./psikotest_sqlite.sql

# Or import specific tables
wrangler d1 execute psikotest-db --command="INSERT INTO admins ..."
```

## Step 6: Verify Migration

```bash
# Check tables
wrangler d1 execute psikotest-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Count records
wrangler d1 execute psikotest-db --command="SELECT COUNT(*) FROM admins;"
wrangler d1 execute psikotest-db --command="SELECT COUNT(*) FROM customer_accounts;"
```

## Step 7: Deploy Workers

```bash
# Install dependencies
npm install

# Deploy
wrangler deploy
```

## Step 8: Update Frontend

Change your frontend `.env`:
```
VITE_API_BASE_URL=https://psikotest-api.YOUR_SUBDOMAIN.workers.dev/api
```

Or if using custom domain:
```
VITE_API_BASE_URL=https://api.psikotest.vanaila.com/api
```

## Troubleshooting

### "Database not found"
- Verify `database_id` in wrangler.toml
- Run: `wrangler d1 list` to see available databases

### "Syntax error near "
- Check MySQL-specific syntax not converted
- Review data types compatibility

### Data too large
- D1 has 500MB limit per database
- Split into multiple databases if needed

### Foreign key errors
- Ensure tables are created in correct order
- Or disable FK checks: `PRAGMA foreign_keys = OFF;`

## Post-Migration Checklist

- [ ] All tables migrated
- [ ] Indexes recreated
- [ ] Admin user can log in
- [ ] Customer accounts work
- [ ] Test sessions accessible
- [ ] API health check returns 200

## Rollback Plan

If migration fails:
1. Keep MySQL database running
2. Switch frontend back to old API URL
3. Fix issues and retry migration
4. Only delete MySQL after full verification

## Support

- Cloudflare D1 docs: https://developers.cloudflare.com/d1/
- SQLite syntax: https://www.sqlite.org/lang.html
- Workers docs: https://developers.cloudflare.com/workers/